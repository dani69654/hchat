/**
 * Puppeteer/Chromium launch settings that vary by environment.
 * Inside the Docker image, HCHAT_NO_SANDBOX=1 and PUPPETEER_EXECUTABLE_PATH
 * are set so whatsapp-web.js drives the system Chromium without a sandbox
 * (containers don't provide the kernel features Chromium's sandbox needs).
 */

export const getBaseBrowserArgs = (): string[] =>
  process.env.HCHAT_NO_SANDBOX === '1'
    ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    : [];

export const getBrowserExecutablePath = (): string | undefined =>
  process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
