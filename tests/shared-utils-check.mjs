import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { loadBlogPosts, parseBlogPostsSource, validateBlogPosts } = require('../data-loader.js');
const { escapeHtml, resolveImageUrls, sanitizeMarkdownHtml, statusMarkup } = require('../render-utils.js');
const { GITHUB_CONFIG, githubFetch } = require('../githubService.js');

assert.equal(GITHUB_CONFIG.repo, 'zmhsena/BlogWeb');
const checkedResponse = await githubFetch('https://example.test/ok', {
  fetchImpl: async () => ({ ok: true, status: 200 })
});
assert.equal(checkedResponse.status, 200);
await assert.rejects(
  () => githubFetch('https://example.test/fail', {
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      async text() { return 'bad token'; }
    })
  }),
  (error) => error.kind === 'network' && error.status === 401 && /bad token/.test(error.message)
);

const posts = [{
  title: '测试文章',
  date: '2026-02-10',
  excerpt: '摘要',
  fullContent: '正文',
  category: '测试'
}];

assert.equal(validateBlogPosts(posts).ok, true);
assert.equal(validateBlogPosts([{ ...posts[0], category: 42 }]).ok, false);
assert.equal(validateBlogPosts(null).ok, false);
assert.throws(() => require('../data-loader.js').decodeBase64Utf8('not-base64!'), (error) => error.kind === 'data');

const source = `window.blogPosts = ${JSON.stringify(posts)};`;
assert.deepEqual(parseBlogPostsSource(source), posts);
assert.throws(() => parseBlogPostsSource('window.other = []'), /blogPosts assignment/i);

const encoded = Buffer.from(source, 'utf8').toString('base64');
const remoteResult = await loadBlogPosts({
  remoteUrl: 'https://example.test/data.js',
  localUrl: null,
  fetchImpl: async () => ({
    ok: true,
    async json() { return { content: encoded }; }
  })
});
assert.equal(remoteResult.ok, true);
assert.equal(remoteResult.source, 'remote');
assert.deepEqual(remoteResult.posts, posts);

let requestCount = 0;
const fallbackResult = await loadBlogPosts({
  remoteUrl: 'https://example.test/data.js',
  localUrl: '/data.js',
  fetchImpl: async (url) => {
    requestCount += 1;
    if (url.startsWith('https://')) return { ok: false, status: 503, async text() { return 'offline'; } };
    return { ok: true, async text() { return source; } };
  }
});
assert.equal(requestCount, 2);
assert.equal(fallbackResult.ok, true);
assert.equal(fallbackResult.source, 'local');
assert.deepEqual(fallbackResult.posts, posts);

const failedResult = await loadBlogPosts({
  remoteUrl: 'https://example.test/data.js',
  localUrl: '/data.js',
  fetchImpl: async () => ({ ok: false, status: 500, async text() { return 'failed'; } })
});
assert.equal(failedResult.ok, false);
assert.equal(failedResult.error.kind, 'network');

assert.equal(escapeHtml('<img src=x onerror=1>'), '&lt;img src=x onerror=1&gt;');
assert.equal(resolveImageUrls('![alt](images/pic.png)', 'https://raw.test/branch/'), '![alt](https://raw.test/branch/images/pic.png)');
assert.match(statusMarkup('error', '<失效>', '详情'), /&lt;失效&gt;/);
assert.doesNotMatch(sanitizeMarkdownHtml('<script>alert(1)</script><p onclick="bad()">ok</p>'), /<script|onclick=/i);
assert.doesNotMatch(sanitizeMarkdownHtml('<a href="//attacker.example">外部</a>'), /href=/i);

console.log('SHARED_UTILS_OK');
