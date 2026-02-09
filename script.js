// 修改点：不要在全局直接赋值，而是在函数执行时动态获取
function renderPosts() {
    const postList = document.getElementById('post-list');
    if (!postList || !window.blogPosts) return;

    postList.innerHTML = window.blogPosts.map((post, index) => `
        <article class="post-card">
            <div class="post-meta">${post.date} | ${post.category}</div>
            
            <h2 class="post-title">
                <a href="post.html?id=${index}">${post.title}</a>
            </h2>
            
            <div class="post-excerpt" onclick="location.href='post.html?id=${index}'">
                <p>${post.excerpt}</p>
            </div>
        </article>
    `).join('');
}

// 确保 DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', renderPosts);