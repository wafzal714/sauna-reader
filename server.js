const express = require('express');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

app.post('/extract', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A URL is required.' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid http or https URL.' });
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SaunaReader/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      size: 5 * 1024 * 1024, // 5 MB limit
    });
  } catch (err) {
    return res.status(502).json({ error: 'Could not fetch the URL. Make sure it is publicly accessible.' });
  }

  if (!response.ok) {
    return res.status(502).json({ error: `The URL returned HTTP ${response.status}. Please check the URL and try again.` });
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
    return res.status(422).json({ error: 'The URL does not point to an HTML page.' });
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    return res.status(422).json({ error: 'Could not extract readable content from this page. Try a different article URL.' });
  }

  res.json({
    title: article.title || 'Untitled',
    byline: article.byline || null,
    siteName: article.siteName || null,
    content: article.content,
  });
});

app.listen(PORT, () => {
  console.log(`Sauna Reader running at http://localhost:${PORT}`);
});
