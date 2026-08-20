# BlogWeb Frontend Redesign

## Current phase

Spec review. The repository has been inspected and the redesign proposal is written for the default direction: reading-first, quiet, and professional.

## Completed

- Mapped the static page structure and GitHub data flow.
- Confirmed the `window.blogPosts` and `post.html?id=` compatibility requirements.
- Identified the shared-style coupling, encoding corruption, weak network states, and cursor-effect performance risk.
- Drafted the frontend redesign specification.

## Next after spec approval

- Convert the approved spec into a file-by-file implementation plan.
- Establish shared CSS tokens and semantic page shells.
- Rebuild listing, article, and admin presentation while preserving API behavior.
- Add fallback/error/accessibility states and verify all critical flows.

## Open decisions

- Confirm the reading-first visual direction before implementation.
- Decide whether stable article slugs should be a later, separate migration; the redesign itself keeps index URLs compatible.
