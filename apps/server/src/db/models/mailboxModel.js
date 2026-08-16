import { query } from '../pool.js';

// Creates a mailbox for a newly registered device.
// Called once per device at registration time — every device needs exactly one mailbox.
export const createForDevice = async (deviceId, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  await run(
    `INSERT INTO mailboxes (device_id) VALUES ($1) ON CONFLICT DO NOTHING`,
    [deviceId]
  );
};

// Returns the mailbox row for a given device, or null if none exists.
// Used by the fetch endpoint — the device says "I want my messages" and we
// look up which mailbox is theirs before fetching envelopes from it.
export const findByDeviceId = async (deviceId, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `SELECT id, device_id FROM mailboxes WHERE device_id = $1`,
    [deviceId]
  );
  return result.rows[0] ?? null;
};

// Returns all mailboxes belonging to an account, one per registered device.
// Used by the send endpoint — when Alice sends a message to Bob, we deliver
// a copy to every one of Bob's device mailboxes so all his devices receive it.
export const findByAccountId = async (accountId, client) => {
  const run = client ? (t, p) => client.query(t, p) : query;
  const result = await run(
    `SELECT m.id, m.device_id
     FROM mailboxes m
     JOIN devices d ON d.id = m.device_id
     WHERE d.account_id = $1`,
    [accountId]
  );
  return result.rows;
};
