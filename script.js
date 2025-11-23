// Vertical-flow node-network background (blue theme) — increased brightness & glow
// Particles move upward, wrap to bottom, and draw brighter glowing connection lines.
// Respects prefers-reduced-motion. Exposes window.__bgVerticalNetwork for tweaking.
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      console.error('bg: canvas not found');
      return;
    }

    // enforce canvas behind content
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';

    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) {
      console.error('bg: 2D context not available');
      return;
    }

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) console.info('bg: prefers-reduced-motion detected — rendering static snapshot');

    let W = 0, H = 0, DPR = Math.max(1, window.devicePixelRatio || 1);
    let particles = [];
    let rafId = null;

    const cfg = {
      particleDensity: 1 / 60,   // increased density for brightness
      minR: 2.0,
      maxR: 6.0,
      vxRange: 0.36,
      vyMin: -2.0,               // faster upward motion
      vyMax: -0.6,
      connectDist: 180,         // longer connecting lines
      lineWidth: 1.4,
      color: { r: 120, g: 210, b: 255 }, // brighter cyan-blue
      softBlobAlpha: 0.12,      // brighter soft blobs
      particleAlphaBoost: 1.6   // multiplier to increase particle alpha visibility
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
      if (prefersReduced) render(performance.now());
    }

    function initParticles() {
      particles = [];
      const count = Math.max(20, Math.round(W * cfg.particleDensity));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rand(cfg.minR, cfg.maxR),
          vx: (Math.random() - 0.5) * cfg.vxRange,
          vy: rand(cfg.vyMin, cfg.vyMax),
          a: Math.min(0.9, (0.06 + Math.random() * 0.36) * cfg.particleAlphaBoost)
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
      const tt = t * 0.00014;
      const b1 = { x: W * 0.16 + Math.sin(tt) * W * 0.03, y: H * 0.25, r: Math.min(W, H) * 0.34, a: cfg.softBlobAlpha };
      const b2 = { x: W * 0.78 + Math.cos(tt * 1.05) * W * 0.04, y: H * 0.7, r: Math.min(W, H) * 0.26, a: cfg.softBlobAlpha * 0.95 };

      [b1, b2].forEach(b => {
        const grad = ctx.createRadialGradient(b.x, b.y, Math.max(2, b.r * 0.02), b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${b.a})`);
        grad.addColorStop(0.5, `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${b.a * 0.6})`);
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
      // give particles a subtle glow via shadowBlur
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},0.55)`;
      for (let p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawConnections() {
      const maxD2 = cfg.connectDist * cfg.connectDist;
      ctx.lineWidth = cfg.lineWidth;
      // glow effect using shadow, draw brighter lines
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowBlur = 14;
      ctx.shadowColor = `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},0.7)`;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= maxD2) {
            const t = 1 - (d2 / maxD2);
            const alpha = Math.min(1.0, 0.04 + t * 0.6) * ((a.a + b.a) * 0.75);
            ctx.strokeStyle = `rgba(${cfg.color.r},${cfg.color.g},${cfg.color.b},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
      // restore composite handled by ctx.restore()
    }

    function updateParticles() {
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // stronger wander because particles are brighter
        p.vx += (Math.random() - 0.5) * 0.03;
        p.vy += (Math.random() - 0.5) * 0.015;
        // wrap top -> bottom for vertical flow
        if (p.y < -80) {
          p.y = H + rand(10, 260);
          p.x = Math.random() * W;
          p.vy = rand(cfg.vyMin, cfg.vyMax);
        }
        if (p.x < -60) p.x = W + 60;
        if (p.x > W + 60) p.x = -60;
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
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    // expose debug handle
    window.__bgVerticalNetwork = { cfg, start, stop, resize, getParticleCount: () => particles.length };

    // initialize & resize handler
    window.addEventListener('resize', () => {
      clearTimeout(window._bgResizeTimeout);
      window._bgResizeTimeout = setTimeout(resize, 120);
    });
    resize();
    start();

    // ----------------- UI helpers -----------------
    // Set year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('nav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // Smooth anchors and active nav highlighting
    const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    function setActiveNav(name) {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('data-nav') === name));
    }
    navLinks.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const data = a.getAttribute('data-nav');
          setActiveNav(data);
          if (nav.classList.contains('open')) {
            nav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });

    // Highlight nav on scroll based on section in view (IntersectionObserver)
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            const id = en.target.id;
            const mapping = { hero: 'home', about: 'about', languages: 'skills', projects: 'projects', achievements: 'achievements', download: 'cv', contact: 'contact' };
            const name = mapping[id] || '';
            setActiveNav(name);
          }
        });
      }, { threshold: 0.35 });
      sections.forEach(s => io.observe(s));
    }

    // reveal-on-scroll (staggered)
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

    // Contact form fallback
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('contact-status');
    if (form) {
      form.addEventListener('submit', (e) => {
        if (form.action && form.action.includes('formspree.io')) return; // allow real submit
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
