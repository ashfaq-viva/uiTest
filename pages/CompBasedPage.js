import { ScreenshotHelper } from '../utils/screenshotHelper.js';
import { getEnabledViewports } from '../utils/viewPorts.js';
import { goToPage } from '../utils/navigateToPage.js';
import { Slug } from '../utils/slug.js'
import { Selectors } from '../utils/selectors/selectors.js'; 

const viewportSizes = getEnabledViewports(4);

export class CompBasedPage {
  constructor(page, viewport) {
    this.page = page;
    this.viewport = viewport;
    this.selector = Selectors.videoCard; 
    this.filePrefix = 'videoCard';
    this.slug = Slug.home; // Adjust this to your actual page slug
  }

  async goto() {
    await goToPage(this.page, this.slug);
  }

  async takeScreenshot() {
    const helper = new ScreenshotHelper(this.page, this.viewport, {
      selector: this.selector,
      filePrefix: this.filePrefix,
      scrollBlock: 'center',
      block:'Start',
    });

    return await helper.capture(viewportSizes);
  }
}
