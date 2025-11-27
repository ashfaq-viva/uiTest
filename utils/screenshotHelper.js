// utils/ScreenshotHelper.js
import { maskEverythingExcept, cropWhiteMargins } from './domUtils.js';
import { disableAnimations,disableLazyRender } from './disableAnimations.js';
export class ScreenshotHelper {
  constructor(page, viewport, {
    selector,
    filePrefix,
    scrollBlock = 'center',
    diffDir = './diff_output',
    waitAfterScroll = 1000
  }) {
    this.page = page;
    this.viewport = viewport;
    this.selector = selector;
    this.filePrefix = filePrefix;
    this.scrollBlock = scrollBlock;
    this.diffDir = diffDir;
    this.waitAfterScroll = waitAfterScroll;
  }

  async capture(viewportSizes) {
    const size = viewportSizes[this.viewport];
    await this.page.setViewportSize(size);

    await disableLazyRender(this.page);
  
    const maskedFullPagePath = `${this.diffDir}/${this.filePrefix}${this.viewport}-masked-full.png`;
    const croppedElementPath = `${this.diffDir}/${this.filePrefix}${this.viewport}.png`;

    await this.page.waitForSelector(this.selector, { timeout: 20000 });
    await this.page.$eval(this.selector, (el, block) =>
      el.scrollIntoView({ behavior: 'instant', block }),
      this.scrollBlock
    );

    await this.page.waitForTimeout(this.waitAfterScroll);
    await this.page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });
await this.page.waitForTimeout(2000)
    await maskEverythingExcept(this.page, this.selector);
    await this.page.waitForTimeout(this.waitAfterScroll);

    const elementHandle = await this.page.$(this.selector);
    await this.page.emulateMedia({ reducedMotion: 'reduce' });
    await elementHandle.screenshot({ path: maskedFullPagePath });

    await cropWhiteMargins(maskedFullPagePath, croppedElementPath);

    return {
      full: maskedFullPagePath,
      cropped: croppedElementPath
    };
  }
}
