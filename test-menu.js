const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createContext({
    viewport: { width: 375, height: 812 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'menu-mobile.png' });
    console.log('Screenshot taken');
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await browser.close();
})();
