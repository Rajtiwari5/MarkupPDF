function prepareHtml(html, css) {
  if (!html.trim()) return `<html><head><title>CSS to PDF</title><style>${css}</style></head><body><h1>CSS Converted</h1></body></html>`;
  if (css) return html.includes('</head>') ? html.replace('</head>', `<style>${css}</style></head>`) : `<style>${css}</style>${html}`;
  return html;
}

module.exports = { prepareHtml };
