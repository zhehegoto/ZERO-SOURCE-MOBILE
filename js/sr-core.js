/* ============================================================
   零源机构 · 移动端 sr 生日彩蛋页 公共引擎
   与 pc 端 sr 各页脚本功能对齐，并按移动端要求改造：
   · 粒子数量随屏宽削减、DPR 上限 2
   · 页面隐藏时暂停 requestAnimationFrame（省电）
   · 卡片点击（触摸）翻转，不依赖 hover
   · 音乐必须由用户点击后才 play()，图标随播放状态切换
   · 倒计时日期逻辑逐行对齐 PC（含跨年计算），隐藏时停止计时
   ============================================================ */
(function () {
    'use strict';

    var DPR_MAX = 2;

    function $(id) {
        return document.getElementById(id);
    }

    function pad2(n) {
        return n < 10 ? '0' + n : '' + n;
    }

    /* ------------------------------------------------------------
       画布初始化：CSS 尺寸铺满视口，像素尺寸 = 逻辑尺寸 × DPR
       ------------------------------------------------------------ */
    function initCanvas(canvas) {
        var ctx = canvas.getContext('2d');
        var cw = 0;
        var ch = 0;

        function resize() {
            var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
            cw = window.innerWidth;
            ch = window.innerHeight;
            canvas.width = Math.round(cw * dpr);
            canvas.height = Math.round(ch * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', resize);

        return {
            ctx: ctx,
            resize: resize,
            get width() { return cw; },
            get height() { return ch; }
        };
    }

    /* ------------------------------------------------------------
       页面主体
       ------------------------------------------------------------ */
    function boot(opt) {
        if (!opt || !document.body) return;

        /* ===== 动画总开关：页面隐藏时停掉所有 rAF，回来再续 =====
           注意：彩蛋页常被 window.open 打开成后台标签，初始就可能是隐藏态，
           所以初值取页面隐藏状态，隐藏期间完全不去申请动画帧。 */
        function isHidden() {
            return document.hidden === true;
        }

        var running = !isHidden();
        var looping = false;
        var coreFrames = 0;    /* 实际跑过的动画帧数（自测用） */
        var rafCalls = 0;      /* 申请动画帧的次数（自测用） */
        var timerTicks = 0;    /* 倒计时执行次数（自测用） */

        function raf(fn) {
            rafCalls++;
            window.requestAnimationFrame(function () {
                if (running) fn();
            });
        }

        /* ===== 粒子背景 ===== */
        var particleCanvas = $('particleCanvas');
        var PC = initCanvas(particleCanvas);
        var pctx = PC.ctx;
        var particles = [];

        /* 粒子数量按屏宽削减：320px ≈ 25 个，768px ≈ 60 个 */
        function particleTarget() {
            var w = Math.max(280, Math.min(window.innerWidth, 900));
            var n = 22 + ((w - 320) / (768 - 320)) * 38;
            return Math.max(16, Math.round(n));
        }

        function Particle() {
            this.reset(true);
        }

        Particle.prototype.reset = function (anywhere) {
            var w = PC.width;
            var h = PC.height;
            this.x = Math.random() * w;
            this.y = anywhere ? Math.random() * h : h + 10;
            this.size = Math.random() * 2.4 + 0.9;
            this.speedX = (Math.random() - 0.5) * 0.7;
            this.speedY = (Math.random() - 0.5) * 0.55;
            this.color = opt.particleColors[Math.floor(Math.random() * opt.particleColors.length)];
            this.alpha = Math.random() * 0.55 + 0.3;
        };

        Particle.prototype.update = function () {
            var w = PC.width;
            var h = PC.height;
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0) this.x = w;
            if (this.x > w) this.x = 0;
            if (this.y < 0) this.y = h;
            if (this.y > h) this.y = 0;
        };

        Particle.prototype.draw = function () {
            pctx.beginPath();
            pctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            pctx.fillStyle = this.color;
            pctx.shadowBlur = 10;
            pctx.shadowColor = this.color;
            pctx.globalAlpha = this.alpha;
            pctx.fill();
        };

        function syncParticles() {
            var want = particleTarget();
            while (particles.length < want) particles.push(new Particle());
            while (particles.length > want) particles.pop();
        }

        syncParticles();

        function particleLoop() {
            coreFrames++;
            pctx.clearRect(0, 0, PC.width, PC.height);
            for (var i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            pctx.globalAlpha = 1;
            pctx.shadowBlur = 0;
            raf(particleLoop);
        }

        /* ===== 烟花 ===== */
        var fireCanvas = $('fireworks-canvas');
        var FC = initCanvas(fireCanvas);
        var fctx = FC.ctx;
        var fireworks = [];
        var sparks = [];
        var sparkTimer = null;

        function Firework(x, y, targetX, targetY) {
            this.x = x;
            this.y = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.speed = opt.fireworkSpeed;
            this.angle = Math.atan2(targetY - y, targetX - x);
            this.vx = Math.cos(this.angle) * this.speed;
            this.vy = Math.sin(this.angle) * this.speed;
            this.radius = 2.8;
            this.color = 'hsl(' + Math.floor(Math.random() * 360) + ', 100%, 65%)';
            this.exploded = false;
        }

        Firework.prototype.update = function () {
            if (this.exploded) return false;
            this.x += this.vx;
            this.y += this.vy;
            if (Math.hypot(this.x - this.targetX, this.y - this.targetY) < 10) {
                this.exploded = true;
                this.createExplosion();
            }
            return !this.exploded;
        };

        Firework.prototype.createExplosion = function () {
            var count = opt.explosionCount;
            for (var i = 0; i < count; i++) {
                var angle = Math.random() * Math.PI * 2;
                var speed = Math.random() * 5 + 2;
                sparks.push({
                    x: this.targetX,
                    y: this.targetY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1,
                    color: this.color,
                    size: Math.random() * 4 + 1.6,
                    gravity: 0.1
                });
            }
        };

        Firework.prototype.draw = function () {
            fctx.beginPath();
            fctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            fctx.fillStyle = this.color;
            fctx.fill();
        };

        function updateFireworks() {
            for (var i = fireworks.length - 1; i >= 0; i--) {
                if (!fireworks[i].update()) fireworks.splice(i, 1);
            }
            for (var j = sparks.length - 1; j >= 0; j--) {
                var p = sparks[j];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.life -= 0.02;
                if (p.life <= 0 || p.y > FC.height + 100) sparks.splice(j, 1);
            }
        }

        function drawFireworks() {
            fctx.clearRect(0, 0, FC.width, FC.height);
            for (var i = 0; i < fireworks.length; i++) fireworks[i].draw();
            fctx.globalAlpha = 1;
            for (var j = 0; j < sparks.length; j++) {
                var p = sparks[j];
                fctx.beginPath();
                fctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                fctx.fillStyle = p.color;
                fctx.globalAlpha = p.life * 0.9;
                fctx.fill();
            }
            fctx.globalAlpha = 1;
        }

        function fireworkLoop() {
            coreFrames++;
            updateFireworks();
            drawFireworks();
            raf(fireworkLoop);
        }

        function launchRandomFirework() {
            if (isHidden()) return;
            if (fireworks.length > opt.maxFireworks) return;
            fireworks.push(new Firework(
                Math.random() * FC.width,
                FC.height,
                Math.random() * FC.width,
                Math.random() * (FC.height * 0.65) + 100
            ));
        }

        function burstFireworkAround(x, y) {
            for (var i = 0; i < opt.burstCount; i++) {
                var targetX = x + (Math.random() - 0.5) * 120;
                var targetY = y + (Math.random() - 0.5) * 80 - 50;
                fireworks.push(new Firework(
                    Math.random() * FC.width,
                    FC.height,
                    targetX,
                    targetY
                ));
            }
        }

        /* ===== 生日倒计时（日期逻辑与 PC 版逐行一致） ===== */
        var daysEl = $('days');
        var hoursEl = $('hours');
        var minsEl = $('mins');
        var secsEl = $('secs');
        var countTimer = null;
        var nextBirthday = new Date(new Date().getFullYear(), opt.month, opt.day);

        function updateCountdown() {
            timerTicks++;
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var birthdayThisYear = new Date(now.getFullYear(), opt.month, opt.day);

            /* 生日当天：清零并庆祝 */
            if (today.getTime() === birthdayThisYear.getTime()) {
                daysEl.innerText = '0';
                hoursEl.innerText = '00';
                minsEl.innerText = '00';
                secsEl.innerText = '00';
                if (!window._srCelebrated) {
                    window._srCelebrated = true;
                    for (var i = 0; i < 12; i++) {
                        setTimeout(launchRandomFirework, i * 100);
                    }
                }
                return;
            }

            /* 跨年：今年的生日已过 → 按 PC 版写法跳到下一年 */
            if (now > nextBirthday) {
                nextBirthday = new Date(now.getFullYear() + 1, opt.nextMonth, opt.nextDay);
            }

            var diff = nextBirthday - now;
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);

            daysEl.innerText = d;
            hoursEl.innerText = pad2(h);
            minsEl.innerText = pad2(m);
            secsEl.innerText = pad2(s);
        }

        /* ===== 3D 卡片翻转（移动端：点击 / 触摸 / 键盘都可用） ===== */
        var card = $('flipCard');
        var hasFlipped = false;

        function flipCard() {
            if (hasFlipped) return;
            hasFlipped = true;
            card.classList.add('flipped');
            card.setAttribute('aria-pressed', 'true');

            var rect = card.getBoundingClientRect();
            var cx = rect.left + rect.width / 2;
            var cy = rect.top + rect.height / 2;

            for (var i = 0; i < 4; i++) {
                setTimeout(function () {
                    burstFireworkAround(cx, cy);
                }, i * 100);
            }
            setTimeout(function () {
                launchRandomFirework();
                launchRandomFirework();
            }, 200);
        }

        if (card) {
            card.setAttribute('aria-pressed', 'false');
            card.addEventListener('click', flipCard);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    flipCard();
                }
            });
        }

        /* ===== 音乐：必须用户点击后才播放 ===== */
        var audio = null;
        var musicBtn = $('musicBtn');
        var musicIcon = $('musicIcon');
        var volumeControl = $('volumeControl');

        function syncMusicUI(playing) {
            if (!musicBtn || !musicIcon) return;
            musicIcon.className = 'fa ' + (playing ? 'fa-music' : 'fa-play');
            musicBtn.classList.toggle('is-playing', playing);
            musicBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
            musicBtn.setAttribute('aria-label', playing ? '暂停生日音乐' : '播放生日音乐');
        }

        function initAudio() {
            if (audio) return audio;
            audio = new Audio(opt.musicSrc);
            audio.loop = true;
            audio.volume = volumeControl ? parseFloat(volumeControl.value) : opt.volume;
            audio.addEventListener('error', function () {
                if (window.MOD && window.MOD.toast) window.MOD.toast('音乐加载失败，请稍后再试');
            });
            if (volumeControl) {
                volumeControl.addEventListener('input', function () {
                    if (audio) audio.volume = parseFloat(volumeControl.value);
                });
            }
            return audio;
        }

        /* 音乐只由播放按钮控制（移动端禁止自动播放）。
           PC 版那套「首次任意点击就起播」在这里必须去掉：
           它和按钮自己的开/关会在同一次点击里打架，导致点了按钮反而变暂停。 */
        if (musicBtn) {
            syncMusicUI(false);
            musicBtn.addEventListener('click', function () {
                initAudio();
                if (audio.paused) {
                    audio.play().then(function () {
                        /* play() 的 resolve 可能晚于用户的下一次点击（快速连点），
                           所以这里以 audio.paused 的实时状态为准，避免图标和真实状态脱节 */
                        syncMusicUI(!audio.paused);
                    }).catch(function () {
                        syncMusicUI(false);
                        if (window.MOD && window.MOD.toast) window.MOD.toast('播放被浏览器拦截，请再点一次');
                    });
                } else {
                    audio.pause();
                    syncMusicUI(false);
                }
            });
        }

        /* ===== 页面隐藏 → 停 rAF / 停计时；回到前台 → 全部恢复 ===== */
        function stopTimers() {
            clearInterval(countTimer);
            countTimer = null;
            clearInterval(sparkTimer);
            sparkTimer = null;
            looping = false;
        }

        function resume() {
            particles.forEach(function (p) { p.reset(true); });
            updateCountdown();
            stopTimers();
            countTimer = setInterval(updateCountdown, 1000);
            sparkTimer = setInterval(launchRandomFirework, opt.fireworkInterval);
            if (looping) return;
            looping = true;
            raf(particleLoop);
            raf(fireworkLoop);
        }

        document.addEventListener('visibilitychange', function () {
            running = !isHidden();
            if (running) {
                resume();
            } else {
                stopTimers();
            }
        });

        /* ===== 启动（先跑一次倒计时，避免尺寸未就绪时放烟花） ===== */
        updateCountdown();
        resume();

        /* 进场放几朵烟花 */
        setTimeout(function () {
            for (var i = 0; i < opt.entryFireworks; i++) launchRandomFirework();
        }, 300);

        /* 暴露给页面脚本 / 自测使用 */
        window.__SR = {
            launchRandomFirework: launchRandomFirework,
            burstFireworkAround: burstFireworkAround,
            updateCountdown: updateCountdown,
            particleCount: function () { return particles.length; },
            frames: function () { return coreFrames; },
            rafCalls: function () { return rafCalls; },
            timerTicks: function () { return timerTicks; },
            running: function () { return running; },
            looping: function () { return looping; },
            audio: function () { return audio; }
        };
    }

    /* ------------------------------------------------------------
       对外入口：各页面的 js/<page>.js 只负责传配置
       （sr-core.js 在 HTML 里先于页面脚本加载，所以这里能直接拿到）
       ------------------------------------------------------------ */
    window.SRBirthday = function (opt) {
        if (!opt) return;
        boot(opt);
    };
})();
