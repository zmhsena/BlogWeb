// githubService.js
const GITHUB_CONFIG = {
    repo: "zmhsena/BlogWeb",
    path: "data.js",
    branch: "master"
};

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