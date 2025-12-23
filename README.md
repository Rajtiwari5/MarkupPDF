# MarkupPDF

MarkupPDF is a simple **HTML & CSS to PDF converter** built using **Node.js, Express, and Puppeteer**.

It converts:

* HTML files
* CSS files
* HTML + CSS

into downloadable **PDF documents** using an API.

---

## Features

* Convert HTML to PDF
* Convert CSS to PDF
* Convert HTML + CSS to PDF
* Accepts raw HTML (Postman friendly)
* Fast rendering using Puppeteer

---

## Tech Stack

* Node.js (18+)
* Express.js
* Puppeteer

---

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/MarkupPDF.git
cd MarkupPDF
npm install
```

---

## Run Server

```bash
node server.js
```

Server runs on:

```
http://localhost:3001
```

---

## API Usage

### Convert to PDF

**POST** `/convert`

#### Option 1: Raw HTML (Postman)

* Body → raw
* Select **HTML**

```html
<h1>Hello PDF</h1>
```

#### Option 2: JSON

```json
{
  "html": "<h1>Hello</h1>",
  "css": "h1 { color: red; }"
}
```

---

## Response

```json
{
  "success": true,
  "timeTakenMs": 120,
  "downloadUrl": "/pdf-cache/xyz.pdf"
}
```

---

## Note

* Node.js version must be **18 or higher**

---

## Author

**Raj Tiwari**
