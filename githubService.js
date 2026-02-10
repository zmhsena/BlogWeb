const GITHUB_CONFIG = {
    repo: "你的用户名/仓库名",
    path: "data.js",
    branch: "master"
};

async function githubAPI(method, body = null, token) {
    // 1. 获取文件的最新 SHA (每次修改前必须获取)
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=${GITHUB_CONFIG.branch}`, {
        headers: { "Authorization": `token ${token}` }
    });
    const fileData = await getRes.json();
    const sha = fileData.sha;

    // 2. 执行增/删/改操作
    const res = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Blog update: ${new Date().toLocaleString()}`,
            content: btoa(unescape(encodeURIComponent(body))), // 处理中文编码并转为 Base64
            sha: sha,
            branch: GITHUB_CONFIG.branch
        })
    });

    return res.ok;
}