(function () {
    'use strict';

    var APP_OFFSET = 66;

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
        var lockUntil = 0;

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

        var lockTimer = null;

        function updateActive() {
            var now = Date.now();
            if (now < lockUntil) {

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

            if (window.innerHeight + window.pageYOffset >=
                document.documentElement.scrollHeight - 8) {
                current = sections[sections.length - 1].id;
            }

            clearTimeout(chipTimer);
            chipTimer = setTimeout(function () { setActive(current, true); }, 60);
        }

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
