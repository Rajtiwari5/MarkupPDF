const puppeteer = require("puppeteer");
const { v4: uuid } = require("uuid");

const MAX_PAGES = 20;
const pages = new Map();
const availablePages = [];
let browser;

async function init() {
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage"
    ]
  });
  // Pre-create a small pool of pages to reduce first-request latency (TTFB)
  try {
    const warmPages = Math.min(3, MAX_PAGES);
    for (let i = 0; i < warmPages; i++) {
      const id = await _makePage();
      availablePages.push(id);
    }
  } catch (e) {
    // non-fatal: continue without warm pages
    console.warn('Warning warming pages:', e && e.message);
  }
}

function _makePage() {
  return (async () => {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);

    page.on("request", req => {
      const t = req.resourceType();
      if (t === "image" || t === "font" || t === "media") req.abort();
      else req.continue();
    });

    const id = uuid();
    pages.set(id, page);
    return id;
  })();
}

function getPage() {
  return new Promise(async (resolve) => {
    // If there's an available page, return it immediately
    if (availablePages.length) {
      const id = availablePages.pop();
      return resolve({ id, page: pages.get(id) });
    }

    // If we can create a new page, do so lazily to avoid heavy startup
    if (pages.size < MAX_PAGES) {
      const id = await _makePage();
      return resolve({ id, page: pages.get(id) });
    }

    // Otherwise wait for a returned page (poll briefly)
    const check = () => {
      if (availablePages.length) {
        const id = availablePages.pop();
        resolve({ id, page: pages.get(id) });
      } else setTimeout(check, 5);
    };
    check();
  });
}

async function returnPage(id) {
  const page = pages.get(id);
  if (!page) return;

  try {
    await page.goto('about:blank');
  } catch {
    await page.close();
    pages.set(id, await browser.newPage());
  }

  availablePages.push(id);
}

async function closePage(id) {
  const page = pages.get(id);
  if (page) {
    await page.close();
    pages.set(id, await browser.newPage());
    availablePages.push(id);
  }
}

async function shutdown() {
  if (browser) await browser.close();
}

module.exports = { init, getPage, returnPage, closePage, shutdown };
