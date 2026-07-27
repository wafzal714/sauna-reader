# 🧖 Sauna Reader

Paste a link to a blog post or article and get a clean, printable document you can read in the sauna — no phone required.

## How it works

1. Open the app in your browser.
2. Paste the URL of any blog post or web article.
3. Click **Get Article** — the app fetches the page and strips away ads, navigation, and clutter using [Mozilla Readability](https://github.com/mozilla/readability).
4. Click **🖨 Print** (or `Ctrl+P` / `Cmd+P`) to print the clean article and take it to the sauna.

## Running locally

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

The `PORT` environment variable can be used to run on a different port:

```bash
PORT=8080 npm start
```

## Tech stack

- **[Express](https://expressjs.com/)** — HTTP server
- **[@mozilla/readability](https://github.com/mozilla/readability)** — article content extraction
- **[jsdom](https://github.com/jsdom/jsdom)** — server-side DOM parsing
- **[node-fetch](https://github.com/node-fetch/node-fetch)** — fetching remote URLs