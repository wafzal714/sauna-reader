'use strict';

const { isValidUrl, isTweetUrl, extractTweetStatusId, normalizeTweetUrl } = require('./urlUtils');

describe('isValidUrl', () => {
  test('accepts a plain https URL', () => {
    expect(isValidUrl('https://example.com/article')).toBe(true);
  });

  test('accepts an http URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  test('accepts an x.com status URL', () => {
    expect(isValidUrl('https://x.com/jack/status/2080056638820450400')).toBe(true);
  });

  test('accepts a twitter.com status URL', () => {
    expect(isValidUrl('https://twitter.com/jack/status/20')).toBe(true);
  });

  test('rejects a non-URL string', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  test('rejects a ftp URL', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
  });
});

describe('isTweetUrl', () => {
  test('detects an x.com status URL', () => {
    expect(isTweetUrl('https://x.com/jack/status/2080056638820450400')).toBe(true);
  });

  test('detects a www.x.com status URL', () => {
    expect(isTweetUrl('https://www.x.com/jack/status/2080056638820450400')).toBe(true);
  });

  test('detects a twitter.com status URL', () => {
    expect(isTweetUrl('https://twitter.com/jack/status/20')).toBe(true);
  });

  test('detects a www.twitter.com status URL', () => {
    expect(isTweetUrl('https://www.twitter.com/jack/status/20')).toBe(true);
  });

  test('rejects an x.com URL without /status/', () => {
    expect(isTweetUrl('https://x.com/jack')).toBe(false);
  });

  test('rejects a non-tweet URL', () => {
    expect(isTweetUrl('https://example.com/article')).toBe(false);
  });

  test('rejects an invalid string', () => {
    expect(isTweetUrl('not-a-url')).toBe(false);
  });
});

describe('extractTweetStatusId', () => {
  test('extracts the status ID from an x.com URL', () => {
    expect(extractTweetStatusId('https://x.com/jack/status/2080056638820450400')).toBe('2080056638820450400');
  });

  test('extracts the status ID from a www.x.com URL', () => {
    expect(extractTweetStatusId('https://www.x.com/jack/status/2080056638820450400')).toBe('2080056638820450400');
  });

  test('extracts the status ID from a twitter.com URL', () => {
    expect(extractTweetStatusId('https://twitter.com/jack/status/20')).toBe('20');
  });

  test('returns null for a URL without /status/', () => {
    expect(extractTweetStatusId('https://x.com/jack')).toBeNull();
  });

  test('returns null for a non-tweet URL', () => {
    expect(extractTweetStatusId('https://example.com/article')).toBeNull();
  });

  test('returns null for an invalid string', () => {
    expect(extractTweetStatusId('not-a-url')).toBeNull();
  });
});

describe('normalizeTweetUrl', () => {
  test('normalises x.com to twitter.com', () => {
    expect(normalizeTweetUrl('https://x.com/jack/status/2080056638820450400'))
      .toBe('https://twitter.com/jack/status/2080056638820450400');
  });

  test('normalises www.x.com to www.twitter.com', () => {
    expect(normalizeTweetUrl('https://www.x.com/jack/status/2080056638820450400'))
      .toBe('https://www.twitter.com/jack/status/2080056638820450400');
  });

  test('leaves twitter.com URLs unchanged', () => {
    expect(normalizeTweetUrl('https://twitter.com/jack/status/20'))
      .toBe('https://twitter.com/jack/status/20');
  });

  test('leaves www.twitter.com URLs unchanged', () => {
    expect(normalizeTweetUrl('https://www.twitter.com/jack/status/20'))
      .toBe('https://www.twitter.com/jack/status/20');
  });

  test('leaves non-tweet URLs unchanged', () => {
    expect(normalizeTweetUrl('https://example.com/article'))
      .toBe('https://example.com/article');
  });

  test('preserves query parameters and hash when normalising', () => {
    const input = 'https://x.com/jack/status/2080056638820450400?s=20#anchor';
    const result = normalizeTweetUrl(input);
    expect(result).toContain('twitter.com');
    expect(result).toContain('?s=20');
    expect(result).toContain('#anchor');
  });
});
