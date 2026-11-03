(function () {
    'use strict';

    var CONFIG = {

        siteStartTime: '2025-11-16 00:00:00',
        changelogStart: '2025-11-16',
        siteUrl: 'index.html',
        birthdayPages: {
            '1-10': 'sr/liu/liu.html',
            '5-10': 'sr/li/li.html',
            '6-10': 'sr/hehe/hehe.html',
            '6-15': 'sr/goto/goto.html',
            '5-9': 'sr/hui/hui.html'
        }
    };

    var TABS = [
        { key: 'home', label: '首页', icon: 'fa-home', href: 'index.html' },
        { key: 'sjz', label: '时间轴', icon: 'fa-clock-o', href: 'body/sjz.html' },
        { key: 'cyjs', label: '成员', icon: 'fa-users', href: 'body/cyjs.html' },
        { key: 'ctjr', label: '节日', icon: 'fa-calendar', href: 'body/ctjr.html' },
        { key: 'qxc', label: '相册', icon: 'fa-image', href: 'body/qxc.html' }
    ];

    var SUBPAGES = [
        { key: 'yszc', label: '隐私政策', icon: 'fa-shield', cls: 'blue', href: 'foot/yszc.html' },
        { key: 'sytk', label: '使用条款', icon: 'fa-file-text-o', cls: 'green', href: 'foot/sytk.html' },
        { key: 'wzdt', label: '网站地图', icon: 'fa-sitemap', cls: 'pink', href: 'foot/wzdt.html' },
        { key: 'gxrz', label: '更新日志', icon: 'fa-history', cls: '', href: 'foot/gxrz.html' }
    ];

    var BASE = (document.body && document.body.dataset.base) || '';
    var PAGE = (document.body && document.body.dataset.page) || '';
    var TITLE = (document.body && document.body.dataset.title) || '';
    var HAS_BACK = !!(document.body && document.body.dataset.back);
    var HAS_TABBAR = !(document.body && document.body.dataset.tabbar === 'off');

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

    function haptic(ms) {
        try {
            if (navigator.vibrate) navigator.vibrate(ms || 12);
        } catch (e) {  }
    }

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

        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.remove('show');
        }, ms || 1900);
    }

    var sheetStack = [];

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
            ' <div class="sheet-grip"></div>' +
            ' <div class="sheet-head">' +
            ' <div class="sh-main">' +
            ' <h2 class="sheet-title"></h2>' +
            ' <div class="sheet-sub"></div>' +
            ' </div>' +
            ' <button class="sheet-close" type="button" aria-label="关闭">&times;</button>' +
            ' </div>' +
            ' <div class="sheet-body"></div>' +
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
            if (dy < 0) dy = dy * 0.28;
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

        try {
            history.pushState({ modSheet: this.id }, '');
            this._pushed = true;
        } catch (e) {  }

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

    function buildAppbar() {
        if ($('#siteAppbar')) return;
        var bar = el('header', 'appbar');
        bar.id = 'siteAppbar';

        var left = '';
        if (HAS_BACK) {
            left = '<button class="icon-btn" id="appbarBack" type="button" aria-label="返回">' +
                '<span class="ib-txt">返回</span></button>';
        }

        var middle = PAGE === 'home' || !TITLE
            ? '<div class="appbar-logo">' +
              '<span class="lg-cn">零源机构</span>' +
              '<span class="lg-en">|ZERO‑SOURCE</span>' +
              '</div>'
            : '<div class="appbar-title">' + esc(TITLE) + '</div>';

        bar.innerHTML =
            '<div class="appbar-inner">' +
            left +
            middle +
            '<button class="icon-btn" id="appbarMore" type="button" aria-label="更多">' +
            '<span class="ib-txt">更多</span></button>' +
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

    function buildTabbar() {
        if (!HAS_TABBAR || $('#siteTabbar')) return;
        var nav = el('nav', 'tabbar');
        nav.id = 'siteTabbar';
        nav.setAttribute('aria-label', '主导航');

        nav.innerHTML = TABS.map(function (t) {
            var on = t.key === PAGE ? ' active' : '';
            return '<a class="tab-item' + on + '" href="' + BASE + t.href + '"' +
                (on ? ' aria-current="page"' : '') + '>' +
                '<span>' + t.label + '</span></a>';
        }).join('');

        document.body.appendChild(nav);
    }

    var moreSheet = null;

    function openMoreSheet() {
        if (!moreSheet) {
            moreSheet = new Sheet({ id: 'moreSheet' });
            moreSheet.setTitle('更多');
            moreSheet.setSub('零源机构 · ZERO‑SOURCE');
            moreSheet.setBody(
                '<div class="list">' +
                SUBPAGES.map(function (p) {
                    return '<a class="list-item" href="' + BASE + p.href + '">' +
                        '<span class="li-icon ' + p.cls + '"></span>' +
                        '<span class="li-main"><span class="li-title">' + p.label + '</span></span>' +
                        '</a>';
                }).join('') +
                '</div>' +
                '<button class="btn ghost block mt-2" id="moreFeedback" type="button">' +
                '问题反馈</button>' +
                '<button class="btn ghost block mt-1" id="moreTop" type="button">' +
                '回到顶部</button>'
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

    function buildBackTop() {
        var btn = el('button', 'back-top',
            '<span class="ib-txt">顶部</span>');
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

        startSweep();
    }

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

        var done = false;
        function run() {
            if (done) return;
            done = true;
            sweepTicking = false;
            if (!sweepInView()) {

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
        onSweepScroll();
    }

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

    function init() {
        buildAppbar();
        buildTabbar();
        buildFooter();
        startRuntime();
        bindSecretClick();
        buildBackTop();

        var main = $('.app-main');
        if (main) main.id = main.id || 'appMain';

        observeReveal();
        observeCounters();
        startSweep();

        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a) return;
            var href = a.getAttribute('href') || '';
            if (href.charAt(0) === '#' || a.target === '_blank') return;
            haptic(8);
        });

        console.log('[MOD] 移动端站点加载成功');
    }

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
