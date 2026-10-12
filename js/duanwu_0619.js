/* ============================================================
   零源机构 · 移动端 Z℮R∅‑SOURCE / MOD
   duanwu_0619.js — 端午节 · 五月初五
   能力：粒子背景（按屏宽削减）/ 粽子馅料切换 / 龙舟加速 / 触屏按压反馈
   ============================================================ */
(function () {
    'use strict';

    /* ============================================================
       1. 粒子背景（canvas 重做，移动端按屏宽削减数量）
       ============================================================ */
    var canvas = document.getElementById('bgCanvas');
    var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

    if (canvas && ctx) {
        var DPR = Math.min(window.devicePixelRatio || 1, 2);   // DPR 上限 2
        var W = 0;
        var H = 0;
        var orbs = [];
        var rafId = null;
        var running = false;

        /* 按屏宽决定粒子数量：320px ≈ 24 个，768px ≈ 60 个，之后封顶 70 */
        function targetCount() {
            var w = Math.min(Math.max(window.innerWidth, 280), 900);
            return Math.round(Math.max(20, Math.min(70, 20 + (w - 320) * (50 / 448))));
        }

        function rand(a, b) {
            return a + Math.random() * (b - a);
        }

        function Orb(initial) {
            this.reset(initial);
        }

        Orb.prototype.reset = function (initial) {
            this.x = Math.random() * W;
            this.y = initial ? Math.random() * H : H + rand(30, 120);
            this.r = rand(18, 74);
            this.speed = rand(0.16, 0.5);
            this.drift = rand(-0.22, 0.22);
            this.hue = Math.random() > 0.5 ? 150 : 172;
            this.alpha = rand(0.05, 0.13);
        };

        Orb.prototype.update = function () {
            this.y -= this.speed;
            this.x += this.drift;
            if (this.x < -this.r || this.x > W + this.r || this.y < -this.r * 2) {
                this.reset(false);
            }
        };

        Orb.prototype.draw = function () {
            var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
            g.addColorStop(0, 'hsla(' + this.hue + ', 55%, 45%, ' + this.alpha + ')');
            g.addColorStop(1, 'hsla(' + this.hue + ', 55%, 45%, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        };

        function syncCount() {
            var want = targetCount();
            while (orbs.length < want) orbs.push(new Orb(true));
            if (orbs.length > want) orbs.length = want;
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
            for (var i = 0; i < orbs.length; i++) {
                orbs[i].update();
                orbs[i].draw();
            }
            rafId = window.requestAnimationFrame(frame);
        }

        function start() {
            if (running) return;
            running = true;
            rafId = window.requestAnimationFrame(frame);
        }

        function stop() {
            running = false;
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        var reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        resize();

        if (reduceMotion) {
            // 尊重系统设置：只画静态一帧
            for (var k = 0; k < orbs.length; k++) orbs[k].draw();
        } else {
            start();
        }

        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('orientationchange', function () {
            window.setTimeout(resize, 260);
        }, { passive: true });

        /* 页面隐藏时暂停 requestAnimationFrame，回来再继续 */
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                stop();
            } else if (!reduceMotion) {
                start();
            }
        });
    }

    /* ============================================================
       2. 粽子馅料切换（图标 + 名称 + 描述）
       文案与 PC 端 pc/festival/js/duanwu_0619.js 逐字一致
       ============================================================ */
    var zongziTypes = [
        { icon: '🥟', name: '豆沙粽', desc: '甜而不腻，经典之选' },
        { icon: '🥟', name: '鲜肉粽', desc: '咸香四溢，肉质鲜嫩' },
        { icon: '🥟', name: '蛋黄肉粽', desc: '蛋黄流沙，肉香浓郁' },
        { icon: '🥟', name: '蜜枣粽', desc: '甜蜜软糯，枣香扑鼻' },
        { icon: '🥟', name: '八宝粽', desc: '食材丰富，营养美味' },
        { icon: '🥟', name: '清水粽', desc: '原汁原味，蘸糖食用' }
    ];

    var ziIcon = document.getElementById('ziIcon');
    var ziName = document.getElementById('ziName');
    var ziDesc = document.getElementById('ziDesc');
    var ziNum = document.getElementById('ziNum');
    var ziBtn = document.getElementById('ziBtn');

    var ziIdx = 0;
    var ziTimer = null;
    var ziSettle = null;

    function pad2(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    function showZongzi(idx) {
        var z = zongziTypes[idx];
        if (!ziIcon) return;

        // 与 PC 端一致的「缩回 → 弹出」节奏
        ziIcon.style.transform = 'scale(0.8) rotate(-10deg)';

        clearTimeout(ziTimer);
        ziTimer = window.setTimeout(function () {
            ziIcon.textContent = z.icon;
            if (ziName) ziName.textContent = z.name;
            if (ziDesc) ziDesc.textContent = z.desc;
            if (ziNum) ziNum.textContent = pad2(idx + 1) + ' / ' + pad2(zongziTypes.length);

            ziIcon.style.transform = 'scale(1.2) rotate(5deg)';
            clearTimeout(ziSettle);
            ziSettle = window.setTimeout(function () {
                ziIcon.style.transform = '';
            }, 300);
        }, 150);
    }

    function nextZongzi() {
        ziIdx = (ziIdx + 1) % zongziTypes.length;
        showZongzi(ziIdx);
        if (window.MOD) {
            MOD.haptic();
            MOD.toast(zongziTypes[ziIdx].name + ' · ' + zongziTypes[ziIdx].desc);
        }
    }

    if (ziIcon) ziIcon.addEventListener('click', nextZongzi);
    if (ziBtn) ziBtn.addEventListener('click', nextZongzi);

    /* ============================================================
       3. 龙舟加速（触屏适配：按钮点击后 2s 内全速前进）
       ============================================================ */
    var boat = document.getElementById('boat');
    var boatBtn = document.getElementById('boatBtn');
    var speeding = false;
    var speedTimer = null;
    var backTimer = null;

    function resetBoat() {
        if (!boat) return;
        boat.style.transition = 'none';
        boat.style.transform = 'translateX(0)';
        void boat.offsetWidth;
        boat.style.transition = '';
    }

    function launchBoat() {
        if (!boat) return;
        var track = boat.parentElement;
        var room = track ? Math.max(0, track.clientWidth - boat.offsetWidth - 16) : 120;
        boat.style.transform = 'translateX(' + room + 'px)';
    }

    if (boatBtn && boat) {
        boatBtn.addEventListener('click', function () {
            if (window.MOD) MOD.haptic();

            if (speeding) {
                // 已在全速中：立即再冲一段
                resetBoat();
                window.requestAnimationFrame(launchBoat);
                return;
            }

            speeding = true;
            boat.classList.add('speed');
            boatBtn.textContent = '全速前进中... 🚀';
            boatBtn.setAttribute('disabled', 'disabled');
            window.requestAnimationFrame(launchBoat);

            clearTimeout(speedTimer);
            speedTimer = window.setTimeout(function () {
                boat.classList.remove('speed');
                boatBtn.textContent = '加速划桨！';
                boatBtn.removeAttribute('disabled');
                speeding = false;

                clearTimeout(backTimer);
                backTimer = window.setTimeout(resetBoat, 420);
            }, 2000);
        });
    }

    /* ============================================================
       4. 触屏卡片的轻微按压倾斜
       （移动端没有鼠标悬停，只在 touchstart/end 上做极轻的 3D 反馈）
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
