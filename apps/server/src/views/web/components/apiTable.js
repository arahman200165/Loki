import { escapeHtml } from '../utils.js';

export const renderApiTable = ({ apiPrefix }) => {
  const base = escapeHtml(apiPrefix);
  const endpoints = [
    {
      id: 'health-check',
      usage: 'System',
      method: 'GET',
      pathTemplate: '/health',
      purpose: 'Health and uptime status.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: null
    },
    {
      id: 'auth-register-start',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/register/start',
      purpose: 'Start private account registration and issue registration challenge.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        user_public_identity_key: { kty: 'OKP', crv: 'Ed25519', x: '<base64url>' },
        device_public_identity_key: { kty: 'OKP', crv: 'Ed25519', x: '<base64url>' },
        recovery_public_material: { type: 'phrase_hash', hash: '<hex>' },
        device_prekeys: {},
        platform: 'android',
        device_label: 'Pixel 8'
      }
    },
    {
      id: 'auth-register-complete',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/register/complete',
      purpose: 'Verify registration challenge signature and create API session.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        user_id: '<uuid>',
        device_id: '<uuid>',
        challenge_signature: '<base64url-signature>'
      }
    },
    {
      id: 'auth-challenge',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/challenge',
      purpose: 'Create a login challenge for an existing device.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        device_id: '<uuid>'
      }
    },
    {
      id: 'auth-login',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/login',
      purpose: 'Verify device challenge signature and issue API session token.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        device_id: '<uuid>',
        challenge_id: '<uuid>',
        challenge_signature: '<base64url-signature>'
      }
    },
    {
      id: 'auth-recovery-start',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/recovery/start',
      purpose: 'Start account recovery for a new device and issue recovery challenge.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        account_locator: '<account-locator>',
        new_device_public_identity_key: { kty: 'OKP', crv: 'Ed25519', x: '<base64url>' },
        new_device_prekeys: {},
        platform: 'android',
        device_label: 'Pixel 8'
      }
    },
    {
      id: 'auth-recovery-complete',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/recovery/complete',
      purpose: 'Complete recovery proof verification and issue API session.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        recovery_session_id: '<uuid>',
        recovery_proof: {
          type: 'phrase_hash',
          proof: '<proof-material>'
        }
      }
    },
    {
      id: 'auth-logout',
      usage: 'Authentication',
      method: 'POST',
      pathTemplate: '/auth/logout',
      purpose: 'Invalidate the current API session token.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: {}
    },
    {
      id: 'devices-list',
      usage: 'Devices',
      method: 'GET',
      pathTemplate: '/devices',
      purpose: 'List trusted devices for the authenticated account.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: null
    },
    {
      id: 'devices-revoke',
      usage: 'Devices',
      method: 'DELETE',
      pathTemplate: '/devices/:deviceId',
      purpose: 'Revoke a trusted device and its active sessions.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [{ name: 'deviceId', required: true, example: '<uuid>' }],
      requestBody: null
    },
    {
      id: 'link-start',
      usage: 'Device Linking',
      method: 'POST',
      pathTemplate: '/devices/link/start',
      purpose: 'Start a device-link session and return QR/manual code data.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        new_device_public_identity_key: { kty: 'OKP', crv: 'Ed25519', x: '<base64url>' },
        new_device_prekeys: {},
        platform: 'android',
        device_label: 'Pixel 8'
      }
    },
    {
      id: 'link-resolve',
      usage: 'Device Linking',
      method: 'POST',
      pathTemplate: '/devices/link/resolve',
      purpose: 'Resolve a manual code or QR payload to a pending link session.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: {
        manual_code: '<6-char-code>',
        qr_payload: '<qr-payload>'
      }
    },
    {
      id: 'link-approve',
      usage: 'Device Linking',
      method: 'POST',
      pathTemplate: '/devices/link/approve',
      purpose: 'Approve a pending device link request.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: {
        link_session_id: '<uuid>',
        encrypted_bootstrap_bundle: '<encrypted-payload>'
      }
    },
    {
      id: 'link-deny',
      usage: 'Device Linking',
      method: 'POST',
      pathTemplate: '/devices/link/deny',
      purpose: 'Deny a pending device link request.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: {
        link_session_id: '<uuid>'
      }
    },
    {
      id: 'link-status',
      usage: 'Device Linking',
      method: 'GET',
      pathTemplate: '/devices/link/status',
      purpose: 'Check link-session status and fetch encrypted bootstrap when ready.',
      auth: 'x-api-key',
      queryParams: [{ name: 'link_session_id', required: true, example: '<uuid>' }],
      pathParams: [],
      requestBody: null
    },
    {
      id: 'link-complete',
      usage: 'Device Linking',
      method: 'POST',
      pathTemplate: '/devices/link/complete',
      purpose: 'Complete approved link session and issue API session for the new device.',
      auth: 'x-api-key',
      queryParams: [],
      pathParams: [],
      requestBody: {
        link_session_id: '<uuid>'
      }
    },
    {
      id: 'device-security-state',
      usage: 'Devices',
      method: 'POST',
      pathTemplate: '/devices/:deviceId/security-state',
      purpose: 'Update local lock/security state for a device.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [{ name: 'deviceId', required: true, example: '<uuid>' }],
      requestBody: {
        local_lock_enabled: true,
        lock_mode: 'biometric_or_passcode'
      }
    },
    {
      id: 'profile-update',
      usage: 'Profile',
      method: 'PUT',
      pathTemplate: '/profile',
      purpose: 'Update profile fields like display name or encrypted profile blob.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: {
        display_name: 'loki-user',
        encrypted_profile_blob: '<encrypted-json>'
      }
    },
    {
      id: 'profile-contact-code',
      usage: 'Profile',
      method: 'GET',
      pathTemplate: '/profile/contact-code',
      purpose: 'Get or create the account contact code.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: null
    },
    {
      id: 'sync-bootstrap',
      usage: 'Sync',
      method: 'GET',
      pathTemplate: '/sync/bootstrap',
      purpose: 'Fetch initial sync bootstrap payload for the authenticated user.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: null
    },
    {
      id: 'sync-shared-keys-request',
      usage: 'Sync',
      method: 'POST',
      pathTemplate: '/sync/shared-keys/request',
      purpose: 'Queue a shared key sync request.',
      auth: 'x-api-key + Authorization: Bearer <token>',
      queryParams: [],
      pathParams: [],
      requestBody: {}
    }
  ];

  const endpointsJson = JSON.stringify(endpoints).replaceAll('</script>', '<\\/script>');
  const initialPath = `${base}${endpoints[0].pathTemplate}`;
  const initialRowsHtml = endpoints
    .map(
      (item) => `
            <tr data-endpoint-id="${escapeHtml(item.id)}">
              <td><code>${escapeHtml(item.method)}</code></td>
              <td><code>${escapeHtml(`${base}${item.pathTemplate}`)}</code></td>
              <td>${escapeHtml(item.usage)}</td>
              <td>${escapeHtml(item.purpose)}</td>
              <td>${escapeHtml(item.auth)}</td>
              <td><button type="button" class="try-btn" data-try-id="${escapeHtml(item.id)}">Try</button></td>
            </tr>
      `
    )
    .join('');

  return `
    <h2>API Explorer</h2>
    <p>Filter, sort, inspect contracts, and call endpoints inline.</p>
    <div id="apiExplorerRoot" class="api-explorer" data-api-prefix="${escapeHtml(base)}">
      <div class="filters">
        <label>Search
          <input id="apiSearch" type="search" placeholder="path, purpose, category..." />
        </label>
        <label>Usage
          <select id="usageFilter">
            <option value="all">All</option>
          </select>
        </label>
        <label>Auth
          <select id="authFilter">
            <option value="all">All</option>
            <option value="api-key-only">x-api-key</option>
            <option value="api-key-bearer">x-api-key + Bearer</option>
          </select>
        </label>
        <label>Method
          <select id="methodFilter">
            <option value="all">All</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>
        <label>Sort By
          <select id="sortBy">
            <option value="path">Path</option>
            <option value="usage">Usage</option>
            <option value="auth">Auth</option>
            <option value="method">Method</option>
          </select>
        </label>
      </div>
      <div id="apiSummary" class="api-summary"></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Path</th>
              <th>Usage</th>
              <th>Purpose</th>
              <th>Auth Required</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="apiRows">${initialRowsHtml}</tbody>
        </table>
      </div>
      <section class="try-panel">
        <h3>Try API Inline</h3>
        <div class="credentials">
          <label>x-api-key
            <input id="apiKeyInput" type="password" placeholder="Paste API key" />
          </label>
          <label>Bearer Token
            <input id="bearerInput" type="password" placeholder="Paste session token (if required)" />
          </label>
        </div>
        <div class="request-meta">
          <div><strong id="activeMethod">GET</strong> <code id="activePath">${initialPath}</code></div>
          <div class="muted" id="activePurpose"></div>
          <div class="muted" id="activeAuth"></div>
        </div>
        <div id="pathParamInputs" class="dynamic-inputs"></div>
        <div id="queryParamInputs" class="dynamic-inputs"></div>
        <label class="body-label">JSON Body
          <textarea id="requestBodyInput" rows="10" spellcheck="false"></textarea>
        </label>
        <div class="actions">
          <button id="sendRequestButton" type="button">Send Request</button>
          <span id="requestStatus" class="health-hint"></span>
        </div>
        <pre id="responseOutput">Select an endpoint and send a request.</pre>
      </section>
    </div>
    <textarea id="apiExplorerData" hidden>${escapeHtml(endpointsJson)}</textarea>
    <script src="/web/assets/apiExplorer.js" defer></script>
  `;
};
