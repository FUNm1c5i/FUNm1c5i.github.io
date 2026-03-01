// script.js
// Put this file next to index.html and open index.html in the browser.

// Strict mode
'use strict';

(() => {
  // CONFIG
  const POLYGONS = 16;            // total polygons
  const COLORS = ['#00ffff','#ff4fd8','#9d6bff','#00ff99','#ffd166','#66ffd9','#ff9a66'];
  const MIN_RADIUS = 100;        // min orbit radius
  const MAX_RADIUS = 420;        // max orbit radius
  const MIN_SIZE = 28;          // polygon "radius" size
  const MAX_SIZE = 110;
  const MIN_SIDES = 5;
  const MAX_SIDES = 9;
  const RIPPLE_PERIOD = 3.2;    // seconds for ripple to go from center to edge
  const PARALLAX_STRENGTH = 0.12; // how much polygons shift individually with mouse
  const ORBIT_ROTATION_DURATION = 90; // seconds for global orbit rotation
  const ORBIT_MOUSE_RATIO = 0.18; // how strongly mouse moves the whole orbit (low ratio)
  const CENTER_EASE = 0.06;      // how quickly orbit recenters when mouse still

  // DOM
  const orbitRoot = document.getElementById('orbitRoot');
  const svgEl = document.getElementById('bg');

  // mouse state
  let mouse = { x: 0, y: 0, active: false };
  let target = { x: 0, y: 0 }; // smoothed target for orbitRoot

  // helper to create SVG elements
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const create = (tag) => document.createElementNS(SVG_NS, tag);

  // polygon point generator (regular polygon)
  function polygonPoints(sides, radius) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 - Math.PI / 2; // start at top
      pts.push((Math.cos(a) * radius).toFixed(3) + ',' + (Math.sin(a) * radius).toFixed(3));
    }
    return pts.join(' ');
  }

  // store polygon metadata
  const polygons = [];
  let maxRadiusSeen = 0;

  // create polygons
  for (let i = 0; i < POLYGONS; i++) {
    const depth = Math.random(); // 0..1
    const sides = Math.floor(gsap.utils.random(MIN_SIDES, MAX_SIDES, 1));
    const size = gsap.utils.interpolate(MIN_SIZE, MAX_SIZE, depth);
    const color = gsap.utils.random(COLORS);
    const radius = gsap.utils.random(MIN_RADIUS, MAX_RADIUS);
    const angle = Math.random() * 360;

    if (radius > maxRadiusSeen) maxRadiusSeen = radius;

    // group to hold layers; use GSAP-friendly transforms (rotation via GSAP, x/y for parallax)
    const g = create('g');
    g.setAttribute('transform', `rotate(${angle}) translate(${radius} 0)`);
    orbitRoot.appendChild(g);

    // multilayer: large blurred outer glow, smaller mid glow, core stroke
    const outer = create('polygon');
    outer.setAttribute('points', polygonPoints(sides, size));
    outer.setAttribute('stroke', color);
    outer.setAttribute('stroke-width', Math.max(6, Math.round(size * 0.08)));
    outer.setAttribute('fill', 'none');
    outer.setAttribute('opacity', 0.22);
    outer.setAttribute('filter', 'url(#neon-lg)');

    const mid = create('polygon');
    mid.setAttribute('points', polygonPoints(sides, size - Math.max(2, size * 0.06)));
    mid.setAttribute('stroke', color);
    mid.setAttribute('stroke-width', Math.max(3, Math.round(size * 0.05)));
    mid.setAttribute('fill', 'none');
    mid.setAttribute('opacity', 0.28);
    mid.setAttribute('filter', 'url(#neon-sm)');

    const core = create('polygon');
    core.setAttribute('points', polygonPoints(sides, size - Math.max(6, size * 0.10)));
    core.setAttribute('stroke', color);
    core.setAttribute('stroke-width', 1.6);
    core.setAttribute('fill', 'none');
    core.setAttribute('opacity', 1);

    g.appendChild(outer);
    g.appendChild(mid);
    g.appendChild(core);

    // initial transform scale based on depth (depth 0 => small; 1 => full)
    const baseScale = gsap.utils.interpolate(0.45, 1.0, depth);

    // set starting values
    gsap.set(g, { scale: baseScale, transformOrigin: 'center center', opacity: 0.0 });

    // continuous spin
    const spinDur = gsap.utils.random(12, 28);
    gsap.to(g, { rotation: gsap.utils.random(-360, 360), duration: spinDur, repeat: -1, ease: 'none' });

    // ripple-style pulse: delay based on radial distance so center -> outward ripple
    const distRatio = radius / MAX_RADIUS;
    const pulseDelay = distRatio * RIPPLE_PERIOD; // how far into the ripple this polygon starts

    // repeating pulse: slight scale increase and temporary opacity bump, yoyo
    const pulseScale = baseScale * gsap.utils.interpolate(1.0, 1.22, 1 - depth * 0.45);
    gsap.to(g, {
      scale: pulseScale,
      opacity: 0.95,
      duration: 0.9,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: pulseDelay,
      repeatDelay: Math.max(1.2, RIPPLE_PERIOD * 0.8)
    });

    // store for parallax updates
    polygons.push({ g, depth, radius, baseScale });
  }

  // global orbit rotation (slow)
  gsap.to(orbitRoot, { rotation: 360, duration: ORBIT_ROTATION_DURATION, repeat: -1, ease: 'none' });

  // MOUSE / PARALLAX
  function onMove(e) {
    mouse.active = true;
    // normalized centered -1..1
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    // scale to px translation magnitude for orbit root
    mouse.x = nx * 100 * ORBIT_MOUSE_RATIO;
    mouse.y = ny * 60 * ORBIT_MOUSE_RATIO;
  }

  function onLeave() {
    mouse.active = false;
    // when mouse leaves, let smoothing return orbit to center (mouse.x will be 0 next tick not forcibly)
    mouse.x = 0;
    mouse.y = 0;
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseleave', onLeave);
  window.addEventListener('blur', onLeave);

  // Smooth follow & per-polygon parallax using gsap.ticker
  gsap.ticker.add(() => {
    // smooth target easing
    target.x += (mouse.x - target.x) * CENTER_EASE;
    target.y += (mouse.y - target.y) * CENTER_EASE;

    // apply to orbit root as x,y (GSAP will handle svg translation)
    gsap.set(orbitRoot, { x: target.x, y: target.y });

    // per-polygon micro-parallax (adds on top of group's translation)
    for (let i = 0; i < polygons.length; i++) {
      const p = polygons[i];
      // parallax scaled by depth: deeper (depth ~1) moves less; invert depth so front moves more
      const frontness = 1 - p.depth; // 0..1 (1=front)
      const px = target.x * frontness * PARALLAX_STRENGTH * 6;
      const py = target.y * frontness * PARALLAX_STRENGTH * 4;
      // set small x/y offsets per polygon; keep GSAP-managed rotation intact
      gsap.set(p.g, { x: px, y: py });
    }
  });

  // ---- DECODER TEXT EFFECT (like original)
  (function decoderText() {
    const textEl = document.getElementById('thankYouText');
    const originalText = 'To be announced by nNoiyedWare';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()_-+=[]{}|;:,.<>?';
    // build spans
    originalText.split('').forEach(ch => {
      const s = document.createElement('span');
      s.textContent = ch; // preserve spaces
      textEl.appendChild(s);
    });

    const letters = Array.from(textEl.children);

    function runDecoder() {
      const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(1.1, () => tl.restart()) });

      letters.forEach((letter, i) => {
        const originalChar = letter.textContent;
        if (/\s/.test(originalChar)) return; // skip whitespace

        // animate a proxy value but use onUpdate to set random chars
        const proxy = { t: 0 };
        tl.to(proxy, {
          t: 1,
          duration: 1.25,
          ease: 'power2.inOut',
          onUpdate: () => {
            // random char each update
            letter.textContent = chars[Math.floor(Math.random() * chars.length)];
          },
          onComplete: () => {
            letter.textContent = originalChar;
          }
        }, i * 0.06); // stagger
      });

      // small pause after finishing
      tl.to({}, { duration: 2 });
    }

    runDecoder();
  })();

  // Responsive: if viewport changes, nothing needs rebuilding (SVG is vector), but we cap maxRadius recalculation if desired.
  window.addEventListener('resize', () => {
    // optional: update if you'd like to change max radius with size
  });

})();
