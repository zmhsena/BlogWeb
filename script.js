// 模拟数据保持不变
const posts = window.blogPosts;

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