const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CACHE_DIR = path.join(__dirname, "pdf-cache");

// Ensure cache directory exists
fs.mkdirSync(CACHE_DIR, { recursive: true });

/**
 * Generate hash from HTML content
 */
function generateKey(html) {
  return crypto
    .createHash("sha256")
    .update(html)
    .digest("hex");
}

/**
 * Check if PDF exists in cache
 */
function getCachedPdf(hash) {
  const filePath = path.join(CACHE_DIR, `${hash}.pdf`);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

/**
 * Save PDF to cache
 */
async function saveToCache(hash, pdfPath) {
  const cachePath = path.join(CACHE_DIR, `${hash}.pdf`);
  // If pdfPath already points to the cache location, skip copy
  if (path.resolve(pdfPath) === path.resolve(cachePath)) {
    return cachePath;
  }
  await fs.promises.copyFile(pdfPath, cachePath);
  return cachePath;
}

module.exports = {
  generateKey,
  getCachedPdf,
  saveToCache,
  CACHE_DIR
};
