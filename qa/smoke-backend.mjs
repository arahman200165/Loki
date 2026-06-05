const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_INTERVAL_MS = 5_000;

const parseArgs = (argv) => {
  const options = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    options[key] = value;
    i += 1;
  }

  return options;
};

const sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const options = parseArgs(process.argv.slice(2));
const baseUrl = options.url || process.env.SMOKE_BASE_URL;
const healthPath = options.path || process.env.SMOKE_HEALTH_PATH || '/api/v1/health';
const timeoutMs = Number(options.timeoutMs || process.env.SMOKE_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
const intervalMs = Number(options.intervalMs || process.env.SMOKE_INTERVAL_MS || DEFAULT_INTERVAL_MS);

if (!baseUrl) {
  console.error('Missing smoke target URL. Set SMOKE_BASE_URL or pass --url.');
  process.exit(1);
}

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error(`Invalid timeout: ${timeoutMs}`);
  process.exit(1);
}

if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
  console.error(`Invalid interval: ${intervalMs}`);
  process.exit(1);
}

const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
const normalizedHealthPath = healthPath.startsWith('/') ? healthPath : `/${healthPath}`;
const targetUrl = `${normalizedBaseUrl}${normalizedHealthPath}`;
const deadline = Date.now() + timeoutMs;

let lastFailure = 'No request attempted yet.';

while (Date.now() < deadline) {
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      lastFailure = `Received ${response.status} from ${targetUrl}`;
    } else if (payload?.database?.status !== 'ok') {
      lastFailure = `Health response did not report database ok: ${JSON.stringify(payload)}`;
    } else {
      console.log(`Smoke check passed for ${targetUrl}`);
      console.log(JSON.stringify(payload, null, 2));
      process.exit(0);
    }
  } catch (error) {
    lastFailure = error instanceof Error ? error.message : String(error);
  }

  console.log(`Smoke check not ready yet for ${targetUrl}: ${lastFailure}`);
  await sleep(intervalMs);
}

console.error(`Smoke check failed for ${targetUrl}: ${lastFailure}`);
process.exit(1);
