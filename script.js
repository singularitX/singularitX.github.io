// ============================================================
//  Smooth inertia scroll (lerp-driven, native scroll based)
// ============================================================
const ScrollFX = (() => {
    let target = 0;
    let current = 0;
    let animated = 0;
    let last = 0;
    let velocity = 0;
    let direction = 0;
    let limit = 0;
    let rafId = null;
    const LERP = 0.09;
    const callbacks = [];

    function updateLimit() {
        const content = document.querySelector('.scroll-wrapper') || document.documentElement;
        limit = Math.max(0, content.scrollHeight - window.innerHeight);
        // Keep in bounds
        if (animated > limit) { target = animated = limit; }
    }

    function raf(time) {
        updateLimit();

        const diff = target - current;
        current += diff * LERP;
        if (Math.abs(diff) < 0.05) current = target;

        velocity = current - last;
        direction = Math.sign(velocity);
        last = current;
        animated = current;

        // Apply to wrapper
        const wrapper = document.querySelector('.scroll-wrapper');
        if (wrapper) {
            wrapper.style.transform = `translate3d(0, ${-current}px, 0)`;
        }

        // Fire listeners
        const data = {
            scroll: current,
            velocity,
            direction,
            progress: limit > 0 ? current / limit : 0,
            limit,
            raw: window.scrollY
        };
        callbacks.forEach(cb => cb(data));

        rafId = requestAnimationFrame(raf);
    }

    function start() {
        if (rafId) return;
        updateLimit();
        // Use native scroll position as starting point
        target = window.scrollY;
        current = target;
        last = target;
        animated = target;
        rafId = requestAnimationFrame(raf);
    }

    window.addEventListener('wheel', (e) => {
        target += e.deltaY;
        target = Math.max(0, Math.min(target, limit));
    }, { passive: true });

    let touchStartY = 0, touchStartTarget = 0;
    window.addEventListener('touchstart', (e) => {
        touchStartTarget = target;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        const dy = touchStartY - e.touches[0].clientY;
        target = touchStartTarget + dy;
        target = Math.max(0, Math.min(target, limit));
    }, { passive: true });

    window.addEventListener('resize', updateLimit);

    function on(cb) {
        callbacks.push(cb);
        return () => {
            const idx = callbacks.indexOf(cb);
            if (idx >= 0) callbacks.splice(idx, 1);
        };
    }

    function scrollTo(pos, { duration = 1.0, offset = 0 } = {}) {
        if (typeof pos === 'string') {
            const el = document.querySelector(pos);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            pos = current + rect.top + (offset || 0);
        }
        pos = Math.max(0, Math.min(pos, limit));
        const from = target;
        const to = pos;
        const t0 = performance.now();
        const dur = duration * 1000;
        function anim(time) {
            const p = Math.min((time - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
            target = from + (to - from) * eased;
            if (p < 1) requestAnimationFrame(anim);
        }
        requestAnimationFrame(anim);
    }

    return { start, on, scrollTo, updateLimit, get limit() { return limit; } };
})();

// ============================================================
//  Initialize
// ============================================================
function init() {
    const header = document.getElementById('site-header');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const sectionLinks = document.querySelectorAll('.nav-links a');

    // ── Header scroll state ────────────────────────────
    ScrollFX.on(({ scroll }) => {
        header?.classList.toggle('scrolled', scroll > 12);
    });

    // ── Feature parallax ───────────────────────────────
    const parallaxSection = document.querySelector('.parallax-section');
    const parallaxContent = document.querySelector('.parallax-content');
    if (parallaxSection && parallaxContent) {
        ScrollFX.on(({ scroll, limit }) => {
            const rect = parallaxSection.getBoundingClientRect();
            const top = rect.top + scroll;
            const rel = scroll - (top - window.innerHeight * 0.5);
            const factor = Math.max(-window.innerHeight * 0.15, Math.min(window.innerHeight * 0.15, rel * 0.12));
            parallaxContent.style.setProperty('--py', `${factor}px`);
        });
    }

    // ── Parallax images ────────────────────────────────
    const parallaxImages = document.querySelectorAll('.parallax-img');
    if (parallaxImages.length) {
        ScrollFX.on(({ scroll }) => {
            parallaxImages.forEach(img => {
                const container = img.closest('[data-parallax-container]') || img.parentElement;
                const rect = container.getBoundingClientRect();
                const top = rect.top + scroll;
                const h = rect.height;
                const center = top + h / 2;
                const rel = (scroll + window.innerHeight / 2 - center) / (window.innerHeight / 2 + h / 2);
                const clamped = Math.max(-1, Math.min(1, rel));
                const shift = -(clamped * h * 0.08);
                img.style.setProperty('--py-img', `${shift}px`);
            });
        });
    }

    // ── Arc hover cards ────────────────────────────────
    document.querySelectorAll('.hw-arc-card').forEach(card => {
        const arc = card.querySelector('.hw-arc');
        const onEnter = () => arc?.classList.add('running');
        const onLeave = () => arc?.classList.remove('running');
        card.addEventListener('mouseenter', onEnter);
        card.addEventListener('mouseleave', onLeave);
        card.addEventListener('focusin', onEnter);
        card.addEventListener('focusout', onLeave);
    });

    // ── Footer reveal ──────────────────────────────────
    const footerReveal = document.querySelector('.footer-reveal');
    if (footerReveal) {
        ScrollFX.on(({ scroll, limit }) => {
            const start = limit * 0.85;
            const end = limit - 1;
            let opacity = 0;
            if (scroll > start && limit > 0) {
                opacity = Math.min(1, (scroll - start) / (end - start));
            }
            footerReveal.style.setProperty('--hw-footer-opacity', opacity);
            footerReveal.style.setProperty('--hw-footer-pe', opacity > 0.98 ? 'auto' : 'none');
        });
    }

    // ── Nav toggle ─────────────────────────────────────
    navToggle?.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // ── Nav links scroll to ────────────────────────────
    sectionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.classList.remove('open');
            navToggle?.setAttribute('aria-expanded', 'false');
            const hash = link.getAttribute('href');
            if (hash) {
                ScrollFX.scrollTo(hash, { duration: 1.0, offset: -16 });
            }
        });
    });

    // ── Nav CTA scroll to contact ──────────────────────
    document.querySelector('.nav-cta')?.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.classList.remove('open');
        navToggle?.setAttribute('aria-expanded', 'false');
        const hash = e.currentTarget.getAttribute('href');
        if (hash) {
            ScrollFX.scrollTo(hash, { duration: 1.0, offset: -16 });
        }
    });

    // ── Hero action buttons scroll to ──────────────────
    // "查看作品"、"联系我"等按钮，统一走平滑滚动，避免原生锚点跳转打乱 transform 滚动状态
    document.querySelectorAll('.hero-actions a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = link.getAttribute('href');
            if (hash) {
                ScrollFX.scrollTo(hash, { duration: 1.0, offset: -16 });
            }
        });
    });

    // ── Brand click scrolls to top ─────────────────────
    document.querySelector('.brand')?.addEventListener('click', (e) => {
        e.preventDefault();
        ScrollFX.scrollTo(0, { duration: 0.6 });
    });

    // ── Footer "回到顶部" scrolls to top ───────────────
    document.querySelector('.footer a[href^="#"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        ScrollFX.scrollTo(0, { duration: 0.8 });
    });

    // ── Active nav tracking ────────────────────────────
    const sectionIds = ['home', ...[...sectionLinks].map(l => l.getAttribute('href').slice(1))];
    const brandLink = document.querySelector('.brand');
    ScrollFX.on(({ scroll }) => {
        const mid = scroll + window.innerHeight / 3;
        let activeId = sectionIds[0];
        for (const id of sectionIds) {
            const el = document.getElementById(id);
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const top = rect.top + scroll;
            if (mid >= top) activeId = id;
        }
        sectionLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
        });
        brandLink?.classList.toggle('active', activeId === 'home');
    });

    // ── Reveal animations ──────────────────────────────
    // 元素进入视口 15% 时淡入；完全离开视口时重置，再次进入会重新播放动画
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.15) {
                entry.target.classList.add('visible');
            } else if (!entry.isIntersecting) {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: [0, 0.15] });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ── Copy to clipboard ──────────────────────────────
    document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', async () => {
            const value = button.getAttribute('data-copy');
            const originalText = button.textContent;
            let ok = false;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(value);
                    ok = true;
                } else {
                    // file:// 等受限环境兜底：textarea + execCommand
                    const ta = document.createElement('textarea');
                    ta.value = value;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    ok = document.execCommand('copy');
                    document.body.removeChild(ta);
                }
            } catch {
                ok = false;
            }
            button.textContent = ok ? '已复制' : '复制失败';
            setTimeout(() => { button.textContent = originalText; }, 1600);
        });
    });
}

// ── Boot ───────────────────────────────────────────────
document.documentElement.classList.add('has-smooth-scroll');
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ScrollFX.start();
        requestAnimationFrame(init);
    });
} else {
    ScrollFX.start();
    requestAnimationFrame(init);
}
