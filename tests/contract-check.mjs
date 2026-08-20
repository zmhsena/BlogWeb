import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const index = read('index.html');
const post = read('post.html');
const admin = read('admin.html');
const listingScript = read('script.js');
const data = read('data.js');

for (const id of ['post-list']) assert.match(index, new RegExp(`id=["']${id}["']`));
for (const id of ['detail-title', 'detail-meta', 'detail-content']) {
  assert.match(post, new RegExp(`id=["']${id}["']`));
}
for (const id of ['token-input', 'admin-post-list', 'post-title', 'post-category', 'post-content', 'live-preview', 'submit-btn']) {
  assert.match(admin, new RegExp(`id=["']${id}["']`));
}
for (const field of ['title', 'date', 'excerpt', 'fullContent', 'category']) assert.match(data, new RegExp(`\\b${field}\\b`));
assert.match(listingScript, /post\.html\?id=/);
console.log('CONTRACT_OK');
