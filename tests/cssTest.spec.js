import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { DemoHeroPage } from '../pages/DemoHeroPage.js'; 
import { compareScreenshots } from '../utils/compareScreenShots.js';
import { generateHtmlReport as generateTabbedReportHtml } from '../utils/HtmlReport/generateTabbedReport.js';
import { generateHtmlReport  } from '../utils/HtmlReport/htmlReport.js';
import { DemoHeroStyles } from '../utils/cssProperties/DemoHeroStyles.js';
import { generateCssReport } from '../utils/HtmlReport/generateCssReport.js';

const diffDir = './diff_output';
const componentName = 'demoHero';

const viewports = [
//   { name: 'Desktop', htmlGen: generateHtmlReport },
  { name: 'Laptop', htmlGen: generateHtmlReport },
  // { name: 'Tablet', htmlGen: generateHtmlReport },
  // { name: 'Mobile', htmlGen: generateHtmlReport }
].map(view => ({
  ...view,
  expectedPath: `./expected_screenshots/${componentName}/${componentName}${view.name}Figma.png`
}));

const diffResults = Object.fromEntries(viewports.map(({ name }) => [name, { status: 'Pending', diffPixels: null }]));
function normalizeCss(property, value) {
  if (value == null) return value;
  const val = String(value).trim();

  // Normalize rgba(r,g,b,1) -> rgb(r, g, b)
  if (property.toLowerCase().includes('color')) {
    const m = val.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(1|0?\.\d+))?\)$/i);
    if (m) {
      const [, r, g, b, a] = m;
      if (a === undefined || a === '1') return `rgb(${r}, ${g}, ${b})`;
    }
  }

  // Normalize font-family: take first family, strip quotes, lowercase, map aliases
  if (property === 'font-family') {
    const first = val.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
    const aliases = {
      // Add any equivalences you want to treat as equal:
      'graphik': 'graphik lc tt',
      'graphik lc': 'graphik lc tt',
      'sharpgroteskmedium': 'sharp grotesk medium',
      'sharp grotesk medium': 'sharp grotesk medium'
    };
    return aliases[first] || first;
  }

  return val;
}
// SERIAL BLOCK — Ensures tests run one after another
test.describe.serial(`${componentName} VRT Suite`, () => {
  for (const { name: viewport, expectedPath, htmlGen } of viewports) {
    test(`${viewport} - ${componentName} visual should match Figma`, async ({ page }) => {
      const pageObject = new DemoHeroPage(page, viewport);//pass object name
      await pageObject.goto();

      const { cropped } = await pageObject.takeScreenshot();
      pageObject.filePrefix;
      const actualBuffer = fs.readFileSync(cropped);

      const diffPixels = compareScreenshots({
        viewport: `${viewport}`,
        actualBuffer,
        expectedPath,
        actualPath: `${diffDir}/${componentName}${viewport}-actual.png`,
        diffPath: `${diffDir}/${componentName}${viewport}-diff.png`,
        expectedCopyPath: `${diffDir}/${componentName}${viewport}-expected.png`
      });

      htmlGen({
        diffPixels,
        outputDir: diffDir,
        reportPath: `${diffDir}/${componentName}${viewport}-report.html`,
        expectedImage: `${componentName}${viewport}-expected.png`,
        actualImage: `${componentName}${viewport}-actual.png`,
        diffImage: `${componentName}${viewport}-diff.png`,
        pageName: `${componentName} ${viewport}`
      });


 diffResults[viewport] = diffPixels;

      // ------------------------
      // CSS Validation Collection
      // ------------------------
 const testResults = {};

// helper to push a row
const recordCss = (vp, row) => {
  if (!testResults[vp]) testResults[vp] = [];
  testResults[vp].push(row);
};

const testCssProperty = async (element, property, expectedValue, elementName) => {
  // Always read the received value so we can report it even if expected is missing
  const receivedValue = await element.evaluate((el, prop) => {
    try { return window.getComputedStyle(el).getPropertyValue(prop) || ''; }
    catch { return ''; }
  }, property);

  const trimmedValue = (receivedValue || '').trim();

  // Treat missing/undefined expected as a **failure**
  if (expectedValue === undefined || expectedValue === null) {
    const placeholder = '(Undefined)';
    recordCss(viewport, {
      element: elementName,
      property,
      expected: placeholder,
      received: trimmedValue,
      passed: false,
      reason: 'missingExpected'
    });

    console.error(`⚠️ [${viewport}] [${elementName}] [${property}] Missing expected — treating as FAILED. Received: "${trimmedValue}"`);
    return;
  }

        const receivedNorm = normalizeCss(property, receivedValue);
        const expectedNorm = normalizeCss(property, expectedValue);
        const isPassed = receivedNorm === expectedNorm;
  recordCss(viewport, {
    element: elementName,
    property,
    expected: expectedValue,
    received: trimmedValue,
    passed: isPassed,
    reason: 'compare'
  });

  if (isPassed) {
    console.log(`✅ [${viewport}] [${elementName}] [${property}] Passed — Received: "${trimmedValue}", Expected: "${expectedValue}"`);
  } else {
    console.error(`❌ [${viewport}] [${elementName}] [${property}] Failed — Received: "${trimmedValue}", Expected: "${expectedValue}"`);
  }
};

      // -------------
      // CSS assertions
      // -------------
      const expectedTitleStyle = DemoHeroStyles?.Hero?.title?.[viewport];
      const expectedSubtitleStyle = DemoHeroStyles?.Hero?.subtitle?.[viewport];
      const expectedCustomizeButtonStyle = DemoHeroStyles?.Hero?.customizeButton?.[viewport];
      const expectedGetStartedButton = DemoHeroStyles?.Hero?.getStartedButton?.[viewport];
      const expectedButtonGap = DemoHeroStyles?.Hero?.buttonSpace?.[viewport];
      const expectedCardStyle = DemoHeroStyles?.Hero?.CardSize?.[viewport];
      const expectedCardPadding = DemoHeroStyles?.Hero?.cardPadding?.[viewport];

      // Hero Title
      if (expectedTitleStyle) {
        const heroTitle = await page.getByRole('heading', { name: /Advanced customization/i });
        await testCssProperty(heroTitle, 'font-size', expectedTitleStyle.fontSize, 'heroTitle');
        await testCssProperty(heroTitle, 'font-weight', expectedTitleStyle.fontWeight, 'heroTitle');
        await testCssProperty(heroTitle, 'font-family', expectedTitleStyle.fontFamily, 'heroTitle');
        await testCssProperty(heroTitle, 'color', expectedTitleStyle.color, 'heroTitle');
        await testCssProperty(heroTitle, 'line-height', expectedTitleStyle.lineHeight, 'heroTitle');
        await testCssProperty(heroTitle, 'padding-top', expectedTitleStyle.paddingTop, 'heroTitle');
      }

      // Hero Subtitle
      if (expectedSubtitleStyle) {
        const heroSubtitle = await page.getByText('Shape and configure your own');
        await testCssProperty(heroSubtitle, 'font-size', expectedSubtitleStyle.fontSize, 'heroSubtitle');
        await testCssProperty(heroSubtitle, 'font-weight', expectedSubtitleStyle.fontWeight, 'heroSubtitle');
        await testCssProperty(heroSubtitle, 'font-family', expectedSubtitleStyle.fontFamily, 'heroSubtitle');
        await testCssProperty(heroSubtitle, 'color', expectedSubtitleStyle.color, 'heroSubtitle');
        await testCssProperty(heroSubtitle, 'line-height', expectedSubtitleStyle.lineHeight, 'heroSubtitle');
        await testCssProperty(heroSubtitle, 'margin-top', expectedSubtitleStyle.lmarginTop, 'heroSubtitle');
      }

      // Get Started Button
      if (expectedGetStartedButton) {
        const GetStartedButton = await page.getByRole('button', { name: 'Get Started' });
        await testCssProperty(GetStartedButton, 'font-size', expectedGetStartedButton.fontSize, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'font-weight', expectedGetStartedButton.fontWeight, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'font-family', expectedGetStartedButton.fontFamily, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'color', expectedGetStartedButton.color, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'line-height', expectedGetStartedButton.lineHeight, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'text-align', expectedGetStartedButton.textAlign, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'height', expectedGetStartedButton.height, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'width', expectedGetStartedButton.width, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'border-bottom-right-radius', expectedGetStartedButton.borderBottomRightRadius, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'border-bottom-left-radius', expectedGetStartedButton.borderBottomLeftRadius, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'border-top-right-radius', expectedGetStartedButton.borderTopRightRadius, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'border-top-left-radius', expectedGetStartedButton.borderTopLeftRadius, 'GetStartedButton');
        await testCssProperty(GetStartedButton, 'background-color', expectedGetStartedButton.backgroundColor, 'GetStartedButton');
      }

      // -----------------
      // Visual assertion
      // -----------------
      try {
        diffResults[viewport] = { status: 'Passed', diffPixels };
        expect(diffPixels).toBeLessThan(10000);
      } catch (err) {
        diffResults[viewport] = { status: 'Failed', diffPixels };
        console.error(`❌ ${viewport} test failed`, err.message);
      }

      // -----------------
      // Summary Log (per viewport)
      // -----------------
      for (const [vp, results] of Object.entries(testResults)) {
        console.log(`\n=== ✅❌ Test Summary for Viewport: ${vp} ===`);
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => r.passed === false).length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);

        if (failed > 0) {
          console.log(`\n--- ❌ Failed Details ---`);
          results
            .filter(r => !r.passed)
            .forEach(r => {
              console.log(`[${r.element}] [${r.property}] — Received: "${r.received}", Expected: "${r.expected}"`);
            });
        }
      }

      // -----------------------------
      // Persist CSS results (per viewport)
      // -----------------------------
      const cssDir = path.resolve(diffDir, 'css');
      fs.mkdirSync(cssDir, { recursive: true });
      fs.writeFileSync(
        path.join(cssDir, `demoHero-${viewport}-css.json`),
        JSON.stringify(testResults[viewport] || [], null, 2)
      );

      // -----------------------------------------------
      // Generate per-viewport visual report (with link)
      // -----------------------------------------------
      htmlGen({
        diffPixels,
        outputDir: diffDir,
        reportPath: `${diffDir}/demoHero${viewport}-report.html`,
        pageName: `Demo Hero ${viewport}`,
        // This is consumed by the base template via downstream generators
        cssReportPath: `./demoHeroCSSReport.html`
      });
    });
  }
  test.afterAll(async () => {
    // 1) Tabbed multi-viewport visual report
    const reportPath = path.resolve('./diff_output/demoHeroMultiViewportReport.html');
    console.log('📊 Generating tabbed multi-viewport report...');

     const tabbedData = viewports.map(({ name }) => ({
      name,
      diffPixels: diffResults[name].diffPixels ?? 'Failed',
      expectedImage: `${componentName}${name}-expected.png`,
      actualImage: `${componentName}${name}-actual.png`,
      diffImage: `${componentName}${name}-diff.png`
    }));

    generateTabbedReportHtml({
      outputDir: diffDir,
      reportPath,
      pageName: 'Demo Hero',
      viewports: tabbedData,
      cssReportPath: './demoHeroCSSReport.html'
    });

    // Optionally open the tabbed visual report
    if (fs.existsSync(reportPath)) {
      const openCmd =
        process.platform === 'win32'
          ? `start "" "${reportPath}"`
          : process.platform === 'darwin'
            ? `open "${reportPath}"`
            : `xdg-open "${reportPath}"`;

      await new Promise(resolve =>
        exec(openCmd, err => {
          if (err) console.warn('⚠️ Failed to open browser:', err.message);
          else console.log('✅ Opened visual report in browser');
          resolve(true);
        })
      );
    }

    // 2) Combined CSS report (aggregates per-viewport JSON)
    const cssDir = path.resolve(diffDir, 'css');
    const cssReportPath = path.resolve(diffDir, 'demoHeroCSSReport.html');

    const vpNames = ['Laptop', 'Mobile'];
    const cssViewports = vpNames.map(name => {
      const file = path.join(cssDir, `demoHero-${name}-css.json`);
      let results = [];
      if (fs.existsSync(file)) {
        results = JSON.parse(fs.readFileSync(file, 'utf-8'));
      }
      return { name, results };
    });

    generateCssReport({
      outputDir: diffDir,
      reportPath: cssReportPath,
      pageName: 'Demo Hero CSS Report',
      viewports: cssViewports
    });
  });
});
