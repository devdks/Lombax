const tau = Math.PI * 2
const ink = '#34382b',
  pale = '#eee8d1',
  red = '#a63b28'

export function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
}
export function hash(text) {
  return Array.from(text).reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 17)
}
function line(c, points, color, width = 1) {
  c.beginPath()
  for (const [i, p] of points.entries()) i ? c.lineTo(...p) : c.moveTo(...p)
  c.lineWidth = width
  c.strokeStyle = color
  c.stroke()
}
function leaf(c, x, y, angle, size, rng) {
  c.save()
  c.translate(x, y)
  c.rotate(angle)
  const w = size * (0.16 + rng() * 0.1),
    bend = (rng() - 0.5) * size * 0.38
  c.beginPath()
  c.moveTo(0, 0)
  c.bezierCurveTo(size * 0.35, -w + bend * 0.35, size * 0.66, -w + bend, size, bend)
  c.bezierCurveTo(size * 0.68, w + bend, size * 0.31, w + bend * 0.32, 0, 0)
  const dark = rng() < 0.42
  c.fillStyle = dark ? '#596047' : ['#c6c7a5', '#d5d3b4', '#b5bb98'][Math.floor(rng() * 3)]
  c.fill()
  c.lineWidth = 0.8
  c.strokeStyle = ink
  c.stroke()
  const vein = dark ? '#d8d6b6' : '#535a43'
  line(
    c,
    [
      [0, 0],
      [size * 0.45, bend * 0.48 + 1],
      [size, bend],
    ],
    vein,
    0.75,
  )
  for (let i = 1; i < 9; i++) {
    const t = i / 10,
      mid = bend * t,
      side = w * Math.sin(Math.PI * t) * 0.73
    line(
      c,
      [
        [size * (t - 0.05), mid],
        [size * (t + 0.09), mid - side],
      ],
      vein,
      0.48,
    )
    line(
      c,
      [
        [size * (t - 0.05), mid],
        [size * (t + 0.12), mid + side],
      ],
      vein,
      0.48,
    )
  }
  c.restore()
}

function wood(c, start, end, bend, radius, tip, rng) {
  const pts = [],
    norms = []
  const dx = end[0] - start[0],
    dy = end[1] - start[1],
    len = Math.hypot(dx, dy) || 1
  for (let i = 0; i <= 28; i++) {
    const t = i / 28,
      bow = Math.sin(Math.PI * t) * (bend + Math.sin(t * 7) * bend * 0.15)
    pts.push([start[0] + dx * t - (dy / len) * bow, start[1] + dy * t + (dx / len) * bow])
  }
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(28, i + 1)],
      d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    norms.push([-(b[1] - a[1]) / d, (b[0] - a[0]) / d])
  }
  function at(i, f) {
    const t = i / 28,
      w = (radius * (1 - t) + tip * t) * (1 + 0.04 * Math.sin(t * 13))
    return pts[i].map((v, k) => v + norms[i][k] * w * f)
  }
  c.beginPath()
  for (let i = 0; i <= 28; i++) {
    const p = at(i, -1)
    i ? c.lineTo(...p) : c.moveTo(...p)
  }
  for (let i = 28; i >= 0; i--) c.lineTo(...at(i, 1))
  c.closePath()
  c.fillStyle = '#c0b899'
  c.fill()
  c.strokeStyle = ink
  c.lineWidth = 1.2
  c.stroke()
  const grains = Math.ceil(radius * 1.9)
  for (let j = 0; j < grains; j++) {
    const f = (j / grains) * 2 - 1,
      phase = rng() * tau
    const a = Math.floor(rng() * 4),
      b = 28 - Math.floor(rng() * 3),
      trace = []
    for (let i = a; i <= b; i++) trace.push(at(i, f + Math.sin(i * 0.32 + phase) * 0.055))
    line(c, trace, j % 4 === 0 ? '#e1d9b9' : '#454732', 0.4 + rng() * 0.7)
  }
  return pts
}

function frond(c, x, y, angle, len, depth, rng) {
  const end = [x + Math.cos(angle) * len, y + Math.sin(angle) * len]
  const pts = wood(c, [x, y], end, (rng() - 0.45) * len * 0.21, depth * 1.1 + 0.65, 0.55, rng)
  for (let i = 0; i < 6; i++) {
    const p = pts[6 + i * 4],
      side = i % 2 ? 1 : -1
    leaf(c, ...p, angle + side * (0.52 + rng() * 0.62), len * (0.33 + rng() * 0.31), rng)
  }
  if (depth > 0) {
    frond(c, ...pts[19], angle - (0.4 + rng() * 0.27), len * 0.64, depth - 1, rng)
    frond(c, ...end, angle + (0.3 + rng() * 0.37), len * 0.68, depth - 1, rng)
  }
}

function fruit(c, x, y, r, split, rng) {
  c.save()
  c.translate(x, y)
  c.rotate(split ? -0.22 : 0.18)
  const shape = new Path2D()
  shape.moveTo(-r * 0.1, -r * 0.91)
  shape.bezierCurveTo(-r * 0.94, -r * 1.15, -r * 1.17, -r * 0.37, -r * 0.94, r * 0.22)
  shape.bezierCurveTo(-r * 0.83, r * 0.79, -r * 0.44, r * 0.9, -r * 0.16, r * 0.86)
  shape.lineTo(-r * 0.2, r * 1.14)
  shape.lineTo(-r * 0.03, r * 1.02)
  shape.lineTo(r * 0.11, r * 1.18)
  shape.lineTo(r * 0.19, r * 0.99)
  shape.lineTo(r * 0.32, r * 1.03)
  shape.lineTo(r * 0.22, r * 0.85)
  shape.bezierCurveTo(r * 1.0, r * 0.74, r * 1.1, -r * 0.06, r * 0.91, -r * 0.48)
  shape.bezierCurveTo(r * 0.71, -r, r * 0.26, -r * 1.04, -r * 0.1, -r * 0.91)
  c.fillStyle = '#b44b33'
  c.fill(shape)
  c.strokeStyle = '#682c22'
  c.lineWidth = 1.8
  c.stroke(shape)
  c.save()
  c.clip(shape)
  for (let i = 0; i < 55; i++) {
    const t = i / 54,
      xx = (t * 2 - 1) * r
    c.beginPath()
    c.moveTo(xx * 0.52, -r)
    c.bezierCurveTo(xx * 1.55, -r * 0.5, xx * 1.5, r * 0.4, xx * 0.38, r)
    c.strokeStyle = i % 4 === 0 ? '#e9a77a' : '#783626'
    c.lineWidth = 0.4 + rng() * 0.7
    c.stroke()
  }
  if (split) {
    c.beginPath()
    c.ellipse(-r * 0.07, -r * 0.02, r * 0.72, r * 0.83, -0.18, 0, tau)
    c.fillStyle = '#edcd97'
    c.fill()
    c.stroke()
    for (let j = -5; j <= 5; j++)
      for (let i = -4; i <= 4; i++) {
        const xx = (i + (j % 2) * 0.45) * r * 0.155,
          yy = j * r * 0.145
        if (
          (xx / r / 0.63) ** 2 + (yy / r / 0.75) ** 2 > 1 ||
          Math.abs(xx / r + 0.08 * Math.sin(j * 0.8)) < 0.06
        )
          continue
        c.beginPath()
        c.ellipse(xx - r * 0.07, yy, r * 0.066, r * 0.079, rng() - 0.5, 0, tau)
        c.fillStyle = rng() > 0.42 ? '#a02d27' : '#c04b3b'
        c.fill()
        c.strokeStyle = '#812f20'
        c.lineWidth = 0.7
        c.stroke()
        line(
          c,
          [
            [xx - r * 0.1, yy - r * 0.034],
            [xx - r * 0.07, yy - r * 0.05],
          ],
          '#f2b991',
          1,
        )
      }
  }
  c.restore()
  c.restore()
}

export function inkLayout(kin, partner, pages, lens) {
  const nodes = [{ person: kin.focus, x: 411, y: 365, role: 'Rootstock' }]
  if (partner) nodes.push({ person: partner, x: 648, y: 350, role: 'Partner' })
  const slice = (list, offset, size) => list.slice(offset, offset + size)
  if (lens !== 'roots') {
    const kids = slice(kin.children, pages.children, 3)
    kids.forEach((person, i) =>
      nodes.push({
        person,
        x: kids.length === 1 ? 460 : 235 + i * (530 / (kids.length - 1)),
        y: i % 2 ? 105 : 152,
        role: 'Child',
      }),
    )
  }
  if (lens !== 'fruit') {
    const pars = slice(kin.parents, pages.parents, 3)
    pars.forEach((person, i) =>
      nodes.push({
        person,
        x: pars.length === 1 ? 420 : 297 + i * (365 / (pars.length - 1)),
        y: 532 + (i % 2) * 5,
        role: 'Parent',
      }),
    )
  }
  return nodes
}

export function drawInk(canvas, nodes, seed) {
  const box = canvas.getBoundingClientRect()
  if (!box.width || !box.height) return
  const ratio = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(box.width * ratio)
  canvas.height = Math.round(box.height * ratio)
  const c = canvas.getContext('2d')
  c.scale(canvas.width / 960, canvas.height / 610)
  const rng = random(seed)
  c.lineCap = 'round'
  c.lineJoin = 'round'
  // Fine survey arcs put the graft and the root flare on the same axis.
  c.strokeStyle = '#867c5c55'
  c.lineWidth = 0.75
  c.setLineDash([1.5, 6])
  c.beginPath()
  c.ellipse(479, 323, 334, 242, -0.09, 0, tau)
  c.stroke()
  c.setLineDash([])
  for (let j = 0; j < 76; j++) {
    const a = (j / 76) * tau
    if (Math.sin(a) > 0.38 || Math.cos(a) < -0.74) continue
    const x = 479 + Math.cos(a) * 337,
      y = 323 + Math.sin(a) * 243
    line(
      c,
      [
        [x, y],
        [x + Math.cos(a) * (j % 5 ? 4 : 9), y + Math.sin(a) * (j % 5 ? 4 : 9)],
      ],
      '#90816680',
      0.75,
    )
  }
  const root = [469, 505],
    fork = [477, 308]
  for (let j = 0; j < 17; j++) {
    const side = j % 2 ? 1 : -1,
      end = [root[0] + side * (34 + rng() * 151), root[1] + 18 + rng() * 43]
    const pts = wood(
      c,
      [root[0] + side * rng() * 13, root[1] - 14],
      end,
      side * (5 + rng() * 10),
      5 + rng() * 4,
      0.45,
      rng,
    )
    for (let k = 0; k < 3; k++) {
      const p = pts[10 + k * 5]
      wood(c, p, [p[0] + side * (9 + rng() * 38), p[1] + 10 + rng() * 18], -4, 1.4, 0.15, rng)
    }
  }
  for (const n of nodes.filter((n) => n.role === 'Parent'))
    wood(c, root, [n.x, n.y - 7], n.x < 450 ? -13 : 13, 6, 1, rng)
  wood(c, root, fork, 18, 20, 11, rng)
  const scaffold = [
    [[477, 321], [315, 273], [265, 202], -1],
    [[454, 405], [285, 354], [182, 280], -1],
    [[471, 323], [471, 203], [425, 117], -1],
    [[476, 306], [575, 216], [659, 136], 1],
    [[465, 375], [638, 313], [755, 226], 1],
  ]
  for (const [base, elbow, tip, side] of scaffold) {
    const limb = wood(c, base, elbow, -side * 13, 9, 4, rng)
    const twig = wood(c, elbow, tip, side * 9, 4, 1, rng)
    frond(c, ...tip, side < 0 ? -2.12 : -1.07, 49 + rng() * 15, 2, rng)
    for (let j = 0; j < 3; j++) {
      const p = j === 0 ? limb[20] : twig[j * 9]
      frond(c, ...p, side < 0 ? -2.5 + j * 0.36 : -0.64 - j * 0.33, 48 + rng() * 17, 1, rng)
    }
  }
  for (const n of nodes.filter((n) => n.role === 'Child')) {
    const side = n.x < 478 ? -1 : 1
    const p = [n.x + side * 8, n.y + 38]
    wood(c, fork, p, side * 24, 6, 1.5, rng)
    frond(c, ...p, side < 0 ? -2.7 : -0.48, 37, 1, rng)
    fruit(c, p[0], p[1] + 25, n.issue ? 31 : 24, n.issue > 0, rng)
  }
  frond(c, 311, 271, -2.91, 51, 1, rng)
  frond(c, 658, 295, -0.28, 44, 1, rng)
  if (nodes.some((n) => n.role === 'Partner')) {
    wood(c, [454, 410], [642, 351], -25, 7, 1, rng)
    for (let j = 0; j < 7; j++)
      line(
        c,
        [
          [444 + j * 0.3, 386 + j * 3.3],
          [468 + j * 0.25, 394 + j * 3.1],
        ],
        red,
        2,
      )
  }
}
