/* ============================================================
   零源机构 · 移动端 / 元宵节 · 正月十五
   yuanxiao_0303.js — 浮动光斑背景 + 猜灯谜
   对应 PC 端 pc/festival/js/yuanxiao_0303.js，移动端改写要点：
   1. 粒子数量随屏宽线性削减（320px≈27，768px≈64，下限 14 / 上限 72）
   2. DPR 上限 2
   3. 页面隐藏时暂停 requestAnimationFrame
   4. 去掉 PC 端的鼠标 3D 倾斜（移动端无悬停）
   ============================================================ */
(function () {
    'use strict';

    var canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0;
    var H = 0;
    var dpr = 1;

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    /* 粒子数量按屏宽削减：320px→27 个，768px→64 个 */
    function density(w, divisor, lo, hi) {
        return Math.max(lo, Math.min(hi, Math.round(w / divisor)));
    }

    /* ============================================================
       1. 背景浮动光斑（暖橙金）
       ============================================================ */
    var orbs = [];

    function Orb() {
        this.reset(true);
    }

    Orb.prototype.reset = function (first) {
        this.x = rand(0, W);
        this.y = first ? rand(0, H) : H + 40;
        this.radius = rand(24, 92);
        this.speed = rand(0.25, 0.85);
        this.drift = rand(-0.28, 0.28);
        this.hue = Math.random() > 0.5 ? 30 : 45;
        this.alpha = rand(0.04, 0.1);
    };

    Orb.prototype.update = function () {
        this.y -= this.speed;
        this.x += this.drift;
        if (this.y < -this.radius * 2 || this.x < -this.radius * 2 || this.x > W + this.radius * 2) {
            this.reset(false);
        }
    };

    Orb.prototype.draw = function () {
        var g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        g.addColorStop(0, 'hsla(' + this.hue + ', 95%, 60%, ' + this.alpha + ')');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    };

    function buildOrbs() {
        var n = density(W, 12, 14, 72);
        orbs = [];
        for (var i = 0; i < n; i++) orbs.push(new Orb());
    }

    /* ============================================================
       2. 渲染循环（隐藏时暂停 rAF）
       ============================================================ */
    var rafId = null;
    var running = false;

    function frame() {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < orbs.length; i++) {
            orbs[i].update();
            orbs[i].draw();
        }
        rafId = requestAnimationFrame(frame);
    }

    function start() {
        if (running) return;
        running = true;
        rafId = requestAnimationFrame(frame);
    }

    function stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else start();
    });

    /* ============================================================
       3. 画布尺寸（DPR 上限 2）
       ============================================================ */
    var lastW = 0;

    function onResize() {
        W = window.innerWidth;
        H = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (Math.abs(W - lastW) > 80 || !orbs.length) {
            lastW = W;
            buildOrbs();
        }
    }

    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () {
        setTimeout(onResize, 220);
    });

    start();

    /* ============================================================
       4. 猜灯谜（12 题，文案与 PC 端逐字一致）
       ============================================================ */
    var riddles = [
        { q: '千条线，万条线，掉到水里看不见。', a: '谜底：雨' },
        { q: '身穿绿衣裳，肚里水汪汪，生的子儿多，个个黑脸膛。', a: '谜底：西瓜' },
        { q: '像猫不是猫，身穿皮袄花。山中称霸王，寅年它当家。', a: '谜底：老虎' },
        { q: '一位公公精神好，从早到晚不睡觉，身体虽小力气大，千人万人推不倒。', a: '谜底：不倒翁' },
        { q: '有面没有口，有脚没有手，虽有四只脚，自己不会走。', a: '谜底：桌子' },
        { q: '白嫩小宝宝，洗澡吹泡泡，洗洗身体小，再洗不见了。', a: '谜底：香皂' },
        { q: '身穿花衣裳，飞在花丛中，采蜜又授粉，功劳真不小。', a: '谜底：蜜蜂' },
        { q: '一个黑孩，从不开口，要是开口，掉出舌头。', a: '谜底：瓜子' },
        { q: '人脱衣服，它穿衣服，人脱帽子，它戴帽子。', a: '谜底：衣帽架' },
        { q: '弟兄七八个，围着柱子坐，大家一分手，衣服就扯破。', a: '谜底：大蒜' },
        { q: '独木造高楼，没瓦没砖头，人在水下走，水在人上流。', a: '谜底：雨伞' },
        { q: '正月十五闹花灯，家家户户笑盈盈。打一节日。', a: '谜底：元宵节' }
    ];

    var currentIdx = 0;
    var answerShown = false;

    var riddleQuestion = document.getElementById('riddleQuestion');
    var riddleAnswer = document.getElementById('riddleAnswer');
    var riddleCount = document.getElementById('riddleCount');
    var riddleCard = document.getElementById('riddleCard');
    var showAnswerBtn = document.getElementById('showAnswerBtn');
    var nextBtn = document.getElementById('nextRiddleBtn');

    function showRiddle(idx) {
        currentIdx = idx;
        riddleQuestion.textContent = riddles[idx].q;
        riddleAnswer.textContent = riddles[idx].a;
        riddleAnswer.style.display = 'none';
        riddleAnswer.classList.remove('on');
        answerShown = false;
        riddleCount.textContent = (idx + 1) + ' / ' + riddles.length;
        showAnswerBtn.textContent = '显示谜底';
        riddleCard.setAttribute('aria-label', '点击查看第 ' + (idx + 1) + ' 题谜底');
    }

    function toggleAnswer() {
        answerShown = !answerShown;
        riddleAnswer.style.display = answerShown ? 'block' : 'none';
        riddleAnswer.classList.toggle('on', answerShown);
        showAnswerBtn.textContent = answerShown ? '隐藏谜底' : '显示谜底';
        if (window.MOD) window.MOD.haptic(8);
    }

    if (riddleQuestion && riddleAnswer && riddleCount && riddleCard && showAnswerBtn && nextBtn) {
        showAnswerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleAnswer();
        });

        nextBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            showRiddle((currentIdx + 1) % riddles.length);
            if (window.MOD) window.MOD.haptic(10);
        });

        riddleCard.addEventListener('click', toggleAnswer);
        riddleCard.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAnswer();
            }
        });

        showRiddle(0);
    }
})();
