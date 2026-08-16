import { deleteExpired } from '../db/models/envelopeModel.js';

// Deletes every message envelope whose expiry time has passed.
// Called on a recurring schedule by jobScheduler.js.
// This enforces Loki's short-retention guarantee — messages do not live
// on the server longer than the sender requested (24–72h).
export const runMessageTtlJob = async () => {
  const deleted = await deleteExpired();
  if (deleted > 0) {
    console.log(`[ttl-job] Deleted ${deleted} expired envelope(s).`);
  }
};
