import { sites, storage } from './runoff.js'

const bounds = { left: -9.6, right: 9.6, back: -6.1, front: 6.1 }
const door = [5.65, 4.58]
const grade = (x, z) => 0.72 - 0.023 * (x + 9.6) - 0.089 * (z + 6.1)
const ground = ([x, z], offset = 0) => [x, grade(x, z) + offset, z]
const face = (vertices, color, edge) => ({ vertices, color, edge })
const lerp = (a, b, t) => a + (b - a) * t
const interpolate = (a, b, t) => a.map((value, index) => lerp(value, b[index], t))
const roofEdge = [-5.1, -1.16]
const confluence = sites.low.point
const roofSite = sites.roof.point
const courtSite = sites.court.point
const channels = [
  { key: 'roof', points: [roofEdge, [-5.1, 0.16], roofSite] },
  { key: 'roofExit', points: [roofSite, [-3.4, 1.45], [-1.55, 2.42], confluence] },
  { key: 'court', points: [[6.65, -3.7], [5.42, -1.66], courtSite] },
  { key: 'courtExit', points: [courtSite, [3.25, 0.25], [2.3, 1.63], confluence] },
  { key: 'sharedExit', points: [confluence, [1.69, 3.78], [3.23, 4.14], [4.52, 4.48], door] },
]

function footprint(x, z, width, depth, clip = 0) {
  const left = x - width / 2, right = x + width / 2
  const back = z - depth / 2, front = z + depth / 2
  if (!clip) return [[left, back], [right, back], [right, front], [left, front]]
  return [[left + clip, back], [right - clip, back], [right, back + clip], [right, front - clip],
    [right - clip, front], [left + clip, front], [left, front - clip], [left, back + clip]]
}

function sides(base, top, colors) {
  return base.map((point, index) => {
    const next = (index + 1) % base.length
    return face([point, base[next], top[next], top[index]], colors[index % colors.length])
  })
}

function box(x, z, width, depth, bottom, height, colors) {
  const outline = footprint(x, z, width, depth)
  const lower = outline.map(([px, pz]) => [px, bottom, pz])
  const upper = lower.map(([px, y, pz]) => [px, y + height, pz])
  return [...sides(lower, upper, colors.slice(1)), face(upper, colors[0])]
}

function makeGround() {
  const { left, right, back, front } = bounds
  const edge = [[left, back], [right, back], [right, front], [left, front]]
  const base = edge.map(([x, z]) => [x, -1.19, z])
  const band = edge.map(([x, z]) => [x, -1.02, z])
  const surface = edge.map(point => ground(point))
  const plinth = [
    ...sides(base, band, ['#596956', '#626e56', '#62705d', '#566755']),
    ...sides(band, surface, ['#899075', '#9a9b7e', '#aaa48b', '#929783']),
    face(surface, '#959783'),
  ]

  const paving = []
  const stone = ['#c6c5ae', '#cbcab5', '#cfccb4', '#c2c3ad', '#d0ceb6', '#cdccb8', '#c7c8b2']
  for (let row = 0; row < 14; row++) {
    const z = back + row * 0.87
    for (let col = -1; col < 16; col++) {
      const x = left + col * 1.24 + (row % 2) * 0.62
      const x0 = Math.max(left + 0.045, x + 0.027)
      const x1 = Math.min(right - 0.045, x + 1.214)
      const z1 = Math.min(front - 0.045, z + 0.84)
      if (x1 <= x0) continue
      const shade = stone[((row + 4) * (col + 11) * 13 + 19 * col + row * row) % stone.length]
      paving.push(face([[x0, z + 0.029], [x1, z + 0.029], [x1, z1], [x0, z1]].map(point => ground(point, 0.008)), shade))
    }
  }
  return { plinth, paving, base }
}

function makeBuildings() {
  const colors = ['#e7d8b2', '#bcb08c', '#bdac86', '#dbcca8', '#ccbc97']
  const workshop = ['#c2cbb2', '#939e87', '#a9b59d', '#bac8ac', '#a8b69d']
  const metal = ['#869080', '#5c7468', '#63786c', '#7a8d80', '#526d60']
  const left = -8.67, right = -2.05, back = -5.16, front = -1.26, center = (left + right) / 2
  const ridge = -3.24, eave = 2.48, peak = 3.63
  const roofRidge = x => [x, peak, ridge]
  const roofFront = x => [x, eave, front + 0.18]
  const roofBack = x => [x, eave, back - 0.18]
  const geometry = [
    ...box(center, (back + front) / 2, right - left, front - back, -0.28, eave + 0.28, colors).slice(0, 4),
    face([[left, eave, back], roofRidge(left), [left, eave, front]], colors[4]),
    face([[right, eave, back], roofRidge(right), [right, eave, front]], colors[2]),
    face([roofBack(left - 0.2), roofBack(right + 0.2), roofRidge(right + 0.2), roofRidge(left - 0.2)], '#a76e55'),
    face([roofRidge(left - 0.2), roofRidge(right + 0.2), roofFront(right + 0.2), roofFront(left - 0.2)], '#bf8166'),
    ...box(center, front + 0.16, right - left + 0.43, 0.14, eave - 0.085, 0.085, metal),
    ...box(roofEdge[0], front + 0.062, 0.085, 0.105, grade(...roofEdge) + 0.035, eave - grade(...roofEdge), metal),
  ]

  const annex = { x: 7.48, z: 4.51, w: 3.33, d: 2.65, bottom: -0.52, top: 1.61 }
  const a = annex
  geometry.push(
    ...box(a.x, a.z, a.w, a.d, a.bottom, a.top - a.bottom, workshop),
    ...box(a.x, a.z, a.w + 0.28, a.d + 0.28, a.top, 0.15, ['#6e8b78', '#58725e', '#496557', '#58715e', '#506d5c']),
  )

  const lines = []
  const walls = []
  for (let x = left; x < right + 0.1; x += 0.44) {
    lines.push({ points: [roofBack(x), roofRidge(x), roofFront(x)], color: '#895d49', width: 0.85 })
  }
  for (let x = 6.12; x < 9; x += 0.4) {
    lines.push({ points: [[x, a.top + 0.154, 3.07], [x, a.top + 0.154, 5.96]], color: '#54705f', width: 0.8 })
  }
  for (const x of [-7.35, -3.65]) {
    const z = front + 0.006
    walls.push(face([[x - 0.47, 0.88, z], [x + 0.47, 0.88, z], [x + 0.47, 1.98, z], [x - 0.47, 1.98, z]], '#50685b', '#e6d8b7'))
  }
  const doorX = a.x - a.w / 2 - 0.013
  const doorY = grade(...door)
  walls.push(face([[doorX, doorY, 4.04], [doorX, doorY + 1.47, 4.04], [doorX, doorY + 1.47, 5.09], [doorX, doorY, 5.09]], '#a7553e', '#e7aa86'))
  const wallLines = [
    ...[-7.35, -3.65].flatMap(x => [
      { points: [[x, 0.94, front], [x, 1.94, front]], color: '#b0bd9c', width: 1 },
      { points: [[x - 0.4, 1.46, front], [x + 0.4, 1.46, front]], color: '#b0bd9c', width: 1 },
    ]),
    { points: [[doorX, doorY + 0.75, 4.83], [doorX, doorY + 0.75, 4.99]], color: '#f3d2a6', width: 1.5 },
  ]

  const courtCurb = [[2.3, -4.62], [8.4, -4.62], [8.4, -1.52]]
  lines.push({ points: courtCurb.map(point => ground(point, 0.075)), color: '#e9e5ce', width: 4 })
  lines.push({ points: courtCurb.map(point => ground(point, 0.024)), color: '#979a83', width: 1 })
  return { geometry, lines, walls, wallLines }
}

function makeGarden([x, z]) {
  const top = footprint(x, z, 3.03, 2.18, 0.36).map(point => ground(point, 0.025))
  const ledge = footprint(x, z, 2.82, 1.97, 0.33).map(point => ground(point, 0.011))
  const floor = footprint(x, z, 2.34, 1.52, 0.27).map(([px, pz]) => [px, grade(x, z) - 0.26, pz])
  const walls = sides(ledge, top, ['#879b55', '#8a9c5c', '#a8b77c', '#a0aa72'])
  const soil = sides(floor, ledge, ['#76744b', '#8d8952', '#7c794e', '#646948'])
  const plants = []

  for (let index = 0; index < 31; index++) {
    const side = index % 2 === 0 ? -1 : 1
    const px = x - 1.12 + (index % 16) * 0.148
    const pz = z + side * (0.61 + ((index * 39) % 11) / 70)
    const py = grade(px, pz) - 0.13
    const height = 0.22 + (index * 41 % 17) / 40
    for (let blade = -1; blade <= 1; blade++) {
      plants.push(face([[px - 0.035, py, pz], [px + 0.027, py, pz + 0.027],
        [px + blade * 0.13, py + height * (blade === 0 ? 1 : 0.73), pz + blade * 0.08]],
      ['#4e702e', '#779345', '#a5b766', '#587839'][(index + blade + 1) % 4]))
    }
  }
  return { top, ledge, floor, walls, soil, plants }
}

function makeCamera(width, height, plan, preview) {
  const compact = width < 850 && !preview
  const azimuth = plan ? 0 : -0.57
  const elevation = plan ? Math.PI / 2 : compact || preview ? 0.64 : 0.51
  const sinAz = Math.sin(azimuth), cosAz = Math.cos(azimuth)
  const sinEl = Math.sin(elevation), cosEl = Math.cos(elevation)
  function basis([x, y, z]) {
    const facing = x * sinAz + z * cosAz
    return [x * cosAz - z * sinAz, facing * sinEl - y * cosEl, facing * cosEl + y * sinEl]
  }
  const board = footprint(0, 0, 19.2, 12.2).flatMap(([x, z]) => [[x, -1.19, z], ground([x, z])])
  const frame = [...board, [-8.9, 3.63, -3.24], [-1.8, 3.63, -3.24], [9.2, 1.76, 5.97]].map(basis)
  const left = Math.min(...frame.map(point => point[0])), right = Math.max(...frame.map(point => point[0]))
  const top = Math.min(...frame.map(point => point[1])), bottom = Math.max(...frame.map(point => point[1]))
  const drawableHeight = compact ? height - 105 : height
  const widthShare = preview ? 0.8 : compact ? 0.96 : 0.76
  const scale = Math.min(width * widthShare / (right - left), drawableHeight * (preview ? 0.81 : 0.95) / (bottom - top))
  const ox = width * (compact || preview ? 0.5 : 0.41) - (left + right) * scale / 2
  const oy = drawableHeight * 0.5 - (top + bottom) * scale / 2
  return {
    project(point) {
      const [x, y, depth] = basis(point)
      return [x * scale + ox, y * scale + oy, depth]
    },
    scale,
    compact,
  }
}

function trace(ctx, points, close = false) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y)
  if (close) ctx.closePath()
}

function polygon(ctx, points, color, edge) {
  trace(ctx, points, true)
  ctx.fillStyle = color
  ctx.fill()
  if (edge) { ctx.lineWidth = 0.75; ctx.strokeStyle = edge; ctx.stroke() }
}

function line(ctx, points, color, width) {
  trace(ctx, points)
  ctx.lineWidth = width
  ctx.strokeStyle = color
  ctx.stroke()
}

function drawFaces(ctx, camera, faces, sort = true) {
  const projected = faces.map(({ vertices, color, edge }) => {
    const points = vertices.map(camera.project)
    return { points, color, edge, depth: points.reduce((sum, point) => sum + point[2], 0) / points.length }
  })
  if (sort) projected.sort((a, b) => a.depth - b.depth)
  for (const { points, color, edge } of projected) polygon(ctx, points, color, edge)
}

function course(points) {
  let length = 0
  const legs = points.slice(1).map((to, index) => {
    const from = points[index]
    const size = Math.hypot(to[0] - from[0], to[1] - from[1])
    const leg = { from, to, start: length, size }
    length += size
    return leg
  })
  return { points, legs, length }
}

function current(ctx, channel, rate, phase) {
  if (rate < 0.02) return
  const width = Math.min(17, 1.7 + Math.sqrt(rate) * channel.width * 0.47)
  line(ctx, channel.points, '#284788', width + 1.3)
  line(ctx, channel.points, '#4175cb', width)
  line(ctx, channel.points, '#7db8e4', Math.max(0.75, width * 0.22))
  const stride = Math.max(20, channel.width * 28)
  for (let distance = (phase % 1) * stride + stride * 0.28; distance < channel.length - 5; distance += stride) {
    const leg = channel.legs.find(segment => distance <= segment.start + segment.size)
    const [x, y] = interpolate(leg.from, leg.to, (distance - leg.start) / leg.size)
    const angle = Math.atan2(leg.to[1] - leg.from[1], leg.to[0] - leg.from[0])
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    line(ctx, [[-3, -2.1], [0.5, 0], [-3, 2.1]], '#e7fcff', 1.1)
    ctx.restore()
  }
}

export function createCourtyard(canvas, annotations, { preview = false } = {}) {
  const ctx = canvas.getContext('2d')
  const background = document.createElement('canvas')
  const backdrop = background.getContext('2d')
  if (!ctx || !backdrop) return null
  const { plinth, paving, base } = makeGround()
  const buildings = makeBuildings()
  const gardens = Object.fromEntries(Object.entries(sites).map(([id, site]) => [id, makeGarden(site.point)]))
  const pins = annotations ? [...annotations.querySelectorAll('[data-pin]')] : []
  const reading = annotations?.parentElement.querySelector('#door-reading')
  let width, height, pixelRatio, camera, paths
  let leader
  let plan = false
  let placement = 'low'

  function layout() {
    const frame = canvas.getBoundingClientRect()
    width = frame.width
    height = frame.height
    if (!width || !height) return false
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = background.width = Math.round(width * pixelRatio)
    canvas.height = background.height = Math.round(height * pixelRatio)
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    backdrop.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    camera = makeCamera(width, height, plan, preview)
    paths = channels.map(({ key, points }) => ({ key, ...course(points.map(point => camera.project(ground(point, 0.02)))), width: camera.scale / 28 }))

    for (const pin of pins) {
      const [x, y] = camera.project(ground(sites[pin.dataset.pin].point, 0.27))
      pin.style.left = `${x}px`
      pin.style.top = `${y - 3}px`
    }
    if (reading) {
      const [x, y] = camera.project(ground(door, 0.55))
      const labelWidth = camera.compact ? Math.min(208, width * 0.58) : Math.min(205, width * 0.225)
      const [rightEdge] = camera.project(ground([bounds.right, bounds.front]))
      const labelX = camera.compact ? width - labelWidth - 9 : Math.min(rightEdge + 45, width - labelWidth - 12)
      const labelY = camera.compact ? height - 104 : Math.max(11, Math.min(height - 128, y - 41))
      reading.style.setProperty('--reading-x', `${labelX}px`)
      reading.style.setProperty('--reading-y', `${labelY}px`)
      reading.style.setProperty('--reading-width', `${labelWidth}px`)
      leader = camera.compact
        ? [[x, y], [x, labelY - 8], [labelX, labelY - 8], [labelX, labelY + 8]]
        : [[x, y], [x + 13, labelY + 15], [labelX, labelY + 15]]
    }
    bake()
    if (annotations) annotations.hidden = false
    return true
  }

  function bake() {
    const c = backdrop
    const { project, scale } = camera
    c.clearRect(0, 0, width, height)
    if (preview) {
      const paper = c.createRadialGradient(width * 0.53, height * 0.44, 0, width * 0.5, height * 0.55, width * 0.57)
      paper.addColorStop(0, '#e6ebd8')
      paper.addColorStop(1, '#9fb8a3')
      c.fillStyle = paper
      c.fillRect(0, 0, width, height)
    }
    c.save()
    c.shadowColor = '#304b4159'
    c.shadowBlur = Math.max(7, scale * 0.58) * pixelRatio
    c.shadowOffsetY = 9 * pixelRatio
    polygon(c, base.map(project), '#9ba396')
    c.restore()
    drawFaces(c, camera, plinth, false)
    drawFaces(c, camera, paving, false)

    c.lineCap = 'round'
    c.lineJoin = 'round'
    for (const channel of paths) {
      line(c, channel.points, '#a1a591', Math.max(2.6, scale * 0.24))
      line(c, channel.points, '#838c7f', Math.max(1.2, scale * 0.085))
    }
    for (const [id, site] of Object.entries(sites)) {
      if (id === placement) continue
      c.save()
      c.setLineDash([4, 3]); trace(c, gardens[id].top.map(project), true)
      c.lineWidth = 1.2; c.strokeStyle = '#587259'; c.stroke()
      c.restore()
      const [x, y] = project(ground(site.point, 0.034))
      line(c, [[x, y - 2], [x, y + 2]], '#68856b', 1.2)
    }
    const bed = gardens[placement]
    if (bed) {
      drawFaces(c, camera, bed.soil)
      polygon(c, bed.floor.map(project), '#777849')
      drawFaces(c, camera, bed.walls)
    }
    drawFaces(c, camera, buildings.geometry)
    if (!plan) drawFaces(c, camera, buildings.walls)
    for (const detail of plan ? buildings.lines : [...buildings.lines, ...buildings.wallLines]) {
      line(c, detail.points.map(project), detail.color, Math.max(0.75, detail.width * scale / 38))
    }
  }

  function draw(snapshot, phase = 0) {
    if (!camera) return
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(background, 0, 0, width, height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const { project, scale } = camera
    for (const channel of paths) {
      current(ctx, channel, snapshot.elapsed ? snapshot[channel.key] : 0, phase)
    }
    const bed = gardens[placement]
    if (bed) {
      if (snapshot.stored > 0) {
        const waterline = bed.floor.map((point, index) => interpolate(point, bed.ledge[index], snapshot.stored / storage * 0.92))
        polygon(ctx, waterline.map(project), '#5189be', '#c4ded9')
      }
      drawFaces(ctx, camera, bed.plants)
      if (snapshot.full) {
        line(ctx, [bed.top[4], bed.top[5], bed.top[6]].map(project), '#f0c17c', Math.max(1, scale * 0.055))
      }
    }
    if (snapshot.door > 0.02) {
      const spread = 0.38 + Math.min(1.1, Math.sqrt(snapshot.door / 1200) * 0.8)
      const puddle = footprint(door[0] - 0.42, door[1] + 0.02, spread, 0.35 + spread * 0.58, 0.16)
      polygon(ctx, puddle.map(point => project(ground(point, 0.047))), '#3e70ba', '#a4cee0')
      const [x, y] = project(ground([door[0] - 0.49, door[1]], 0.055))
      line(ctx, [[x - scale * 0.095, y + 1], [x + scale * 0.13, y - 1]], '#bfdcf3', 1)
    }
    if (leader) {
      const [x, y] = leader[0]
      ctx.save()
      ctx.setLineDash([2, 3])
      line(ctx, leader, '#9c5644', 1.15)
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fillStyle = '#f6d7ae'
      ctx.fill()
      ctx.setLineDash([])
      ctx.strokeStyle = '#9c5644'
      ctx.stroke()
      ctx.restore()
    }
  }

  return {
    layout,
    draw,
    setView(next) {
      plan = next === 'plan'
      layout()
    },
    setPlacement(next) {
      if (next === placement) return
      placement = next
      if (camera) bake()
    },
  }
}
