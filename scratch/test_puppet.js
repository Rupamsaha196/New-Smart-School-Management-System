const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outHtmlPath = path.resolve(__dirname, 'report_preview.html');

async function testRender() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--allow-file-access-from-files']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  const fileUrl = 'file:///' + outHtmlPath.replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });

  const result = await page.evaluate(async () => {
    if (typeof mermaid === 'undefined') {
      return { error: 'Mermaid is undefined! CDN failed to load' };
    }
    const elements = document.querySelectorAll('.mermaid');
    console.log('Found .mermaid count:', elements.length);
    let success = false;
    try {
      await window.renderAll();
      success = true;
    } catch (e) {
      return { error: e.toString() };
    }
    const svgs = document.querySelectorAll('svg');
    return {
      mermaidCount: elements.length,
      svgCount: svgs.length,
      success
    };
  });

  console.log('EVAL RESULT:', result);
  await browser.close();
}

testRender().catch(console.error);
