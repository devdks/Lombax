export const coverPoint = { fluorite: .38, calcite: .44, willemite: .72 }
export const arrivalKey = path => 'night-cabinet:arrival:' + path

function smooth(progress, start, end) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

function randomSequence(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function outline(ctx, points) {
  ctx.beginPath()
  ctx.moveTo(...points[0])
  for (const point of points.slice(1)) ctx.lineTo(...point)
  ctx.closePath()
}

function face(ctx, color, points) {
  outline(ctx, points)
  ctx.fillStyle = color
  ctx.fill()
}

function crystalTexture(ctx, image, cropX, cropY, x, y, width, height, opacity) {
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha *= opacity
  ctx.drawImage(image, image.naturalWidth * cropX, image.naturalHeight * cropY,
    image.naturalWidth * .27, image.naturalHeight * .31, x, y, width, height)
}

function fluoriteScene(ctx, width, height, image) {
  const random = randomSequence(316)
  const tile = Math.max(90, Math.min(190, width / 7))
  const blocks = []
  for (let y = -tile * .15; y < height; ) {
    const h = tile * (.72 + random() * .28)
    for (let x = -tile * (.2 + random() * .55); x < width; ) {
      const w = tile * (.72 + random() * .52)
      const light = 26 + random() * 27
      blocks.push({ x, y, w, h, light, stagger: random(), depth: tile * (.07 + random() * .13) })
      x += w
    }
    y += h
  }
  const seam = [[width * .79, -2], [width * .64, height * .28], [width * .67, height * .34],
    [width * .47, height * .57], [width * .49, height * .62], [width * .22, height + 2]]

  function block({ x, y, w, h, light, stagger, depth }, progress, side) {
    const growth = smooth(progress, .12 * stagger, .27 + .08 * stagger)
    const slip = smooth(progress, .40 + stagger * .18, .89 + stagger * .08)
    ctx.save()
    ctx.globalAlpha *= growth * (1 - smooth(progress, .75 + stagger * .10, 1))
    ctx.translate(x + w / 2 + side * slip * w * (1.2 + stagger), y + h / 2 + side * slip * h * .47)
    ctx.rotate(side * slip * (.06 + stagger * .18))
    ctx.scale(.26 + .74 * growth, .26 + .74 * growth)
    ctx.translate(-w / 2, -h / 2)

    face(ctx, `hsl(267 32% ${light * .58}%)`, [[w, 0], [w + depth, -depth], [w + depth, h - depth], [w, h]])
    face(ctx, `hsl(270 46% ${light + 16}%)`, [[0, 0], [depth, -depth], [w + depth, -depth], [w, 0]])
    const surface = ctx.createLinearGradient(0, 0, w, h)
    surface.addColorStop(0, `hsl(267 45% ${light + 19}%)`)
    surface.addColorStop(.37, `hsl(273 40% ${light}%)`)
    surface.addColorStop(.74, `hsl(260 46% ${light + 9}%)`)
    surface.addColorStop(1, `hsl(255 39% ${light - 10}%)`)
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, w, h)
    ctx.clip()
    crystalTexture(ctx, image, .29 + stagger * .22, .25 + stagger * .19, 0, 0, w, h, .74)
    ctx.restore()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgb(240 218 255 / 22%)'
    for (const inset of [1, 4, 10, 12 + 4 * stagger]) {
      ctx.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset)
    }
    ctx.restore()
  }

  return progress => {
    ctx.globalAlpha = smooth(progress, 0, .32) * (1 - smooth(progress, .38, .75))
    ctx.fillStyle = '#170e23'
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = 1
    const split = smooth(progress, .38, .86)
    // Both sides use the same crystal pattern, sliced along one angled break.
    for (const side of [-1, 1]) {
      const edge = side === -1 ? -2 : width + 2
      ctx.save()
      ctx.translate(side * split * width * .29, side * split * height * .14)
      outline(ctx, [...seam, [edge, height + 2], [edge, -2]])
      ctx.clip()
      for (const crystal of blocks) block(crystal, progress, side)
      ctx.restore()
    }
    ctx.globalAlpha = smooth(progress, .30, .39) * (1 - smooth(progress, .40, .54))
    ctx.strokeStyle = '#e5c7ff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(...seam[0])
    for (const point of seam.slice(1)) ctx.lineTo(...point)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function calciteScene(ctx, width, height, image) {
  const random = randomSequence(281)
  const gap = width * .53
  const crystals = []
  for (const near of [false, true]) {
    const count = near ? 8 : 11
    for (let i = 0; i < count; i++) {
      const x = width * (i + random() * .8) / (count - 1)
      crystals.push({
        x,
        base: height * (1.08 + random() * .12),
        size: Math.max(49, width / 11) * (near ? 1.15 : .88) * (.88 + random() * .7),
        reach: height * ((near ? .85 : 1.05) + random() * .60),
        lean: width * (random() - .5) * .24,
        light: (near ? 31 : 23) + random() * 13,
        delay: random() * .19,
        near,
      })
    }
  }

  return progress => {
    ctx.globalAlpha = smooth(progress, 0, .24) * (1 - smooth(progress, .44, .81))
    const background = ctx.createLinearGradient(0, 0, 0, height)
    background.addColorStop(0, '#1e1515')
    background.addColorStop(1, '#4d2c1e')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, width, height)

    for (const crystal of crystals) {
      const { x, base, size, reach, lean, light, delay, near } = crystal
      const grow = smooth(progress, delay, .30 + delay)
      if (grow === 0) continue
      const pass = smooth(progress, .43 + delay * .35, .92)
      const direction = x < gap ? -1 : 1
      const foot = x + direction * pass * width * (near ? .58 : .33)
      const y = base + pass * height * .12
      const spread = size * (.35 + .65 * grow) * (1 + pass * .70)
      const tip = [foot + lean * grow + direction * pass * spread, y - reach * grow * (1 + pass * .23)]
      const left = [foot - spread * .66, y - reach * grow * .35]
      const right = [foot + spread * .66, y - reach * grow * .40]
      const ridge = [foot + spread * .12, y - reach * grow * .24]
      const root = [foot + spread * .06, y]
      ctx.globalAlpha = 1 - smooth(progress, near ? .73 : .66, near ? .99 : .89)
      const front = ctx.createLinearGradient(tip[0], tip[1], root[0], root[1])
      front.addColorStop(0, `hsl(37 65% ${light + 48}%)`)
      front.addColorStop(.46, `hsl(32 52% ${light + 17}%)`)
      front.addColorStop(1, `hsl(20 45% ${light - 6}%)`)
      face(ctx, front, [tip, left, root, ridge])
      const side = ctx.createLinearGradient(tip[0], tip[1], right[0], right[1])
      side.addColorStop(0, `hsl(34 58% ${light + 29}%)`)
      side.addColorStop(.75, `hsl(23 43% ${light + 2}%)`)
      side.addColorStop(1, `hsl(17 42% ${light - 6}%)`)
      face(ctx, side, [tip, ridge, root, right])

      ctx.save()
      outline(ctx, [tip, left, root, right])
      ctx.clip()
      const textureLeft = Math.min(left[0], tip[0])
      const textureWidth = Math.max(right[0], tip[0]) - textureLeft
      crystalTexture(ctx, image, .23 + delay, .29 + delay, textureLeft, tip[1], textureWidth, root[1] - tip[1], .78)
      ctx.restore()

      ctx.strokeStyle = 'rgb(255 235 188 / 37%)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(...left)
      ctx.lineTo(...tip)
      ctx.lineTo(...ridge)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }
}

function extractSurface(image, fluorescence) {
  const rock = document.createElement('canvas')
  const glow = document.createElement('canvas')
  rock.width = glow.width = image.naturalWidth
  rock.height = glow.height = image.naturalHeight
  const rockContext = rock.getContext('2d')
  const glowContext = glow.getContext('2d')
  rockContext.drawImage(image, 0, 0)
  glowContext.drawImage(fluorescence, 0, 0)
  const rockPixels = rockContext.getImageData(0, 0, rock.width, rock.height)
  const glowPixels = glowContext.getImageData(0, 0, glow.width, glow.height)
  const roots = []

  for (let y = 0; y < rock.height; y++) {
    for (let x = 0; x < rock.width; x++) {
      const i = (y * rock.width + x) * 4
      const stone = rockPixels.data
      const uv = glowPixels.data
      stone[i + 3] = Math.max(stone[i], stone[i + 1], stone[i + 2]) * 19
      const green = uv[i + 1] - Math.max(uv[i], uv[i + 2])
      uv[i + 3] = (green - 12) * 5
      if (green > 46 && x % 5 === 0 && y % 5 === 0) {
        roots.push({ x: x / rock.width, y: y / rock.height })
      }
    }
  }
  rockContext.putImageData(rockPixels, 0, 0)
  glowContext.putImageData(glowPixels, 0, 0)
  return { rock, glow, roots }
}

function mossBrush(random) {
  const brush = document.createElement('canvas')
  brush.width = brush.height = 72
  const ctx = brush.getContext('2d')
  for (let i = 0; i < 155; i++) {
    const angle = random() * Math.PI * 2
    const radius = Math.sqrt(random()) * 32
    const light = 22 + random() * 45
    ctx.fillStyle = `hsl(${65 + random() * 26} 68% ${light}%)`
    ctx.beginPath()
    ctx.ellipse(36 + Math.cos(angle) * radius, 36 + Math.sin(angle) * radius,
      1 + random() * 3, 1 + random() * 2, angle, 0, Math.PI * 2)
    ctx.fill()
  }
  return brush
}

function branchPoints(random, x, y, angle, distance, thickness) {
  const count = Math.ceil(distance / 5)
  const points = []
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  let drift = 0
  let turn = 0
  for (let i = 0; i <= count; i++) {
    const t = i / count
    turn = Math.max(-1.3, Math.min(1.3, .89 * turn + (random() - .5) * 1.1))
    drift += turn * 7
    const sway = Math.sin(t * (5 + thickness * .17)) * thickness * Math.min(1, 4 * t)
    const offset = i === 0 ? 0 : drift + sway
    const radius = thickness * (.53 + random() * .38) * (1 - .54 * t)
    points.push({ x: x + dx * t * distance - dy * offset, y: y + dy * t * distance + dx * offset, radius })
  }
  return points
}

function mossBranches(random, roots, rect, width, height) {
  const branches = []
  const thickness = Math.max(22, Math.min(52, Math.min(width, height) * .062))
  const count = 13
  for (let i = 0; i < count; i++) {
    const angle = (i + .7 * random()) * 2 * Math.PI / count
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    // Start on a real fluorescent patch near the edge in this direction.
    let root = { x: .5, y: .5 }
    let best = -Infinity
    for (const point of roots) {
      const x = point.x - .5
      const y = point.y - .5
      const score = dx * x + dy * y - Math.abs(dx * y - dy * x) * .42
      if (score > best) {
        best = score
        root = point
      }
    }
    const x = rect.x + root.x * rect.w
    const y = rect.y + root.y * rect.h
    const edge = Math.min((dx > 0 ? width - x : -x) / dx, (dy > 0 ? height - y : -y) / dy)
    const length = Math.max(33, edge + 40 + random() * 87)
    const start = .23 + random() * .095
    const points = branchPoints(random, x, y, angle, length, thickness * (.66 + random() * .64))
    branches.push({ points, start, end: .56 + random() * .14 })
    for (const fraction of [.24, .46, .67]) {
      const fork = points[Math.floor(fraction * (points.length - 1))]
      const spread = (random() > .5 ? 1 : -1) * (.64 + random() * .70)
      const twig = branchPoints(random, fork.x, fork.y, angle + spread, length * (.18 + random() * .27), thickness * .56)
      branches.push({ points: twig, start: start + fraction * .30, end: .62 + random() * .09 })
    }
  }
  return branches
}

function willemiteScene(ctx, width, height, image, fluorescence, origin, seed) {
  const random = randomSequence(seed)
  const { rock, glow, roots } = extractSurface(image, fluorescence)
  const brushes = Array.from({ length: 4 }, () => mossBrush(random))
  const rect = { x: origin.x * width, y: origin.y * height, w: origin.w * width, h: origin.h * height }
  const branches = mossBranches(random, roots, rect, width, height)

  return progress => {
    const scrim = smooth(progress, .36, coverPoint.willemite) * (1 - smooth(progress, .72, .94))
    const clear = 1 - smooth(progress, .75, 1)
    ctx.globalAlpha = scrim
    ctx.fillStyle = '#10130c'
    ctx.fillRect(0, 0, width, height)
    ctx.globalAlpha = scrim
    ctx.drawImage(rock, rect.x, rect.y, rect.w, rect.h)

    const pulseIn = smooth(progress, 0, .14)
    const pulseOut = 1 - smooth(progress, .15, .29) * .51
    ctx.globalAlpha = pulseIn * pulseOut * clear
    ctx.shadowColor = '#a4ff37'
    ctx.shadowBlur = 15 * pulseIn * pulseOut
    ctx.drawImage(glow, rect.x, rect.y, rect.w, rect.h)
    ctx.shadowBlur = 0

    ctx.globalAlpha = clear
    for (const { points, start, end } of branches) {
      const tip = points.length * smooth(progress, start, end)
      for (let i = 0; i < Math.floor(tip); i++) {
        const { x, y, radius } = points[i]
        ctx.drawImage(brushes[i % brushes.length], x - radius, y - radius, radius * 2, radius * 2)
      }
    }
    ctx.globalAlpha = 1
  }
}

const scenes = { fluorite: fluoriteScene, calcite: calciteScene, willemite: willemiteScene }

export function imageArea(image) {
  const rect = image.getBoundingClientRect()
  const style = getComputedStyle(image)
  const left = parseFloat(style.paddingLeft)
  const top = parseFloat(style.paddingTop)
  const availableWidth = rect.width - left - parseFloat(style.paddingRight)
  const availableHeight = rect.height - top - parseFloat(style.paddingBottom)
  const scale = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight)
  const w = image.naturalWidth * scale
  const h = image.naturalHeight * scale
  return {
    x: (rect.left + left + (availableWidth - w) / 2) / innerWidth,
    y: (rect.top + top + (availableHeight - h) / 2) / innerHeight,
    w: w / innerWidth,
    h: h / innerHeight,
  }
}

export function playArrival(canvas, mineral, image, fluorescence, {
  from = 0, to = 1, seed = 43217, origin, onCover, onDraw,
} = {}) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const duration = mineral === 'willemite' ? 1750 : 1100
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
  const listeners = new AbortController()
  const options = { signal: listeners.signal }
  let frame
  let draw
  let width = 0
  let height = 0
  const start = performance.now() - from * duration

  function finish() {
    cancelAnimationFrame(frame)
    canvas.hidden = true
    listeners.abort()
  }

  function tick(now) {
    const progress = Math.min(to, Math.max(from, (now - start) / duration))
    if (width !== canvas.clientWidth || height !== canvas.clientHeight) {
      width = canvas.clientWidth
      height = canvas.clientHeight
      const density = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = width * density
      canvas.height = height * density
      ctx.setTransform(density, 0, 0, density, 0, 0)
      draw = scenes[mineral](ctx, width, height, image, fluorescence, origin, seed)
    }
    ctx.clearRect(0, 0, width, height)
    draw(progress)
    if (progress < to) {
      frame = requestAnimationFrame(tick)
    } else if (onCover) {
      onCover(canvas)
    } else {
      finish()
    }
  }

  if (!onCover) {
    document.addEventListener('pointerdown', finish, options)
    document.addEventListener('keydown', finish, options)
  }
  window.addEventListener('pagehide', finish, options)
  reduceMotion.addEventListener('change', () => {
    finish()
    onCover?.()
  }, options)
  canvas.hidden = false
  tick(performance.now())
  onDraw?.()
  return true
}
