import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.document = { addEventListener() {} };
const listing = require('../script.js');

assert.equal(typeof listing.renderPosts, 'function');
assert.equal(typeof listing.initListingPage, 'function');
assert.equal(typeof listing.getListingState, 'function');

function makeElement(tagName = 'div') {
    return {
        tagName: tagName.toUpperCase(),
        textContent: '',
        innerHTML: '',
        dataset: {},
        attributes: {},
        children: [],
        listeners: {},
        className: '',
        appendChild(child) { this.children.push(child); return child; },
        replaceChildren(...children) { this.children = children; },
        setAttribute(name, value) { this.attributes[name] = String(value); },
        removeAttribute(name) { delete this.attributes[name]; },
        addEventListener(type, handler) { this.listeners[type] = handler; },
        querySelector(selector) {
            if (selector === '[data-action="retry"]') return this.children.find((child) => child.dataset && child.dataset.action === 'retry') || null;
            return null;
        }
    };
}

function makeDocument() {
    const nodes = new Map([
        ['post-list', makeElement('section')],
        ['listing-status', makeElement('div')],
        ['post-count', makeElement('span')]
    ]);
    return {
        nodes,
        createElement: makeElement,
        getElementById(id) { return nodes.get(id) || null; }
    };
}

const documentRef = makeDocument();
const posts = [{
    title: '<unsafe title>',
    date: '2026-08-20',
    excerpt: '<script>alert(1)</script>',
    fullContent: 'body',
    category: 'Notes'
}];

const rendered = listing.renderPosts({ document: documentRef, posts });
assert.equal(rendered.state, 'ready');
assert.equal(documentRef.nodes.get('post-list').dataset.state, 'ready');
assert.match(documentRef.nodes.get('post-list').innerHTML, /post\.html\?id=0/);
assert.doesNotMatch(documentRef.nodes.get('post-list').innerHTML, /<script/i);
assert.match(documentRef.nodes.get('post-list').innerHTML, /note-entry/);

const fallbackResult = await listing.initListingPage({
    document: makeDocument(),
    loadPosts: async () => ({
        ok: true,
        source: 'local',
        warning: { message: 'Remote unavailable' },
        posts
    })
});
assert.equal(fallbackResult.state, 'fallback');
assert.match(fallbackResult.document.nodes.get('listing-status').innerHTML, /Remote unavailable/);

const emptyDocument = makeDocument();
const emptyResult = await listing.initListingPage({
    document: emptyDocument,
    loadPosts: async () => ({ ok: true, source: 'remote', posts: [] })
});
assert.equal(emptyResult.state, 'empty');
assert.equal(emptyDocument.nodes.get('post-list').dataset.state, 'empty');

const errorDocument = makeDocument();
const errorResult = await listing.initListingPage({
    document: errorDocument,
    loadPosts: async () => ({ ok: false, error: { message: 'offline' } })
});
assert.equal(errorResult.state, 'error');
assert.match(errorDocument.nodes.get('listing-status').innerHTML, /offline/);
assert.match(errorDocument.nodes.get('listing-status').innerHTML, /data-action="retry"/);

const cursorSource = require('node:fs').readFileSync(new URL('../cursor-effect.js', import.meta.url), 'utf8');
assert.match(cursorSource, /prefers-reduced-motion/);
assert.match(cursorSource, /pointer:\s*coarse/);
assert.match(cursorSource, /hover:\s*none/);
assert.match(cursorSource, /120/);
assert.match(cursorSource, /visibilitychange/);

console.log('LISTING_CURSOR_OK');
