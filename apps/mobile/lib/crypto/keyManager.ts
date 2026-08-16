import nacl from 'tweetnacl';
import * as SecureStore from 'expo-secure-store';
import { generateKeypair, toBase64, fromBase64, type DeviceKeypair } from './deviceKeys';

// Keys used to store each half of the keypair in the secure enclave.
// These are just names/labels — the actual bytes live in the OS keychain.
const SECRET_KEY_STORE_KEY = 'loki.device.secretKey';
const PUBLIC_KEY_STORE_KEY  = 'loki.device.publicKey';

// Returns the device's keypair — loading from secure storage if it already
// exists, or generating and persisting a fresh one on first launch.
// This is the only function most of the app needs to call.
export const getOrCreateDeviceKeypair = async (): Promise<DeviceKeypair> => {
  const storedSecret = await SecureStore.getItemAsync(SECRET_KEY_STORE_KEY);
  const storedPublic = await SecureStore.getItemAsync(PUBLIC_KEY_STORE_KEY);

  // Both halves exist — load and return them
  if (storedSecret && storedPublic) {
    return {
      secretKey: fromBase64(storedSecret),
      publicKey: fromBase64(storedPublic),
    };
  }

  // First launch — generate a new keypair
  const keypair = generateKeypair();

  // Save both halves into the device's secure enclave.
  // On iOS this is the Keychain. On Android this is EncryptedSharedPreferences
  // backed by the Android Keystore. Both are hardware-protected on modern devices.
  await SecureStore.setItemAsync(SECRET_KEY_STORE_KEY, toBase64(keypair.secretKey));
  await SecureStore.setItemAsync(PUBLIC_KEY_STORE_KEY,  toBase64(keypair.publicKey));

  return keypair;
};

// Returns just the public key as a base64 string — safe to share with the server
// and with contacts. The secret key is never returned by any exported function.
export const getPublicKeyBase64 = async (): Promise<string | null> =>
  SecureStore.getItemAsync(PUBLIC_KEY_STORE_KEY);

// ─── Local storage encryption key ────────────────────────────────────────────
// A separate 32-byte symmetric key used to encrypt messages in the local SQLite
// database. Distinct from the identity keypair — rotating your identity key
// should never make your stored messages unreadable.

const STORAGE_ENC_KEY = 'loki.storage.encKey';

// Returns the local storage key, generating and saving it on first call.
export const getOrCreateStorageKey = async (): Promise<Uint8Array> => {
  const stored = await SecureStore.getItemAsync(STORAGE_ENC_KEY);
  if (stored) return fromBase64(stored);

  // nacl.secretbox.keyLength is 32 — the required size for XSalsa20-Poly1305
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  await SecureStore.setItemAsync(STORAGE_ENC_KEY, toBase64(key));
  return key;
};

// ─── Wipe everything ─────────────────────────────────────────────────────────

// Wipes the keypair from secure storage.
// Used during account deletion or factory reset. After calling this,
// the next call to getOrCreateDeviceKeypair() will generate a new identity.
export const deleteDeviceKeypair = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SECRET_KEY_STORE_KEY);
  await SecureStore.deleteItemAsync(PUBLIC_KEY_STORE_KEY);
  await SecureStore.deleteItemAsync(STORAGE_ENC_KEY);
};
