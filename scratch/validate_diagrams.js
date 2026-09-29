const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const md = fs.readFileSync('SMART_SCHOOL_PROJECT_REPORT.md', 'utf8');

// Extract all mermaid blocks
const regex = /```mermaid([\s\S]*?)```/g;
let match;
const diagrams = [];
while ((match = regex.exec(md)) !== null) {
  diagrams.push(match[1].trim());
}

console.log(`Found ${diagrams.length} Mermaid diagrams in report.`);

async function testAllMermaid() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    </head>
    <body>
      <div id="container"></div>
      <script>
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
      </script>
    </body>
    </html>
  `;
  await page.setContent(testHtml, { waitUntil: 'networkidle0' });

  for (let i = 0; i < diagrams.length; i++) {
    const d = diagrams[i];
    const renderRes = await page.evaluate(async (code, idx) => {
      try {
        const id = 'diagram_' + idx;
        const { svg } = await mermaid.render(id, code);
        return { success: true, svgLength: svg.length };
      } catch (err) {
        return { success: false, error: err.message || err.toString() };
      }
    }, d, i);
    console.log(`Diagram ${i + 1} (${d.split('\n')[0]}):`, renderRes.success ? `SUCCESS (SVG len ${renderRes.svgLength})` : `FAILED: ${renderRes.error}`);
  }

  await browser.close();
}

testAllMermaid().catch(console.error);
