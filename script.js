// DEBUG-ready script.js
// Drops a visible red rectangle then starts the matrix animation.
// Overwrite your current script.js with this file, reload (use http://localhost:8000).

console.log('DEBUG: script.js loaded');

(() => {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    console.log('DEBUG: DOMContentLoaded');

    const canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      console.error('DEBUG ERROR: canvas #bg-canvas not found.');
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('DEBUG ERROR: 2D context not available.');
      return;
    }
    console.log('DEBUG: canvas found (offsetW,H):', canvas.offsetWidth, canvas.offsetHeight);

    function fit() {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    window.addEventListener('resize', fit);

    // Draw visible test rectangle immediately so you can see the canvas
    try {
      ctx.fillStyle = 'rgba(255,0,0,0.95)';
      ctx.fillRect(8, 8, 160, 96);
      console.log('DEBUG: drew red test rectangle (top-left).');
    } catch (err) {
      console.error('DEBUG ERROR drawing test rect:', err);
    }

    // Start animation after a short delay so you notice the test rect
    setTimeout(startMatrix, 700);

    function startMatrix() {
      console.log('DEBUG: starting matrix animation');

      const charset = 'ｱｲｳｴｵ01ABCDEFabcdef0123456789<>/\\|[]{}()@#$%*+-_=;:;';
      let W = window.innerWidth;
      let H = window.innerHeight;
      let cols = [];

      function init() {
        W = window.innerWidth;
        H = window.innerHeight;
        const base = Math.max(12, Math.floor(Math.min(W, H) / 68));
        const count = Math.ceil(W / base);
        cols = [];
        for (let i = 0; i < count; i++) {
          cols.push({
            x: i * base,
            y: Math.random() * H - H,
            speed: 0.6 + Math.random() * 1.8,
            font: base
          });
        }
        ctx.clearRect(0,0,W,H);
      }
      window.addEventListener('resize', init);
      init();

      function draw() {
        // dark background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#021010');
        bgGrad.addColorStop(1, '#031514');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // draw columns
        for (let col of cols) {
          ctx.font = `${col.font}px "Share Tech Mono", monospace`;
          const lead = charset.charAt(Math.floor(Math.random() * charset.length));
          ctx.fillStyle = 'rgba(0,255,190,0.98)';
          ctx.shadowColor = 'rgba(0,240,168,0.9)';
          ctx.shadowBlur = 10;
          ctx.fillText(lead, col.x, col.y);

          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(0,150,100,0.12)';
          for (let t = 1; t < 7; t++) {
            const ch = charset.charAt(Math.floor(Math.random() * charset.length));
            ctx.fillText(ch, col.x, col.y - t * col.font);
          }

          col.y += col.speed * (1 + col.font / 32);
          if (col.y > H + 50) col.y = -Math.random() * 400;
        }
        requestAnimationFrame(draw);
      }

      requestAnimationFrame(draw);
    }
  });
})();
