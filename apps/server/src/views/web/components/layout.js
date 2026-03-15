export const renderPageLayout = ({ title, body, extraStyles = '' }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #475569;
      --border: #e2e8f0;
      --accent: #2563eb;
      --chip: #eff6ff;
      --danger: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Roboto, Arial, sans-serif;
      background: radial-gradient(circle at top left, #e0f2fe, #f8fafc 45%);
      color: var(--text);
    }
    main {
      max-width: 1160px;
      margin: 40px auto;
      padding: 28px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
    }
    h1 { margin-top: 0; margin-bottom: 8px; }
    p { color: var(--muted); margin-top: 0; }
    code {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2px 6px;
      font-size: 13px;
    }
    button {
      border: none;
      border-radius: 10px;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      padding: 10px 14px;
      cursor: pointer;
    }
    ${extraStyles}
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
