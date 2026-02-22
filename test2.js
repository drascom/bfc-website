const fs = require('fs');
const jsdom = require('jsdom');

const html = fs.readFileSync('v2/booking.html', 'utf8');
const js = fs.readFileSync('v2/js/main.js', 'utf8');

const dom = new jsdom.JSDOM(html, {
    url: 'http://localhost:5173/v2/booking.html?from=LTN&to=CWL&departure_date=2026-02-25&source=hero',
    runScripts: "dangerously",
    resources: "usable"
});

dom.window.IntersectionObserver = class { observe() { } unobserve() { } disconnect() { } };

dom.window.eval(js);

// Since js is eval'd AFTER DOM is created, we trigger the DOMContentLoaded manually just in case
const event = new dom.window.Event('DOMContentLoaded');
dom.window.document.dispatchEvent(event);

console.log("Step 1:", dom.window.document.querySelector('[data-quote-step="1"]').className);
console.log("Step 2:", dom.window.document.querySelector('[data-quote-step="2"]').className);
console.log("Step 1 hidden:", dom.window.document.querySelector('[data-quote-step="1"]').classList.contains('is-hidden'));
console.log("Step 2 hidden:", dom.window.document.querySelector('[data-quote-step="2"]').classList.contains('is-hidden'));

if (dom.window.document.querySelector('.form-captcha')) {
    console.log('Captcha is successfully injected in Step 2.');
}
console.log("Step 1 from:", dom.window.document.querySelector('#book_start_from').value);
console.log("Step 2 from:", dom.window.document.querySelector('#book_from').value);
