# BlogWeb Architecture

## Scope

BlogWeb is a three-page static site with one shared article data source. GitHub Pages serves the files; the browser is responsible for fetching, rendering, editing, and publishing content.

## Module relationships

```text
index.html ----> script.js --------------------+
     |                                          |
post.html ----> Marked + Highlight.js ---------+--> window.blogPosts
     |                                          |
admin.html ---> page-local editor/API logic ---+
     |
githubService.js ---> GitHub Contents API ---> dataBranch/data.js
                                      \
                                       ---> dataBranch/images/*
```

`githubService.js` owns repository and branch configuration plus shared raw-asset helpers. `data.js` evaluates to `window.blogPosts`, an array whose items contain `title`, `date`, `excerpt`, `fullContent`, and `category`.

## Page lifecycle

### Listing

1. The document shell renders navigation and empty containers.
2. The page requests `data.js` from the configured branch.
3. The response is Base64-decoded and evaluated into `window.blogPosts`.
4. `script.js` renders article entries into `#post-list`.
5. A local `data.js` fallback or an explicit error state is shown when the remote request fails.

### Article

1. Read `id` from `post.html?id=<index>`.
2. Load the same remote data source.
3. Resolve the indexed post, convert relative `images/` paths to the raw GitHub root, and render Markdown.
4. Apply code highlighting after the content is inserted.
5. Show a not-found or network error state without leaving stale loading text.

### Authoring

1. Load a GitHub token from the password field or browser-local storage.
2. Fetch the current `data.js` and render the article list.
3. Edit Markdown, title, and category while updating the preview.
4. Upload queued images, then PUT the new Base64-encoded `data.js` with the current file SHA.
5. On deletion, remove images no longer referenced by another article, then update `data.js`.
6. Report each network state in the interface and never expose the token in the DOM outside the password field.

## Boundaries for the redesign

The redesign may change markup and presentation, but these integration points remain stable until a separate data migration is approved:

- `window.blogPosts` and its five fields.
- `post.html?id=<index>` URL shape.
- `#post-list`, `#detail-title`, `#detail-meta`, and `#detail-content`.
- Admin field IDs used by the editor and GitHub operations.
- `GITHUB_CONFIG` and `images/` paths.

## Failure and security model

GitHub API failures, rate limits, malformed data, missing articles, and absent tokens are expected states. Each must produce an actionable empty/error state. Article Markdown is untrusted input; the final renderer must sanitize or allow-list HTML before DOM insertion. Tokens remain local-only and are never serialized into article data or committed files.
