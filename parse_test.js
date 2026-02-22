const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('v2/booking.html', 'utf8');
const dom = new JSDOM(html, {
  url: 'http://localhost:5173/v2/booking.html?from=LTN&to=CWL&departure_date=2026-02-25&source=hero',
  runScripts: "dangerously"
});

// We need to provide the main.js script contents manually to the virtual dom or let it load it.
