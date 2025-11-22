// script.js - ethical-hacker themed canvas + UI interactions + reveal
(() => {
  const canvas = document.getElementById('bg-canvas')
  const ctx = canvas.getContext('2d')
  let W = 0, H = 0, dpr = Math.max(1, window.devicePixelRatio || 1)
  let columns = []
  // Mixed glyphs for Matrix-like look (kana + hex + ascii)
  const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789ABCDEFabcdef<>/\\|[]{}()@#$%*+-_=;:;'

  function fit() {
    dpr = Math.max(1, window.devicePixelRatio || 1)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    initColumns()
  }

  function initColumns() {
    columns = []
    const base = Math.max(12, Math.floor(Math.min(W, H) / 68)) // smaller → denser
    const cols = Math.ceil(W / base)
    for (let i = 0; i < cols; i++) {
      columns.push({
        x: i * base,
        y: Math.random() * H - H,
        speed: 0.6 + Math.random() * 1.8,
        font: base
      })
    }
  }

  // floating particles (soft circles) for depth
  const particles = []
  function initParticles() {
    particles.length = 0
    const count = Math.max(6, Math.round(W / 280))
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 24 + Math.random() * 40,
        speed: 0.1 + Math.random() * 0.5,
        alpha: 0.03 + Math.random() * 0.12
      })
    }
  }

  function draw() {
    // base dark gradient
    const g = ctx.createLinearGradient(0, 0, 0, H)
    g.addColorStop(0, '#021010')
    g.addColorStop(1, '#031514')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // floating aqua particles
    for (let p of particles) {
      ctx.beginPath()
      ctx.fillStyle = `rgba(0,240,168,${p.alpha})`
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
      p.y -= p.speed
      p.x += Math.sin((p.y + Date.now()/2000) / 40) * 0.3
      if (p.y + p.r < -20) {
        p.y = H + Math.random() * 120
        p.x = Math.random() * W
      }
    }

    // angled glowing strips for depth
    for (let i = 0; i < 10; i++) {
      const offset = (i / 10) * W + Math.sin(Date.now() / 3500 + i) * 40
      ctx.save()
      ctx.translate(offset, H * (i / 20))
      ctx.rotate(-0.14)
      const grad = ctx.createLinearGradient(0, 0, 360, 0)
      grad.addColorStop(0, 'rgba(0,240,168,0)')
      grad.addColorStop(0.25, 'rgba(0,240,168,0.02)')
      grad.addColorStop(0.6, 'rgba(0,240,168,0.05)')
      grad.addColorStop(1, 'rgba(0,240,168,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, -2, 360, 4)
      ctx.restore()
    }

    // columns of glyphs
    for (let col of columns) {
      ctx.font = `${col.font}px "Share Tech Mono", monospace`
      // lead char (bright)
      const lead = glyphs.charAt(Math.floor(Math.random() * glyphs.length))
      ctx.fillStyle = 'rgba(0,255,190,0.98)'
      ctx.shadowColor = 'rgba(0,240,168,0.9)'
      ctx.shadowBlur = 10
      ctx.fillText(lead, col.x, col.y)

      // trailing faint chars
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(0,150,100,0.12)'
      for (let t = 1; t < 7; t++) {
        const ch = glyphs.charAt(Math.floor(Math.random() * glyphs.length))
        ctx.fillText(ch, col.x, col.y - t * col.font)
      }

      // occasional tiny code blocks for dev-look
      if (Math.random() > 0.995) {
        ctx.fillStyle = 'rgba(0,240,168,0.04)'
        ctx.fillRect(col.x + 6, col.y - 4, 18, 10)
      }

      col.y += col.speed * (1 + col.font / 32)
      if (col.y > H + 80) col.y = -Math.random() * 400
    }

    requestAnimationFrame(draw)
  }

  window.addEventListener('resize', () => {
    fit()
    initParticles()
  })

  // initialize
  fit()
  initParticles()
  requestAnimationFrame(draw)

  // ---------------- UI interactions & reveal-on-scroll ----------------
  document.addEventListener('DOMContentLoaded', () => {
    // set year
    const yearEl = document.getElementById('year')
    if (yearEl) yearEl.textContent = new Date().getFullYear()

    // nav toggle for mobile
    const navToggle = document.getElementById('nav-toggle')
    const nav = document.getElementById('nav')
    navToggle && navToggle.addEventListener('click', () => {
      if (!nav) return
      const shown = getComputedStyle(nav).display !== 'none'
      nav.style.display = shown ? 'none' : 'flex'
    })

    // smooth scroll anchors
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href')
        if (!href || href === '#') return
        const target = document.querySelector(href)
        if (target) {
          e.preventDefault()
          target.scrollIntoView({behavior: 'smooth', block: 'start'})
        }
      })
    })

    // reveal on scroll with IntersectionObserver + stagger
    const reveals = Array.from(document.querySelectorAll('.reveal'))
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          ro.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })

    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(0.55, i * 0.06)}s`
      ro.observe(el)
    })

    // hero pop in
    const heroPop = document.querySelector('.hero-pop')
    if (heroPop) setTimeout(() => heroPop.classList.add('in-view'), 360)

    // contact form demo handler
    const form = document.getElementById('contact-form')
    if (form) {
      form.addEventListener('submit', (e) => {
        if (form.action.includes('formspree.io')) return
        e.preventDefault()
        alert('Thanks — your message has been received (demo).')
        form.reset()
      })
    }
  })
})();
