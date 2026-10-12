/* ============================================================
   零源机构 · 移动端 Z℮R∅‑SOURCE / MOD
   core.js — 移动端外壳与通用能力
   提供：顶部应用栏 / 底部标签栏 / 更多面板 / 底部弹层 /
        轻提示 / 滚动进场 / 运行计时 / 五连击彩蛋 / 页脚
   ============================================================ */
(function () {
    'use strict';

    /* ---------- 站点配置（与 PC 端一致） ---------- */
    var CONFIG = {
        /* 建站时间：与更新日志 v1.0「网站基础版本发布」的日期一致。
           全站的「已运行 / 天运行」都从这里取值，
           其它页面不要再各自硬编码一份（曾经 4 处写的不一样，导致
           页脚显示 159 天、更新日志显示 329 天）。 */
        siteStartTime: '2025-11-16 00:00:00',
        siteUrl: 'index.html',
        birthdayPages: {
            '1-10': 'sr/liu/liu.html',
            '5-10': 'sr/li/li.html',
            '6-10': 'sr/hehe/hehe.html',
            '6-15': 'sr/goto/goto.html',
            '5-9': 'sr/hui/hui.html'
        }
    };

    /* ---------- 主导航（底部标签栏 5 个主页） ---------- */
    var TABS = [
        { key: 'home', label: '首页', icon: 'fa-home', href: 'index.html' },
        { key: 'sjz', label: '时间轴', icon: 'fa-clock-o', href: 'body/sjz.html' },
        { key: 'cyjs', label: '成员', icon: 'fa-users', href: 'body/cyjs.html' },
        { key: 'ctjr', label: '节日', icon: 'fa-calendar', href: 'body/ctjr.html' },
        { key: 'qxc', label: '相册', icon: 'fa-image', href: 'body/qxc.html' }
    ];

    /* ---------- 页脚 / 更多 面板里的次级页面 ---------- */
    var SUBPAGES = [
        { key: 'yszc', label: '隐私政策', icon: 'fa-shield', cls: 'blue', href: 'foot/yszc.html' },
        { key: 'sytk', label: '使用条款', icon: 'fa-file-text-o', cls: 'green', href: 'foot/sytk.html' },
        { key: 'wzdt', label: '网站地图', icon: 'fa-sitemap', cls: 'pink', href: 'foot/wzdt.html' },
        { key: 'gxrz', label: '更新日志', icon: 'fa-history', cls: '', href: 'foot/gxrz.html' }
    ];

    /* ---------- 路径前缀：由 <body data-base="…"> 决定 ---------- */
    var BASE = (document.body && document.body.dataset.base) || '';
    var PAGE = (document.body && document.body.dataset.page) || '';
    var TITLE = (document.body && document.body.dataset.title) || '';
    var HAS_BACK = !!(document.body && document.body.dataset.back);
    var HAS_TABBAR = !(document.body && document.body.dataset.tabbar === 'off');

    /* ============================================================
       工具
       ============================================================ */
    function $(sel, root) {
        return (root || document).querySelector(sel);
    }

    function $$(sel, root) {
        return Array.prototype.slice.call((root || document).querySelectorAll(sel));
    }

    function el(tag, cls, html) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (html != null) n.innerHTML = html;
        return n;
    }

    function esc(str) {
        var d = document.createElement('div');
        d.textContent = str == null ? '' : String(str);
        return d.innerHTML;
    }

    /* 轻震动反馈（不支持的设备静默忽略） */
    function haptic(ms) {
        try {
            if (navigator.vibrate) navigator.vibrate(ms || 12);
        } catch (e) { /* 忽略 */ }
    }

    /* 轻提示 */
    var toastEl = null;
    var toastTimer = null;

    function toast(msg, ms) {
        if (!toastEl) {
            toastEl = el('div', 'toast');
            toastEl.setAttribute('role', 'status');
            toastEl.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastEl);
        }
        toastEl.textContent = msg;
        // 强制重排，保证连续调用也能重新播放动画
        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove('show');
        }, ms || 1900);
    }

    /* ============================================================
       底部弹层 Sheet
       ============================================================ */
    var sheetStack = [];
    // 我们自己调用 history.back() 关闭弹层时，跳过一次 popstate，
    // 否则会把紧接着打开的另一个弹层一并关掉
    var ignorePop = 0;

    function Sheet(opts) {
        opts = opts || {};
        this.id = opts.id || ('sheet-' + Math.random().toString(36).slice(2, 8));
        this.fullscreen = !!opts.fullscreen;
        this.onClose = opts.onClose || null;
        this._pushed = false;
        this._built = false;
    }

    Sheet.prototype.build = function () {
        if (this._built) return;
        var self = this;

        var root = el('div', 'sheet' + (this.fullscreen ? ' fullscreen' : ''));
        root.id = this.id;
        root.innerHTML =
            '<div class="sheet-backdrop"></div>' +
            '<div class="sheet-panel" role="dialog" aria-modal="true">' +
            '  <div class="sheet-grip"></div>' +
            '  <div class="sheet-head">' +
            '    <div class="sh-main">' +
            '      <h2 class="sheet-title"></h2>' +
            '      <div class="sheet-sub"></div>' +
            '    </div>' +
            '    <button class="sheet-close" type="button" aria-label="关闭">&times;</button>' +
            '  </div>' +
            '  <div class="sheet-body"></div>' +
            '</div>';

        this.el = root;
        this.panelEl = $('.sheet-panel', root);
        this.titleEl = $('.sheet-title', root);
        this.subEl = $('.sheet-sub', root);
        this.headEl = $('.sheet-head', root);
        this.bodyEl = $('.sheet-body', root);

        $('.sheet-backdrop', root).addEventListener('click', function () {
            self.close();
        });
        $('.sheet-close', root).addEventListener('click', function () {
            self.close();
        });

        this._bindDrag();
        document.body.appendChild(root);
        this._built = true;
    };

    /* 拖动关闭：面板头部下滑超过阈值即关闭 */
    Sheet.prototype._bindDrag = function () {
        var self = this;
        var panel = this.panelEl;
        var handle = root_handle();
        var startY = 0;
        var dy = 0;
        var dragging = false;

        function root_handle() {
            return self.el.querySelector('.sheet-grip');
        }

        function onStart(e) {
            var t = e.touches ? e.touches[0] : e;
            startY = t.clientY;
            dy = 0;
            dragging = true;
            panel.style.transition = 'none';
        }

        function onMove(e) {
            if (!dragging) return;
            var t = e.touches ? e.touches[0] : e;
            dy = t.clientY - startY;
            if (dy < 0) dy = dy * 0.28; // 上滑加阻尼
            panel.style.transform = 'translate3d(0,' + dy + 'px,0)';
            if (e.cancelable) e.preventDefault();
        }

        function onEnd() {
            if (!dragging) return;
            dragging = false;
            panel.style.transition = '';
            panel.style.transform = '';
            if (dy > Math.max(90, panel.offsetHeight * 0.22)) {
                self.close();
            }
        }

        [handle, this.headEl].forEach(function (node) {
            node.addEventListener('touchstart', onStart, { passive: true });
            node.addEventListener('touchmove', onMove, { passive: false });
            node.addEventListener('touchend', onEnd);
            node.addEventListener('touchcancel', onEnd);
            // 桌面调试用鼠标
            node.addEventListener('mousedown', onStart);
        });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
    };

    Sheet.prototype.setTitle = function (t) {
        this.build();
        this.titleEl.textContent = t || '';
        return this;
    };

    Sheet.prototype.setSub = function (html) {
        this.build();
        this.subEl.innerHTML = html || '';
        return this;
    };

    Sheet.prototype.setBody = function (html) {
        this.build();
        this.bodyEl.innerHTML = html || '';
        this.bodyEl.scrollTop = 0;
        return this;
    };

    Sheet.prototype.open = function () {
        this.build();
        if (this.el.classList.contains('open')) return this;

        document.body.classList.add('no-scroll');
        this.el.classList.add('open');
        sheetStack.push(this);

        // 安卓返回键 / 浏览器返回 先关闭弹层
        try {
            history.pushState({ modSheet: this.id }, '');
            this._pushed = true;
        } catch (e) { /* 忽略 */ }

        if (this.onOpen) this.onOpen();
        return this;
    };

    Sheet.prototype.close = function (fromPop) {
        if (!this.el || !this.el.classList.contains('open')) return;

        this.el.classList.remove('open');
        var idx = sheetStack.indexOf(this);
        if (idx > -1) sheetStack.splice(idx, 1);
        if (!sheetStack.length) document.body.classList.remove('no-scroll');

        if (this._pushed && !fromPop) {
            this._pushed = false;
            ignorePop++;
            try { history.back(); } catch (e) { ignorePop--; }
        } else {
            this._pushed = false;
        }

        if (this.onClose) this.onClose();
    };

    window.addEventListener('popstate', function () {
        if (ignorePop > 0) {
            ignorePop--;
            return;
        }
        if (!sheetStack.length) return;
        var top = sheetStack[sheetStack.length - 1];
        top._pushed = false;
        top.close(true);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !sheetStack.length) return;
        var top = sheetStack[sheetStack.length - 1];
        top._pushed = false;
        top.close(true);
    });

    /* ============================================================
       顶部应用栏
       ============================================================ */
    function buildAppbar() {
        if ($('#siteAppbar')) return;
        var bar = el('header', 'appbar');
        bar.id = 'siteAppbar';

        var left = '';
        if (HAS_BACK) {
            left = '<button class="icon-btn" id="appbarBack" type="button" aria-label="返回">' +
                '<i class="fa fa-chevron-left"></i></button>';
        }

        var middle = PAGE === 'home' || !TITLE
            ? '<div class="appbar-logo">' +
              '<span class="lg-cn">零源机构</span>' +
              '<span class="lg-en">|Z℮R∅‑SOURCE</span>' +
              '</div>'
            : '<div class="appbar-title">' + esc(TITLE) + '</div>';

        bar.innerHTML =
            '<div class="appbar-inner">' +
            left +
            middle +
            '<button class="icon-btn" id="appbarMore" type="button" aria-label="更多">' +
            '<i class="fa fa-ellipsis-h"></i></button>' +
            '</div>';

        document.body.insertBefore(bar, document.body.firstChild);

        var back = $('#appbarBack', bar);
        if (back) {
            back.addEventListener('click', function () {
                haptic();
                if (history.length > 1) history.back();
                else location.href = BASE + CONFIG.siteUrl;
            });
        }

        $('#appbarMore', bar).addEventListener('click', function () {
            haptic();
            openMoreSheet();
        });

        // 滚动加深阴影
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                bar.classList.toggle('scrolled', window.scrollY > 8);
                ticking = false;
            });
        }, { passive: true });
    }

    /* ============================================================
       底部标签栏
       ============================================================ */
    function buildTabbar() {
        if (!HAS_TABBAR || $('#siteTabbar')) return;
        var nav = el('nav', 'tabbar');
        nav.id = 'siteTabbar';
        nav.setAttribute('aria-label', '主导航');

        nav.innerHTML = TABS.map(function (t) {
            var on = t.key === PAGE ? ' active' : '';
            return '<a class="tab-item' + on + '" href="' + BASE + t.href + '"' +
                (on ? ' aria-current="page"' : '') + '>' +
                '<i class="fa ' + t.icon + '" aria-hidden="true"></i>' +
                '<span>' + t.label + '</span></a>';
        }).join('');

        document.body.appendChild(nav);
    }

    /* ============================================================
       更多 面板
       ============================================================ */
    var moreSheet = null;

    function openMoreSheet() {
        if (!moreSheet) {
            moreSheet = new Sheet({ id: 'moreSheet' });
            moreSheet.setTitle('更多');
            moreSheet.setSub('零源机构 · Z℮R∅‑SOURCE');
            moreSheet.setBody(
                '<div class="list">' +
                SUBPAGES.map(function (p) {
                    return '<a class="list-item" href="' + BASE + p.href + '">' +
                        '<span class="li-icon ' + p.cls + '"><i class="fa ' + p.icon + '"></i></span>' +
                        '<span class="li-main"><span class="li-title">' + p.label + '</span></span>' +
                        '<i class="fa fa-chevron-right li-arrow"></i></a>';
                }).join('') +
                '</div>' +
                '<button class="btn ghost block mt-2" id="moreFeedback" type="button">' +
                '<i class="fa fa-comments"></i> 问题反馈</button>' +
                '<button class="btn ghost block mt-1" id="moreTop" type="button">' +
                '<i class="fa fa-arrow-up"></i> 回到顶部</button>'
            );
            $('#moreFeedback', moreSheet.bodyEl).addEventListener('click', function () {
                moreSheet.close();
                if (window.MODFeedback) window.MODFeedback.open();
                else toast('反馈功能加载中，请稍后重试');
            });
            $('#moreTop', moreSheet.bodyEl).addEventListener('click', function () {
                moreSheet.close();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        moreSheet.open();
    }

    /* ============================================================
       页脚
       ============================================================ */
    function buildFooter() {
        var main = $('.app-main');
        if (!main || $('.page-footer', main)) return;

        var f = el('footer', 'page-footer');
        f.innerHTML =
            '<nav class="pf-nav" aria-label="次级导航">' +
            SUBPAGES.map(function (p) {
                var on = p.key === PAGE ? ' class="on"' : '';
                return '<a href="' + BASE + p.href + '"' + on + '>' + p.label + '</a>';
            }).join('') +
            '</nav>' +
            '<div class="pf-copy" id="secretClick" role="button" tabindex="0" ' +
            'aria-label="版权信息，连续点击五次有惊喜">© 2025 零源机构ZERØ‑SOURCE</div>' +
            '<div class="pf-runtime" id="runtime">已运行：—</div>';

        main.appendChild(f);
    }

    /* ============================================================
       运行计时
       ============================================================ */
    var runtimeTimer = null;

    function startRuntime() {
        var node = $('#runtime');
        if (!node) return;

        var start = new Date(CONFIG.siteStartTime.replace(/-/g, '/')).getTime();

        function pad(n) {
            return n < 10 ? '0' + n : '' + n;
        }

        function tick() {
            var diff = Date.now() - start;
            if (diff < 0) diff = 0;
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            node.textContent = '已运行：' + d + '天 ' + pad(h) + ':' + pad(m) + ':' + pad(s);
        }

        tick();
        clearInterval(runtimeTimer);
        runtimeTimer = setInterval(tick, 1000);

        // 页面不可见时停止计时，省电
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                clearInterval(runtimeTimer);
            } else {
                tick();
                clearInterval(runtimeTimer);
                runtimeTimer = setInterval(tick, 1000);
            }
        });
    }

    /* ============================================================
       五连击彩蛋（点版权）
       ============================================================ */
    function bindSecretClick() {
        var node = $('#secretClick');
        if (!node) return;

        var count = 0;
        var timer = null;

        function fire() {
            var now = new Date();
            var key = (now.getMonth() + 1) + '-' + now.getDate();
            var page = CONFIG.birthdayPages[key];
            haptic(30);
            if (page) {
                window.open(BASE + page, '_blank');
            } else {
                toast('最近没人过生日哦~ 下次再来试试吧！', 2400);
            }
        }

        function hit() {
            count++;
            clearTimeout(timer);
            timer = setTimeout(function () { count = 0; }, 3000);
            if (count >= 5) {
                count = 0;
                clearTimeout(timer);
                fire();
            }
        }

        node.addEventListener('click', hit);
        node.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                hit();
            }
        });
    }

    /* ============================================================
       回到顶部
       ============================================================ */
    function buildBackTop() {
        var btn = el('button', 'back-top',
            '<i class="fa fa-arrow-up" aria-hidden="true"></i>');
        btn.type = 'button';
        btn.setAttribute('aria-label', '回到顶部');
        document.body.appendChild(btn);

        var ticking = false;
        window.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                btn.classList.toggle('show', window.scrollY > 500);
                ticking = false;
            });
        }, { passive: true });

        btn.addEventListener('click', function () {
            haptic();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ============================================================
       滚动进场动画
       ============================================================ */
    var revealObserver = null;

    function observeReveal(root) {
        var nodes = $$('.reveal:not(.in)', root || document);
        if (!nodes.length) return;

        if (!('IntersectionObserver' in window)) {
            nodes.forEach(function (n) { n.classList.add('in'); });
            return;
        }

        if (!revealObserver) {
            revealObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    en.target.classList.add('in');
                    revealObserver.unobserve(en.target);
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
        }
        nodes.forEach(function (n) { revealObserver.observe(n); });

        // 页面脚本可能后加 .reveal，这里补一次兜底扫描
        startSweep();
    }

    /* ============================================================
       进入视口的兜底扫描
       IntersectionObserver 在部分手机浏览器 / 省电模式 / 页面隐藏时
       回调会明显延迟甚至不触发。这里额外用一次轻量扫描兜底，
       保证「进入视口就该显示 / 该计数」这件事一定会发生，
       否则用户可能看到永远停在 0 的数字或一片空白。
       ============================================================ */
    var sweepTicking = false;
    var sweepAttached = false;

    function sweepInView() {
        var vh = window.innerHeight || 0;
        var limit = vh * 0.92;
        var pending = false;

        $$('.reveal:not(.in)').forEach(function (n) {
            var r = n.getBoundingClientRect();
            if (r.top < limit && r.bottom > 0) n.classList.add('in');
            else pending = true;
        });

        $$('[data-count]:not([data-counted])').forEach(function (n) {
            var r = n.getBoundingClientRect();
            if (r.top < limit && r.bottom > 0) {
                n.dataset.counted = '1';
                countUp(n, parseInt(n.dataset.count, 10) || 0, 1300, n.dataset.suffix || '');
            } else {
                pending = true;
            }
        });

        return pending;
    }

    function onSweepScroll() {
        if (sweepTicking) return;
        sweepTicking = true;

        // 同时用 rAF 和 setTimeout 兜底：后台标签页 / 省电模式下
        // requestAnimationFrame 会完全停摆，只靠它会永远解不开节流锁，
        // 兜底扫描就再也不会执行。
        var done = false;
        function run() {
            if (done) return;
            done = true;
            sweepTicking = false;
            if (!sweepInView()) {
                // 没有待处理的元素了就摘掉监听，避免长期占用滚动事件
                window.removeEventListener('scroll', onSweepScroll);
                sweepAttached = false;
            }
        }
        requestAnimationFrame(run);
        setTimeout(run, 180);
    }

    function startSweep() {
        if (!sweepAttached) {
            sweepAttached = true;
            window.addEventListener('scroll', onSweepScroll, { passive: true });
        }
        onSweepScroll();   // 立即扫一次
    }

    /* ============================================================
       数字滚动
       ============================================================ */
    function countUp(node, target, duration, suffix) {
        var start = null;
        var dur = duration || 1300;
        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            node.textContent = Math.floor(target * eased) + (suffix || '');
            if (p < 1) requestAnimationFrame(step);
            else node.textContent = target + (suffix || '');
        }
        requestAnimationFrame(step);
    }

    function observeCounters(root) {
        var nodes = $$('[data-count]:not([data-counted])', root || document);
        if (!nodes.length) return;

        function run(node) {
            if (node.dataset.counted) return;
            node.dataset.counted = '1';
            var target = parseInt(node.dataset.count, 10) || 0;
            countUp(node, target, 1300, node.dataset.suffix || '');
        }

        if (!('IntersectionObserver' in window)) {
            nodes.forEach(run);
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    run(en.target);
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.4 });

        nodes.forEach(function (n) { io.observe(n); });
    }

    /* ============================================================
       初始化
       ============================================================ */
    function init() {
        buildAppbar();
        buildTabbar();
        buildFooter();
        startRuntime();
        bindSecretClick();
        buildBackTop();

        // 主内容区标记，供进场动画与布局使用
        var main = $('.app-main');
        if (main) main.id = main.id || 'appMain';

        observeReveal();
        observeCounters();
        startSweep();

        // 站内链接加一点触感反馈
        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a) return;
            var href = a.getAttribute('href') || '';
            if (href.charAt(0) === '#' || a.target === '_blank') return;
            haptic(8);
        });

        console.log('[MOD] 移动端站点加载成功');
    }

    /* ---------- 对外接口 ---------- */
    window.MOD = {
        base: BASE,
        page: PAGE,
        config: CONFIG,
        tabs: TABS,
        subpages: SUBPAGES,
        Sheet: Sheet,
        sheet: function (opts) { return new Sheet(opts); },
        openSheet: function (s) { s.open(); },
        toast: toast,
        haptic: haptic,
        esc: esc,
        $: $,
        $$: $$,
        el: el,
        reveal: observeReveal,
        counters: observeCounters,
        countUp: countUp,
        openMore: openMoreSheet
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
