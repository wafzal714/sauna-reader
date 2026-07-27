(function () {
  'use strict';

  const form = document.getElementById('extract-form');
  const urlInput = document.getElementById('url-input');
  const submitBtn = document.getElementById('submit-btn');
  const errorMsg = document.getElementById('error-msg');
  const loading = document.getElementById('loading');
  const homeWrapper = document.querySelector('.home-wrapper');
  const resultWrapper = document.getElementById('result-wrapper');
  const articleTitle = document.getElementById('article-title');
  const articleMeta = document.getElementById('article-meta');
  const articleContent = document.getElementById('article-content');
  const backBtn = document.getElementById('back-btn');
  const printBtn = document.getElementById('print-btn');

  function showError(msg) {
    errorMsg.textContent = msg;
  }

  function clearError() {
    errorMsg.textContent = '';
  }

  function setLoading(on) {
    if (on) {
      loading.classList.remove('hidden');
      submitBtn.disabled = true;
    } else {
      loading.classList.add('hidden');
      submitBtn.disabled = false;
    }
  }

  function showResult(data) {
    articleTitle.textContent = data.title;

    const metaParts = [];
    if (data.byline) metaParts.push(data.byline);
    if (data.siteName) metaParts.push(data.siteName);
    articleMeta.textContent = metaParts.join(' · ');

    // Sanitize: only allow the content from Readability (already sanitised)
    articleContent.innerHTML = data.content;

    // Remove external scripts that Readability may have missed
    articleContent.querySelectorAll('script, style, iframe, form, object, embed').forEach(el => el.remove());

    // Open links in new tab so the print page stays clean
    articleContent.querySelectorAll('a').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });

    homeWrapper.classList.add('hidden');
    resultWrapper.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function showHome() {
    resultWrapper.classList.add('hidden');
    homeWrapper.classList.remove('hidden');
    urlInput.value = '';
    clearError();
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError();

    const url = urlInput.value.trim();
    if (!url) {
      showError('Please enter a URL.');
      return;
    }

    // Basic client-side URL validation
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        showError('Only http and https URLs are supported.');
        return;
      }
    } catch {
      showError('That doesn\'t look like a valid URL. Try something like https://example.com/article');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      showResult(data);
    } catch {
      showError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  backBtn.addEventListener('click', showHome);
  printBtn.addEventListener('click', () => window.print());
}());
