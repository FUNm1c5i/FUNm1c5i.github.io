document.addEventListener('DOMContentLoaded', () => {
    // 1. GENERATE POLYGONS (The 'while' loop logic)
    const bg = document.getElementById('bg');
    let n = 15; 
    while (n--) {
        const poly = document.createElement('div');
        poly.className = 'poly';
        
        // Random placement and color
        const x = (Math.random() * 100 - 50) + "vw";
        const y = (Math.random() * 100 - 50) + "vh";
        const left = Math.random() * 100 + "vw";
        const top = Math.random() * 100 + "vh";
        const hue = Math.floor(Math.random() * 360);
        const delay = -(Math.random() * 6) + "s";

        poly.style.cssText = `
            left: ${left}; top: ${top};
            --x: ${x}; --y: ${y}; --hue: ${hue}; --delay: ${delay};
            --p0: polygon(50% 0%, 0% 100%, 100% 100%);
            --p1: polygon(50% 10%, 10% 90%, 90% 90%);
        `;
        bg.appendChild(poly);
    }

    // 2. TEXT DECODER ANIMATION
    const textElement = document.getElementById('thankYouText');
    const originalText = "To be announced by nNoiyedWare";
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_-+=[]{}|;:,.<>?';

    originalText.split('').forEach(char => {
        const span = document.createElement('span');
        span.innerHTML = char === ' ' ? '&nbsp;' : char;
        textElement.appendChild(span);
    });

    const letters = Array.from(textElement.children);

    function createDecoderAnimation() {
        const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(1, () => tl.restart()) });

        letters.forEach((letter, i) => {
            const originalChar = letter.innerHTML;
            if (originalChar === '&nbsp;') return;
            let proxy = { charIndex: 0 };
            tl.to(proxy, {
                charIndex: chars.length - 1,
                duration: 1.5,
                ease: "power2.inOut",
                onUpdate: () => {
                    letter.textContent = chars[Math.floor(Math.random() * chars.length)];
                },
                onComplete: () => { letter.textContent = originalChar; }
            }, i * 0.1);
        });
        tl.to({}, { duration: 2 });
    }
    createDecoderAnimation();
});
