// githubService.js 里面不要放真正的 Token 字符串
const GITHUB_CONFIG = {
    repo: "zmhsena/BlogWeb",
    path: "data.js",
    branch: "master" // 你的分支是 master
};

async function updateGitHubData(newContent) {
    // 优先从本地存储获取，如果没有则弹窗询问
    let token = localStorage.getItem('my_gh_token');

    if (!token) {
        token = prompt("请输入您的 GitHub Personal Access Token:");
        if (token) localStorage.setItem('my_gh_token', token);
    }

    if (!token) return alert("没有 Token 无法保存");

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

    try {
        const getRes = await fetch(`${url}?ref=${GITHUB_CONFIG.branch}`, {
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
                message: `Update blog: ${new Date().toLocaleString()}`,
                content: btoa(unescape(encodeURIComponent(newContent))),
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });

        return putRes.ok;
    } catch (err) {
        console.error(err);
        return false;
    }
}