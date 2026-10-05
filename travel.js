// ===== 欢迎页：点击“开启旅程”后淡出进入首页 =====
const welcome = document.getElementById('welcome');
const welcomeBtn = document.getElementById('welcomeBtn');

// 欢迎页显示期间锁定背景滚动
document.body.style.overflow = 'hidden';

function enterSite() {
    if (!welcome || welcome.classList.contains('hide')) return;
    welcome.classList.add('hide');
    document.body.style.overflow = '';
}

welcomeBtn.addEventListener('click', enterSite);
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !welcome.classList.contains('hide')) enterSite();
});

// ===== 导航栏滚动效果 & 回到顶部按钮 =====
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    backToTop.classList.toggle('show', window.scrollY > 400);
}, { passive: true });

// ===== 移动端汉堡菜单 =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
});

// 点击菜单项后自动收起
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

// ===== 导航高亮（Scroll Spy）=====
const spyAnchors = document.querySelectorAll('.nav-links a');
const spyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const hash = '#' + entry.target.id;
            spyAnchors.forEach(a => {
                a.classList.toggle('active', a.getAttribute('href') === hash);
            });
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('section[id]').forEach(section => {
    spyObserver.observe(section);
});

// ===== 滚动渐入动画 =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // 动画结束后清掉错落延迟，避免影响 hover 过渡
            setTimeout(() => { entry.target.style.transitionDelay = ''; }, 900);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.timeline-item, .note-card, .reveal').forEach(el => {
    revealObserver.observe(el);
});

// ===== 统计数字动画（修改 HTML 里的 data-target 即可更新数值）=====
const statNumbers = document.querySelectorAll('.stat-item .number');
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        statObserver.unobserve(el);

        const target = parseInt(el.dataset.target, 10) || 0;
        if (target <= 0) {
            el.textContent = '—';
            return;
        }

        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            el.textContent = Math.floor(current);
        }, 30);
    });
}, { threshold: 0.5 });

statNumbers.forEach(el => statObserver.observe(el));

// ===== 图片灯箱（点击照片放大，支持遮罩点击 / Esc 关闭）=====
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');

function openLightbox(img) {
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '旅行照片';
    lightboxCaption.textContent = img.dataset.caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// 时间线里的照片同样可点开，灯箱标题自动取该旅程的标题 + 地点
document.querySelectorAll('.timeline-photo').forEach(img => {
    const card = img.closest('.timeline-content');
    if (card && !img.dataset.caption) {
        const title = card.querySelector('h3');
        const location = card.querySelector('.location');
        img.dataset.caption = [title && title.textContent.trim(), location && location.textContent.trim()]
            .filter(Boolean)
            .join('  ');
    }
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('aria-label', '点击放大查看照片');
    img.addEventListener('click', () => openLightbox(img));
    img.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(img);
        }
    });
});

document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) {
        closeLightbox();
    }
});

// ===== 回到顶部 =====
backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== 旅行愿望清单：点击标记完成，进度与状态保存在本地 =====
const wishList = document.getElementById('wishList');
const wishFill = document.getElementById('wishFill');
const wishCount = document.getElementById('wishCount');
const WISH_KEY = 'travel-wishlist-v2';

let wishState = {};
try {
    wishState = JSON.parse(localStorage.getItem(WISH_KEY)) || {};
} catch (e) {
    wishState = {};
}

function syncWishUI() {
    const items = wishList.querySelectorAll('.wish-item');
    let done = 0;
    items.forEach(item => {
        const isDone = !!wishState[item.dataset.name];
        item.classList.toggle('done', isDone);
        item.setAttribute('aria-checked', String(isDone));
        if (isDone) done++;
    });
    const total = items.length;
    wishFill.style.width = (total ? (done / total) * 100 : 0) + '%';
    wishCount.textContent = '已点亮 ' + done + ' / ' + total + ' 个心愿';
}

wishList.querySelectorAll('.wish-item').forEach(item => {
    item.setAttribute('role', 'checkbox');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-checked', 'false');

    function toggleWish() {
        const name = item.dataset.name;
        const isDone = !wishState[name];
        wishState[name] = isDone;
        item.setAttribute('aria-checked', String(isDone));
        try {
            localStorage.setItem(WISH_KEY, JSON.stringify(wishState));
        } catch (e) { /* 隐私模式下存储不可用时忽略 */ }
        syncWishUI();
    }

    item.addEventListener('click', toggleWish);
    item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleWish();
        }
    });
});

syncWishUI();

// ===== 页脚年份自动更新 =====
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
