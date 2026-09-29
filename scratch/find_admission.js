const fs = require('fs');
const content = fs.readFileSync('frontend/js/views-students.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('admission') || l.includes('Admission') || l.includes('Admit') || l.includes('renderStudents')) {
    console.log(`${i+1}: ${l.trim().substring(0, 120)}`);
  }
});
