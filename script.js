/* ===============================
   CONFIG
================================ */
const POLYGON_COUNT = 14;
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
for (let i = 0; i < POLYGON_COUNT; i++) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");

    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    p.setAttribute("points", shape);
    p.style.color = color;

    g.appendChild(p);
    orbitRoot.appendChild(g);

    const angle = Math.random() * 360;
    const radius = 120 + Math.random() * 260;
    const depth = 0.15 + Math.random() * 0.6;
    const scale = 0.5 + Math.random();

    const baseX = Math.cos(angle * Math.PI / 180) * radius;
    const baseY = Math.sin(angle * Math.PI / 180) * radius;

    gsap.set(g, {
        x: baseX,
        y: baseY,
        rotation: angle,
        scale,
        transformOrigin: "center"
    });

    gsap.to(g, {
        scale: scale * 1.2,
        opacity: 0,
        duration: 4 + Math.random() * 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: Math.random() * 2
    });

    polygons.push({ g, depth, baseX, baseY });
}

/* ===============================
   MOUSE PARALLAX / ORBIT
================================ */
let mouse = { x: 0, y: 0 };
let target = { x: 0, y: 0 };

window.addEventListener("mousemove", e => {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 120;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 120;
});

window.addEventListener("mouseleave", () => {
    mouse.x = 0;
    mouse.y = 0;
});

gsap.ticker.add(() => {
    target.x += (mouse.x - target.x) * 0.04;
    target.y += (mouse.y - target.y) * 0.04;

    polygons.forEach(p => {
        gsap.set(p.g, {
            x: p.baseX + target.x * p.depth,
            y: p.baseY + target.y * p.depth
        });
    });
});

/* ===============================
   TEXT DECODER EFFECT
================================ */
const textEl = document.getElementById("thankYouText");
const originalText = "TO BE ANNOUNCED BY NNOIYEDWARE";
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

originalText.split("").forEach(c => {
    const s = document.createElement("span");
    s.innerHTML = c === " " ? "&nbsp;" : c;
    textEl.appendChild(s);
});

const letters = [...textEl.children];

function runDecoder() {
    const tl = gsap.timeline({
        onComplete: () => gsap.delayedCall(1.2, runDecoder)
    });

    letters.forEach((l, i) => {
        if (l.innerHTML === "&nbsp;") return;

        tl.to({}, {
            duration: 1.2,
            onUpdate: () => {
                l.textContent = chars[Math.floor(Math.random() * chars.length)];
            },
            onComplete: () => {
                l.textContent = originalText[i];
            }
        }, i * 0.06);
    });
}

runDecoder();
