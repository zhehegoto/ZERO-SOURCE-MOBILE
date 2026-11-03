(function () {
    'use strict';

    var MAX_IMAGE = 118;
    var PAGE_SIZE = 15;

    var IMG_DIR = '../assets/images/zerozhandui/';

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

    function nearViewport(rect) {
        return rect.bottom > -300 && rect.top < window.innerHeight + 300;
    }

    var grid = null;
    var row = null;
    var cards = [];
    var page = 0;
    var deckDone = false;

    var loadMoreBtn = null;
    var loadingIndicator = null;

    var viewer = null;
    var stageEl = null;
    var topNumEl = null;
    var captionTitleEl = null;
    var captionIndexEl = null;
    var slides = [];
    var lifted = [];
    var current = -1;
    var isOpen = false;
    var pushed = false;
    var ignorePop = false;
    var stateNonce = null;
    var syncTimer = null;
    var scrollTimer = null;
    var lastScrollPos = -1;
    var fadeTimer = null;

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

    function createPhoto(index) {
        var num = MAX_IMAGE - index;
        var card = document.createElement('div');
        card.className = 'gallery-photo photo-enter';
        card.dataset.index = String(index);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', '查看照片：' + photoName(num));
        card.style.animationDelay = (index % PAGE_SIZE) * 0.045 + 's';

        var shot = document.createElement('div');
        shot.className = 'photo-shot has-media is-loading';

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
            '' +
            '<span>正在翻找这张碎片...</span>';
        fallback._name = photoName(num);

        var notFound = document.createElement('div');
        notFound.className = 'preview-slide-fallback';
        notFound.innerHTML =
            '' +
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

            if (slide._fallback && slide._fallback.parentNode === box) {
                box.replaceChild(slide._notFound, slide._fallback);
            } else if (!box.querySelector('.preview-slide-fallback')) {
                box.appendChild(slide._notFound);
            }
            box.classList.remove('is-loading');
            box.classList.add('is-media-broken');
        });
        box.insertBefore(img, box.firstChild);
        box.appendChild(slide._fallback);
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

        [current - 1, current + 1].forEach(function (i) {
            if (i >= 0 && i < slides.length) ensureSlideImage(slides[i]);
        });
    }

    function onStageScroll() {
        if (!isOpen || !stageEl || !slides.length) return;

        var w = stageEl.clientWidth || 1;
        var pos = stageEl.scrollLeft / w;
        var idx = Math.round(pos);

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
            if (tries > 5) {
                stageEl.scrollLeft = current * stageEl.clientWidth;
                return;
            }
            syncTimer = window.setTimeout(attempt, settleMs);
        }

        syncTimer = window.setTimeout(attempt, settleMs);
    }

    function setStageIndex(index, smooth) {
        if (!stageEl) return;
        current = wrapIndex(index);

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

            if (!card._origin) {
                card._origin = { parent: card.parentNode, next: card.nextSibling };
            }

            while (shot.firstChild) box.appendChild(shot.firstChild);

            var img = box.querySelector('img');

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

    function restoreCards() {
        for (var i = 0; i < lifted.length; i++) {
            var card = lifted[i];
            var origin = card._origin;
            if (!origin || !origin.parent) continue;

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

    function pushHistory() {
        pushed = false;
        ignorePop = false;
        stateNonce = 'modGallery_' + Date.now().toString(36) +
            Math.random().toString(36).slice(2, 7);
        try {
            history.pushState({ modGallery: stateNonce }, '');
            pushed = true;
        } catch (e) {
            stateNonce = null;
        }
    }

    function openViewer(index) {
        if (!viewer || isOpen) return;
        index = (index == null) ? 0 : wrapIndex(index);

        isOpen = true;
        buildViewerStage();

        window.clearTimeout(fadeTimer);
        viewer.classList.remove('is-hidden');
        viewer.classList.add('open');
        viewer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');
        pushHistory();

        liftCards();

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
        document.body.classList.remove('no-scroll');

        window.clearTimeout(fadeTimer);
        fadeTimer = window.setTimeout(function () {
            if (!isOpen && viewer) viewer.classList.add('is-hidden');
        }, 340);

        restoreCards();
        current = -1;

        if (!fromPop && pushed && stateNonce && history.state &&
            history.state.modGallery === stateNonce) {
            ignorePop = true;
            try {
                history.back();
            } catch (e) {  }
        }
        pushed = false;
    }

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

        stageEl.addEventListener('scroll', onStageScroll, { passive: true });

        window.addEventListener('popstate', function () {
            if (!isOpen) return;
            if (ignorePop) { ignorePop = false; return; }

            if (document.querySelector('.sheet.open')) return;
            closeViewer(true);
        });

        window.addEventListener('keydown', function (e) {
            if (!isOpen) return;
            if (e.key === 'Escape') closeViewer(false);
            else if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
        });

        window.addEventListener('resize', function () {
            if (!isOpen || !stageEl) return;
            stageEl.scrollLeft = current * stageEl.clientWidth;
        });
    }

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
