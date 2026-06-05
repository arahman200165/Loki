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
    min-width: 640px;
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
  .health-actions {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .docs-link {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
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
        <p class="docs-link">
          <a href="${escapeHtml(apiPrefix)}/docs" target="_blank" rel="noopener noreferrer">Open Swagger UI</a>
          <span class="health-hint">Use it for Sprint 1 and Sprint 2 API QA.</span>
        </p>
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
