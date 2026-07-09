import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // whatsapp-web.js drives a real Chromium via Puppeteer; neither can be bundled.
  serverExternalPackages: ['whatsapp-web.js', 'puppeteer'],
};

export default nextConfig;
