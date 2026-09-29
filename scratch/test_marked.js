const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testMarked() {
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
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    </head>
    <body>
      <div id="out"></div>
      <script>
        const r = new marked.Renderer();
        r.code = function(token, language) {
          console.log('r.code called with:', typeof token, JSON.stringify(token), language);
          const text = typeof token === 'object' ? token.text : token;
          const lang = typeof token === 'object' ? token.lang : language;
          if (lang === 'mermaid') {
            return '<div class="mermaid">' + text + '</div>';
          }
          return '<pre><code>' + text + '</code></pre>';
        };
        marked.setOptions({ renderer: r });
        const res = marked.parse('\\\`\\\`\\\`mermaid\\ngraph TD\\nA-->B\\n\\\`\\\`\\\`');
        document.getElementById('out').innerHTML = res;
      </script>
    </body>
    </html>
  `;
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  await page.setContent(testHtml, { waitUntil: 'load' });
  const html = await page.$eval('#out', el => el.innerHTML);
  console.log('Rendered HTML:', html);
  await browser.close();
}

testMarked().catch(console.error);
