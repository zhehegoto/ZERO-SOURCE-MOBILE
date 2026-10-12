/* ============================================================
   零源机构 · 移动端 sr/liu —— ECH0 生日彩蛋页配置
   生日日期与 PC 版 pc/sr/liu/sr.js 完全一致：1 月 10 日
   跨年分支也照抄 PC 版原文（new Date(year + 1, 0, 10)）
   ============================================================ */
(function () {
    'use strict';

    window.SRBirthday({
        who: 'ECH0',
        month: 0,          /* 1 月（0 基） */
        day: 10,
        nextMonth: 0,      /* PC 版跨年写死 0（1 月） */
        nextDay: 10,
        musicSrc: '../../assets/music/sr.mp3',
        volume: 0.4,
        particleColors: ['#FFB7C5', '#FF8DA9', '#D583FF', '#F6A7C1', '#FFE6F0'],
        fireworkSpeed: 5.5,
        explosionCount: 48,
        maxFireworks: 14,
        burstCount: 3,
        entryFireworks: 4,
        fireworkInterval: 1000
    });
})();
