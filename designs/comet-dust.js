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
    age: next(), spread: (next() * 2 - 1) * next(), size: next(), speed: .27 + next() * .49,
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

function hotLight(hex) {
  const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16))
  return '#' + channels.map(channel => Math.round(channel + (255 - channel) * .62).toString(16)).join('')
}

export function createDust(canvas, plasmaCanvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const plasma = plasmaCanvas.getContext('2d')
  let width = 0
  let height = 0
  const palettes = new Map()

  function palette(color) {
    if (!palettes.has(color)) {
      const glow = document.createElement('canvas')
      glow.width = glow.height = 64
      const bloom = glow.getContext('2d')
      const gradient = bloom.createRadialGradient(32, 32, 0, 32, 32, 32)
      gradient.addColorStop(0, tint(color, .67))
      gradient.addColorStop(.36, tint(color, .43))
      gradient.addColorStop(.72, tint(color, .10))
      gradient.addColorStop(1, tint(color, 0))
      bloom.fillStyle = gradient
      bloom.fillRect(0, 0, 64, 64)
      palettes.set(color, { hot: hotLight(color), glow })
    }
    return palettes.get(color)
  }

  function resize(w, h) {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.65)
    width = w
    height = h
    canvas.width = Math.round(w * ratio)
    canvas.height = Math.round(h * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    if (plasma) {
      plasmaCanvas.width = canvas.width
      plasmaCanvas.height = canvas.height
      plasma.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
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

  function drawComet(project, time) {
    const { x, y, r, color, heading, reveal, index, alpha, speed } = project
    const clock = time * (1.12 + index % 3 * .11) + index * 2.7
    const span = Math.min(width * .96, r * (4.7 + (index % 3) * .3) + 34)
      * (1 + speed * .14 + .035 * Math.sin(clock * 4))
    const { hot, glow } = palette(color)

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(heading)
    ctx.globalAlpha = alpha

    // The heated bow lights the leading edge while the plasma streams behind.
    const halo = ctx.createRadialGradient(-r * .23, 0, r * .74, -r * .23, 0, r * 2.05)
    halo.addColorStop(0, tint(hot, .56))
    halo.addColorStop(.23, tint(color, .30 + reveal * .13))
    halo.addColorStop(.48, tint(color, .095))
    halo.addColorStop(1, tint(color, 0))
    ctx.fillStyle = halo
    ctx.fillRect(-r * 2.4, -r * 2.1, r * 4.6, r * 4.2)

    ctx.globalCompositeOperation = 'lighter'
    for (let i = 0; i < 8; i++) {
      const t = i / 8
      const y = r * Math.sin(t * 9 - clock * 1.9) * .21 * Math.sin(t * 2.1)
      const spread = r * (1.12 - t * .83)
      ctx.globalAlpha = alpha * .35 * (1 - t)
      ctx.drawImage(glow, r * .61 + t * span * .79 - span * .19, y - spread, span * .38, spread * 2)
    }
    drawFlame(r, span, clock, color, hot, alpha)
    drawWrap(ctx, r, span, clock, color, hot, alpha, false)
    drawEmbers(index, r, span, time, clock, color, hot, alpha)
    drawOrbit(r, clock, color, hot, reveal, alpha)
    ctx.restore()

    if (!plasma || x + r * 2.5 < 0 || x - r * 1.3 > width
      || y + r * 1.3 < 0 || y - r * 2.5 > height) return
    plasma.save()
    plasma.translate(x, y)
    plasma.rotate(heading)
    plasma.globalCompositeOperation = 'lighter'
    drawWrap(plasma, r, span, clock, color, hot, alpha, true)
    plasma.restore()
  }

  function drawWrap(surface, r, span, clock, color, hot, alpha, front) {
    const tip = front ? r * 2.45 : span * .83
    const light = surface.createLinearGradient(-r * 1.3, 0, tip, 0)
    light.addColorStop(0, tint(color, front ? .63 : .72))
    light.addColorStop(.13, tint(hot, front ? .76 : .85))
    light.addColorStop(front ? .54 : .35, tint(color, front ? .38 : .72))
    light.addColorStop(1, tint(color, 0))
    surface.fillStyle = light

    const layers = front
      ? [[.96, .105, .51], [1.02, .032, .60]]
      : [[1.09, .225, .25], [1.09, .14, .43], [1.13, .061, .63]]
    for (const [radius, breadth, brightness] of layers) {
      surface.globalAlpha = alpha * brightness
      surface.beginPath()
      // Trace both sides of the bow as one shape, then funnel them into the wake.
      wrapEdge(surface, r, tip, clock, radius, breadth, -1, false, true)
      wrapEdge(surface, r, tip, clock, radius, breadth, 1, true, true)
      wrapEdge(surface, r, tip, clock, radius, breadth, 1, false, false)
      wrapEdge(surface, r, tip, clock, radius, breadth, -1, true, false)
      surface.closePath()
      surface.fill()
    }
  }

  function wrapEdge(surface, r, tip, clock, radius, breadth, side, reverse, outer) {
    const steps = 38
    const bend = .54
    const rearAngle = .68
    const band = breadth * (outer ? 1 : -1)
    const ripple = t => Math.sin(t * 21 - clock * 6.4) * .59
      + Math.sin(t * 34 - clock * 9.2 + side) * .41
    const shoulder = radius + band + ripple(bend) * Math.sin(rearAngle) * (band * .57 + .058)
    for (let i = 0; i <= steps; i++) {
      const t = (reverse ? steps - i : i) / steps
      const flicker = ripple(t)
      let x
      let y
      if (t < bend) {
        const angle = Math.PI - t / bend * (Math.PI - rearAngle)
        const edge = radius + band + flicker * Math.sin(angle) * (band * .57 + .058)
        x = r * edge * Math.cos(angle)
        y = r * side * edge * Math.sin(angle)
      } else {
        const u = (t - bend) / (1 - bend)
        x = r * shoulder * Math.cos(rearAngle) * (1 - u) + tip * u
        y = r * (side * shoulder * Math.sin(rearAngle) * (1 - u) ** 2.6
          + (.12 * Math.sin(u * 11 - clock * 2.8 + side) + .06 * flicker) * Math.sin(u * Math.PI))
      }
      if (i === 0 && side === -1 && !reverse && outer) surface.moveTo(x, y)
      else surface.lineTo(x, y)
    }
  }

  function drawFlame(r, span, clock, color, hot, alpha) {
    const root = r * .38
    const gradient = ctx.createLinearGradient(root, 0, span, 0)
    gradient.addColorStop(0, tint(hot, .94))
    gradient.addColorStop(.2, tint(hot, .83))
    gradient.addColorStop(.44, tint(color, .69))
    gradient.addColorStop(.73, tint(color, .32))
    gradient.addColorStop(1, tint(color, 0))
    const falloff = ctx.createLinearGradient(root, 0, span, 0)
    falloff.addColorStop(0, tint(color, .51))
    falloff.addColorStop(.32, tint(color, .42))
    falloff.addColorStop(.68, tint(color, .16))
    falloff.addColorStop(1, tint(color, 0))

    for (const [breadth, strength] of [[.93, .23], [.67, .34]]) {
      ctx.fillStyle = falloff
      ctx.globalAlpha = strength * alpha
      ribbon(root, span, r, clock, breadth, 0, 0)
    }
    for (const [breadth, strength, curl, fork] of [
      [.42, .66, 0, 0],
      [.22, .57, 1.5, -.22],
      [.18, .63, 2.6, .25],
      [.09, .70, .7, .04],
    ]) {
      ctx.fillStyle = gradient
      ctx.globalAlpha = strength * alpha
      ribbon(root, span * (1 - Math.abs(fork) * .25), r, clock, breadth, curl, fork)
    }
  }

  function ribbon(root, tip, r, clock, breadth, curl, fork) {
    const count = 27
    ctx.beginPath()
    for (const side of [1, -1]) {
      for (let i = 0; i <= count; i++) {
        const t = (side === 1 ? i : count - i) / count
        const air = Math.sin(t * 16 - clock * 5.2 + curl)
        const eddy = Math.sin(t * 29 - clock * 8.3 + curl * 1.7 + side * 1.3)
        const spine = (Math.sin(t * 9 - clock * 1.9 + curl) * .19 + air * .07) * Math.sin(t * 2.1) + fork * t
        const spread = (1 - t) ** 1.32 * (.72 + .20 * Math.sin(t * Math.PI)
          + t * (.17 * air + .10 * eddy))
        const x = root + (tip - root) * t
        const y = r * (spine + side * breadth * spread)
        if (i === 0 && side === 1) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()
  }

  function drawEmbers(index, r, span, time, clock, color, hot, alpha) {
    const sparks = streams[index % streams.length]
    for (const spark of sparks) {
      const age = (spark.age + time * spark.speed) % 1
      const x = r * .72 + age * (span * 1.15 - r * .72)
      const dispersion = (.56 * (1 - age) + age * .83) * spark.spread
      const turbulence = Math.sin(age * 10 - clock * 2.3 + spark.phase) * (.10 + age * .18)
      const y = r * (dispersion + turbulence)
      if (x * x + y * y < r * r) continue
      const life = Math.min(1, age * 20) * (1 - age) ** 1.45
      const size = (.42 + spark.size ** 3 * 1.87) * (1 - age * .46)
      ctx.globalAlpha = alpha * life * (.27 + spark.light * .69)
      ctx.fillStyle = spark.light > .67 ? hot : color
      ctx.fillRect(x, y, size * (1.5 + spark.speed * 7), size)
    }
  }

  function drawOrbit(r, clock, color, hot, reveal, alpha) {
    const limb = ctx.createLinearGradient(-r * 1.2, 0, r, 0)
    limb.addColorStop(0, tint(hot, .88))
    limb.addColorStop(.46, tint(color, .37))
    limb.addColorStop(1, tint(color, .08))
    ctx.globalAlpha = alpha
    ctx.strokeStyle = limb
    ctx.lineWidth = 1.1 + reveal * .6
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.025, .52 * Math.PI, 1.49 * Math.PI)
    ctx.stroke()
    ctx.lineWidth = 4
    ctx.globalAlpha = alpha * .12
    ctx.stroke()

    for (let i = 0; i < 2; i++) {
      const plane = clock * (i === 0 ? .44 : -.30) + i * 1.2
      const sweep = clock * (i === 0 ? 1.26 : -.84) + i
      const minor = r * (.83 + .22 * Math.sin(clock * .67 + i * 1.65))
      const major = r * (i === 0 ? 1.29 : 1.16)
      ctx.globalAlpha = alpha * (i === 0 ? .73 : .37)
      ctx.strokeStyle = color
      ctx.lineWidth = i === 0 ? 1.05 : .7
      ctx.beginPath()
      ctx.ellipse(0, 0, major, minor, plane, sweep, sweep + Math.PI * 1.23)
      ctx.stroke()

      const a = sweep + Math.PI * 1.23
      const px = major * Math.cos(a)
      const py = minor * Math.sin(a)
      const x = px * Math.cos(plane) - py * Math.sin(plane)
      const y = px * Math.sin(plane) + py * Math.cos(plane)
      ctx.fillStyle = hot
      ctx.beginPath()
      ctx.arc(x, y, i === 0 ? 1.95 : 1.35, 0, tau)
      ctx.fill()
    }
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
    const light = Math.min(1, reveal * 3.5)
    ctx.strokeStyle = tint(color, light * .77)
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
    ctx.fillStyle = tint(color, light)
    const markers = reveal > .84 ? [[startX, startY], [endX, endY]] : [[startX, startY]]
    for (const [px, py] of markers) {
      ctx.beginPath()
      ctx.arc(px, py, 2.2, 0, tau)
      ctx.fill()
    }
  }

  function draw(projects, config) {
    ctx.clearRect(0, 0, width, height)
    plasma?.clearRect(0, 0, width, height)
    drawSky(config)
    for (const project of projects) {
      if (project.visible) drawComet(project, config.time)
    }
    if (config.target) drawConnector(config.active, config.target)
  }

  return { resize, draw }
}
