const tau = Math.PI * 2

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

const rand = random(163275)
const stars = Array.from({ length: 165 }, () => ({
  x: rand(), y: rand(), size: rand(), light: rand(), phase: rand() * tau,
}))
const streams = Array.from({ length: 8 }, (_, index) => {
  const next = random(24 + index * 39)
  return Array.from({ length: 145 }, () => ({
    age: next(), spread: next() * 2 - 1, size: next(), speed: .032 + next() * .085,
    phase: next() * tau, light: next(),
  }))
})
const meteors = [
  [.43, .34, 7.4, .62, 89],
  [.86, .58, 8.6, 2.7, 126],
  [.72, .28, 10.1, 3.6, 97],
  [.97, .79, 9.2, 4.5, 68],
  [.39, .88, 12.6, 4.8, 60],
]

function tint(hex, alpha) {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0')
}

export function createDust(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let width = 0
  let height = 0

  function resize(w, h) {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.65)
    width = w
    height = h
    canvas.width = Math.round(w * ratio)
    canvas.height = Math.round(h * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }

  function drawSky({ time, spatial, lookX, lookY, scroll }) {
    const driftX = spatial ? lookX * 11 : 0
    const driftY = spatial ? lookY * 8 : 0
    ctx.fillStyle = '#e3e6ff'
    for (const star of stars) {
      const x = star.x * width + driftX * star.size
      const y = ((star.y * height + driftY - scroll * (.016 + star.size * .04)) % height + height) % height
      const light = .10 + star.light * (.41 + .16 * Math.sin(time * 1.2 + star.phase))
      const size = .45 + star.size ** 3 * 1.36
      ctx.globalAlpha = light
      ctx.fillRect(x, y, size, size)
      if (star.size > .974) {
        ctx.globalAlpha = light * .35
        ctx.fillRect(x - 3, y + size / 2, 7, .65)
        ctx.fillRect(x + size / 2, y - 3, .65, 7)
      }
    }
    ctx.globalAlpha = 1

    for (const [x, y, period, offset, length] of meteors) {
      const t = ((time + offset) % period) / period
      if (t > .32) continue
      const age = t / .32
      const headX = x * width - age * width * .21
      const headY = y * height + age * height * .24
      const fade = Math.sin(Math.PI * age) * .7
      const gradient = ctx.createLinearGradient(headX, headY, headX + length, headY - length * .54)
      gradient.addColorStop(0, tint('#d4dcff', fade))
      gradient.addColorStop(.23, tint('#92a3ff', fade * .44))
      gradient.addColorStop(1, '#778eff00')
      ctx.strokeStyle = gradient
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(headX, headY)
      ctx.lineTo(headX + length, headY - length * .54)
      ctx.stroke()
    }
  }

  function drawComet(project, time, spatial) {
    const { x, y, r, color, angle, reveal, index } = project
    const span = (width > 720 ? 3.4 : 2.75) * r + 16
    const halo = ctx.createRadialGradient(x, y, r * .7, x, y, r * 2.28)
    halo.addColorStop(0, tint(color, .22 + reveal * .09))
    halo.addColorStop(.38, tint(color, .09))
    halo.addColorStop(1, tint(color, 0))
    ctx.fillStyle = halo
    ctx.fillRect(x - r * 2.3, y - r * 2.3, r * 4.6, r * 4.6)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.globalCompositeOperation = 'screen'

    const plume = ctx.createLinearGradient(r * .86, 0, span, 0)
    plume.addColorStop(0, tint(color, .25 + reveal * .08))
    plume.addColorStop(.32, tint(color, .11))
    plume.addColorStop(.76, tint(color, .035))
    plume.addColorStop(1, tint(color, 0))
    const wavering = Math.sin(time * .95 + index) * r * .17
    ctx.fillStyle = plume
    ctx.beginPath()
    ctx.moveTo(r * .63, -r * .62)
    ctx.bezierCurveTo(r * 1.36, -r * .79, span * .71, -r * .10 + wavering, span, r * .15)
    ctx.bezierCurveTo(span * .71, r * .21 + wavering, r * 1.22, r * .74, r * .63, r * .60)
    ctx.closePath()
    ctx.fill()

    const wake = ctx.createLinearGradient(-r, 0, span, 0)
    wake.addColorStop(0, tint(color, .25))
    wake.addColorStop(.23, tint(color, .39 + reveal * .15))
    wake.addColorStop(.6, tint(color, .15))
    wake.addColorStop(1, tint(color, 0))
    for (let i = 0; i < 8; i++) {
      const sign = i % 2 ? 1 : -1
      const phase = time * .97 + i * .65 + index
      const bend = Math.sin(phase) * (spatial ? .105 : .045) * r
      const start = r * (.92 + i * .031) * sign
      const end = r * (-.08 + i * .06) + bend
      ctx.strokeStyle = wake
      ctx.lineWidth = i < 2 ? 1.6 : .64
      ctx.beginPath()
      ctx.moveTo(-r * .66, start * .79)
      ctx.bezierCurveTo(r * .06, start * 1.39, r * 1.28, start * .77 + bend,
        span * (.89 + i * .031), end)
      ctx.stroke()
    }

    const arc = ctx.createLinearGradient(-r, -r, r, r)
    arc.addColorStop(0, tint(color, .91))
    arc.addColorStop(.47, tint(color, .56))
    arc.addColorStop(1, tint(color, .08))
    ctx.strokeStyle = arc
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.015, .29 * Math.PI, 1.73 * Math.PI)
    ctx.stroke()

    ctx.strokeStyle = tint(color, .16)
    ctx.lineWidth = .65
    ctx.beginPath()
    ctx.ellipse(r * .12, 0, r * 1.28, r * 1.075, .10, .42 * Math.PI, 1.62 * Math.PI)
    ctx.stroke()

    const pearls = streams[index % streams.length]
    for (let i = 0; i < pearls.length; i++) {
      const p = pearls[i]
      const age = (p.age + time * p.speed) % 1
      const curl = Math.sin(p.phase + time * .94 + age * 5) * (spatial ? 1 : .52)
      let px
      let py
      if (i < 35) {
        const orbit = p.phase + time * p.speed * 4
        const distance = r * (1.018 + Math.abs(p.spread) * .3)
        px = Math.cos(orbit) * distance
        py = Math.sin(orbit) * distance
      } else {
        px = r * .32 + span * age ** 1.17
        py = (Math.sign(p.spread) * (.93 - age * .73) * Math.max(.22, Math.abs(p.spread) ** .54)
          + curl * (.09 + age * .40)) * r
        if (px * px + py * py < r * r) continue
      }
      const light = (.27 + p.light * .73) * (i < 35 ? .84 : (1 - age) ** 1.14)
      const size = (.45 + p.size ** 2 * 1.55) * (1 - age * .42)
      ctx.globalAlpha = light
      ctx.fillStyle = i % 5 === 0 ? '#fff0c5' : color
      ctx.fillRect(px, py, size * (i < 35 ? 1 : 1.58), size)
    }
    ctx.restore()
  }

  function drawConnector(project, target) {
    const { x, y, r, color, reveal } = project
    const { left, top, width: w, height: h, side, mobile, above } = target
    const endX = mobile ? left + w * (x < width / 2 ? .24 : .76) : side === -1 ? left + w : left
    const endY = mobile ? top + (above ? h : 0) : top + h * .5
    const elbowX = mobile ? endX : endX - side * 26
    const elbowY = mobile ? endY + (above ? 17 : -23) : endY
    const distance = Math.hypot(elbowX - x, elbowY - y)
    if (distance < r) return
    const startX = x + (elbowX - x) * r * 1.09 / distance
    const startY = y + (elbowY - y) * r * 1.09 / distance
    ctx.strokeStyle = tint(color, .77)
    ctx.lineWidth = 1
    const length = Math.hypot(startX - elbowX, startY - elbowY) + Math.hypot(elbowX - endX, elbowY - endY)
    ctx.setLineDash([length, length])
    ctx.lineDashOffset = length * (1 - reveal)
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(elbowX, elbowY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = color
    const markers = reveal > .84 ? [[startX, startY], [endX, endY]] : [[startX, startY]]
    for (const [px, py] of markers) {
      ctx.beginPath()
      ctx.arc(px, py, 2.2, 0, tau)
      ctx.fill()
    }
  }

  function draw(projects, config) {
    ctx.clearRect(0, 0, width, height)
    drawSky(config)
    for (const project of projects) {
      if (project.visible) drawComet(project, config.time, config.spatial)
    }
    if (config.target) drawConnector(config.active, config.target)
  }

  return { resize, draw }
}
