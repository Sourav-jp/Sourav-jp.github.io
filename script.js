// Vertical-flow node-network background (blue theme)
// Particles move upward, wrap to bottom, and draw glowing connection lines.
// Respects prefers-reduced-motion and scales for devicePixelRatio.
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      console.error('bg: #bg-canvas missing');
      return;
    }

    // ensure canvas visible behind content
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) {
      console.error('bg: 2D context unavailable');
      return;
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) console.info('bg: prefers-reduced-motion enabled — rendering single frame');

    let W = 0, H = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
    let particles = [];
    let rafId = null;
    let lastTime = performance.now();

    const cfg = {
      particleDensity: 1 / 90,   // particles per px of width
      minR: 1.6,
      maxR: 4.8,
      vxRange: 0.24,
      vyMin: -0.95,              // upward speed min (more negative -> faster)
      vyMax: -0.25,              // upward speed max
      connectDist: 150,
      lineWidth: 0.9,
      color: { r: 61, g: 168, b: 255 }, // cyan-blue
      softBlobAlpha: 0.06
    };

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function resize() {
      DPR = Math.max(1, window.devicePixelRatio || 1);
      W = Math.max(320, window.innerWidth);
      H = Math.max(320, window.innerHeight);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initParticles();
      // render a single static frame if reduced motion
      if (prefersReduced) render(performance.now());
    }

    function initParticles() {
      particles = [];
      const count = Math.max(12, Math.round(W * cfg.particleDensity));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(cfg.minR, cfg.maxR),
          vx: (Math.random() - 0.5) * cfg.vxRange,
          vy: rand(cfg.vyMin, cfg.vyMax),
          a: 0.04 + Math.random() * 0.18
        });
      }
    }

    function clearBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#021322');
      g.addColorStop(1, '#031d2b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function drawSoftBlobs(t) {
      // 2 soft radial blobs for depth
      const tt = t * 0.00012;
      const b1 = { x: W * 0.18 + Math.sin(tt) * W * 0.02, y: H * 0.24, r: Math.min(W, H) * 0.3, a: cfg.softBlobAlpha };
      const b2 = { x: W * 0.78 + Math.cos(tt * 1.1) * W * 0.03, y: H * 0.72, r: Math.min(W, H) * 0.22, a: cfg.softBlobAlpha * 0.8 };

      [b1, b2].forEach(b => {
        const grad = ctx.createRadialGradient(b.x, b.y, Math.max(2, b.r * 0.02), b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${b.a})`);
        grad.addColorStop(0.5, `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${b.a * 0.5})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      });
    }

    function drawParticles() {
      for (let p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawConnections() {
      const maxD2 = cfg.connectDist * cfg.connectDist;
      ctx.lineWidth = cfg.lineWidth;
      // Use lighter composite for glow feel
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= maxD2) {
            const t = 1 - (d2 / maxD2);
            const alpha = Math.min(0.85, 0.02 + t * 0.38) * ((a.a + b.a) * 0.8);
            ctx.strokeStyle = `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function updateParticles() {
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // gentle wander
        p.vx += (Math.random() - 0.5) * 0.01;
        p.vy += (Math.random() - 0.5) * 0.006;
        // wrap top -> bottom to create continuous upward flow
        if (p.y < -40) {
          p.y = H + rand(10, 80);
          p.x = Math.random() * W;
          p.vy = rand(cfg.vyMin, cfg.vyMax);
        }
        // horizontal wrap
        if (p.x < -30) p.x = W + 30;
        if (p.x > W + 30) p.x = -30;
      }
    }

    function render(t) {
      clearBackground();
      drawSoftBlobs(t);
      drawParticles();
      drawConnections();
    }

    function loop(t) {
      render(t);
      updateParticles();
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (prefersReduced) {
        render(performance.now());
        return;
      }
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // Expose debug handle
    window.__bgVerticalNetwork = {
      start,
      stop,
      resize,
      cfg,
      getParticleCount: () => particles.length
    };

    // Init
    window.addEventListener('resize', () => {
      clearTimeout(window._bgResizeTimeout);
      window._bgResizeTimeout = setTimeout(resize, 120);
    });

    console.info('bg: vertical network init');
    resize();
    start();

    // --- small UI helpers (nav, anchors, year, reveals, contact) ---
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    const navToggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('nav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    const reveals = Array.from(document.querySelectorAll('.reveal'));
    if ('IntersectionObserver' in window) {
      const ro = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            ro.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(0.55, i * 0.06)}s`;
        ro.observe(el);
      });
    } else {
      reveals.forEach(el => el.classList.add('in-view'));
    }

    // contact form fallback
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('contact-status');
    if (form) {
      form.addEventListener('submit', (e) => {
        if (form.action && form.action.includes('formspree.io')) return;
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = 'Thanks — your message has been received (demo).';
          form.reset();
          setTimeout(() => { statusEl.textContent = ''; }, 3500);
        } else {
          alert('Thanks — your message has been received (demo).');
          form.reset();
        }
      });
    }
  });
})();
