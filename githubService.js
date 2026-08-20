// githubService.js
// githubService.js
const GITHUB_CONFIG = {
    repo: "zmhsena/BlogWeb",
    path: "data.js",
    branch: "dataBranch" //数据分支
};

// 新增：获取当前配置分支的原始资源根目录
async function githubFetch(url, options = {}) {
    const { fetchImpl, ...requestOptions } = options;
    const fetcher = fetchImpl || (typeof fetch === 'function' ? fetch : null);
    if (typeof fetcher !== 'function') {
        const error = new Error('Fetch is not available');
        error.kind = 'network';
        throw error;
    }

    const response = await fetcher(url, requestOptions);
    if (!response || response.ok !== true) {
        let detail = '';
        if (response && typeof response.text === 'function') {
            try {
                const textResponse = typeof response.clone === 'function' ? response.clone() : response;
                const body = await textResponse.text();
                detail = body ? `: ${body.slice(0, 160)}` : '';
            } catch (_) {
                detail = '';
            }
        }
        const error = new Error(`GitHub request failed${response && response.status ? ` (${response.status})` : ''}${detail}`);
        error.kind = 'network';
        error.status = response && response.status;
        error.statusText = response && response.statusText;
        throw error;
    }
    return response;
}

function getRawRoot() {
    return `https://raw.githubusercontent.com/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/`;
}

async function updateGitHubData(newContent, token) {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

    try {
        // 【关键修复】添加 t=Date.now() 确保拿到最新的 SHA 值，否则删除操作会因为 SHA 不匹配被 GitHub 拒绝
        const getRes = await fetch(`${url}?ref=${GITHUB_CONFIG.branch}&t=${Date.now()}`, {
            headers: { "Authorization": `token ${token}` }
        });

        const fileData = await getRes.json();
        const sha = fileData.sha;

        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Admin Delete/Update: ${new Date().toLocaleString()}`,
                content: btoa(unescape(encodeURIComponent(newContent))),
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });

        return putRes.ok;
    } catch (err) {
        console.error("API 错误:", err);
        return false;
    }
}

if (typeof globalThis !== 'undefined') {
    globalThis.GITHUB_CONFIG = GITHUB_CONFIG;
    globalThis.githubFetch = githubFetch;
    globalThis.getRawRoot = getRawRoot;
}

if (typeof module === 'object' && module.exports) {
    module.exports = { GITHUB_CONFIG, githubFetch, getRawRoot, updateGitHubData };
}
