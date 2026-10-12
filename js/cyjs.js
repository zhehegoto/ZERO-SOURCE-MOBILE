/* ============================================================
   零源机构 · 移动端 / MOD
   cyjs.js — 成员介绍：3D 翻转卡牌（轻触翻转）、团队数据、信息卡
   成员数据与 PC 端 pc/js/cyjs.js 完全一致，改内容时两边同步
   ============================================================ */
(function () {
    'use strict';

    var IMG = '../assets/images/';

    /* ==================== 数据 · 成员 ==================== */
    var members = [
        {
            name: '辙嗬', code: 'Z℮R∅‑SOURCE｜联合创始人', role: '「技术锚点」',
            email: '有个简单的问题~', phone: '+86 什么是爱情~',
            avatar: IMG + 'zehe.jpg',
            desc: '我的世界迷；给我一个蓝图我将给你建造整个世界！',
            colors: ['#ff6b9d', '#c44dff']
        },
        {
            name: '盒盒', code: 'Z℮R∅‑SOURCE｜联合创始人', role: '「策划锚点」',
            email: '它是否是一种味道~', phone: '+86 还是引力~',
            avatar: IMG + 'hehe.jpg',
            desc: 'ZERO官方品牌负责人，你看到的文章大部分都是我写的。官方王牌驾驶员，拥有绝对的驾驶技术；',
            colors: ['#4dd0ff', '#c44dff']
        },
        {
            name: '丽丽', code: 'Z℮R∅‑SOURCE｜联合创始人', role: '「运营锚点」',
            email: '从我初恋那天起~', phone: '+86 先是甜蜜~',
            avatar: IMG + 'lili.jpg',
            desc: 'ZERO官方行动派，我推砂狼白子，所以我要写砂狼白子;',
            colors: ['#ff6b9d', '#ff8e53']
        },
        {
            name: '铃音', code: 'Z℮R∅‑SOURCE｜设计负责人', role: '「设计节点」',
            email: '然后紧接就会有~', phone: '+86 风雨~',
            avatar: IMG + 'ech0.jpg',
            desc: 'Z℮R∅‑SOURCE后端技术师，主要负责Z℮R∅‑SOURCE AI的维护与运行。擅长网络操作计算机检测。',
            colors: ['#4dd0ff', '#4dffb8']
        },
        {
            name: '狂飙', code: 'Z℮R∅‑SOURCE｜安全负责人', role: '「安全节点」',
            email: '爱就像~', phone: '+86 蓝天白云~',
            avatar: IMG + 'sur1.jpg',
            desc: '你说，叮咚鸡做梦会梦到哈基米被大狗嚼吗？',
            colors: ['#4dffb8', '#c44dff']
        }
    ];

    /* ==================== 运行天数 + 数据面板数字
       直接写入最终数字并标记 data-counted，跳过 core.js 的逐帧计数：
       移动端 GPU 合成对「-webkit-background-clip:text + 逐帧改文本」
       会丢栅格，数字顶部被裁掉；这里保证数字完整、可读。
       运行天数统一取自 core.js 的 MOD.config.siteStartTime（建站日 2025-11-16） ==================== */
    (function seedCounters() {
        var runtime = document.getElementById('teamRuntimeDays');
        if (runtime) {
            var start = new Date(MOD.config.siteStartTime.replace(/-/g, '/')).getTime();
            var days = Math.floor((Date.now() - start) / 86400000);
            if (!(days > 0)) days = 0;
            runtime.dataset.count = days;
            runtime.textContent = days;
            runtime.dataset.counted = '1';
        }
        Array.prototype.forEach.call(
            document.querySelectorAll('#teamStats [data-count]'),
            function (node) {
                if (node.id === 'teamRuntimeDays') return;
                var target = parseInt(node.dataset.count, 10) || 0;
                node.textContent = target + (node.dataset.suffix || '');
                node.dataset.counted = '1';
            }
        );
    })();

    /* ==================== 头像：加载失败退化为渐变字母 ==================== */
    function avatarHTML(member) {
        return '<img src="' + MOD.esc(member.avatar) + '" alt="' + MOD.esc(member.name) +
            '" loading="lazy" decoding="async">';
    }

    function bindAvatarFallback(root, member) {
        Array.prototype.forEach.call(root.querySelectorAll('img'), function (img) {
            img.addEventListener('error', function () {
                var box = img.parentElement;
                if (!box || box.querySelector('.fc-avatar-fallback')) return;
                box.innerHTML = '<div class="fc-avatar-fallback">' +
                    MOD.esc(member.name.charAt(0)) + '</div>';
            });
        });
    }

    /* ==================== 详情弹层 ==================== */
    var detailSheet = null;

    function getDetailSheet() {
        if (!detailSheet) detailSheet = MOD.sheet({ id: 'memberDetail' });
        return detailSheet;
    }

    function openDetail(member) {
        MOD.haptic();
        var s = getDetailSheet();
        s.setTitle(member.name + ' · 成员档案');
        s.setSub('<i class="fa fa-id-card-o"></i> ' + MOD.esc(member.code) +
            ' &nbsp;·&nbsp; <span class="tag grad">' + MOD.esc(member.role) + '</span>');
        s.setBody(
            '<div class="member-detail">' +
            '<div class="member-detail-avatar">' + avatarHTML(member) + '</div>' +
            '<div class="member-detail-name">' + MOD.esc(member.name) + '</div>' +
            '<div class="member-detail-code">' + MOD.esc(member.code) + '</div>' +
            '<div class="member-detail-role">' + MOD.esc(member.role) + '</div>' +
            '<div class="member-detail-list">' +
            '<div class="member-detail-item"><i class="fa fa-envelope-o"></i>' +
            '<span><b>联系方式</b>' + MOD.esc(member.email) + '</span></div>' +
            '<div class="member-detail-item"><i class="fa fa-phone"></i>' +
            '<span><b>电话</b>' + MOD.esc(member.phone) + '</span></div>' +
            '<div class="member-detail-item"><i class="fa fa-quote-left"></i>' +
            '<span><b>成员简介</b>' + MOD.esc(member.desc) + '</span></div>' +
            '</div></div>'
        );
        s.open();
        bindAvatarFallback(s.bodyEl, member);
    }

    /* ==================== 轻触翻转 ==================== */
    function flipCards() {
        return MOD.$$('.flip-card.flipped');
    }

    function collapseAll() {
        flipCards().forEach(function (c) {
            c.classList.remove('flipped');
            c.setAttribute('aria-expanded', 'false');
        });
    }

    function toggleCard(card) {
        var wasFlipped = card.classList.contains('flipped');
        collapseAll();
        if (!wasFlipped) {
            MOD.haptic();
            card.classList.add('flipped');
            card.setAttribute('aria-expanded', 'true');
        }
    }

    /* ==================== 创建卡牌 ==================== */
    function createFlipCard(member, index) {
        var card = document.createElement('div');
        card.className = 'flip-card';
        card.dataset.index = index;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-expanded', 'false');
        card.setAttribute('aria-label', '成员卡牌：' + member.name + '，轻触翻转查看详情');
        card.style.setProperty('--card-color-1', member.colors[0]);
        card.style.setProperty('--card-color-2', member.colors[1]);

        card.innerHTML =
            '<div class="flip-card-inner">' +

            /* ---- 正面 ---- */
            '<div class="fc-face fc-front">' +
            '<div class="fc-avatar-wrap">' +
            '<div class="fc-avatar-ring"></div>' +
            '<div class="fc-avatar">' + avatarHTML(member) + '</div>' +
            '</div>' +
            '<div class="fc-name">' + MOD.esc(member.name) + '</div>' +
            '<div class="fc-code">' + MOD.esc(member.code) + '</div>' +
            '<div class="fc-role">' + MOD.esc(member.role) + '</div>' +
            '<div class="fc-flip-hint"><i class="fa fa-refresh"></i><span>点击翻转</span></div>' +
            '</div>' +

            /* ---- 背面 ---- */
            '<div class="fc-face fc-back">' +
            '<div class="fc-back-head">' +
            '<div class="fc-back-avatar">' + avatarHTML(member) + '</div>' +
            '<div class="fc-back-headmain">' +
            '<div class="fc-back-name">' + MOD.esc(member.name) + '</div>' +
            '<div class="fc-back-code">' + MOD.esc(member.code) + ' · ' + MOD.esc(member.role) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="fc-back-info">' +
            '<div class="fc-info-item"><i class="fa fa-id-card-o"></i>' +
            '<span><b>代号</b>' + MOD.esc(member.code) + '</span></div>' +
            '<div class="fc-info-item"><i class="fa fa-star-o"></i>' +
            '<span><b>定位</b>' + MOD.esc(member.role) + '</span></div>' +
            '<div class="fc-info-item"><i class="fa fa-envelope"></i>' +
            '<span><b>联系方式</b>' + MOD.esc(member.email) + '</span></div>' +
            '<div class="fc-info-item"><i class="fa fa-phone"></i>' +
            '<span><b>电话</b>' + MOD.esc(member.phone) + '</span></div>' +
            '<div class="fc-info-quote"><i class="fa fa-quote-left"></i> ' +
            MOD.esc(member.desc) + '</div>' +
            '</div>' +
            '<div class="fc-back-actions">' +
            '<button class="fc-btn primary" type="button" data-act="detail">' +
            '<i class="fa fa-id-card-o"></i> 查看详情</button>' +
            '<button class="fc-btn ghost" type="button" data-act="flipback">' +
            '<i class="fa fa-rotate-right"></i> 翻回</button>' +
            '</div>' +
            '</div>' +

            '</div>';

        bindAvatarFallback(card, member);

        /* 轻触卡牌任意处翻转 / 翻回 */
        card.addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('[data-act]') : null;
            if (btn) {
                if (btn.dataset.act === 'detail') openDetail(member);
                else collapseAll();
                return;
            }
            toggleCard(card);
        });

        /* 键盘可用（Enter / 空格），移动端外接键盘与读屏同样友好 */
        card.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            toggleCard(card);
        });

        return card;
    }

    /* ==================== 初始化 ==================== */
    function init() {
        var grid = document.getElementById('cardGrid');
        if (!grid) return;

        grid.innerHTML = '';
        members.forEach(function (member, i) {
            grid.appendChild(createFlipCard(member, i));
        });

        /* 整体进场：给网格加一个类即可，逐张延迟在 CSS 里配好 */
        requestAnimationFrame(function () {
            grid.classList.add('is-in');
        });

        /* 点空白处把已翻开的卡翻回去 */
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('.flip-card')) return;
            collapseAll();
        });

        /* 数据面板的数字已在 seedCounters() 里写好并标记 data-counted，
           这里补一次扫描只是为了让 core.js 的观察器有统一入口 */
        MOD.counters();

        /* 数据卡与信息卡做一次透明度过渡（不是持续动画） */
        var fadeNodes = MOD.$$('#teamStats .stat-card, .info-card');
        fadeNodes.forEach(function (n) {
            n.classList.add('reveal');
        });
        MOD.reveal();
        setTimeout(function () {
            fadeNodes.forEach(function (n) { n.classList.add('in'); });
        }, 60);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
