(function (root) {
    'use strict';

    const SAFE_URL_PATTERN = /^(?:https?:|mailto:|\/|\.\/|\.\.\/|#)/i;
    const SAFE_STYLE_PROPERTIES = new Set([
        'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-decoration'
    ]);

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeRoot(rawRoot) {
        if (!rawRoot) return '';
        return String(rawRoot).endsWith('/') ? String(rawRoot) : `${rawRoot}/`;
    }

    function resolveImageUrls(content, rawRoot) {
        const source = String(content ?? '');
        const rootUrl = normalizeRoot(rawRoot);
        if (!rootUrl) return source;

        const markdown = source.replace(
            /(\]\(\s*)(images\/[^)\s]+)(\s*\))/gi,
            (_, prefix, path, suffix) => `${prefix}${rootUrl}${path}${suffix}`
        );
        return markdown.replace(
            /(<img\b[^>]*\bsrc=["'])(images\/[^"']+)(["'])/gi,
            (_, prefix, path, suffix) => `${prefix}${rootUrl}${path}${suffix}`
        );
    }

    function isSafeUrl(value) {
        const url = String(value ?? '').trim();
        if (!url || /^(?:javascript|vbscript|data):/i.test(url)) return false;
        if (url.startsWith('//')) return false;
        return SAFE_URL_PATTERN.test(url);
    }

    function sanitizeStyle(value) {
        return String(value ?? '').split(';').map((declaration) => {
            const separator = declaration.indexOf(':');
            if (separator < 1) return '';
            const property = declaration.slice(0, separator).trim().toLowerCase();
            const styleValue = declaration.slice(separator + 1).trim();
            if (!SAFE_STYLE_PROPERTIES.has(property)) return '';
            if (!styleValue || /(?:url\s*\(|expression\s*\(|javascript:|[<>])/i.test(styleValue)) return '';
            if (!/^[#(),.%\w\s-]+$/i.test(styleValue)) return '';
            return `${property}: ${styleValue}`;
        }).filter(Boolean).join('; ');
    }

    function sanitizeWithDom(html, documentRef) {
        const Parser = root.DOMParser || (documentRef && documentRef.defaultView && documentRef.defaultView.DOMParser);
        if (typeof Parser !== 'function') return null;
        const parsed = new Parser().parseFromString(`<div>${html}</div>`, 'text/html');
        const container = parsed.body && parsed.body.firstElementChild;
        if (!container) return '';

        container.querySelectorAll('script, iframe, object, embed, form, meta, link, base, template').forEach((element) => {
            element.remove();
        });
        container.querySelectorAll('*').forEach((element) => {
            [...element.attributes].forEach((attribute) => {
                const name = attribute.name.toLowerCase();
                if (name.startsWith('on') || name === 'srcdoc') {
                    element.removeAttribute(attribute.name);
                    return;
                }
                if (name === 'href' || name === 'src' || name === 'action' || name === 'formaction' || name === 'xlink:href') {
                    if (!isSafeUrl(attribute.value)) element.removeAttribute(attribute.name);
                    return;
                }
                if (name === 'style') {
                    const safeStyle = sanitizeStyle(attribute.value);
                    if (safeStyle) element.setAttribute('style', safeStyle);
                    else element.removeAttribute('style');
                }
            });

            if (element.tagName.toLowerCase() === 'a' && element.getAttribute('href')) {
                const href = element.getAttribute('href');
                if (/^https?:/i.test(href)) {
                    element.setAttribute('target', '_blank');
                    element.setAttribute('rel', 'noopener noreferrer nofollow');
                }
            }
            if (element.tagName.toLowerCase() === 'img') {
                if (!element.hasAttribute('alt')) element.setAttribute('alt', '');
                element.setAttribute('loading', 'lazy');
                element.setAttribute('decoding', 'async');
            }
        });
        return container.innerHTML;
    }

    function sanitizeWithoutDom(html) {
        return String(html ?? '')
            .replace(/<\s*(script|iframe|object|embed|form|meta|link|base|template)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
            .replace(/<\s*(script|iframe|object|embed|form|meta|link|base|template)\b[^>]*\/?\s*>/gi, '')
            .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
            .replace(/\s+(href|src|action|formaction)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (full, name, quoted) => {
                const value = quoted.replace(/^['"]|['"]$/g, '');
                return isSafeUrl(value) ? full : '';
            });
    }

    function sanitizeMarkdownHtml(html, options = {}) {
        const documentRef = options.document || root.document;
        return sanitizeWithDom(String(html ?? ''), documentRef) ?? sanitizeWithoutDom(html);
    }

    function statusMarkup(kind, title, detail = '') {
        const safeKinds = new Set(['loading', 'error', 'empty', 'success', 'info', 'fallback']);
        const safeKind = safeKinds.has(kind) ? kind : 'info';
        const detailMarkup = detail ? `<p>${escapeHtml(detail)}</p>` : '';
        return `<div class="status status--${safeKind}" role="status" aria-live="polite"><strong>${escapeHtml(title)}</strong>${detailMarkup}</div>`;
    }

    root.escapeHtml = escapeHtml;
    root.resolveImageUrls = resolveImageUrls;
    root.sanitizeMarkdownHtml = sanitizeMarkdownHtml;
    root.statusMarkup = statusMarkup;

    if (typeof module === 'object' && module.exports) {
        module.exports = { escapeHtml, resolveImageUrls, sanitizeMarkdownHtml, statusMarkup };
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
