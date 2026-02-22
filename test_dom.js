const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('v2/booking.html', 'utf8');
const js = fs.readFileSync('v2/js/main.js', 'utf8');

const dom = new JSDOM(html, {
  url: 'http://localhost:5173/v2/booking.html?from=LTN&to=CWL&departure_date=2026-02-25&source=hero',
  runScripts: "dangerously"
});

// Mock IntersectionObserver
dom.window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

dom.window.eval(js);

dom.window.document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log("Step 1:", dom.window.document.querySelector('[data-quote-step="1"]').className);
    console.log("Step 2:", dom.window.document.querySelector('[data-quote-step="2"]').className);
  }, 100);
});

const errors = [];
dom.window.console.error = (msg) => errors.push(msg);
if (errors.length) console.log('Errors:', errors);
