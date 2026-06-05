import crypto from 'crypto';
import { createSessionRow, findSessionWithAccountAndDevice, deleteSessionRow } from '../db/models/sessionModel.js';

export const createSession = async ({ accountId, deviceId }, client) => {
  const token = crypto.randomBytes(48).toString('hex');
  await createSessionRow({ token, accountId, deviceId }, client);
  return token;
};

export const getSession = async (token) => {
  if (!token) return null;

  const row = await findSessionWithAccountAndDevice(token);
  if (!row) return null;

  // Treat soft-deleted accounts or revoked devices as invalid
  if (row.account_deleted_at || row.device_revoked_at) return null;

  return {
    token: row.token,
    issuedAt: row.issued_at,
    account: {
      id: row.account_id,
      username: row.username
    },
    device: {
      id: row.device_id,
      label: row.device_label
    }
  };
};

export const deleteSession = async (token) => {
  if (!token) return false;
  return deleteSessionRow(token);
};
