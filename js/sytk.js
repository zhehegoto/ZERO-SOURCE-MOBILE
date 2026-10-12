/* ============================================================
   零源机构 · 移动端 / Z℮R∅‑SOURCE / MOD
   sytk.js — 使用条款
   手风琴：默认展开第一条，其余收起；展开 / 收起带补间动画

   实现要点：DOM 状态（details.open）在点击时同步切换，
   动画只是叠加的视觉增强 —— 这样即使浏览器不推进动画帧
   （后台标签页、无头环境等），交互结果也一定是正确的。
   ============================================================ */
(function () {
    'use strict';

    var OPEN_MS = 400;
    var CLOSE_MS = 300;

    function init() {
        var items = Array.prototype.slice.call(document.querySelectorAll('.term-card'));
        if (!items.length) return;

        var M = window.MOD;
        var animations = [];

        function reduceMotion() {
            return !!(window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        }

        function stopAnims() {
            while (animations.length) {
                var a = animations.pop();
                if (a && typeof a.cancel === 'function') {
                    try { a.cancel(); } catch (e) { /* 忽略 */ }
                }
            }
            items.forEach(function (it) {
                it.classList.remove('is-opening', 'is-closing');
            });
        }

        /* 播放补间：状态已经切好，这里纯粹是视觉效果 */
        function animate(item, open) {
            var body = item.querySelector('.acc-body');
            if (!body || reduceMotion() || typeof body.animate !== 'function') return;

            item.classList.remove('is-opening', 'is-closing');
            item.classList.add(open ? 'is-opening' : 'is-closing');

            var settled = false;
            function finish() {
                if (settled) return;
                settled = true;
                var i = animations.indexOf(anim);
                if (i > -1) animations.splice(i, 1);
                if (typeof anim.cancel === 'function') {
                    try { anim.cancel(); } catch (e) { /* 忽略 */ }
                }
                item.classList.remove('is-opening', 'is-closing');
            }

            // 展开时卡片已经打开，scrollHeight 就是目标高度；
            // 收起时先把 open 打开量一次高度，再立刻切回收起状态。
            var wasOpen = item.open;
            if (!open && !wasOpen) return;
            if (!open) item.open = true;
            var h = body.scrollHeight;
            if (!open) item.open = false;

            var keyframes = open
                ? [
                    { maxHeight: '0px', opacity: 0, transform: 'translateY(-8px)' },
                    { maxHeight: h + 'px', opacity: 1, transform: 'translateY(0)' }
                ]
                : [
                    { maxHeight: h + 'px', opacity: 1 },
                    { maxHeight: '0px', opacity: 0 }
                ];

            var anim = body.animate(keyframes, {
                duration: open ? OPEN_MS : CLOSE_MS,
                easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
                fill: 'both'
            });
            animations.push(anim);

            // onfinish 之外再加一道定时兜底：浏览器不推进动画帧时也能收尾
            anim.onfinish = finish;
            setTimeout(finish, (open ? OPEN_MS : CLOSE_MS) + 80);
        }

        function toggle(item) {
            var isOpen = item.open;
            var others = items.filter(function (it) { return it !== item && it.open; });

            stopAnims();

            // 1) 先同步切换 DOM 状态，保证交互结果正确
            others.forEach(function (it) { it.open = false; });
            item.open = !isOpen;

            // 2) 再叠加补间动画（纯视觉增强）
            if (item.open) animate(item, true);
            others.forEach(function (it) { animate(it, false); });

            if (M && M.haptic) M.haptic();
        }

        items.forEach(function (item) {
            var summary = item.querySelector('summary');
            if (!summary) return;

            var apply = function (e) {
                if (e) e.preventDefault();
                toggle(item);
            };

            summary.addEventListener('click', apply);

            // 键盘操作（Enter / 空格）
            summary.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') apply(e);
            });
        });

        // 默认只展开第一条（HTML 里已带 open，这里做一次兜底同步）
        items.forEach(function (it, i) { it.open = i === 0; });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
