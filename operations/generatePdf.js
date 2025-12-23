const path = require('path');
const cache = require('../cache');
const pagePool = require('../page-pool');

async function generatePdfFromHtml(html) {
  const cacheKey = cache.generateKey(html);
  const cachedPdfPath = cache.getCachedPdf(cacheKey);
  if (cachedPdfPath) return { cached: true, cacheKey, pdfPath: cachedPdfPath };

  const pdfPath = path.join(cache.CACHE_DIR, `${cacheKey}.pdf`);
  let pageInfo;
  try {
    pageInfo = await pagePool.getPage();
    await pageInfo.page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });
    await pageInfo.page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true, margin: 'none' });
    await cache.saveToCache(cacheKey, pdfPath);
    return { cached: false, cacheKey, pdfPath, pageInfo };
  } catch (err) {
    if (pageInfo) await pagePool.closePage(pageInfo.id);
    throw err;
  }
}

module.exports = { generatePdfFromHtml };
