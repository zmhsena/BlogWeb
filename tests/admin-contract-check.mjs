import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const html = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../admin.js', import.meta.url), 'utf8');
const {
  sanitizeFileName,
  extractImageNames,
  getOrphanImageNames,
  buildPostRecord
} = require('../admin.js');

for (const tag of ['header', 'nav', 'main', 'footer']) {
  assert.match(html, new RegExp(`<${tag}\\b`, 'i'));
}
assert.match(html, /admin\.js/);
assert.doesNotMatch(html, /<style\b/i);
assert.doesNotMatch(html, /\bon(?:click|input|change)\s*=/i);
for (const id of ['token-input', 'post-title', 'post-category', 'post-content']) {
  assert.match(html, new RegExp(`<label[^>]+for=["']${id}["']`, 'i'));
}
assert.match(html, /id=["']live-preview["'][^>]*role=["']region["']/i);
assert.match(html, /id=["']live-preview["'][^>]*aria-label=/i);
for (const id of ['admin-status', 'publish-status']) {
  assert.match(html, new RegExp(`id=["']${id}["'][^>]*role=["']status["']`, 'i'));
  assert.match(html, new RegExp(`id=["']${id}["'][^>]*aria-live=["']polite["']`, 'i'));
}
assert.match(html, /data-format=["']big["']/i);
assert.match(source, /dataset\.format === ['"]big['"]/);
assert.match(source, /insertBigText\(\)/);
assert.match(source, /allowDataImages:\s*true/);
assert.match(source, /catch \(error\)[\s\S]*setPublishStatus\('error'/);
assert.doesNotMatch(source, /catch \(error\)[\s\S]*resetForm\(\)/);

assert.equal(sanitizeFileName('  图 片 (1).png '), '图_片_1.png');
assert.deepEqual(extractImageNames('![a](images/a.png) ![b](images/b.webp)'), ['a.png', 'b.webp']);
assert.deepEqual(extractImageNames('![unsafe](images/../secret.png)'), []);
assert.deepEqual(
  getOrphanImageNames(
    { fullContent: '![a](images/a.png) ![b](images/b.webp)' },
    [{ fullContent: '![b](images/b.webp)' }]
  ),
  ['a.png']
);
assert.deepEqual(
  buildPostRecord({ title: '标题', category: '分类', content: '正文内容' }, '2026-08-20'),
  {
    title: '标题',
    date: '2026-08-20',
    excerpt: '正文内容...',
    fullContent: '正文内容',
    category: '分类'
  }
);

assert.equal(sanitizeFileName('../draft/image.png'), 'draft_image.png');

const previousDocument = globalThis.document;
const previousEvent = globalThis.Event;
const textarea = {
  value: '保留这段文字',
  selectionStart: 0,
  selectionEnd: 6,
  setRangeText(value, start, end) {
    this.value = this.value.slice(0, start) + value + this.value.slice(end);
  },
  dispatchEvent() {},
  focus() {}
};
globalThis.document = { getElementById(id) { return id === 'post-content' ? textarea : null; } };
globalThis.Event = class Event {};
const { insertBigText } = require('../admin.js');
insertBigText();
assert.match(textarea.value, /<span[^>]*>保留这段文字<\/span>/);
globalThis.document = previousDocument;
globalThis.Event = previousEvent;

console.log('ADMIN_CONTRACT_OK');
