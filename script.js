// 修改点：不要在全局直接赋值，而是在函数执行时动态获取
function renderPosts() {
    const postList = document.getElementById('post-list');
    if(!postList) return;

    // 动态获取最新的数据，如果数据还没加载好，给一个空数组防止报错
    const currentPosts = window.blogPosts || [];

    postList.innerHTML = currentPosts.map((post, index) => `
        <article class="post-card">
            <div class="post-meta">${post.date} | ${post.category}</div>
            <h2>${post.title}</h2>
            <p>${post.excerpt}</p>
            <a href="post.html?id=${index}" class="read-more">阅读全文 →</a>
        </article>
    `).join('');
}

// 确保 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', renderPosts);