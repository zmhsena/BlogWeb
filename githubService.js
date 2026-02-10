const GITHUB_TOKEN = "你的_GITHUB_PAT_TOKEN_粘贴在这里";
const GITHUB_CONFIG = {
    repo: "zmhsena/BlogWeb", // 例如: "jack/my-blog"
    path: "data.js",
    branch: "master"
};

async function updateGitHubData(newContent) {
    const url = `https://api.api.github.com/repos/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;

    try {
        // 1. 获取当前文件的 SHA 校验值
        const getRes = await fetch(`${url}?ref=${GITHUB_CONFIG.branch}`, {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` }
        });
        const fileData = await getRes.json();
        const sha = fileData.sha;

        // 2. 提交更新
        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Update blog data: ${new Date().toLocaleString()}`,
                content: btoa(unescape(encodeURIComponent(newContent))), // 处理中文并转为 Base64
                sha: sha,
                branch: GITHUB_CONFIG.branch
            })
        });

        return putRes.ok;
    } catch (err) {
        console.error("GitHub API Error:", err);
        return false;
    }
}

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