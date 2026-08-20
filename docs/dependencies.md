# Dependencies and Deployment Boundaries

## Runtime dependencies

| Dependency | Source | Used by | Purpose |
| --- | --- | --- | --- |
| Marked | jsDelivr CDN | `post.html`, `admin.html` | Render article Markdown and live preview HTML. |
| Highlight.js 11.9 | cdnjs CDN | `post.html` | Syntax-highlight rendered code blocks. |
| GitHub Contents API | `api.github.com` | all pages / admin | Read `data.js`; the admin also writes articles and images. |
| Raw GitHub content | `raw.githubusercontent.com` | `post.html` | Resolve article image Markdown from the configured branch. |

## Deployment

- The site is served directly by GitHub Pages as static files.
- Production has no `package.json`, bundler, runtime server, or build artifact.
- Content is read from the `dataBranch` branch configured in `githubService.js`.

## Assembly and asset rules

This is not a Unity project. It has no `.asmdef` files, Addressables configuration, rendering pipeline, Prefab assets, or Unity build commands.

- Treat `images/` as the article asset boundary.
- Article Markdown must reference assets as `images/<filename>`.
- Do not introduce generated dependency folders or commit downloaded CDN files unless an explicit offline-dependency plan is approved.
- Third-party scripts remain externally loaded until a separate dependency-hardening task decides otherwise.
