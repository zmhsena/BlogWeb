(function (root) {
    'use strict';

    function getRequestedPostId(search) {
        const value = search === undefined
            ? (root.location && root.location.search) || ''
            : String(search || '');
        let raw;
        try {
            raw = new URLSearchParams(value).get('id');
        } catch (_) {
            raw = null;
        }
        if (!raw || !/^\d+$/.test(raw)) return null;
        const id = Number(raw);
        return Number.isSafeInteger(id) && id >= 0 ? id : null;
    }

    function getElement(documentRef, id) {
        return documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById(id)
            : null;
    }

    function setStatus(documentRef, kind, title, detail) {
        const status = getElement(documentRef, 'detail-status');
        if (status) {
            const markup = typeof root.statusMarkup === 'function'
                ? root.statusMarkup(kind, title, detail)
                : `<div class="status status--${kind}" role="status"><strong>${String(title || '')}</strong></div>`;
            status.innerHTML = markup;
        }
    }

    function clearStatus(documentRef) {
        const status = getElement(documentRef, 'detail-status');
        if (status) status.innerHTML = '';
    }

    function renderMeta(element, post) {
        if (!element) return;
        const escape = typeof root.escapeHtml === 'function' ? root.escapeHtml : (value) => String(value ?? '');
        const date = String(post.date || '');
        const category = String(post.category || 'Note');
        element.innerHTML = `<time datetime="${escape(date)}">${escape(date)}</time><span>${escape(category)}</span>`;
    }

    function markdownToHtml(markdown, options) {
        const source = String(markdown || '');
        const markedRef = options.marked || root.marked;
        let html;
        if (markedRef && typeof markedRef.setOptions === 'function') {
            markedRef.setOptions({ breaks: true, gfm: true });
        }
        if (markedRef && typeof markedRef.parse === 'function') {
            html = markedRef.parse(source);
        } else if (typeof markedRef === 'function') {
            html = markedRef(source);
        } else {
            const escape = typeof root.escapeHtml === 'function' ? root.escapeHtml : (value) => String(value ?? '');
            html = `<p>${escape(source).replace(/\n/g, '<br>')}</p>`;
        }

        const imageRoot = options.rawRoot !== undefined
            ? options.rawRoot
            : (typeof root.getRawRoot === 'function' ? root.getRawRoot() : '');
        if (typeof root.resolveImageUrls === 'function') html = root.resolveImageUrls(html, imageRoot);
        if (typeof root.sanitizeMarkdownHtml === 'function') html = root.sanitizeMarkdownHtml(html, { document: options.document });
        return html;
    }

    function enhanceContent(content, options) {
        if (!content || typeof content.querySelectorAll !== 'function') return;
        const images = [...content.querySelectorAll('img')];
        images.forEach((image, index) => {
            if (index === 0) image.removeAttribute('loading');
            else image.setAttribute('loading', 'lazy');
            image.setAttribute('decoding', 'async');
        });

        const highlighter = options.hljs || root.hljs;
        if (!highlighter || typeof highlighter.highlightElement !== 'function') return;
        [...content.querySelectorAll('pre code')].forEach((code) => {
            const alreadyHighlighted = code.classList && code.classList.contains('hljs');
            if (!alreadyHighlighted) highlighter.highlightElement(code);
        });
    }

    function renderPostDetail(post, options = {}) {
        const documentRef = options.document || root.document;
        const title = getElement(documentRef, 'detail-title');
        const kicker = getElement(documentRef, 'detail-kicker');
        const meta = getElement(documentRef, 'detail-meta');
        const content = getElement(documentRef, 'detail-content');
        if (!post) return false;

        if (kicker) kicker.textContent = `NOTE / ${post.category || 'ARTICLE'}`;
        if (title) title.textContent = String(post.title || 'Untitled article');
        renderMeta(meta, post);
        if (content) {
            content.innerHTML = markdownToHtml(post.fullContent, { ...options, document: documentRef });
            enhanceContent(content, options);
        }
        return true;
    }

    function renderInvalid(documentRef, detail) {
        const title = getElement(documentRef, 'detail-title');
        const meta = getElement(documentRef, 'detail-meta');
        const content = getElement(documentRef, 'detail-content');
        if (title) title.textContent = '文章参数无效';
        if (meta) meta.innerHTML = '';
        if (content) content.innerHTML = '';
        setStatus(documentRef, 'error', '无法打开文章', detail || '请从文章列表重新进入。');
    }

    function attachTopButton(documentRef) {
        if (!documentRef || typeof documentRef.querySelector !== 'function') return;
        const button = documentRef.querySelector('[data-scroll-top]');
        if (!button || button.dataset && button.dataset.bound === 'true') return;
        if (button.dataset) button.dataset.bound = 'true';
        button.addEventListener('click', () => {
            if (typeof root.scrollTo === 'function') root.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    async function initPostPage(options = {}) {
        const documentRef = options.document || root.document;
        attachTopButton(documentRef);
        const id = getRequestedPostId(options.search);
        if (id === null) {
            renderInvalid(documentRef, '文章链接缺少有效的 id。');
            return { ok: false, reason: 'invalid-id' };
        }

        const title = getElement(documentRef, 'detail-title');
        if (title) title.textContent = '正在加载文章...';
        setStatus(documentRef, 'loading', '正在读取文章');

        const config = options.config || root.GITHUB_CONFIG || {};
        const remoteUrl = options.remoteUrl !== undefined
            ? options.remoteUrl
            : (config.repo && config.path
                ? `https://api.github.com/repos/${config.repo}/contents/${config.path}?ref=${config.branch || 'main'}`
                : '');
        const loader = options.loadPosts || root.loadBlogPosts;
        if (typeof loader !== 'function') {
            setStatus(documentRef, 'error', '无法加载文章', '当前环境不支持数据加载。');
            return { ok: false, reason: 'loader-missing' };
        }

        let result;
        try {
            result = await loader({
                remoteUrl,
                localUrl: options.localUrl === undefined ? 'data.js' : options.localUrl,
                fetchImpl: options.fetchImpl
            });
        } catch (error) {
            result = { ok: false, error: { message: error.message || 'Network error' } };
        }
        if (!result || result.ok !== true) {
            const message = result && result.error && result.error.message;
            const meta = getElement(documentRef, 'detail-meta');
            const content = getElement(documentRef, 'detail-content');
            if (meta) meta.innerHTML = '';
            if (content) content.innerHTML = '';
            setStatus(documentRef, 'error', '文章加载失败', message || '请稍后重试。');
            return { ok: false, reason: 'load-error', error: result && result.error };
        }

        const posts = Array.isArray(result.posts) ? result.posts : [];
        root.blogPosts = posts;
        if (!posts[id]) {
            const notFoundTitle = getElement(documentRef, 'detail-title');
            const notFoundMeta = getElement(documentRef, 'detail-meta');
            const notFoundContent = getElement(documentRef, 'detail-content');
            if (notFoundTitle) notFoundTitle.textContent = '文章不存在';
            if (notFoundMeta) notFoundMeta.innerHTML = '';
            if (notFoundContent) notFoundContent.innerHTML = '';
            setStatus(documentRef, 'empty', '找不到这篇文章', '它可能已被删除，或链接中的 id 已失效。');
            return { ok: false, reason: 'not-found' };
        }

        renderPostDetail(posts[id], { ...options, document: documentRef });
        if (result.warning) {
            setStatus(documentRef, 'fallback', '已使用本地数据', result.warning.message || '远程数据暂时不可用。');
        } else {
            clearStatus(documentRef);
        }
        return { ok: true, post: posts[id], source: result.source || null };
    }

    const api = { getRequestedPostId, renderPostDetail, initPostPage };
    root.getRequestedPostId = getRequestedPostId;
    root.renderPostDetail = renderPostDetail;
    root.initPostPage = initPostPage;

    if (typeof module === 'object' && module.exports) module.exports = api;

    if (root.document && typeof module === 'undefined') {
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => initPostPage());
        else initPostPage();
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
