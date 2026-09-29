const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testMermaid() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    </head>
    <body>
      <div class="mermaid">
      flowchart TD
          A[Start] --> B{Is Valid?}
          B -->|Yes| C[Success]
          B -->|No| D[Error]
      </div>
      <script>
        mermaid.initialize({ startOnLoad: true });
      </script>
    </body>
    </html>
  `;
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  await page.setContent(testHtml, { waitUntil: 'networkidle0' });
  const svgCount = await page.$$eval('svg', els => els.length);
  console.log('Generated SVGs count:', svgCount);
  await browser.close();
}

testMermaid().catch(console.error);
