const fs = require('fs');
const content = fs.readFileSync('scratch/report_preview.html', 'utf8');
console.log('Includes <div class="mermaid">:', content.includes('<div class="mermaid">'));
console.log('Includes class="language-mermaid":', content.includes('class="language-mermaid"'));
console.log('Includes <svg id="mermaid-:', content.includes('id="mermaid-'));
