// script.js - Amr-style soft background animation tuned to blue theme
(() => {
  // wait until DOM ready to ensure canvas exists
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      console.warn('bg-canvas element not found.');
      return;
    }
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1);

    // Entities
    let blobs = [];
    let particles = [];
    let strips = [];
    let noiseCanvas = null;
    let scanlineCanvas = null;

    // Config - blue palette
    const config = {
      blobCountFactor: 1 / 700,
      particleDensity: 1 / 90,
      stripCountFactor: 1 / 700,
      colors: [
        'rgba(46,168,255,',   // bright blue
        'rgba(110,190,255,',  // soft sky blue
        'rgba(90,150,255,'    // cooler indigo-blue
      ],
      blobAlpha: 0.08,
      particleAlphaRange: [0.02, 0.12],
      particleRadiusRange: [3, 18],
      fpsLimit: 60
    };

    // Helpers
    function rand(min, max) { return Math.random() * (max - min) + min; }
    function choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    // Create offscreen noise canvas for subtle grain overlay
    function createNoiseCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.floor(w / 2));
      c.height = Math.max(1, Math.floor(h / 2));
      const g = c.getContext('2d');
      const img = g.createImageData(c.width, c.height);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 200 + Math.floor(Math.random() * 30);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = Math.floor(6 + Math.random() * 12);
      }
      g.putImageData(img, 0, 0);
      return c;
    }

    // Create subtle scanline canvas
    function createScanlineCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = 3;
      const g = c.getContext('2d');
      g.fillStyle = 'rgba(255,255,255,0.02)';
      g.fillRect(0, 0, w, 1);
      g.fillStyle = 'rgba(0,0,0,0.02)';
      g.fillRect(0, 1, w, 2);
      return c;
    }

    function initEntities() {
      blobs = [];
      particles = [];
      strips = [];

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
      scanlineCanvas = createScanlineCanvas(W, H);
    }

    // Resize handler
    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      W = Math.max(300, window.innerWidth);
      H = Math.max(300, window.innerHeight);
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initEntities();
    }
    window.addEventListener('resize', () => {
      clearTimeout(window._bgResizeTimeout);
      window._bgResizeTimeout = setTimeout(resize, 120);
    });

    // Drawing functions
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
        grad.addColorStop(0.45, `rgba(46,168,255,${s.alpha * 0.4})`);
        grad.addColorStop(0.7, `rgba(110,190,255,${s.alpha * 0.25})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, -H, s.w, H * 3);
        ctx.restore();
        s.x -= s.speed;
        if (s.x + s.w < -W) {
          s.x = W + Math.random() * W;
        }
      }
      ctx.restore();
    }

    function drawParticles(now) {
      for (const p of particles) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(46,168,255,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        p.x += Math.cos(now / 1000 + p.wobble) * 0.02 + p.vx;
        p.y += p.vy;
        p.wobble += 0.01;
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

    function drawNoiseAndScanlines() {
      if (noiseCanvas) {
        ctx.globalAlpha = 0.12;
        ctx.drawImage(noiseCanvas, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      if (scanlineCanvas) {
        ctx.globalAlpha = 0.06;
        for (let y = 0; y < H; y += 3) {
          ctx.drawImage(scanlineCanvas, 0, y);
        }
        ctx.globalAlpha = 1;
      }
    }

    // Main loop with FPS limiting
    let last = performance.now();
    const minDelta = 1000 / config.fpsLimit;
    function frame(now) {
      const delta = now - last;
      if (delta < minDelta) {
        requestAnimationFrame(frame);
        return;
      }
      last = now;
      // base background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fbfdfe');
      grad.addColorStop(1, '#f6fafb');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      drawBlobs(now);
      drawStrips(now);
      drawParticles(now);
      drawNoiseAndScanlines();

      requestAnimationFrame(frame);
    }

    // Initialize and start
    function start() {
      resize();
      requestAnimationFrame(frame);
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
    }

    // first-run
    resize();
    requestAnimationFrame(frame);

    // Expose small debug helpers
    window.__bgAnim = { resize: resize, regenerate: initEntities };

    // ---------------- UI interactions & reveals ----------------
    // set year
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const nav = document.getElementById('nav');
    navToggle && navToggle.addEventListener('click', () => {
      if (!nav) return;
      const shown = getComputedStyle(nav).display !== 'none';
      nav.style.display = shown ? 'none' : 'flex';
    });

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

    // reveal-on-scroll
    const reveals = Array.from(document.querySelectorAll('.reveal'));
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(0.45, i * 0.06)}s`;
      ro.observe(el);
    });

    // hero pop
    const heroPop = document.querySelector('.hero-pop');
    if (heroPop) setTimeout(() => heroPop.classList.add('in-view'), 380);

    // contact form fallback handler (demo)
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        if (form.action.includes('formspree.io')) return;
        e.preventDefault();
        alert('Thanks — your message has been received (demo).');
        form.reset();
      });
    }
  });
})();
