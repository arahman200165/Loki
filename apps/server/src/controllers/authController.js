import {
  completeRecovery,
  loginWithChallenge,
  registerComplete,
  registerStart,
  requestLoginChallenge,
  startRecovery
} from '../services/authDomainService.js';
import {
  createApiSession,
  deleteApiSession
} from '../services/sessionStore.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 2;

const mapErrorToStatus = (error) => {
  switch (error) {
    case 'INVALID_KEY_MATERIAL':
    case 'INVALID_RECOVERY_MATERIAL':
      return 422;
    case 'DEVICE_REVOKED':
    case 'INVALID_SIGNATURE':
    case 'RECOVERY_PROOF_INVALID':
      return 401;
    case 'CHALLENGE_EXPIRED':
    case 'RECOVERY_EXPIRED':
      return 410;
    case 'DEVICE_NOT_FOUND':
    case 'INVALID_CHALLENGE':
    case 'LINK_NOT_FOUND':
    case 'ACCOUNT_NOT_FOUND':
      return 404;
    case 'RECOVERY_INVALID':
    case 'LINK_INVALID':
    case 'LINK_USER_MISMATCH':
      return 400;
    default:
      return 400;
  }
};

export const registerAccountStart = async (req, res) => {
  const {
    user_public_identity_key: userPublicIdentityKey,
    device_public_identity_key: devicePublicIdentityKey,
    recovery_public_material: recoveryPublicMaterial,
    device_prekeys: devicePrekeys,
    platform,
    device_label: deviceLabel
  } = req.body ?? {};

  if (!userPublicIdentityKey || !devicePublicIdentityKey) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_KEY_MATERIAL'
    });
  }

  const result = await registerStart({
    userPublicIdentityKey,
    devicePublicIdentityKey,
    recoveryPublicMaterial,
    devicePrekeys,
    platform,
    deviceLabel
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(201).json({
    ok: true,
    user_id: result.userId,
    device_id: result.deviceId,
    account_locator: result.accountLocator,
    registration_challenge: result.challenge,
    challenge_expires_at: result.expiresAt,
    challenge_id: result.challengeId
  });
};

export const registerAccountComplete = async (req, res) => {
  const {
    user_id: userId,
    device_id: deviceId,
    challenge_signature: challengeSignature
  } = req.body ?? {};

  if (!userId || !deviceId || !challengeSignature) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await registerComplete({
    userId,
    deviceId,
    challengeSignature
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  const session = await createApiSession({
    userId: result.userId,
    deviceId: result.deviceId,
    ttlMs: SESSION_TTL_MS
  });

  return res.status(200).json({
    ok: true,
    session_token: session.token,
    expires_at: session.expiresAt,
    user_id: result.userId,
    device_id: result.deviceId
  });
};

export const requestDeviceChallenge = async (req, res) => {
  const { device_id: deviceId } = req.body ?? {};
  if (!deviceId) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await requestLoginChallenge({ deviceId });
  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({
    ok: true,
    challenge_id: result.challengeId,
    challenge: result.challenge,
    expires_at: result.expiresAt
  });
};

export const loginWithDeviceChallenge = async (req, res) => {
  const {
    device_id: deviceId,
    challenge_id: challengeId,
    challenge_signature: challengeSignature
  } = req.body ?? {};

  if (!deviceId || !challengeId || !challengeSignature) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await loginWithChallenge({
    deviceId,
    challengeId,
    challengeSignature
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  const session = await createApiSession({
    userId: result.userId,
    deviceId: result.deviceId,
    ttlMs: SESSION_TTL_MS
  });

  return res.status(200).json({
    ok: true,
    session_token: session.token,
    expires_at: session.expiresAt,
    user_id: result.userId,
    device_status: 'trusted'
  });
};

export const startRecoveryFlow = async (req, res) => {
  const {
    account_locator: accountLocator,
    new_device_public_identity_key: newDevicePublicIdentityKey,
    new_device_prekeys: newDevicePrekeys,
    platform,
    device_label: deviceLabel
  } = req.body ?? {};

  if (!accountLocator || !newDevicePublicIdentityKey) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await startRecovery({
    accountLocator,
    newDevicePublicIdentityKey,
    newDevicePrekeys,
    platform,
    deviceLabel
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({
    ok: true,
    recovery_session_id: result.recoverySessionId,
    recovery_challenge: result.recoveryChallenge,
    expires_at: result.expiresAt
  });
};

export const completeRecoveryFlow = async (req, res) => {
  const {
    recovery_session_id: recoverySessionId,
    recovery_proof: recoveryProof
  } = req.body ?? {};

  if (!recoverySessionId || !recoveryProof) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await completeRecovery({
    recoverySessionId,
    recoveryProof
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  const session = await createApiSession({
    userId: result.userId,
    deviceId: result.deviceId,
    ttlMs: SESSION_TTL_MS
  });

  return res.status(200).json({
    ok: true,
    user_id: result.userId,
    device_id: result.deviceId,
    session_token: session.token,
    expires_at: session.expiresAt,
    encrypted_bootstrap_bundle: result.encryptedBootstrapBundle
  });
};

export const logout = async (req, res) => {
  const wasDeleted = await deleteApiSession(req.auth?.token);

  return res.status(200).json({
    ok: true,
    message: wasDeleted ? 'Logout successful.' : 'Session already cleared.'
  });
};
