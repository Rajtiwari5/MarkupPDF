const readFiles = require('./readFiles');
const prepareHtml = require('./prepareHtml');
const generatePdf = require('./generatePdf');
const cleanup = require('./cleanup');
const cache = require('../cache');
const pagePool = require('../page-pool');

async function handleConvert(req, res, baseUrl) {
  const start = Date.now();
  let pageInfo;

  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    const { html: rawHtml, css } = await readFiles.readAndCategorize(req.files);
    if (!rawHtml.trim() && !css.trim()) return res.status(400).json({ error: 'No valid files' });

    const html = prepareHtml.prepareHtml(rawHtml, css);

    const cacheKey = cache.generateKey(html);
    const cachedPdfPath = cache.getCachedPdf(cacheKey);
    if (cachedPdfPath) {
      await cleanup.cleanupUploads(req.files);
      return res.json({ success: true, cached: true, timeTakenMs: Date.now() - start, downloadUrl: `${baseUrl}/pdf-cache/${cacheKey}.pdf` });
    }

    const result = await generatePdf.generatePdfFromHtml(html);
    pageInfo = result.pageInfo;

    res.json({ success: true, cached: result.cached, timeTakenMs: Date.now() - start, downloadUrl: `${baseUrl}/pdf-cache/${result.cacheKey}.pdf` });

    setImmediate(async () => {
      cleanup.releasePage(pageInfo);
      await cleanup.cleanupUploads(req.files);
    });

  } catch (err) {
    console.error('Error:', err);
    if (pageInfo) await pagePool.closePage(pageInfo.id);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
}

module.exports = handleConvert;
