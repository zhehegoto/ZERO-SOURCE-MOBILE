/* ============================================================
   零源机构 · 移动端 / MOD
   home.js — 首页：最新动态、站点公告、历史公告、数据面板
   数据与 PC 端 js/index.js 保持一致，改内容时两边同步即可
   ============================================================ */
(function () {
    'use strict';

    var IMG = 'assets/images/';

    /* ==================== 数据 · 最新动态 ==================== */
    var newsData = [
        {
            id: 1,
            tag: '线下活动',
            title: '团队线下聚会圆满结束',
            desc: '零源机构 2026 年第一次线下会面，由盒盒、铃音、丽丽完成此次活动。本次举行了线下聚餐、游戏等多项活动。',
            img: IMG + 'dt/zx-1.jpg',
            date: '2026-01-01',
            content: '零源机构 ZERO-SOURCE 2026 年第一次线下会面圆满结束！\n\n本次活动由盒盒、铃音、丽丽三位成员参与，举行了线下聚餐、游戏等多项活动。\n\n大家在轻松愉快的氛围中交流了近期的工作和生活，也对团队未来的发展方向进行了深入讨论。\n\n感谢每一位伙伴的付出，期待下一次相聚！'
        },
        {
            id: 2,
            tag: '网站更新',
            title: '官网全新液态玻璃设计上线',
            desc: '零源机构官网迎来全面视觉升级，采用全新液态玻璃设计语言，带来更沉浸的浏览体验。',
            img: IMG + 'dt/zx-1.png',
            date: '2026-09-23',
            content: '零源机构官网全新改版上线！\n\n本次更新采用全新的液态玻璃设计语言，完全放弃了旧版的布局和视觉风格。\n\n主要更新内容：\n· 全新液态玻璃卡片设计\n· 多色流动渐变背景\n· 不规则有机圆角\n· 全新交互体验\n· 全站响应式优化\n\n欢迎各位成员体验并反馈！'
        },
        {
            id: 3,
            tag: 'xxx',
            title: 'xxx',
            desc: 'xxx',
            img: 'xxx',
            date: 'xxx',
            content: 'xxx'
        },
        {
            id: 4,
            tag: 'xxx',
            title: 'xxx',
            desc: 'xxx',
            img: 'xxx',
            date: 'xxx',
            content: 'xxx'
        },
        {
            id: 5,
            tag: 'xxx',
            title: 'xxx',
            desc: 'xxx',
            img: 'xxx',
            date: 'xxx',
            content: 'xxx'
        }
    ];

    /* ==================== 数据 · 站点公告 ==================== */
    var announcementData = [
        {
            id: 1,
            tag: '重要',
            tagClass: 'important',
            title: '网站全新改版上线',
            desc: '零源机构官网迎来全面升级，整体视觉与交互体验大幅优化，欢迎各位成员体验！',
            date: '2026-09-23',
            content: '零源机构官网全新改版上线！\n\n本次更新采用全新的液态玻璃设计语言，完全放弃了旧版的布局和视觉风格，从零开始创作。\n\n主要更新：\n· 液态玻璃卡片设计\n· 多色流动渐变背景\n· 全新页面布局\n· 优化的交互体验\n· 全站响应式适配\n\n如有任何问题或建议，欢迎通过问题反馈告诉我们。'
        },
        {
            id: 2,
            tag: 'xxx',
            tagClass: 'info',
            title: 'xxx',
            desc: 'xxx',
            date: 'xxx',
            content: 'xxx'
        },
        {
            id: 3,
            tag: 'xxx',
            tagClass: 'info',
            title: 'xxx',
            desc: 'xxx',
            date: 'xxx',
            content: 'xxx'
        },
        {
            id: 4,
            tag: 'xxx',
            tagClass: 'info',
            title: 'xxx',
            desc: 'xxx',
            date: 'xxx',
            content: 'xxx'
        }
    ];

    /* ==================== 运行天数（供数据面板计数用）
       直接在这里写入，保证 core.js 的计数观察器能读到 ==================== */
    (function seedRuntimeDays() {
        var node = document.getElementById('runtimeDays');
        if (!node) return;
        var start = new Date(MOD.config.siteStartTime.replace(/-/g, '/')).getTime();
        var days = Math.floor((Date.now() - start) / 86400000);
        node.dataset.count = days > 0 ? days : 0;
        node.textContent = '0';
    })();

    /* ==================== 详情弹层 ==================== */
    var newsSheet = null;
    var annSheet = null;
    var historySheet = null;

    function getNewsSheet() {
        if (!newsSheet) {
            newsSheet = MOD.sheet({ id: 'newsDetail', fullscreen: true });
        }
        return newsSheet;
    }

    function getAnnSheet() {
        if (!annSheet) {
            annSheet = MOD.sheet({ id: 'annDetail' });
        }
        return annSheet;
    }

    function openNews(item) {
        MOD.haptic();
        var s = getNewsSheet();
        s.setTitle(item.title || '动态详情');
        s.setSub('<i class="fa fa-calendar"></i> ' + MOD.esc(item.date) +
            ' &nbsp;·&nbsp; <span class="tag grad">' + MOD.esc(item.tag) + '</span>');
        s.setBody(
            '<div class="sheet-hero" id="newsHero"></div>' +
            '<div class="detail-content">' + MOD.esc(item.content) + '</div>'
        );
        var hero = document.getElementById('newsHero');
        if (item.img && /\.(jpe?g|png|gif|webp|svg)$/i.test(item.img)) {
            hero.style.backgroundImage = 'url("' + item.img + '")';
        } else {
            hero.remove();
        }
        s.open();
    }

    function openAnn(item) {
        MOD.haptic();
        var s = getAnnSheet();
        s.setTitle(item.title || '公告详情');
        s.setSub('<i class="fa fa-calendar"></i> ' + MOD.esc(item.date) +
            ' &nbsp;·&nbsp; <span class="tag ' + (item.tagClass || 'info') + '">' + MOD.esc(item.tag) + '</span>');
        s.setBody('<div class="detail-content">' + MOD.esc(item.content) + '</div>');
        s.open();
    }

    function openHistory() {
        var s = getHistorySheet();
        s.setBody(
            announcementData.map(function (a) {
                return '<button class="hist-item" type="button" data-id="' + a.id + '">' +
                    '<span class="hist-date">' + MOD.esc(a.date) + '</span>' +
                    '<span class="hist-main">' +
                    '<span class="tag ' + (a.tagClass || 'info') + '">' + MOD.esc(a.tag) + '</span>' +
                    '<span class="hist-title">' + MOD.esc(a.title) + '</span>' +
                    '<span class="hist-desc">' + MOD.esc(a.desc) + '</span>' +
                    '</span></button>';
            }).join('')
        );
        Array.prototype.forEach.call(s.bodyEl.querySelectorAll('.hist-item'), function (node) {
            node.addEventListener('click', function () {
                var id = parseInt(node.dataset.id, 10);
                var item = announcementData.filter(function (a) { return a.id === id; })[0];
                if (!item) return;
                s.close();
                // 等关闭动画（以及随之而来的 history.back）结束后再打开详情
                setTimeout(function () { openAnn(item); }, 260);
            });
        });
        s.open();
    }

    function getHistorySheet() {
        if (!historySheet) {
            historySheet = MOD.sheet({ id: 'historyList' });
            historySheet.setTitle('历史公告');
            historySheet.setSub('零源机构 · 全部公告');
        }
        return historySheet;
    }

    /* ==================== 渲染 · 最新动态 ==================== */
    function renderNews() {
        var track = document.getElementById('newsTrack');
        if (!track) return;

        track.innerHTML = newsData.map(function (item, i) {
            // 占位数据（如 'xxx'）不渲染 <img>，避免多余的 404 请求，
            // 直接显示渐变占位图
            var isRealImg = /\.(jpe?g|png|gif|webp|svg)$/i.test(item.img || '');
            return '<article class="news-card" role="button" tabindex="0" data-id="' + item.id + '" ' +
                'aria-label="查看动态：' + MOD.esc(item.title) + '">' +
                '<div class="news-card-img' + (isRealImg ? '' : ' broken') + '">' +
                (isRealImg
                    ? '<img src="' + MOD.esc(item.img) + '" alt="" loading="' +
                      (i < 2 ? 'eager' : 'lazy') + '" decoding="async">'
                    : '') +
                '<span class="news-card-tag">' + MOD.esc(item.tag) + '</span>' +
                '</div>' +
                '<div class="news-card-body">' +
                '<h3 class="news-card-title">' + MOD.esc(item.title) + '</h3>' +
                '<p class="news-card-desc">' + MOD.esc(item.desc) + '</p>' +
                '<div class="news-card-meta">' +
                '<span><i class="fa fa-calendar"></i>' + MOD.esc(item.date) + '</span>' +
                '<span class="news-card-more">查看详情 <i class="fa fa-arrow-right"></i></span>' +
                '</div></div></article>';
        }).join('');

        // 图片加载失败 → 显示渐变占位
        Array.prototype.forEach.call(track.querySelectorAll('.news-card-img img'), function (img) {
            img.addEventListener('error', function () {
                img.parentElement.classList.add('broken');
            });
        });

        // 点击 / 键盘打开详情
        Array.prototype.forEach.call(track.querySelectorAll('.news-card'), function (card) {
            function open() {
                var id = parseInt(card.dataset.id, 10);
                var item = newsData.filter(function (n) { return n.id === id; })[0];
                if (item) openNews(item);
            }
            card.addEventListener('click', open);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
        });
    }

    /* ==================== 轮播圆点 ==================== */
    function bindNewsDots() {
        var track = document.getElementById('newsTrack');
        var dots = document.getElementById('newsDots');
        if (!track || !dots) return;

        var cards = track.querySelectorAll('.news-card');
        if (!cards.length) return;

        dots.innerHTML = Array.prototype.map.call(cards, function () {
            return '<i></i>';
        }).join('');

        var marks = dots.querySelectorAll('i');
        var ticking = false;

        function update() {
            var step = cards.length > 1
                ? cards[1].offsetLeft - cards[0].offsetLeft
                : cards[0].offsetWidth;
            var idx = step > 0 ? Math.round(track.scrollLeft / step) : 0;
            idx = Math.max(0, Math.min(cards.length - 1, idx));
            Array.prototype.forEach.call(marks, function (m, i) {
                m.classList.toggle('on', i === idx);
            });
        }

        track.addEventListener('scroll', function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                update();
                ticking = false;
            });
        }, { passive: true });

        window.addEventListener('resize', update);
        update();
    }

    /* ==================== 渲染 · 公告 ==================== */
    function renderAnnouncements() {
        var box = document.getElementById('announcementTimeline');
        if (!box) return;

        box.innerHTML = announcementData.slice(0, 3).map(function (item) {
            return '<div class="tl-item" data-id="' + item.id + '">' +
                '<article class="ann-item" role="button" tabindex="0">' +
                '<div class="ann-meta">' +
                '<span class="tag ' + (item.tagClass || 'info') + '">' + MOD.esc(item.tag) + '</span>' +
                '<span class="ann-time"><i class="fa fa-calendar"></i>' + MOD.esc(item.date) + '</span>' +
                '</div>' +
                '<h3 class="ann-title">' + MOD.esc(item.title) + '</h3>' +
                '<p class="ann-desc">' + MOD.esc(item.desc) + '</p>' +
                '</article></div>';
        }).join('');

        Array.prototype.forEach.call(box.querySelectorAll('.tl-item'), function (node) {
            var item = announcementData.filter(function (a) {
                return a.id === parseInt(node.dataset.id, 10);
            })[0];
            if (!item) return;
            var card = node.querySelector('.ann-item');
            function open() { openAnn(item); }
            card.addEventListener('click', open);
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
        });
    }

    /* ==================== 初始化 ==================== */
    function init() {
        renderNews();
        renderAnnouncements();
        bindNewsDots();

        var btn = document.getElementById('historyAnnBtn');
        if (btn) {
            btn.addEventListener('click', function () {
                MOD.haptic();
                openHistory();
            });
        }

        // 首屏之后的内容做进场动画
        Array.prototype.forEach.call(
            document.querySelectorAll('#news, #bottom .wrap, #stats .wrap'),
            function (n) { n.classList.add('reveal'); }
        );
        MOD.reveal();

        // 锚点平滑滚动（"向下浏览"提示）
        var cue = document.querySelector('.hero-cue');
        if (cue) {
            cue.addEventListener('click', function (e) {
                e.preventDefault();
                var target = document.getElementById('news');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
