import puppeteer from 'puppeteer';

/**
 * Returns Puppeteer args for Tor SOCKS5 proxy.
 */
export function getTorPuppeteerArgs() {
  return ['--proxy-server=socks5://127.0.0.1:9050'];
}

/**
 * Checks if Tor is working by visiting check.torproject.org via Puppeteer.
 * Returns true if Tor is detected, false otherwise.
 */
export const checkTorConnection = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: getTorPuppeteerArgs(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto('https://check.torproject.org', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const isUsingTor = await page.evaluate(() => {
      return document.body.innerText.includes('Congratulations. This browser is configured to use Tor');
    });
    await browser.close();
    return isUsingTor;
  } catch (err) {
    if (browser) await browser.close();
    return false;
  }
};
