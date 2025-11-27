// /utils/HtmlReport/generateCssReport.js
import fs from 'fs';

// Server-side escape for building HTML safely
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a combined CSS validation report for multiple viewports,
 * with filter buttons: All, Laptop, Mobile, Tablet, Desktop.
 *
 * viewports: [
 *   { name: 'Laptop', results: [{ element, property, expected, received, passed }]}
 * ]
 */
export function generateCssReport({
  outputDir,
  reportPath,
  pageName,
  viewports
}) {
  // Determine which of the standard viewport names are present
  const present = new Set(viewports.map(v => v.name.toLowerCase()));
  const FILTERS = ['All', 'Laptop', 'Mobile', 'Tablet', 'Desktop'];

  const buttonsHtml = FILTERS.map(label => {
    const key = label.toLowerCase();
    const available = label === 'All' ? true : present.has(key);
    const disabledAttr = available ? '' : ' disabled aria-disabled="true"';
    const title = available ? `Show ${label}` : `${label} not in this report`;
    const activeClass = label === 'All' ? ' active' : '';
    return `<button class="btn filter-btn${activeClass}" data-filter="${label}" ${disabledAttr} title="${escapeHtml(title)}">${label}</button>`;
  }).join('');

  const sectionsHtml = viewports.map(vp => {
    const passed = vp.results.filter(r => r.passed).length;
    const failed = vp.results.length - passed;

    return `
    <section class="vp" data-vp="${escapeHtml(vp.name)}">
      <header style="
  display:grid;
  grid-template-columns: 1fr auto 1fr; /* left spacer | TITLE | right counters */
  align-items:center;
  gap:12px;
  padding:18px 20px;                   /* bigger header */
  background:#f5f7fb;
  border-bottom:1px solid #e5e7eb;
  border-top-left-radius:12px;border-top-right-radius:12px;
">
  <div style="grid-column:2;justify-self:center;text-align:center;
              font-size:32px;font-weight:700;line-height:1.25;letter-spacing:.2px;">
    ${escapeHtml(vp.name)}
  </div>

  <div class="pill" aria-label="summary"
       style="grid-column:3;justify-self:end; font-size:20px;">
    ✅ ${passed} · ❌ ${failed}
  </div>
</header>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:18%">Element</th>
              <th style="width:18%">Property</th>
              <th style="width:27%">Expected</th>
              <th style="width:27%">Received</th>
              <th style="width:10%">Status</th>
            </tr>
          </thead>
          <tbody>
            ${vp.results.map(r => `
              <tr class="${r.passed ? 'pass' : 'fail'}">
                <td><code>${escapeHtml(r.element)}</code></td>
                <td><code>${escapeHtml(r.property)}</code></td>
                <td>${escapeHtml(r.expected ?? '')}</td>
                <td>${escapeHtml(r.received ?? '')}</td>
                <td>${r.passed ? '✅' : '❌'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CSS Validation Report - ${escapeHtml(pageName)}</title>
<style>
  :root { --ok:#16a34a; --bad:#dc2626; --chip:#eef2ff; --panel:#fff; --ink:#18171C; --muted:#6b7280; }
  * { box-sizing: border-box; }
  body { margin:0; background:#f8fafc; color:#0f172a; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial; }

  header.top {
    position:sticky; top:0; z-index:10;
    background:#111827; color:#fff; padding:14px 18px;
    display:flex; gap:12px; align-items:center; justify-content:space-between;
    border-bottom:1px solid #1f2937;
  }
  header.top h1 { margin:0; font-size:18px; }
  .controls { display:flex; gap:8px; flex-wrap:wrap; }
  .btn {
    appearance:none; border:1px solid #30363d; background:#1f2937; color:#fff;
    padding:8px 12px; border-radius:8px; cursor:pointer; font-size:14px; text-decoration:none;
  }
  .btn:hover { background:#111827; }
  .btn.active { outline:2px solid #93c5fd; }
  .btn[disabled], .btn[aria-disabled="true"] { opacity:.5; cursor:not-allowed; }

  main { padding: 18px; max-width: 1200px; margin: 0 auto; }
  .vp { background:var(--panel); border:1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,.04); border-radius:12px; margin-bottom:16px; overflow:hidden; }
  .vp.hidden { display:none; }
  .vp header { position:relative; inset:auto; background:#f3f4f6; color:#111827; padding:10px 12px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; gap:10px; justify-content:space-between; }
  .pill { display:inline-flex; gap:6px; align-items:center; background:var(--chip); border-radius:999px; padding:4px 10px; font-size:12px; color:#3730a3; }
  .table-wrap { overflow:auto; }
  table { width:100%; border-collapse: collapse; font-size:14px; }
  th, td { padding:10px 12px; border-top:1px solid #e5e7eb; vertical-align:top; }
  th { text-align:left; font-weight:600; color:#111827; background:#fafafa; position:sticky; top:0; }
  tr.fail { background:#fff1f2; }
  tr.pass { background:#f0fdf4; }
  code { background:#f3f4f6; padding:2px 6px; border-radius:6px; }
</style>
</head>
<body>
 
   <header class="top">
    <h1>CSS Validation Report · ${escapeHtml(pageName)}</h1>
    <div class="controls">
      ${buttonsHtml}
      <div class="field" title="Search element / property / value">
        🔎 <input id="searchBox" placeholder="Search…"/>
      </div>
      <button class="btn" id="toggleFailed">Show only failed</button>
      <button class="btn" id="downloadCsv">Download CSV</button>
    </div>
  </header>

  <main>
    ${sectionsHtml}
  </main>

<script>
  // Filter logic: All, Laptop, Mobile, Tablet, Desktop
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const sections = Array.from(document.querySelectorAll('section.vp'));

  function applyFilter(name) {
    const isAll = name.toLowerCase() === 'all';
    sections.forEach(sec => {
      const vp = (sec.getAttribute('data-vp') || '').toLowerCase();
      const show = isAll || vp === name.toLowerCase();
      sec.classList.toggle('hidden', !show);
    });
    filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === name);
    });
  }

  filterButtons.forEach(btn => {
    if (btn.hasAttribute('disabled') || btn.getAttribute('aria-disabled') === 'true') return;
    btn.addEventListener('click', () => applyFilter(btn.getAttribute('data-filter')));
  });
const searchBox = document.getElementById('searchBox');
  function applySearch() {
    const q = (searchBox.value || '').toLowerCase().trim();
    const visibleSections = Array.from(document.querySelectorAll('section.vp:not(.hidden)'));
    visibleSections.forEach(sec => {
      const rows = Array.from(sec.querySelectorAll('tbody tr'));
      rows.forEach(tr => {
        if (!q) { tr.dataset.searchHide = '0'; return (tr.style.display = onlyFailed && !tr.classList.contains('fail') ? 'none' : ''); }
        const text = tr.innerText.toLowerCase();
        const match = text.includes(q);
        tr.dataset.searchHide = match ? '0' : '1';
        if (onlyFailed && !tr.classList.contains('fail')) {
          tr.style.display = match ? '' : 'none';
        } else {
          tr.style.display = match ? '' : 'none';
        }
      });
    });
  }
  searchBox.addEventListener('input', applySearch);
  // Show only failed toggle
  const toggleBtn = document.getElementById('toggleFailed');
  let onlyFailed = false;
  toggleBtn.addEventListener('click', () => {
    onlyFailed = !onlyFailed;
    // Only affect currently visible sections
    document.querySelectorAll('section.vp:not(.hidden) tbody tr').forEach(tr => {
      const isFail = tr.classList.contains('fail');
      tr.style.display = onlyFailed ? (isFail ? '' : 'none') : '';
    });
    toggleBtn.textContent = onlyFailed ? 'Show all (incl. passed)' : 'Show only failed';
  });

  // CSV export respecting current filter & failed toggle
  document.getElementById('downloadCsv').addEventListener('click', () => {
    const rows = [['Viewport','Element','Property','Expected','Received','Status']];
    const visibleSections = Array.from(document.querySelectorAll('section.vp:not(.hidden)'));
    visibleSections.forEach(sec => {
      const vp = sec.getAttribute('data-vp') || '';
      const trs = Array.from(sec.querySelectorAll('tbody tr'));
      trs.forEach(tr => {
        if (onlyFailed && !tr.classList.contains('fail')) return; // respect failed-only filter
        const tds = Array.from(tr.children).map(td => (td.innerText || '').replace(/\\s+/g,' ').trim());
        const element = tds[0] || '';
        const property = tds[1] || '';
        const expected = tds[2] || '';
        const received = tds[3] || '';
        const status = tds[4] || '';
        rows.push([vp, element, property, expected, received, status]);
      });
    });
    const csv = rows.map(r => r.map(cell => '"' + (cell || '').replace(/"/g,'""') + '"').join(',')).join('\\n');
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'css-report.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });
</script>
</body>
</html>`;

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, html);
}