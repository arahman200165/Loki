import {
  approveDeviceLink,
  completeDeviceLink,
  denyDeviceLink,
  getDeviceLinkStatus,
  listTrustedDevices,
  resolveDeviceLink,
  revokeDevice,
  startDeviceLink,
  touchDeviceSecurityState
} from '../services/authDomainService.js';
import { createApiSession, revokeApiSessionsByDeviceId } from '../services/sessionStore.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 2;

const mapErrorToStatus = (error) => {
  switch (error) {
    case 'INVALID_KEY_MATERIAL':
      return 422;
    case 'LINK_NOT_FOUND':
    case 'DEVICE_NOT_FOUND':
      return 404;
    case 'LINK_USER_MISMATCH':
      return 403;
    case 'LINK_INVALID':
      return 400;
    default:
      return 400;
  }
};

export const listDevices = async (req, res) =>
  res.status(200).json({
    ok: true,
    devices: await listTrustedDevices(req.auth.userId)
  });

export const revokeDeviceById = async (req, res) => {
  const result = await revokeDevice({
    userId: req.auth.userId,
    deviceId: req.params.deviceId
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  await revokeApiSessionsByDeviceId(req.params.deviceId);

  return res.status(200).json({
    ok: true
  });
};

export const startLinkSession = async (req, res) => {
  const {
    new_device_public_identity_key: newDevicePublicIdentityKey,
    new_device_prekeys: newDevicePrekeys,
    platform,
    device_label: deviceLabel
  } = req.body ?? {};

  if (!newDevicePublicIdentityKey) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await startDeviceLink({
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
    link_session_id: result.linkSessionId,
    qr_payload: result.qrPayload,
    manual_code: result.manualCode,
    expires_at: result.expiresAt
  });
};

export const resolveLinkSession = async (req, res) => {
  const { manual_code: manualCode, qr_payload: qrPayload } = req.body ?? {};

  if (!manualCode && !qrPayload) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await resolveDeviceLink({
    manualCode,
    qrPayload,
    requesterUserId: req.auth.userId
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({
    ok: true,
    link_session_id: result.linkSessionId,
    pending_device: result.pendingDevice
  });
};

export const approveLinkSession = async (req, res) => {
  const {
    link_session_id: linkSessionId,
    encrypted_bootstrap_bundle: encryptedBootstrapBundle
  } = req.body ?? {};

  if (!linkSessionId) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await approveDeviceLink({
    linkSessionId,
    requesterUserId: req.auth.userId,
    requesterDeviceId: req.auth.deviceId,
    encryptedBootstrapBundle
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({ ok: true });
};

export const denyLinkSession = async (req, res) => {
  const { link_session_id: linkSessionId } = req.body ?? {};
  if (!linkSessionId) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await denyDeviceLink({
    linkSessionId,
    requesterUserId: req.auth.userId
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({ ok: true });
};

export const getLinkStatus = async (req, res) => {
  const result = await getDeviceLinkStatus({
    linkSessionId: req.query.link_session_id
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({
    ok: true,
    status: result.status,
    encrypted_bootstrap_bundle: result.encryptedBootstrapBundle
  });
};

export const completeLinkSession = async (req, res) => {
  const { link_session_id: linkSessionId } = req.body ?? {};
  if (!linkSessionId) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const result = await completeDeviceLink({
    linkSessionId
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
    expires_at: session.expiresAt
  });
};

export const updateDeviceSecurityState = async (req, res) => {
  const result = await touchDeviceSecurityState({
    userId: req.auth.userId,
    deviceId: req.params.deviceId,
    localLockEnabled: req.body?.local_lock_enabled,
    lockMode: req.body?.lock_mode
  });

  if (!result.ok) {
    return res.status(mapErrorToStatus(result.error)).json({
      ok: false,
      error: result.error
    });
  }

  return res.status(200).json({ ok: true });
};
