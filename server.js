const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const pagePool = require("./page-pool");
const cache = require("./cache");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.static("public"));
app.use("/pdfs", express.static("pdf"));
app.use("/pdf-cache", express.static("pdf-cache"));

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await pagePool.shutdown();
  process.exit(0);
});

app.post("/convert", upload.any(), async (req, res) => {
  const start = Date.now();
  let pageInfo;

  try {
    if (!req.files?.length) return res.status(400).json({ error: "No files uploaded" });

    let html = "", css = "";

    // Read and categorize files
    await Promise.all(req.files.map(async (file) => {
      const content = await fs.readFile(file.path, "utf8");
      path.extname(file.originalname).toLowerCase() === ".css" ? css += content : html += content;
    }));

    if (!html.trim() && !css.trim()) return res.status(400).json({ error: "No valid files" });

    // Handle CSS-only
    if (!html.trim()) html = `<html><head><title>CSS to PDF</title><style>${css}</style></head><body><h1>CSS Converted</h1></body></html>`;
    else if (css) html = html.includes("</head>") ? html.replace("</head>", `<style>${css}</style></head>`) : `<style>${css}</style>${html}`;

    const cacheKey = cache.generateKey(html);
    const cachedPdfPath = cache.getCachedPdf(cacheKey);
    if (cachedPdfPath) {
      return res.json({ success: true, cached: true, timeTakenMs: Date.now() - start, downloadUrl: `http://localhost:3000/pdf-cache/${cacheKey}.pdf` });
    }

    // Generate PDF directly into the cache directory to avoid extra copies
    const pdfPath = path.join(cache.CACHE_DIR, `${cacheKey}.pdf`);

    pageInfo = await pagePool.getPage();
    // Use faster rendering checkpoint to reduce TTFB: DOMContentLoaded fires earlier
    // and limit the timeout so slow external resources don't block responses.
    await pageInfo.page.setContent(html, { waitUntil: "domcontentloaded", timeout: 5000 });
    await pageInfo.page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true, margin: 'none' });
    await cache.saveToCache(cacheKey, pdfPath);

    res.json({ success: true, cached: false, timeTakenMs: Date.now() - start, downloadUrl: `http://localhost:3000/pdf-cache/${cacheKey}.pdf` });

    // Cleanup
    setImmediate(async () => {
      pagePool.returnPage(pageInfo.id);
      await Promise.all(req.files.map(f => fs.unlink(f.path).catch(() => {})));
    });

  } catch (err) {
    console.error("Error:", err);
    if (pageInfo) await pagePool.closePage(pageInfo.id);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

(async () => {
  await pagePool.init();
  app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
})();
