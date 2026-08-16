import { runMessageTtlJob } from '../jobs/messageTtlJob.js';

// How often the TTL cleanup job runs — once per hour.
const TTL_JOB_INTERVAL_MS = 60 * 60 * 1000;

// Starts all background jobs and returns a function that stops them.
// Call start() once when the server boots. Call the returned stop() during shutdown
// so the interval is cleared and the process can exit cleanly.
export const startJobs = () => {
  // Run once immediately to clear any backlog from downtime
  runMessageTtlJob().catch((err) => {
    console.error('[ttl-job] Initial run failed:', err);
  });

  // Then run again every hour
  const ttlInterval = setInterval(() => {
    runMessageTtlJob().catch((err) => {
      console.error('[ttl-job] Scheduled run failed:', err);
    });
  }, TTL_JOB_INTERVAL_MS);

  // setInterval keeps the Node process alive — unref() lets the process
  // exit normally even if the interval hasn't fired yet (important for clean shutdown).
  ttlInterval.unref();

  return () => clearInterval(ttlInterval);
};
