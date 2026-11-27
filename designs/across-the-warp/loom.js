import { dimensions, firstRows, makeBackdrop, render, weftOnTop } from './textile.js'

const stage = document.querySelector('.stage')
const canvas = stage.querySelector('canvas')
const ctx = canvas.getContext('2d')
const control = stage.querySelector('.loom-control')
const stepLabel = document.querySelector('#step-label')
const stepDetail = document.querySelector('#step-detail')
const count = document.querySelector('#count')
const status = document.querySelector('#status')
const reset = document.querySelector('.reset')
const draft = document.querySelector('.draft-grid')
const motion = matchMedia('(prefers-reduced-motion: reduce)')

const cells = Array.from({ length: 40 }, (_, i) => {
  const cell = document.createElement('span')
  cell.className = 'draft-cell'
  cell.toggleAttribute('data-next', i >= 32)
  return cell
})
draft.append(...cells)

let g, backdrop, scale
let rows = firstRows
let progress = 0
let beat = 0
let loose = false
let busy = false
let gesture = null
let dragged = false
let directPress = false

function updateDraft() {
  cells.forEach((cell, index) => {
    const row = rows - 4 + Math.floor(index / 8)
    cell.toggleAttribute('data-weft', weftOnTop(row, index % 8))
  })
  const added = rows - firstRows
  count.textContent = `${added} ${added === 1 ? 'row' : 'rows'} added`
}

function updateControls() {
  const label = loose ? 'Beat the strand' : 'Pass the shuttle'
  control.textContent = label
  control.dataset.action = loose ? 'beat' : 'shuttle'
  control.setAttribute('aria-disabled', String(busy))
  stepLabel.textContent = label
  stepDetail.textContent = loose ? 'Press the beater to pack it in.' : 'Drag across or tap.'
  reset.disabled = busy || (!loose && rows === firstRows)
}

function draw() {
  const { x, reedY } = render(ctx, backdrop, g, { rows, progress, beat, ready: loose && !busy })
  const width = loose ? g.w * .862 : Math.max(44, g.shuttleWidth + 10)
  const height = loose ? Math.max(44, g.h * .09) : Math.max(44, g.shuttleHeight + 12)
  const left = loose ? (g.w - width) / 2 : Math.max(0, Math.min(g.w - width, x - width / 2))
  const y = loose ? reedY : g.shed
  Object.assign(control.style, {
    left: `${left}px`, top: `${y - height / 2}px`, width: `${width}px`, height: `${height}px`,
  })
}

function resize() {
  const { width, height } = stage.getBoundingClientRect()
  if (!width || !height) return
  g = dimensions(width, height)
  scale = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0)
  backdrop = makeBackdrop(g, scale, rows)
  draw()
  control.disabled = false
  control.dataset.ready = ''
}

new ResizeObserver(resize).observe(stage)
updateDraft()
updateControls()

function animate(duration, frame, done) {
  busy = true
  updateControls()
  const started = performance.now()
  function tick(now) {
    const fraction = motion.matches ? 1 : Math.min(1, Math.max(0, (now - started) / duration))
    frame(fraction)
    if (fraction === 1) {
      busy = false
      done()
      updateControls()
      draw()
      return
    }
    draw()
    requestAnimationFrame(tick)
  }
  if (motion.matches) tick(started)
  else requestAnimationFrame(tick)
}

function settleShuttle(across) {
  const start = progress
  const target = Number(across)
  animate(across ? 160 + (1 - start) * 430 : 230, fraction => {
    progress = start + (target - start) * (1 - (1 - fraction) ** 2)
  }, () => {
    loose = across
    if (across) status.textContent = 'A loose gold strand is in place. Press the beater to pack it.'
  })
}

function packStrand() {
  animate(410, fraction => {
    beat = Math.sin(fraction * Math.PI / 2)
  }, () => {
    rows++
    loose = false
    progress = 0
    beat = 0
    backdrop = makeBackdrop(g, scale, rows)
    updateDraft()
    const firstOver = (rows % 4) + 1
    status.textContent = `${count.textContent}. The next row shifts right by one. The first full gold pair starts at warp thread ${firstOver}.`
  })
}

function activate() {
  if (loose) packStrand()
  else settleShuttle(true)
}

control.addEventListener('click', event => {
  if (busy || gesture || (event.detail > 0 && (dragged || directPress))) return
  activate()
})

control.addEventListener('pointerdown', event => {
  if (!event.isPrimary || event.button !== 0) return
  dragged = false
  directPress = false
  if (busy) return
  gesture = {
    id: event.pointerId, x: event.clientX, y: event.clientY,
    direction: rows % 2 === 0 ? 1 : -1,
  }
  control.setPointerCapture(event.pointerId)
})

control.addEventListener('pointermove', event => {
  if (event.pointerId !== gesture?.id) return
  const distance = event.clientX - gesture.x
  if (!dragged && Math.hypot(distance, event.clientY - gesture.y) < 6) return
  dragged = true
  if (loose) return
  stage.dataset.dragging = ''
  progress = Math.min(1, Math.max(0, distance * gesture.direction / (g.shuttleEnd - g.shuttleStart)))
  draw()
})

function endGesture(event) {
  if (event.pointerId !== gesture?.id) return
  gesture = null
  delete stage.dataset.dragging
  const released = event.type === 'pointerup'
  if (dragged) {
    if (!loose) settleShuttle(released && progress >= .9)
    return
  }
  if (!released || !control.contains(document.elementFromPoint(event.clientX, event.clientY))) {
    dragged = true
    return
  }
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    // A browser can suppress its click after a touch drag.
    directPress = true
    activate()
  }
}

control.addEventListener('pointerup', endGesture)
control.addEventListener('pointercancel', endGesture)
control.addEventListener('lostpointercapture', endGesture)

reset.addEventListener('click', () => {
  if (busy || gesture) return
  control.focus({ preventScroll: true })
  rows = firstRows
  loose = false
  progress = 0
  beat = 0
  backdrop = makeBackdrop(g, scale, rows)
  updateDraft()
  updateControls()
  draw()
  status.textContent = 'The starting swatch has been restored.'
})
