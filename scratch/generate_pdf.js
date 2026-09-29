const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const mdPath = path.resolve(__dirname, '../SMART_SCHOOL_PROJECT_REPORT.md');
const outPdfPath = path.resolve(__dirname, '../Smart_School_Project_Report.pdf');
const outHtmlPath = path.resolve(__dirname, 'report_preview.html');

let mdContent = fs.readFileSync(mdPath, 'utf8');

// Build HTML page
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
    margin: 18mm 16mm 20mm 16mm;
  }
  
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 13px;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* Cover Page */
  .cover-page {
    page-break-after: always;
    min-height: 90vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 40px 20px 20px 20px;
    border-bottom: 3px solid #3b82f6;
  }

  .cover-header {
    margin-top: 40px;
  }

  .cover-badge {
    display: inline-block;
    background: #eff6ff;
    color: #2563eb;
    font-weight: 700;
    font-size: 12px;
    padding: 6px 14px;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 24px;
    border: 1px solid #bfdbfe;
  }

  .cover-title {
    font-size: 38px;
    font-weight: 800;
    line-height: 1.15;
    color: #0f172a;
    margin: 0 0 16px 0;
    letter-spacing: -0.02em;
  }

  .cover-subtitle {
    font-size: 20px;
    font-weight: 500;
    color: #475569;
    margin: 0 0 32px 0;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 24px;
    margin-top: 40px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
  }

  .meta-label {
    font-size: 11px;
    text-transform: uppercase;
    color: #64748b;
    font-weight: 600;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }

  .meta-val {
    font-size: 14px;
    color: #0f172a;
    font-weight: 600;
  }

  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 20px;
    color: #64748b;
    font-size: 11px;
  }

  /* Content typography */
  h1 {
    font-size: 26px;
    color: #0f172a;
    font-weight: 800;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    margin-top: 36px;
    margin-bottom: 16px;
    page-break-after: avoid;
  }

  h2 {
    font-size: 20px;
    color: #1e3a8a;
    font-weight: 700;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 6px;
    margin-top: 32px;
    margin-bottom: 14px;
    page-break-after: avoid;
    page-break-before: always;
  }

  /* Do not force page-break on the first h2 (Table of contents) */
  .report-content > h2:first-of-type {
    page-break-before: avoid;
  }

  h3 {
    font-size: 15px;
    color: #1e293b;
    font-weight: 700;
    margin-top: 22px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }

  h4 {
    font-size: 13px;
    color: #334155;
    font-weight: 700;
    margin-top: 16px;
    margin-bottom: 8px;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 12px 0;
    color: #334155;
    text-align: justify;
  }

  strong {
    color: #0f172a;
  }

  /* Lists */
  ul, ol {
    margin: 0 0 14px 0;
    padding-left: 24px;
    color: #334155;
  }

  li {
    margin-bottom: 6px;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
    background: #ffffff;
    page-break-inside: auto;
  }

  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  th {
    background-color: #1e293b;
    color: #f8fafc;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #334155;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  td {
    padding: 7px 12px;
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
    font-size: 11px;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    line-height: 1.45;
    margin: 16px 0;
    page-break-inside: avoid;
  }

  code {
    font-family: 'JetBrains Mono', 'Consolas', monospace;
    font-size: 11px;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  pre code {
    background-color: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  /* Mermaid Diagrams */
  .mermaid-wrapper {
    page-break-inside: avoid;
    margin: 20px 0;
    text-align: center;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .mermaid svg {
    max-width: 100% !important;
    height: auto !important;
  }

  /* Blockquotes / Callout Alerts */
  blockquote {
    margin: 16px 0;
    padding: 12px 18px;
    border-left: 4px solid #3b82f6;
    background-color: #eff6ff;
    color: #1e40af;
    border-radius: 0 8px 8px 0;
    page-break-inside: avoid;
  }

  blockquote p {
    margin: 0;
    color: inherit;
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 24px 0;
  }

  /* Links */
  a {
    color: #2563eb;
    text-decoration: none;
  }

  /* Checkmarks and badging */
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
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
  
  // Custom code renderer to capture mermaid blocks
  const originalCode = renderer.code.bind(renderer);
  renderer.code = function(code, language) {
    if (language === 'mermaid') {
      return '<div class="mermaid-wrapper"><div class="mermaid">' + code + '</div></div>';
    }
    return originalCode(code, language);
  };

  marked.setOptions({ renderer: renderer, gfm: true, breaks: false });

  document.getElementById('report-container').innerHTML = marked.parse(rawMarkdown);

  // Render mermaid
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
console.log('Generated HTML preview at:', outHtmlPath);

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
  await page.evaluate(async () => {
    if (window.renderAll) {
      await window.renderAll();
    }
  });

  // Give a small pause for SVG layout calculation
  await new Promise(r => setTimeout(r, 2000));

  console.log('Generating PDF to:', outPdfPath);
  await page.pdf({
    path: outPdfPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-bottom: 0.5px solid #e2e8f0; padding-bottom: 4px;">
        <span>Smart School Management System — Technical Specification</span>
        <span>Infosof Technologies</span>
      </div>
    `,
    footerTemplate: `
      <div style="font-family: 'Inter', sans-serif; font-size: 8px; color: #94a3b8; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-top: 0.5px solid #e2e8f0; padding-top: 4px;">
        <span>Confidential — Academic Year 2026–27</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>
    `,
    margin: {
      top: '18mm',
      bottom: '18mm',
      left: '14mm',
      right: '14mm'
    }
  });

  await browser.close();
  console.log('PDF generation complete!');
  const stats = fs.statSync(outPdfPath);
  console.log('Generated PDF size:', (stats.size / 1024).toFixed(2), 'KB');
}

generatePdf().catch(err => {
  console.error('PDF Generation failed:', err);
  process.exit(1);
});
