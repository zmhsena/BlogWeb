# BlogWeb Agent Guide

## Project

BlogWeb is a static GitHub Pages blog. It uses plain HTML, CSS, and browser JavaScript; there is no package manager, bundler, framework, or server-side runtime in this repository.

The published site reads `data.js` from the `dataBranch` branch of `zmhsena/BlogWeb` through the GitHub Contents API. The admin page writes the same file and uploads article images to `images/` through the GitHub API.

## Rendering and runtime

- Pages: `index.html` (listing), `post.html` (article), and `admin.html` (authoring).
- Shared scripts: `githubService.js`, `cursor-effect.js`; page behavior lives in `script.js` and page-local scripts.
- Markdown is rendered in the browser with Marked; article code highlighting uses Highlight.js from a CDN.
- The site must work as static files under GitHub Pages. Do not require a build step for the production pages.

## Directory boundaries

- Root HTML/CSS/JS files are the public site and authoring surface.
- `images/` contains article assets referenced by Markdown as `images/<name>`.
- `docs/` contains architecture, context, specs, and implementation plans; it is not loaded by the site.
- Do not add generated bundles, dependency caches, or secrets to the repository.

## Data and compatibility rules

- Preserve `window.blogPosts` and its fields: `title`, `date`, `excerpt`, `fullContent`, and `category`.
- Preserve `post.html?id=<array-index>` links while the existing data model remains index-based.
- Preserve `GITHUB_CONFIG.repo`, `GITHUB_CONFIG.path`, and `GITHUB_CONFIG.branch` unless a migration is explicitly designed and approved.
- Preserve `images/` Markdown references and raw GitHub image resolution.
- Never commit GitHub tokens or values from `localStorage`.

## Code style

- Prefer small, focused functions and semantic HTML.
- Use `const`/`let`, strict equality, and early returns for invalid DOM or network state.
- Keep user-facing copy in valid UTF-8 and sentence case; avoid inline styles when a shared class is appropriate.
- Escape or sanitize untrusted article content before inserting it into `innerHTML`.
- Respect keyboard focus, reduced-motion preferences, and responsive layouts from 360px upward.
- Add comments only for non-obvious data-flow or compatibility decisions.

## Verification

There is no automated test runner currently. Use the commands in `docs/ai-context.md` for syntax checks and a local static server, then manually verify the listing, article, and admin flows at desktop and mobile widths.

## Collaboration boundaries

Analysis, implementation, verification, performance, and review can be split into independent tasks. The coordinator must preserve the data contract and review all changes touching the GitHub API or article rendering before integration.
