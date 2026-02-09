// githubService.js
const GITHUB_CONFIG = {
    repo: "zmhsena/BlogWeb",
    path: "data.js",
    branch: "master"
};

async function updateGitHubData(newContent, token) { // 接收 token 参数
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
                message: `Admin update: ${new Date().toLocaleString()}`,
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