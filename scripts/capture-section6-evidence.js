const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = process.env.BIZTRACK_BASE_URL || "http://127.0.0.1:4173";
const EVIDENCE_DIR = path.join(process.cwd(), "deployment", "evidence");
const SHOULD_CAPTURE_COVERAGE = process.env.CAPTURE_COVERAGE !== "0";

async function saveScreenshot(page, filename, options = {}) {
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, filename),
    fullPage: options.fullPage ?? true,
  });
}

async function withPage(browser, setup, callback) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 1,
  });

  if (setup) {
    await setup(context);
  }

  const page = await context.newPage();
  await callback(page);
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  try {
    await withPage(browser, null, async (page) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".cookie-banner", { timeout: 10000 });
      await saveScreenshot(page, "cookie-banner.png");
    });

    await withPage(
      browser,
      async (context) => {
        await context.addInitScript(() => {
          localStorage.setItem("bizTrackLanguage", "zh");
          localStorage.setItem(
            "bizTrackCookieConsent",
            JSON.stringify({ decision: "accepted", savedAt: new Date().toISOString() })
          );
        });
      },
      async (page) => {
        await page.goto(`${BASE_URL}/products.html`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".language-switcher", { timeout: 10000 });
        await page.getByText("产品", { exact: true }).first().waitFor({ timeout: 10000 });
        await saveScreenshot(page, "i18n-chinese-products.png");
      }
    );

    await withPage(
      browser,
      async (context) => {
        await context.addInitScript(() => {
          localStorage.setItem("bizTrackLanguage", "zh");
          localStorage.setItem(
            "bizTrackCookieConsent",
            JSON.stringify({ decision: "accepted", savedAt: new Date().toISOString() })
          );
        });
      },
      async (page) => {
        await page.goto(`${BASE_URL}/help.html`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".language-switcher", { timeout: 10000 });
        await page.getByText("BizTrack 快速使用指南", { exact: true }).waitFor({
          timeout: 10000,
        });
        await saveScreenshot(page, "i18n-chinese-help.png");
      }
    );

    await withPage(
      browser,
      async (context) => {
        await context.addInitScript(() => {
          localStorage.setItem(
            "bizTrackCookieConsent",
            JSON.stringify({ decision: "accepted", savedAt: new Date().toISOString() })
          );
        });
      },
      async (page) => {
        await page.goto(`${BASE_URL}/privacy.html`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".privacy-panel", { timeout: 10000 });
        await saveScreenshot(page, "privacy-policy.png");
      }
    );

    if (SHOULD_CAPTURE_COVERAGE) {
      await withPage(browser, null, async (page) => {
        await page.goto(`${BASE_URL}/coverage/index.html`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".coverage-summary", { timeout: 10000 });
        await saveScreenshot(page, "coverage-report.png");
      });
    }
  } finally {
    await browser.close();
  }

  console.log(`Section 6 screenshots written to ${EVIDENCE_DIR}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
