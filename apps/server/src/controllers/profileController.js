import {
  getOrCreateContactCode,
  getUser,
  updateUserProfile
} from '../services/authDomainService.js';

export const updateProfile = async (req, res) => {
  const {
    encrypted_profile_blob: encryptedProfileBlob,
    display_name: displayName
  } = req.body ?? {};

  if (typeof encryptedProfileBlob !== 'string' && typeof displayName !== 'string') {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_REQUEST'
    });
  }

  const next = await updateUserProfile({
    userId: req.auth.userId,
    encryptedProfileBlob,
    displayName
  });

  if (!next) {
    return res.status(404).json({
      ok: false,
      error: 'USER_NOT_FOUND'
    });
  }

  return res.status(200).json({ ok: true });
};

export const getContactCode = async (req, res) => {
  const user = await getUser(req.auth.userId);
  if (!user) {
    return res.status(404).json({
      ok: false,
      error: 'USER_NOT_FOUND'
    });
  }

    return res.status(200).json({
      ok: true,
      contact_code: await getOrCreateContactCode(user.id)
    });
};
