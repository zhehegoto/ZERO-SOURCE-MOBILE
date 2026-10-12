/* ============================================================
   零源机构 · 移动端 / MOD
   qxc.js — 群相册：分批照片网格 + 加载更多 + 全屏滑动预览
   数据与生成逻辑与 PC 端 pc/js/qxc.js 保持一致
   （总数 118、每批 15 张、碎片编号 = 118 - 下标、序号环绕）
   ============================================================ */
(function () {
    'use strict';

    /* ==================== 与 PC 端一致的常量 ==================== */
    var MAX_IMAGE = 118;        // 照片总数（PC 端页面同样写 118）
    var PAGE_SIZE = 15;         // 每批加载数量
    // 与 PC 端 pc/js/qxc.js 的 '../images/zerozhandui/照片 (N).jpeg' 对应：
    // qxc 页在 mod/body/ 下，所以前缀是 ../assets/…（空格与括号保留，浏览器自动编码）
    var IMG_DIR = '../assets/images/zerozhandui/';

    /* 照片文件目前还没有放进 mod/assets/images/zerozhandui/
       （PC 端同级目录同样是空的，所以 PC 版群相册也是全图 404）。
       置为 false 可以完全跳过图片请求、只显示渐变占位。 */
    var HAS_IMAGE_FILES = true;

    function photoSrc(num) {
        return IMG_DIR + '照片 (' + num + ').jpeg';
    }

    function photoName(num) {
        return '记忆碎片 #' + num;
    }

    function wrapIndex(i) {
        return ((i % MAX_IMAGE) + MAX_IMAGE) % MAX_IMAGE;
    }

    /* 元素是否在（含余量的）可视范围内 —— 预览器按需预载用 */
    function nearViewport(rect) {
        return rect.bottom > -300 && rect.top < window.innerHeight + 300;
    }

    /* ==================== 网格状态 ==================== */
    var grid = null;
    var row = null;             // 当前正在填的行；已满的行会冻结高度
    var cards = [];             // 已生成的全部卡片（对应 PC 端 loadedPhotos）
    var page = 0;               // 已加载批次数
    var deckDone = false;       // 118 张是否已全部生成

    var loadMoreBtn = null;
    var loadingIndicator = null;

    /* ==================== 预览器状态 ==================== */
    var viewer = null;
    var stageEl = null;
    var topNumEl = null;
    var captionTitleEl = null;
    var captionIndexEl = null;
    var slides = [];
    var lifted = [];            // 打开预览时被搬进预览器的卡片（关闭时复位）
    var current = -1;
    var isOpen = false;
    var pushed = false;         // 是否往历史里压了记录
    var ignorePop = false;      // 自己 back() 关闭时跳过一次 popstate
    var stateNonce = null;
    var syncTimer = null;
    var scrollTimer = null;
    var lastScrollPos = -1;
    var fadeTimer = null;

    /* ============================================================
       1. 2 列紧凑网格
       PC 端是三列瀑布流，移动端固定 2 列（宽度再小也不退化成 3 列）。
       分批加载时新照片追加到「当前行」；当行高会变化时先冻结旧行高度，
       这样后加载的照片落在原来的两列下面，不会把已读内容顶下去。
       ============================================================ */
    function startRow() {
        row = document.createElement('div');
        row.className = 'photo-row';
        row._count = 0;
        grid.appendChild(row);
    }

    function freezeRow(r) {
        if (!r || !r.childElementCount) return;
        r._h = Math.round(r.getBoundingClientRect().height);
        r.style.height = r._h + 'px';
        row = null;
    }

    function renderNext() {
        if (!grid) return;
        for (var i = 0; i < cards.length; i++) {
            var card = cards[i];
            if (card._placed) continue;
            if (!row || row._count >= 8) {
                freezeRow(row);
                startRow();
            }
            row.appendChild(card);
            row._count++;
            card._placed = true;
        }
    }

    /* ============================================================
       2. 生成照片卡片（与 PC 端同构）
       ============================================================ */
    function createPhoto(index) {
        var num = MAX_IMAGE - index;        // 与 PC 端一致：碎片编号从 118 递减
        var card = document.createElement('div');
        card.className = 'gallery-photo photo-enter';
        card.dataset.index = String(index);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', '查看照片：' + photoName(num));
        card.style.animationDelay = (index % PAGE_SIZE) * 0.045 + 's';

        var shot = document.createElement('div');
        shot.className = 'photo-shot has-media is-loading';

        // 照片还没放进目录时也走同一条路径：加载失败 → 渐变占位 + 图标，
        // 不会出现破图、白框或塌陷
        var img = document.createElement('img');
        img.src = photoSrc(num);
        img.alt = photoName(num);
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', function () {
            shot.classList.remove('is-loading');
            shot.classList.add('is-loaded');
        });
        img.addEventListener('error', function () {
            // 渐变占位 + 图标，绝不会留白框
            shot.classList.add('is-broken', 'is-media-broken');
        });
        shot.appendChild(img);

        var label = document.createElement('span');
        label.className = 'photo-label';
        label.textContent = '碎片 #' + num;

        card.appendChild(shot);
        card.appendChild(label);

        function open() { openViewer(index); }
        card.addEventListener('click', open);
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });

        return card;
    }

    /* ============================================================
       3. 分批加载（PAGE_SIZE / MAX_IMAGE 逻辑与 PC 端一致）
       ============================================================ */
    function loadBatch() {
        if (deckDone || !grid) return;

        var start = page * PAGE_SIZE;
        var end = Math.min(start + PAGE_SIZE, MAX_IMAGE);

        for (var i = start; i < end; i++) {
            cards.push(createPhoto(i));
        }
        page++;
        renderNext();
        updateLoadMore();

        if (page * PAGE_SIZE >= MAX_IMAGE) deckDone = true;
    }

    function updateLoadMore() {
        if (!loadMoreBtn) return;
        var done = page * PAGE_SIZE >= MAX_IMAGE;
        loadMoreBtn.hidden = done;
        if (done && loadingIndicator) loadingIndicator.hidden = true;
    }

    /* ============================================================
       4. 全屏预览器（横向 scroll-snap 滑动切换）
       ============================================================ */
    function buildSlide(index) {
        var num = MAX_IMAGE - index;
        var slide = document.createElement('div');
        slide.className = 'preview-slide';
        slide.dataset.index = String(index);

        var box = document.createElement('div');
        box.className = 'preview-img-box is-loading';

        var fallback = document.createElement('div');
        fallback.className = 'preview-slide-fallback is-loading';
        fallback.innerHTML =
            '<i class="fa fa-spinner fa-spin" aria-hidden="true"></i>' +
            '<span>正在翻找这张碎片...</span>';
        fallback._name = photoName(num);

        var notFound = document.createElement('div');
        notFound.className = 'preview-slide-fallback';
        notFound.innerHTML =
            '<i class="fa fa-image" aria-hidden="true"></i>' +
            '<span>这张碎片找不到了</span>' +
            '<span class="fallback-name">' + photoName(num) + '</span>';

        slide.appendChild(box);
        slide._box = box;
        slide._fallback = fallback;
        slide._notFound = notFound;
        slide._requested = false;

        if (HAS_IMAGE_FILES) {
            ensureSlideImage(slide);
        } else {
            box.appendChild(notFound);
        }

        return slide;
    }

    /* 每张只请求一次；失败就显示渐变占位 + 图标 + 序号 */
    function ensureSlideImage(slide) {
        if (!HAS_IMAGE_FILES || slide._requested) return;
        slide._requested = true;

        var index = parseInt(slide.dataset.index, 10);
        var box = slide._box;
        var img = document.createElement('img');
        img.alt = photoName(MAX_IMAGE - index);
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('load', function () {
            box.classList.remove('is-loading');
            box.classList.add('is-loaded');
            removeIfChild(box, slide._fallback);
        });
        img.addEventListener('error', function () {
            // 渐变占位（预览器底色）+ 图标 + 碎片序号，不留白框
            if (slide._fallback && slide._fallback.parentNode === box) {
                box.replaceChild(slide._notFound, slide._fallback);
            } else if (!box.querySelector('.preview-slide-fallback')) {
                box.appendChild(slide._notFound);
            }
            box.classList.remove('is-loading');
            box.classList.add('is-media-broken');
        });
        box.insertBefore(img, box.firstChild);
        box.appendChild(slide._fallback);   // 加载中的占位；加载完成或失败时被替换/移除
        img.src = photoSrc(MAX_IMAGE - index);
    }

    function removeIfChild(parent, node) {
        if (node && node.parentNode === parent) parent.removeChild(node);
    }

    function buildViewerStage() {
        stageEl.innerHTML = '';
        slides = [];
        for (var i = 0; i < MAX_IMAGE; i++) {
            var s = buildSlide(i);
            slides.push(s);
            stageEl.appendChild(s);
        }
    }

    function updateViewer() {
        if (current < 0) return;
        var text = (current + 1) + ' / ' + MAX_IMAGE;
        if (topNumEl) topNumEl.textContent = text;
        if (captionIndexEl) captionIndexEl.textContent = text;
        if (captionTitleEl) captionTitleEl.textContent = photoName(MAX_IMAGE - current);

        // 预载相邻的一张
        [current - 1, current + 1].forEach(function (i) {
            if (i >= 0 && i < slides.length) ensureSlideImage(slides[i]);
        });
    }

    /* 状态对齐：
       1) 已经贴住某一页（落在吸附点上）→ 立即对齐序号，不用等；
       2) 否则说明还在滑动/吸附动画中，等位置连续两次不动了再落位。
       吸附动画期间滚动事件可能持续几秒，所以「停稳」用位置不变判断，
       不用固定去抖时间（会被持续到达的事件一直重置）。 */
    function onStageScroll() {
        if (!isOpen || !stageEl || !slides.length) return;

        var w = stageEl.clientWidth || 1;
        var pos = stageEl.scrollLeft / w;
        var idx = Math.round(pos);

        // 贴在某一页上：立刻同步
        if (Math.abs(pos - idx) < 0.01) {
            if (idx < 0) idx = 0;
            if (idx > slides.length - 1) idx = slides.length - 1;
            if (idx !== current) {
                current = idx;
                updateViewer();
            }
            lastScrollPos = stageEl.scrollLeft;
            window.clearTimeout(scrollTimer);
            return;
        }

        var raw = stageEl.scrollLeft;
        if (raw === lastScrollPos) {
            window.clearTimeout(scrollTimer);
            scrollTimer = window.setTimeout(settleIndex, 90);
            return;
        }
        lastScrollPos = raw;
        window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(onStageScroll, 90);
    }

    /* 停在两张之间时的兜底：把它送回最近的一页 */
    function settleIndex() {
        if (!isOpen || !stageEl || !slides.length) return;

        var w = stageEl.clientWidth || 1;
        var idx = Math.round(stageEl.scrollLeft / w);
        if (idx < 0) idx = 0;
        if (idx > slides.length - 1) idx = slides.length - 1;
        if (Math.abs(stageEl.scrollLeft / w - idx) > 0.01) {
            stageEl.scrollLeft = idx * w;
            return;
        }
        if (idx !== current) {
            current = idx;
            updateViewer();
        }
    }

    /* 与真实滚动位置对齐。
       平滑滚动还在进行时（位置与 current 不符）不抢状态，
       等它落位；若平滑滚动没能生效（部分环境会忽略，
       例如后台标签页），则在超时后直接落位，保证
       「序号 / 标题 / 画面」三者永远一致。 */
    function syncStage(settleMs) {
        if (!isOpen) return;
        var tries = 0;
        window.clearTimeout(syncTimer);

        function attempt() {
            if (!isOpen || !stageEl) return;
            if (Math.abs(stageEl.scrollLeft - current * stageEl.clientWidth) <= 2) {
                settleIndex();
                return;
            }
            tries++;
            if (tries > 5) {                 // 平滑滚动没生效，直接落位
                stageEl.scrollLeft = current * stageEl.clientWidth;
                return;
            }
            syncTimer = window.setTimeout(attempt, settleMs);
        }

        syncTimer = window.setTimeout(attempt, settleMs);
    }

    function setStageIndex(index, smooth) {
        if (!stageEl) return;
        current = wrapIndex(index);        // 与 PC 端一致：序号环绕
        // 序号 / 标题立即更新，视觉位置随后落位（两者最终一致）
        updateViewer();
        try {
            stageEl.scrollTo({
                left: current * stageEl.clientWidth,
                behavior: smooth ? 'smooth' : 'auto'
            });
        } catch (e) {
            stageEl.scrollLeft = current * stageEl.clientWidth;
        }
        syncStage(60);
    }

    function next() { setStageIndex(current + 1, true); }

    function prev() { setStageIndex(current - 1, true); }

    function findCard(index) {
        for (var i = 0; i < cards.length; i++) {
            if (parseInt(cards[i].dataset.index, 10) === index) return cards[i];
        }
        return null;
    }

    /* 打开预览：把网格里已经生成的卡片搬进预览器复用同一个 DOM，
       图片不会重新请求，也不会出现“网格与预览各留一份”的闪动。
       未生成的批次（尚未点“拾起更多记忆”）保持占位，不影响滑动。 */
    function liftCards() {
        lifted = [];
        for (var i = 0; i < slides.length; i++) {
            var card = findCard(i);
            if (!card) continue;

            var shot = card.querySelector('.photo-shot');
            if (!shot) continue;

            var slide = slides[i];
            var box = slide._box;

            card._placed = true;
            // 只在第一次记录原位：预览器可能被反复开关，
            // 每次都覆盖的话卡片就回不到原来那一格了
            if (!card._origin) {
                card._origin = { parent: card.parentNode, next: card.nextSibling };
            }

            // 把卡片里现有的内容（<img> 或渐变占位）搬进预览器
            while (shot.firstChild) box.appendChild(shot.firstChild);

            var img = box.querySelector('img');
            // 还没请求过（超出已加载批次）：现在才去请求
            if (!img && !box.querySelector('.preview-slide-fallback')) {
                ensureSlideImage(slide);
                img = box.querySelector('img');
            }
            if (img) rebindPreviewImage(slide, img);

            card._shot = shot;
            card.remove();
            lifted.push(card);
        }
    }

    /* 卡片被搬进预览器后重新挂接图片事件：
       失败时换成「找不到」占位（渐变底 + 图标 + 碎片序号） */
    function rebindPreviewImage(slide, img) {
        var box = slide._box;
        img.onerror = null;
        img.addEventListener('error', function () {
            if (slide._fallback && slide._fallback.parentNode === box) {
                box.replaceChild(slide._notFound, slide._fallback);
            } else if (!box.querySelector('.preview-slide-fallback')) {
                box.appendChild(slide._notFound);
            }
            box.classList.remove('is-loading');
            box.classList.add('is-media-broken');
        });
    }

    /* 关闭预览：把卡片放回原位（连同卡片里的图片） */
    function restoreCards() {
        for (var i = 0; i < lifted.length; i++) {
            var card = lifted[i];
            var origin = card._origin;
            if (!origin || !origin.parent) continue;

            // 图片/占位在预览器里，先搬回卡片自己的 .photo-shot
            var box = slides.length ? slides[i]._box : null;
            if (card._shot && box) {
                for (var k = box.childNodes.length - 1; k >= 0; k--) {
                    card._shot.appendChild(box.childNodes[k]);
                }
            }

            if (origin.next && origin.next.parentNode === origin.parent) {
                origin.parent.insertBefore(card, origin.next);
            } else {
                origin.parent.appendChild(card);
            }
        }
        lifted = [];
    }

    /* 打开后分帧预载滚动附近的图片（每张只请求一次） */
    function stepPreload() {
        var i = 0;

        function step() {
            if (!isOpen) return;
            var budget = 4;
            while (i < slides.length && budget > 0) {
                var slide = slides[i];
                if (nearViewport(slide.getBoundingClientRect())) {
                    ensureSlideImage(slide);
                    budget--;
                }
                i++;
            }
            if (i < slides.length) window.setTimeout(step, 90);
        }

        window.setTimeout(step, 120);
    }

    /* ---------- 历史记录：支持安卓返回键关闭 ---------- */
    function pushHistory() {
        pushed = false;
        ignorePop = false;
        stateNonce = 'modGallery_' + Date.now().toString(36) +
            Math.random().toString(36).slice(2, 7);
        try {
            history.pushState({ modGallery: stateNonce }, '');
            pushed = true;
        } catch (e) {
            stateNonce = null;   // 压栈失败就不要自作主张 back()
        }
    }

    function openViewer(index) {
        if (!viewer || isOpen) return;
        index = (index == null) ? 0 : wrapIndex(index);

        isOpen = true;
        buildViewerStage();

        window.clearTimeout(fadeTimer);
        viewer.classList.remove('is-hidden');
        viewer.classList.add('open');   // CSS 中的 .open 立即置为 visible
        viewer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');   // 锁定页面滚动
        pushHistory();

        liftCards();

        // 先摆好位置再显示，避免打开瞬间的横向滑动
        current = index;
        lastScrollPos = -1;
        stageEl.scrollLeft = index * stageEl.clientWidth;
        updateViewer();
        stepPreload();

        if (window.MOD) window.MOD.haptic();
    }

    function closeViewer(fromPop) {
        if (!isOpen || !viewer) return;
        isOpen = false;
        window.clearTimeout(syncTimer);
        window.clearTimeout(scrollTimer);

        viewer.classList.remove('open');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');   // 恢复页面滚动

        // 淡出结束后再真正隐藏（不依赖 visibility 过渡，行为更可控）
        window.clearTimeout(fadeTimer);
        fadeTimer = window.setTimeout(function () {
            if (!isOpen && viewer) viewer.classList.add('is-hidden');
        }, 340);

        restoreCards();
        current = -1;

        // 自己触发的关闭：抹掉压入的历史记录，并跳过一次 popstate
        if (!fromPop && pushed && stateNonce && history.state &&
            history.state.modGallery === stateNonce) {
            ignorePop = true;
            try {
                history.back();
            } catch (e) { /* 忽略 */ }
        }
        pushed = false;
    }

    /* ---------- 事件绑定 ---------- */
    function bindViewerEvents() {
        viewer = document.getElementById('immersivePreview');
        if (!viewer) return;

        stageEl = document.getElementById('previewStage');
        topNumEl = document.getElementById('previewTopNum');
        captionTitleEl = document.getElementById('captionTitle');
        captionIndexEl = document.getElementById('captionIndex');

        document.getElementById('previewClose').addEventListener('click', function () {
            closeViewer(false);
        });
        document.getElementById('previewBg').addEventListener('click', function () {
            closeViewer(false);
        });

        // 手指滑动 / 吸附落位后对齐序号与标题
        stageEl.addEventListener('scroll', onStageScroll, { passive: true });

        // 安卓返回键 / 浏览器返回
        window.addEventListener('popstate', function () {
            if (!isOpen) return;
            if (ignorePop) { ignorePop = false; return; }
            // 其它弹层（问题反馈 / 更多面板）压在自己的历史记录上，
            // 这一跳归它处理，预览器不跟着关
            if (document.querySelector('.sheet.open')) return;
            closeViewer(true);
        });

        window.addEventListener('keydown', function (e) {
            if (!isOpen) return;
            if (e.key === 'Escape') closeViewer(false);
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
        });

        // 尺寸变化：重新对齐当前这一张
        window.addEventListener('resize', function () {
            if (!isOpen || !stageEl) return;
            stageEl.scrollLeft = current * stageEl.clientWidth;
        });
    }

    /* ============================================================
       5. 加载更多 / 尺寸变化
       ============================================================ */
    function bindControls() {
        loadMoreBtn = document.getElementById('loadMoreBtn');
        loadingIndicator = document.getElementById('loadingIndicator');

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', function () {
                if (loadMoreBtn.disabled) return;
                if (window.MOD) window.MOD.haptic();
                loadMoreBtn.disabled = true;
                if (loadingIndicator) loadingIndicator.hidden = false;
                window.setTimeout(function () {
                    loadBatch();
                    loadMoreBtn.disabled = false;
                    if (loadingIndicator) loadingIndicator.hidden = true;
                }, 500);
            });
        }

        // 尺寸变化时解冻行高，让两列重新按新列宽铺排
        var resizeTimer = null;
        window.addEventListener('resize', function () {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                var rows = grid ? grid.querySelectorAll('.photo-row') : [];
                Array.prototype.forEach.call(rows, function (r) {
                    r.style.height = '';
                    r._h = 0;
                });
            }, 200);
        });
    }

    /* ============================================================
       6. 初始化
       ============================================================ */
    function init() {
        grid = document.getElementById('photoGrid');
        if (!grid) return;
        bindControls();
        bindViewerEvents();
        loadBatch();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* 供调试 / 自测使用 */
    window.MODGallery = {
        total: MAX_IMAGE,
        pageSize: PAGE_SIZE,
        hasImages: HAS_IMAGE_FILES,
        loaded: function () { return cards.length; },
        open: function (i) { openViewer(i); },
        close: function () { closeViewer(false); },
        next: next,
        prev: prev,
        index: function () { return current; },
        isOpen: function () { return isOpen; },
        bodyLocked: function () {
            return document.body.classList.contains('no-scroll');
        },
        loadBatch: loadBatch
    };
})();
