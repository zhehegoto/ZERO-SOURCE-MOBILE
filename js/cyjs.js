(function () {
    'use strict';

    var IMG = '../assets/images/';

    var members = [
        {
            name: '辙嗬', code: 'ZERO‑SOURCE｜联合创始人', role: '「技术锚点」',
            email: '有个简单的问题~', phone: '+86 什么是爱情~',
            avatar: IMG + 'zehe.jpg',
            desc: '我的世界迷；给我一个蓝图我将给你建造整个世界！',
            colors: ['#ff6b9d', '#c44dff']
        },
        {
            name: '盒盒', code: 'ZERO‑SOURCE｜联合创始人', role: '「策划锚点」',
            email: '它是否是一种味道~', phone: '+86 还是引力~',
            avatar: IMG + 'hehe.jpg',
            desc: 'ZERO官方品牌负责人，你看到的文章大部分都是我写的。官方王牌驾驶员，拥有绝对的驾驶技术；',
            colors: ['#4dd0ff', '#c44dff']
        },
        {
            name: '丽丽', code: 'ZERO‑SOURCE｜联合创始人', role: '「运营锚点」',
            email: '从我初恋那天起~', phone: '+86 先是甜蜜~',
            avatar: IMG + 'lili.jpg',
            desc: 'ZERO官方行动派，我推砂狼白子，所以我要写砂狼白子;',
            colors: ['#ff6b9d', '#ff8e53']
        },
        {
            name: '铃音', code: 'ZERO‑SOURCE｜设计负责人', role: '「设计节点」',
            email: '然后紧接就会有~', phone: '+86 风雨~',
            avatar: IMG + 'ech0.jpg',
            desc: 'ZERO‑SOURCE后端技术师，主要负责ZERO‑SOURCE AI的维护与运行。擅长网络操作计算机检测。',
            colors: ['#4dd0ff', '#4dffb8']
        },
        {
            name: '狂飙', code: 'ZERO‑SOURCE｜安全负责人', role: '「安全节点」',
            email: '爱就像~', phone: '+86 蓝天白云~',
            avatar: IMG + 'sur1.jpg',
            desc: '你说，叮咚鸡做梦会梦到哈基米被大狗嚼吗？',
            colors: ['#4dffb8', '#c44dff']
        }
    ];

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

    var detailSheet = null;

    function getDetailSheet() {
        if (!detailSheet) detailSheet = MOD.sheet({ id: 'memberDetail' });
        return detailSheet;
    }

    function openDetail(member) {
        MOD.haptic();
        var s = getDetailSheet();
        s.setTitle(member.name + ' · 成员档案');
        s.setSub('' + MOD.esc(member.code) +
            ' &nbsp;·&nbsp; <span class="tag grad">' + MOD.esc(member.role) + '</span>');
        s.setBody(
            '<div class="member-detail">' +
            '<div class="member-detail-avatar">' + avatarHTML(member) + '</div>' +
            '<div class="member-detail-name">' + MOD.esc(member.name) + '</div>' +
            '<div class="member-detail-code">' + MOD.esc(member.code) + '</div>' +
            '<div class="member-detail-role">' + MOD.esc(member.role) + '</div>' +
            '<div class="member-detail-list">' +
            '<div class="member-detail-item">' +
            '<span><b>联系方式</b>' + MOD.esc(member.email) + '</span></div>' +
            '<div class="member-detail-item">' +
            '<span><b>电话</b>' + MOD.esc(member.phone) + '</span></div>' +
            '<div class="member-detail-item">' +
            '<span><b>成员简介</b>' + MOD.esc(member.desc) + '</span></div>' +
            '</div></div>'
        );
        s.open();
        bindAvatarFallback(s.bodyEl, member);
    }

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

            '<div class="fc-face fc-front">' +
            '<div class="fc-avatar-wrap">' +
            '<div class="fc-avatar-ring"></div>' +
            '<div class="fc-avatar">' + avatarHTML(member) + '</div>' +
            '</div>' +
            '<div class="fc-name">' + MOD.esc(member.name) + '</div>' +
            '<div class="fc-code">' + MOD.esc(member.code) + '</div>' +
            '<div class="fc-role">' + MOD.esc(member.role) + '</div>' +
            '<div class="fc-flip-hint"><span>点击翻转</span></div>' +
            '</div>' +

            '<div class="fc-face fc-back">' +
            '<div class="fc-back-head">' +
            '<div class="fc-back-avatar">' + avatarHTML(member) + '</div>' +
            '<div class="fc-back-headmain">' +
            '<div class="fc-back-name">' + MOD.esc(member.name) + '</div>' +
            '<div class="fc-back-code">' + MOD.esc(member.code) + ' · ' + MOD.esc(member.role) + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="fc-back-info">' +
            '<div class="fc-info-item">' +
            '<span><b>代号</b>' + MOD.esc(member.code) + '</span></div>' +
            '<div class="fc-info-item">' +
            '<span><b>定位</b>' + MOD.esc(member.role) + '</span></div>' +
            '<div class="fc-info-item">' +
            '<span><b>联系方式</b>' + MOD.esc(member.email) + '</span></div>' +
            '<div class="fc-info-item">' +
            '<span><b>电话</b>' + MOD.esc(member.phone) + '</span></div>' +
            '<div class="fc-info-quote">' +
            MOD.esc(member.desc) + '</div>' +
            '</div>' +
            '<div class="fc-back-actions">' +
            '<button class="fc-btn primary" type="button" data-act="detail">' +
            '查看详情</button>' +
            '<button class="fc-btn ghost" type="button" data-act="flipback">' +
            '翻回</button>' +
            '</div>' +
            '</div>' +

            '</div>';

        bindAvatarFallback(card, member);

        card.addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('[data-act]') : null;
            if (btn) {
                if (btn.dataset.act === 'detail') openDetail(member);
                else collapseAll();
                return;
            }
            toggleCard(card);
        });

        card.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            toggleCard(card);
        });

        return card;
    }

    function init() {
        var grid = document.getElementById('cardGrid');
        if (!grid) return;

        grid.innerHTML = '';
        members.forEach(function (member, i) {
            grid.appendChild(createFlipCard(member, i));
        });

        requestAnimationFrame(function () {
            grid.classList.add('is-in');
        });

        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('.flip-card')) return;
            collapseAll();
        });

        MOD.counters();

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
