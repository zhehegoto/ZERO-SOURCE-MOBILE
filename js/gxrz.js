(function () {
    'use strict';

    var versions = [
        {
            version: 'v1.1', date: '2026年10月28日', type: '重大更新', latest: true,
            items: [
                { icon: 'zap', title: '字体全面瘦身', descs: ['原先 550 KB 的字体样式（内含 508 段 @font-face）精简到 5.6 KB', '92 个中文艺术字分片合并并按本站用字子集化，合成 1 个 102 KB 文件', '首页首屏从 1991 KB 降到 490 KB，请求数从 33 个降到 11 个'] },
                { icon: 'refresh', title: '中文改用系统字体', descs: ['中文正文不再下载网络字库，直接调用系统字体（iOS 苹方 / 安卓思源 / Windows 微软雅黑）', '英文艺术字 Syne 与中文艺术字 ZCOOL 仍然保留，首页大标题观感不变', '标题与正文的视觉层级不变，只有中文字形随系统略有差异'] },
                { icon: 'remove', title: '图标全部移除', descs: ['原来图标依赖一个样式表加一个 77 KB 字体文件，而全站只用到 68 个图标', '现全部去掉：页面以文字标签表达，不再有任何图标字体请求', '底部标签栏改为纯文字，按钮改为「返回 / 更多 / 反馈 / 顶部」等中文'] },
                { icon: 'refresh', title: '图片加载优化', descs: ['动态卡片图片统一启用懒加载与异步解码', '不再使用 1.5 MB 的重复大图，改用压缩后的同款 JPG', '首屏只加载真正可见的图片'] },
                { icon: 'plus', title: '清理无用文件', descs: ['删除 font-awesome 图标目录（7.4 MB、576 个文件）', '删除已不再引用的 fonts-google.css 与 1.5 MB 的重复大图', '站点体积从 12.8 MB 降到 3.4 MB'] },
                { icon: 'plus', title: '内容与 PC 端 v4.7 / v4.8 对齐', descs: ['网站地图「新浪微博」更新为 GitHub，状态改为运行中', '微信公众号卡片改为点击复制账号名', '官方网站卡片增加「已在该网站」提示，不再重复跳转'] }
            ]
        },
        {
            version: 'v1.0', date: '2026年10月12日', type: '重大更新',
			highlight: '网站基础版本发布，根据PC端V4.7核心架构搭建与优化',
            items: [
                { icon: 'refresh', title: '移动端同步 PC 端 v4.7 修复', descs: ['节日页面统一接入公共样式与页脚脚本', '隐私政策 / 使用条款的联系方式统一指向「网站地图」', '更新日志的运行天数改由统一入口计算', '清理不再执行的冗余代码与重复事件绑定'] },
                { icon: 'fix', title: '更新日志运行天数纠正', descs: ['运行天数统一由公共配置提供，修复脚本执行顺序导致的日期读取错误'] },
                { icon: 'fix', title: '首页数据面板数字不动', descs: ['计数动画在内容不可见时就播完了，改为进入视口才开始计数'] },
                { icon: 'fix', title: '时间轴页面内容被裁切', descs: ['每屏写死一屏高，矮屏下末尾的里程碑卡片被裁掉且无法滚动查看', '改为按内容自适应高度'] },
                { icon: 'plus', title: '微信公众号一键复制', descs: ['微信没有可用的公开跳转链接，改为点击复制账号名', '复制后提示到微信「搜一搜」粘贴关注'] }
            ]
        }
    ];

    var iconMap = {
        refresh: { cls: 'fa-refresh', color: '#4a9eff' },
        plus: { cls: 'fa-plus-circle', color: '#2ecc71' },
        fix: { cls: 'fa-wrench', color: '#f39c12' },
        remove: { cls: 'fa-trash', color: '#e74c3c' },
        lightbulb: { cls: 'fa-lightbulb-o', color: '#f39c12' },
        zap: { cls: 'fa-bolt', color: '#c44dff' }
    };

    function seedStats() {
        var vNode = document.getElementById('totalVersions');
        if (vNode) {
            vNode.dataset.count = versions.length;
            vNode.textContent = versions.length;
            vNode.dataset.counted = '1';
        }

        var dNode = document.getElementById('totalDays');
        if (dNode) {

            var startStr = (window.MOD && MOD.config && MOD.config.changelogStart) || '2025-11-16';
            var start = new Date(startStr.replace(/-/g, '/')).getTime();
            var days = Math.floor((Date.now() - start) / 86400000);
            days = days > 0 ? days : 0;
            dNode.dataset.count = days;
            dNode.textContent = days;
            dNode.dataset.counted = '1';
        }
    }

    function typeClass(type) {
        if (type === '重大更新') return 'major';
        if (type === '基础版本') return 'base';
        return 'normal';
    }

    function render() {
        var box = document.getElementById('timeline');
        if (!box) return;

        box.innerHTML = versions.map(function (v, index) {
            var badges = '';
            if (v.version) {
                badges += '<span class="ver-tag">' +
                    (v.oldVersion ? '<span class="old-ver">' + MOD.esc(v.oldVersion) + '</span>' : '') +
                    MOD.esc(v.version) + '</span>';
            }
            badges += '<span class="ver-date">' +
                MOD.esc(v.date) + '</span>';
            if (v.latest) badges += '<span class="tag grad">最新</span>';
            if (v.deprecated) {
                badges += '<span class="ver-badge deprecated">' +
                    MOD.esc(v.deprecatedLabel || '已废弃') + '</span>';
            }
            if (v.type) {
                badges += '<span class="ver-badge type-' + typeClass(v.type) + '">' +
                    MOD.esc(v.type) + '</span>';
            }

            var rows = (v.items || []).map(function (item) {
                var icon = iconMap[item.icon] || iconMap.refresh;

                return '<div class="cl-row">' +
                    '<span class="cl-row-icon" style="background:' + icon.color + '"></span>' +
                    '<span class="cl-row-main">' +
                    '<span class="cl-row-title">' + MOD.esc(item.title) + '</span>' +
                    (item.descs || []).map(function (d) {
                        return '<span class="cl-row-desc">' + MOD.esc(d) + '</span>';
                    }).join('') +
                    '</span></div>';
            }).join('');

            return '<div class="tl-item' + (v.deprecated ? ' deprecated' : '') +
                (v.latest ? ' latest' : '') + '" data-index="' + index + '">' +
                '<article class="cl-card glass">' +
                '<header class="cl-head" role="button" tabindex="0" aria-expanded="true">' +
                '<div class="cl-badges">' + badges + '</div>' +
                '<span class="cl-toggle">收起</span>' +
                '</header>' +
                '<div class="cl-body">' +
                (v.highlight
                    ? '<div class="ver-highlight">' +
                      MOD.esc(v.highlight) + '</div>'
                    : '') +
                '<div class="cl-items">' + rows + '</div>' +
                '</div></article></div>';
        }).join('');

        bindToggle(box);
    }

    function bindToggle(box) {
        Array.prototype.forEach.call(box.querySelectorAll('.cl-card'), function (card) {
            var head = card.querySelector('.cl-head');
            var body = card.querySelector('.cl-body');
            if (!head || !body) return;

            function toggle() {
                var collapsed = !card.classList.contains('collapsed');
                card.classList.toggle('collapsed', collapsed);
                head.setAttribute('aria-expanded', collapsed ? 'false' : 'true');

                var tg = card.querySelector('.cl-toggle');
                if (tg) tg.textContent = collapsed ? '展开' : '收起';
                MOD.haptic();
            }

            head.addEventListener('click', function (e) {
                if (e.target.closest && e.target.closest('a')) return;
                toggle();
            });
            head.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                }
            });
        });
    }

    function init() {
        seedStats();
        render();

        Array.prototype.forEach.call(
            document.querySelectorAll('.cl-hero, .cl-stats, .section .wrap > .section-head'),
            function (n) { n.classList.add('reveal'); }
        );
        MOD.reveal();

        MOD.counters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
