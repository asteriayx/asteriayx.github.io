// 1. 鼠标点击特效（随机切换多种效果）
!function () {
    var particles = [];

    function getColor() {
        var colors = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#55efc4','#a29bfe','#fd79a8','#00cec9','#fdcb6e','#e17055'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    function animate() {
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.life -= 0.008;
            if (p.life <= 0) {
                if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
                particles.splice(i, 1);
                i--;
                continue;
            }
            p.y += p.vy;
            p.x += p.vx;
            p.vy += 0.02; // 轻微重力
            p.scale += 0.003;
            p.rotation += p.rotSpeed;
            var glow = Math.max(4, 12 * p.life);
            p.el.style.cssText = 'left:' + p.x + 'px;top:' + p.y + 'px;opacity:' + p.life + ';transform:scale(' + p.scale + ') rotate(' + p.rotation + 'deg);position:fixed;pointer-events:none;z-index:99999;font-size:' + p.size + 'px;color:' + p.color + ';filter:drop-shadow(0 0 ' + glow + 'px ' + p.color + ');';
        }
        requestAnimationFrame(animate);
    }

    // 爱心（生成 3 颗）
    function spawnHeart(x, y) {
        for (var i = 0; i < 3; i++) {
            var el = document.createElement('span');
            el.innerHTML = '❤';
            document.body.appendChild(el);
            particles.push({ el: el, x: x, y: y, vx: (Math.random() - 0.5) * 3, vy: -1.5 - Math.random() * 1.5, scale: 0.6, life: 1, color: getColor(), size: 24 + Math.random() * 14, rotation: 0, rotSpeed: (Math.random() - 0.5) * 4 });
        }
    }

    // 星星（生成 4 颗）
    function spawnStar(x, y) {
        for (var i = 0; i < 4; i++) {
            var el = document.createElement('span');
            el.innerHTML = '★';
            document.body.appendChild(el);
            particles.push({ el: el, x: x, y: y, vx: (Math.random() - 0.5) * 4, vy: -1.5 - Math.random() * 2, scale: 0.4, life: 1, color: getColor(), size: 20 + Math.random() * 14, rotation: 0, rotSpeed: (Math.random() - 0.5) * 6 });
        }
    }

    // emoji 表情（生成 3 个）
    function spawnEmoji(x, y) {
        var emojis = ['✨','🎉','🔥','💫','🌸','🎵','💎','🍀','🦋','🌈'];
        for (var i = 0; i < 3; i++) {
            var el = document.createElement('span');
            el.innerHTML = emojis[Math.floor(Math.random() * emojis.length)];
            document.body.appendChild(el);
            particles.push({ el: el, x: x, y: y, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 2, scale: 0.5, life: 1, color: '#fff', size: 22 + Math.random() * 12, rotation: 0, rotSpeed: (Math.random() - 0.5) * 5 });
        }
    }

    // 彩色圆环（生成 3 个大小不一）
    function spawnRing(x, y) {
        for (var i = 0; i < 3; i++) {
            var el = document.createElement('div');
            var c = getColor();
            var s = 15 + Math.random() * 25;
            el.style.cssText = 'width:' + s + 'px;height:' + s + 'px;border:3px solid ' + c + ';border-radius:50%;';
            document.body.appendChild(el);
            particles.push({ el: el, x: x - s / 2, y: y - s / 2, vx: (Math.random() - 0.5) * 3, vy: -0.8 - Math.random() * 1.5, scale: 0.3, life: 1, color: c, size: s, rotation: 0, rotSpeed: (Math.random() - 0.5) * 3 });
        }
    }

    // 飘散粒子（生成 10 个）
    function spawnBurst(x, y) {
        var symbols = ['+','×','◦','•','○','✦','✧','◆'];
        for (var i = 0; i < 10; i++) {
            var el = document.createElement('span');
            el.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
            document.body.appendChild(el);
            var angle = (Math.PI * 2 / 10) * i + Math.random() * 0.5;
            var speed = 1.5 + Math.random() * 2.5;
            particles.push({ el: el, x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, scale: 0.4, life: 1, color: getColor(), size: 14 + Math.random() * 10, rotation: 0, rotSpeed: (Math.random() - 0.5) * 8 });
        }
    }

    var effects = [spawnHeart, spawnStar, spawnEmoji, spawnRing, spawnBurst];

    document.addEventListener('click', function (e) {
        var fn = effects[Math.floor(Math.random() * effects.length)];
        fn(e.clientX, e.clientY);
    });

    requestAnimationFrame(animate);
}();

// 2. 侧边栏音乐播放器（MetingJS 自动接管，无需手写逻辑）
function initSidebarPlayer() {}

// 3. 粒子背景（多特效定时切换）
function initParticleBackground() {
    var canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;pointer-events:none;';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var W, H;
    var particles = [];
    var maxParticles = 120;
    var animId = null;
    var currentEffect = 0;

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
    }
    resize();
    window.addEventListener('resize', resize);

    // ========== 特效定义 ==========

    // 雪花
    function initSnow() {
        particles = [];
        for (var i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * W, y: Math.random() * H,
                r: Math.random() * 3 + 1, d: Math.random() * maxParticles,
                type: 'snow'
            });
        }
    }
    function drawSnow(dt) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        }
        ctx.fill();
        var angle = Date.now() * 0.001;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.y += (Math.cos(angle + p.d) * 0.3 + 0.4 + p.r * 0.1) * dt;
            p.x += Math.sin(angle) * 0.6 * dt;
            if (p.y > H + 10 || p.x < -10 || p.x > W + 10) {
                particles[i] = { x: Math.random() * W, y: -10, r: p.r, d: p.d, type: 'snow' };
            }
        }
    }

    // 萤火虫
    function initFireflies() {
        particles = [];
        for (var i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * W, y: Math.random() * H,
                r: Math.random() * 3 + 1.5,
                vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
                phase: Math.random() * Math.PI * 2,
                type: 'firefly'
            });
        }
    }
    function drawFireflies(dt) {
        var t = Date.now() * 0.002;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var glow = 0.3 + 0.7 * Math.abs(Math.sin(t + p.phase));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,220,100,' + (glow * 0.15) + ')';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,240,150,' + glow + ')';
            ctx.fill();
            p.x += (p.vx + Math.sin(t + p.phase) * 0.15) * dt;
            p.y += (p.vy + Math.cos(t + p.phase) * 0.15) * dt;
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;
        }
    }

    // 气泡
    function initBubbles() {
        particles = [];
        for (var i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * W, y: H + Math.random() * H,
                r: Math.random() * 8 + 3,
                vy: -(Math.random() * 0.6 + 0.15),
                wobble: Math.random() * Math.PI * 2,
                type: 'bubble'
            });
        }
    }
    function drawBubbles(dt) {
        var t = Date.now() * 0.002;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(150,220,255,0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,240,255,0.5)';
            ctx.fill();
            p.y += p.vy * dt;
            p.x += Math.sin(t + p.wobble) * 0.4 * dt;
            if (p.y < -20) {
                particles[i] = { x: Math.random() * W, y: H + 20, r: p.r, vy: p.vy, wobble: p.wobble, type: 'bubble' };
            }
        }
    }

    // 星空
    function initStars() {
        particles = [];
        for (var i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * W, y: Math.random() * H,
                r: Math.random() * 2 + 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.02,
                type: 'star'
            });
        }
    }
    function drawStars(dt) {
        var t = Date.now() * 0.001;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var brightness = 0.3 + 0.7 * Math.abs(Math.sin(t * p.speed * 50 + p.phase));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200,220,255,' + brightness + ')';
            ctx.fill();
            if (p.r > 1.5) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(150,180,255,' + (brightness * 0.1) + ')';
                ctx.fill();
            }
        }
        if (Math.random() < 0.003 * dt) {
            var sx = Math.random() * W;
            var sy = Math.random() * H * 0.5;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 80, sy + 40);
            var grad = ctx.createLinearGradient(sx, sy, sx + 80, sy + 40);
            grad.addColorStop(0, 'rgba(255,255,255,0.8)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }

    // 花瓣飘落
    function initPetals() {
        particles = [];
        for (var i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * W, y: Math.random() * H,
                r: Math.random() * 4 + 3,
                vx: Math.random() * 0.3, vy: Math.random() * 0.4 + 0.2,
                rot: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 3,
                wobble: Math.random() * Math.PI * 2,
                color: ['rgba(255,182,193,0.7)','rgba(255,218,233,0.7)','rgba(255,192,203,0.6)','rgba(255,228,225,0.7)'][Math.floor(Math.random() * 4)],
                type: 'petal'
            });
        }
    }
    function drawPetals(dt) {
        var t = Date.now() * 0.001;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.beginPath();
            ctx.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.restore();
            p.y += p.vy * dt;
            p.x += (p.vx + Math.sin(t + p.wobble) * 0.25) * dt;
            p.rot += p.rotSpeed * dt;
            if (p.y > H + 10) {
                particles[i] = { x: Math.random() * W, y: -10, r: p.r, vx: p.vx, vy: p.vy, rot: p.rot, rotSpeed: p.rotSpeed, wobble: p.wobble, color: p.color, type: 'petal' };
            }
        }
    }

    // ========== 特效列表 ==========
    var effects = [
        { name: '雪花',  init: initSnow,       draw: drawSnow },
        { name: '萤火虫', init: initFireflies,  draw: drawFireflies },
        { name: '气泡',  init: initBubbles,     draw: drawBubbles },
        { name: '星空',  init: initStars,       draw: drawStars },
        { name: '花瓣',  init: initPetals,      draw: drawPetals }
    ];

    // 切换特效
    function switchEffect(index) {
        currentEffect = index % effects.length;
        effects[currentEffect].init();
        lastTime = 0; // 重置时间，避免 dt 过大
        console.log('[粒子特效] 切换到: ' + effects[currentEffect].name);
    }

    var lastTime = 0;
    var speedScale = 0.06; // 全局速度系数，值越小粒子越慢

    function loop(timestamp) {
        if (!lastTime) {
            lastTime = timestamp;
        }
        var elapsed = timestamp - lastTime;
        if (elapsed > 100) elapsed = 16.67; // 防止切换标签页后跳帧
        var dt = (elapsed / 16.67) * speedScale * 16.67;
        lastTime = timestamp;

        ctx.clearRect(0, 0, W, H);
        effects[currentEffect].draw(dt);
        animId = requestAnimationFrame(loop);
    }

    // 启动第一个特效
    switchEffect(0);
    animId = requestAnimationFrame(loop);

    // 每 3 分钟切换一次
    setInterval(function () {
        switchEffect(currentEffect + 1);
    }, 180000);
}

// 4. 网站运行时间统计与页脚优化 (追加到页脚)
function showRunTime() {
    const footer = document.querySelector('footer');
    if (footer) {
        const customFooter = document.createElement('div');
        customFooter.id = 'custom-footer';
        customFooter.style.cssText = 'margin-top: 20px; font-size: 14px; color: #888; text-align: center; line-height: 1.8;';
        footer.appendChild(customFooter);

        setInterval(() => {
            const start = new Date('2026-06-12T00:00:00');
            const now = new Date();
            const diff = Math.floor((now - start) / 1000);
            const d = Math.floor(diff / 86400);
            const h = Math.floor((diff % 86400) / 3600);
            const m = Math.floor((diff % 3600) / 60);
            const s = diff % 60;

            customFooter.innerHTML = `
        <div class="footer-stats">
          🌟 本站已安全运行 <strong>${d}</strong> 天 <strong>${h}</strong> 小时 <strong>${m}</strong> 分 <strong>${s}</strong> 秒 🌟
        </div>
        <div class="footer-copyright" style="font-size: 13px; color: #aaa; margin-top: 5px;">
          <span>&copy; ${new Date().getFullYear()} By Asteriayx</span> |
          <span>用心记录，持续更新</span> |
          <span><i class="iconfont icon-love" style="color: #ff5252;"></i> Love & Peace</span>
        </div>
      `;
        }, 1000);
    }
}

// 5. 通用 3D 悬浮视差追踪系统 (Vanilla JS)
function init3DParallax(selector, intensity = 10, isFlip = false) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
        const avatarWrap = card.querySelector('.avatar-wrap');
        const avatarImg = card.querySelector('.avatar-img');

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            let rotateX = ((y - centerY) / centerY) * -intensity;
            let rotateY = ((x - centerX) / centerX) * intensity;

            if (isFlip) {
                rotateX *= 2;
                rotateY *= 2;
            }

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            card.style.zIndex = '10';

            if (avatarWrap) {
                const avatarRotateY = ((x / rect.width) - 0.5) * 360;
                const avatarRotateX = (0.5 - y / rect.height) * 24;
                avatarWrap.style.transform = `translateZ(40px) rotateX(${avatarRotateX}deg) rotateY(${avatarRotateY}deg)`;
            }

            if (avatarImg) {
                avatarImg.style.transform = 'scale(1.06)';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            card.style.zIndex = '1';

            if (avatarWrap) {
                avatarWrap.style.transform = 'translateZ(40px) rotateX(0deg) rotateY(0deg)';
            }

            if (avatarImg) {
                avatarImg.style.transform = 'scale(1)';
            }
        });
    });
}

// 立即执行各项初始化
initSidebarPlayer();
initParticleBackground();
showRunTime();

// DOM 加载后初始化需要 DOM 的功能
document.addEventListener('DOMContentLoaded', function() {
    // 侧边栏个人卡片 3D
    init3DParallax('#parallax-card', 8);
    // 悬浮音乐卡片
    initFloatMusic();
});

// 6. 悬浮音乐卡片
function initFloatMusic() {
    var floatWrap = document.getElementById('music-float');
    var toggleBtn = document.getElementById('music-toggle-btn');
    var panel = document.getElementById('music-panel');
    var closeBtn = document.getElementById('music-panel-close');
    var panelHead = panel ? panel.querySelector('.music-panel-header') : null;
    if (!floatWrap || !toggleBtn || !panel) return;

    var isExpanded = false;
    var dragState = null;
    var justDragged = false;
    var edgePadding = 16;
    var panelGap = 12;
    var positionKey = 'music-float-position';
    var playbackKey = 'music-float-playback';
    var expandedKey = 'music-float-expanded';

    function clamp(value, min, max) {
        return Math.max(min, Math.min(value, max));
    }

    function savePosition() {
        try {
            sessionStorage.setItem(positionKey, JSON.stringify({
                left: floatWrap.style.left,
                top: floatWrap.style.top
            }));
        } catch (_err) {
            // ignore
        }
    }

    function saveExpandedState() {
        try {
            sessionStorage.setItem(expandedKey, isExpanded ? '1' : '0');
        } catch (_err) {
            // ignore
        }
    }

    function loadExpandedState() {
        try {
            return sessionStorage.getItem(expandedKey) === '1';
        } catch (_err) {
            return false;
        }
    }

    function savePlaybackState(state) {
        try {
            sessionStorage.setItem(playbackKey, JSON.stringify(state));
        } catch (_err) {
            // ignore
        }
    }

    function loadPlaybackState() {
        try {
            var raw = sessionStorage.getItem(playbackKey);
            return raw ? JSON.parse(raw) : null;
        } catch (_err) {
            return null;
        }
    }

    function applySavedPosition() {
        try {
            var raw = sessionStorage.getItem(positionKey);
            if (!raw) return;
            var saved = JSON.parse(raw);
            if (saved && saved.left && saved.top) {
                floatWrap.style.left = saved.left;
                floatWrap.style.top = saved.top;
                floatWrap.style.right = 'auto';
                floatWrap.style.bottom = 'auto';
            }
        } catch (_err) {
            // ignore
        }
    }

    function ensureVisible() {
        var rect = floatWrap.getBoundingClientRect();
        if (!floatWrap.style.left && !floatWrap.style.top) return;

        floatWrap.style.left = clamp(rect.left, edgePadding, window.innerWidth - rect.width - edgePadding) + 'px';
        floatWrap.style.top = clamp(rect.top, edgePadding, window.innerHeight - rect.height - edgePadding) + 'px';
        floatWrap.style.right = 'auto';
        floatWrap.style.bottom = 'auto';
    }

    function updatePanelPlacement() {
        var wrapRect = floatWrap.getBoundingClientRect();
        var panelWidth = Math.min(panel.offsetWidth || 340, window.innerWidth - edgePadding * 2);
        var panelHeight = Math.min(panel.offsetHeight || 420, window.innerHeight - edgePadding * 2);
        var desiredLeft = wrapRect.right - panelWidth;
        var nextLeft = clamp(desiredLeft, edgePadding, window.innerWidth - panelWidth - edgePadding);
        var desiredTop = wrapRect.top - panelHeight - panelGap;
        var canOpenBelow = wrapRect.bottom + panelGap + panelHeight <= window.innerHeight - edgePadding;
        var openBelow = desiredTop < edgePadding && canOpenBelow;
        var nextTop = openBelow ? wrapRect.bottom + panelGap : desiredTop;

        nextTop = clamp(nextTop, edgePadding, window.innerHeight - panelHeight - edgePadding);

        panel.style.left = (nextLeft - wrapRect.left) + 'px';
        panel.style.top = (nextTop - wrapRect.top) + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';

        floatWrap.classList.toggle('is-panel-below', openBelow);
        floatWrap.classList.toggle('is-panel-above', !openBelow);
        floatWrap.classList.toggle('is-panel-shift-right', nextLeft >= wrapRect.left);
        floatWrap.classList.toggle('is-panel-shift-left', nextLeft < wrapRect.left);
    }

    function startDrag(handle, event) {
        if (event.button !== undefined && event.button !== 0) return;
        var rect = floatWrap.getBoundingClientRect();

        dragState = {
            pointerId: event.pointerId,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            moved: false,
            handle: handle
        };

        floatWrap.classList.add('is-dragging');
        if (handle.setPointerCapture) {
            handle.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
    }

    function updateDrag(event, handle) {
        if (!dragState || dragState.handle !== handle) return;

        var rect = floatWrap.getBoundingClientRect();
        var nextLeft = clamp(event.clientX - dragState.offsetX, edgePadding, window.innerWidth - rect.width - edgePadding);
        var nextTop = clamp(event.clientY - dragState.offsetY, edgePadding, window.innerHeight - rect.height - edgePadding);

        floatWrap.style.left = nextLeft + 'px';
        floatWrap.style.top = nextTop + 'px';
        floatWrap.style.right = 'auto';
        floatWrap.style.bottom = 'auto';

        updatePanelPlacement();

        if (Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1) {
            dragState.moved = true;
        }
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
        floatWrap.classList.remove('is-dragging');

        if (moved) {
            justDragged = true;
            savePosition();
            setTimeout(function () {
                justDragged = false;
            }, 180);
        }

        return moved;
    }

    function bindDrag(handle, options) {
        if (!handle) return;

        handle.addEventListener('pointerdown', function (event) {
            if (options.ignoreSelector && event.target && event.target.closest(options.ignoreSelector)) return;
            if (options.onlyWhenClosed && isExpanded) return;
            startDrag(handle, event);
        });

        handle.addEventListener('pointermove', function (event) {
            updateDrag(event, handle);
        });

        function finishDrag() {
            stopDrag(handle);
        }

        handle.addEventListener('pointerup', finishDrag);
        handle.addEventListener('pointercancel', finishDrag);
    }

    function expand() {
        isExpanded = true;
        updatePanelPlacement();
        panel.classList.add('is-expanded');
        toggleBtn.style.transform = 'scale(0.92)';
        saveExpandedState();
    }

    function collapse() {
        isExpanded = false;
        panel.classList.remove('is-expanded');
        toggleBtn.style.transform = '';
        saveExpandedState();
    }

    // 点击按钮展开/收起
    toggleBtn.addEventListener('click', function(e) {
        if (justDragged) return;
        e.stopPropagation();
        if (isExpanded) {
            collapse();
        } else {
            expand();
        }
    });

    // 面板内点击不收起
    panel.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // 关闭按钮
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            collapse();
        });
    }

    // 点击外部收起
    document.addEventListener('click', function() {
        if (isExpanded) collapse();
    });

    bindDrag(toggleBtn, { onlyWhenClosed: true });
    bindDrag(panelHead, { onlyWhenClosed: false, ignoreSelector: '.music-panel-close, button, a' });
    applySavedPosition();
    ensureVisible();
    updatePanelPlacement();
    if (loadExpandedState()) {
        expand();
    }
    window.addEventListener('resize', function () {
        ensureVisible();
        updatePanelPlacement();
    });

    // 等待 MetingJS 和 APlayer 加载完成
    function waitForAPlayer() {
        var meting = panel.querySelector('meting-js');
        if (!meting || !meting.aplayer) {
            setTimeout(waitForAPlayer, 500);
            return;
        }

        var apInstance = meting.aplayer;
        var apDom = panel.querySelector('.aplayer');
        var audio = apInstance.audio;
        var playbackSyncTimer = null;
        var hasRestoredPlayback = false;

        // 随机光晕颜色 (使用和标签一样的颜色值 HEX，直接支持 CSS boxShadow)
        var glowColors = [
            '#ff6b6b', '#a29bfe', '#74b9ff', '#fd79a8', '#00b894', 
            '#fdcb6e', '#e17055', '#6c5ce7', '#00cec9', '#fab1a0', 
            '#55efc4', '#dfe6e9', '#ff9ff3', '#48dbfb', '#feca57', 
            '#ff6348', '#7bed9f', '#70a1ff', '#a4b0be', '#eccc68'
        ];
        var glowTimer = null;

        function setPlaying(playing) {
            if (playing) {
                toggleBtn.classList.add('is-playing');
                panel.classList.add('is-playing');
                // 启动随机光晕
                if (!glowTimer) {
                    glowTimer = setInterval(function() {
                        var c = glowColors[Math.floor(Math.random() * glowColors.length)];
                        // 缩小为原先的 1/3 (内层 8px，外层 16px)
                        toggleBtn.style.boxShadow = '0 0 8px 2px ' + c + ', 0 0 16px 5px ' + c;
                        toggleBtn.style.borderColor = c;
                    }, 2000);
                    // 立即设置一次
                    var c = glowColors[Math.floor(Math.random() * glowColors.length)];
                    toggleBtn.style.boxShadow = '0 0 8px 2px ' + c + ', 0 0 16px 5px ' + c;
                    toggleBtn.style.borderColor = c;
                }
            } else {
                toggleBtn.classList.remove('is-playing');
                panel.classList.remove('is-playing');
                if (glowTimer) {
                    clearInterval(glowTimer);
                    glowTimer = null;
                    // 恢复原始阴影
                    toggleBtn.style.boxShadow = '';
                    toggleBtn.style.borderColor = '';
                }
            }
        }

        // 同步封面图到按钮
        function syncCover() {
            if (apDom) {
                var pic = apDom.querySelector('.aplayer-pic');
                if (pic) {
                    var bg = pic.style.backgroundImage;
                    if (bg && bg !== 'none') {
                        toggleBtn.querySelector('.music-btn-cover').style.backgroundImage = bg;
                    }
                }
            }
        }

        function buildPlaybackState() {
            var listIndex = apInstance.list && typeof apInstance.list.index === 'number' ? apInstance.list.index : 0;
            return {
                trackIndex: listIndex,
                currentTime: audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
                volume: audio && Number.isFinite(audio.volume) ? audio.volume : 0.7,
                muted: Boolean(audio && audio.muted),
                playing: Boolean(audio && !audio.paused),
                savedAt: Date.now()
            };
        }

        function persistPlaybackState() {
            savePlaybackState(buildPlaybackState());
        }

        function restorePlaybackState() {
            if (hasRestoredPlayback) return;
            hasRestoredPlayback = true;

            var saved = loadPlaybackState();
            if (!saved || !audio) return;

            var desiredIndex = Number(saved.trackIndex);
            var desiredTime = Number(saved.currentTime);
            var desiredVolume = Number(saved.volume);
            var shouldPlay = Boolean(saved.playing);
            var desiredMuted = Boolean(saved.muted);

            function applyAudioState() {
                if (Number.isFinite(desiredVolume)) {
                    if (typeof apInstance.volume === 'function') {
                        apInstance.volume(desiredVolume, true);
                    } else {
                        audio.volume = desiredVolume;
                    }
                }

                audio.muted = desiredMuted;

                if (Number.isFinite(desiredTime) && desiredTime > 0) {
                    var setTime = function () {
                        try {
                            audio.currentTime = desiredTime;
                        } catch (_err) {
                            // ignore
                        }
                    };

                    if (audio.readyState >= 1) {
                        setTime();
                    } else {
                        audio.addEventListener('loadedmetadata', setTime, { once: true });
                    }
                }

                if (shouldPlay && typeof apInstance.play === 'function') {
                    var playResult = apInstance.play();
                    if (playResult && typeof playResult.catch === 'function') {
                        playResult.catch(function () {
                            // 某些浏览器切页后自动播放会被拦截，保持状态即可
                        });
                    }
                }
            }

            if (
                Number.isFinite(desiredIndex) &&
                apInstance.list &&
                typeof apInstance.list.switch === 'function' &&
                desiredIndex >= 0 &&
                desiredIndex !== apInstance.list.index
            ) {
                apInstance.list.switch(desiredIndex);
                window.setTimeout(applyAudioState, 180);
            } else {
                applyAudioState();
            }
        }

        // 监听 APlayer 原生事件 (比直接监听 audio 标签更可靠)
        apInstance.on('play', function () {
            setPlaying(true);
            syncCover();
            persistPlaybackState();
        });
        apInstance.on('playing', function () {
            setPlaying(true);
            syncCover();
            persistPlaybackState();
        });
        apInstance.on('pause', function () {
            setPlaying(false);
            persistPlaybackState();
        });
        apInstance.on('ended', function () {
            setPlaying(false);
            persistPlaybackState();
        });
        apInstance.on('loadstart', function () {
            window.setTimeout(function () {
                syncCover();
                persistPlaybackState();
            }, 120);
        });

        // 封面同步 - 监听封面图变化 (因为切歌时 APlayer 会修改这个 DOM 的 background-image)
        if (apDom) {
            var picEl = apDom.querySelector('.aplayer-pic');
            if (picEl) {
                var picObserver = new MutationObserver(function() { syncCover(); });
                picObserver.observe(picEl, { attributes: true, attributeFilter: ['style'] });
            }
        }

        // 初始状态检查
        if (!apInstance.audio.paused) {
            setPlaying(true);
        }
        syncCover();

        restorePlaybackState();
        persistPlaybackState();

        if (audio) {
            audio.addEventListener('timeupdate', persistPlaybackState);
            audio.addEventListener('volumechange', persistPlaybackState);
        }

        playbackSyncTimer = setInterval(persistPlaybackState, 1000);
        window.addEventListener('pagehide', function () {
            persistPlaybackState();
            if (playbackSyncTimer) {
                clearInterval(playbackSyncTimer);
                playbackSyncTimer = null;
            }
        }, { once: true });

        // 修复 APlayer 在 fixed 容器且页面滚动时的音量条计算 Bug
        var volumeBarWrap = panel.querySelector('.aplayer-volume-bar-wrap');
        var volumeBar = panel.querySelector('.aplayer-volume-bar');
        if (volumeBarWrap && volumeBar) {
            function updateVolumeByEvent(e) {
                var rect = volumeBar.getBoundingClientRect();
                var percentage = (rect.bottom - e.clientY) / rect.height;
                percentage = Math.max(0, Math.min(1, percentage));
                if (typeof apInstance.volume === 'function') {
                    apInstance.volume(percentage, true);
                } else {
                    audio.volume = percentage;
                    audio.muted = false;
                }
            }

            volumeBarWrap.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                updateVolumeByEvent(e);
            }, true);

            volumeBarWrap.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                e.preventDefault();
                updateVolumeByEvent(e);

                function onMouseMove(moveEvent) {
                    updateVolumeByEvent(moveEvent);
                }

                function onMouseUp() {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            }, true);
            
            volumeBarWrap.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                e.preventDefault();
                var touch = e.changedTouches[0];
                updateVolumeByEvent(touch);

                function onTouchMove(moveEvent) {
                    updateVolumeByEvent(moveEvent.changedTouches[0]);
                }

                function onTouchEnd() {
                    document.removeEventListener('touchmove', onTouchMove);
                    document.removeEventListener('touchend', onTouchEnd);
                    document.removeEventListener('touchcancel', onTouchEnd);
                }

                document.addEventListener('touchmove', onTouchMove, { passive: false });
                document.addEventListener('touchend', onTouchEnd);
                document.addEventListener('touchcancel', onTouchEnd);
            }, true);
        }

        console.log('[悬浮音乐] MetingJS/APlayer 原生事件监听已绑定');
    }

    waitForAPlayer();
}
