import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32
};

// Pre-generated at startup so login always pays an Argon2 verify cost
// even when the username is missing, preventing timing-based enumeration.
let _dummyHash = null;
const getDummyHash = async () => {
  if (!_dummyHash) {
    _dummyHash = await argon2.hash('dummy-password-for-timing', ARGON2_OPTIONS);
  }
  return _dummyHash;
};

export const hashPassword = (password) => argon2.hash(password, ARGON2_OPTIONS);

export const verifyPassword = (hash, password) => argon2.verify(hash, password);

export const verifyDummy = async (password) => {
  const dummyHash = await getDummyHash();
  await argon2.verify(dummyHash, password).catch(() => false);
  return false;
};

// Warm up the dummy hash on module load so the first login isn't slow
getDummyHash().catch(() => {});
