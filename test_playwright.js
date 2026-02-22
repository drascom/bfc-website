const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  await page.goto('http://localhost:5173/v2/booking.html?from=LTN+-+London+Luton+%28London%2C+UK%29&to=NCL+-+Newcastle+International+Airport+%28Newcastle%2C+UK%29&departure_date=2026-02-25&source=hero', { waitUntil: 'networkidle' });

  const step1Class = await page.$eval('[data-quote-step="1"]', el => el.className);
  const step2Class = await page.$eval('[data-quote-step="2"]', el => el.className);
  
  const fromValue1 = await page.$eval('#book_start_from', el => el.value);
  const fromValue2 = await page.$eval('#book_from', el => el.value);

  console.log('Step 1 Class:', step1Class);
  console.log('Step 2 Class:', step2Class);
  console.log('Step 1 From:', fromValue1);
  console.log('Step 2 From:', fromValue2);

  await browser.close();
})();
