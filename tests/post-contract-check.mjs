import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const renderUtils = require('../render-utils.js');
Object.assign(globalThis, renderUtils);

let post;
try {
  post = require('../post.js');
} catch (error) {
  assert.fail(`post.js must exist and be loadable: ${error.message}`);
}

assert.equal(post.getRequestedPostId('?id=2'), 2);
assert.equal(post.getRequestedPostId('?id=0'), 0);
assert.equal(post.getRequestedPostId('?id=-1'), null);
assert.equal(post.getRequestedPostId('?id=nope'), null);
assert.equal(post.getRequestedPostId(''), null);

function makeElement() {
  return {
    textContent: '',
    innerHTML: '',
    attributes: {},
    listeners: {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelectorAll() { return []; }
  };
}

const contentElement = makeElement();
const codeElement = {
  classList: { contains: () => false },
  setAttribute() {},
  removeAttribute() {}
};
contentElement.querySelectorAll = (selector) => selector === 'pre code' ? [codeElement] : [];
const elements = new Map([
  ['detail-kicker', makeElement()],
  ['detail-title', makeElement()],
  ['detail-meta', makeElement()],
  ['detail-status', makeElement()],
  ['detail-content', contentElement]
]);
const topButton = makeElement();
const documentRef = {
  getElementById(id) { return elements.get(id) || null; },
  querySelector(selector) { return selector === '[data-scroll-top]' ? topButton : null; },
  addEventListener() {}
};

let highlighted = 0;
const markedRef = { parse(value) {
  return `<p>${value}</p><img src="images/photo.png"><pre><code class="language-js">alert(1)</code></pre>`;
} };
const result = await post.initPostPage({
  document: documentRef,
  search: '?id=0',
  marked: markedRef,
  hljs: { highlightElement() { highlighted += 1; } },
  rawRoot: 'https://raw.example/branch/',
  remoteUrl: '',
  localUrl: null,
  loadPosts: async () => ({
    ok: true,
    source: 'local',
    warning: { message: 'Remote unavailable' },
    posts: [{
      title: 'Safe title', date: '2026-08-20', category: 'Note', excerpt: 'Summary',
      fullContent: 'body <script>alert(1)</script>'
    }]
  })
});

assert.equal(result.ok, true);
assert.equal(elements.get('detail-title').textContent, 'Safe title');
assert.match(elements.get('detail-meta').innerHTML, /2026-08-20/);
assert.match(elements.get('detail-content').innerHTML, /raw\.example\/branch\/images\/photo\.png/);
assert.doesNotMatch(elements.get('detail-content').innerHTML, /<script/i);
assert.match(elements.get('detail-status').innerHTML, /Remote unavailable/);
assert.equal(highlighted, 1);
assert.equal(typeof topButton.listeners.click, 'function');

const missing = await post.initPostPage({
  document: documentRef,
  search: '?id=9',
  loadPosts: async () => ({ ok: true, source: 'local', posts: [] })
});
assert.equal(missing.ok, false);
assert.match(elements.get('detail-status').innerHTML, /找不到|不存在|未找到/);

console.log('POST_CONTRACT_OK');
