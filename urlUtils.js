'use strict';

// Returns true for any http or https URL.
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Return true when the URL is a tweet/status link on twitter.com or x.com.
function isTweetUrl(string) {
  try {
    const url = new URL(string);
    const host = url.hostname.toLowerCase();
    const isTweetDomain =
      host === 'twitter.com' || host === 'www.twitter.com' ||
      host === 'x.com'       || host === 'www.x.com';
    return isTweetDomain && /^\/[^/]+\/status\/\d+/i.test(url.pathname);
  } catch {
    return false;
  }
}

// Extract the numeric status/tweet ID from a twitter.com or x.com URL.
// Returns the ID string, or null if the URL is not a recognisable tweet URL.
function extractTweetStatusId(string) {
  try {
    const url = new URL(string);
    const match = url.pathname.match(/\/status\/(\d+)/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Normalise x.com tweet URLs to their twitter.com equivalents so that both
// domains are handled by the same downstream fetch pipeline.
function normalizeTweetUrl(string) {
  try {
    const url = new URL(string);
    const host = url.hostname.toLowerCase();
    if (host === 'x.com') {
      url.hostname = 'twitter.com';
      return url.toString();
    }
    if (host === 'www.x.com') {
      url.hostname = 'www.twitter.com';
      return url.toString();
    }
    return string;
  } catch {
    return string;
  }
}

module.exports = { isValidUrl, isTweetUrl, extractTweetStatusId, normalizeTweetUrl };
