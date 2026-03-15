type JsonWebKeyText = string;

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const utf8ToHex = (text: string) => toHex(new TextEncoder().encode(text));

const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : true;

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

  const subtle = getSubtle();
  if (!subtle) {
    throw new Error(
      "Secure signing is unavailable on this runtime (WebCrypto subtle API missing).",
    );
  }

  const data = new TextEncoder().encode(message);

  if (isEd25519Jwk(privateJwk)) {
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

  if (isP256Jwk(privateJwk)) {
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

