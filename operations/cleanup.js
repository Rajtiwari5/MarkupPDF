const fs = require('fs').promises;
const pagePool = require('../page-pool');

async function cleanupUploads(files) {
  if (!files || !files.length) return;
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
}

function releasePage(pageInfo) {
  if (!pageInfo) return;
  try { pagePool.returnPage(pageInfo.id); } catch (e) { /* ignore */ }
}

module.exports = { cleanupUploads, releasePage };
