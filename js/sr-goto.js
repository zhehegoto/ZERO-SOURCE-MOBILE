/* ============================================================
   零源机构 · 移动端 sr/goto —— GOTO 生日彩蛋页配置（沉浸版）
   生日日期与 PC 版 pc/sr/goto/sr-goto.js 完全一致：6 月 15 日
   （PC 版：BIRTHDAY_MONTH = 5，BIRTHDAY_DAY = 15）
   本页独有：打字机祝福（#typewriterText / #blessTypewriter）、
             音量滑块（#volumeControl）、点击处放烟花、粒子连线颜色
   ============================================================ */
(function () {
    'use strict';

    function ready(fn) {
        if (window.__SR) { fn(); return; }
        var tries = 0;
        var t = setInterval(function () {
            tries++;
            if (window.__SR || tries > 200) {
                clearInterval(t);
                if (window.__SR) fn();
            }
        }, 25);
    }

    /* ---------- 打字机效果（照搬 PC 版 sr-goto.js 的实现） ---------- */
    function typewriterEffect(element, text, speed) {
        if (!element) return;
        var i = 0;
        element.innerText = '';
        (function type() {
            if (i < text.length) {
                element.innerText += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        })();
    }

    window.SRBirthday({
        who: 'GOTO',
        month: 5,          /* 6 月（0 基） */
        day: 15,
        nextMonth: 5,      /* PC 版跨年写法：new Date(year + 1, 5, 15) */
        nextDay: 15,
        musicSrc: '../../assets/music/sr.mp3',
        volume: 0.4,
        particleColors: ['#D8B4FE', '#8B5CF6', '#EC4899', '#FF8DA9', '#C084FC'],
        fireworkSpeed: 6.5,
        explosionCount: 60,
        maxFireworks: 18,
        burstCount: 5,
        entryFireworks: 6,
        fireworkInterval: 800
    });

    ready(function () {
        var card = document.getElementById('flipCard');
        var typeText = '🎂 生 日 快 乐 🎂';
        var blessText = '愿你的前路如星辰璀璨，步履皆坦途\n破风前行，不负热爱\n「Zero · 零号」\n🎂 永远热烈 永远闪耀 🎂';
        var done = false;

        /* 点击卡片：翻转 + 打字机祝福 + 卡片周围连爆烟花 */
        if (card) {
            card.addEventListener('click', function () {
                if (done) return;
                done = true;

                typewriterEffect(document.getElementById('typewriterText'), typeText, 80);
                setTimeout(function () {
                    typewriterEffect(document.getElementById('blessTypewriter'), blessText, 40);
                }, 1000);
            });
        }

        /* 点击页面任意处：从底部飞向点击位置（PC 版同款交互） */
        document.addEventListener('click', function (e) {
            var rect = document.documentElement.getBoundingClientRect();
            window.__SR.burstFireworkAround(
                Math.max(20, Math.min(e.clientX, rect.width - 20)),
                Math.max(60, Math.min(e.clientY, rect.height - 60))
            );
        });
    });
})();
