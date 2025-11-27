# 🎯 Visual Regression Testing Framework

This project provides a fully automated **visual regression testing pipeline** using:

- ✅ [Playwright](https://playwright.dev/) for browser automation
- ✅ Screenshots from your **live web app**
- ✅ Baseline UI designs exported directly from **Figma**
- 🧪 Pixel-by-pixel comparison with a beautifully generated HTML report

---
## 🌟 Features
🎯 Core Comparison Capabilities
Locator-based comparison: Use any CSS/XPath selector to compare with expected Figma design
Masking support: Compare only selected areas by masking specific locators
Optional cropElement: Crop only selected elements if specified
Auto-crop white margins: Automatically trims empty space after margins
Auto-crop and diff alignment: Ensures matching dimensions before comparison
Scroll-to-bottom support: Renders full page content before capturing

🧪 Screenshot & Diff Engine
Capture actual screenshots from live production or staging environments
Pull baseline screenshots directly via Figma API
Upload expected and actual images manually to generate diffs
HTML report with side-by-side view: Shows Expected / Actual / Diff comparison
Pixel-level diffing across multiple viewports
Figma frame export for precise baseline generation

🧼 Testing Enhancements
CSS property validation: Validate specific CSS styles of selected elements
Optimized test specs: Cleaner, modular spec.js for easier maintenance
Modular test structure: Reusable across different pages, modules, and devices

🚀 DevOps Ready
Dockerized setup: Run the complete toolchain in a containerized environment
CI/CD integration: Easily plug into your continuous testing pipeline

---

## 📦 Prerequisites

Make sure you have the following installed:

- [Node.js v18+, preferred to use v20.17.0](https://nodejs.org/en/download/)
- Git
- A Figma personal access token (for downloading design baselines) and you should have page export permission

---
# 🔧 Initial Project Setup to run

1. clone the repo  -- git clone "https://github.com/ashfaq-viva/uiTest"
2. Open repo in vs code & pull the latest code from main branch
3. run in terminal "npm install"
4. run in terminal "npx playwright install"
5. now create a .env file in project root
6. In .env file add 
    BASE_URL=(site url)
    FIGMA_TOKEN=(Your token)
    FIGMA_FILE_KEY=(your figma file key)

7. If want download image from figma then 
    - create access token from figma your profile of figma
    - then open the figma file after opening the figma file from url copy the file key the file key is in the url copy the key after the / of design e.g "ADFEWwafdafaf"
    - paste that in .env file FIGMA_TOKEN=(Your token)
    - click the frame you want to export then copy the node id from url which will be like "2140-24879" paste that in figma.config.js what ever the file name is given it creates a folder with that name if nem is testDesktop then the file name will be test/testDesktopFigma.png inside expected_screenshots (viewport like Desktop,Laptop,Tablet,Mobile) check that in utils/viewports.js
                nodes: {
              testDesktop: '5214:24158'← Add ":" between nodes instead of "-"
            };
8. Run "npm run figma:download"


📂 Folder Structure should be like below

        expected_screenshots/
        ├── test/testDesktopFigma.png                  
              ├/testDesktop.json  

9. if you want to manually save from figma and want to get the results then create a folder with name expected_screenshots and inside gmake folder name with test and inside that make a file with name test{Viewport}Figma.png (viewport like Desktop,Laptop,Tablet,Mobile) check that in utils/viewports.js

10. to see browser view go playwright.config.js make headless: false
11. follow pages/TestPage.js for example for new creation of pages
12. run any test with command and root for example :  npx playwright test "./tests/visualTry/test.spec.js"

13. if you want to manually upload your actual result then provide the actual result in in project root create a folder manualScreenshots then inside that paste the file with name  "test{Viewport}-actual.png" (viewport like Desktop,Laptop,Tablet,Mobile) check that in utils/viewports.js

14. To run specific test --- npx playwright test "./tests/<filename>"

- for any support contact throught email or phone number- 
  Email-ashfaqahmed3339@gmail.com
  PN-01711317553

---

## 🔧 Project Structure


``` open the HTML report directly after test run:
start diff_output/report.html     # On Windows
open diff_output/report.html      # On macOS

npx playwright test "./tests/visualTry/test.spec.js"

📂 Folder Structure

playwright-visual-regression/
├── figma/                        # Download baseline from Figma
│   └── download.ts
│
├── pages/                        # Page Object Models (e.g. TestPage)
│   └── testPage.ts
│
├── tests/               # Playwright test specs
│   └── test.spec.ts
│
├── utils/                       # Reusable helpers
│   ├── common/scrollUtils.ts   # Page scroll logic
│   ├── compareScreenshots.ts   # Core pixel comparison logic
│   └── htmlReport/...     # HTML report templates per product/module
│   └── ...
├── expected_screenshots/       # Baseline images from Figma
│
├── diff_output/                # Diff results, actuals,expeted, HTML report


## 🧪 How to Add a New Module (e.g., Checkout Page)

Follow these steps to integrate and test a new module against Figma designs:

---

### 🔧 1. Setup Environment

## Create a `.env` file (if it doesn’t exist already) in the project root and add:

```env
FIGMA_TOKEN=your_figma_access_token
FIGMA_FILE_KEY=your_figma_file_key
BASE_URL=https://your-app-url.com

## 🎨 2. Add Baseline Frame in Figma
Open your module frame in Figma (e.g., Checkout).
Copy the fileKey and nodeId from the URL.

```Update the figma.config.ts file:

nodes: {
  checkoutDestop: '7319:12653' // ← Add new module here
};

## 📸 3. Download Baseline Screenshot
Run the following command to pull the baseline image from Figma:

```npm run figma:download
📁 Output: expected_screenshots/checkout/baseline.png

##🧭 4. Add Page Slug
In the pages/ directory:

Create or update a file like checkout.ts
Define navigation, rendering logic, and slug routing

Note: if you want to add actual screenshot manually then you dont need this page file

##🧱 5. Create Page Object (Optional)
If the module requires custom actions or reusable locators:

Add a new file in pageObjects/ (e.g., CheckoutPage.ts)
Define helper methods or locators

##🧪 6. Write the Test Spec
In the tests/ or specs/ folder:

Add a file like checkout.spec.js
Follow the pattern of existing tests to compare actual vs. expected screenshots
Use utilities like compareScreenshots() for visual diffing

##📊 7. Update HTML Report (Optional)
To enhance viewport-specific diff reporting:

Edit the utils/htmlReport logic
The generated report will show pixel differences across viewports

## 8. CSS validation
to add css validation

make yours like in utils/selectors

follow tests/cssValidation.spec.js file for more clearity

## License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.