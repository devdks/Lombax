import { performerHalfWidth, pillar } from './room.js'

const floor = .28
const lip = 1.45
const back = -3.1
const wing = 4.1

function gradient(ctx, x0, y0, x1, y1, stops) {
  const color = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach(([offset, value]) => color.addColorStop(offset, value))
  return color
}

function glow(ctx, x, y, radius, stops) {
  const color = ctx.createRadialGradient(x, y, 0, x, y, radius)
  stops.forEach(([offset, value]) => color.addColorStop(offset, value))
  return color
}

function polygon(ctx, points, fill, stroke) {
  ctx.beginPath()
  points.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
  if (fill) {
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

function perspective(seat, width, height) {
  const focal = Math.min(width * .83, height * 1.34)
  const angle = Math.atan2(-seat.x, seat.z + 1)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return (x, y, z) => {
    const sideways = x - seat.x
    const forward = seat.z - z
    const depth = forward * cos + sideways * sin
    return [width / 2 + focal * (sideways * cos - forward * sin) / depth,
      height * .59 - focal * (y - seat.eye) / depth]
  }
}

function drawPerformer(ctx, project, mark) {
  const [x, y] = project(mark, floor, 0)
  const [left] = project(mark - performerHalfWidth, floor, 0)
  const [right, head] = project(mark + performerHalfWidth, floor + 1.66, 0)
  const height = y - head
  ctx.save()
  ctx.translate(x, y)
  ctx.scale((right - left) / 2, height)
  polygon(ctx, [[-.53, -.47], [.58, -.47], [.68, -.03], [.28, 0], [.06, -.31], [-.24, -.02], [-.65, 0]], '#221c28')
  polygon(ctx, [[-.41, -.86], [-.84, -.75], [-1, -.51], [-.69, -.47], [-.47, -.62], [-.63, -.43], [.66, -.43], [.54, -.69], [.73, -.49], [1, -.52], [.85, -.76], [.39, -.86]], '#762f32')
  polygon(ctx, [[-.4, -.85], [-.52, -.59], [-.26, -.49]], '#d0835b')
  polygon(ctx, [[.38, -.85], [.45, -.63], [.22, -.51]], '#aa553e')
  ctx.fillStyle = '#e6ad79'
  ctx.fillRect(-.14, -.89, .28, .12)
  ctx.beginPath()
  ctx.ellipse(0, -.96, .35, .079, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(-.055, -1, .35, .043, -.005, Math.PI, Math.PI * 2)
  ctx.fillStyle = '#302028'
  ctx.fill()
  ctx.restore()
}

function drawPillar(ctx, project, seat, width, height) {
  const { x, z, depth, height: top } = pillar
  const left = x - pillar.width / 2
  const right = x + pillar.width / 2
  const near = z + depth / 2
  const far = z - depth / 2
  const base = -1.2
  const side = seat.x < x ? left : right
  const [frontLeft] = project(left, 0, near)
  const [frontRight] = project(right, 0, near)
  const columnShade = gradient(ctx, frontLeft, 0, frontRight, 0,
    [[0, '#1d1518'], [.18, '#2c1e22'], [.4, '#3f2b2a'], [.66, '#2c1f22'], [1, '#1a1319']])

  polygon(ctx, [[side, base, far], [side, top, far], [side, top, near], [side, base, near]].map(point => project(...point)), '#100e13', '#4a2f2d')
  polygon(ctx, [[left, base, near], [left, top, near], [right, top, near], [right, base, near]].map(point => project(...point)), columnShade, '#47302d')
  for (let i = 1; i <= 4; i++) {
    const flute = left + i * pillar.width / 5
    polygon(ctx, [project(flute, base, near), project(flute, top, near)], null, '#120d1244')
  }
  for (const y of [.03, .11, 3.18, 3.28]) {
    polygon(ctx, [project(left, y, near), project(right, y, near)], null, '#86573a70')
  }
  ctx.fillStyle = gradient(ctx, 0, height * .86, 0, height, [[0, '#130e1500'], [1, '#0b090ec4']])
  ctx.fillRect(0, 0, width, height)
}

export function drawStage(ctx, width, height, seat, mark) {
  const project = perspective(seat, width, height)
  const surface = (points, fill, stroke) => polygon(ctx, points.map(point => project(...point)), fill, stroke)
  ctx.lineWidth = Math.max(1, width / 850)
  ctx.fillStyle = glow(ctx, width / 2, height * .55, Math.max(width, height) * .69,
    [[0, '#582b2b'], [.49, '#2a1821'], [1, '#0d0b12']])
  ctx.fillRect(0, 0, width, height)

  surface([[-wing, floor, back], [-wing, 4.3, back], [wing, 4.3, back], [wing, floor, back]],
    gradient(ctx, 0, 0, 0, height * .79, [[0, '#201521'], [.61, '#442630'], [1, '#6e3a38']]), '#6b3d3c')
  for (let x = -3.8; x < 4; x += .38) {
    surface([[x, floor, back], [x, 4.3, back]], null, '#21152080')
    surface([[x + .03, floor, back], [x + .03, 4.3, back]], null, '#b4755720')
  }

  surface([[-wing, floor, back], [wing, floor, back], [wing, floor, lip], [-wing, floor, lip]],
    gradient(ctx, 0, height * .59, 0, height, [[0, '#57352f'], [.8, '#9d6748'], [1, '#382229']]))
  for (let x = -wing; x <= wing; x += .35) {
    surface([[x, floor, back], [x, floor, lip]], null, '#2d1b2477')
  }
  surface([[-wing, floor, lip], [wing, floor, lip], [wing, -.45, lip], [-wing, -.45, lip]], '#22151c', '#ae785763')
  surface([[-wing, floor, lip], [wing, floor, lip]], null, '#d497636f')

  // The standing doorway is part of the set, behind the moving cue.
  const door = (left, right, bottom, top, fill, stroke) => surface(
    [[left, bottom, -2.65], [left, top, -2.65], [right, top, -2.65], [right, bottom, -2.65]], fill, stroke)
  door(2.3, 3.52, floor, 2.75, '#251922', '#8b5444')
  door(2.47, 3.35, floor, 2.51, '#4b2b2b', '#a3664b')
  door(2.55, 2.60, floor, 2.49, '#bb6e4d')
  door(2.64, 3.18, 1.72, 2.19, '#281d29', '#8b5946')
  door(2.64, 3.18, .46, 1.49, '#38242c', '#8b5946')

  const lightPath = Array.from({ length: 38 }, (_, index) => {
    const angle = index / 38 * Math.PI * 2
    return [mark + Math.cos(angle) * .92, floor, Math.sin(angle) * .65]
  })
  const [lightX, lightY] = project(mark, floor, 0)
  const radius = Math.abs(project(mark + 1.2, floor, 0)[0] - lightX)
  surface(lightPath, glow(ctx, lightX, lightY, radius,
    [[0, '#ffd996b8'], [.45, '#e9a86c8f'], [1, '#dfa3680a']]), '#d9a16b64')
  const [lampX, lampY] = project(mark, 4.8, -.6)
  polygon(ctx, [[lampX - 5, lampY], [lampX + 5, lampY], project(mark + .91, floor, 0), project(mark - .91, floor, 0)],
    gradient(ctx, 0, lampY, 0, lightY, [[0, '#f9b97608'], [.58, '#ffdca113'], [1, '#ffe2a62a']]))
  drawPerformer(ctx, project, mark)

  for (const side of [-1, 1]) {
    surface([[side * wing, -.1, lip], [side * wing, 4.55, lip], [side * 3.14, 4.55, lip], [side * 3.25, -.1, lip]],
      gradient(ctx, 0, 0, 0, height, [[0, '#70313c'], [.43, '#572731'], [1, '#311922']]), '#a9695055')
    for (let i = 0; i < 11; i++) {
      const edge = 3.19 + i * .082
      surface([[side * (edge + .07), -.1, lip], [side * edge, 4.55, lip]], null, i % 2 ? '#1e141e90' : '#ce836130')
    }
  }
  surface([[-wing, 4.19, lip], [wing, 4.19, lip], [wing, 4.56, lip], [-wing, 4.56, lip]], '#301a25', '#7a4943')
  for (let x = -3.6; x <= 3.7; x += .45) {
    const [cx, cy] = project(x, floor + .025, lip)
    const r = Math.max(3, width * .006)
    ctx.fillStyle = glow(ctx, cx, cy, r * 3.2, [[0, '#ffd28d'], [.24, '#d79a5ec4'], [1, '#ffa44c00']])
    ctx.fillRect(cx - r * 3.2, cy - r * 3.2, r * 6.4, r * 6.4)
  }
  drawPillar(ctx, project, seat, width, height)

  ctx.fillStyle = glow(ctx, width / 2, height / 2, Math.hypot(width, height) * .61,
    [[0, '#0d091000'], [.52, '#0d091000'], [1, '#0d0910b5']])
  ctx.fillRect(0, 0, width, height)
}

export function observeCanvas(canvas, render) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  function draw() {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    const pixelWidth = Math.round(width * scale)
    const pixelHeight = Math.round(height * scale)
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    render(ctx, width, height)
  }

  new ResizeObserver(draw).observe(canvas)
  return draw
}
