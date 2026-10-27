import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let totalBytes = 0;
  page.on('response', async (response) => {
    const type = response.request().resourceType();
    console.log(response.url(), type);
    try {
      const body = await response.body();
      totalBytes += body.length;
      console.log('Size:', body.length);
    } catch(e) {
      console.log('Error getting body:', e.message);
    }
  });

  await page.goto('file://' + process.cwd() + '/package.json', { waitUntil: 'networkidle' });
  console.log('Total bytes:', totalBytes);
  await browser.close();
})();
