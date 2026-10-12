/* ============================================================
   零源机构 · 移动端 / 清明节 · 慎终追远
   qingming_0405.js — 细雨 + 浮动光斑
   对应 PC 端 pc/festival/js/qingming_0405.js，移动端改写要点：
   1. 雨丝 + 光斑总数随屏宽线性削减（320px≈26 条，768px≈64 条）
   2. DPR 上限 2
   3. 页面隐藏时暂停 requestAnimationFrame
   4. 去掉 PC 端的鼠标 3D 倾斜（移动端无悬停）
   ============================================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0;
    var H = 0;
    var dpr = 1;

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    /* 粒子数量按屏宽削减：320px→27，768px→64 */
    function density(w, divisor, lo, hi) {
        return Math.max(lo, Math.min(hi, Math.round(w / divisor)));
    }

    /* ============================================================
       1. 细雨
       ============================================================ */
    function RainDrop() {
        this.reset(true);
    }

    RainDrop.prototype.reset = function (first) {
        this.x = rand(0, W);
        this.y = first ? rand(0, H) : -24;
        this.length = rand(11, 28);
        this.speed = rand(4.5, 9.5);
        this.opacity = rand(0.14, 0.34);
        this.wind = rand(0.28, 0.7);
    };

    RainDrop.prototype.update = function () {
        this.y += this.speed;
        this.x += this.wind;
        if (this.y > H || this.x > W + 30) this.reset(false);
    };

    RainDrop.prototype.draw = function () {
        ctx.save();
        ctx.strokeStyle = 'rgba(120, 150, 140, ' + this.opacity + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.wind * 1.5, this.y + this.length);
        ctx.stroke();
        ctx.restore();
    };

    /* ============================================================
       2. 浮动光斑（素雅青灰）
       ============================================================ */
    function Orb() {
        this.reset(true);
    }

    Orb.prototype.reset = function (first) {
        this.x = rand(0, W);
        this.y = first ? rand(0, H) : H + 40;
        this.radius = rand(36, 128);
        this.speed = rand(0.18, 0.6);
        this.drift = rand(-0.2, 0.2);
        this.alpha = rand(0.03, 0.07);
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
        g.addColorStop(0, 'rgba(154, 186, 170, ' + this.alpha + ')');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    };

    /* ============================================================
       3. 粒子群（总量守恒：雨丝 ~72%，光斑 ~28%）
       ============================================================ */
    var drops = [];
    var orbs = [];

    function build() {
        var total = density(W, 12, 14, 72);
        var dropCount = Math.max(8, Math.round(total * 0.72));
        var orbCount = Math.max(3, total - dropCount);
        var i;

        drops = [];
        for (i = 0; i < dropCount; i++) drops.push(new RainDrop());

        orbs = [];
        for (i = 0; i < orbCount; i++) orbs.push(new Orb());
    }

    /* ============================================================
       4. 渲染循环（隐藏时暂停 rAF）
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
        for (i = 0; i < drops.length; i++) {
            drops[i].update();
            drops[i].draw();
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
       5. 画布尺寸（DPR 上限 2）
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

        if (Math.abs(W - lastW) > 80 || (!drops.length && !orbs.length)) {
            lastW = W;
            build();
        }
    }

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () {
        setTimeout(onResize, 220);
    });

    start();
})();
