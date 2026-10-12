/* ============================================================
   零源机构 · 移动端 / MOD
   gxrz.js — 更新日志
   数据（版本号 / 日期 / 类型 / 条目 / 图标）与 pc/js/gxrz.js 逐条一致，
   改内容时两边同步即可。
   呈现方式改为移动端垂直时间线 .timeline > .tl-item，
   每个版本一张可展开 / 收起的卡片，默认全部展开。
   ============================================================ */
(function () {
    'use strict';

    /* ==================== 版本数据（与 PC 端一一对应） ==================== */
    var versions = [
        {
            version: 'v4.6', date: '2026年10月7日', type: '重大更新', latest: true,
            items: [
                { icon: 'plus', title: '网站正式上线', descs: ['零源机构官网正式上线'] },
                { icon: 'refresh', title: '时间轴页面移动端优化', descs: ['修复页眉字体在移动端显示过小的问题', '修复页面缺失字体文件导致页眉样式不一致', '隔离时间轴专属CSS变量，不再覆盖公共变量', '移动端图片和文字间距优化', '移动端时间轴文字放大适配'] },
                { icon: 'refresh', title: '全站移动端适配', descs: ['首页滚动翻页移动端适配', '群相册移动端布局修复', '网站地图页面移动端样式调整'] },
                { icon: 'fix', title: '其他修复', descs: ['修复CSS变量冲突导致的页眉动画不一致', '清理重复的页眉覆盖样式'] }
            ]
        },
        {
            version: 'v4.5', date: '2026年10月6日', type: '重大更新',
            items: [
                { icon: 'plus', title: '网站地图更新', descs: ['官方网站状态改为运营中'] },
                { icon: 'refresh', title: '隐私政策优化', descs: ['修复目录导航点击跳转后章节标题被固定页眉遮挡的问题', '采用 CSS `scroll-margin-top` 原生偏移方案，替代手动 JS 计算，滚动定位更精准'] },
                { icon: 'fix', title: '首页分辨率适配', descs: ['优化不同分辨率下首页三屏内容显示，窄屏下数据卡片不再被页脚遮挡'] },
                { icon: 'fix', title: '体验修复', descs: ['修复群相册图片入场动画后透明度归零导致图片不显示的问题', '修复隐私政策页面浏览器缓存导致修改不生效的问题'] }
            ]
        },
        {
            version: 'v4.4', date: '2026年10月4日', type: '重大更新',
            items: [
                { icon: 'plus', title: '悬浮反馈系统上线', descs: ['全站右下角新增圆形耳机悬浮按钮，点击即可弹出对话式反馈窗口', '对话流程完整：称呼 → 联系方式 → 反馈类型 → 详细描述 → 确认提交', '液态玻璃弹窗风格，弹性入场动画，移动端自适应'] },
                { icon: 'refresh', title: '传统节日模块', descs: ['原「问题反馈」页面替换为「传统节日」总览页', '点击卡片直达对应节日沉浸页面'] },
                { icon: 'fix', title: '首页体验优化', descs: ['修复页脚被全屏翻页层遮挡导致无法点击的问题'] },
                { icon: 'fix', title: '时间轴修复', descs: ['修复右侧图片鼠标悬停无法回正的问题', '倾斜效果移至内层图片框，与入场动画互不干扰'] }
            ]
        },
        {
            version: 'v4.3', date: '2026年10月3日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '页面结构调整', descs: ['移除「联系我们」页面，信息卡片整合至「成员介绍」页底部'] },
                { icon: 'refresh', title: '时间轴页面全面重设计', descs: ['抛弃旧左图右文布局，采用全新「时光节点」设计：超大年份水印 + 中心垂直时间线 + 发光节点', '起源页改为透明风格，各页面年份、标题、描述文字统一透明化'] },
                { icon: 'refresh', title: '首页优化', descs: ['实现液态缩放翻页效果：三屏 fixed 堆叠，入场 scale + 淡入 + blur 消散', '公告详情优化，内容区域更舒展', '新增「历史公告」弹窗'] },
                { icon: 'refresh', title: '群相册重构', descs: ['图片排列从「按列填充」改为「按行填充」的瀑布流布局', '实现 JS 瀑布流算法，图片自动填入高度最小的列，消除空白间隙', '修复图片预加载失效、背景层丢失、层叠顺序错误等问题'] },
                { icon: 'refresh', title: '成员介绍优化', descs: ['页面底部新增联系信息三卡片', '移除卡牌背面「翻回」按钮，改为点击翻转 / 再次点击翻回'] },
                { icon: 'refresh', title: '更新日志页面优化', descs: ['主体宽度调整', '修复展开 / 收起卡顿问题', '所有卡片默认展开'] },
                { icon: 'refresh', title: '代码整理', descs: ['删除无用文件，清理废弃 CSS 变量，删除无用函数', '通用变量统一收归', '玻璃卡片样式统一收归', '各页面移除重复定义，减少冗余'] }
            ]
        },
        {
            version: 'v4.2', date: '2026年9月23日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '群相册增强', descs: ['Intersection Observer 懒加载（提前100px预加载）', '加载完成淡入效果', '鼠标滚轮切换图片和触摸滑动切换（手机端）以及键盘左右键/ESC'] },
                { icon: 'refresh', title: '问题反馈表单优化', descs: ['实时验证（输入300ms后验证，失焦立即验证）', '字段级错误提示（红色文字+输入框变红+抖动动画）', '提交成功/失败弹窗', '提交按钮loading动画'] },
                { icon: 'refresh', title: '首页细节优化', descs: ['新增轮播图鼠标悬停暂停', '新闻卡片悬停上浮+阴影增强', '最新动态时间标签'] },
                { icon: 'refresh', title: '全站性能优化', descs: ['全站图片懒加载'] },
                { icon: 'refresh', title: '移动端适配', descs: ['页眉导航横向滚动+缩小字号、页脚换行', '相册移动端优化', '表单容器和输入框适配手机宽度', '成员卡片移动端适配'] },
                { icon: 'refresh', title: '问题反馈页面优化', descs: ['左右分栏，左侧蓝紫渐变信息区+右侧白底表单区'] }
            ]
        },
        {
            version: 'v4.1', date: '2026年8月22日',
            items: [
                { icon: 'refresh', title: '首页更新', descs: ['首页更新公告模块，这下可以清楚看到什么了'] },
                { icon: 'refresh', title: '下架移动端', descs: ['非常抱歉通知，网站运营调整，暂时下架网站对于移动端UI优化模块'] },
                { icon: 'refresh', title: '更新网站名称', descs: ['网站正式改名为 零源机构 | Z℮R∅‑SOURCE'] },
                { icon: 'refresh', title: '成员职位调整', descs: ['调整了成员职位', '我们迎来了一位新同学'] },
                { icon: 'refresh', title: '代码优化', descs: ['整理了一下代码，修复显示错误'] }
            ]
        },
        {
            version: 'v4.0', date: '2026年8月6日',
            items: [
                { icon: 'refresh', title: '页眉页脚优化', descs: ['页眉滚动后底部出现一条左右流动的蓝色光条', '鼠标在logo图标悬停时"Z℮R∅"字距微微拉开并发光', '页脚背景渐变缓慢流动', '页眉页脚悬停时出现下划线从左往右展开'] },
                { icon: 'refresh', title: '彩蛋上线', descs: ['点击页眉logo即可进入，再点一下就退出了'] },
                { icon: 'refresh', title: 'AI页面', descs: ['网站设计者goto：能设计出完美ai页面的人简直是天才...'] },
                { icon: 'refresh', title: '页面优化', descs: ['首页优化，数据面板样式', '成员介绍，成员面板全息扫光掠过', '群相册，取景器样式', '问题反馈，终端机样式', '联系我们，通讯台样式'] }
            ]
        },
        {
            version: 'v3.7', date: '2026年7月31日', deprecated: true, deprecatedLabel: '已废弃',
            items: [
                { icon: 'plus', title: '添加了亿些东西', descs: ['将一些小巧思塞入了网站，暂未上线'] }
            ]
        },
        {
            version: 'v3.6', date: '2026年7月18日',
            items: [
                { icon: 'refresh', title: '修复AI聊天', descs: ['因为api总是出错，所以干脆大力出奇迹塞进了网站'] }
            ]
        },
        {
            version: 'v3.5', date: '2026年7月16日',
            items: [
                { icon: 'refresh', title: '页眉调整', descs: ['页眉美化，然后吃了一顿烧烤'] },
                { icon: 'refresh', title: '页面背景修复', descs: ['部分页面背景为了适配新页眉更改了我最喜欢的蓝色'] },
                { icon: 'refresh', title: '时间轴再次重写', descs: ['时间轴更新tip：技术对时间轴页面情有独钟'] }
            ]
        },
        {
            version: 'v3.4', date: '2026年7月10日',
            items: [
                { icon: 'lightbulb', title: '人员调整', descs: ['人员职位调整，核心成员现为：四'] },
                { icon: 'fix', title: 'BUG修复', descs: ['修复缺失的CSS变量定义中没有定义的严重BUG'] },
                { icon: 'refresh', title: '页面修复', descs: ['回到顶部功能统一'] }
            ]
        },
        {
            version: 'v3.3', date: '2026年5月19日', deprecated: true, deprecatedLabel: '已取消',
            items: [
                { icon: 'refresh', title: '移动端优化', descs: ['更新日志页面移动端适配'] }
            ]
        },
        {
            version: 'v3.2', date: '2026年4月18日',
            items: [
                { icon: 'refresh', title: '响应优化', descs: ['优化css编写，提升运行速度'] },
                { icon: 'refresh', title: '细节打磨', descs: ['部分页面细节补充'] },
                { icon: 'refresh', title: '移动端优化', descs: ['移动端页眉优化，改为横板'] }
            ]
        },
        {
            version: 'v3.1', date: '2026年4月7日', deprecated: true, deprecatedLabel: '已下架',
            items: [
                { icon: 'refresh', title: '网页上线', descs: ['经过不懈努力。。。我们终于上线了'] }
            ]
        },
        {
            version: 'v3.0', date: '2026年4月18日', type: '重大更新', oldVersion: 'v2.8',
            items: [
                { icon: 'refresh', title: '发布第一条前瞻视频', descs: ['点击可观看前瞻视频'] },
                { icon: 'refresh', title: '代码优化', descs: ['全页面重写，交互体验MAX++'] },
                { icon: 'refresh', title: '时间轴页面优化', descs: ['时间轴页面重写，增添炫酷的特效和炫酷的页面'] },
                { icon: 'refresh', title: '首页逻辑优化', descs: ['首页最新动态逻辑优化，添加过场动画'] },
                { icon: 'refresh', title: '成员介绍优化', descs: ['成员方块优化，添加右下角和最下方小标，图片居中展示'] },
                { icon: 'refresh', title: '群相册优化', descs: ['群相册图片显示优化，添加列表显示，修复点开图片过大和过小问题'] },
                { icon: 'refresh', title: '隐私政策页面优化', descs: ['隐私政策页面重置，新增目录选项，简洁易懂'] },
                { icon: 'refresh', title: '使用条款优化', descs: ['条款优化，页面美化'] },
                { icon: 'refresh', title: '网站地图优化', descs: ['网站页面美化，地理位置新增百度地图查看位置'] }
            ]
        },
        {
            version: 'v2.7', date: '2026年4月7日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '网页源码优化', descs: ['设计html+css到html+css+js的转化。（goto：真的要哭了）'] },
                { icon: 'refresh', title: '代码优化', descs: ['页眉页脚正式从html搬到js里了', '将主体7个网页迁移到body里', '新增js文件夹', 'css文件从4个变成13个了（goto：已经敲晕在电脑面前了）'] }
            ]
        },
        {
            version: 'v2.6', date: '2026年4月6日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '热点关注修改', descs: ['热点关注改名为问题反馈'] },
                { icon: 'fix', title: '修复已知问题', descs: ['修复文件路径混乱、CSS/JS内联与外部引用不统一、大量重复代码、修复导航跳转问题'] },
                { icon: 'refresh', title: '优化用户体验', descs: ['多个页面使用动态宽度，小屏幕设备不会出现横向滚动条', '修复成员介绍页面卡片布局在窄屏下挤压变形', '首页轮播图支持触摸滑动', '加载状态按钮禁用和状态反馈更平滑', '表单输入框与label标签正确关联', '颜色对比度检查'] }
            ]
        },
        {
            version: 'v2.5', date: '2026年4月1日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '热点关注修改', descs: ['热点关注改名为问题反馈'] },
                { icon: 'fix', title: '问题反馈页面重制', descs: ['问题反馈页面构成，并在桌面生成反馈文件(.txt)'] },
                { icon: 'fix', title: '反馈文件加密', descs: ['问题反馈文件加密，保护用户隐私'] },
                { icon: 'fix', title: '页脚代码修复', descs: ['修复大量冗余页脚代码'] },
                { icon: 'fix', title: '页眉页脚背景颜色暂时更换', descs: ['《GOTO：我还是觉得以前颜色好难看，但是不知道改什么就先这个吧》'] }
            ]
        },
        {
            version: 'v2.4', date: '2026年3月31日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '页面页面修改', descs: ['网页指南改名为AI聊天', '接入GLM-4.7 AI', '新增联系上下文功能', '新增清空对话功能', '完善移动端和桌面端显示效果'] },
                { icon: 'fix', title: 'AI页面代码整改', descs: ['修复AI聊天返回403、服务异常、Cannot read properties等问题'] }
            ]
        },
        {
            version: 'v2.3', date: '2026年3月20日',
            items: [
                { icon: 'refresh', title: '页面重置', descs: ['成员介绍页面重置', '联系我们页面重置'] },
                { icon: 'refresh', title: '更新日志编写', descs: ['更新日志页面版本号重写'] },
                { icon: 'fix', title: '部分代码整改', descs: ['修复已知问题'] }
            ]
        },
        {
            version: 'v2.2', date: '2026年3月19日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '首页面重置', descs: ['完成首页面模块', '结构分层', '功能优化：增强首页实用性和交互体验', '样式优化：统一整体页面设计风格', '响应式适配：完善移动端和桌面端显示效果'] },
                { icon: 'refresh', title: '成员增加', descs: ['新增两位新同学'] },
                { icon: 'fix', title: '首页代码整改', descs: ['修复首页代码'] }
            ]
        },
        {
            version: 'v2.1', date: '2026年3月18日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '群相册页面重置', descs: ['完成群相册页面'] },
                { icon: 'fix', title: '修复群相册显示', descs: ['修复群相册图片显示出错问题'] },
                { icon: 'refresh', title: '群相册代码优化', descs: ['优化群相册代码'] }
            ]
        },
        {
            version: 'v2.0', date: '2026年3月17日',
            items: [
                { icon: 'refresh', title: '移动端适配', descs: ['完成主要页面移动端适配'] },
                { icon: 'fix', title: '修复跳转', descs: ['修复从使用条款跳转到更新日志出错问题'] },
                { icon: 'refresh', title: '代码优化', descs: ['优化部分屎山代码'] }
            ]
        },
        {
            version: 'v1.4', date: '2025年12月6日',
            items: [
                { icon: 'refresh', title: '更新网站首页内容', descs: ['完善首页，补充首页图片大概模板'] },
                { icon: 'fix', title: '修改网页错字', descs: ['修改网页地址错误，显示错误'] },
                { icon: 'fix', title: '修复网站ZERO显示错误问题', descs: ['解决目前部分页面尾页ZERO显示错误问题'] }
            ]
        },
        {
            version: 'v1.3', date: '2025年12月1日',
            items: [
                { icon: 'refresh', title: '更新网站地图内容', descs: ['完善地点地图，补充地图细节'] },
                { icon: 'refresh', title: '申请百度地图api', descs: ['申请百度地图api，可调用api查看位置'] },
                { icon: 'fix', title: '修复网站地图图跳转失败问题', descs: ['解决目前页面跳转问题，优化整体体验'] }
            ]
        },
        {
            version: 'v1.2', date: '2025年11月20日', type: '重大更新',
            items: [
                { icon: 'plus', title: '新增更新日志页面', descs: ['添加独立的更新日志页面，记录网站所有版本更新内容'] },
                { icon: 'refresh', title: '优化页面加载速度', descs: ['压缩CSS/JS文件，优化图片加载策略'] },
                { icon: 'refresh', title: '更新使用条款内容', descs: ['完善数据收集与使用说明，补充Cookie政策细节'] },
                { icon: 'fix', title: '修复尾页快速链接跳转失败问题', descs: ['解决目前页面跳转问题，优化整体体验'] }
            ]
        },
        {
            version: 'v1.1', date: '2025年11月17日', type: '重大更新',
            items: [
                { icon: 'refresh', title: '页脚大更新', descs: ['UI界面更新，新增鼠标移动时动画效果，字体颜色和图标更新', '版权号及隐私政策等布局调整'] },
                { icon: 'refresh', title: '更新隐私政策页面', descs: ['新增其他页面跳转到隐私政策按钮', '新增隐私政策跳转到其他页面的链接'] },
                { icon: 'fix', title: '修复隐私政策页面跳转问题', descs: ['解决隐私政策无法跳转到其他页面的功能异常'] },
                { icon: 'fix', title: '修复跨页面跳转问题', descs: ['解决其他页面无法跳转到隐私政策页面的访问异常'] },
                { icon: 'fix', title: '修复全局页面跳转失败问题', descs: ['统一优化各网页之间的跳转逻辑'] },
                { icon: 'refresh', title: '优化启动脚本', descs: ['更新"打开.bat"文件，改善有时找不到"nav.html"的启动问题'] }
            ]
        },
        {
            version: 'v1.0', date: '2025年11月16日', type: '基础版本',
            highlight: '网站基础版本发布，完成核心架构搭建与优化',
            items: [
                { icon: 'remove', title: '移除Tailwind CSS依赖', descs: ['删除了Tailwind的CDN引入和相关配置脚本，减少外部依赖'] },
                { icon: 'refresh', title: '整合优化样式结构', descs: ['整合所有页面样式，保持原有功能不变，优化CSS结构组织'] },
                { icon: 'remove', title: '取消Font Awesome字体依赖', descs: ['删除了Font Awesome的CDN引入和配置脚本，降低页面加载压力'] },
                { icon: 'fix', title: '修复邮件发送目标错误问题', descs: ['解决点击发送邮件时，收件人地址错误的功能问题'] },
                { icon: 'refresh', title: '优化页脚功能与样式', descs: ['从单一文本布局优化为多功能分栏结构', '增强页脚实用性和交互体验', '统一页脚与整体页面设计风格', '完善移动端和桌面端显示效果'] },
                { icon: 'fix', title: '修复页面跳转错误问题', descs: ['解决从成员介绍页面跳转到时间轴页面时发生的跳转错误'] }
            ]
        }
    ];

    /* 图标映射（与 pc/js/gxrz.js 一致） */
    var iconMap = {
        refresh: { cls: 'fa-refresh', color: '#4a9eff' },
        plus: { cls: 'fa-plus-circle', color: '#2ecc71' },
        fix: { cls: 'fa-wrench', color: '#f39c12' },
        remove: { cls: 'fa-trash', color: '#e74c3c' },
        lightbulb: { cls: 'fa-lightbulb-o', color: '#f39c12' }
    };

    /* ==================== 顶部统计 ==================== */
    function seedStats() {
        var vNode = document.getElementById('totalVersions');
        if (vNode) {
            vNode.dataset.count = versions.length;
            vNode.textContent = '0';
        }

        var dNode = document.getElementById('totalDays');
        if (dNode) {
            // 运行天数起点与 PC 端 js/gxrz.js 相同
            var start = new Date('2025/11/16').getTime();
            var days = Math.floor((Date.now() - start) / 86400000);
            dNode.dataset.count = days > 0 ? days : 0;
            dNode.textContent = '0';
        }
    }

    /* ==================== 渲染时间线 ==================== */
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
            badges += '<span class="ver-date"><i class="fa fa-calendar"></i> ' +
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
                    '<span class="cl-row-icon" style="color:' + icon.color + '">' +
                    '<i class="fa ' + icon.cls + '"></i></span>' +
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
                '<span class="cl-toggle" aria-hidden="true"><i class="fa fa-chevron-down"></i></span>' +
                '</header>' +
                '<div class="cl-body">' +
                (v.highlight
                    ? '<div class="ver-highlight"><i class="fa fa-lightbulb-o"></i> ' +
                      MOD.esc(v.highlight) + '</div>'
                    : '') +
                '<div class="cl-items">' + rows + '</div>' +
                '</div></article></div>';
        }).join('');

        bindToggle(box);
    }

    /* ==================== 展开 / 收起（默认全部展开） ==================== */
    function bindToggle(box) {
        Array.prototype.forEach.call(box.querySelectorAll('.cl-card'), function (card) {
            var head = card.querySelector('.cl-head');
            var body = card.querySelector('.cl-body');
            if (!head || !body) return;

            function toggle() {
                var collapsed = !card.classList.contains('collapsed');
                card.classList.toggle('collapsed', collapsed);
                head.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
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

    /* ==================== 初始化 ==================== */
    function init() {
        seedStats();
        render();

        Array.prototype.forEach.call(
            document.querySelectorAll('.cl-hero, .cl-stats, .section .wrap > .section-head'),
            function (n) { n.classList.add('reveal'); }
        );
        MOD.reveal();
        // 统计数字滚动（data-count 已写入）
        MOD.counters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
