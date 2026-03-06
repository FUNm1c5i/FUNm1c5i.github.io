/* ===============================
   PAGE LOADER (MIN RANDOM 3-5s + WAIT UNTIL LOADED)
================================ */
const bodyEl = document.body;
const loaderEl = document.getElementById("siteLoader");

if (loaderEl) {
    const minLoaderMs = 3000 + Math.random() * 2000;
    let minTimeReached = false;
    let pageLoaded = document.readyState === "complete";

    const hideLoader = () => {
        loaderEl.classList.add("is-hidden");
        bodyEl.classList.remove("loading");

        let removed = false;
        const cleanup = () => {
            if (removed) return;
            removed = true;
            loaderEl.remove();
        };

        loaderEl.addEventListener("transitionend", cleanup, { once: true });
        window.setTimeout(cleanup, 800);
    };

    const maybeHideLoader = () => {
        if (minTimeReached && pageLoaded) {
            hideLoader();
        }
    };

    window.setTimeout(() => {
        minTimeReached = true;
        maybeHideLoader();
    }, minLoaderMs);

    if (pageLoaded) {
        maybeHideLoader();
    } else {
        window.addEventListener("load", () => {
            pageLoaded = true;
            maybeHideLoader();
        }, { once: true });
    }
} else {
    bodyEl.classList.remove("loading");
}

/* ===============================
   CONFIG
================================ */
const IS_MOBILE = window.matchMedia("(max-width: 768px)").matches;

const MOTION = {
    polygonCount: IS_MOBILE ? 8 : 14,
    orbitRadiusMin: IS_MOBILE ? 90 : 120,
    orbitRadiusRange: IS_MOBILE ? 170 : 260,
    orbitSpeedMin: IS_MOBILE ? 0.09 : 0.18,
    orbitSpeedRange: IS_MOBILE ? 0.18 : 0.32,
    spinSpeedMin: IS_MOBILE ? 6 : 10,
    spinSpeedRange: IS_MOBILE ? 18 : 40,
    parallaxRange: IS_MOBILE ? 55 : 120
};
const SHAPES = [
    "0,-60 52,-30 52,30 0,60 -52,30 -52,-30", // hex
    "0,-70 66,-22 41,60 -41,60 -66,-22",     // pentagon
    "0,-80 80,0 0,80 -80,0"                  // diamond
];

const COLORS = [
    "#00ff99",
    "#00ccff",
    "#ff00ff",
    "#ffaa00",
    "#66ff66"
];

const orbitRoot = document.getElementById("orbit-root");
const polygons = [];

/* ===============================
   CREATE POLYGONS
================================ */
for (let i = 0; i < MOTION.polygonCount; i++) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const layerCount = IS_MOBILE ? (Math.random() < 0.35 ? 3 : 2) : 2 + Math.floor(Math.random() * 2); // 2-3 layers

    for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const scale = 1 - layerIndex * 0.23;

        p.setAttribute("points", shape);
        p.style.color = color;
        p.style.opacity = String(0.95 - layerIndex * 0.22);
        p.style.strokeWidth = String(Math.max(IS_MOBILE ? 0.9 : 1.1, (IS_MOBILE ? 1.7 : 2) - layerIndex * 0.35));

        gsap.set(p, {
            scale,
            rotation: layerIndex * 10,
            transformOrigin: "center"
        });

        g.appendChild(p);
    }

    orbitRoot.appendChild(g);

    const orbitAngle = Math.random() * Math.PI * 2;
    const orbitRadius = MOTION.orbitRadiusMin + Math.random() * MOTION.orbitRadiusRange;
    const orbitSpeed = (MOTION.orbitSpeedMin + Math.random() * MOTION.orbitSpeedRange) * (Math.random() > 0.5 ? 1 : -1);
    const selfRotation = Math.random() * 360;
    const selfSpinSpeed = (MOTION.spinSpeedMin + Math.random() * MOTION.spinSpeedRange) * (Math.random() > 0.5 ? 1 : -1);
    const depth = 0.15 + Math.random() * 0.6;
    const baseScale = 0.5 + Math.random();

    gsap.set(g, {
        x: Math.cos(orbitAngle) * orbitRadius,
        y: Math.sin(orbitAngle) * orbitRadius,
        rotation: selfRotation,
        scale: baseScale,
        opacity: 0,
        transformOrigin: "center"
    });

    polygons.push({
        g,
        depth,
        orbitAngle,
        orbitRadius,
        orbitSpeed,
        selfRotation,
        selfSpinSpeed,
        baseScale
    });
}

function runVisibilityCycle(polygonState) {
    const fadeIn = 0.6 + Math.random() * 1.2;
    const holdVisible = 1.2 + Math.random() * 3.2;
    const fadeOut = 0.7 + Math.random() * 1.4;
    const hiddenPause = 0.4 + Math.random() * 2.8;

    const appearScale = polygonState.baseScale * (0.92 + Math.random() * 0.12);
    const peakScale = polygonState.baseScale * (1.08 + Math.random() * 0.28);

    const tl = gsap.timeline({
        onComplete: () => runVisibilityCycle(polygonState)
    });

    tl.set(polygonState.g, {
        opacity: 0,
        scale: appearScale
    });

    tl.to(polygonState.g, {
        opacity: 0.95,
        scale: peakScale,
        duration: fadeIn,
        ease: "sine.out"
    }, hiddenPause);

    tl.to({}, { duration: holdVisible });

    tl.to(polygonState.g, {
        opacity: 0,
        scale: polygonState.baseScale * 0.9,
        duration: fadeOut,
        ease: "sine.in"
    });
}

polygons.forEach(p => {
    gsap.delayedCall(Math.random() * 3.5, () => runVisibilityCycle(p));
});

/* ===============================
   MOUSE PARALLAX + ORBIT
================================ */
let mouse = { x: 0, y: 0 };
let target = { x: 0, y: 0 };
let lastTime = performance.now();

window.addEventListener("mousemove", e => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * MOTION.parallaxRange;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * MOTION.parallaxRange;
});

window.addEventListener("mouseleave", () => {
    mouse.x = 0;
    mouse.y = 0;
});

gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    target.x += (mouse.x - target.x) * 0.04;
    target.y += (mouse.y - target.y) * 0.04;

    polygons.forEach(p => {
        p.orbitAngle += p.orbitSpeed * dt;
        p.selfRotation += p.selfSpinSpeed * dt;

        const orbitalX = Math.cos(p.orbitAngle) * p.orbitRadius;
        const orbitalY = Math.sin(p.orbitAngle) * p.orbitRadius;

        gsap.set(p.g, {
            x: orbitalX + target.x * p.depth,
            y: orbitalY + target.y * p.depth,
            rotation: p.selfRotation
        });
    });
});

/* ===============================
   TEXT DECODER EFFECT
================================ */
const textEl = document.getElementById("thankYouText");
const originalText = "TO BE ANNOUNCED BY NNOIYEDWARE";
const charsDesktop = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
const isMobileDecoder = window.matchMedia("(max-width: 768px)").matches;
const chars = isMobileDecoder ? "ABCDEFGHIJKLM" : charsDesktop;
const decoderDuration = isMobileDecoder ? 0.8 : 1.2;
const decoderStagger = isMobileDecoder ? 0.16 : 0.06;
const decoderPause = isMobileDecoder ? 1.6 : 1.2;

const words = originalText.split(" ");
const letters = [];

words.forEach((word, wordIndex) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "word";

    [...word].forEach(char => {
        const letterSpan = document.createElement("span");
        letterSpan.className = "letter";
        letterSpan.dataset.char = char;
        letterSpan.textContent = char;
        wordSpan.appendChild(letterSpan);
        letters.push(letterSpan);
    });

    textEl.appendChild(wordSpan);

    if (wordIndex < words.length - 1) {
        textEl.appendChild(document.createTextNode(" "));
    }
});

let mobilePhase = 0;

function runDecoder() {
    const tl = gsap.timeline({
        onComplete: () => {
            if (isMobileDecoder) {
                mobilePhase = mobilePhase === 0 ? 1 : 0;
            }

            gsap.delayedCall(decoderPause, runDecoder);
        }
    });

    letters.forEach((letter, i) => {
        if (isMobileDecoder && i % 2 !== mobilePhase) {
            return;
        }

        tl.to({}, {
            duration: decoderDuration,
            onUpdate: () => {
                letter.textContent = chars[Math.floor(Math.random() * chars.length)];
            },
            onComplete: () => {
                letter.textContent = letter.dataset.char;
            }
        }, i * decoderStagger);
    });
}

runDecoder();




