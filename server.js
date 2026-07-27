const express = require('express');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const path = require('path');
const dns = require('dns');
const net = require('net');
const http = require('http');
const https = require('https');

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

// Reject requests to private / reserved IP ranges to prevent SSRF.
function isPrivateOrReservedIP(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||                              // 0.0.0.0/8 – current network
      a === 10 ||                             // 10.0.0.0/8 – private
      a === 127 ||                            // 127.0.0.0/8 – loopback
      (a === 100 && b >= 64 && b <= 127) ||   // 100.64.0.0/10 – shared space
      (a === 169 && b === 254) ||             // 169.254.0.0/16 – link-local
      (a === 172 && b >= 16 && b <= 31) ||    // 172.16.0.0/12 – private
      (a === 192 && b === 0 && parts[2] === 0) || // 192.0.0.0/24 – IETF protocol
      (a === 192 && b === 168) ||             // 192.168.0.0/16 – private
      (a === 198 && (b === 18 || b === 19)) || // 198.18.0.0/15 – benchmarking
      a >= 224                                // 224+ – multicast / reserved
    );
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (
      lower === '::1' ||       // loopback
      lower.startsWith('fc') || // unique local
      lower.startsWith('fd') || // unique local
      lower.startsWith('fe80') || // link-local
      lower === '::'           // unspecified
    ) {
      return true;
    }
    // IPv4-mapped IPv6 (e.g. ::ffff:192.168.1.1) – validate the embedded IPv4
    if (lower.startsWith('::ffff:')) {
      return isPrivateOrReservedIP(lower.slice(7));
    }
    return false;
  }

  return true; // reject unknown address families
}

// Build a custom DNS lookup function that blocks private/reserved IPs.
// This is used as the `lookup` option on http/https agents so that every
// TCP connection (including across HTTP redirects) is validated, which
// prevents DNS-rebinding / TOCTOU attacks.
function makeSafeLookup() {
  return function safeLookup(hostname, options, callback) {
    dns.lookup(hostname, { all: true, ...options }, (err, addresses) => {
      if (err) return callback(err);
      const safe = addresses.filter(a => !isPrivateOrReservedIP(a.address));
      if (safe.length === 0) {
        return callback(new Error('Hostname resolves to a private or reserved address.'));
      }
      const chosen = safe[0];
      callback(null, chosen.address, chosen.family);
    });
  };
}

app.post('/extract', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A URL is required.' });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid http or https URL.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Please provide a valid http or https URL.' });
  }

  // Use a custom agent whose DNS lookup rejects private/reserved addresses.
  // This prevents SSRF (including DNS-rebinding attacks) at the TCP level.
  const safeLookup = makeSafeLookup();
  const agent = parsedUrl.protocol === 'https:'
    ? new https.Agent({ lookup: safeLookup })
    : new http.Agent({ lookup: safeLookup });

  let response;
  try {
    response = await fetch(url, {
      agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SaunaReader/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      size: 5 * 1024 * 1024, // 5 MB limit
    });
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('private or reserved')) {
      return res.status(400).json({ error: 'Requests to private or internal addresses are not allowed.' });
    }
    if (msg.includes('resolve') || msg.includes('ENOTFOUND') || msg.includes('EAI_AGAIN')) {
      return res.status(502).json({ error: 'Could not resolve the hostname. Make sure it is publicly accessible.' });
    }
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

