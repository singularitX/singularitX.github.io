import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

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

const canvas = document.getElementById('robotCanvas');
if (canvas) {
const renderer = new THREE.WebGLRenderer({
canvas,
alpha: true,
antialias: true
});
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camera.position.set(0, 1, 5);

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputEncoding = THREE.sRGBEncoding;

const ambient = new THREE.AmbientLight(0xffffff, 1);

scene.add(ambient);

const directional = new THREE.DirectionalLight(0x5b7cf0, 2);

directional.position.set(5, 5, 5);

scene.add(directional);

const rim = new THREE.DirectionalLight(0x2dbfb6, 1);

rim.position.set(-5, 0, -5);

scene.add(rim);

let robot;

const loader = new GLTFLoader();

loader.load(
    './crossspace_robot_default_skin.glb',

    (gltf) => {
        robot = gltf.scene;

        robot.scale.set(1.8, 1.8, 1.8);

        robot.position.y = -1;

        scene.add(robot);
    },

    undefined,

    (error) => {
        console.error('GLB 加载失败:', error);
    }
);

let mouseX = 0;

let targetRotation = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;

    targetRotation = mouseX * 0.5;
});

function animate() {
    requestAnimationFrame(animate);

    if (robot) {
        robot.rotation.y += (targetRotation - robot.rotation.y) * 0.05;

        robot.position.y =
            -1 + Math.sin(Date.now() * 0.0015) * 0.08;
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});
}
