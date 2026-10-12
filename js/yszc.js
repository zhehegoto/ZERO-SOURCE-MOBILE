/* ============================================================
   零源机构 · 移动端 / Z℮R∅‑SOURCE / MOD
   yszc.js — 隐私政策
   目录胶囊：点击平滑滚动 + 滚动时高亮当前小节（IntersectionObserver）
   ============================================================ */
(function () {
    'use strict';

    var APP_OFFSET = 66;   // 顶部栏 + 吸顶目录胶囊的估算高度（用于滚动定位与高亮判定）

    function init() {
        var chips = document.getElementById('tocChips');
        var M = window.MOD;
        if (!chips) return;

        var links = Array.prototype.slice.call(chips.querySelectorAll('a[data-target]'));
        var sections = links
            .map(function (a) { return document.getElementById(a.getAttribute('data-target')); })
            .filter(Boolean);
        if (!sections.length) return;

        var activeId = '';
        var chipTimer = null;
        var lockUntil = 0;   // 程序化滚动期间，锁住高亮，避免动画中途闪到别的章节

        /* 把高亮的胶囊滚进可视区（用 rect 计算，不涉及 offsetParent 的差异） */
        function scrollChipIntoView(id) {
            var node = null;
            for (var i = 0; i < links.length; i++) {
                if (links[i].getAttribute('data-target') === id) { node = links[i]; break; }
            }
            if (!node) return;

            var n = node.getBoundingClientRect();
            var c = chips.getBoundingClientRect();
            var pad = 16;

            if (n.left < c.left + pad) {
                chips.scrollLeft += (n.left - c.left) - pad;
            } else if (n.right > c.right - pad) {
                chips.scrollLeft += (n.right - c.right) + pad;
            }
        }

        function setActive(id, scrollChip) {
            if (!id || id === activeId) return;
            activeId = id;

            links.forEach(function (a) {
                var on = a.getAttribute('data-target') === id;
                a.classList.toggle('on', on);
                if (on) a.setAttribute('aria-current', 'true');
                else a.removeAttribute('aria-current');
            });

            if (scrollChip !== false) scrollChipIntoView(id);
        }

        /* 平滑滚动，并带一道定时兜底：
           个别环境（后台标签页 / 无头浏览器）不推进动画帧，
           平滑滚动会一直停在原地，此时用即时跳转保证结果正确。 */
        function scrollToY(y) {
            var done = false;

            function land() {
                if (done) return;
                done = true;
                if (Math.abs(window.pageYOffset - y) > 4) window.scrollTo(0, y);
            }

            try {
                window.scrollTo({ top: y, behavior: 'smooth' });
            } catch (err) {
                window.scrollTo(0, y);
                return;
            }
            setTimeout(land, 1200);
        }

        /* ---------- 点击胶囊：平滑滚动到对应小节 ---------- */
        links.forEach(function (a) {
            a.addEventListener('click', function (e) {
                var id = a.getAttribute('data-target');
                var target = document.getElementById(id);
                if (!target) return;

                e.preventDefault();
                setActive(id, true);
                lockUntil = Date.now() + 900;

                var y = target.getBoundingClientRect().top + window.pageYOffset - APP_OFFSET;
                scrollToY(Math.max(0, y));

                if (history.replaceState) history.replaceState(null, '', '#' + id);
                if (M && M.haptic) M.haptic();
            });
        });

        /* ---------- 滚动时判定当前小节 ---------- */
        var lockTimer = null;

        function updateActive() {
            var now = Date.now();
            if (now < lockUntil) {
                // 程序化滚动还没落定，等锁释放后再算一次，保证最终一定对齐
                clearTimeout(lockTimer);
                lockTimer = setTimeout(updateActive, lockUntil - now + 30);
                return;
            }

            var probe = window.pageYOffset + APP_OFFSET + 40;
            var current = sections[0].id;

            for (var i = 0; i < sections.length; i++) {
                var top = sections[i].getBoundingClientRect().top + window.pageYOffset;
                if (top <= probe) current = sections[i].id;
            }

            // 滚到底部时强制高亮最后一节（与 PC 版一致）
            if (window.innerHeight + window.pageYOffset >=
                document.documentElement.scrollHeight - 8) {
                current = sections[sections.length - 1].id;
            }

            clearTimeout(chipTimer);
            chipTimer = setTimeout(function () { setActive(current, true); }, 60);
        }

        /* 用时间戳节流而不是 rAF：rAF 在某些环境（无头浏览器、
           后台标签页）不推进，会让高亮彻底停摆 */
        var lastRun = 0;
        var pending = null;

        function onScroll() {
            var now = Date.now();
            if (now - lastRun > 90) {
                lastRun = now;
                updateActive();
                return;
            }
            if (pending) return;
            pending = setTimeout(function () {
                pending = null;
                lastRun = Date.now();
                updateActive();
            }, 90 - (now - lastRun));
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });

        /* ---------- 用 IntersectionObserver 让高亮更跟手 ----------
           位置计算负责兜底（底部、快速滚动），observer 负责进视口的即时反馈 */
        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                if (Date.now() < lockUntil) return;
                entries.forEach(function (en) {
                    if (en.isIntersecting && en.intersectionRatio > 0.08) {
                        setActive(en.target.id, true);
                    }
                });
            }, {
                rootMargin: '-' + APP_OFFSET + 'px 0px -55% 0px',
                threshold: [0.08, 0.3]
            });
            sections.forEach(function (s) { io.observe(s); });
        }

        updateActive();

        /* ---------- 联系卡片 → 问题反馈 ---------- */
        var contactBtn = document.getElementById('yszkContactBtn');
        if (contactBtn) {
            contactBtn.addEventListener('click', function () {
                if (M && M.haptic) M.haptic();
                if (window.MODFeedback) window.MODFeedback.open();
                else if (M && M.toast) M.toast('反馈功能加载中，请稍后重试');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
