(function (root) {
    'use strict';

    const REQUIRED_FIELDS = ['title', 'date', 'excerpt', 'fullContent', 'category'];

    function createError(kind, message, cause) {
        const error = new Error(message);
        error.kind = kind;
        if (cause) error.cause = cause;
        return error;
    }

    function validateBlogPosts(value) {
        if (!Array.isArray(value)) {
            return { ok: false, posts: [], errors: ['blogPosts must be an array'] };
        }

        const errors = [];
        value.forEach((post, index) => {
            if (!post || typeof post !== 'object' || Array.isArray(post)) {
                errors.push(`post ${index} must be an object`);
                return;
            }

            REQUIRED_FIELDS.forEach((field) => {
                if (typeof post[field] !== 'string') {
                    errors.push(`post ${index}.${field} must be a string`);
                }
            });
        });

        return { ok: errors.length === 0, posts: value, errors };
    }

    function parseBlogPostsSource(source) {
        if (typeof source !== 'string') {
            throw createError('data', 'data.js response is not text');
        }

        const assignment = source.replace(/^\uFEFF/, '').trim().match(
            /^window\.blogPosts\s*=\s*([\s\S]*?)\s*;?\s*$/
        );
        if (!assignment) {
            throw createError('data', 'Expected a window.blogPosts assignment');
        }

        let posts;
        try {
            posts = JSON.parse(assignment[1]);
        } catch (error) {
            throw createError('data', 'blogPosts contains invalid JSON', error);
        }

        const validation = validateBlogPosts(posts);
        if (!validation.ok) {
            throw createError('data', validation.errors.join('; '));
        }
        return posts;
    }

    function decodeBase64Utf8(value) {
        if (typeof value !== 'string' || value.trim() === '') {
            throw createError('data', 'GitHub response does not contain Base64 content');
        }

        const encoded = value.replace(/\s/g, '');
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 === 1) {
            throw createError('data', 'GitHub response contains invalid Base64 content');
        }
        const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), '=');
        let bytes;
        try {
            if (typeof root.atob === 'function') {
                const binary = root.atob(padded);
                bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
            } else if (typeof Buffer !== 'undefined') {
                bytes = Uint8Array.from(Buffer.from(padded, 'base64'));
            } else {
                throw createError('data', 'This browser cannot decode Base64 content');
            }
        } catch (error) {
            if (error && error.kind === 'data') throw error;
            throw createError('data', 'GitHub response contains invalid Base64 content', error);
        }

        if (typeof root.TextDecoder === 'function') {
            return new root.TextDecoder('utf-8', { fatal: false }).decode(bytes);
        }

        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return decodeURIComponent(escape(binary));
    }

    function appendCacheBust(url) {
        if (!url) return url;
        return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }

    async function readErrorDetail(response) {
        if (!response || typeof response.text !== 'function') return '';
        try {
            const detail = await response.text();
            return detail ? `: ${detail.slice(0, 160)}` : '';
        } catch (_) {
            return '';
        }
    }

    async function assertResponse(response, label) {
        if (!response || response.ok !== true) {
            const status = response && response.status ? ` (${response.status})` : '';
            const detail = await readErrorDetail(response);
            throw createError('network', `${label} request failed${status}${detail}`);
        }
        return response;
    }

    async function loadRemote(sourceUrl, fetcher) {
        const response = await assertResponse(
            await fetcher(appendCacheBust(sourceUrl), {
                headers: { Accept: 'application/vnd.github+json' },
                cache: 'no-store'
            }),
            'Remote data'
        );

        let payload;
        try {
            payload = await response.json();
        } catch (error) {
            throw createError('data', 'Remote response is not valid JSON', error);
        }

        if (!payload || typeof payload.content !== 'string') {
            throw createError('data', 'Remote response has no data.js content');
        }
        return parseBlogPostsSource(decodeBase64Utf8(payload.content));
    }

    async function loadLocal(sourceUrl, fetcher) {
        const response = await assertResponse(
            await fetcher(sourceUrl, { cache: 'no-store' }),
            'Local data'
        );
        let source;
        try {
            source = await response.text();
        } catch (error) {
            throw createError('data', 'Local data response is not text', error);
        }
        return parseBlogPostsSource(source);
    }

    async function loadBlogPosts(options = {}) {
        const remoteUrl = options.remoteUrl || '';
        const localUrl = options.localUrl === undefined ? 'data.js' : options.localUrl;
        const fetcher = options.fetchImpl || root.fetch;
        if (typeof fetcher !== 'function') {
            return {
                ok: false,
                posts: [],
                source: null,
                error: { kind: 'network', message: 'Fetch is not available' },
                errors: []
            };
        }

        const errors = [];
        const request = (url, requestOptions) => fetcher.call(root, url, requestOptions);

        if (remoteUrl) {
            try {
                const posts = await loadRemote(remoteUrl, request);
                return { ok: true, posts, source: 'remote', warning: null };
            } catch (error) {
                errors.push({ kind: error.kind || 'network', message: error.message });
            }
        }

        if (localUrl) {
            try {
                const posts = await loadLocal(localUrl, request);
                return { ok: true, posts, source: 'local', warning: errors[0] || null };
            } catch (error) {
                errors.push({ kind: error.kind || 'network', message: error.message });
            }
        }

        return {
            ok: false,
            posts: [],
            source: null,
            error: errors[errors.length - 1] || { kind: 'network', message: 'No data source configured' },
            errors
        };
    }

    root.REQUIRED_BLOG_FIELDS = REQUIRED_FIELDS.slice();
    root.validateBlogPosts = validateBlogPosts;
    root.parseBlogPostsSource = parseBlogPostsSource;
    root.decodeBase64Utf8 = decodeBase64Utf8;
    root.loadBlogPosts = loadBlogPosts;

    if (typeof module === 'object' && module.exports) {
        module.exports = {
            REQUIRED_FIELDS,
            validateBlogPosts,
            parseBlogPostsSource,
            decodeBase64Utf8,
            loadBlogPosts
        };
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
