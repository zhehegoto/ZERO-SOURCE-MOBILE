/* ============================================================
   零源机构 · 移动端 Z℮R∅‑SOURCE / MOD
   guoqing_1001.js — 国庆节 · 十月一日
   能力：烟花粒子背景（按屏宽削减 + 自动/手动放烟花）/ 触屏按压反馈
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       1. 烟花（canvas 重做，按屏宽削减粒子预算）
       ============================================================ */
    var canvas = document.getElementById('bgCanvas');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

    var rockets = [];
    var sparks = [];
    var rafId = null;
    var running = false;
    var autoTimer = null;
    var burstTimer = null;

    /* 颜色与 PC 端一致 */
    var FW_COLORS = ['#ffd700', '#ff4444', '#ff8800', '#ffffff', '#ff66cc', '#ffaa00'];

    var DPR = 1;
    var W = 0;
    var H = 0;

    /* 按屏宽削减：320px ≈ 26 颗/炸、封顶 2 枚火箭；768px ≈ 60 颗/炸、封顶 4 枚 */
    function scaleFactor() {
        var w = Math.min(Math.max(window.innerWidth, 280), 900);
        return Math.max(0, Math.min(1, (w - 320) / 448));
    }

    function sparkCount() {
        return Math.round(28 + scaleFactor() * 42);
    }

    function maxRockets() {
        return window.innerWidth < 420 ? 2 : (window.innerWidth < 640 ? 3 : 4);
    }

    function rand(a, b) {
        return a + Math.random() * (b - a);
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function addBurst(x, y, color) {
        // 兜底上限：连点也不会累积过多粒子（移动端很便宜的做法就是设上限）
        if (sparks.length > 900) return;
        var n = sparkCount();
        var speedUp = 1.8 + scaleFactor() * 2.1;
        for (var i = 0; i < n; i++) {
            var angle = (Math.PI * 2 * i) / n;
            var speed = rand(speedUp * 0.55, speedUp * 2.1);
            sparks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                r: rand(1.6, 3.2),
                color: color,
                life: 1,
                decay: rand(0.012, 0.022)
            });
        }
    }

    function launch(x, targetY) {
        if (rockets.length >= maxRockets()) return;
        rockets.push({
            x: x,
            y: H + 4,
            targetY: targetY,
            speed: rand(4.6, 7.4),
            color: pick(FW_COLORS),
            trail: []
        });
    }

    function autoFirework() {
        if (document.hidden) return;
        launch(rand(W * 0.18, W * 0.82), rand(60, H * 0.42 + 40));
    }

    if (canvas && ctx) {
        function resize() {
            DPR = Math.min(window.devicePixelRatio || 1, 2);   // DPR 上限 2
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.round(W * DPR);
            canvas.height = Math.round(H * DPR);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }

        function frame() {
            // 用透明清屏 + 粒子自身 alpha 衰减做拖尾，
            // 这样内容层永远清晰可见（不用半透明矩形糊在页面上）
            ctx.clearRect(0, 0, W, H);

            for (var i = rockets.length - 1; i >= 0; i--) {
                var r = rockets[i];
                r.trail.push({ x: r.x, y: r.y });
                if (r.trail.length > 8) r.trail.shift();
                r.y -= r.speed;

                for (var t = 0; t < r.trail.length; t++) {
                    ctx.globalAlpha = (t / r.trail.length) * 0.55;
                    ctx.fillStyle = r.color;
                    ctx.beginPath();
                    ctx.arc(r.trail[t].x, r.trail[t].y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(r.x, r.y, 2.8, 0, Math.PI * 2);
                ctx.fill();

                if (r.y <= r.targetY) {
                    addBurst(r.x, r.y, r.color);
                    rockets.splice(i, 1);
                }
            }

            for (var j = sparks.length - 1; j >= 0; j--) {
                var s = sparks[j];
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.045;
                s.vx *= 0.99;
                s.vy *= 0.99;
                s.life -= s.decay;

                if (s.life <= 0) {
                    sparks.splice(j, 1);
                    continue;
                }

                ctx.globalAlpha = Math.max(0, s.life);
                ctx.fillStyle = s.color;
                ctx.beginPath();
                ctx.arc(s.x, s.y, Math.max(0.4, s.r * s.life), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            rafId = window.requestAnimationFrame(frame);
        }

        function scheduleAuto() {
            clearInterval(autoTimer);
            autoTimer = window.setInterval(autoFirework, 4200);
        }

        function start() {
            if (running) return;
            running = true;
            rafId = window.requestAnimationFrame(frame);
            scheduleAuto();
        }

        function stop() {
            running = false;
            clearInterval(autoTimer);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        var reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        resize();

        if (reduceMotion) {
            // 不做持续动画：只静态放一朵
            addBurst(W * 0.5, H * 0.3, '#ffd700');
            for (var q = 0; q < sparks.length; q++) {
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = sparks[q].color;
                ctx.beginPath();
                ctx.arc(sparks[q].x, sparks[q].y, sparks[q].r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            sparks.length = 0;
        } else {
            start();
            var boot = 0;
            for (boot = 0; boot < 2; boot++) {
                (function (k) {
                    window.setTimeout(autoFirework, 500 + k * 700);
                })(boot);
            }
        }

        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('orientationchange', function () {
            window.setTimeout(resize, 260);
        }, { passive: true });

        /* 页面隐藏时暂停 requestAnimationFrame */
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                stop();
            } else if (!reduceMotion) {
                start();
            }
        });

        /* ---------- 页面内交互放烟花（替代 PC 端「点空白处」） ---------- */

        // 1) 「点击放烟花 · 共庆华诞」按钮
        var fwBtn = document.getElementById('fwBtn');
        if (fwBtn) {
            fwBtn.addEventListener('click', function () {
                if (window.MOD) MOD.haptic(18);

                if (reduceMotion) {
                    addBurst(rand(W * 0.3, W * 0.7), rand(H * 0.2, H * 0.4), pick(FW_COLORS));
                    return;
                }

                clearTimeout(burstTimer);
                var shots = 4;
                for (var i = 0; i < shots; i++) {
                    (function (k) {
                        burstTimer = window.setTimeout(function () {
                            launch(rand(W * 0.16, W * 0.84), rand(60, H * 0.45));
                        }, k * 170);
                    })(i);
                }
            });
        }

        // 2) 「盛世华诞」国徽：点一下也放一朵
        var emblem = document.querySelector('.emblem-visual');
        if (emblem) {
            emblem.addEventListener('click', function () {
                if (window.MOD) MOD.haptic();
                if (reduceMotion) return;
                launch(rand(W * 0.2, W * 0.8), rand(70, H * 0.4));
            });
        }

        // 3) 点击页面空白（非按钮、非链接）时，就在点击位置放一朵
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('button, a')) return;
            if (reduceMotion) return;
            launch(e.clientX, Math.min(e.clientY, H * 0.7));
        });
    }

    /* ============================================================
       2. 触屏卡片的轻微按压倾斜
       ============================================================ */
    var cards = document.querySelectorAll('[data-tilt]');
    Array.prototype.forEach.call(cards, function (card) {
        card.addEventListener('touchstart', function () {
            card.style.transform = 'perspective(700px) rotateX(2deg) translateY(-3px)';
        }, { passive: true });

        var clear = function () {
            card.style.transform = '';
        };
        card.addEventListener('touchend', clear);
        card.addEventListener('touchcancel', clear);
    });
})();
