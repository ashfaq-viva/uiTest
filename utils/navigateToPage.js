// utils/navigateToPage.js
import dotenv from 'dotenv';
dotenv.config();
import { disableAnimations,disableLazyRender } from './disableAnimations.js';
import { scrollPage ,scrollPageByPixel} from './scrollUtils.js';
import { acceptCookiesIfVisible} from './cookies.js';

/**
 * Navigates to a specific path on the base URL and waits for network to settle.
 * @param {import('playwright').Page} page - The Playwright page object.
 * @param {string} slug - The path after BASE_URL (e.g., "/home" or "/capabilities/authentication")
 * @param {Object} [options]
 * @param {string} [options.selector] - Optional selector to wait for
 * @param {number} [options.timeout] - Timeout to wait for selector
 */
export async function goToPage(page, slug, options = {}) {
  const {
    // selector,
    timeout = 20000,
    disableAnimation = true,
    scroll= false
  } = options;
// await page.addInitScript(() => {
//   // same shim as in the function (or call forceLoadAllMedia which already installed it)
// });
  const url = `${process.env.BASE_URL}${slug}`;
  await page.goto(url, { waitUntil: 'networkidle' });
await disableLazyRender(page, { timeout: 5000 });
  if (disableAnimation) {
    await disableAnimations(page);
  }
  // if (disableLazyRender) {
  //   await disableLazyRender(page);
  // }
  // if(scroll){
  //   await scrollPageByPixel(page);
  // }
await acceptCookiesIfVisible(page);
  // if (selector) {
  //   await page.waitForSelector(selector, { timeout });
  // }
}
