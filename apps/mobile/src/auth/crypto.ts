import { hashes as ed25519Hashes, sign as ed25519Sign } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";

type JsonWebKeyText = string;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const utf8ToHex = (text: string) => toHex(new TextEncoder().encode(text));
const BASE64_LOOKUP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const base64UrlToBytes = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const base64 = normalized + padding;

  const output: number[] = [];
  for (let index = 0; index < base64.length; index += 4) {
    const c1 = base64[index];
    const c2 = base64[index + 1];
    const c3 = base64[index + 2];
    const c4 = base64[index + 3];

    const v1 = BASE64_LOOKUP.indexOf(c1);
    const v2 = BASE64_LOOKUP.indexOf(c2);
    const v3 = c3 === "=" ? 0 : BASE64_LOOKUP.indexOf(c3);
    const v4 = c4 === "=" ? 0 : BASE64_LOOKUP.indexOf(c4);

    if (v1 < 0 || v2 < 0 || (c3 !== "=" && v3 < 0) || (c4 !== "=" && v4 < 0)) {
      throw new Error("Invalid base64url value.");
    }

    const chunk = (v1 << 18) | (v2 << 12) | (v3 << 6) | v4;
    output.push((chunk >> 16) & 0xff);
    if (c3 !== "=") {
      output.push((chunk >> 8) & 0xff);
    }
    if (c4 !== "=") {
      output.push(chunk & 0xff);
    }
  }

  return new Uint8Array(output);
};

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : true;

if (!ed25519Hashes.sha512) {
  ed25519Hashes.sha512 = sha512;
}

const getSubtle = (): SubtleCrypto | null => {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  return cryptoApi?.subtle ?? null;
};

const makeDevSecret = () => {
  const chunk = () => Math.random().toString(36).slice(2, 10);
  return `${chunk()}${chunk()}${Date.now().toString(36)}`;
};

const makeDevInsecureKeyPair = () => {
  const secret = makeDevSecret();
  const devJwk = {
    kty: "oct",
    alg: "DEV-INSECURE",
    k: secret,
  };

  return {
    privateJwk: JSON.stringify(devJwk),
    publicJwk: JSON.stringify(devJwk),
    algorithm: "DEV-INSECURE" as const,
  };
};

const isEd25519Jwk = (jwk: JsonWebKey) => jwk.kty === "OKP" && jwk.crv === "Ed25519";
const isP256Jwk = (jwk: JsonWebKey) => jwk.kty === "EC" && jwk.crv === "P-256";
const isDevInsecureJwk = (jwk: JsonWebKey) =>
  (jwk as JsonWebKey & { alg?: string; k?: string }).alg === "DEV-INSECURE" &&
  typeof (jwk as JsonWebKey & { k?: string }).k === "string";

export type SigningKeyPair = {
  privateJwk: JsonWebKeyText;
  publicJwk: JsonWebKeyText;
  algorithm: "Ed25519" | "P-256" | "DEV-INSECURE";
};

const generateWithEd25519 = async (subtle: SubtleCrypto): Promise<SigningKeyPair> => {
  const keyPair = await subtle.generateKey(
    {
      name: "Ed25519",
    },
    true,
    ["sign", "verify"],
  );

  const privateJwk = await subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await subtle.exportKey("jwk", keyPair.publicKey);

  return {
    privateJwk: JSON.stringify(privateJwk),
    publicJwk: JSON.stringify(publicJwk),
    algorithm: "Ed25519",
  };
};

const generateWithP256 = async (subtle: SubtleCrypto): Promise<SigningKeyPair> => {
  const keyPair = await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );

  const privateJwk = await subtle.exportKey("jwk", keyPair.privateKey);
  const publicJwk = await subtle.exportKey("jwk", keyPair.publicKey);

  return {
    privateJwk: JSON.stringify(privateJwk),
    publicJwk: JSON.stringify(publicJwk),
    algorithm: "P-256",
  };
};

export const generateEd25519KeyPair = async (): Promise<SigningKeyPair> => {
  const subtle = getSubtle();

  if (!subtle) {
    if (isDev) {
      console.warn(
        "[crypto] WebCrypto subtle missing. Falling back to DEV-INSECURE key mode for local testing only.",
      );
      return makeDevInsecureKeyPair();
    }

    throw new Error(
      "Secure key generation is unavailable on this runtime (WebCrypto subtle API missing). " +
        "Use a development build with WebCrypto support.",
    );
  }

  try {
    return await generateWithEd25519(subtle);
  } catch (primaryError) {
    try {
      return await generateWithP256(subtle);
    } catch {
      if (isDev) {
        console.warn(
          "[crypto] Ed25519 and P-256 unavailable. Falling back to DEV-INSECURE key mode for local testing only.",
        );
        return makeDevInsecureKeyPair();
      }

      const primaryMessage =
        primaryError instanceof Error ? primaryError.message : "Unknown keygen error.";
      throw new Error(
        "Secure key generation failed for both Ed25519 and P-256. " +
          `Primary failure: ${primaryMessage}`,
      );
    }
  }
};

export const signUtf8WithPrivateJwk = async (
  privateJwkText: JsonWebKeyText,
  message: string,
): Promise<string> => {
  let privateJwk: JsonWebKey;
  try {
    privateJwk = JSON.parse(privateJwkText) as JsonWebKey;
  } catch {
    throw new Error("Private key format is invalid.");
  }

  if (isDevInsecureJwk(privateJwk)) {
    const secret = (privateJwk as JsonWebKey & { k: string }).k;
    return utf8ToHex(`${message}.${secret}`);
  }

  const data = new TextEncoder().encode(message);

  if (isEd25519Jwk(privateJwk)) {
    const subtle = getSubtle();
    if (subtle) {
      const privateKey = await subtle.importKey(
        "jwk",
        privateJwk,
        {
          name: "Ed25519",
        },
        false,
        ["sign"],
      );

      const signatureBuffer = await subtle.sign(
        {
          name: "Ed25519",
        },
        privateKey,
        data,
      );

      return toHex(new Uint8Array(signatureBuffer));
    }

    const privateSeed = typeof privateJwk.d === "string" ? base64UrlToBytes(privateJwk.d) : null;
    if (!privateSeed || privateSeed.length !== 32) {
      throw new Error("Secure signing is unavailable on this runtime (invalid Ed25519 private key).");
    }

    const signature = ed25519Sign(data, privateSeed);
    return toHex(signature);
  }

  if (isP256Jwk(privateJwk)) {
    const subtle = getSubtle();
    if (!subtle) {
      throw new Error(
        "Secure signing is unavailable on this runtime (WebCrypto subtle API missing).",
      );
    }

    const privateKey = await subtle.importKey(
      "jwk",
      privateJwk,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"],
    );

    const signatureBuffer = await subtle.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      privateKey,
      data,
    );

    return toHex(new Uint8Array(signatureBuffer));
  }

  throw new Error("Unsupported private key type for signing.");
};
