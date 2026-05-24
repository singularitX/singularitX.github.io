const header = document.getElementById('site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');
const sectionLinks = document.querySelectorAll('.nav-links a');

function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 12);
}

updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
});

sectionLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const sections = [...sectionLinks]
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        sectionLinks.forEach(link => {
            const isActive = link.getAttribute('href') === `#${entry.target.id}`;
            link.classList.toggle('active', isActive);
        });
    });
}, { threshold: 0.42 });

sections.forEach(section => activeObserver.observe(section));

document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
        const value = button.getAttribute('data-copy');
        const originalText = button.textContent;

        try {
            await navigator.clipboard.writeText(value);
            button.textContent = '已复制';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1600);
        } catch {
            button.textContent = '复制失败';
            setTimeout(() => {
                button.textContent = originalText;
            }, 1600);
        }
    });
});

// ===== 深色模式切换 =====
(function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const STORAGE_KEY = 'theme';
    const DARK = 'dark';

    function apply(theme) {
        if (theme === DARK) {
            document.documentElement.setAttribute('data-theme', DARK);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === DARK) apply(DARK);

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.hasAttribute('data-theme');
        const next = isDark ? null : DARK;
        apply(next);
        localStorage.setItem(STORAGE_KEY, next || 'light');
    });
})();
