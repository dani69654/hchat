import puppeteer from 'puppeteer';
import { getBaseBrowserArgs, getBrowserExecutablePath } from './browser';

/**
 * Where the Tor SOCKS5 proxy lives. Defaults to the local daemon; overridable
 * via env so a Tor sidecar container (docker compose --profile tor) works too.
 */
export const getTorSocksAddress = (): string => {
  const host = process.env.HCHAT_TOR_HOST || '127.0.0.1';
  const port = process.env.HCHAT_TOR_PORT || '9050';
  return `${host}:${port}`;
};

/**
 * Returns Puppeteer args for Tor SOCKS5 proxy.
 */
export function getTorPuppeteerArgs() {
  return [`--proxy-server=socks5://${getTorSocksAddress()}`];
}

/**
 * Checks if Tor is working by visiting check.torproject.org via Puppeteer.
 * Returns true if Tor is detected, false otherwise.
 */
export const checkTorConnection = async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: getBrowserExecutablePath(),
      args: [...getBaseBrowserArgs(), ...getTorPuppeteerArgs()],
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
