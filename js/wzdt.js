/* ============================================================
   零源机构 · 移动端 / MOD
   wzdt.js — 网站地图：地图卡拖拽 / 双指缩放 / 图钉气泡 / 点击复制
   交互与 PC 端 js/wzdt.js 对齐，额外把边界钳制住，
   保证地图不会被拖出视野；复制反馈统一用 MOD.toast。
   ============================================================ */
(function () {
    'use strict';

    var MIN_SCALE = 0.6;
    var MAX_SCALE = 2.4;
    var ZOOM_STEP = 1.35;
    /* 外层网格 inset:-50%，理论可平移半个卡片；再收一点，
       保证卡片四角始终有网格覆盖，不会露出底色 */
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

    /* ============================================================
       地图卡：拖拽 + 双指缩放 + 按钮缩放
       ============================================================ */
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

        /* 兼容环境差异：优先用事件里的 x/y，退回 clientX/clientY */
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

        /* 边界钳制：平移量受缩放与卡片尺寸共同约束，
           永远不允许把网格拖出卡片之外 */
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
            // 以手势中心为锚点缩放：该点在地图上保持不动
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

        /* ---------- 触摸：单指拖拽 / 双指缩放 ---------- */
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
                    // 从单指切到双指，重新取基准，避免跳变
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

            /* 已经顶到边界时，顺着「压出去」方向的位移直接吃掉，
               避免手指继续外推产生的回弹抖动 */
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

        /* ---------- 鼠标（桌面调试）：按下拖动、滚轮缩放 ---------- */
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

        /* 拖动之后抑制紧随其后的 click，避免误触图钉；
           但缩放 / 地图 / 图钉这些控件自身的点击必须放行，
           否则拖过一次地图后按钮就点不动了 */
        stage.addEventListener('click', function (e) {
            if (!moved) return;
            if (e.target.closest && e.target.closest('.zoom-btn, .baidumap-btn, .pin-marker')) return;
            moved = false;
            e.preventDefault();
            e.stopPropagation();
        }, true);

        /* ---------- 缩放按钮 ---------- */
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

        /* ---------- 图钉：点击开合地址气泡 ---------- */
        if (pinMarker && bubble) {
            pinMarker.addEventListener('click', function (e) {
                e.stopPropagation();
                var hidden = bubble.classList.toggle('hidden');
                pinMarker.setAttribute('aria-expanded', hidden ? 'false' : 'true');
                MOD.haptic();
            });
        }

        /* 供自测脚本读取的调试快照（只读） */
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

    /* ============================================================
       「在百度地图中打开」
       地址与地图链接目前是占位内容（PC 端 pc/foot/wzdt.html 同样如此），
       用户填好真实地址后把 data-map-url 换成真实链接即可自动生效。
       ============================================================ */
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

    /* ============================================================
       地图操作说明按钮（右上角手型）
       ============================================================ */
    var infoBtn = document.getElementById('zoomInfo');
    if (infoBtn) {
        infoBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            MOD.haptic();
            MOD.toast('单指拖拽平移 · 双指捏合缩放', 2400);
        });
    }

    /* ============================================================
       点击复制（统一用 MOD.toast 反馈）
       ============================================================ */
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

        function done() {
            MOD.haptic();
            flashCopied(card);
            MOD.toast('已复制到剪贴板');
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

    /* ============================================================
       微信公众号卡片：没有可跳转的真实链接，点击给出提示即可，
       避免空 href="#" 造成无意义跳转
       ============================================================ */
    var noLinkCards = document.querySelectorAll('[data-nolink="wechat"]');
    Array.prototype.forEach.call(noLinkCards, function (card) {
        card.addEventListener('click', function (e) {
            e.preventDefault();
            MOD.haptic();
            MOD.toast('公众号：ZERO-SOURCE零源机构，可在微信内搜索');
        });
    });

    /* ============================================================
       进场动画
       ============================================================ */
    Array.prototype.forEach.call(document.querySelectorAll('.section'), function (n) {
        n.classList.add('reveal');
    });
    MOD.reveal();
})();
