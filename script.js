(function (root) {
    'use strict';

    const LISTING_STATES = new Set(['loading', 'ready', 'empty', 'fallback', 'error']);

    function getDocument(options) {
        return (options && options.document) || root.document || null;
    }

    function getElement(documentRef, id) {
        return documentRef && typeof documentRef.getElementById === 'function'
            ? documentRef.getElementById(id)
            : null;
    }

    function escape(value) {
        if (typeof root.escapeHtml === 'function') return root.escapeHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getListingState(state) {
        return LISTING_STATES.has(state) ? state : 'ready';
    }

    function statusMarkup(kind, title, detail = '', action = '') {
        if (typeof root.statusMarkup === 'function' && !action) {
            return root.statusMarkup(kind, title, detail);
        }
        const normalized = getListingState(kind);
        const safeKind = normalized === 'ready' ? 'info' : normalized;
        const detailMarkup = detail ? `<p>${escape(detail)}</p>` : '';
        const actionMarkup = action
            ? `<button type="button" class="status-action" data-action="retry">${escape(action)}</button>`
            : '';
        return `<div class="status status--${safeKind}" role="status" aria-live="polite"><strong>${escape(title)}</strong>${detailMarkup}${actionMarkup}</div>`;
    }

    function setDataState(element, state) {
        if (!element) return;
        const safeState = getListingState(state);
        if (element.dataset) element.dataset.state = safeState;
        if (typeof element.setAttribute === 'function') element.setAttribute('data-state', safeState);
        if (typeof element.setAttribute === 'function') {
            element.setAttribute('aria-busy', safeState === 'loading' ? 'true' : 'false');
        }
    }

    function setStatus(documentRef, state, title, detail, action) {
        const status = getElement(documentRef, 'listing-status');
        if (!status) return;
        status.innerHTML = statusMarkup(state, title, detail, action);
        if (status.dataset) status.dataset.state = getListingState(state);
    }

    function clearStatus(documentRef) {
        const status = getElement(documentRef, 'listing-status');
        if (!status) return;
        status.innerHTML = '';
        if (status.dataset) status.dataset.state = '';
    }

    function buildPostEntryMarkup(post, index) {
        const item = post && typeof post === 'object' ? post : {};
        const safeIndex = Number.isSafeInteger(index) && index >= 0 ? index : 0;
        const title = item.title == null ? 'Untitled note' : item.title;
        const date = item.date == null ? '' : item.date;
        const category = item.category == null ? 'Note' : item.category;
        const excerpt = item.excerpt == null ? '' : item.excerpt;
        const href = `post.html?id=${safeIndex}`;
        return `<article class="note-entry">
    <div class="note-meta"><time datetime="${escape(date)}">${escape(date)}</time><span class="category">${escape(category)}</span></div>
    <h2><a href="${href}">${escape(title)}</a></h2>
    <p class="note-excerpt">${escape(excerpt)}</p>
    <a class="read-link" href="${href}">阅读文章 <span aria-hidden="true">→</span></a>
</article>`;
    }

    function renderPosts(options = {}) {
        const documentRef = getDocument(options);
        const postList = getElement(documentRef, 'post-list');
        if (!postList) return { ok: false, state: 'error', posts: [] };

        const posts = options.posts === undefined ? root.blogPosts : options.posts;
        if (!Array.isArray(posts)) {
            setDataState(postList, 'loading');
            return { ok: false, state: 'loading', posts: [] };
        }

        const state = getListingState(options.state || (posts.length ? 'ready' : 'empty'));
        setDataState(postList, state);
        if (posts.length === 0) {
            postList.innerHTML = `<div class="empty-list" role="status">${escape(options.emptyMessage || '暂无文章')}</div>`;
        } else {
            postList.innerHTML = posts.map(buildPostEntryMarkup).join('');
        }

        const count = getElement(documentRef, 'post-count');
        if (count) count.textContent = posts.length ? `${posts.length} 篇` : '0 篇';
        return { ok: true, state, posts };
    }

    function resolveRemoteUrl(options) {
        if (options && options.remoteUrl !== undefined) return options.remoteUrl || '';
        const config = (options && options.config) || root.GITHUB_CONFIG || {};
        if (!config.repo || !config.path) return '';
        const branch = config.branch || 'main';
        return `https://api.github.com/repos/${config.repo}/contents/${config.path}?ref=${encodeURIComponent(branch)}`;
    }

    function validatePosts(posts) {
        if (typeof root.validateBlogPosts === 'function') {
            const checked = root.validateBlogPosts(posts);
            return checked && checked.ok === true && Array.isArray(checked.posts) ? checked.posts : null;
        }
        if (!Array.isArray(posts)) return null;
        const fields = ['title', 'date', 'excerpt', 'fullContent', 'category'];
        return posts.every((post) => post && typeof post === 'object' && fields.every((field) => typeof post[field] === 'string'))
            ? posts
            : null;
    }

    function bindRetry(documentRef, retry) {
        const status = getElement(documentRef, 'listing-status');
        if (!status || typeof status.querySelector !== 'function') return;
        const button = status.querySelector('[data-action="retry"]');
        if (!button || typeof button.addEventListener !== 'function') return;
        if (button.dataset && button.dataset.bound === 'true') return;
        if (button.dataset) button.dataset.bound = 'true';
        button.addEventListener('click', () => {
            const pending = retry();
            if (pending && typeof pending.catch === 'function') pending.catch(() => {});
        });
    }

    async function initListingPage(options = {}) {
        const documentRef = getDocument(options);
        const postList = getElement(documentRef, 'post-list');
        if (!postList) return { ok: false, state: 'error', posts: [], document: documentRef };

        setDataState(postList, 'loading');
        postList.innerHTML = '<div class="loading-line" aria-label="Loading articles"><span></span><span></span><span></span></div>';
        setStatus(documentRef, 'loading', '正在加载文章');

        const loader = options.loadPosts || root.loadBlogPosts;
        if (typeof loader !== 'function') {
            setDataState(postList, 'error');
            setStatus(documentRef, 'error', '无法加载文章', '当前环境不支持数据加载。', '重试');
            bindRetry(documentRef, () => initListingPage(options));
            return { ok: false, state: 'error', posts: [], document: documentRef };
        }

        let result;
        try {
            const request = {
                remoteUrl: resolveRemoteUrl(options),
                localUrl: options.localUrl === undefined ? 'data.js' : options.localUrl
            };
            if (options.fetchImpl) request.fetchImpl = options.fetchImpl;
            result = await loader(request);
        } catch (error) {
            result = { ok: false, error: { kind: error.kind || 'network', message: error.message || 'Network error' } };
        }

        const posts = result && result.ok === true ? validatePosts(result.posts) : null;
        if (!posts) {
            const detail = result && result.error && result.error.message
                ? result.error.message
                : '数据格式无效或暂时不可用。';
            setDataState(postList, 'error');
            postList.innerHTML = '';
            setStatus(documentRef, 'error', '文章加载失败', detail, '重试');
            bindRetry(documentRef, () => initListingPage(options));
            return { ok: false, state: 'error', posts: [], error: result && result.error, document: documentRef };
        }

        // Set the shared contract only after the loader and shape validator succeed.
        root.blogPosts = posts;
        const state = posts.length === 0 ? 'empty' : (result.warning ? 'fallback' : 'ready');
        renderPosts({ document: documentRef, posts, state });
        if (state === 'empty') {
            setStatus(documentRef, 'empty', '还没有文章', '新的笔记会出现在这里。');
        } else if (state === 'fallback') {
            setStatus(documentRef, 'fallback', '已使用本地数据', result.warning.message || '远程数据暂时不可用。');
        } else {
            clearStatus(documentRef);
        }
        return { ok: true, state, posts, source: result.source || null, document: documentRef };
    }

    const api = {
        LISTING_STATES: [...LISTING_STATES],
        buildPostEntryMarkup,
        getListingState,
        renderPosts,
        initListingPage
    };

    root.buildPostEntryMarkup = buildPostEntryMarkup;
    root.getListingState = getListingState;
    root.renderPosts = renderPosts;
    root.initListingPage = initListingPage;

    if (typeof module === 'object' && module.exports) module.exports = api;

    if (root.document && typeof module === 'undefined') {
        const start = () => initListingPage();
        if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start);
        else start();
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
