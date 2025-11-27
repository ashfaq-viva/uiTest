import fs from 'fs';

/**
 * Multi-viewport visual report with tabs, styled like baseTemplate,
 * plus an optional "CSS Report" button that links to your CSS results page.
 *
 * @param {Object} params
 * @param {string} params.outputDir
 * @param {string} params.reportPath
 * @param {string} [params.pageName='Visual']
 * @param {Array<{name:string, diffPixels:number|string, expectedImage:string, actualImage:string, diffImage:string}>} params.viewports
 * @param {string} [params.cssReportPath] - Optional relative/absolute link to CSS report (e.g., './demoHeroCSSReport.html')
 */
export function generateHtmlReport({
  outputDir,
  reportPath,
  pageName = 'Visual',
  viewports,
  cssReportPath // <-- NEW (optional)
}) {
  const tabs = viewports
    .map(
      (vp, i) => `
    <button class="tab-button${i === 0 ? ' active' : ''}" data-target="${vp.name}" aria-controls="${vp.name}">
      ${vp.name}
    </button>
  `
    )
    .join('');

  const contents = viewports
    .map(
      (vp, i) => `
    <section id="${vp.name}" class="tab-content${i === 0 ? ' active' : ''}" role="tabpanel" aria-labelledby="tab-${vp.name}">
      <div class="summary">
        <strong>Diff Pixels:</strong> ${vp.diffPixels}
      </div>
      <div class="grid">
        <div class="grid-column">
          <h3>Expected (Figma) 🔴</h3>
          <img src="${vp.expectedImage}" alt="Expected (${vp.name})"/>
        </div>
        <div class="grid-column">
          <h3>Actual (Live) 🔵</h3>
          <img src="${vp.actualImage}" alt="Actual (${vp.name})"/>
        </div>
        <div class="grid-column">
          <h3>Diff</h3>
          <img src="${vp.diffImage}" alt="Diff (${vp.name})"/>
        </div>
      </div>
    </section>
  `
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title style="flex:1">Visual Regression Report : ${pageName}</title>
  <style>
    :root { --ink:#18171C; --bg:#f5f5f5; --panel:#fff; --muted:#6b7280; --brand:#4f46e5; }

    /* Base */
    * { box-sizing: border-box; }
    body { margin:0; padding:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; background: var(--bg); color:#333; }

    /* Header */
    header.appbar {
      position:relative;
      padding:24px 20px; background:#28282c; color:white; position:sticky; top:0; z-index:5;
      border-bottom:1px solid #3b3b42;
    }
    header.appbar h1 { margin:0; font-size:36px; font-weight:600; text-align:center; }
    .tag { display:inline-block; background:#eef2ff; color:#3730a3; padding-left:20px; padding-right:20px;padding-top:4px;padding-bottom:8px ;border-radius:999px; font-size:24px; margin-left:6px; }
    .actions { display:flex; gap:10px; }
    .btn {
      display:inline-flex; gap:8px; align-items:center;position:absolute; right:36px; top:50%;transform:translateY(-50%);
      border:1px solid #3b3b42; background:#1f1f23; color:#fff;
      padding:8px 12px; border-radius:8px; text-decoration:none; font-size:14px; cursor:pointer;
    }
    .btn:hover { background:#26262b; }

    /* Tabs */
    .tabs {
      display:flex; flex-wrap:wrap; gap:10px; justify-content:center; margin:16px 20px;
    }
    .tab-button {
      padding:10px 16px; cursor:pointer; background:#e5e7eb; border:1px solid #d1d5db; border-radius:8px; font-weight:600;
    }
    .tab-button.active { background:#28282c; color:#fff; border-color:#28282c; }

    /* Panels */
    .tab-content { display:none; }
    .tab-content.active { display:block; }

    /* Body sections */
    .summary { text-align:center; font-size:16px; margin:12px 0; color:#111; }
    .grid {
      display:grid; grid-template-columns: repeat(3, 1fr);
      gap:10px; padding: 0 20px 20px;
    }
    .grid-column {
      background: var(--panel); padding: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.05); border-radius: 8px; text-align: center;
    }
    .grid-column h3 {
      margin-top:0; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 16px; color: var(--ink);
    }
    .grid-column img {
      max-width: 100%; border-radius: 6px; box-shadow: 0 0 8px rgba(0,0,0,0.08);
    }

    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header class="appbar">
    <h1>Visual Regression Report - <span class="tag">${pageName}</span></h1>
    <div class="actions">
      ${cssReportPath ? `<a class="btn" href="${cssReportPath}" target="_blank" rel="noopener noreferrer">🔤 CSS Report</a>` : ''}
    </div>
  </header>

  <nav class="tabs" role="tablist" aria-label="Viewports">
    ${tabs}
  </nav>

  ${contents}

  <script>
    // Tabs behavior (mouse + keyboard)
    const buttons = Array.from(document.querySelectorAll('.tab-button'));
    const panels = Array.from(document.querySelectorAll('.tab-content'));

    function activate(btn) {
      const id = btn.getAttribute('data-target');
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panel = document.getElementById(id);
      if (panel) panel.classList.add('active');
    }

    buttons.forEach((btn, idx) => {
      btn.id = 'tab-' + btn.getAttribute('data-target');
      btn.setAttribute('role', 'tab');
      btn.addEventListener('click', () => activate(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (idx + dir + buttons.length) % buttons.length;
          buttons[next].focus();
          activate(buttons[next]);
        }
      });
    });
  </script>
</body>
</html>`;

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, html);
}