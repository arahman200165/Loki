import { escapeHtml } from '../utils.js';

export const renderApiTable = ({ apiPrefix }) => {
  const base = escapeHtml(apiPrefix);

  return `
    <h2>Available APIs</h2>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Path</th>
            <th>Purpose</th>
            <th>Auth Required</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>POST</code></td>
            <td><code>${base}/auth/register</code></td>
            <td>Create an account, default device, and bearer session.</td>
            <td><code>x-api-key</code></td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>${base}/auth/login</code></td>
            <td>Login with username/password and receive a bearer token.</td>
            <td><code>x-api-key</code></td>
          </tr>
          <tr>
            <td><code>POST</code></td>
            <td><code>${base}/auth/logout</code></td>
            <td>Invalidate current API session token.</td>
            <td><code>x-api-key</code> + <code>Authorization: Bearer &lt;token&gt;</code></td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>${base}/auth/session</code></td>
            <td>Return the authenticated session context for QA checks.</td>
            <td><code>x-api-key</code> + <code>Authorization: Bearer &lt;token&gt;</code></td>
          </tr>
          <tr>
            <td><code>GET</code></td>
            <td><code>${base}/health</code></td>
            <td>Health and uptime status.</td>
            <td>None</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
};
