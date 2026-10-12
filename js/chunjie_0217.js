/* ============================================================
   零源机构 · 移动端 / 春节 · 正月初一
   chunjie_0217.js — 粒子背景 + 福字翻转 + 烟花
   对应 PC 端 pc/festival/js/chunjie_0217.js，移动端改写要点：
   1. 粒子数量随屏宽线性削减（320px≈27，768px≈64，下限 14 / 上限 72）
   2. DPR 上限 2，避免高密度屏白烧 GPU
   3. 页面进入后台（visibilitychange hidden）时暂停 requestAnimationFrame
   4. 去掉 PC 端的鼠标 3D 倾斜（移动端无悬停）
   ============================================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0;
    var H = 0;
    var dpr = 1;

    /* ---------- 工具 ---------- */
    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    /* 粒子数量按屏宽削减：320px→27 个，768px→64 个 */
    function density(w, divisor, lo, hi) {
        return Math.max(lo, Math.min(hi, Math.round(w / divisor)));
    }

    /* ============================================================
       1. 背景浮动光斑
       ============================================================ */
    var orbs = [];

    function Orb() {
        this.reset(true);
    }

    Orb.prototype.reset = function (first) {
        this.x = rand(0, W);
        this.y = first ? rand(0, H) : H + 40;
        this.radius = rand(24, 92);
        this.speed = rand(0.25, 0.85);
        this.drift = rand(-0.28, 0.28);
        this.hue = Math.random() > 0.5 ? 350 : 30;
        this.alpha = rand(0.04, 0.1);
    };

    Orb.prototype.update = function () {
        this.y -= this.speed;
        this.x += this.drift;
        if (this.y < -this.radius * 2 || this.x < -this.radius * 2 || this.x > W + this.radius * 2) {
            this.reset(false);
        }
    };

    Orb.prototype.draw = function () {
        var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        g.addColorStop(0, 'hsla(' + this.hue + ', 90%, 65%, ' + this.alpha + ')');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    };

    function buildOrbs() {
        var n = density(W, 12, 14, 72);
        orbs = [];
        for (var i = 0; i < n; i++) orbs.push(new Orb());
    }

    /* ============================================================
       2. 烟花粒子（点击 / 按钮触发）
       ============================================================ */
    var particles = [];
    var FW_COLORS = ['#ff4d6d', '#ff8c42', '#ffd166', '#fff', '#ff6b9d', '#ffa94d'];
    var MAX_PARTICLES = 520;

    function Particle(x, y, color) {
        this.x = x;
        this.y = y;
        var angle = Math.random() * Math.PI * 2;
        var speed = 2 + Math.random() * 5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.color = color;
        this.life = 1;
        this.decay = 0.012 + Math.random() * 0.014;
        this.size = 2 + Math.random() * 3;
    }

    Particle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.06;
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life -= this.decay;
        return this.life > 0;
    };

    Particle.prototype.draw = function () {
        ctx.save();
        ctx.globalAlpha = Math.max(this.life, 0);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(this.size * this.life, 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    /* 移动端一次爆炸 26~40 颗，避免粒子爆炸式堆积 */
    function launchFirework(x, y) {
        if (particles.length > MAX_PARTICLES) return;
        var color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
        var count = reduced ? 16 : 26 + Math.floor(Math.random() * 14);
        for (var i = 0; i < count; i++) {
            particles.push(new Particle(x, y, color));
        }
    }

    /* 同时多发，形成"一簇烟花" */
    function burst(x, y, shots) {
        for (var i = 0; i < shots; i++) {
            (function (k) {
                setTimeout(function () {
                    launchFirework(
                        x + rand(-26, 26),
                        y + rand(-40, 10)
                    );
                }, k * 150);
            })(i);
        }
    }

    /* ============================================================
       3. 渲染循环（隐藏时暂停 rAF）
       ============================================================ */
    var rafId = null;
    var running = false;

    function frame() {
        ctx.clearRect(0, 0, W, H);

        var i;
        for (i = 0; i < orbs.length; i++) {
            orbs[i].update();
            orbs[i].draw();
        }

        if (particles.length) {
            var alive = [];
            for (i = 0; i < particles.length; i++) {
                if (particles[i].update()) {
                    particles[i].draw();
                    alive.push(particles[i]);
                }
            }
            particles = alive;
        }

        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else start();
    });

    /* ============================================================
       4. 画布尺寸（DPR 上限 2）
       ============================================================ */
    var lastW = 0;

    function onResize() {
        W = window.innerWidth;
        H = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        /* 屏宽变化超过一档才重建粒子群 */
        if (Math.abs(W - lastW) > 80 || !orbs.length) {
            lastW = W;
            buildOrbs();
        }
    }

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () {
        setTimeout(onResize, 220);
    });

    start();

    /* ============================================================
       5. 福字翻转 + 烟花按钮
       ============================================================ */
    function inPage(x, y) {
        return x > 0 && y > 0 && x < W && y < H;
    }

    var fuCard = document.getElementById('fuCard');
    if (fuCard) {
        var flip = function () {
            var flipped = fuCard.classList.toggle('flipped');
            fuCard.setAttribute('aria-pressed', flipped ? 'true' : 'false');
            if (window.MOD) window.MOD.haptic();
            var r = fuCard.getBoundingClientRect();
            var cx = r.left + r.width / 2;
            var cy = r.top + r.height / 2;
            if (inPage(cx, cy)) burst(cx, cy, 3);
        };
        fuCard.addEventListener('click', flip);
        fuCard.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flip();
            }
        });
    }

    var fwBtn = document.getElementById('fireworkBtn');
    if (fwBtn) {
        fwBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.MOD) window.MOD.haptic(18);
            var r = fwBtn.getBoundingClientRect();
            var cx = r.left + r.width / 2;
            var cy = Math.max(r.top - 40, 80);
            burst(cx, cy, reduced ? 2 : 5);
        });
    }

    /* 点页面任意空白处放一朵小烟花（按钮与福字卡自己处理） */
    document.addEventListener('click', function (e) {
        if (!e.isTrusted) return;
        if (e.target.closest('button') || e.target.closest('.fu-card') || e.target.closest('a')) return;
        launchFirework(e.clientX, e.clientY);
    });
})();
