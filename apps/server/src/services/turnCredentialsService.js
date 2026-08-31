import { env } from '../config/env.js';

// ADR-007: Metered.ca is TURN-only (no forced SFU) and issues short-lived
// credentials over a simple REST call. The API key stays server-side —
// mobile only ever sees the resulting ephemeral ICE server list, never the
// key itself.
const FALLBACK_ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

let cache = { iceServers: null, expiresAt: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // Metered credentials are valid ~24h; refresh hourly to be safe

export const getIceServers = async () => {
  if (!env.meteredAppName || !env.meteredApiKey) {
    // Local dev without Metered configured: STUN-only, direct P2P works on
    // most networks but NAT-blocked pairs will fail to connect.
    return FALLBACK_ICE_SERVERS;
  }

  if (cache.iceServers && cache.expiresAt > Date.now()) {
    return cache.iceServers;
  }

  const url = `https://${env.meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${env.meteredApiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    return FALLBACK_ICE_SERVERS;
  }

  const iceServers = await response.json();
  cache = { iceServers, expiresAt: Date.now() + CACHE_TTL_MS };
  return iceServers;
};
