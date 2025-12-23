const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const pagePool = require("./page-pool");
const cache = require("./cache");

const app = express();
const upload = multer({ dest: "uploads/" });
const convertHandler = require('./operations/convert');
const PORT = process.env.PORT || 3002;
const BASE_URL = `http://localhost:${PORT}`;

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

app.post('/convert', upload.any(), (req, res) => convertHandler(req, res, BASE_URL));

(async () => {
  await pagePool.init();
  app.listen(PORT, () => console.log(`🚀 Server running at ${BASE_URL}`));
})();
