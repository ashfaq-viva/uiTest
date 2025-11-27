// utils/freezePageState.js

export async function freezePageState({
  page,
  waitBeforeFreeze = 1000,
  outputDir = './diff_output',
  screenshotName = 'component',
}) {

  // Wait for any transition/animation
  if (waitBeforeFreeze > 0) {
    await page.waitForTimeout(waitBeforeFreeze);
  }

  // Freeze rendering and JavaScript execution
  await page.evaluate(() => {
    debugger; // freezes JS execution, like in DevTools
  });

}
