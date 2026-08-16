import nacl from 'tweetnacl';

// A keypair: publicKey is the padlock you share, secretKey is the key you keep.
// Both are Uint8Array — raw bytes, not strings.
export type DeviceKeypair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

// Generates a brand-new X25519 keypair.
// X25519 is the elliptic-curve algorithm used by Signal, WhatsApp, and iMessage
// for key exchange. tweetnacl's box.keyPair() produces exactly this.
export const generateKeypair = (): DeviceKeypair => nacl.box.keyPair();

// Converts raw bytes (Uint8Array) to a base64 string.
// We need this because secure storage and the network both deal in strings, not bytes.
export const toBase64 = (bytes: Uint8Array): string =>
  Buffer.from(bytes).toString('base64');

// Converts a base64 string back to raw bytes.
// Used when loading a stored key back from secure storage.
export const fromBase64 = (b64: string): Uint8Array =>
  new Uint8Array(Buffer.from(b64, 'base64'));
