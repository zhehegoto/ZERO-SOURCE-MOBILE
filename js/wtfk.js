/* ============================================================
   零源机构 · 移动端 / MOD
   wtfk.js — 问题反馈（零源小助手）
   流程与 PC 端一致：称呼 → 联系方式 → 类型 → 描述 → 确认
   提交后本地 AES-GCM 加密并下载 .zfb 文件，内容不经服务器
   ============================================================ */
(function () {
    'use strict';

    var TYPE_MAP = { bug: '功能异常', suggestion: '功能建议', other: '其他' };
    var SECRET_KEY = 'Z3R0-L1nk-S3cur3-K3y-2025-X9m7';
    var SALT = 'Z3R0-SALT-2025';

    var sheet = null;
    var messagesEl = null;
    var quickEl = null;
    var inputEl = null;
    var sendBtn = null;
    var fab = null;

    var step = 'name';
    var data = { name: '', contact: '', type: '', description: '' };
    var started = false;

    /* ============================================================
       构建界面
       ============================================================ */
    function buildFab() {
        fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'fab pulse';
        fab.setAttribute('aria-label', '问题反馈');
        fab.innerHTML = '<i class="fa fa-headphones"></i>';
        fab.addEventListener('click', function () { open(); });
        document.body.appendChild(fab);
    }

    function buildSheet() {
        sheet = MOD.sheet({ id: 'fwSheet' });
        sheet.setTitle('零源小助手');
        sheet.setSub('<span class="fw-dot"></span> 在线 · 反馈内容本地加密');

        var panel = sheet.panelEl;
        panel.classList.add('fw-panel');

        // 头像插入信息条左侧
        var head = panel.querySelector('.sheet-head');
        var avatar = document.createElement('div');
        avatar.className = 'fw-avatar';
        avatar.innerHTML = '<i class="fa fa-headphones"></i>';
        head.insertBefore(avatar, head.firstChild);

        // 消息区
        messagesEl = sheet.bodyEl;
        messagesEl.classList.add('fw-messages');
        messagesEl.setAttribute('aria-live', 'polite');

        // 快捷选项 + 输入区
        quickEl = document.createElement('div');
        quickEl.className = 'fw-quick';

        var row = document.createElement('div');
        row.className = 'fw-input-row';
        row.innerHTML =
            '<input class="fw-input" id="fwInput" type="text" autocomplete="off" ' +
            'enterkeyhint="send" placeholder="输入你的回复...">' +
            '<button class="fw-send" id="fwSend" type="button" aria-label="发送">' +
            '<i class="fa fa-paper-plane"></i></button>';

        panel.appendChild(quickEl);
        panel.appendChild(row);

        inputEl = row.querySelector('#fwInput');
        sendBtn = row.querySelector('#fwSend');

        sendBtn.addEventListener('click', submitInput);
        inputEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitInput();
            }
        });

        bindKeyboard();
    }

    /* 虚拟键盘弹出时把面板顶到键盘之上 */
    function bindKeyboard() {
        var vv = window.visualViewport;
        if (!vv) return;

        function adjust() {
            if (!sheet || !sheet.el.classList.contains('open')) return;
            var gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
            sheet.panelEl.style.bottom = gap > 0 ? gap + 'px' : '';
            scrollBottom();
        }

        vv.addEventListener('resize', adjust);
        vv.addEventListener('scroll', adjust);

        sheet.onClose = function () {
            sheet.panelEl.style.bottom = '';
        };
    }

    function submitInput() {
        var value = inputEl.value.trim();
        if (!value || inputEl.disabled) return;
        inputEl.value = '';
        handleInput(value);
    }

    /* ============================================================
       消息渲染
       ============================================================ */
    function addMessage(text, kind, isHTML) {
        var wrap = document.createElement('div');
        wrap.className = 'fw-msg ' + (kind === 'bot' ? 'fw-bot' : 'fw-user');
        if (kind === 'bot') {
            wrap.innerHTML =
                '<div class="fw-msg-avatar"><i class="fa fa-comments"></i></div>' +
                '<div class="fw-bubble">' + (isHTML ? text : MOD.esc(text)) + '</div>';
        } else {
            wrap.innerHTML = '<div class="fw-bubble">' + MOD.esc(text) + '</div>';
        }
        messagesEl.appendChild(wrap);
        scrollBottom();
        return wrap;
    }

    function showTyping() {
        hideTyping();
        var wrap = document.createElement('div');
        wrap.className = 'fw-msg fw-bot';
        wrap.id = 'fwTyping';
        wrap.innerHTML =
            '<div class="fw-msg-avatar"><i class="fa fa-comments"></i></div>' +
            '<div class="fw-bubble"><div class="fw-typing">' +
            '<span></span><span></span><span></span></div></div>';
        messagesEl.appendChild(wrap);
        scrollBottom();
    }

    function hideTyping() {
        var t = document.getElementById('fwTyping');
        if (t) t.remove();
    }

    function botReply(text, delay, isHTML) {
        return new Promise(function (resolve) {
            showTyping();
            setTimeout(function () {
                hideTyping();
                addMessage(text, 'bot', isHTML);
                resolve();
            }, delay || 700);
        });
    }

    function scrollBottom() {
        setTimeout(function () {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 40);
    }

    function setQuick(options) {
        quickEl.innerHTML = '';
        options.forEach(function (opt) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'fw-quick-btn';
            b.textContent = opt.label;
            b.addEventListener('click', function () {
                MOD.haptic();
                handleInput(opt.value, opt.label);
            });
            quickEl.appendChild(b);
        });
    }

    function setInput(enabled, placeholder) {
        inputEl.disabled = !enabled;
        sendBtn.disabled = !enabled;
        if (placeholder) inputEl.placeholder = placeholder;
        if (enabled && !isTouch()) inputEl.focus();
    }

    function isTouch() {
        return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    }

    /* ============================================================
       对话流程
       ============================================================ */
    function handleInput(value, displayText) {
        addMessage(displayText || value, 'user');
        quickEl.innerHTML = '';
        setInput(false);

        switch (step) {
            case 'name': handleName(value); break;
            case 'contact': handleContact(value); break;
            case 'type': handleType(value); break;
            case 'description': handleDescription(value); break;
            case 'confirm': handleConfirm(value); break;
            case 'done': if (value === 'again') reset(); break;
        }
    }

    function handleName(value) {
        var name = value.trim();
        if (!name || name.length < 2) {
            return botReply('称呼至少需要 2 个字哦，请重新输入~').then(function () {
                setInput(true, '请输入你的称呼...');
            });
        }
        data.name = name;
        step = 'contact';
        return botReply('好的，' + name + '！请留下你的联系方式（邮箱或电话），方便我们回复你。')
            .then(function () { setInput(true, '请输入邮箱或电话...'); });
    }

    function handleContact(value) {
        var contact = value.trim();
        if (!contact || contact.length < 5) {
            return botReply('联系方式格式不太对哦，请重新输入~').then(function () {
                setInput(true, '请输入邮箱或电话...');
            });
        }
        data.contact = contact;
        step = 'type';
        return botReply('收到！请问反馈类型是？').then(function () {
            setQuick([
                { label: '功能异常', value: 'bug' },
                { label: '功能建议', value: 'suggestion' },
                { label: '其他', value: 'other' }
            ]);
            setInput(false);
        });
    }

    function handleType(value) {
        data.type = value;
        step = 'description';
        return botReply('好的，是关于「' + (TYPE_MAP[value] || value) + '」的反馈。请详细描述你的问题或建议，越详细越好~')
            .then(function () { setInput(true, '请详细描述...'); });
    }

    function handleDescription(value) {
        var desc = value.trim();
        if (!desc || desc.length < 10) {
            return botReply('描述至少需要 10 个字哦，这样我们才能更好地了解问题~').then(function () {
                setInput(true, '请详细描述...');
            });
        }
        data.description = desc;
        step = 'confirm';

        var html =
            '<div style="margin-bottom:6px;font-weight:600;">确认一下信息：</div>' +
            '<div class="fw-card">' +
            '<div><b>称呼：</b>' + MOD.esc(data.name) + '</div>' +
            '<div><b>联系：</b>' + MOD.esc(data.contact) + '</div>' +
            '<div><b>类型：</b>' + MOD.esc(TYPE_MAP[data.type] || data.type) + '</div>' +
            '<div><b>描述：</b>' + MOD.esc(data.description.length > 50
                ? data.description.slice(0, 50) + '...'
                : data.description) + '</div>' +
            '</div>' +
            '<div style="margin-top:8px;">确认提交吗？</div>';

        return botReply(html, 700, true).then(function () {
            setQuick([
                { label: '确认提交', value: 'submit' },
                { label: '重新填写', value: 'restart' }
            ]);
            setInput(false);
        });
    }

    function handleConfirm(value) {
        if (value === 'restart') {
            return botReply('好的，我们重新开始~').then(function () { reset(); });
        }
        if (value !== 'submit') return;

        return botReply('正在生成文件，请稍候...').then(function () {
            showTyping();

            var text = [
                '===== 零源机构反馈记录 =====',
                '提交时间：' + new Date().toLocaleString('zh-CN'),
                '称呼：' + data.name,
                '联系方式：' + data.contact,
                '反馈类型：' + (TYPE_MAP[data.type] || data.type),
                '',
                '反馈内容：',
                data.description,
                '',
                '===== 记录结束 ====='
            ].join('\n');

            return encryptText(text)
                .then(function (payload) {
                    downloadFile('ZEROFB2\n' + payload);
                    return '文件已经生成，请发送给：辙嗬';
                })
                .catch(function () {
                    // 极少数浏览器不支持 Web Crypto：退化为明文文件，保证反馈不丢失
                    downloadFile('ZEROFB1\n' + text);
                    return '当前浏览器不支持加密，已生成未加密的反馈文件，请发送给：辙嗬';
                });
        }).then(function (msg) {
            hideTyping();
            return botReply(msg).then(function () {
                step = 'done';
                setQuick([{ label: '再来一次', value: 'again' }]);
                setInput(false);
            });
        }).catch(function () {
            hideTyping();
            botReply('生成失败，请重试~').then(function () {
                setQuick([{ label: '重新填写', value: 'restart' }]);
            });
        });
    }

    /* ============================================================
       AES-GCM 加密（与 PC 端完全一致，保证后台可解密）
       ============================================================ */
    function getAesKey() {
        var enc = new TextEncoder();
        return crypto.subtle.importKey(
            'raw', enc.encode(SECRET_KEY), { name: 'PBKDF2' }, false, ['deriveKey']
        ).then(function (km) {
            return crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: enc.encode(SALT),
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                km,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );
        });
    }

    function encryptText(plain) {
        if (!window.crypto || !window.crypto.subtle) {
            return Promise.reject(new Error('Web Crypto 不可用'));
        }
        var enc = new TextEncoder();
        var iv = crypto.getRandomValues(new Uint8Array(12));
        return getAesKey().then(function (key) {
            return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plain));
        }).then(function (buf) {
            var bytes = new Uint8Array(iv.length + buf.byteLength);
            bytes.set(iv, 0);
            bytes.set(new Uint8Array(buf), iv.length);
            var bin = '';
            for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            return btoa(bin);
        });
    }

    function downloadFile(content) {
        var d = new Date();
        var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
            String(d.getDate()).padStart(2, '0');
        var name = 'feedback_' + stamp + '_' + Date.now() + '.zfb';

        var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1200);
    }

    /* ============================================================
       开关 / 重置
       ============================================================ */
    function reset() {
        messagesEl.innerHTML = '';
        quickEl.innerHTML = '';
        data = { name: '', contact: '', type: '', description: '' };
        step = 'name';
        start();
    }

    function start() {
        setInput(false);
        return botReply('你好！我是零源小助手，很高兴收到你的反馈。请问怎么称呼你？', 500)
            .then(function () { setInput(true, '请输入你的称呼...'); });
    }

    function open() {
        if (!sheet) buildSheet();
        if (fab) fab.classList.remove('pulse');
        sheet.open();
        if (!started) {
            started = true;
            start();
        } else {
            setTimeout(scrollBottom, 260);
        }
    }

    function close() {
        if (sheet) sheet.close();
    }

    /* ============================================================
       初始化
       ============================================================ */
    function init() {
        if (!window.MOD) {
            // core.js 还没就绪时稍后重试
            return setTimeout(init, 60);
        }
        buildFab();
        window.MODFeedback = { open: open, close: close };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
