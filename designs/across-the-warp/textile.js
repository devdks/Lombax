export const firstRows = 20
export const visibleRows = 27
const threads = 52
const gold = ['#c69750', '#d3a65b', '#bf8a44', '#d7ab63', '#c29250', '#d0a063']
const indigo = ['#334964', '#485d7b', '#3d5270', '#506685', '#374966', '#445a78']

export function weftOnTop(row, thread) {
  return ((thread - row) % 4 + 4) % 4 < 2
}

function grain(index, salt) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
}

export function dimensions(w, h) {
  const left = w * .126
  const right = w - left
  return {
    w, h, left, right, pitch: (right - left) / threads,
    rowHeight: h * .0166, clothTop: h * .114,
    shed: h * .67, reed: h * .819,
    shuttleStart: Math.max(24, w * .069), shuttleEnd: w - Math.max(24, w * .069),
    shuttleWidth: Math.max(37, Math.min(w * .102, 108)), shuttleHeight: Math.max(18, h * .043),
  }
}

function timber(ctx, x, y, w, h, salt, vertical = false) {
  ctx.save()
  ctx.translate(x, y)
  if (vertical) {
    ctx.translate(w, 0)
    ctx.rotate(Math.PI / 2)
    ;[w, h] = [h, w]
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#977856')
  gradient.addColorStop(.09, '#684b34')
  gradient.addColorStop(.23, '#755238')
  gradient.addColorStop(.74, '#5b3d2a')
  gradient.addColorStop(1, '#38291e')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  const streaks = Math.ceil(h * 4)
  for (let i = 0; i < streaks; i++) {
    const start = grain(i, salt) * w
    const y = grain(i, salt + 1) * h
    const run = grain(i, salt + 2) * w * .64
    if (run < 4) continue
    const end = Math.min(w, start + run)
    ctx.beginPath()
    ctx.moveTo(start, y)
    ctx.bezierCurveTo(start + (end - start) * .3, y + grain(i, salt + 3) * 2,
      start + (end - start) * .7, y - grain(i, salt + 4) * 2, end, y)
    ctx.strokeStyle = i % 2 ? '#e4ba7f28' : '#28181150'
    ctx.lineWidth = .35 + grain(i, salt + 5) * .8
    ctx.stroke()
  }
  line(ctx, 0, 1, w, 1, '#f6cb8956', 1)
  line(ctx, 0, h - 1, w, h - 1, '#20130cbb', 1)
  ctx.restore()
}

function pin(ctx, x, y, r) {
  const metal = ctx.createLinearGradient(x - r, y - r, x + r, y + r)
  metal.addColorStop(0, '#d2ae70')
  metal.addColorStop(.5, '#816044')
  metal.addColorStop(1, '#3e2b20')
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = metal
  ctx.fill()
  line(ctx, x - r * .43, y + r * .36, x + r * .43, y - r * .36, '#332319', Math.max(.65, r * .23))
}

function twine(ctx, x1, y1, x2, y2, width, color, seed) {
  ctx.save()
  ctx.translate(x1, y1)
  ctx.rotate(Math.atan2(y2 - y1, x2 - x1))
  const length = Math.hypot(x2 - x1, y2 - y1)
  const bend = (grain(seed, 31) - .5) * width * .28
  const colorRamp = ctx.createLinearGradient(0, -width / 2, 0, width / 2)
  colorRamp.addColorStop(0, '#211a13')
  colorRamp.addColorStop(.24, color)
  colorRamp.addColorStop(.52, color)
  colorRamp.addColorStop(1, '#382c25')
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(length * .52, bend, length, 0)
  ctx.strokeStyle = colorRamp
  ctx.lineWidth = width
  ctx.stroke()

  for (let fiber = 0; fiber < 4; fiber++) {
    const y = width * (.24 - fiber * .16)
    const start = grain(seed, fiber + 21) * length * .18
    const end = length * (.8 + grain(seed, fiber + 25) * .2)
    ctx.beginPath()
    ctx.moveTo(start, y)
    ctx.quadraticCurveTo(length * .57, y + bend - width * .05, end, y + width * .09)
    ctx.strokeStyle = fiber % 2 ? '#e7ceb048' : '#17213150'
    ctx.lineWidth = Math.max(.24, width * .09)
    ctx.stroke()
  }
  ctx.restore()
}

function crosswise(ctx, g, row, y, from, to, loose) {
  if (to - from < .25) return
  const width = loose ? Math.max(1.65, g.rowHeight * .43) : g.rowHeight * .83
  const color = loose ? '#f4bf6c' : gold[row % gold.length]
  ctx.save()
  ctx.beginPath()
  ctx.rect(from, y - width * 1.45, to - from, width * 2.9)
  ctx.clip()
  ctx.save()
  if (loose) {
    ctx.beginPath()
    ctx.rect(from, y - width, to - from, width * 2)
    for (let i = 0; i < threads; i++) {
      if (weftOnTop(row, i)) continue
      const warpX = g.left + (i + .5) * g.pitch
      const raisedX = warpX + (g.w / 2 - warpX) * .012
      const gapStart = Math.max(from, raisedX - g.pitch * .17)
      const gapEnd = Math.min(to, raisedX + g.pitch * .17)
      if (gapStart < gapEnd) ctx.rect(gapStart, y - width, gapEnd - gapStart, width * 2)
    }
    ctx.clip('evenodd')
  }
  line(ctx, from, y, to, y, loose ? '#a676465f' : '#a4764699', width * .45)
  ctx.restore()
  let thread = ((row % 4) + 4) % 4 - 4
  for (; thread < threads; thread += 4) {
    const start = Math.max(g.left - g.pitch * .22, g.left + (thread + .15) * g.pitch)
    const end = Math.min(g.right + g.pitch * .22, g.left + (thread + 1.85) * g.pitch)
    if (end < from || start > to || end <= start) continue
    twine(ctx, start, y, end, y, width, color, row * threads + thread)
  }
  ctx.restore()
}

function packedCloth(ctx, g, rows) {
  const first = Math.max(0, rows - visibleRows)
  const bottom = g.clothTop + (rows - first) * g.rowHeight
  const width = g.right - g.left
  ctx.fillStyle = '#273247'
  ctx.fillRect(g.left - g.pitch * .23, g.clothTop, width + g.pitch * .46, bottom - g.clothTop)

  for (let thread = 0; thread < threads; thread++) {
    const x = g.left + (thread + .5) * g.pitch
    const color = indigo[thread % indigo.length]
    line(ctx, x, g.clothTop, x, bottom, '#111b29', g.pitch * .99)
    twine(ctx, x, g.clothTop, x, bottom, g.pitch * .84, color, thread)
  }

  for (let row = first; row < rows; row++) {
    const y = g.clothTop + (row - first + .5) * g.rowHeight
    crosswise(ctx, g, row, y, g.left - g.pitch * .23, g.right + g.pitch * .23, false)
    for (let thread = 0; thread < threads; thread++) {
      if (weftOnTop(row, thread)) continue
      const x = g.left + (thread + .5) * g.pitch
      line(ctx, x, y - g.rowHeight * .33, x, y + g.rowHeight * .33, indigo[thread % indigo.length], g.pitch * .68)
      line(ctx, x - g.pitch * .19, y - g.rowHeight * .38, x - g.pitch * .12, y + g.rowHeight * .38, '#a7b2b054', Math.max(.35, g.pitch * .068))
    }

    // At the selvedge, each pick turns back across the loom.
    const edge = row % 2 ? g.left : g.right
    const lip = (row % 2 ? -1 : 1) * g.pitch * .35
    ctx.beginPath()
    ctx.moveTo(edge, y - g.rowHeight * .56)
    ctx.quadraticCurveTo(edge + lip * 2, y, edge, y + g.rowHeight * .56)
    ctx.strokeStyle = row % 3 ? '#a97d49' : '#e4a960'
    ctx.lineWidth = Math.max(.8, g.rowHeight * .23)
    ctx.stroke()
  }

  const shade = ctx.createLinearGradient(0, g.clothTop, 0, g.clothTop + g.h * .072)
  shade.addColorStop(0, '#171918bc')
  shade.addColorStop(1, '#17191800')
  ctx.fillStyle = shade
  ctx.fillRect(g.left - g.pitch * .4, g.clothTop, width + g.pitch * .8, g.h * .073)
}

function frame(ctx, g) {
  const { w, h } = g
  const background = ctx.createRadialGradient(w * .49, h * .4, 0, w * .49, h * .47, w * .6)
  background.addColorStop(0, '#303536')
  background.addColorStop(.67, '#252a29')
  background.addColorStop(1, '#1d211f')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < w * h / 38; i++) {
    ctx.fillStyle = i % 3 ? '#dbc9a80a' : '#0b100f14'
    ctx.fillRect(grain(i, 51) * w, grain(i, 52) * h, 1, 1)
  }

  ctx.save()
  ctx.shadowColor = '#090b09c9'
  ctx.shadowBlur = h * .027
  ctx.shadowOffsetY = h * .012
  ctx.fillStyle = '#37291f'
  for (const x of [w * .031, w * .924]) ctx.fillRect(x, h * .064, w * .045, h * .88)
  for (const y of [h * .045, h * .891]) ctx.fillRect(w * .025, y, w * .95, h * .066)
  ctx.restore()

  for (const [index, x] of [w * .031, w * .924].entries()) {
    timber(ctx, x, h * .064, w * .045, h * .88, index + 3, true)
  }
  timber(ctx, w * .025, h * .045, w * .95, h * .066, 13)
  timber(ctx, w * .025, h * .891, w * .95, h * .066, 18)
  for (const x of [w * .054, w * .946]) {
    for (const y of [h * .078, h * .923]) pin(ctx, x, y, Math.max(2, h * .008))
  }
  line(ctx, g.left, h * .111, g.right, h * .111, '#b38857', h * .008)
}

function openWarp(ctx, g, rows) {
  for (let thread = 0; thread < threads; thread++) {
    const x = g.left + (thread + .5) * g.pitch
    const raised = !weftOnTop(rows, thread)
    const pinch = (g.w / 2 - x) * (raised ? .012 : .029)
    const width = Math.max(.9, g.pitch * (raised ? .28 : .20))
    const color = raised ? (thread % 3 ? '#7588a1' : '#92a1b3') : '#424f63'
    const start = g.clothTop
    const end = g.h * .889
    for (let side = 0; side < 2; side++) {
      ctx.beginPath()
      ctx.moveTo(x + (side ? -.47 : 0), start)
      ctx.quadraticCurveTo(x, g.shed - g.h * .084, x + pinch, g.shed)
      ctx.quadraticCurveTo(x + pinch, g.shed + g.h * .069, x, end)
      ctx.strokeStyle = side ? '#c1c8c748' : color
      ctx.lineWidth = side ? Math.max(.4, width * .32) : width
      ctx.stroke()
    }
  }
}

function loosePick(ctx, g, rows, progress, y, x, anchorY) {
  if (progress <= 0) return
  const fromLeft = rows % 2 === 0
  const start = fromLeft ? g.left : g.right
  const end = Math.max(g.left, Math.min(x, g.right))
  const slack = (fromLeft ? -1 : 1) * g.pitch * 1.1
  ctx.save()
  ctx.globalAlpha = Math.min(1, .35 + progress * 5)
  ctx.beginPath()
  ctx.moveTo(start, anchorY)
  ctx.bezierCurveTo(start + slack, anchorY + (y - anchorY) * .42, start + slack, y, start, y)
  ctx.strokeStyle = '#c89557'
  ctx.lineWidth = Math.max(1, g.rowHeight * .18)
  ctx.stroke()
  // The loose weft travels beneath each raised pair of warp threads.
  crosswise(ctx, g, rows, y, Math.min(start, end), Math.max(start, end), true)
  if (fromLeft ? x > g.right : x < g.left) {
    line(ctx, end, y, x, g.shed, '#c89557', Math.max(1, g.rowHeight * .18))
  }
  ctx.restore()
}

function shuttle(ctx, g, x) {
  const { shed: y, shuttleWidth: w, shuttleHeight: h } = g
  ctx.save()
  ctx.translate(x, y)
  const wood = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
  wood.addColorStop(0, '#e2b580')
  wood.addColorStop(.24, '#b7814b')
  wood.addColorStop(.59, '#a26a3d')
  wood.addColorStop(1, '#593a29')
  ctx.beginPath()
  ctx.moveTo(-w / 2, 0)
  ctx.bezierCurveTo(-w * .29, -h * .62, w * .29, -h * .62, w / 2, 0)
  ctx.bezierCurveTo(w * .29, h * .64, -w * .29, h * .64, -w / 2, 0)
  ctx.fillStyle = wood
  ctx.shadowColor = '#110d0b'
  ctx.shadowBlur = 5
  ctx.shadowOffsetY = 3
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.lineWidth = 1
  ctx.strokeStyle = '#d0a478'
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(0, 0, w * .278, h * .264, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#30261d'
  ctx.fill()
  line(ctx, -w * .22, 0, w * .22, 0, '#906d48', h * .13)
  const spool = ctx.createLinearGradient(0, -h * .18, 0, h * .2)
  spool.addColorStop(0, '#f5ca7d')
  spool.addColorStop(.49, '#e6ac59')
  spool.addColorStop(1, '#8d5e33')
  ctx.fillStyle = spool
  ctx.beginPath()
  ctx.roundRect(-w * .156, -h * .164, w * .312, h * .32, h * .08)
  ctx.fill()
  for (let i = -6; i <= 6; i++) {
    const turn = i * w * .022
    line(ctx, turn, -h * .159, turn + w * .023, h * .154, '#734f333f', .6)
  }
  ctx.restore()
}

function beater(ctx, g, y, ready) {
  const { w, h } = g
  const left = w * .069
  const width = w - left * 2
  const size = Math.max(12, h * .033)
  ctx.save()
  ctx.shadowColor = '#100f0ad4'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 4
  ctx.fillStyle = '#302419'
  ctx.fillRect(left, y - size / 2, width, size)
  ctx.restore()
  timber(ctx, left, y - size / 2, width, size, 37)
  for (let i = 0; i <= threads; i++) {
    const x = g.left + g.pitch * i
    line(ctx, x, y - size * .77, x, y - size * .47, '#c3b7a17d', Math.max(.55, g.pitch * .092))
  }
  const label = Math.max(7, h * .016)
  const labelWidth = label * 8.5
  ctx.fillStyle = ready ? '#e0b57b' : '#573a29'
  ctx.fillRect((w - labelWidth) / 2, y - label * .64, labelWidth, label * 1.28)
  ctx.font = `${label}px Consolas, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = ready ? '#36271c' : '#e1be91'
  ctx.fillText('B E A T E R', w / 2, y + .5)
}

function layer(g, scale, paint) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(g.w * scale)
  canvas.height = Math.round(g.h * scale)
  const ctx = canvas.getContext('2d')
  ctx.scale(canvas.width / g.w, canvas.height / g.h)
  paint(ctx)
  return canvas
}

export function makeBackdrop(g, scale, rows) {
  const ground = layer(g, scale, ctx => {
    frame(ctx, g)
    openWarp(ctx, g, rows)
  })
  const fabric = layer(g, scale, ctx => packedCloth(ctx, g, rows))
  return { ground, fabric }
}

export function render(ctx, backdrop, g, { rows, progress, beat, ready }) {
  const rise = rows >= visibleRows ? g.rowHeight * beat : 0
  ctx.drawImage(backdrop.ground, 0, 0, g.w, g.h)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, g.clothTop, g.w, g.h - g.clothTop)
  ctx.clip()
  ctx.drawImage(backdrop.fabric, 0, -rise, g.w, g.h)
  ctx.restore()
  const fromLeft = rows % 2 === 0
  const distance = g.shuttleEnd - g.shuttleStart
  const x = fromLeft ? g.shuttleStart + distance * progress : g.shuttleEnd - distance * progress
  const clothEdge = g.clothTop + Math.min(rows, visibleRows) * g.rowHeight
  const packedY = clothEdge + g.rowHeight * (rows < visibleRows ? .47 : -.53)
  const strandY = g.shed + (packedY - g.shed) * beat
  const reedY = g.reed + (packedY + g.h * .031 - g.reed) * beat

  if (progress === 0 && !beat) {
    const goal = fromLeft ? g.shuttleEnd : g.shuttleStart
    const direction = fromLeft ? 1 : -1
    const tip = goal + direction * Math.min(g.pitch * .4, 4)
    const tail = goal - direction * Math.max(g.pitch * .9, 8)
    const size = Math.max(4, g.h * .01)
    ctx.beginPath()
    ctx.moveTo(tail, g.shed)
    ctx.lineTo(tip, g.shed)
    ctx.lineTo(tip - direction * size, g.shed - size)
    ctx.moveTo(tip, g.shed)
    ctx.lineTo(tip - direction * size, g.shed + size)
    ctx.strokeStyle = '#dcb681'
    ctx.lineWidth = 1.2
    ctx.stroke()
  }

  loosePick(ctx, g, rows, progress, strandY, x, clothEdge - g.rowHeight * .36 - rise)
  shuttle(ctx, g, x)
  beater(ctx, g, reedY, ready)
  return { x, reedY }
}
