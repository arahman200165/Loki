import crypto from 'crypto';
import { query } from '../db/pool.js';

const CHALLENGE_TTL_MS = 1000 * 60 * 5;
const LINK_SESSION_TTL_MS = 1000 * 60 * 5;
const RECOVERY_SESSION_TTL_MS = 1000 * 60 * 10;

const now = () => new Date();
const plusMs = (ms) => new Date(Date.now() + ms);
const uuid = () => crypto.randomUUID();
const hash = (value) => crypto.createHash('sha256').update(value ?? '', 'utf8').digest('hex');
const randomBase64 = (size = 24) => crypto.randomBytes(size).toString('base64');
const randomOpaque = (size = 24) => crypto.randomBytes(size).toString('base64url');
const randomCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const utf8ToHex = (value) => Buffer.from(value ?? '', 'utf8').toString('hex');

const parsePublicJwk = (jwkText) => {
  if (typeof jwkText !== 'string' || !jwkText.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(jwkText);
    const isDevInsecure = parsed?.kty === 'oct' && parsed?.alg === 'DEV-INSECURE' && typeof parsed?.k === 'string';
    if (isDevInsecure) {
      return {
        jwk: parsed,
        publicKey: null
      };
    }

    const publicKey = crypto.createPublicKey({ key: parsed, format: 'jwk' });
    return {
      jwk: parsed,
      publicKey
    };
  } catch {
    return null;
  }
};

const verifySignature = ({ publicJwkText, message, signatureHex }) => {
  if (
    typeof publicJwkText !== 'string' ||
    typeof message !== 'string' ||
    typeof signatureHex !== 'string' ||
    !signatureHex
  ) {
    return false;
  }

  const parsedPublic = parsePublicJwk(publicJwkText);
  if (!parsedPublic) {
    return false;
  }

  if (!/^[0-9a-fA-F]+$/.test(signatureHex) || signatureHex.length % 2 !== 0) {
    return false;
  }

  const signatureBuffer = Buffer.from(signatureHex, 'hex');

  const payload = Buffer.from(message, 'utf8');

  const isDevInsecure =
    parsedPublic.jwk?.kty === 'oct' &&
    parsedPublic.jwk?.alg === 'DEV-INSECURE' &&
    typeof parsedPublic.jwk?.k === 'string';
  if (isDevInsecure) {
    const expected = utf8ToHex(`${message}.${parsedPublic.jwk.k}`);
    return expected === signatureHex.toLowerCase();
  }

  const isEd25519 =
    parsedPublic.jwk?.kty === 'OKP' && parsedPublic.jwk?.crv === 'Ed25519';
  if (isEd25519) {
    try {
      return crypto.verify(null, payload, parsedPublic.publicKey, signatureBuffer);
    } catch {
      return false;
    }
  }

  const isP256 = parsedPublic.jwk?.kty === 'EC' && parsedPublic.jwk?.crv === 'P-256';
  if (isP256) {
    try {
      return crypto.verify(
        'sha256',
        payload,
        {
          key: parsedPublic.publicKey,
          dsaEncoding: 'der'
        },
        signatureBuffer
      );
    } catch {
      try {
        return crypto.verify(
          'sha256',
          payload,
          {
            key: parsedPublic.publicKey,
            dsaEncoding: 'ieee-p1363'
          },
          signatureBuffer
        );
      } catch {
        return false;
      }
    }
  }

  return false;
};

const normalizePrekeys = (devicePrekeys) => {
  if (!Array.isArray(devicePrekeys)) {
    return [];
  }

  return devicePrekeys
    .map((item, index) => {
      if (typeof item === 'string') {
        return { keyId: index + 1, publicKey: item };
      }
      if (item && typeof item === 'object' && typeof item.public_key === 'string') {
        return { keyId: Number(item.key_id) || index + 1, publicKey: item.public_key };
      }
      return null;
    })
    .filter(Boolean);
};

const writeDevicePrekeys = async (deviceId, devicePrekeys) => {
  const prekeys = normalizePrekeys(devicePrekeys);
  if (!prekeys.length) {
    return;
  }

  for (const prekey of prekeys) {
    await query(
      `
        insert into device_prekeys (device_id, key_id, public_key)
        values ($1, $2, $3)
        on conflict (device_id, key_id) do nothing
      `,
      [deviceId, prekey.keyId, prekey.publicKey]
    );
  }
};

const createAuthChallenge = async ({ deviceId, challengeType, ttlMs = CHALLENGE_TTL_MS }) => {
  const challengeId = uuid();
  const challenge = randomBase64(24);
  const expiresAt = plusMs(ttlMs);

  await query(
    `
      insert into auth_challenges (id, device_id, challenge_plain, challenge_hash, challenge_type, expires_at)
      values ($1, $2, $3, $4, $5, $6)
    `,
    [challengeId, deviceId, challenge, hash(challenge), challengeType, expiresAt]
  );

  return { challengeId, challenge, expiresAt: expiresAt.toISOString() };
};

const getDeviceById = async (deviceId) => {
  const result = await query('select * from devices where id = $1 limit 1', [deviceId]);
  return result.rows[0] ?? null;
};

export const registerStart = async ({
  userPublicIdentityKey,
  devicePublicIdentityKey,
  recoveryPublicMaterial,
  devicePrekeys,
  platform,
  deviceLabel
}) => {
  if (!parsePublicJwk(userPublicIdentityKey) || !parsePublicJwk(devicePublicIdentityKey)) {
    return {
      ok: false,
      error: 'INVALID_KEY_MATERIAL'
    };
  }

  if (recoveryPublicMaterial && !parsePublicJwk(recoveryPublicMaterial)) {
    return {
      ok: false,
      error: 'INVALID_RECOVERY_MATERIAL'
    };
  }

  const userId = uuid();
  const deviceId = uuid();
  const accountLocator = `acct_${randomOpaque(16)}`;

  await query(
    `
      insert into users (
        id, public_identity_key, recovery_public_material, account_locator, account_status
      )
      values ($1, $2, $3, $4, 'active')
    `,
    [userId, userPublicIdentityKey, recoveryPublicMaterial ?? `rec_${randomOpaque(16)}`, accountLocator]
  );

  await query(
    `
      insert into devices (
        id, user_id, public_identity_key, device_label, platform, trust_status, device_status
      )
      values ($1, $2, $3, $4, $5, 'pending', 'active')
    `,
    [deviceId, userId, devicePublicIdentityKey, deviceLabel ?? 'This device', platform ?? 'unknown']
  );

  await writeDevicePrekeys(deviceId, devicePrekeys);
  const challengeResult = await createAuthChallenge({ deviceId, challengeType: 'register' });

  return {
    ok: true,
    userId,
    deviceId,
    accountLocator,
    challengeId: challengeResult.challengeId,
    challenge: challengeResult.challenge,
    expiresAt: challengeResult.expiresAt
  };
};

export const registerComplete = async ({ userId, deviceId, challengeSignature }) => {
  const device = await getDeviceById(deviceId);
  if (!device || device.user_id !== userId) {
    return { ok: false, error: 'DEVICE_NOT_FOUND' };
  }

  const challengeResult = await query(
    `
      select * from auth_challenges
      where device_id = $1
        and challenge_type = 'register'
        and used_at is null
      order by created_at desc
      limit 1
    `,
    [deviceId]
  );

  const challenge = challengeResult.rows[0];
  if (!challenge) {
    return { ok: false, error: 'INVALID_CHALLENGE' };
  }

  if (new Date(challenge.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: 'CHALLENGE_EXPIRED' };
  }

  const signatureIsValid = verifySignature({
    publicJwkText: device.public_identity_key,
    message: challenge.challenge_plain,
    signatureHex: challengeSignature
  });
  if (!signatureIsValid) {
    return { ok: false, error: 'INVALID_SIGNATURE' };
  }

  await query('update auth_challenges set used_at = now() where id = $1', [challenge.id]);
  await query(
    `
      update devices
      set trust_status = 'trusted', last_active_at = now(), updated_at = now()
      where id = $1
    `,
    [deviceId]
  );

  return { ok: true, userId, deviceId };
};

export const requestLoginChallenge = async ({ deviceId }) => {
  const device = await getDeviceById(deviceId);
  if (!device || device.trust_status !== 'trusted' || device.device_status === 'revoked') {
    return { ok: false, error: 'DEVICE_REVOKED' };
  }

  const challenge = await createAuthChallenge({ deviceId, challengeType: 'login' });
  return {
    ok: true,
    challengeId: challenge.challengeId,
    challenge: challenge.challenge,
    expiresAt: challenge.expiresAt
  };
};

export const loginWithChallenge = async ({ deviceId, challengeId, challengeSignature }) => {
  const device = await getDeviceById(deviceId);
  if (!device || device.trust_status !== 'trusted' || device.device_status === 'revoked') {
    return { ok: false, error: 'DEVICE_REVOKED' };
  }

  const challengeResult = await query('select * from auth_challenges where id = $1 limit 1', [
    challengeId
  ]);
  const challenge = challengeResult.rows[0];
  if (!challenge || challenge.device_id !== deviceId || challenge.challenge_type !== 'login') {
    return { ok: false, error: 'INVALID_CHALLENGE' };
  }

  if (challenge.used_at || new Date(challenge.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: 'CHALLENGE_EXPIRED' };
  }

  const signatureIsValid = verifySignature({
    publicJwkText: device.public_identity_key,
    message: challenge.challenge_plain,
    signatureHex: challengeSignature
  });
  if (!signatureIsValid) {
    return { ok: false, error: 'INVALID_SIGNATURE' };
  }

  await query('update auth_challenges set used_at = now() where id = $1', [challengeId]);
  await query('update devices set last_active_at = now(), updated_at = now() where id = $1', [deviceId]);

  return { ok: true, userId: device.user_id, deviceId };
};

export const startDeviceLink = async ({
  newDevicePublicIdentityKey,
  newDevicePrekeys,
  platform,
  deviceLabel
}) => {
  if (!parsePublicJwk(newDevicePublicIdentityKey)) {
    return { ok: false, error: 'INVALID_KEY_MATERIAL' };
  }

  const pendingDeviceId = uuid();
  await query(
    `
      insert into devices (
        id, user_id, public_identity_key, device_label, platform, trust_status, device_status
      )
      values ($1, null, $2, $3, $4, 'pending', 'active')
    `,
    [pendingDeviceId, newDevicePublicIdentityKey, deviceLabel ?? 'New device', platform ?? 'unknown']
  );

  await writeDevicePrekeys(pendingDeviceId, newDevicePrekeys);

  const linkSessionId = uuid();
  const manualCode = randomCode();
  const qrPayload = randomOpaque(24);
  const expiresAt = plusMs(LINK_SESSION_TTL_MS);

  await query(
    `
      insert into device_link_sessions (
        id, pending_device_id, requesting_user_id, manual_code_hash, qr_payload_hash,
        status, encrypted_bootstrap_bundle, approved_by_device_id, expires_at
      )
      values ($1, $2, null, $3, $4, 'pending', null, null, $5)
    `,
    [linkSessionId, pendingDeviceId, hash(manualCode), hash(qrPayload), expiresAt]
  );

  return {
    ok: true,
    linkSessionId,
    qrPayload,
    manualCode,
    expiresAt: expiresAt.toISOString()
  };
};

export const resolveDeviceLink = async ({ manualCode, qrPayload, requesterUserId }) => {
  const lookupHash = manualCode ? hash(manualCode) : hash(qrPayload);
  const field = manualCode ? 'manual_code_hash' : 'qr_payload_hash';

  const result = await query(
    `
      select * from device_link_sessions
      where ${field} = $1
      order by created_at desc
      limit 1
    `,
    [lookupHash]
  );
  const session = result.rows[0];
  if (!session) {
    return { ok: false, error: 'LINK_NOT_FOUND' };
  }

  if (session.status !== 'pending') {
    return { ok: false, error: 'LINK_INVALID' };
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await query(`update device_link_sessions set status = 'expired' where id = $1`, [session.id]);
    return { ok: false, error: 'LINK_INVALID' };
  }

  if (session.requesting_user_id && session.requesting_user_id !== requesterUserId) {
    return { ok: false, error: 'LINK_USER_MISMATCH' };
  }

  await query(
    `
      update device_link_sessions
      set requesting_user_id = $1, resolved_at = now()
      where id = $2
    `,
    [requesterUserId, session.id]
  );

  const pendingDevice = await getDeviceById(session.pending_device_id);
  return {
    ok: true,
    linkSessionId: session.id,
    pendingDevice: {
      device_label: pendingDevice?.device_label ?? 'Unknown device',
      platform: pendingDevice?.platform ?? 'unknown'
    }
  };
};

export const approveDeviceLink = async ({
  linkSessionId,
  requesterUserId,
  requesterDeviceId,
  encryptedBootstrapBundle
}) => {
  const result = await query('select * from device_link_sessions where id = $1 limit 1', [
    linkSessionId
  ]);
  const session = result.rows[0];
  if (!session || session.status !== 'pending') {
    return { ok: false, error: 'LINK_INVALID' };
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await query(`update device_link_sessions set status = 'expired' where id = $1`, [session.id]);
    return { ok: false, error: 'LINK_INVALID' };
  }

  if (session.requesting_user_id && session.requesting_user_id !== requesterUserId) {
    return { ok: false, error: 'LINK_USER_MISMATCH' };
  }

  await query(
    `
      update devices
      set user_id = $1, updated_at = now()
      where id = $2
    `,
    [requesterUserId, session.pending_device_id]
  );

  await query(
    `
      update device_link_sessions
      set status = 'approved',
          requesting_user_id = $1,
          approved_by_device_id = $2,
          encrypted_bootstrap_bundle = $3,
          resolved_at = now()
      where id = $4
    `,
    [requesterUserId, requesterDeviceId, encryptedBootstrapBundle ?? null, linkSessionId]
  );

  return { ok: true };
};

export const denyDeviceLink = async ({ linkSessionId, requesterUserId }) => {
  const result = await query('select * from device_link_sessions where id = $1 limit 1', [
    linkSessionId
  ]);
  const session = result.rows[0];
  if (!session) {
    return { ok: false, error: 'LINK_INVALID' };
  }

  if (session.requesting_user_id && session.requesting_user_id !== requesterUserId) {
    return { ok: false, error: 'LINK_USER_MISMATCH' };
  }

  await query(
    `
      update device_link_sessions
      set status = 'denied', requesting_user_id = $1, resolved_at = now()
      where id = $2
    `,
    [requesterUserId, linkSessionId]
  );

  return { ok: true };
};

export const getDeviceLinkStatus = async ({ linkSessionId }) => {
  const result = await query('select * from device_link_sessions where id = $1 limit 1', [
    linkSessionId
  ]);
  const session = result.rows[0];
  if (!session) {
    return { ok: false, error: 'LINK_NOT_FOUND' };
  }

  let status = session.status;
  if (status === 'pending' && new Date(session.expires_at).getTime() <= Date.now()) {
    await query(`update device_link_sessions set status = 'expired' where id = $1`, [linkSessionId]);
    status = 'expired';
  }

  return {
    ok: true,
    status,
    encryptedBootstrapBundle: status === 'approved' ? session.encrypted_bootstrap_bundle : undefined
  };
};

export const completeDeviceLink = async ({ linkSessionId }) => {
  const result = await query('select * from device_link_sessions where id = $1 limit 1', [
    linkSessionId
  ]);
  const session = result.rows[0];
  if (!session || session.status !== 'approved') {
    return { ok: false, error: 'LINK_INVALID' };
  }

  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await query(`update device_link_sessions set status = 'expired' where id = $1`, [linkSessionId]);
    return { ok: false, error: 'LINK_INVALID' };
  }

  const pendingDevice = await getDeviceById(session.pending_device_id);
  if (!pendingDevice || !pendingDevice.user_id) {
    return { ok: false, error: 'DEVICE_NOT_FOUND' };
  }

  await query(
    `
      update devices
      set trust_status = 'trusted', last_active_at = now(), updated_at = now()
      where id = $1
    `,
    [pendingDevice.id]
  );

  await query(
    `
      update device_link_sessions
      set status = 'completed', completed_at = now()
      where id = $1
    `,
    [linkSessionId]
  );

  return {
    ok: true,
    userId: pendingDevice.user_id,
    deviceId: pendingDevice.id
  };
};

export const startRecovery = async ({
  accountLocator,
  newDevicePublicIdentityKey,
  newDevicePrekeys,
  platform,
  deviceLabel
}) => {
  const userResult = await query('select * from users where account_locator = $1 limit 1', [
    accountLocator
  ]);
  const user = userResult.rows[0];
  if (!user) {
    return { ok: false, error: 'ACCOUNT_NOT_FOUND' };
  }

  if (!parsePublicJwk(newDevicePublicIdentityKey)) {
    return { ok: false, error: 'INVALID_KEY_MATERIAL' };
  }

  const pendingDeviceId = uuid();
  await query(
    `
      insert into devices (
        id, user_id, public_identity_key, device_label, platform, trust_status, device_status
      )
      values ($1, $2, $3, $4, $5, 'pending', 'active')
    `,
    [
      pendingDeviceId,
      user.id,
      newDevicePublicIdentityKey,
      deviceLabel ?? 'Recovered device',
      platform ?? 'unknown'
    ]
  );
  await writeDevicePrekeys(pendingDeviceId, newDevicePrekeys);

  const recoverySessionId = uuid();
  const recoveryChallenge = randomBase64(24);
  const expiresAt = plusMs(RECOVERY_SESSION_TTL_MS);

  await query(
    `
      insert into recovery_sessions (
        id, user_id, pending_device_id, recovery_challenge_plain, recovery_challenge_hash,
        status, expires_at
      )
      values ($1, $2, $3, $4, $5, 'pending', $6)
    `,
    [recoverySessionId, user.id, pendingDeviceId, recoveryChallenge, hash(recoveryChallenge), expiresAt]
  );

  return {
    ok: true,
    recoverySessionId,
    recoveryChallenge,
    expiresAt: expiresAt.toISOString()
  };
};

export const completeRecovery = async ({ recoverySessionId, recoveryProof }) => {
  const result = await query('select * from recovery_sessions where id = $1 limit 1', [
    recoverySessionId
  ]);
  const recoverySession = result.rows[0];
  if (!recoverySession || recoverySession.status !== 'pending') {
    return { ok: false, error: 'RECOVERY_INVALID' };
  }

  if (new Date(recoverySession.expires_at).getTime() <= Date.now()) {
    await query(`update recovery_sessions set status = 'expired' where id = $1`, [recoverySessionId]);
    return { ok: false, error: 'RECOVERY_EXPIRED' };
  }

  const userResult = await query('select * from users where id = $1 limit 1', [recoverySession.user_id]);
  const user = userResult.rows[0];
  if (!user) {
    return { ok: false, error: 'RECOVERY_INVALID' };
  }

  const signatureIsValid = verifySignature({
    publicJwkText: user.recovery_public_material,
    message: recoverySession.recovery_challenge_plain,
    signatureHex: recoveryProof
  });
  if (!signatureIsValid) {
    return { ok: false, error: 'RECOVERY_PROOF_INVALID' };
  }

  await query(
    `
      update devices
      set trust_status = 'trusted', last_active_at = now(), updated_at = now()
      where id = $1
    `,
    [recoverySession.pending_device_id]
  );
  await query(
    `
      update recovery_sessions
      set status = 'completed', completed_at = now()
      where id = $1
    `,
    [recoverySessionId]
  );

  return {
    ok: true,
    userId: recoverySession.user_id,
    deviceId: recoverySession.pending_device_id,
    encryptedBootstrapBundle: randomOpaque(24)
  };
};

export const getUser = async (userId) => {
  const result = await query('select * from users where id = $1 limit 1', [userId]);
  return result.rows[0] ?? null;
};

export const updateUserProfile = async ({ userId, encryptedProfileBlob, displayName }) => {
  const result = await query(
    `
      update users
      set encrypted_profile_blob = coalesce($2, encrypted_profile_blob),
          display_name = coalesce($3, display_name),
          updated_at = now()
      where id = $1
      returning *
    `,
    [userId, encryptedProfileBlob ?? null, displayName ?? null]
  );
  return result.rows[0] ?? null;
};

export const getOrCreateContactCode = async (userId) => {
  const existing = await query('select contact_code from user_contact_codes where user_id = $1', [userId]);
  if (existing.rows[0]?.contact_code) {
    return existing.rows[0].contact_code;
  }

  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const chunk = () =>
    Array.from({ length: 4 }, () => letters[crypto.randomInt(0, letters.length)]).join('');
  const contactCode = `loki:${chunk()}-${chunk()}-${chunk()}`;

  await query(
    `
      insert into user_contact_codes (user_id, contact_code)
      values ($1, $2)
      on conflict (user_id) do update set contact_code = excluded.contact_code
    `,
    [userId, contactCode]
  );

  return contactCode;
};

const toCoarseLastActive = (timestamp) => {
  if (!timestamp) {
    return 'active_this_week';
  }

  const diffMs = Math.max(0, now().getTime() - new Date(timestamp).getTime());
  const dayMs = 1000 * 60 * 60 * 24;
  if (diffMs < 1000 * 60 * 60) {
    return 'active_now';
  }
  if (diffMs < dayMs) {
    return 'active_today';
  }
  if (diffMs < dayMs * 7) {
    return 'active_this_week';
  }
  return 'active_older';
};

export const listTrustedDevices = async (userId) => {
  const result = await query(
    `
      select *
      from devices
      where user_id = $1
        and trust_status = 'trusted'
        and device_status != 'revoked'
      order by created_at asc
    `,
    [userId]
  );

  return result.rows.map((device) => ({
    device_id: device.id,
    device_label: device.device_label,
    platform: device.platform,
    status: device.trust_status,
    last_active_coarse: toCoarseLastActive(device.last_active_at),
    created_at: device.created_at
  }));
};

export const revokeDevice = async ({ userId, deviceId }) => {
  const result = await query(
    `
      update devices
      set trust_status = 'revoked',
          device_status = 'revoked',
          revoked_at = now(),
          updated_at = now()
      where id = $1 and user_id = $2
      returning id
    `,
    [deviceId, userId]
  );

  if (!result.rows[0]) {
    return { ok: false, error: 'DEVICE_NOT_FOUND' };
  }

  return { ok: true };
};

export const touchDeviceSecurityState = async ({ userId, deviceId, localLockEnabled, lockMode }) => {
  const result = await query(
    `
      update devices
      set local_lock_enabled = $3,
          lock_mode = $4,
          updated_at = now()
      where id = $1 and user_id = $2
      returning id
    `,
    [deviceId, userId, Boolean(localLockEnabled), typeof lockMode === 'string' ? lockMode : 'none']
  );

  if (!result.rows[0]) {
    return { ok: false, error: 'DEVICE_NOT_FOUND' };
  }

  return { ok: true };
};
