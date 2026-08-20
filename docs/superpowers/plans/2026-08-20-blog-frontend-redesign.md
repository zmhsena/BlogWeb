# BlogWeb Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the BlogWeb listing, article, and admin interfaces with a reading-first visual system while preserving GitHub Pages hosting, the five-field article data contract, existing `post.html?id=` links, image paths, and GitHub publishing operations.

**Architecture:** Keep the site framework-free and statically deployable. Add a small shared data-loading/sanitization layer, move page behavior out of large inline blocks, and keep stable DOM IDs at the boundaries used by existing flows. Use one shared CSS token layer and semantic page shells, with page-specific layout classes for public reading and admin authoring.

**Tech Stack:** HTML5, CSS3 custom properties and media queries, browser JavaScript, Node built-in `assert`/`fs` for contract checks, Marked CDN, Highlight.js 11.9 CDN, GitHub Contents API, GitHub Pages.

---

## Files and responsibilities

Create the following focused files:

- `data-loader.js`: fetch and decode `data.js`, validate the five-field article shape, provide local fallback, and return explicit loading/error results.
- `render-utils.js`: escape text, sanitize controlled Markdown HTML, resolve article image URLs, and create shared status markup.
- `post.js`: article-page lifecycle currently embedded in `post.html`, including query parsing, data loading, Markdown rendering, and code highlighting.
- `admin.js`: admin-page lifecycle currently embedded in `admin.html`, preserving the existing editor, GitHub, image, and deletion function names during migration.
- `tests/contract-check.mjs`: dependency-free static contract checks for required IDs, scripts, data fields, and legacy route references.

Modify these existing files:

- `index.html`: semantic listing shell and shared script includes.
- `post.html`: semantic article shell and `post.js` include.
- `admin.html`: semantic authoring shell, accessible controls, and `admin.js` include.
- `style.css`: replace the old shared and inline-coupled rules with the approved token system and responsive components.
- `script.js`: listing rendering, status states, and safe text/link construction.
- `cursor-effect.js`: desktop/coarse-pointer/reduced-motion guards and a bounded particle loop.
- `githubService.js`: preserve config and raw-root behavior and expose `githubFetch(url, options)` as the one shared wrapper for checked GitHub responses.
- `AGENTS.md`, `docs/architecture.md`, `docs/ai-context.md`, `docs/dependencies.md`, `todo.md`: update after implementation with final boundaries and verification evidence.

Do not modify `data.js` or files under `images/` unless a content bug is discovered during verification.

## Task 1: Establish a regression contract before the redesign

**Files:**
- Create: `tests/contract-check.mjs`
- Test: `tests/contract-check.mjs`

- [ ] **Step 1: Write the failing contract check**

Create a Node script using only built-in modules. It must read the three HTML files and `data.js`, then assert that the current integration boundaries exist:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const index = read('index.html');
const post = read('post.html');
const admin = read('admin.html');
const data = read('data.js');

for (const id of ['post-list']) assert.match(index, new RegExp(`id=["']${id}["']`));
for (const id of ['detail-title', 'detail-meta', 'detail-content']) {
  assert.match(post, new RegExp(`id=["']${id}["']`));
}
for (const id of ['token-input', 'admin-post-list', 'post-title', 'post-category', 'post-content', 'live-preview', 'submit-btn']) {
  assert.match(admin, new RegExp(`id=["']${id}["']`));
}
for (const field of ['title', 'date', 'excerpt', 'fullContent', 'category']) assert.match(data, new RegExp(`\\b${field}\\b`));
assert.match(index + post, /post\.html\?id=/);
console.log('CONTRACT_OK');
```

- [ ] **Step 2: Run the check against the untouched site**

Run `node tests/contract-check.mjs`. Expected output: `CONTRACT_OK`. If it fails, correct the test selectors before continuing; the current repository must establish the baseline.

- [ ] **Step 3: Commit the regression contract**

```powershell
git add tests/contract-check.mjs
git commit -m "test: capture BlogWeb page contracts"
```

## Task 2: Add shared loading, validation, and rendering utilities

**Files:**
- Create: `data-loader.js`
- Create: `render-utils.js`
- Modify: `githubService.js`
- Test: `tests/contract-check.mjs`

- [ ] **Step 1: Define the loader boundary**

`data-loader.js` must export browser globals `loadBlogPosts` and `validateBlogPosts` without a bundler. `loadBlogPosts` accepts `{ remoteUrl, localUrl = 'data.js', fetchImpl = fetch }`, requests the remote URL with a cache-busting query, decodes GitHub Base64 content, evaluates only the expected `window.blogPosts` assignment, validates each item, and returns:

```js
{ ok: true, posts, source: 'remote' | 'local' }
```

or:

```js
{ ok: false, posts: [], source: null, error: { kind, message } }
```

The function must distinguish HTTP errors, malformed Base64/JavaScript, and invalid article shape so page code can show useful status copy.

- [ ] **Step 2: Define safe render helpers**

`render-utils.js` must expose `escapeHtml`, `resolveImageUrls`, `sanitizeMarkdownHtml`, and `statusMarkup`. `sanitizeMarkdownHtml` must parse the Marked output with `DOMParser`, remove `script`, `iframe`, `object`, `embed`, and event-handler attributes, and allow only `http:`, `https:`, `mailto:`, and relative links. It must reject `javascript:` URLs and preserve `images/` paths after `resolveImageUrls`.

- [ ] **Step 3: Keep GitHub configuration stable**

Retain the exact `GITHUB_CONFIG` values and `getRawRoot()` output in `githubService.js`. Implement `githubFetch(url, options = {})` to call `fetch`, throw an error containing the HTTP status and response text when `response.ok` is false, and return the successful `Response`. Keep authorization headers in the caller that owns the token; do not move the token into shared global state.

- [ ] **Step 4: Extend the contract check**

Add assertions that `index.html`, `post.html`, and `admin.html` include `data-loader.js` and that `render-utils.js` is included before page scripts. Run `node tests/contract-check.mjs`; expected output remains `CONTRACT_OK` after the HTML includes are added.

- [ ] **Step 5: Commit the shared boundary**

```powershell
git add data-loader.js render-utils.js githubService.js tests/contract-check.mjs
git commit -m "refactor: centralize blog loading and safe rendering"
```

## Task 3: Replace the shared visual foundation and page shells

**Files:**
- Modify: `style.css`
- Modify: `index.html`
- Modify: `post.html`
- Modify: `admin.html`

- [ ] **Step 1: Write semantic page shells while preserving integration IDs**

Use `<header>`, `<nav aria-label="Primary">`, `<main>`, `<section>`, `<article>`, `<aside>`, and `<footer>` where appropriate. Preserve `#post-list`, `#detail-title`, `#detail-meta`, `#detail-content`, and all admin field IDs. Replace inline `style` attributes with named classes. Include scripts in this order: `githubService.js`, `data-loader.js`, `render-utils.js`, then the page script.

- [ ] **Step 2: Replace `style.css` with tokenized base rules**

Start the stylesheet with these exact role tokens and derive component values from them:

```css
:root {
  --color-paper: #f5f7f4;
  --color-surface: #ffffff;
  --color-ink: #17212b;
  --color-muted: #66737a;
  --color-line: #d8e0dc;
  --color-teal: #1f6f68;
  --color-rust: #c56b4c;
  --color-code: #1d252b;
  --font-display: "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  --font-body: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  --font-mono: "IBM Plex Mono", Consolas, monospace;
  --content-max: 1180px;
  --reading-max: 720px;
  --radius-small: 4px;
  --shadow-focus: 0 0 0 3px rgb(31 111 104 / 22%);
}
```

Add explicit focus-visible styles, flat surfaces, the desktop reading rail, article typography, Markdown elements, form controls, status banners, and `@media (max-width: 760px)` rules. Use `@media (prefers-reduced-motion: reduce)` to set transition/animation durations to zero.

- [ ] **Step 3: Verify the shell at fixed widths before page-specific rendering**

Start `python -m http.server 4173` from the repository root. Check each page at 360px, 768px, and 1440px. Expected: no horizontal overflow, readable navigation, visible focus ring, and no style declarations remaining in the page bodies except third-party link/script tags.

- [ ] **Step 4: Commit the visual foundation**

```powershell
git add style.css index.html post.html admin.html
git commit -m "style: establish reading-first page system"
```

## Task 4: Rebuild the listing page states and article stream

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Test: `tests/contract-check.mjs`

- [ ] **Step 1: Add explicit listing states to the shell**

Keep `#post-list` as the single render target and add `data-state="loading"` plus a status child that can be replaced by `renderPosts`. The shell must contain a short author statement and an about rail without making the page a marketing hero.

- [ ] **Step 2: Render safe, semantic article entries**

Replace string interpolation of untrusted title/excerpt/category with DOM construction or escaped values. Each entry must include:

```html
<article class="note-entry">
  <div class="note-meta"><time datetime="...">...</time><span>...</span></div>
  <h2><a href="post.html?id=N">...</a></h2>
  <p class="note-excerpt">...</p>
  <a class="read-link" href="post.html?id=N">阅读文章</a>
</article>
```

Use the array index for the URL so all existing links remain compatible. The reading rail is a CSS pseudo-element or dedicated decorative span with `aria-hidden="true"`.

- [ ] **Step 3: Connect remote data, local fallback, and error copy**

The page must call `loadBlogPosts`, set `window.blogPosts` only after validation, and render one of these states: `loading`, `ready`, `empty`, `fallback`, or `error`. A remote failure with valid local data must show the list plus a non-blocking “已使用本地数据” status; a failure without valid data must show a retry action and error message.

- [ ] **Step 4: Test listing behavior**

Run `node tests/contract-check.mjs` and manually verify one valid post, an empty array, a rejected fetch, and a malformed local file using DevTools overrides. Expected: no uncaught errors and no blank page without an explanation.

- [ ] **Step 5: Commit the listing page**

```powershell
git add index.html script.js
git commit -m "feat: rebuild reading-first article listing"
```

## Task 5: Rebuild the article reading page

**Files:**
- Modify: `post.html`
- Create: `post.js`
- Modify: `style.css`
- Test: `tests/contract-check.mjs`

- [ ] **Step 1: Move the page-local lifecycle into `post.js`**

Implement `getRequestedPostId`, `renderPostDetail`, and `initPostPage` in `post.js`. `initPostPage` must keep the current query contract, call `loadBlogPosts`, and render explicit loading, remote/local fallback, not-found, and network-error states into `#detail-title`, `#detail-meta`, and `#detail-content`.

- [ ] **Step 2: Render controlled Markdown output**

Keep `marked.setOptions({ breaks: true, gfm: true })`, convert `images/` paths with `getRawRoot()`, pass the result through `sanitizeMarkdownHtml`, and insert the sanitized HTML. Add `loading="lazy"` to content images except a first image that is needed immediately. Run `hljs.highlightElement` only on code blocks that are not already highlighted.

- [ ] **Step 3: Add reading navigation**

Add a text back link to `index.html`, a compact metadata row, and a “back to top” control that is a real button with an accessible label. If previous/next links are added, calculate them from the same array index and hide the unavailable direction rather than creating broken links.

- [ ] **Step 4: Test article behavior**

Verify `post.html?id=0`, a missing ID, a non-numeric ID, a rejected remote request with local fallback, Markdown code, a Markdown image, a dangerous HTML snippet, and a long unbroken code line. Expected: readable output, no script execution, no page-wide horizontal overflow, and actionable failure copy.

- [ ] **Step 5: Commit the article page**

```powershell
git add post.html post.js style.css tests/contract-check.mjs
git commit -m "feat: rebuild article reading experience"
```

## Task 6: Rebuild the admin authoring workspace without changing GitHub operations

**Files:**
- Modify: `admin.html`
- Create: `admin.js`
- Modify: `style.css`
- Test: `tests/contract-check.mjs`

- [ ] **Step 1: Move inline behavior into `admin.js`**

Move the existing functions into `admin.js` and preserve these names during the first migration: `saveTokenToLocal`, `clearToken`, `renderAdminPosts`, `renderAdminList`, `insertBigText`, `insertFormat`, `updatePreview`, `editPost`, `savePost`, `resetForm`, `processImage`, `uploadFileToGitHub`, `syncToGitHub`, `deletePost`, `extractImageNames`, and `deleteFileFromGitHub`. Remove duplicate implementations only after all call sites use one version.

- [ ] **Step 2: Replace inline handlers with event listeners**

Add `data-action` and `data-index` attributes to generated list buttons. Bind one delegated click listener on `#admin-post-list`, one toolbar listener, and `input` listeners for title/category/content. Keep temporary global function aliases only if an external inline caller remains, then remove the aliases after the contract check passes.

- [ ] **Step 3: Add connection and publish state regions**

Add `#admin-status` and `#publish-status` with `role="status"` and `aria-live="polite"`. Disable publish controls while `savePost` is awaiting uploads and GitHub PUT requests. On failure, restore the draft values and report whether the failure happened during token validation, image upload, data read, or data write.

- [ ] **Step 4: Preserve image and deletion safety**

Keep the exact-name image queue and `extractImageNames` behavior. Only call `deleteFileFromGitHub` for paths returned by the orphan-reference comparison. Do not log the token or include it in status text.

- [ ] **Step 5: Test admin behavior without a real token**

Use DevTools or a local mock `fetch` to verify token save/clear, initial load failure, preview updates, edit/reset, image Markdown insertion, disabled publish state, and failed publish draft preservation. Use a real token only for an explicit end-to-end publish check in the target repository.

- [ ] **Step 6: Commit the admin workspace**

```powershell
git add admin.html admin.js style.css tests/contract-check.mjs
git commit -m "feat: rebuild admin authoring workspace"
```

## Task 7: Bound cursor motion and finish accessibility/performance details

**Files:**
- Modify: `cursor-effect.js`
- Modify: `style.css`
- Modify: `index.html`
- Modify: `post.html`

- [ ] **Step 1: Guard the cursor effect**

Do not create the canvas when `matchMedia('(prefers-reduced-motion: reduce)').matches`, `matchMedia('(pointer: coarse)').matches`, or `matchMedia('(hover: none)').matches`. Cap the particle array at 120 entries, use one stable hue from `--color-teal`, and pause animation when the document is hidden.

- [ ] **Step 2: Audit keyboard and semantics**

Check heading order, `nav` labels, form labels, button names, image alt text, focus-visible rings, and status live regions. Ensure every clickable action is a link or button and no `onclick` remains in public-page markup.

- [ ] **Step 3: Run syntax and contract checks**

Run:

```powershell
node --check script.js
node --check post.js
node --check admin.js
node --check data-loader.js
node --check render-utils.js
node --check githubService.js
node --check cursor-effect.js
node --check data.js
node tests/contract-check.mjs
```

Expected output: no syntax errors and `CONTRACT_OK`.

- [ ] **Step 4: Commit the hardening pass**

```powershell
git add cursor-effect.js style.css index.html post.html
git commit -m "perf: respect motion preferences and bound cursor work"
```

## Task 8: Final browser verification and documentation update

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/architecture.md`
- Modify: `docs/ai-context.md`
- Modify: `docs/dependencies.md`
- Modify: `todo.md`

- [ ] **Step 1: Start the static server**

Run `python -m http.server 4173` from `D:\MyBlog\BlogWeb`. Open `http://localhost:4173/index.html`, `http://localhost:4173/post.html?id=0`, and `http://localhost:4173/admin.html`.

- [ ] **Step 2: Verify responsive screenshots and interactions**

At 360px, 768px, and 1440px verify navigation, article rail, reading width, code overflow, admin columns, form controls, status messages, and focus states. Capture a screenshot for each page/width if the browser tooling is available. Expected: no horizontal overflow, clipped text, overlapping controls, or inaccessible action.

- [ ] **Step 3: Verify data and publishing paths**

Check remote success, local fallback, empty data, API rate-limit/error, valid article, missing article, image resolution, Markdown sanitization, admin preview, image upload queue, and publish failure draft preservation. Do not claim publish success without a successful GitHub response.

- [ ] **Step 4: Record evidence**

Update `todo.md` with the exact commands run, the pages/widths checked, and any residual risk. Update `docs/architecture.md` and `docs/ai-context.md` to match the final script boundaries. Search all HTML for `style=` and `onclick=` and remove any remaining public-page occurrences that are not required by an explicitly documented admin compatibility alias.

- [ ] **Step 5: Final commit**

```powershell
git add AGENTS.md docs todo.md tests
git commit -m "docs: record frontend redesign verification"
```

## Plan self-review

- The design specification's three pages are covered by Tasks 3 through 6.
- The five-field data contract, index URLs, raw image paths, and GitHub branch are covered by Tasks 1, 2, 4, 5, and 6.
- Loading, fallback, empty, not-found, network, and publish states are covered by Tasks 2, 4, 5, and 6.
- Sanitization, token handling, reduced motion, keyboard focus, and responsive behavior are covered by Tasks 2, 5, 6, and 7.
- The plan contains no unresolved implementation placeholders; every task names files, behavior, commands, and expected results.
