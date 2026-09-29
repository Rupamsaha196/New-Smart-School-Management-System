const fs = require('fs');
const content = fs.readFileSync('frontend/js/views-operations.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('renderLibrary') || l.includes('issue') || l.includes('Issue') || l.includes('book_issues') || l.includes('library/books')) {
    console.log(`${i+1}: ${l.trim().substring(0, 120)}`);
  }
});
