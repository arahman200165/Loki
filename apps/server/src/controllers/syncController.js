import { getUser, listTrustedDevices } from '../services/authDomainService.js';

export const getSyncBootstrap = async (req, res) => {
  const user = await getUser(req.auth.userId);
  if (!user) {
    return res.status(404).json({
      ok: false,
      error: 'USER_NOT_FOUND'
    });
  }

  return res.status(200).json({
    ok: true,
    user: {
      user_id: user.id,
      encrypted_profile_blob: user.encryptedProfileBlob
    },
    devices: await listTrustedDevices(user.id),
    shared_chat_key_jobs: [],
    sync_cursor: `sync_${Date.now()}`
  });
};

export const requestSharedKeys = (req, res) =>
  res.status(200).json({
    ok: true,
    message: 'Shared key request queued.'
  });
