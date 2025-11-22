// Canvas particle background + UI interactions (nav, theme, reveal, skill bars)
(() => {
  // Utilities
  const qs = (s) => document.querySelector(s)
  const qsa = (s) => document.querySelectorAll(s)

  // --- Canvas Particle Background ---
  const canvas = qs('#bg-canvas')
  const ctx = canvas.getContext('2d')
  let DPR = Math.max(1, window.devicePixelRatio || 1)
  let W = 0, H = 0, particles = [], mouse = { x: -9999, y: -9999, radius: 120 }

  function resize() {
    DPR = Math.max(1, window.devicePixelRatio || 1)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * DPR
    canvas.height = H * DPR
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    initParticles()
  }

  function rand(min, max) { return Math.random() * (max - min) + min }

  function initParticles() {
    particles = []
    const count = Math.round((W * H) / 65000) // density
    for (let i = 0; i < count; i++) {
      particles.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.2, 0.2),
        r: rand(1.2, 2.6),
        hue: rand(200, 220)
      })
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H)
    // subtle radial gradient
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, 'rgba(12,18,28,0.12)')
    g.addColorStop(1, 'rgba(2,6,12,0.12)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)

    // draw particles
    for (let p of particles) {
      // move
      p.x += p.vx
      p.y += p.vy

      // mouse interaction (repel)
      const dx = p.x - mouse.x
      const dy = p.y - mouse.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < mouse.radius) {
        const angle = Math.atan2(dy, dx)
        const force = (mouse.radius - dist) / mouse.radius
        p.vx += Math.cos(angle) * force * 0.4
        p.vy += Math.sin(angle) * force * 0.4
      }

      // bounds wrap
      if (p.x < -10) p.x = W + 10
      if (p.x > W + 10) p.x = -10
      if (p.y < -10) p.y = H + 10
      if (p.y > H + 10) p.y = -10

      // draw circle
      ctx.beginPath()
      ctx.fillStyle = `rgba(120,160,255,0.9)`
      ctx.globalAlpha = 0.9
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fill()
    }

    // draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j]
        const dx = a.x - b.x, dy = a.y - b.y
        const d = dx * dx + dy * dy
        const maxD = 9000
        if (d < maxD) {
          const alpha = 0.6 - (d / maxD) * 0.6
          ctx.beginPath()
          ctx.strokeStyle = `rgba(88,166,255,${alpha.toFixed(3)})`
          ctx.lineWidth = 0.9
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }
    ctx.globalAlpha = 1
    requestAnimationFrame(draw)
  }

  // mouse
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
  })
  window.addEventListener('mouseout', () => {
    mouse.x = -9999
    mouse.y = -9999
  })
  window.addEventListener('resize', () => resize())

  // initialize
  resize()
  requestAnimationFrame(draw)

  // --- UI interactions: year, nav toggle, theme ---
  document.addEventListener('DOMContentLoaded', () => {
    // Year
    const yearEl = document.getElementById('year')
    if (yearEl) yearEl.textContent = new Date().getFullYear()

    // Nav toggle for small screens
    const navToggle = document.getElementById('nav-toggle')
    const nav = document.getElementById('nav')
    navToggle && navToggle.addEventListener('click', () => {
      if (!nav) return
      const shown = getComputedStyle(nav).display !== 'none'
      nav.style.display = shown ? 'none' : 'flex'
    })

    // Smooth scroll and active link highlight
    const links = Array.from(document.querySelectorAll('a[href^="#"]'))
    links.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href')
        if (!href || href === '#') return
        const target = document.querySelector(href)
        if (target) {
          e.preventDefault()
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })

    // active link on scroll
    const sections = Array.from(document.querySelectorAll('main section, header'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return
        const id = ent.target.id
        const link = document.querySelector(`nav a[href="#${id}"]`)
        if (link) {
          document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'))
          link.classList.add('active')
        }
      })
    }, { root: null, threshold: 0.45 })

    sections.forEach(s => observer.observe(s))

    // Theme toggle (persist)
    const themeBtn = document.getElementById('theme-toggle')
    const root = document.documentElement
    const saved = localStorage.getItem('theme')
    if (saved === 'light') {
      root.style.colorScheme = 'light'
    }
    themeBtn && themeBtn.addEventListener('click', () => {
      const isLight = root.style.getPropertyValue('color-scheme') === 'light'
      if (isLight) {
        root.style.setProperty('color-scheme', 'dark')
        localStorage.setItem('theme', 'dark')
      } else {
        root.style.setProperty('color-scheme', 'light')
        localStorage.setItem('theme', 'light')
      }
    })

    // Contact form demo handling
    const form = document.getElementById('contact-form')
    if (form) {
      form.addEventListener('submit', (e) => {
        if (form.action.includes('formspree.io')) return // let real submit happen
        e.preventDefault()
        alert('Thanks — your message has been received (demo).')
        form.reset()
      })
    }

    // Reveal on scroll + skill bars animate
    const revealEls = document.querySelectorAll('.reveal')
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          // animate skill bars when skills area enters
          if (entry.target.closest('#skills')) {
            const bars = document.querySelectorAll('.skill-bar')
            bars.forEach(bar => {
              const pct = bar.getAttribute('data-percent') || '0'
              const inner = bar.querySelector('span')
              if (inner) inner.style.width = pct + '%'
            })
          }
        }
      })
    }, { threshold: 0.12 })
    revealEls.forEach(el => ro.observe(el))
  })
})();
