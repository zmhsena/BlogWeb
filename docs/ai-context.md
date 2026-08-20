# AI Context for BlogWeb

## Common APIs

- `GITHUB_CONFIG` in `githubService.js` identifies the repository, data path, and branch.
- `getRawRoot()` returns the raw GitHub root used to resolve `images/` references.
- `window.blogPosts` is the only article data contract.
- Marked parses Markdown in `post.html` and `admin.html`; Highlight.js highlights `pre code` blocks on the article page.
- GitHub Contents API GET returns Base64 content and a `sha`; PUT requires the current `sha`, branch, commit message, and Base64 content.

## Do not do

- Do not add a framework or build requirement for the GitHub Pages site without an approved migration plan.
- Do not rename or remove the five article fields.
- Do not change `post.html?id=` links to slugs without a compatibility strategy.
- Do not commit GitHub tokens, generated credentials, or local browser storage.
- Do not use `innerHTML` with raw article content unless it has been sanitized or converted through a controlled renderer.
- Do not delete article assets recursively; orphan-image deletion must be limited to exact paths found by the existing reference analysis.

## Local verification

Syntax checks for external scripts:

```powershell
node --check script.js
node --check githubService.js
node --check cursor-effect.js
node --check data.js
```

Run a static preview from the repository root:

```powershell
python -m http.server 4173
```

Then inspect `http://localhost:4173/index.html`, `post.html?id=0`, and `admin.html` in a browser. If Python is unavailable, use any equivalent static file server; do not open pages with `file://` when testing fetch behavior.

## Required manual checks after a UI change

- Remote data success, local fallback, empty data, and network failure.
- Article navigation, Markdown images, code blocks, and missing IDs.
- Admin token states, preview updates, add/edit/delete, image upload, and GitHub publish states.
- 360px, 768px, and desktop widths; keyboard focus; reduced-motion preference.
