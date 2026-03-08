const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  page.on('pageerror', err => {
    console.log('UNCAUGHT PAGE ERROR:', err.toString());
  });

  await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  
  await browser.close();
})();
