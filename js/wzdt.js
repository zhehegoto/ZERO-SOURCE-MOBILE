(function () {
    'use strict';

    var MIN_SCALE = 0.6;
    var MAX_SCALE = 2.4;
    var ZOOM_STEP = 1.35;

    var MAX_T = 260;

    var stage = document.getElementById('mapExplorer');
    var grid = document.getElementById('mapGrid');
    var coordX = document.getElementById('coordX');
    var coordY = document.getElementById('coordY');
    var pin = document.getElementById('mapPin');
    var pinMarker = document.getElementById('pinMarker');
    var bubble = document.getElementById('pinBubble');
    var zoomInBtn = document.getElementById('zoomIn');
    var zoomOutBtn = document.getElementById('zoomOut');
    var zoomResetBtn = document.getElementById('zoomReset');

    if (stage && grid) initMap();

    function initMap() {
        var scale = 1;
        var tx = 0;
        var ty = 0;

        var dragging = false;
        var moved = false;
        var startX = 0;
        var startY = 0;
        var baseTx = 0;
        var baseTy = 0;
        var pinchStartDist = 0;
        var pinchStartScale = 1;

        function clamp(v, min, max) {
            return v < min ? min : (v > max ? max : v);
        }

        function pad3(n) {
            n = Math.round(n);
            return (n < 0 ? '-' : '') + ('000' + Math.abs(n)).slice(-3);
        }

        function px(t) {
            return (t.x != null ? t.x : t.clientX) || 0;
        }

        function py(t) {
            return (t.y != null ? t.y : t.clientY) || 0;
        }

        function draw() {
            grid.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' +
                ty.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
        }

        function syncCoord() {
            if (coordX) coordX.textContent = 'X ' + pad3(tx);
            if (coordY) coordY.textContent = 'Y ' + pad3(-ty);
        }

        function clampPan() {
            var w = stage.clientWidth || 320;
            var h = stage.clientHeight || 260;
            var cover = (scale - 1) / 2;
            var lx = Math.min(MAX_T, Math.abs(w) * cover);
            var ly = Math.min(MAX_T, Math.abs(h) * cover);
            tx = clamp(tx, -lx, lx);
            ty = clamp(ty, -ly, ly);
        }

        function apply(zoomHint) {
            clampPan();
            draw();
            syncCoord();
            if (zoomInBtn) zoomInBtn.disabled = scale >= MAX_SCALE - 0.001;
            if (zoomOutBtn) zoomOutBtn.disabled = scale <= MIN_SCALE + 0.001;
            if (zoomHint) MOD.haptic(8);
        }

        function zoomAt(next, cx, cy) {
            next = clamp(next, MIN_SCALE, MAX_SCALE);
            var k = next / scale;

            tx = cx - k * (cx - tx);
            ty = cy - k * (cy - ty);
            scale = next;
            apply(true);
        }

        function centerOfCard() {
            var r = stage.getBoundingClientRect();
            return {
                left: r.left,
                top: r.top,
                cx: r.width / 2,
                cy: r.height / 2
            };
        }

        function onTouchStart(e) {
            if (e.touches.length >= 2) {
                dragging = false;
                pinchStartDist = pinchDistOf(e) || 1;
                pinchStartScale = scale;
                return;
            }
            if (e.touches.length === 1) {
                var t0 = e.touches[0];
                dragging = true;
                moved = false;
                startX = px(t0);
                startY = py(t0);
                baseTx = tx;
                baseTy = ty;
                pinchStartDist = 0;
            }
        }

        function pinchDistOf(e) {
            if (!e.touches || e.touches.length < 2) return 0;
            var a = e.touches[0];
            var b = e.touches[1];
            return Math.hypot(px(a) - px(b), py(a) - py(b));
        }

        function onTouchMove(e) {
            if (e.cancelable) e.preventDefault();

            if (e.touches.length >= 2) {
                if (!pinchStartDist) {

                    pinchStartDist = pinchDistOf(e) || 1;
                    pinchStartScale = scale;
                    return;
                }
                var dist = pinchDistOf(e);
                if (dist > 0) {
                    var r = stage.getBoundingClientRect();
                    var a = e.touches[0];
                    var b = e.touches[1];
                    zoomAt(pinchStartScale * (dist / pinchStartDist),
                        (px(a) + px(b)) / 2 - r.left,
                        (py(a) + py(b)) / 2 - r.top);
                }
                moved = true;
                return;
            }

            if (!dragging || !e.touches.length) return;

            var t = e.touches[0];
            var dx = px(t) - startX;
            var dy = py(t) - startY;

            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;

            var nx = baseTx + dx;
            var ny = baseTy + dy;

            var overX = nx - clamp(nx, -MAX_T, MAX_T);
            var overY = ny - clamp(ny, -MAX_T, MAX_T);
            if (overX !== 0 && overX * dx < 0) nx = clamp(nx, -MAX_T, MAX_T);
            if (overY !== 0 && overY * dy < 0) ny = clamp(ny, -MAX_T, MAX_T);

            tx = nx;
            ty = ny;
            apply(false);
        }

        function releaseTouches(e) {
            if (e.touches.length >= 2) {
                pinchStartDist = pinchDistOf(e) || 1;
                pinchStartScale = scale;
                return;
            }
            pinchStartDist = 0;
            if (e.touches.length === 1) {
                dragging = true;
                var p = e.touches[0];
                startX = px(p);
                startY = py(p);
                baseTx = tx;
                baseTy = ty;
            } else {
                dragging = false;
            }
        }

        stage.addEventListener('touchstart', onTouchStart, { passive: true });
        stage.addEventListener('touchmove', onTouchMove, { passive: false });
        stage.addEventListener('touchend', releaseTouches);
        stage.addEventListener('touchcancel', releaseTouches);

        stage.addEventListener('mousedown', function (e) {
            if (e.target.closest && e.target.closest('.zoom-btn, .baidumap-btn, .pin-marker')) return;
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            baseTx = tx;
            baseTy = ty;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            var dx = e.clientX - startX;
            var dy = e.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
            tx = baseTx + dx;
            ty = baseTy + dy;
            apply(false);
        });

        document.addEventListener('mouseup', function () {
            dragging = false;
        });

        stage.addEventListener('wheel', function (e) {
            if (e.cancelable) e.preventDefault();
            var r = stage.getBoundingClientRect();
            zoomAt(scale * (e.deltaY > 0 ? 0.9 : 1.1), e.clientX - r.left, e.clientY - r.top);
        }, { passive: false });

        stage.addEventListener('click', function (e) {
            if (!moved) return;
            if (e.target.closest && e.target.closest('.zoom-btn, .baidumap-btn, .pin-marker')) return;
            moved = false;
            e.preventDefault();
            e.stopPropagation();
        }, true);

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var c = centerOfCard();
                zoomAt(scale * ZOOM_STEP, c.cx, c.cy);
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                var c = centerOfCard();
                zoomAt(scale / ZOOM_STEP, c.cx, c.cy);
            });
        }

        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                scale = 1;
                tx = 0;
                ty = 0;
                apply(true);
            });
        }

        if (pinMarker && bubble) {
            pinMarker.addEventListener('click', function (e) {
                e.stopPropagation();
                var hidden = bubble.classList.toggle('hidden');
                pinMarker.setAttribute('aria-expanded', hidden ? 'false' : 'true');
                MOD.haptic();
            });
        }

        window.__wzdtMap = {
            state: function () {
                return {
                    scale: scale,
                    tx: tx,
                    ty: ty,
                    min: MIN_SCALE,
                    max: MAX_SCALE,
                    transform: grid.style.transform
                };
            }
        };

        apply(false);
    }

    var bmapBtn = document.getElementById('baiduMapBtn');
    if (bmapBtn) {
        bmapBtn.addEventListener('click', function (e) {
            var url = bmapBtn.getAttribute('data-map-url') || '';
            if (/^https?:\/\//i.test(url)) {
                e.preventDefault();
                window.open(url, '_blank', 'noopener');
            } else {
                e.preventDefault();
                MOD.haptic();
                MOD.toast('地图链接待补充');
            }
        });
    }

    var infoBtn = document.getElementById('zoomInfo');
    if (infoBtn) {
        infoBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            MOD.haptic();
            MOD.toast('单指拖拽平移 · 双指捏合缩放', 2400);
        });
    }

    var SELF_HOST = String(location.hostname || '').replace(/^www\./i, '').toLowerCase();

    Array.prototype.forEach.call(document.querySelectorAll('.platform-card[href]'), function (card) {
        var target = null;
        try {
            target = new URL(card.getAttribute('href') || '', location.href);
        } catch (e) {
            return;
        }
        var host = String(target.hostname || '').replace(/^www\./i, '').toLowerCase();
        if (host !== SELF_HOST) return;

        card.addEventListener('click', function (e) {
            e.preventDefault();
            MOD.haptic();
            MOD.toast('你已经在当前网站上了');
        });
    });

    var copyCards = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(copyCards, function (card) {
        card.addEventListener('click', function () {
            copyText(card.getAttribute('data-copy') || '', card);
        });
    });

    function flashCopied(card) {
        if (!card) return;
        card.classList.add('copied');
        setTimeout(function () {
            card.classList.remove('copied');
        }, 1400);
    }

    function copyText(text, card) {
        if (!text) return;

        var tip = (card && card.getAttribute('data-copy-tip')) || '已复制到剪贴板';

        function done() {
            MOD.haptic();
            flashCopied(card);
            MOD.toast(tip);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () {
                if (fallbackCopy(text)) done();
                else MOD.toast('复制失败，请长按手动复制');
            });
        } else if (fallbackCopy(text)) {
            done();
        } else {
            MOD.toast('复制失败，请长按手动复制');
        }
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', 'readonly');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = false;
        try {
            ok = document.execCommand('copy');
        } catch (err) {
            ok = false;
        }
        document.body.removeChild(ta);
        return ok;
    }

    Array.prototype.forEach.call(document.querySelectorAll('.section'), function (n) {
        n.classList.add('reveal');
    });
    MOD.reveal();
})();
