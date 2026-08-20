import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const index = read('index.html');
const post = read('post.html');
const admin = read('admin.html');
const listingScript = read('script.js');
const data = read('data.js');
const styles = read('style.css');

for (const file of ['githubService.js', 'data-loader.js', 'render-utils.js', 'script.js', 'post.js', 'admin.js', 'cursor-effect.js']) {
  assert.equal(fs.existsSync(new URL(`../${file}`, import.meta.url)), true, `${file} must exist`);
}

for (const id of ['post-list']) assert.match(index, new RegExp(`id=["']${id}["']`));
for (const id of ['detail-title', 'detail-meta', 'detail-content']) {
  assert.match(post, new RegExp(`id=["']${id}["']`));
}
for (const id of ['token-input', 'admin-post-list', 'post-title', 'post-category', 'post-content', 'live-preview', 'submit-btn']) {
  assert.match(admin, new RegExp(`id=["']${id}["']`));
}
for (const field of ['title', 'date', 'excerpt', 'fullContent', 'category']) assert.match(data, new RegExp(`\\b${field}\\b`));
assert.match(listingScript, /post\.html\?id=/);
for (const page of [index, post, admin]) {
  assert.match(page, /data-loader\.js/);
  assert.match(page, /render-utils\.js/);
}
assert.match(post, /post\.js/);
assert.match(admin, /admin\.js/);
function assertScriptOrder(source, names) {
  let previous = -1;
  names.forEach((name) => {
    const position = source.indexOf(`src="${name}"`);
    assert.ok(position > previous, `${name} must follow its shared dependencies`);
    previous = position;
  });
}
assertScriptOrder(index, ['githubService.js', 'data-loader.js', 'render-utils.js', 'script.js', 'cursor-effect.js']);
assertScriptOrder(post, ['githubService.js', 'data-loader.js', 'render-utils.js', 'post.js', 'cursor-effect.js']);
assertScriptOrder(admin, ['githubService.js', 'data-loader.js', 'render-utils.js', 'admin.js']);
for (const page of [index, post, admin]) {
  assert.doesNotMatch(page, /\bon(?:click|input|change)\s*=/i);
}
for (const token of ['--color-paper', '--color-surface', '--color-ink', '--color-teal', '--reading-max']) {
  assert.match(styles, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
console.log('CONTRACT_OK');
