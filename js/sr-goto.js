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
        month: 5,
        day: 15,
        nextMonth: 5,
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

        document.addEventListener('click', function (e) {
            var rect = document.documentElement.getBoundingClientRect();
            window.__SR.burstFireworkAround(
                Math.max(20, Math.min(e.clientX, rect.width - 20)),
                Math.max(60, Math.min(e.clientY, rect.height - 60))
            );
        });
    });
})();
