(function () {
    'use strict';

    var DPR_MAX = 2;

    function $(id) {
        return document.getElementById(id);
    }

    function pad2(n) {
        return n < 10 ? '0' + n : '' + n;
    }

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

    function boot(opt) {
        if (!opt || !document.body) return;

        function isHidden() {
            return document.hidden === true;
        }

        var running = !isHidden();
        var looping = false;
        var coreFrames = 0;
        var rafCalls = 0;
        var timerTicks = 0;

        function raf(fn) {
            rafCalls++;
            window.requestAnimationFrame(function () {
                if (running) fn();
            });
        }

        var particleCanvas = $('particleCanvas');
        var PC = initCanvas(particleCanvas);
        var pctx = PC.ctx;
        var particles = [];

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

        var audio = null;
        var musicBtn = $('musicBtn');
        var musicIcon = $('musicIcon');
        var volumeControl = $('volumeControl');

        function syncMusicUI(playing) {
            if (!musicBtn || !musicIcon) return;

            musicIcon.textContent = playing ? '暂停' : '播放';
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

        if (musicBtn) {
            syncMusicUI(false);
            musicBtn.addEventListener('click', function () {
                initAudio();
                if (audio.paused) {
                    audio.play().then(function () {

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

        updateCountdown();
        resume();

        setTimeout(function () {
            for (var i = 0; i < opt.entryFireworks; i++) launchRandomFirework();
        }, 300);

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

    window.SRBirthday = function (opt) {
        if (!opt) return;
        boot(opt);
    };
})();
