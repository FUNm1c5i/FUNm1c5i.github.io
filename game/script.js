const bodyEl = document.body;
const loaderEl = document.getElementById('siteLoader');

if (loaderEl) {
    const minLoaderMs = 1800 + Math.random() * 1200;
    let minTimeReached = false;
    let pageLoaded = document.readyState === 'complete';

    const hideLoader = () => {
        loaderEl.classList.add('is-hidden');
        bodyEl.classList.remove('loading');
        window.setTimeout(() => loaderEl.remove(), 800);
    };

    const maybeHideLoader = () => {
        if (minTimeReached && pageLoaded) hideLoader();
    };

    window.setTimeout(() => {
        minTimeReached = true;
        maybeHideLoader();
    }, minLoaderMs);

    if (pageLoaded) {
        maybeHideLoader();
    } else {
        window.addEventListener('load', () => {
            pageLoaded = true;
            maybeHideLoader();
        }, { once: true });
    }
}

const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

const MOTION = {
    polygonCount: IS_MOBILE ? 8 : 13,
    orbitRadiusMin: IS_MOBILE ? 85 : 110,
    orbitRadiusRange: IS_MOBILE ? 180 : 280,
    orbitSpeedMin: IS_MOBILE ? 0.08 : 0.14,
    orbitSpeedRange: IS_MOBILE ? 0.15 : 0.26,
    spinSpeedMin: IS_MOBILE ? 8 : 11,
    spinSpeedRange: IS_MOBILE ? 15 : 27,
    parallaxRange: IS_MOBILE ? 30 : 80
};

const SHAPES = [
    '0,-90 75,-30 48,78 -48,78 -75,-30',
    '0,-70 70,0 0,70 -70,0',
    '0,-80 35,-20 80,0 35,20 0,80 -35,20 -80,0 -35,-20'
];

const COLORS = ['#00e5ff', '#7c4dff', '#00ff9d', '#ff4081', '#ffea00'];
const orbitRoot = document.getElementById('orbit-root');
const polygons = [];

for (let i = 0; i < MOTION.polygonCount; i++) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

    p.setAttribute('points', SHAPES[Math.floor(Math.random() * SHAPES.length)]);
    p.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    g.appendChild(p);
    orbitRoot.appendChild(g);

    const orbitAngle = Math.random() * Math.PI * 2;
    const orbitRadius = MOTION.orbitRadiusMin + Math.random() * MOTION.orbitRadiusRange;
    const orbitSpeed = (MOTION.orbitSpeedMin + Math.random() * MOTION.orbitSpeedRange) * (Math.random() > 0.5 ? 1 : -1);
    const selfSpinSpeed = (MOTION.spinSpeedMin + Math.random() * MOTION.spinSpeedRange) * (Math.random() > 0.5 ? 1 : -1);
    const baseScale = 0.35 + Math.random() * 0.95;
    const depth = 0.2 + Math.random() * 0.6;

    polygons.push({ g, orbitAngle, orbitRadius, orbitSpeed, selfRotation: Math.random() * 360, selfSpinSpeed, baseScale, depth });

    gsap.set(g, {
        x: Math.cos(orbitAngle) * orbitRadius,
        y: Math.sin(orbitAngle) * orbitRadius,
        rotation: Math.random() * 360,
        scale: baseScale,
        opacity: 0
    });

    gsap.to(g, {
        opacity: 0.95,
        duration: 1 + Math.random() * 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 2
    });
}

let mouse = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let lastTime = performance.now();

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth - 0.5) * MOTION.parallaxRange;
    mouse.y = (event.clientY / window.innerHeight - 0.5) * MOTION.parallaxRange;
});

window.addEventListener('mouseleave', () => {
    mouse.x = 0;
    mouse.y = 0;
});

gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    target.x += (mouse.x - target.x) * 0.05;
    target.y += (mouse.y - target.y) * 0.05;

    polygons.forEach((item) => {
        item.orbitAngle += item.orbitSpeed * dt;
        item.selfRotation += item.selfSpinSpeed * dt;

        const x = Math.cos(item.orbitAngle) * item.orbitRadius;
        const y = Math.sin(item.orbitAngle) * item.orbitRadius;

        gsap.set(item.g, {
            x: x + target.x * item.depth,
            y: y + target.y * item.depth,
            rotation: item.selfRotation
        });
    });
});

const headlineEl = document.getElementById('headline');
const text = 'HOW DID WE GET HERE?';
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789?';

const letters = [];
text.split(' ').forEach((word, wordIndex, wordList) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word';

    [...word].forEach((char) => {
        const letterSpan = document.createElement('span');
        letterSpan.className = 'letter';
        letterSpan.dataset.char = char;
        letterSpan.textContent = char;
        wordSpan.appendChild(letterSpan);
        letters.push(letterSpan);
    });

    headlineEl.appendChild(wordSpan);
    if (wordIndex < wordList.length - 1) headlineEl.appendChild(document.createTextNode(' '));
});

function runDecoder() {
    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(1.4, runDecoder) });

    letters.forEach((letter, index) => {
        const revealAt = index * 0.055;

        tl.to(letter, {
            duration: 0.5,
            onUpdate: () => {
                letter.textContent = chars[Math.floor(Math.random() * chars.length)];
            }
        }, revealAt);

        tl.to(letter, {
            duration: 0.01,
            onComplete: () => {
                letter.textContent = letter.dataset.char;
            }
        }, revealAt + 0.48);
    });
}

runDecoder();