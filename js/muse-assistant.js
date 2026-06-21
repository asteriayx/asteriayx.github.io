(function () {
    function clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }

    function bootMuseAssistant() {
        var root = document.getElementById('xih-muse');
        if (!root || root.dataset.museBound === '1') return;

        root.dataset.museBound = '1';

        var launcher = document.getElementById('muse-launcher');
        var launcherBadge = root.querySelector('.muse-launcher-badge');
        var panel = document.getElementById('muse-panel');
        var closeBtn = document.getElementById('muse-close');
        var messages = document.getElementById('muse-messages');
        var form = document.getElementById('muse-form');
        var input = document.getElementById('muse-input');
        var sendBtn = document.getElementById('muse-send');
        var quickBtns = root.querySelectorAll('.muse-quick-btn');
        var panelHead = root.querySelector('.muse-panel-head');
        var frontEmotion = root.querySelector('.muse-emotion-front');
        var backEmotion = root.querySelector('.muse-emotion-back');
        var panelPortrait = document.getElementById('muse-panel-portrait');
        var tipBubble = document.getElementById('muse-tip');
        var tipText = document.getElementById('muse-tip-text');

        if (!launcher || !panel || !closeBtn || !messages || !form || !input || !sendBtn || !panelHead || !frontEmotion || !backEmotion || !panelPortrait || !tipBubble || !tipText) {
            return;
        }

        var endpoint = root.dataset.endpoint || '';
        var assistantName = root.dataset.name || 'MuseCat';
        var welcomeMessage = root.dataset.welcome || ('你好呀，我是 ' + assistantName + '。');
        var emptyHint = root.dataset.emptyHint || '请先配置 AI 接口地址。';
        var panelImage = root.dataset.panelImage || '';
        var hintBindings = {};
        var emotionOffsets = {};
        var historyKey = 'xih-muse-history';
        var positionKey = 'xih-muse-position';
        var welcomedKey = 'xih-muse-welcomed';
        var openStateKey = 'xih-muse-open';
        var draftKey = 'xih-muse-draft';
        var pendingRequestKey = 'xih-muse-pending-request';
        var panelEdgePadding = 16;
        var dragEdgePaddingX = 2;
        var dragEdgePaddingY = 16;
        var closedDockPeekOffsetX = 26;
        var panelGap = 14;
        var history = [];
        var initialized = false;
        var dragState = null;
        var justDragged = false;
        var typingTimer = null;
        var unreadCount = 0;
        var bounceTimer = null;
        var museImages = [];
        var emotionLayers = [frontEmotion, backEmotion];
        var activeEmotionLayer = 0;
        var carouselTimer = null;
        var emotionHoldTimer = null;
        var currentEmotionIndex = 0;
        var tipTypingTimer = null;
        var transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
        var loadedImageMap = Object.create(null);
        var emotionGroups = {
            idle: [0, 1, 2, 4, 5, 8, 12, 14],
            click: [3, 11, 0],
            open: [9, 13, 14],
            thinking: [7, 9],
            reply: [0, 4, 12]
        };

        function parseImageList(raw) {
            try {
                var parsed = JSON.parse(raw || '[]');
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
            } catch (_err) {
                return [];
            }
        }

        function parseObjectMap(raw) {
            try {
                var parsed = JSON.parse(raw || '{}');
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
            } catch (_err) {
                return {};
            }
        }

        museImages = parseImageList(root.dataset.images);
        hintBindings = parseObjectMap(root.dataset.tipBindings);
        emotionOffsets = parseObjectMap(root.dataset.emotionOffsets);

        if (!Object.keys(hintBindings).length) {
            hintBindings = {
                muse_1: 'Hi，我是 ' + assistantName,
                muse_2: '今天也要一起收集灵感呀',
                muse_3: '点我一下，我就陪你聊天',
                muse_4: '我可以帮你总结当前页面',
                muse_5: '博客文案也可以交给我润色',
                muse_6: '想不想让我帮你想个标题',
                muse_7: '把脑海里的想法慢慢告诉我吧',
                muse_8: '我也能帮你整理文章结构',
                muse_9: '让我认真想一想答案',
                muse_10: '有新的灵感冒出来了吗',
                muse_11: '如果卡住了，就来问我',
                muse_12: '我可以陪你把思路捋顺',
                muse_13: '把你的问题交给 ' + assistantName + ' 吧',
                muse_14: '写博客、做总结，我都能帮忙',
                muse_15: '灵感笔记已经翻开啦',
                muse_16: '欸，被你发现啦，快点我',
                default: 'Hi，我是 ' + assistantName
            };
        }

        function primeImageElement(img, src) {
            if (!img) return;
            img.src = transparentPixel;
            if (!src) return;

            if (loadedImageMap[src]) {
                img.src = src;
                return;
            }

            var preloader = new Image();
            preloader.onload = function () {
                loadedImageMap[src] = true;
                img.src = src;
            };
            preloader.onerror = function () {
                img.src = transparentPixel;
            };
            preloader.src = src;
        }

        museImages.forEach(function (src) {
            if (!src || loadedImageMap[src]) return;
            var preloader = new Image();
            preloader.onload = function () {
                loadedImageMap[src] = true;
            };
            preloader.src = src;
        });

        primeImageElement(frontEmotion, frontEmotion.dataset.src || museImages[0]);
        primeImageElement(backEmotion, backEmotion.dataset.src || museImages[1] || museImages[0]);
        applyPanelPortrait(panelImage || panelPortrait.dataset.src || museImages[0]);

        function toValidIndex(index) {
            if (!museImages.length) return -1;
            var max = museImages.length - 1;
            return clamp(index, 0, max);
        }

        function groupIndex(groupName, fallback) {
            var group = emotionGroups[groupName] || [];
            var resolved = group.map(toValidIndex).filter(function (value) {
                return value >= 0;
            });
            if (!resolved.length) {
                return toValidIndex(fallback || 0);
            }
            var next = resolved[Math.floor(Math.random() * resolved.length)];
            return next >= 0 ? next : toValidIndex(fallback || 0);
        }

        function applyPanelPortrait(src) {
            if (!src) return;
            primeImageElement(panelPortrait, src);
            root.style.setProperty('--muse-panel-portrait', 'url("' + src + '")');
        }

        function emotionHintKey(index) {
            var safeIndex = toValidIndex(index);
            return safeIndex < 0 ? 'default' : 'muse_' + (safeIndex + 1);
        }

        function hintTextForEmotion(index) {
            var key = emotionHintKey(index);
            return hintBindings[key] || hintBindings.default || ('Hi，我是 ' + assistantName);
        }

        function readOffsetNumber(value, fallback) {
            var number = Number(value);
            return Number.isFinite(number) ? number : fallback;
        }

        function offsetConfigForEmotion(index) {
            var key = emotionHintKey(index);
            var fallbackConfig = emotionOffsets.default && typeof emotionOffsets.default === 'object'
                ? emotionOffsets.default
                : {};
            var specificConfig = emotionOffsets[key] && typeof emotionOffsets[key] === 'object'
                ? emotionOffsets[key]
                : {};

            return {
                shiftX: readOffsetNumber(specificConfig.shift_x, readOffsetNumber(fallbackConfig.shift_x, -8)),
                leftShiftX: readOffsetNumber(specificConfig.left_shift_x, readOffsetNumber(fallbackConfig.left_shift_x, 5)),
                tipOverlap: readOffsetNumber(specificConfig.tip_overlap, readOffsetNumber(fallbackConfig.tip_overlap, -30)),
                tipLeftGap: readOffsetNumber(specificConfig.tip_left_gap, readOffsetNumber(fallbackConfig.tip_left_gap, 4))
            };
        }

        function applyEmotionOffset(index) {
            var offsetConfig = offsetConfigForEmotion(index);
            var dockedLeft = root.classList.contains('is-docked-left');
            root.style.setProperty('--muse-emotion-shift-x', (dockedLeft ? offsetConfig.leftShiftX : offsetConfig.shiftX) + 'px');
            root.style.setProperty('--muse-tip-overlap', offsetConfig.tipOverlap + 'px');
            root.style.setProperty('--muse-tip-left-gap', offsetConfig.tipLeftGap + 'px');
        }

        function swapEmotion(index) {
            var safeIndex = toValidIndex(index);
            if (safeIndex < 0) return;

            currentEmotionIndex = safeIndex;
            applyEmotionOffset(safeIndex);
            var nextLayer = emotionLayers[1 - activeEmotionLayer];
            var currentLayer = emotionLayers[activeEmotionLayer];
            var nextSrc = museImages[safeIndex];

            if (currentLayer.getAttribute('src') === nextSrc) {
                currentLayer.classList.add('is-visible');
                nextLayer.classList.remove('is-visible');
                root.style.setProperty('--muse-launcher-tilt', ((safeIndex % 5) - 2) * 1.2 + 'deg');
                if (!root.classList.contains('is-open')) {
                    typeTipText(hintTextForEmotion(safeIndex));
                }
                return;
            }

            primeImageElement(nextLayer, nextSrc);
            nextLayer.classList.add('is-visible');
            currentLayer.classList.remove('is-visible');
            activeEmotionLayer = 1 - activeEmotionLayer;

            root.style.setProperty('--muse-launcher-tilt', ((safeIndex % 5) - 2) * 1.2 + 'deg');
            if (!root.classList.contains('is-open')) {
                typeTipText(hintTextForEmotion(safeIndex));
            }
        }

        function holdEmotion(groupName, duration) {
            var nextIndex = groupIndex(groupName, currentEmotionIndex);
            window.clearTimeout(emotionHoldTimer);
            swapEmotion(nextIndex);
            if (duration) {
                emotionHoldTimer = window.setTimeout(function () {
                    if (root.classList.contains('is-open')) {
                        swapEmotion(groupIndex('open', nextIndex));
                    } else {
                        swapEmotion(groupIndex('idle', nextIndex));
                    }
                }, duration);
            }
        }

        function restartCarousel() {
            window.clearInterval(carouselTimer);
            if (root.classList.contains('is-open') || !museImages.length) return;

            carouselTimer = window.setInterval(function () {
                swapEmotion(groupIndex('idle', currentEmotionIndex + 1));
            }, 60000);
        }

        function typeTipText(text) {
            window.clearInterval(tipTypingTimer);
            tipBubble.classList.remove('is-typing');
            void tipBubble.offsetWidth;
            tipBubble.classList.add('is-typing');

            var content = String(text || '');
            var index = 0;
            tipText.textContent = '';

            tipTypingTimer = window.setInterval(function () {
                index += Math.random() > 0.74 ? 2 : 1;
                tipText.textContent = content.slice(0, index);
                if (index >= content.length) {
                    window.clearInterval(tipTypingTimer);
                    tipTypingTimer = null;
                    tipBubble.classList.remove('is-typing');
                }
            }, 26);
        }

        function updateTipText(index, shouldType) {
            var text = hintTextForEmotion(index);
            if (shouldType === false) {
                window.clearInterval(tipTypingTimer);
                tipTypingTimer = null;
                tipBubble.classList.remove('is-typing');
                tipText.textContent = text;
                return;
            }
            typeTipText(text);
        }

        function syncTipVisibility() {
            var shouldShow = !root.classList.contains('is-open');
            root.classList.toggle('show-tip', shouldShow);
            tipBubble.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        }

        function triggerBounce() {
            window.clearTimeout(bounceTimer);
            root.classList.remove('is-bouncing');
            void root.offsetWidth;
            root.classList.add('is-bouncing');
            bounceTimer = window.setTimeout(function () {
                root.classList.remove('is-bouncing');
            }, 520);
        }

        function copyText(text) {
            if (!text) return Promise.reject(new Error('empty text'));

            if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
            }

            return new Promise(function (resolve, reject) {
                var textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', 'readonly');
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();

                try {
                    document.execCommand('copy');
                    resolve();
                } catch (err) {
                    reject(err);
                } finally {
                    document.body.removeChild(textarea);
                }
            });
        }

        function attachCopyAction(item, role, text) {
            if (role !== 'assistant' || !text) return;

            var actionBar = document.createElement('div');
            actionBar.className = 'muse-bubble-actions';

            var copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'muse-copy-btn';
            copyBtn.textContent = '复制';

            copyBtn.addEventListener('click', function (event) {
                event.stopPropagation();
                copyText(text).then(function () {
                    copyBtn.textContent = '已复制';
                    window.setTimeout(function () {
                        copyBtn.textContent = '复制';
                    }, 1400);
                }).catch(function () {
                    copyBtn.textContent = '复制失败';
                    window.setTimeout(function () {
                        copyBtn.textContent = '复制';
                    }, 1400);
                });
            });

            actionBar.appendChild(copyBtn);
            item.appendChild(actionBar);
        }

        function appendBubble(role, text, extraClass) {
            var item = document.createElement('div');
            var cls = role === 'user' ? 'is-user' : role === 'status' ? 'is-status' : 'is-assistant';
            item.className = 'muse-message ' + cls;

            var bubble = document.createElement('div');
            bubble.className = 'muse-bubble ' + cls + (extraClass ? ' ' + extraClass : '');
            bubble.textContent = text || '';
            item.appendChild(bubble);
            attachCopyAction(item, role, text);
            messages.appendChild(item);
            scrollToBottom();
            return {
                item: item,
                bubble: bubble
            };
        }

        function scrollToBottom() {
            messages.scrollTop = messages.scrollHeight;
        }

        function saveHistory() {
            try {
                sessionStorage.setItem(historyKey, JSON.stringify(history.slice(-12)));
            } catch (err) {
                console.warn('[xih-muse] 保存会话失败', err);
            }
        }

        function loadHistory() {
            try {
                var raw = sessionStorage.getItem(historyKey);
                return raw ? JSON.parse(raw) : [];
            } catch (_err) {
                return [];
            }
        }

        function saveDraft() {
            try {
                sessionStorage.setItem(draftKey, input.value || '');
            } catch (_err) {
                // ignore
            }
        }

        function restoreDraft() {
            try {
                input.value = sessionStorage.getItem(draftKey) || '';
                input.dispatchEvent(new Event('input'));
            } catch (_err) {
                // ignore
            }
        }

        function saveOpenState(isOpen) {
            try {
                sessionStorage.setItem(openStateKey, isOpen ? '1' : '0');
            } catch (_err) {
                // ignore
            }
        }

        function loadOpenState() {
            try {
                return sessionStorage.getItem(openStateKey) === '1';
            } catch (_err) {
                return false;
            }
        }

        function savePendingRequest(payload) {
            try {
                if (!payload) {
                    sessionStorage.removeItem(pendingRequestKey);
                    return;
                }
                sessionStorage.setItem(pendingRequestKey, JSON.stringify(payload));
            } catch (_err) {
                // ignore
            }
        }

        function loadPendingRequest() {
            try {
                var raw = sessionStorage.getItem(pendingRequestKey);
                return raw ? JSON.parse(raw) : null;
            } catch (_err) {
                return null;
            }
        }

        function hasWelcomed() {
            try {
                return localStorage.getItem(welcomedKey) === '1';
            } catch (_err) {
                return false;
            }
        }

        function setWelcomed() {
            try {
                localStorage.setItem(welcomedKey, '1');
            } catch (_err) {
                // ignore
            }
        }

        function setUnread(count) {
            unreadCount = Math.max(0, count || 0);
            root.classList.toggle('has-unread', unreadCount > 0);
            if (launcherBadge) {
                launcherBadge.textContent = unreadCount > 9 ? '9+' : String(unreadCount || '');
            }
        }

        function markUnread() {
            if (root.classList.contains('is-open')) return;
            setUnread(unreadCount + 1);
        }

        function rememberAssistantText(text) {
            history.push({ role: 'assistant', content: text });
            saveHistory();
            markUnread();
        }

        function renderHistory() {
            messages.innerHTML = '';
            history.forEach(function (item) {
                appendBubble(item.role, item.content);
            });
        }

        function playTypedBubble(text, onDone) {
            clearInterval(typingTimer);

            var bubble = appendBubble('assistant', '', 'is-typing');
            var index = 0;

            typingTimer = window.setInterval(function () {
                index += Math.random() > 0.72 ? 2 : 1;
                bubble.bubble.textContent = text.slice(0, index);
                scrollToBottom();

                if (index >= text.length) {
                    clearInterval(typingTimer);
                    typingTimer = null;
                    bubble.bubble.classList.remove('is-typing');
                    attachCopyAction(bubble.item, 'assistant', text);
                    if (typeof onDone === 'function') {
                        onDone(text);
                    }
                }
            }, 28);
        }

        function ensureInit() {
            if (initialized) return;

            initialized = true;
            history = loadHistory();
            renderHistory();
            restoreDraft();

            if (!history.length) {
                if (!hasWelcomed()) {
                    playTypedBubble(welcomeMessage, function (text) {
                        history.push({ role: 'assistant', content: text });
                        saveHistory();
                        setWelcomed();
                    });
                } else {
                    appendBubble('assistant', welcomeMessage);
                }
            }

            if (!endpoint) {
                appendBubble('status', emptyHint);
            }
        }

        function savePosition() {
            try {
                sessionStorage.setItem(positionKey, JSON.stringify({
                    left: root.style.left,
                    top: root.style.top
                }));
            } catch (_err) {
                // ignore
            }
        }

        function getDragRect() {
            if (root.classList.contains('is-open')) {
                return root.getBoundingClientRect();
            }
            return launcher.getBoundingClientRect();
        }

        function getMinLeftBoundary() {
            if (root.classList.contains('is-open')) {
                return dragEdgePaddingX;
            }
            return dragEdgePaddingX - closedDockPeekOffsetX;
        }

        function applySavedPosition() {
            try {
                var raw = sessionStorage.getItem(positionKey);
                if (!raw) return;

                var saved = JSON.parse(raw);
                if (saved && saved.left && saved.top) {
                    root.style.left = saved.left;
                    root.style.top = saved.top;
                    root.style.right = 'auto';
                    root.style.bottom = 'auto';
                }
            } catch (_err) {
                // ignore
            }
        }

        function setDockClass(left) {
            var dockLeft = left <= dragEdgePaddingX + 24;
            root.classList.toggle('is-docked-left', dockLeft);
            root.classList.remove('is-docked-right');
            applyEmotionOffset(currentEmotionIndex);
        }

        function ensureRootVisible() {
            var rect = getDragRect();
            var nextLeft = rect.left;
            var nextTop = rect.top;

            if (root.style.left || root.style.top) {
                nextLeft = clamp(rect.left, getMinLeftBoundary(), window.innerWidth - rect.width - dragEdgePaddingX);
                nextTop = clamp(rect.top, dragEdgePaddingY, window.innerHeight - rect.height - dragEdgePaddingY);

                root.style.left = nextLeft + 'px';
                root.style.top = nextTop + 'px';
                root.style.right = 'auto';
                root.style.bottom = 'auto';
                setDockClass(nextLeft);
            }
        }

        function updatePanelPlacement() {
            var rootRect = root.getBoundingClientRect();
            var panelWidth = Math.min(panel.offsetWidth || 380, window.innerWidth - panelEdgePadding * 2);
            var panelHeight = Math.min(panel.offsetHeight || 580, window.innerHeight - panelEdgePadding * 2);

            var desiredLeft = rootRect.right - panelWidth;
            var clampedLeft = clamp(desiredLeft, panelEdgePadding, window.innerWidth - panelWidth - panelEdgePadding);
            var desiredTop = rootRect.top - panelHeight - panelGap;
            var canOpenBelow = rootRect.bottom + panelGap + panelHeight <= window.innerHeight - panelEdgePadding;
            var openBelow = desiredTop < panelEdgePadding && canOpenBelow;
            var nextTop = openBelow ? rootRect.bottom + panelGap : desiredTop;
            nextTop = clamp(nextTop, panelEdgePadding, window.innerHeight - panelHeight - panelEdgePadding);

            panel.style.left = (clampedLeft - rootRect.left) + 'px';
            panel.style.top = (nextTop - rootRect.top) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';

            root.classList.toggle('is-panel-below', openBelow);
            root.classList.toggle('is-panel-above', !openBelow);
            root.classList.toggle('is-panel-shift-right', clampedLeft >= rootRect.left);
            root.classList.toggle('is-panel-shift-left', clampedLeft < rootRect.left);
        }

        function setOpen(open) {
            root.classList.toggle('is-open', open);
            panel.setAttribute('aria-hidden', open ? 'false' : 'true');
            root.classList.toggle('is-panel-open', open);
            syncTipVisibility();
            saveOpenState(open);

            if (open) {
                ensureInit();
                setUnread(0);
                updatePanelPlacement();
                holdEmotion('open');
                restartCarousel();
                window.setTimeout(function () {
                    input.focus();
                    scrollToBottom();
                }, 140);
            } else {
                holdEmotion('idle');
                restartCarousel();
                updateTipText(currentEmotionIndex);
            }
        }

        function buildPayload(userText) {
            return {
                userMessage: userText,
                history: history.slice(-10),
                pageContext: {
                    title: document.title || '',
                    url: location.href
                }
            };
        }

        function submitForm() {
            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
                return;
            }

            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }

        function safelyReadJson(res) {
            return res.text().then(function (text) {
                try {
                    return text ? JSON.parse(text) : {};
                } catch (_err) {
                    return {};
                }
            });
        }

        function performRequest(userText) {
            var loading = appendBubble('status', assistantName + ' 正在思考中...');

            return fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(buildPayload(userText))
            }).then(function (res) {
                return safelyReadJson(res).then(function (data) {
                    return { ok: res.ok, data: data };
                });
            }).then(function (result) {
                if (loading.item.parentNode) {
                    loading.item.parentNode.removeChild(loading.item);
                }

                if (!result.ok) {
                    var errorText = (result.data && result.data.error) || '请求失败，请稍后再试。';
                    appendBubble('assistant', errorText);
                    rememberAssistantText(errorText);
                    holdEmotion('reply', 1000);
                    savePendingRequest(null);
                    return;
                }

                var reply = (result.data && result.data.reply) || 'Muse 暂时没有想到合适的回应。';
                appendBubble('assistant', reply);
                rememberAssistantText(reply);
                holdEmotion('reply', 1200);
                savePendingRequest(null);
            }).catch(function () {
                if (loading.item.parentNode) {
                    loading.item.parentNode.removeChild(loading.item);
                }

                var errorText = '网络无法访问，请开启VPN尝试访问。';
                appendBubble('assistant', errorText);
                rememberAssistantText(errorText);
                holdEmotion('reply', 1000);
            }).finally(function () {
                sendBtn.disabled = false;
                updatePanelPlacement();
                if (root.classList.contains('is-open')) {
                    input.focus();
                }
            });
        }

        function sendMessage(userText) {
            if (!endpoint) {
                appendBubble('status', emptyHint);
                return Promise.resolve();
            }

            history.push({ role: 'user', content: userText });
            appendBubble('user', userText);
            saveHistory();

            input.value = '';
            input.style.height = '';
            saveDraft();
            sendBtn.disabled = true;
            holdEmotion('thinking', 1200);
            savePendingRequest({
                userText: userText,
                createdAt: Date.now()
            });
            return performRequest(userText);
        }

        function resumePendingRequestIfNeeded() {
            var pending = loadPendingRequest();
            if (!pending || !pending.userText) return;
            if (!endpoint) return;

            sendBtn.disabled = true;
            holdEmotion('thinking', 1200);
            performRequest(pending.userText);
        }

        function updatePosition(clientX, clientY) {
            if (!dragState) return;

            var rect = getDragRect();
            var nextLeft = clamp(clientX - dragState.offsetX, getMinLeftBoundary(), window.innerWidth - rect.width - dragEdgePaddingX);
            var nextTop = clamp(clientY - dragState.offsetY, dragEdgePaddingY, window.innerHeight - rect.height - dragEdgePaddingY);

            root.style.left = nextLeft + 'px';
            root.style.top = nextTop + 'px';
            root.style.right = 'auto';
            root.style.bottom = 'auto';

            setDockClass(nextLeft);
            updatePanelPlacement();
        }

        function startDrag(handle, event) {
            if (event.button !== undefined && event.button !== 0) return;

            var rect = getDragRect();
            dragState = {
                pointerId: event.pointerId,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                moved: false,
                handle: handle
            };

            root.classList.add('is-dragging');
            if (handle.setPointerCapture) {
                handle.setPointerCapture(event.pointerId);
            }
            event.preventDefault();
        }

        function snapToEdge() {
            var rect = getDragRect();
            var shouldDockLeft = rect.left + rect.width / 2 < window.innerWidth / 2;
            var minLeft = getMinLeftBoundary();
            var snapLeft = shouldDockLeft
                ? minLeft
                : clamp(rect.left, minLeft, window.innerWidth - rect.width - dragEdgePaddingX);
            var snapTop = clamp(rect.top, dragEdgePaddingY, window.innerHeight - rect.height - dragEdgePaddingY);

            root.classList.add('is-docking');
            root.style.left = snapLeft + 'px';
            root.style.top = snapTop + 'px';
            root.style.right = 'auto';
            root.style.bottom = 'auto';

            setDockClass(snapLeft);
            updatePanelPlacement();
            savePosition();

            window.setTimeout(function () {
                root.classList.remove('is-docking');
            }, 280);
        }

        function stopDrag(handle) {
            if (!dragState) return false;

            var moved = dragState.moved;

            if (
                dragState.pointerId !== undefined &&
                handle.hasPointerCapture &&
                handle.hasPointerCapture(dragState.pointerId)
            ) {
                handle.releasePointerCapture(dragState.pointerId);
            }

            dragState = null;
            root.classList.remove('is-dragging');

            if (moved) {
                justDragged = true;
                snapToEdge();
                window.setTimeout(function () {
                    justDragged = false;
                }, 180);
            } else {
                savePosition();
            }

            return moved;
        }

        function bindDrag(handle, options) {
            handle.addEventListener('pointerdown', function (event) {
                if (options.onlyWhenClosed && root.classList.contains('is-open')) return;
                if (options.ignoreSelector && event.target && event.target.closest(options.ignoreSelector)) return;
                startDrag(handle, event);
            });

            handle.addEventListener('pointermove', function (event) {
                if (!dragState || dragState.handle !== handle) return;

                updatePosition(event.clientX, event.clientY);
                if (Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1) {
                    dragState.moved = true;
                }
            });

            function finishDrag() {
                return stopDrag(handle);
            }

            handle.addEventListener('pointerup', finishDrag);
            handle.addEventListener('pointercancel', finishDrag);
        }

        launcher.addEventListener('click', function (event) {
            if (justDragged) return;
            event.stopPropagation();
            triggerBounce();
            holdEmotion('click', 900);
            setOpen(!root.classList.contains('is-open'));
        });

        closeBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            setOpen(false);
        });

        panel.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        document.addEventListener('click', function () {
            if (root.classList.contains('is-open')) {
                setOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && root.classList.contains('is-open')) {
                setOpen(false);
            }
        });

        input.addEventListener('input', function () {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
            saveDraft();
        });

        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                submitForm();
            }
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var text = (input.value || '').trim();
            if (!text) return;
            sendMessage(text);
        });

        Array.prototype.forEach.call(quickBtns, function (btn) {
            btn.addEventListener('click', function () {
                var prompt = btn.dataset.prompt || btn.textContent || '';
                input.value = prompt;
                input.dispatchEvent(new Event('input'));
                submitForm();
            });
        });

        bindDrag(launcher, { onlyWhenClosed: true });
        bindDrag(panelHead, {
            onlyWhenClosed: false,
            ignoreSelector: 'button, textarea, input, a, .muse-quick-btn'
        });

        applySavedPosition();
        ensureRootVisible();
        updatePanelPlacement();
        setDockClass(getDragRect().left);
        swapEmotion(groupIndex('idle', 0));
        syncTipVisibility();
        restartCarousel();

        if (loadOpenState()) {
            setOpen(true);
        }

        if (loadPendingRequest()) {
            ensureInit();
            setOpen(true);
            resumePendingRequestIfNeeded();
        }

        window.addEventListener('resize', function () {
            ensureRootVisible();
            updatePanelPlacement();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootMuseAssistant);
    } else {
        bootMuseAssistant();
    }

    document.addEventListener('pjax:complete', bootMuseAssistant);
    document.addEventListener('turbolinks:load', bootMuseAssistant);
})();
