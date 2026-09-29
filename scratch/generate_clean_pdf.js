const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const mdPath = path.resolve(__dirname, '../SMART_SCHOOL_PROJECT_REPORT.md');
const outPdfV2 = path.resolve(__dirname, '../Smart_School_Project_Report_v2.pdf');
const outPdfOriginal = path.resolve(__dirname, '../Smart_School_Project_Report.pdf');
const outHtmlPath = path.resolve(__dirname, 'report_preview_clean.html');

let mdContent = fs.readFileSync(mdPath, 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Smart School Management System - Project Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  @page {
    size: A4 portrait;
    margin: 16mm 14mm 18mm 14mm;
  }
  
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.55;
    font-size: 12.5px;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Cover Page */
  .cover-page {
    page-break-after: always;
    min-height: 88vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 30px 15px 15px 15px;
    border-bottom: 3px solid #2563eb;
  }

  .cover-badge {
    display: inline-block;
    background: #eff6ff;
    color: #1d4ed8;
    font-weight: 700;
    font-size: 11px;
    padding: 6px 14px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 20px;
    border: 1px solid #bfdbfe;
  }

  .cover-title {
    font-size: 34px;
    font-weight: 800;
    line-height: 1.15;
    color: #0f172a;
    margin: 0 0 14px 0;
    letter-spacing: -0.02em;
  }

  .cover-subtitle {
    font-size: 18px;
    font-weight: 500;
    color: #475569;
    margin: 0 0 28px 0;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 20px;
    margin-top: 30px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-size: 10px;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 3px;
  }

  .meta-val {
    font-size: 13px;
    color: #0f172a;
    font-weight: 600;
  }

  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 15px;
    color: #64748b;
    font-size: 10.5px;
  }

  /* Content typography */
  h1 {
    font-size: 24px;
    color: #0f172a;
    font-weight: 800;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 30px;
    margin-bottom: 14px;
    page-break-after: avoid;
  }

  h2 {
    font-size: 18px;
    color: #1e3a8a;
    font-weight: 700;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 5px;
    margin-top: 26px;
    margin-bottom: 12px;
    page-break-after: avoid;
    break-after: avoid;
  }

  h3 {
    font-size: 14px;
    color: #1e293b;
    font-weight: 700;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
    break-after: avoid;
  }

  h4 {
    font-size: 12.5px;
    color: #334155;
    font-weight: 700;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 10px 0;
    color: #334155;
    text-align: justify;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 11.5px;
    background: #ffffff;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  th {
    background-color: #1e293b;
    color: #f8fafc;
    font-weight: 600;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #334155;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  td {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    color: #334155;
  }

  tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  /* Code blocks & ASCII art */
  pre {
    background-color: #0f172a;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 10.5px;
    padding: 12px 14px;
    border-radius: 6px;
    overflow-x: auto;
    line-height: 1.4;
    margin: 12px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 10.5px;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  /* Mermaid Diagrams Container */
  .mermaid-wrapper {
    page-break-inside: avoid;
    break-inside: avoid;
    margin: 16px 0;
    text-align: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .mermaid {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .mermaid svg {
    max-width: 98% !important;
    height: auto !important;
  }

  /* Blockquotes / Callout Alerts */
  blockquote {
    margin: 14px 0;
    padding: 10px 14px;
    border-left: 4px solid #3b82f6;
    background-color: #eff6ff;
    color: #1e40af;
    border-radius: 0 6px 6px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  blockquote p {
    margin: 0;
    color: inherit;
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }
</style>
</head>
<body>

<!-- Cover Page -->
<div class="cover-page">
  <div class="cover-header">
    <div class="cover-badge">Official Architecture & Engineering Documentation</div>
    <div class="cover-title">Smart School Management System</div>
    <div class="cover-subtitle">Complete System Architecture, Flowcharts, Database Entity-Relationship Specification & Module Index</div>
  </div>

  <div class="cover-meta-grid">
    <div class="meta-item">
      <span class="meta-label">Project Version</span>
      <span class="meta-val">v1.5 (Production Ready)</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Release Date</span>
      <span class="meta-val">September 29, 2026</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Technology Stack</span>
      <span class="meta-val">Vanilla JS SPA + CodeIgniter 3.x + MySQL 8.x</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Modules & Tables</span>
      <span class="meta-val">45 Modules / 56 Relational Tables</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Developed By</span>
      <span class="meta-val">Infosof Technologies</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Target Deployment</span>
      <span class="meta-val">cPanel Shared Hosting / Linux VPS</span>
    </div>
  </div>

  <div class="cover-footer">
    <span>Institution: Smart School International, Kolkata</span>
    <span>CONFIDENTIAL & PROPRIETARY — ALL RIGHTS RESERVED</span>
  </div>
</div>

<div class="report-content" id="report-container"></div>

<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      primaryColor: '#eff6ff',
      primaryBorderColor: '#3b82f6',
      primaryTextColor: '#1e3a8a',
      lineColor: '#64748b'
    },
    flowchart: { curve: 'basis', htmlLabels: true },
    er: { useMaxWidth: true }
  });

  const rawMarkdown = ${JSON.stringify(mdContent)};

  // Parse markdown
  const renderer = new marked.Renderer();
  
  // Custom code renderer compatible with marked v12+ and older
  const originalCode = renderer.code.bind(renderer);
  renderer.code = function(token, language) {
    const text = typeof token === 'object' ? token.text : token;
    const lang = typeof token === 'object' ? token.lang : language;
    if (lang === 'mermaid') {
      return '<div class="mermaid-wrapper"><div class="mermaid">' + text + '</div></div>';
    }
    return originalCode.call(this, token, language);
  };

  marked.setOptions({ renderer: renderer, gfm: true, breaks: false });

  document.getElementById('report-container').innerHTML = marked.parse(rawMarkdown);

  window.renderAll = async function() {
    try {
      await mermaid.run({
        querySelector: '.mermaid'
      });
      return true;
    } catch (e) {
      console.error('Mermaid render error:', e);
      return false;
    }
  };
</script>
</body>
</html>`;

fs.writeFileSync(outHtmlPath, html, 'utf8');
console.log('Generated clean HTML preview at:', outHtmlPath);

async function generatePdf() {
  console.log('Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--allow-file-access-from-files'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600 });

  const fileUrl = 'file:///' + outHtmlPath.replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });

  console.log('Rendering Mermaid diagrams...');
  const renderRes = await page.evaluate(async () => {
    if (window.renderAll) {
      return await window.renderAll();
    }
    return false;
  });
  console.log('Mermaid render completed with result:', renderRes);

  const svgCount = await page.$$eval('svg', els => els.length);
  console.log(`Rendered ${svgCount} SVG diagram(s) on the page.`);

  // Small delay for clean SVG rendering
  await new Promise(r => setTimeout(r, 2000));

  console.log('Writing PDF to:', outPdfV2);
  await page.pdf({
    path: outPdfV2,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #94a3b8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; border-bottom: 0.5px solid #e2e8f0; padding-bottom: 4px;">
        <span>Smart School Management System — Technical Specification</span>
        <span>Infosof Technologies</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #94a3b8; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between; border-top: 0.5px solid #e2e8f0; padding-top: 4px;">
        <span>Confidential — Academic Year 2026–27</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '16mm',
      bottom: '16mm',
      left: '12mm',
      right: '12mm'
    }
  });

  // Also try writing to original if possible
  try {
    fs.copyFileSync(outPdfV2, outPdfOriginal);
    console.log('Successfully updated original PDF as well!');
  } catch (e) {
    console.log('Original PDF was locked, saved cleanly to Smart_School_Project_Report_v2.pdf');
  }

  await browser.close();
  const stats = fs.statSync(outPdfV2);
  console.log('PDF v2 size:', (stats.size / 1024).toFixed(2), 'KB');
}

generatePdf().catch(err => {
  console.error('PDF Generation failed:', err);
  process.exit(1);
});
