// 模拟数据保持不变
const posts = [
    {
        title: "我的第一篇博客文章",
        date: "2026-02-09",
        excerpt: "今天终于开始搭建自己的博客了...",
        fullContent: "这是第一篇文章的完整内容。欢迎来到我的个人博客空间！",
        category: "生活"
    },
    {
        title: "学习 CSS Grid 布局",
        date: "2026-02-08",
        excerpt: "Grid 布局是前端开发中非常强大的工具...",
        fullContent: "这是关于 CSS Grid 的详细教程。Grid 允许你创建复杂的网格布局...",
        category: "技术"
    }
];

function renderPosts() {
    const postList = document.getElementById('post-list');
    if(!postList) return; // 确保只在首页执行

    postList.innerHTML = posts.map((post, index) => `
        <article class="post-card">
            <div class="post-meta">${post.date} | ${post.category}</div>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <a href="post.html?id=${index}" class="read-more">阅读全文 →</a>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', renderPosts);