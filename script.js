// Enhanced background with soft blobs + drifting particles + network connections
// Inspired by Amr Kahaleed style + node-line network effect
(() => {
  // DOM ready helper
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas && canvas.getContext ? canvas.getContext('2d', { alpha: true }) : null;
    if (!canvas || !ctx) {
      console.warn('bg-canvas or 2D context not available.');
      return;
    }

    // respect prefers-reduced-motion
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1);
    let blobs = [], particles = [], strips = [], noiseCanvas = null, scanlineCanvas = null;
    let last = performance.now();

    const config = {
      blobCountFactor: 1 / 700,
      particleDensity: 1 / 90,
      stripCountFactor: 1 / 700,
      colors: [
        'rgba(31,174,138,', // main green-ish
        'rgba(86,196,168,',
        'rgba(150,225,205,'
      ],
      blobAlpha: 0.08,
      particleAlphaRange: [0.02, 0.12],
      particleRadiusRange: [3, 18],
      fpsLimit: 60,
      connectDistance: 140,        // max px between nodes to draw a line
      connectLineWidth: 0.85,
      connectColor: '31,174,138'  // r,g,b used to build rgba
    };

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function createNoiseCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.floor(w / 2));
      c.height = Math.max(1, Math.floor(h / 2));
      const g = c.getContext('2d');
      const img = g.createImageData(c.width, c.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 180 + Math.floor(Math.random() * 40);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = Math.floor(6 + Math.random() * 12);
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    function createScanlineCanvas(w) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, w);
      c.height = 3;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,0.02)';
      g.fillRect(0, 0, w, 1);
      g.fillStyle = 'rgba(0,0,0,0.02)';
      g.fillRect(0, 1, w, 2);
      return c;
    }

    function initEntities() {
      blobs = []; particles = []; strips = [];

      const blobCount = Math.max(2, Math.round((W * config.blobCountFactor)));
      for (let i = 0; i < blobCount; i++) {
        const baseR = rand(Math.min(W, H) * 0.12, Math.min(W, H) * 0.36);
        blobs.push({
          x: rand(-W * 0.2, W * 1.2),
          y: rand(-H * 0.2, H * 1.2),
          baseR,
          r: baseR,
          phase: Math.random() * Math.PI * 2,
          speed: rand(0.0006, 0.002),
          color: choose(config.colors)
        });
      }

      const particleCount = Math.max(10, Math.round(W * config.particleDensity));
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: rand(0, W),
          y: rand(0, H),
          r: rand(config.particleRadiusRange[0], config.particleRadiusRange[1]),
          alpha: rand(config.particleAlphaRange[0], config.particleAlphaRange[1]),
          vx: rand(-0.08, 0.08),
          vy: rand(-0.2, -0.02),
          wobble: Math.random() * 1000
        });
      }

      const stripCount = Math.max(3, Math.round(W * config.stripCountFactor));
      for (let i = 0; i < stripCount; i++) {
        strips.push({
          x: rand(-W * 0.5, W * 1.5),
          y: rand(0, H),
          w: rand(160, 420),
          a: rand(-0.18, -0.06),
          speed: rand(0.02, 0.12),
          alpha: rand(0.02, 0.08)
        });
      }

      noiseCanvas = createNoiseCanvas(W, H);
      scanlineCanvas = createScanlineCanvas(W);
    }

    function drawBlobs(now) {
      for (const b of blobs) {
        b.phase += b.speed;
        b.r = b.baseR + Math.sin(b.phase) * (b.baseR * 0.06);
        const grad = ctx.createRadialGradient(b.x, b.y, Math.max(2, b.r * 0.05), b.x, b.y, b.r);
        grad.addColorStop(0, b.color + (config.blobAlpha * 2) + ')');
        grad.addColorStop(0.45, b.color + (config.blobAlpha) + ')');
        grad.addColorStop(1, b.color + '0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // subtle drift
        b.x += Math.sin(now / 7000 + b.phase) * 0.04;
        b.y += Math.cos(now / 9000 + b.phase) * 0.02;
      }
    }

    function drawStrips(now) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      for (const s of strips) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.a);
        const grad = ctx.createLinearGradient(0, 0, s.w, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.45, `rgba(31,174,138,${s.alpha * 0.4})`);
        grad.addColorStop(0.7, `rgba(86,196,168,${s.alpha * 0.25})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, -H, s.w, H * 3);
        ctx.restore();
        s.x -= s.speed;
        if (s.x + s.w < -W) s.x = W + Math.random() * W;
      }
      ctx.restore();
    }

    function drawParticles(now) {
      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(31,174,138,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // motion
        p.x += Math.cos(now / 1000 + p.wobble) * 0.02 + p.vx;
        p.y += p.vy;
        p.wobble += 0.01;
        // reset when out of bounds
        if (p.y + p.r < -40 || p.x < -60 || p.x > W + 60) {
          p.x = rand(0, W);
          p.y = H + rand(10, 160);
          p.alpha = rand(config.particleAlphaRange[0], config.particleAlphaRange[1]);
          p.r = rand(config.particleRadiusRange[0], config.particleRadiusRange[1]);
          p.vx = rand(-0.08, 0.08);
          p.vy = rand(-0.18, -0.02);
          p.wobble = Math.random() * 1000;
        }
      }
    }

    // draw connecting lines between nearby particles
    function drawConnections() {
      const len = particles.length;
      const maxDist = config.connectDistance;
      const maxDist2 = maxDist * maxDist;
      // simple O(n^2) check — good enough for modest counts
      ctx.save();
      ctx.lineWidth = config.connectLineWidth;
      for (let i = 0; i < len; i++) {
        const a = particles[i];
        for (let j = i + 1; j < len; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 <= maxDist2) {
            const t = 1 - (d2 / maxDist2); // 0..1, stronger when closer
            const alpha = Math.min(0.85, 0.02 + t * 0.28) * (a.alpha + b.alpha) * 0.9;
            ctx.strokeStyle = `rgba(${config.connectColor},${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    function drawNoiseAndScanlines() {
      if (noiseCanvas) {
        ctx.globalAlpha = 0.12;
        ctx.drawImage(noiseCanvas, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      if (scanlineCanvas) {
        ctx.globalAlpha = 0.06;
        for (let y = 0; y < H; y += 3) ctx.drawImage(scanlineCanvas, 0, y);
        ctx.globalAlpha = 1;
      }
    }

    // frame loop with fps limit and optional reduced-motion fallback
    const minDelta = 1000 / config.fpsLimit;
    function frame(now) {
      if (reduced) {
        // static single frame for reduced motion users
        renderStatic();
        return;
      }

      const delta = now - last;
      if (delta < minDelta) {
        requestAnimationFrame(frame);
        return;
      }
      last = now;

      // base gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdfe');
      grad.addColorStop(1, '#f6fafb');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      drawBlobs(now);
      drawStrips(now);
      drawParticles(now);
      drawConnections();
      drawNoiseAndScanlines();

      requestAnimationFrame(frame);
    }

    function renderStatic() {
      // draw a quiet non-animating background for reduced-motion
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdfe');
      grad.addColorStop(1, '#f6fafb');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // draw one static set of blobs/particles/lines (no animation)
      drawBlobs(performance.now());
      drawStrips(performance.now());
      drawParticles(performance.now());
      drawConnections();
      drawNoiseAndScanlines();
    }

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      W = Math.max(320, window.innerWidth);
      H = Math.max(320, window.innerHeight);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initEntities();
      // if reduced motion, render one static frame
      if (reduced) renderStatic();
    }

    // initial setup & handlers
    window.addEventListener('resize', () => {
      clearTimeout(window._bgResizeTimeout);
      window._bgResizeTimeout = setTimeout(resize, 120);
    });

    resize();
    if (!reduced) requestAnimationFrame(frame);

    // expose small debug helpers
    window.__bgAnim = {
      resize,
      regenerate: initEntities,
      config
    };

    // --------- UI interactions & reveal-on-scroll ----------
    // set year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // mobile nav toggle (use class + aria)
    const navToggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('nav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // smooth anchors
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

    // reveal on scroll with IntersectionObserver (staggered)
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
      // fallback: reveal all
      reveals.forEach(el => el.classList.add('in-view'));
    }

    // hero pop
    const heroPop = document.querySelector('.hero-pop');
    if (heroPop && !reduced) setTimeout(() => heroPop.classList.add('in-view'), 380);
    else if (heroPop && reduced) heroPop.classList.add('in-view');

    // contact form demo fallback handler (graceful)
    const form = document.getElementById('contact-form');
    const statusEl = document.getElementById('contact-status');
    if (form) {
      form.addEventListener('submit', (e) => {
        if (form.action && form.action.includes('formspree.io')) return; // let real submit go through
        e.preventDefault();
        if (statusEl) {
          statusEl.textContent = 'Thanks — your message has been received (demo).';
          form.reset();
          setTimeout(() => { statusEl.textContent = ''; }, 3500);
        } else {
          // fallback alert only if no status element
          alert('Thanks — your message has been received (demo).');
          form.reset();
        }
      });
    }
  });
})();
