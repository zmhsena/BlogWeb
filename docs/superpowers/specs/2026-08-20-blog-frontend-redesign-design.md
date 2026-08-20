# BlogWeb Frontend Redesign Design Specification

**Status:** Draft for user review  
**Date:** 2026-08-20  
**Scope:** Static public blog pages and the in-browser authoring page

## Goal

Give the BlogWeb listing, article, and admin pages one intentional, reading-first visual system while preserving the current GitHub Pages deployment, article data contract, image paths, and GitHub publishing workflow.

The assumed visual direction is **reading-first, quiet, and professional**. It should feel like a personal technical notebook rather than a marketing landing page or a generic dashboard.

## Current constraints

- The repository has no package manifest, bundler, framework, or test runner.
- GitHub Pages serves the root HTML, CSS, and JavaScript directly.
- `dataBranch/data.js` is fetched through the GitHub Contents API and evaluated as `window.blogPosts`.
- Existing article links use `post.html?id=<array-index>`.
- Article Markdown references assets as `images/<filename>`.
- The admin page writes `data.js`, uploads images, and removes unreferenced images through the GitHub Contents API.
- Marked and Highlight.js are currently loaded from CDNs.

## Non-goals

- No framework or build migration in this redesign.
- No article content migration or schema change.
- No authentication service; the existing local GitHub token workflow remains the boundary.
- No stable-slug migration in this pass; index URL compatibility is more important than route cleanup.
- No broad refactor of GitHub repository operations unrelated to the page experience.

## Visual system

### Palette

The palette uses a cool paper background, ink text, a restrained teal action color, a warm rust signal color, and a quiet green-gray boundary color. The colors are named by their role so they can be changed without rewriting component selectors.

```text
paper       #F5F7F4   page background
surface     #FFFFFF   content surfaces
ink         #17212B   primary text
muted       #66737A   metadata and secondary text
line        #D8E0DC   borders and separators
teal        #1F6F68   links, focus, primary actions
rust        #C56B4C   warnings and small editorial accents
code        #1D252B   code block background
```

Teal is the primary interaction color; rust is reserved for warnings or a small visual marker so the interface does not become a one-hue theme.

### Typography

- Display: `Noto Serif SC`, `Source Han Serif SC`, `Songti SC`, serif. Use for the site title, article title, and one-level section headings.
- Body: `Inter`, `PingFang SC`, `Microsoft YaHei`, sans-serif. Use for navigation, excerpts, metadata, and form labels.
- Utility: `IBM Plex Mono`, `Consolas`, monospace. Use for dates when useful, code, tokens, and technical labels.
- Do not require remote font loading for readable fallback behavior.

### Layout and signature

- The global content rail is `min(1180px, calc(100% - 40px))` on desktop and `calc(100% - 32px)` on mobile.
- The article measure is approximately `720px`; the listing can use a secondary author/about rail on wide screens.
- The desktop article list uses a narrow vertical teal reading rail beside date/category markers. The rail encodes the sequence of published notes and is the page's one memorable signature element; it disappears into a simple left border on mobile.
- Cards remain flat and quiet. Use borders and spacing for grouping; do not nest decorative cards.
- Motion is limited to link underlines, status transitions, and one coordinated list reveal. Respect `prefers-reduced-motion`.

### Layout sketches

Desktop listing:

```text
+------------------------------------------------------------+
| Sena's blog                         Archive  About  Admin  |
+------------------------------------------------------------+
| Notes from a working notebook                              |
| Short author statement                         [about rail]|
|                                                            |
| 2026 / 02 / 10  |  Test category                           |
|                 |  Test title                              |
|                 |  Excerpt and reading link                |
|                                                            |
| Older notes ...                                            |
+------------------------------------------------------------+
```

Mobile listing:

```text
+------------------------+
| Sena's blog       menu |
+------------------------+
| Notes from a working   |
| notebook               |
|                        |
| date  category         |
| title                  |
| excerpt                |
| Read note              |
+------------------------+
```

Admin workspace:

```text
+------------------------------------------------------------+
| Token / connection status                                  |
+---------------------+--------------------------------------+
| Existing notes      | Editor: title / category / Markdown   |
| select / edit       | toolbar + publish state               |
| delete              | Live preview                          |
+---------------------+--------------------------------------+
```

## Page behavior

### Listing page

The page shell renders a semantic header, an author introduction, an article list container, and an about section. `script.js` keeps the existing list contract but renders semantic entries with explicit date, category, excerpt, and a text/icon reading link. Loading, empty, local fallback, and network error states are first-class DOM states rather than console-only messages.

The redesign may introduce a search/filter control only if it remains client-side and does not alter the data contract. It is not required for the first implementation pass; the primary job is fast scanning and opening a note.

### Article page

The article page keeps `#detail-title`, `#detail-meta`, and `#detail-content` for compatibility. The body gets a readable measure, a sticky desktop context rail only when it does not occlude content, and explicit back navigation. Markdown images are resolved against `getRawRoot()`. Code highlighting runs after rendering. Missing IDs and failed requests replace the loading state with an actionable message.

Markdown output must pass through a controlled sanitization step or an allow-list renderer before `innerHTML`. Links should open predictably, images must have useful alt text, and code blocks must retain horizontal scrolling without changing the page width.

### Admin page

The admin page remains a static client-side GitHub editor. It gets a semantic workspace layout with a visible connection status, a scrollable note list, an editor, and a preview. Existing field IDs and publishing functions remain available until their callers are migrated. Inline event handlers can be replaced with `addEventListener` in focused changes, but the following workflows must remain intact: token save/clear, loading remote data, create, edit, delete, Markdown formatting, drag-and-drop image queue, image upload, data synchronization, and orphan-image cleanup.

Every asynchronous operation has a disabled or busy state and a message tied to the operation. A failed publish must leave the user's draft in the editor.

## Data flow and compatibility

The redesign keeps the current five-field article object:

```js
{
  title,
  date,
  excerpt,
  fullContent,
  category
}
```

Remote data loading should first attempt the configured branch, then use a local `data.js` fallback where available, then show a clear error state. It must not silently render an empty list after an API failure. Existing `post.html?id=N` links resolve using the same array index during this pass. A future stable-slug migration is explicitly out of scope.

## Error, security, and accessibility behavior

- Show loading, empty, not-found, no-token, unauthorized, rate-limit, and generic network states in the relevant page region.
- Keep GitHub tokens in local browser storage only when the user chooses local save; never include them in article data, URLs, logs, or commits.
- Sanitize Markdown-generated HTML or use a strict allow-list before DOM insertion.
- Use semantic headings in order, visible keyboard focus, labels for all fields, buttons for actions, and descriptive alternate text for content images.
- Support `prefers-reduced-motion`; disable the cursor trail on touch/coarse-pointer devices and cap its particle work on desktop.
- Maintain usable contrast for body text, metadata, links, focus rings, code, and warning states.

## Verification and acceptance

The implementation is accepted when all of the following are true:

1. `index.html`, `post.html`, and `admin.html` share the new visual system and remain usable from 360px through desktop widths.
2. Existing `window.blogPosts` content and `post.html?id=0` load correctly; relative article images resolve to the configured raw GitHub branch.
3. Listing loading, local fallback, empty, and request-failure states are visible and understandable.
4. Article Markdown, images, code highlighting, missing IDs, back navigation, and responsive reading width work.
5. Admin token states, preview, add/edit/delete, image queue/upload, publish, and orphan cleanup remain functional; a failed publish preserves the draft.
6. Keyboard navigation, focus styles, reduced-motion behavior, and touch behavior are correct.
7. `node --check` passes for every external JavaScript file, and manual browser verification is recorded for desktop, tablet, and mobile widths using a local static server.

## Implementation sequence

1. Add the project context documents and preserve the current data/API contracts.
2. Normalize page encoding and establish shared CSS tokens, base typography, semantic shell, and responsive primitives.
3. Rebuild the listing markup and `script.js` states, then verify remote/local/empty data paths.
4. Rebuild article markup and rendering states, then verify Markdown, images, and code blocks.
5. Rebuild the admin workspace styles and event wiring while preserving all GitHub operations.
6. Harden sanitization, accessibility, reduced motion, and cursor-effect performance.
7. Run syntax checks, local browser checks, and a final compatibility review against the five-field data contract.

## Review notes

- The design intentionally avoids a large hero, gradients, decorative blobs, and card-heavy composition because the site's primary job is reading notes.
- The vertical reading rail is the only strong visual signature; all other decoration is subordinate to scanning and reading.
- Search, stable slugs, authentication redesign, and build tooling remain separate follow-up work rather than hidden scope.
