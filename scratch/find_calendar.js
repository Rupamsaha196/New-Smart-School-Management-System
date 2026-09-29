const fs = require('fs');
const content = fs.readFileSync('frontend/js/views-academics.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
  if (l.includes('Calendar') || l.includes('calendar') || l.includes('add-event') || l.includes('Event') || l.includes('renderAnnualCalendar')) {
    console.log(`${i+1}: ${l.trim().substring(0, 120)}`);
  }
});
