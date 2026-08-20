(function (root) {
    'use strict';

    const MAX_PARTICLES = 120;
    const documentRef = root.document;
    if (!documentRef || !documentRef.body || typeof documentRef.createElement !== 'function') return;

    function mediaMatches(query) {
        if (typeof root.matchMedia !== 'function') return false;
        try {
            return root.matchMedia(query).matches === true;
        } catch (_) {
            return false;
        }
    }

    // A cursor trail adds no value on touch devices or when motion is disabled.
    if (mediaMatches('(prefers-reduced-motion: reduce)')
        || mediaMatches('(pointer: coarse)')
        || mediaMatches('(hover: none)')) return;

    const canvas = documentRef.createElement('canvas');
    const context = canvas.getContext && canvas.getContext('2d');
    if (!context) return;

    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10';
    documentRef.body.appendChild(canvas);

    const dots = [];
    const computed = typeof root.getComputedStyle === 'function'
        ? root.getComputedStyle(documentRef.documentElement || documentRef.body)
        : null;
    const color = computed && typeof computed.getPropertyValue === 'function'
        ? computed.getPropertyValue('--color-teal').trim() || '#1f6f68'
        : '#1f6f68';
    let paused = documentRef.visibilityState === 'hidden';
    let frameId = null;

    function resize() {
        canvas.width = Math.max(1, root.innerWidth || documentRef.documentElement?.clientWidth || 1);
        canvas.height = Math.max(1, root.innerHeight || documentRef.documentElement?.clientHeight || 1);
    }

    function schedule() {
        if (paused || frameId !== null || typeof root.requestAnimationFrame !== 'function') return;
        frameId = root.requestAnimationFrame(animate);
    }

    function stopFrame() {
        if (frameId !== null && typeof root.cancelAnimationFrame === 'function') {
            root.cancelAnimationFrame(frameId);
        }
        frameId = null;
    }

    class Dot {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = 3;
            this.life = 1;
            this.velocity = {
                x: (Math.random() - 0.5) * 1,
                y: (Math.random() - 0.5) * 1
            };
        }

        update() {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.life -= 0.025;
            this.size = Math.max(0.1, this.size - 0.05);
        }

        draw() {
            context.fillStyle = color;
            context.globalAlpha = this.life;
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();
        }
    }

    function animate() {
        frameId = null;
        if (paused) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (let index = dots.length - 1; index >= 0; index -= 1) {
            const dot = dots[index];
            dot.update();
            dot.draw();
            if (dot.life <= 0) dots.splice(index, 1);
        }
        context.globalAlpha = 1;
        if (dots.length) schedule();
    }

    function addDot(x, y) {
        if (paused) return;
        if (dots.length >= MAX_PARTICLES) dots.shift();
        dots.push(new Dot(x, y));
        schedule();
    }

    function handleVisibility() {
        paused = documentRef.visibilityState === 'hidden';
        if (paused) {
            dots.length = 0;
            stopFrame();
            context.clearRect(0, 0, canvas.width, canvas.height);
        } else {
            schedule();
        }
    }

    resize();
    root.addEventListener?.('resize', resize, { passive: true });
    root.addEventListener?.('mousemove', (event) => addDot(event.clientX, event.clientY), { passive: true });
    documentRef.addEventListener?.('visibilitychange', handleVisibility);
    schedule();
})(typeof globalThis !== 'undefined' ? globalThis : window);
