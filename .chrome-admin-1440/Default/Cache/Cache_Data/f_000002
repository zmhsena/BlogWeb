(function (root) {
    'use strict';

    const state = {
        posts: [],
        pendingImages: [],
        bound: false
    };

    function element(id) {
        return typeof document === 'undefined' ? null : document.getElementById(id);
    }

    function today() {
        return new Date().toISOString().split('T')[0];
    }

    function sanitizeFileName(name) {
        const segments = String(name || 'image')
            .trim()
            .split(/[\\/]+/)
            .filter((segment) => segment && segment !== '.' && segment !== '..');
        return (segments.join('_') || 'image')
            .replace(/\s+/g, '_')
            .replace(/[()[\]{}]/g, '')
            .replace(/^[.]+/, '')
            .replace(/_+/g, '_');
    }

    function extractImageNames(content) {
        const names = [];
        const regex = /(?:^|[[(])images\/([^\/\\\)\s"']+)/g;
        let match;
        while ((match = regex.exec(String(content || ''))) !== null) {
            const name = match[1];
            if (name === '.' || name === '..' || name.startsWith('.')) continue;
            if (!names.includes(name)) names.push(name);
        }
        return names;
    }

    function getOrphanImageNames(targetPost, otherPosts) {
        const targetImages = extractImageNames(targetPost && targetPost.fullContent);
        const otherImages = new Set();
        (otherPosts || []).forEach((post) => {
            extractImageNames(post && post.fullContent).forEach((name) => otherImages.add(name));
        });
        return targetImages.filter((name) => !otherImages.has(name));
    }

    function buildPostRecord(input, date = today()) {
        const content = String(input && input.content || '');
        const excerpt = content.substring(0, 100).replace(/[#*`\n]/g, '').trim() + '...';
        return {
            title: String(input && input.title || '').trim(),
            date,
            excerpt,
            fullContent: content,
            category: String(input && input.category || '').trim() || '未分类'
        };
    }

    function getToken() {
        const input = element('token-input');
        return input ? input.value.trim() : '';
    }

    function setStatus(kind, title, detail = '') {
        const target = element('admin-status');
        if (target && typeof root.statusMarkup === 'function') {
            target.innerHTML = root.statusMarkup(kind, title, detail);
        }
    }

    function setPublishStatus(kind, title, detail = '') {
        const target = element('publish-status');
        if (target && typeof root.statusMarkup === 'function') {
            target.innerHTML = root.statusMarkup(kind, title, detail);
        }
    }

    function withTokenFetch(token) {
        return (url, options = {}) => {
            const headers = { ...(options.headers || {}) };
            if (token) headers.Authorization = `token ${token}`;
            return fetch(url, { ...options, headers });
        };
    }

    async function fetchLatestDataFromCloud() {
        const remoteUrl = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`;
        const token = getToken();
        const result = await root.loadBlogPosts({
            remoteUrl,
            localUrl: 'data.js',
            fetchImpl: withTokenFetch(token)
        });

        if (result.ok) {
            state.posts = result.posts;
            root.blogPosts = state.posts;
            if (result.source === 'local') {
                setStatus('fallback', '已使用本地数据', result.warning ? result.warning.message : 'GitHub 暂时无法访问。');
            } else {
                setStatus('success', '已连接 GitHub', `${state.posts.length} 篇文章已载入。`);
            }
        } else {
            state.posts = [];
            root.blogPosts = state.posts;
            setStatus('error', '无法读取文章数据', result.error ? result.error.message : '请检查网络或令牌。');
        }
        return result;
    }

    function renderAdminPosts() {
        const list = element('admin-post-list');
        if (!list) return;
        list.replaceChildren();

        if (!state.posts.length) {
            list.innerHTML = root.statusMarkup
                ? root.statusMarkup('empty', '还没有文章', '从右侧编辑器开始写第一篇笔记。')
                : '<p>还没有文章。</p>';
            return;
        }

        state.posts.forEach((post, index) => {
            const item = document.createElement('article');
            item.className = 'admin-item';
            item.innerHTML = `
                <div class="admin-item-copy">
                    <strong>${root.escapeHtml(post.title)}</strong>
                    <small>${root.escapeHtml(post.date)} · ${root.escapeHtml(post.category)}</small>
                </div>
                <div class="admin-item-actions">
                    <button type="button" data-action="edit" data-index="${index}">编辑</button>
                    <button type="button" class="danger-button" data-action="delete" data-index="${index}">删除</button>
                </div>`;
            list.appendChild(item);
        });
    }

    function renderAdminList() {
        renderAdminPosts();
    }

    function saveTokenToLocal() {
        const token = getToken();
        if (!token) {
            setStatus('error', '还没有输入令牌', '请输入 GitHub Personal Access Token。');
            return false;
        }
        try {
            localStorage.setItem('my_gh_token', token);
        } catch (_) {
            setStatus('error', '无法保存令牌', '浏览器存储不可用；本次仍可继续使用。');
            return false;
        }
        setStatus('success', '令牌已保存在本地', '令牌不会写入文章数据或提交到仓库。');
        return true;
    }

    function clearToken() {
        try { localStorage.removeItem('my_gh_token'); } catch (_) { /* storage may be disabled */ }
        const input = element('token-input');
        if (input) input.value = '';
        setStatus('info', '已清除本地令牌', '下次发布前需要重新输入令牌。');
    }

    function replaceSelection(replacement) {
        const textarea = element('post-content');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.setRangeText(replacement, start, end, 'select');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
    }

    function insertBigText() {
        const textarea = element('post-content');
        if (!textarea || textarea.selectionStart === textarea.selectionEnd) {
            setPublishStatus('info', '先选择一段文字', '选择文字后再使用大字号格式。');
            return;
        }
        const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        replaceSelection(`<span style="font-size: 24px; font-weight: bold;">${selected}</span>`);
    }

    function insertImageMarkdown(textarea, fileName) {
        if (!textarea) return;
        const markdown = `![${fileName}](images/${fileName})`;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.setRangeText(markdown, start, end, 'select');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function insertFormat(type, colorValue = null) {
        const textarea = element('post-content');
        if (!textarea) return;
        const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
        const sample = selected || '选择的文字';
        let replacement = '';

        if (type === 'bold') replacement = `**${sample}**`;
        if (type === 'italic') replacement = `*${sample}*`;
        if (type === 'color') replacement = `<span style="color:${colorValue || '#1f6f68'}">${sample}</span>`;
        if (type === 'highlight') replacement = `<mark>${sample}</mark>`;
        if (type === 'image') {
            const url = root.prompt ? root.prompt('图片链接') : '';
            if (url) replacement = `![图片描述](${url.trim()})`;
        }
        if (replacement) replaceSelection(replacement);
    }

    function getPreviewContent() {
        let content = element('post-content') ? element('post-content').value : '';
        state.pendingImages.forEach((image) => {
            content = content.split(`images/${image.name}`).join(image.localUrl);
        });
        return root.resolveImageUrls(content, getRawRoot());
    }

    function updatePreview() {
        const preview = element('live-preview');
        if (!preview) return;
        const content = getPreviewContent();
        if (typeof root.marked === 'undefined' || typeof root.marked.parse !== 'function') {
            preview.textContent = content;
            return;
        }
        const html = root.marked.parse(content, { breaks: true, gfm: true });
        preview.innerHTML = root.sanitizeMarkdownHtml(html, { allowDataImages: true });
    }

    async function processImage(file) {
        if (!file || !file.type || !file.type.startsWith('image/')) return;
        const textarea = element('post-content');
        const token = getToken();
        const fileName = sanitizeFileName(file.name);
        const path = `images/${fileName}`;
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}?ref=${GITHUB_CONFIG.branch}`;

        if (token) {
            try {
                const existing = await fetch(url, { headers: { Authorization: `token ${token}` } });
                if (existing.ok) {
                    insertImageMarkdown(textarea, fileName);
                    setPublishStatus('info', '已引用仓库中的图片', fileName);
                    return;
                }
            } catch (_) { /* continue with a local upload queue */ }
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const localUrl = event.target.result;
            state.pendingImages.push({ name: fileName, content: localUrl.split(',')[1], localUrl });
            insertImageMarkdown(textarea, fileName);
            setPublishStatus('info', '图片已加入上传队列', fileName);
        };
        reader.readAsDataURL(file);
    }

    function initDragAndDrop() {
        const textarea = element('post-content');
        if (!textarea || textarea.dataset.dragBound === 'true') return;
        textarea.dataset.dragBound = 'true';
        textarea.addEventListener('dragover', (event) => {
            event.preventDefault();
            textarea.classList.add('is-dragging');
        });
        textarea.addEventListener('dragleave', () => textarea.classList.remove('is-dragging'));
        textarea.addEventListener('drop', async (event) => {
            event.preventDefault();
            textarea.classList.remove('is-dragging');
            for (const file of event.dataTransfer.files) await processImage(file);
        });
    }

    function editPost(index) {
        const post = state.posts[index];
        if (!post) return;
        element('edit-index').value = String(index);
        element('post-title').value = post.title;
        element('post-category').value = post.category;
        element('post-content').value = post.fullContent;
        element('form-title').textContent = '编辑文章';
        updatePreview();
        element('post-title').focus();
    }

    function resetForm() {
        element('edit-index').value = '-1';
        element('post-title').value = '';
        element('post-category').value = '';
        element('post-content').value = '';
        element('form-title').textContent = '撰写新文章';
        state.pendingImages = [];
        updatePreview();
    }

    function encodeUtf8Base64(value) {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    }

    async function uploadFileToGitHub(path, base64Content, token) {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Upload image: ${path}`,
                content: base64Content,
                branch: GITHUB_CONFIG.branch
            })
        });
        if (!response.ok) throw new Error(`图片上传失败 (${response.status})`);
        return true;
    }

    async function syncToGitHub(updatedPosts, token) {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
        const getResponse = await fetch(`${url}?ref=${GITHUB_CONFIG.branch}&t=${Date.now()}`, {
            headers: { Authorization: `token ${token}` },
            cache: 'no-store'
        });
        if (!getResponse.ok) throw new Error(`读取 data.js 失败 (${getResponse.status})`);
        const fileData = await getResponse.json();
        const newFileContent = `window.blogPosts = ${JSON.stringify(updatedPosts, null, 2)};`;
        const putResponse = await fetch(url, {
            method: 'PUT',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Admin update: ${new Date().toLocaleString()}`,
                content: encodeUtf8Base64(newFileContent),
                sha: fileData.sha,
                branch: GITHUB_CONFIG.branch
            })
        });
        if (!putResponse.ok) throw new Error(`写入 data.js 失败 (${putResponse.status})`);
        return true;
    }

    async function savePost(event) {
        if (event) event.preventDefault();
        const token = getToken();
        const title = element('post-title').value.trim();
        const content = element('post-content').value;
        const button = element('submit-btn');
        if (!token) {
            setPublishStatus('error', '无法发布', '请先输入 GitHub Personal Access Token。');
            return false;
        }
        if (!title || !content.trim()) {
            setPublishStatus('error', '无法发布', '标题和正文不能为空。');
            return false;
        }

        const originalLabel = button.textContent;
        button.disabled = true;
        button.textContent = '正在发布...';
        try {
            setPublishStatus('info', '正在上传图片', '请保持当前页面打开。');
            for (const image of state.pendingImages) await uploadFileToGitHub(`images/${image.name}`, image.content, token);

            const index = Number.parseInt(element('edit-index').value, 10);
            const nextPost = buildPostRecord({ title, category: element('post-category').value, content });
            const updatedPosts = state.posts.slice();
            if (index === -1) updatedPosts.unshift(nextPost);
            else updatedPosts[index] = nextPost;

            setPublishStatus('info', '正在同步文章', '正在写入 GitHub。');
            await syncToGitHub(updatedPosts, token);
            state.posts = updatedPosts;
            root.blogPosts = state.posts;
            state.pendingImages = [];
            renderAdminPosts();
            resetForm();
            setPublishStatus('success', '发布成功', '文章和图片已同步到 GitHub。');
            return true;
        } catch (error) {
            setPublishStatus('error', '发布失败', error.message || '请检查令牌、网络和仓库权限。');
            return false;
        } finally {
            button.disabled = false;
            button.textContent = originalLabel;
        }
    }

    async function deleteFileFromGitHub(path, token) {
        const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${path}`;
        const getResponse = await fetch(`${url}?ref=${GITHUB_CONFIG.branch}`, { headers: { Authorization: `token ${token}` } });
        if (!getResponse.ok) return false;
        const fileData = await getResponse.json();
        const deleteResponse = await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Delete orphan image: ${path}`,
                sha: fileData.sha,
                branch: GITHUB_CONFIG.branch
            })
        });
        if (!deleteResponse.ok) throw new Error(`删除图片失败 (${deleteResponse.status})`);
        return true;
    }

    async function deletePost(index) {
        const token = getToken();
        if (!token) {
            setStatus('error', '无法删除', '请先输入 GitHub Personal Access Token。');
            return false;
        }
        const target = state.posts[index];
        if (!target || !root.confirm || !root.confirm('确定删除这篇文章吗？未被其他文章使用的图片也会被清理。')) return false;

        const remaining = state.posts.filter((_, postIndex) => postIndex !== index);
        try {
            for (const imageName of getOrphanImageNames(target, remaining)) {
                await deleteFileFromGitHub(`images/${imageName}`, token);
            }
            await syncToGitHub(remaining, token);
            state.posts = remaining;
            root.blogPosts = state.posts;
            renderAdminPosts();
            setStatus('success', '文章已删除', '未被引用的图片也已清理。');
            return true;
        } catch (error) {
            setStatus('error', '删除失败', error.message || '请检查 GitHub 权限。');
            return false;
        }
    }

    function bindEvents() {
        if (state.bound || typeof document === 'undefined') return;
        state.bound = true;
        const tokenInput = element('token-input');
        try {
            const savedToken = localStorage.getItem('my_gh_token');
            if (savedToken && tokenInput) tokenInput.value = savedToken;
        } catch (_) { /* storage may be disabled */ }

        element('save-token-btn').addEventListener('click', saveTokenToLocal);
        element('clear-token-btn').addEventListener('click', clearToken);
        element('new-post-btn').addEventListener('click', resetForm);
        element('reset-btn').addEventListener('click', resetForm);
        element('editor-form').addEventListener('submit', savePost);
        ['post-title', 'post-category', 'post-content'].forEach((id) => element(id).addEventListener('input', updatePreview));
        element('post-content').addEventListener('paste', updatePreview);
        element('admin-post-list').addEventListener('click', (event) => {
            const button = event.target.closest('[data-action]');
            if (!button) return;
            const index = Number.parseInt(button.dataset.index, 10);
            if (button.dataset.action === 'edit') editPost(index);
            if (button.dataset.action === 'delete') deletePost(index);
        });
        document.querySelector('.toolbar').addEventListener('click', (event) => {
            const button = event.target.closest('[data-format]');
            if (!button) return;
            if (button.dataset.format === 'big') {
                insertBigText();
                return;
            }
            insertFormat(button.dataset.format, button.dataset.color || null);
        });
        initDragAndDrop();
    }

    async function initAdmin() {
        bindEvents();
        updatePreview();
        setStatus('loading', '正在读取文章', '正在连接 GitHub。');
        await fetchLatestDataFromCloud();
        renderAdminPosts();
    }

    const publicApi = {
        sanitizeFileName,
        extractImageNames,
        getOrphanImageNames,
        buildPostRecord,
        fetchLatestDataFromCloud,
        renderAdminPosts,
        renderAdminList,
        saveTokenToLocal,
        clearToken,
        insertBigText,
        insertFormat,
        updatePreview,
        processImage,
        editPost,
        resetForm,
        uploadFileToGitHub,
        syncToGitHub,
        savePost,
        deleteFileFromGitHub,
        deletePost,
        initDragAndDrop
    };

    Object.entries(publicApi).forEach(([name, value]) => { root[name] = value; });
    if (typeof module === 'object' && module.exports) module.exports = publicApi;
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', initAdmin, { once: true });
    }
})(typeof globalThis !== 'undefined' ? globalThis : window);
