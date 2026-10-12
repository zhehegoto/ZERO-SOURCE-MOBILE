/* ============================================================
   零源机构 · 移动端 Z℮R∅‑SOURCE / MOD
   zhongqiu_0925.js — 中秋节 · 八月十五
   能力：星空/流星粒子背景（按屏宽削减）/ 大月亮点击放大 + 诗句展示
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       1. 星空 + 流星（canvas 重做，按屏宽削减数量）
       ============================================================ */
    var canvas = document.getElementById('bgCanvas');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

    if (canvas && ctx) {
        var DPR = Math.min(window.devicePixelRatio || 1, 2);   // DPR 上限 2
        var W = 0;
        var H = 0;
        var stars = [];
        var meteors = [];
        var rafId = null;
        var running = false;
        var meteorTimer = null;

        /* 按屏宽决定星星数量：320px ≈ 26 个，768px ≈ 64 个，封顶 70 */
        function targetCount() {
            var w = Math.min(Math.max(window.innerWidth, 280), 900);
            return Math.round(Math.max(20, Math.min(70, 22 + (w - 320) * (42 / 448))));
        }

        function rand(a, b) {
            return a + Math.random() * (b - a);
        }

        function Star(initial) {
            this.reset(initial);
        }

        Star.prototype.reset = function (initial) {
            this.x = Math.random() * W;
            this.y = initial ? Math.random() * H : Math.random() * H * 0.72;
            this.r = rand(0.75, 2.1);
            this.speed = rand(0.012, 0.04);
            this.phase = Math.random() * Math.PI * 2;
        };

        Star.prototype.update = function () {
            this.phase += this.speed;
        };

        Star.prototype.draw = function () {
            var a = Math.max(0.16, 0.5 + Math.sin(this.phase) * 0.42);
            ctx.globalAlpha = a;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
            // 两圈递减半径冒充发光，比 shadowBlur 便宜得多
            ctx.globalAlpha = a * 0.26;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * 2.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        function Meteor() {
            this.reset();
        }

        Meteor.prototype.reset = function () {
            this.x = rand(W * 0.2, W * 0.85);
            this.y = rand(0, H * 0.3);
            this.len = rand(38, 84);
            this.speed = rand(3.4, 6.2);
            this.angle = Math.PI / 4 + rand(-0.15, 0.15);
            this.life = 1;
            this.active = false;
        };

        Meteor.prototype.launch = function () {
            this.reset();
            this.active = true;
        };

        Meteor.prototype.update = function () {
            if (!this.active) return;
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            this.life -= 0.024;
            if (this.life <= 0 || this.x > W + 40 || this.y > H + 40) this.active = false;
        };

        Meteor.prototype.draw = function () {
            if (!this.active) return;
            ctx.globalAlpha = Math.max(0, this.life) * 0.85;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - Math.cos(this.angle) * this.len, this.y - Math.sin(this.angle) * this.len);
            ctx.stroke();
            ctx.globalAlpha = 1;
        };

        function syncCount() {
            var want = targetCount();
            while (stars.length < want) stars.push(new Star(true));
            if (stars.length > want) stars.length = want;

            // 流星固定 2 条（移动端够用，且很便宜）
            while (meteors.length < 2) meteors.push(new Meteor());
        }

        function resize() {
            W = window.innerWidth;
            H = window.innerHeight;
            canvas.width = Math.round(W * DPR);
            canvas.height = Math.round(H * DPR);
            canvas.style.width = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            syncCount();
        }

        function frame() {
            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < stars.length; i++) {
                stars[i].update();
                stars[i].draw();
            }
            for (var j = 0; j < meteors.length; j++) {
                meteors[j].update();
                meteors[j].draw();
            }
            rafId = window.requestAnimationFrame(frame);
        }

        function scheduleMeteor() {
            clearTimeout(meteorTimer);
            meteorTimer = window.setTimeout(function () {
                if (!document.hidden) {
                    for (var i = 0; i < meteors.length; i++) {
                        if (!meteors[i].active) {
                            meteors[i].launch();
                            break;
                        }
                    }
                }
                scheduleMeteor();
            }, rand(3800, 8200));
        }

        function start() {
            if (running) return;
            running = true;
            rafId = window.requestAnimationFrame(frame);
            scheduleMeteor();
        }

        function stop() {
            running = false;
            clearTimeout(meteorTimer);
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        var reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        resize();

        if (reduceMotion) {
            for (var k = 0; k < stars.length; k++) stars[k].draw();
        } else {
            start();
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
    }

    /* ============================================================
       2. 大月亮：点击放大 + 诗句展示
       ============================================================ */
    var moon = document.getElementById('bigMoon');
    var hint = document.getElementById('moonHint');

    /* 与原提示「点击月亮放大」同源的月亮诗句，点一次换一句 */
    var moonLines = [
        '点击月亮放大',
        '举头望明月，低头思故乡',
        '海上生明月，天涯共此时',
        '露从今夜白，月是故乡明',
        '今夜月明人尽望，不知秋思落谁家',
        '明月几时有，把酒问青天',
        '但愿人长久，千里共婵娟'
    ];

    var moonIdx = 0;

    if (moon) {
        function spinMoon() {
            moonIdx = (moonIdx + 1) % moonLines.length;
            moon.classList.toggle('zoomed', moonIdx % 2 === 1);
            if (hint) hint.textContent = moonLines[moonIdx];
            if (window.MOD) MOD.haptic();
        }

        moon.addEventListener('click', spinMoon);
        moon.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                spinMoon();
            }
        });
    }

    /* ============================================================
       3. 触屏卡片的轻微按压倾斜
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
