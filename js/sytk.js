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
                    try { a.cancel(); } catch (e) {  }
                }
            }
            items.forEach(function (it) {
                it.classList.remove('is-opening', 'is-closing');
            });
        }

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
                    try { anim.cancel(); } catch (e) {  }
                }
                item.classList.remove('is-opening', 'is-closing');
            }

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

            anim.onfinish = finish;
            setTimeout(finish, (open ? OPEN_MS : CLOSE_MS) + 80);
        }

        function toggle(item) {
            var isOpen = item.open;
            var others = items.filter(function (it) { return it !== item && it.open; });

            stopAnims();

            others.forEach(function (it) { it.open = false; });
            item.open = !isOpen;

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

            summary.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') apply(e);
            });
        });

        items.forEach(function (it, i) { it.open = i === 0; });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
