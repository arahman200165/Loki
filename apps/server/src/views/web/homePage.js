import { renderPageLayout } from './components/layout.js';
import { renderApiTable } from './components/apiTable.js';
import { escapeHtml } from './utils.js';

const homePageStyles = `
  .chip {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--chip);
    color: var(--accent);
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 18px;
  }
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 12px;
    margin-top: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 960px;
  }
  thead { background: #f1f5f9; }
  th, td {
    text-align: left;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    font-size: 14px;
  }
  tr:last-child td { border-bottom: none; }
  .selected-row {
    background: #eff6ff;
  }
  .api-explorer {
    display: grid;
    gap: 16px;
  }
  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 10px;
  }
  .filters label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }
  .filters input,
  .filters select,
  .credentials input,
  .dynamic-inputs input,
  textarea {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 9px 10px;
    font: inherit;
    color: var(--text);
    background: #fff;
  }
  .api-summary {
    display: flex;
    gap: 8px 14px;
    flex-wrap: wrap;
    align-items: center;
    font-size: 13px;
    color: var(--muted);
  }
  .try-panel {
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    background: #fcfdff;
    display: grid;
    gap: 12px;
  }
  .try-panel h3 {
    margin: 0;
  }
  .credentials {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 10px;
  }
  .credentials label,
  .body-label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }
  .request-meta {
    display: grid;
    gap: 4px;
  }
  .muted {
    font-size: 13px;
    color: var(--muted);
  }
  .dynamic-inputs {
    display: grid;
    gap: 10px;
  }
  .dynamic-inputs fieldset {
    border: 1px solid var(--border);
    border-radius: 12px;
    margin: 0;
    padding: 10px;
    display: grid;
    gap: 10px;
  }
  .dynamic-inputs legend {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    padding: 0 4px;
  }
  .dynamic-inputs label {
    display: grid;
    gap: 6px;
    font-size: 13px;
    color: var(--muted);
  }
  textarea {
    min-height: 170px;
    resize: vertical;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12.5px;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .try-btn {
    padding: 6px 10px;
    font-size: 12px;
    border-radius: 8px;
  }
  pre {
    margin: 0;
    border: 1px solid var(--border);
    background: #0b1220;
    color: #e2e8f0;
    border-radius: 12px;
    padding: 12px;
    overflow-x: auto;
    max-height: 320px;
    font-size: 12px;
    line-height: 1.45;
  }
  .health-actions {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .health-hint {
    font-size: 13px;
    color: var(--muted);
  }
  form { margin-top: 20px; }
`;

export const renderHomePageHtml = ({ username, apiPrefix }) =>
  renderPageLayout({
    title: 'Loki Backend',
    extraStyles: homePageStyles,
    body: `
      <main>
        <h1>Loki Backend</h1>
        <p>Authenticated as <strong>${escapeHtml(username)}</strong>.</p>
        <span class="chip">API Prefix: <code>${escapeHtml(apiPrefix)}</code></span>
        ${renderApiTable({ apiPrefix })}
        <form class="health-actions" method="get" action="/web/health-check" target="_blank" rel="noopener noreferrer">
          <button type="submit">Run Health Check</button>
          <span class="health-hint">Opens endpoint response in a new tab.</span>
        </form>
        <form method="post" action="/logout">
          <button type="submit">Logout</button>
        </form>
      </main>
    `
  });
