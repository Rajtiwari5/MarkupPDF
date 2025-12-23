const fs = require('fs').promises;

async function readAndCategorize(files) {
  let html = '';
  let css = '';
  await Promise.all(files.map(async (file) => {
    const content = await fs.readFile(file.path, 'utf8');
    if (file.originalname && file.originalname.toLowerCase().endsWith('.css')) css += content;
    else html += content;
  }));
  return { html, css };
}

module.exports = { readAndCategorize };
