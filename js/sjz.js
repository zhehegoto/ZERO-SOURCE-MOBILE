/* ============================================================
   零源机构 · 移动端 / MOD
   sjz.js — 时间轴（零源编年史）
   1) canvas 粒子背景（数量按屏宽削减，DPR≤2，隐藏时暂停）
   2) 顶部吸顶进度：当前时代标签 + 进度条（PC 右侧圆点的等价物）
   3) .reveal 进场动画兜底
   4) 图片兜底、锚点平滑滚动、结尾弹层
   ============================================================ */
(function () {
    'use strict';

    var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ============================================================
       1. canvas 粒子背景
       ------------------------------------------------------------
       粒子数按屏宽削减：320px ≈ 20 个，768px ≈ 45 个；
       devicePixelRatio 上限 2，页面隐藏时停掉 requestAnimationFrame。
       ============================================================ */
    function initParticles() {
        var canvas = document.getElementById('tzParticles');
        if (!canvas || !canvas.getContext) return;
        if (reduceMotion) return;

        var ctx = canvas.getContext('2d');
        var host = canvas.parentElement;
        var W = 0, H = 0, dpr = 1;
        var particles = [];
        var rafId = 0;
        var last = 0;
        var running = false;

        function countFor(w) {
            // 按屏宽削减：320px ≈ 20 个，768px ≈ 45 个，再宽收敛在 45
            return Math.max(14, Math.min(45, Math.round(20 + (w - 320) * 25 / 448)));
        }

        function make(w, h) {
            return {
                x: Math.random() * w,
                y: h * (0.35 + Math.random() * 0.7),
                r: Math.random() * 1.5 + 1.2,
                vx: (Math.random() - 0.5) * 0.1,
                vy: -(Math.random() * 0.16 + 0.07),
                a: Math.random() * 0.42 + 0.3,
                tw: Math.random() * Math.PI * 2,
                tws: Math.random() * 0.02 + 0.006
            };
        }

        function resize() {
            var r = host.getBoundingClientRect();
            W = Math.max(1, Math.round(r.width));
            H = Math.max(1, Math.round(r.height));
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            var want = countFor(W);
            while (particles.length > want) particles.pop();
            while (particles.length < want) particles.push(make(W, H));
            // 便于调试/自测：当前实际粒子数量
            canvas.dataset.count = String(particles.length);
        }

        function frame(ts) {
            if (!running) return;
            var dt = last ? Math.min((ts - last) / 16.666, 3) : 1;
            last = ts;

            ctx.clearRect(0, 0, W, H);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.tw += p.tws * dt;

                if (p.y < -8) {
                    p.y = H + 8;
                    p.x = Math.random() * W;
                }
                if (p.x < -8) p.x = W + 8;
                else if (p.x > W + 8) p.x = -8;

                var alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
                ctx.fill();
            }
            rafId = requestAnimationFrame(frame);
        }

        function play() {
            if (running) return;
            running = true;
            last = 0;
            rafId = requestAnimationFrame(frame);
        }

        function pause() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = 0;
        }

        resize();

        // 尺寸变化：重建缓冲与粒子数量（横竖屏切换、折叠屏展开都覆盖）
        var rt = null;
        window.addEventListener('resize', function () {
            clearTimeout(rt);
            rt = setTimeout(resize, 160);
        });

        // 只在首屏可见时运行
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (document.hidden) return;
                    if (en.isIntersecting) play();
                    else pause();
                });
            }, { threshold: 0 }).observe(canvas);
        } else {
            play();
        }

        // 页面切到后台时暂停动画
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                pause();
            } else {
                var r = canvas.getBoundingClientRect();
                if (r.bottom > 0 && r.top < window.innerHeight) play();
            }
        });

        play();
    }

    /* ============================================================
       2. 吸顶进度：当前时代 + 进度条
       ============================================================ */
    function initProgress() {
        var box = document.getElementById('tzProgress');
        var label = document.getElementById('tzCurrent');
        var count = document.getElementById('tzCount');
        var bar = document.getElementById('tzBar');
        if (!box || !label) return;

        var sections = $$('[data-era]');
        if (!sections.length) return;

        var total = sections.length;
        var currentIndex = -1;
        var ticking = false;
        var lastSync = -1;

        function pad2(n) { return n < 10 ? '0' + n : '' + n; }

        function update() {
            ticking = false;
            var w = window;

            // 当前时代：取滚动参考线所在的那一段
            var line = w.scrollY + w.innerHeight * 0.32;
            var idx = 0;
            for (var i = 0; i < total; i++) {
                var top = sections[i].getBoundingClientRect().top + w.scrollY;
                if (top <= line) idx = i;
            }
            if (idx !== currentIndex) {
                currentIndex = idx;
                var name = sections[idx].getAttribute('data-era') || '';
                var year = sections[idx].getAttribute('data-year') || '';
                label.textContent = year && year !== name ? name + ' · ' + year : name;
                if (count) count.textContent = pad2(idx + 1) + ' / ' + pad2(total);
            }

            // 进度条：整页滚动进度
            var max = document.documentElement.scrollHeight - w.innerHeight;
            var p = max > 0 ? Math.min(1, Math.max(0, w.scrollY / max)) : 0;
            if (bar) bar.style.width = (p * 100).toFixed(2) + '%';

            // 吸顶后加深底色
            box.classList.toggle('on', w.scrollY > 8);
            lastSync = w.scrollY;
        }

        function onScroll() {
            // 页面不可见时 requestAnimationFrame 不会回调，直接同步更新
            if (!window.requestAnimationFrame) {
                update();
                return;
            }
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(update);
        }

        // 兜底：隐藏标签页里 scroll 事件会被节流，这里低频校准一次
        function sync() {
            if (window.scrollY !== lastSync) update();
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        window.addEventListener('orientationchange', onScroll);
        update();

        // 低频校准：隐藏标签页里 scroll 事件会被节流，
        // 用 600ms 的轻量轮询兜底，页面闲置一分钟后自动停止
        var idle = setInterval(sync, 600);
        setTimeout(function () { clearInterval(idle); }, 60000);
    }

    /* ============================================================
       3. 进场动画兜底
       ------------------------------------------------------------
       .reveal 由 core.js 的 IntersectionObserver 负责；
       这里再做一层「已进入视口就立即显示」的兜底，
       避免观察器回调缺失时整块内容一直停在 opacity:0。
       ============================================================ */
    function initRevealFallback() {
        var nodes = $$('.reveal');
        if (!nodes.length) return;

        var timer = null;
        var onScrollBinded = false;
        var lastY = null;

        function pending() {
            return nodes.filter(function (n) { return !n.classList.contains('in'); });
        }

        function showInView() {
            var vh = window.innerHeight || document.documentElement.clientHeight;
            var left = 0;
            pending().forEach(function (n) {
                var r = n.getBoundingClientRect();
                if (r.top < vh - 40 && r.bottom > 0) n.classList.add('in');
                else left++;
            });
            return left;
        }

        function onScroll() {
            var y = window.scrollY;
            // 滚动幅度太小时跳过，避免每个像素都重排
            if (lastY !== null && Math.abs(y - lastY) < 24) return;
            lastY = y;
            if (showInView() === 0) stop();
        }

        function stop() {
            if (timer) { clearInterval(timer); timer = null; }
            if (onScrollBinded) {
                window.removeEventListener('scroll', onScroll);
                window.removeEventListener('resize', onScroll);
                onScrollBinded = false;
            }
        }

        function start() {
            if (window.MOD && MOD.reveal) MOD.reveal();

            if (!onScrollBinded) {
                window.addEventListener('scroll', onScroll, { passive: true });
                window.addEventListener('resize', onScroll);
                onScrollBinded = true;
            }
            if (showInView() === 0) return stop();

            // 观察器回调异常时仍然能推进（节流轮询，元素显示完即自行停止）
            if (!timer) timer = setInterval(onScroll, 350);
        }

        // 首帧之后再量，避免字体/布局尚未稳定
        requestAnimationFrame(function () { requestAnimationFrame(start); });
        setTimeout(start, 400);
        window.addEventListener('load', function () { setTimeout(start, 120); });
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) start();
        });
    }

    /* ============================================================
       4. 图片兜底 / 锚点 / 结尾弹层
       ============================================================ */
    function initImages() {
        $$('.tz-img img, .tz-hero-bg img').forEach(function (img) {
            function fail() {
                var wrap = img.closest('.tz-img');
                if (wrap) wrap.classList.add('broken');
                else img.style.visibility = 'hidden';
            }
            if (img.complete && img.naturalWidth === 0) fail();
            img.addEventListener('error', fail);
        });
    }

    function initCue() {
        var cue = document.getElementById('heroCue');
        if (!cue) return;
        cue.addEventListener('click', function (e) {
            var target = document.getElementById('page-origin');
            if (!target) return;
            e.preventDefault();
            if (window.MOD && MOD.haptic) MOD.haptic();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    function initEnd() {
        var btn = document.getElementById('endBtn');
        if (!btn) return;

        var sheet = null;

        btn.addEventListener('click', function () {
            if (window.MOD && MOD.haptic) MOD.haptic();

            var start = new Date(MOD.config.siteStartTime.replace(/-/g, '/')).getTime();
            var days = Math.floor((Date.now() - start) / 86400000);
            if (days < 0) days = 0;

            if (!window.MOD) return;
            if (!sheet) {
                sheet = MOD.sheet({ id: 'endSheet' });
                sheet.setTitle('故事还在继续');
                sheet.setSub('<i class="fa fa-clock-o"></i> 零源编年史 · 未完结');
            }
            sheet.setBody(
                '<div class="tz-today">' +
                '<div class="tz-stat"><span class="tz-num">' + days + '</span>' +
                '<span class="tz-label">天运行</span></div>' +
                '<div class="tz-stat"><span class="tz-num">∞</span>' +
                '<span class="tz-label">精彩故事</span></div>' +
                '</div>' +
                '<div class="detail-content">' +
                '从 2019 到 2026，故事仍在书写。\n\n' +
                '每一段时光都值得被铭记，每一个明天都充满期待。\n' +
                '感谢每一位同行的伙伴 —— 下一页，由我们一起翻开。' +
                '</div>'
            );
            sheet.open();
        });
    }

    /* ============================================================
       初始化
       ============================================================ */
    function init() {
        initParticles();
        initProgress();
        initRevealFallback();
        initImages();
        initCue();
        initEnd();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
