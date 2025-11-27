import { ScreenshotHelper } from '../utils/screenshotHelper.js';
import { getEnabledViewports } from '../utils/viewPorts.js';
import { goToPage } from '../utils/navigateToPage.js';
import { Slug } from '../utils/slug.js'
import { Selectors } from '../utils/selectors/selectors.js'; //provide correct import path

const viewportSizes = getEnabledViewports(4);

export class DemoHeroPage {
  constructor(page, viewport) {
    this.page = page;
    this.viewport = viewport;
    this.selector = Selectors.demoHero; 
    this.filePrefix = 'demoHero';
    this.slug = Slug.demoHero; // Adjust this to your actual page slug
  }

  async goto() {
    await goToPage(this.page, this.slug, {
      selector: this.selector,
      timeout: 20000
    });
  }

  async takeScreenshot() {
    const helper = new ScreenshotHelper(this.page, this.viewport, {
      selector: this.selector,
      filePrefix: this.filePrefix,
      scrollBlock: 'center',
    });

    return await helper.capture(viewportSizes);
  }
}
