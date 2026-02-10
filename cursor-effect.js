// cursor-effect.js
(function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none'; // 确保不干扰点击
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    let dots = [];
    const color = '#3498db'; // 你可以改成和你 style.css 一致的蓝色

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    // 监听鼠标移动
    window.addEventListener('mousemove', (e) => {
        dots.push(new Dot(e.clientX, e.clientY));
    });

    class Dot {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = 3;
            this.life = 1; // 寿命 1.0 -> 0
            this.velocity = {
                x: (Math.random() - 0.5) * 1,
                y: (Math.random() - 0.5) * 1
            };
        }

        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.life -= 0.02; // 消失速度
            if (this.size > 0.1) this.size -= 0.05;
        }

        draw() {
            this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = this.life;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < dots.length; i++) {
            dots[i].update();
            dots[i].draw();

            if (dots[i].life <= 0) {
                dots.splice(i, 1);
                i--;
            }
        }
        requestAnimationFrame(animate);
    }

    animate();
})();