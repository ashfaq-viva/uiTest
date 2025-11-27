import { defineConfig } from '@playwright/test';
const isCI = !!process.env.CI;

export default defineConfig({
  globalSetup: './utils/global-setup.js', 
  workers: isCI ? 1 : 3,
  testDir: './tests',
  timeout: 120000,
  // reporter: 'html',
  use: {
    navigationTimeout: 180000,
    actionTimeout: 60000,
    screenshot: 'only-on-failure',
    trace: 'off',
    viewport: null,
    ignoreHTTPSErrors: true,
    launchOptions: {
      headless: false,
      slowMo: 1000 ,
      args: [
        
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
  '--enable-gpu',
  '--disable-software-rasterizer',
  '--enable-zero-copy',
  '--disable-gpu-sandbox',
  '--force-device-scale-factor=1',
  '--disable-gpu-driver-bug-workarounds'
        // CORS Error Fix
        // '--disable-web-security',
        // '--disable-features=IsolateOrigins,site-per-process',
        // '--allow-running-insecure-content',
        // '--disable-site-isolation-trials',
        // '--ignore-certificate-errors',
        // '--unsafely-treat-insecure-origin-as-secure=https://strapi-frontend-stage-2025-06-12-v1.nl-k8s-stage.srv.local'
      ]
    }
  }
});
