/* ==========================================================================
   BrandLinker HQ — Subtle Ambient Warm VFX & Cinematic Parallax
   ========================================================================== */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  // 1. Ambient Floating Caramel & Cream Dust Motes Canvas
  const canvas = document.getElementById("vfx-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let rafId = null;

    const palette = [
      { r: 196, g: 138, b: 90 },  // Caramel #C48A5A
      { r: 231, g: 214, b: 193 }, // Latte #E7D6C1
      { r: 250, g: 246, b: 240 }  // Cream #FAF6F0
    ];

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(44, Math.max(18, Math.floor((width * height) / 36000)));
      particles = Array.from({ length: count }, () => createParticle(true));
    }

    function createParticle(randomY) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      const isBokeh = Math.random() < 0.18;
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 20,
        radius: isBokeh ? 10 + Math.random() * 22 : 0.9 + Math.random() * 2.1,
        vx: (Math.random() - 0.5) * (isBokeh ? 0.14 : 0.22),
        vy: -(isBokeh ? 0.08 + Math.random() * 0.14 : 0.12 + Math.random() * 0.28),
        alpha: isBokeh ? 0.03 + Math.random() * 0.045 : 0.14 + Math.random() * 0.28,
        phase: Math.random() * Math.PI * 2,
        speed: 0.006 + Math.random() * 0.012,
        color,
        isBokeh
      };
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.speed;
        p.x += p.vx + Math.sin(p.phase) * 0.14;
        p.y += p.vy;

        if (p.y < -40) {
          particles[i] = createParticle(false);
          continue;
        }
        if (p.x < -40) p.x = width + 40;
        if (p.x > width + 40) p.x = -40;

        const pulse = 0.72 + 0.28 * Math.sin(p.phase * 1.4);
        const a = p.alpha * pulse;

        if (p.isBokeh) {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${a})`);
          grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      rafId = window.requestAnimationFrame(tick);
    }

    resize();
    tick();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && !rafId) {
        tick();
      }
    });
  }

  // 2. Subtle Hero Scroll Parallax
  const heroImg = document.querySelector(".hero__media img");
  if (heroImg) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const y = Math.min(window.scrollY, window.innerHeight);
          const offset = y * 0.14;
          heroImg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
          ticking = false;
        });
      },
      { passive: true }
    );
  }
})();
