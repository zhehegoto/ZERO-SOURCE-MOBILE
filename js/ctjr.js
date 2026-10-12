/* ============================================================
   零源机构 · 移动端 / MOD
   ctjr.js — 传统节日总览
   节日数据与 PC 端 pc/js/ctjr.js 完全一致（名称 / 日期 / emoji / 文案）
   仅把链接指向移动端的 6 个节日沉浸页
   ============================================================ */
(function () {
    'use strict';

    var festivals = [
        {
            key: 'chunjie',
            name: '春节',
            date: '正月初一',
            emoji: '🧧',
            desc: '爆竹声中一岁除，春风送暖入屠苏。阖家团圆，万象更新。',
            link: '../festival/chunjie_0217.html'
        },
        {
            key: 'yuanxiao',
            name: '元宵节',
            date: '正月十五',
            emoji: '🏮',
            desc: '去年元夜时，花市灯如昼。赏灯猜谜，月圆人圆。',
            link: '../festival/yuanxiao_0303.html'
        },
        {
            key: 'qingming',
            name: '清明节',
            date: '公历四月五日',
            emoji: '🌧️',
            desc: '清明时节雨纷纷，路上行人欲断魂。慎终追远，踏青迎春。',
            link: '../festival/qingming_0405.html'
        },
        {
            key: 'duanwu',
            name: '端午节',
            date: '五月初五',
            emoji: '🐉',
            desc: '节分端午自谁言，万古传闻为屈原。龙舟竞渡，粽叶飘香。',
            link: '../festival/duanwu_0619.html'
        },
        {
            key: 'zhongqiu',
            name: '中秋节',
            date: '八月十五',
            emoji: '🌕',
            desc: '但愿人长久，千里共婵娟。花好月圆，思乡团圆。',
            link: '../festival/zhongqiu_0925.html'
        },
        {
            key: 'guoqing',
            name: '国庆节',
            date: '十月一日',
            emoji: '🇨🇳',
            desc: '国泰民安，繁荣昌盛。盛世华诞，举国同庆。',
            /* 与 PC 端 js/ctjr.js 保持一致。
               注：🇨🇳 是区域指示符，Windows 上会渲染成 "CN" 两个字母
               （PC 端同样如此），iOS / 安卓 上正常显示为国旗。
               若想让它在任何平台都显示成图形，把这里换成 '🎆' 即可
               （国庆页 guoqing_1001.html 里「盛世如歌」卡用的就是 🎆）。 */
            link: '../festival/guoqing_1001.html'
        }
    ];

    /* ==================== 渲染节日卡片 ==================== */
    function render() {
        var grid = document.getElementById('festivalGrid');
        if (!grid) return;

        grid.innerHTML = festivals.map(function (f) {
            return '<a class="festival-card ' + f.key + '" href="' + MOD.esc(f.link) + '"' +
                ' aria-label="传统节日：' + MOD.esc(f.name) + '（' + MOD.esc(f.date) + '）">' +
                '<span class="card-arrow" aria-hidden="true"><i class="fa fa-arrow-right"></i></span>' +
                '<span class="card-emoji" aria-hidden="true">' + f.emoji + '</span>' +
                '<span class="card-date">' + MOD.esc(f.date) + '</span>' +
                '<span class="card-name">' + MOD.esc(f.name) + '</span>' +
                '<span class="card-desc">' + MOD.esc(f.desc) + '</span>' +
                '</a>';
        }).join('');

        /* 整体进场：给网格加一个类即可，逐张延迟在 CSS 里配好 */
        requestAnimationFrame(function () {
            grid.classList.add('is-in');
        });

        /* 点击时给一点触感反馈 */
        Array.prototype.forEach.call(grid.querySelectorAll('.festival-card'), function (c) {
            c.addEventListener('click', function () { MOD.haptic(); });
        });
    }

    function init() {
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
