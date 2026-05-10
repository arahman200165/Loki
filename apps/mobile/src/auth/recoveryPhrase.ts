import * as ExpoCrypto from "expo-crypto";
import { entropyToMnemonic, mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist as englishWordlist } from "@scure/bip39/wordlists/english.js";
import { getPublicKey, hashes as ed25519Hashes } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha2.js";
import type { SigningKeyPair } from "./crypto";

const RECOVERY_PHRASE_STRENGTH = 128;
const DERIVATION_DOMAIN = "loki-recovery-ed25519-v1";

if (!ed25519Hashes.sha512) {
  ed25519Hashes.sha512 = sha512;
}

const BASE64_URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

const toBase64Url = (bytes: Uint8Array) => {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const remaining = bytes.length - index;
    const a = bytes[index];
    const b = remaining > 1 ? bytes[index + 1] : 0;
    const c = remaining > 2 ? bytes[index + 2] : 0;
    const chunk = (a << 16) | (b << 8) | c;

    output += BASE64_URL_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_URL_ALPHABET[(chunk >> 12) & 63];
    if (remaining > 1) {
      output += BASE64_URL_ALPHABET[(chunk >> 6) & 63];
    }
    if (remaining > 2) {
      output += BASE64_URL_ALPHABET[chunk & 63];
    }
  }

  return output;
};

const concatBytes = (left: Uint8Array, right: Uint8Array) => {
  const output = new Uint8Array(left.length + right.length);
  output.set(left, 0);
  output.set(right, left.length);
  return output;
};

export const normalizeRecoveryPhraseWords = (words: string[]) =>
  words.map((word) => word.trim().toLowerCase()).filter(Boolean);

export const parseRecoveryPhraseInput = (text: string) =>
  normalizeRecoveryPhraseWords(text.split(/\s+/g));

export const generateRecoveryPhrase = (): string[] => {
  const entropyBytes = ExpoCrypto.getRandomBytes(RECOVERY_PHRASE_STRENGTH / 8);
  const mnemonic = entropyToMnemonic(entropyBytes, englishWordlist);
  return mnemonic.split(" ");
};

export const isValidRecoveryPhrase = (words: string[]) => {
  const normalized = normalizeRecoveryPhraseWords(words);
  if (normalized.length !== 12) {
    return false;
  }

  return validateMnemonic(normalized.join(" "), englishWordlist);
};

export const deriveRecoveryKeyPairFromPhrase = (words: string[]): SigningKeyPair => {
  const normalized = normalizeRecoveryPhraseWords(words);
  if (!isValidRecoveryPhrase(normalized)) {
    throw new Error("Recovery phrase is invalid.");
  }

  const phraseText = normalized.join(" ");
  const seed = mnemonicToSeedSync(phraseText);
  const material = concatBytes(new TextEncoder().encode(DERIVATION_DOMAIN), seed);
  const digest = sha512(material);
  const privateSeed = digest.slice(0, 32);
  const publicKey = getPublicKey(privateSeed);

  const privateJwk = {
    kty: "OKP",
    crv: "Ed25519",
    d: toBase64Url(privateSeed),
    x: toBase64Url(publicKey),
  };

  const publicJwk = {
    kty: "OKP",
    crv: "Ed25519",
    x: toBase64Url(publicKey),
  };

  return {
    privateJwk: JSON.stringify(privateJwk),
    publicJwk: JSON.stringify(publicJwk),
    algorithm: "Ed25519",
  };
};

export const RECOVERY_PHRASE_WORDS: string[] = englishWordlist;
