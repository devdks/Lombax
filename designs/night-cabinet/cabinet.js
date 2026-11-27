const specimens = {
  fluorite: {
    name: 'Fluorite', formula: 'CaF₂', color: 'violet-blue', tint: [102, 82, 255],
    alt: 'Intergrown lavender fluorite cubes with stepped faces',
  },
  calcite: {
    name: 'Calcite', formula: 'CaCO₃', color: 'orange-red', tint: [255, 76, 33],
    alt: 'Ivory calcite crystals tapering to sharp points',
  },
  willemite: {
    name: 'Willemite', formula: 'Zn₂SiO₄', color: 'yellow-green', tint: [139, 255, 37],
    alt: 'An irregular piece of dark rock mottled with olive willemite grains',
  },
}
const frame = document.querySelector('#frame')
const mineral = document.querySelector('#mineral')
const emission = document.querySelector('#emission')
const context = emission.getContext('2d', { willReadFrequently: true })
const buttons = [...document.querySelectorAll('[data-mineral]')]
const modeLabels = { day: 'Daylight', spot: 'UV spot', flood: 'UV flood' }
let current = 'fluorite'
let spot = { x: 56, y: 45 }

function moveSpot(x, y) {
  spot = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  frame.style.setProperty('--x', spot.x + '%')
  frame.style.setProperty('--y', spot.y + '%')
}

// Preserve the relief in the illustration. In willemite, illuminate the
// yellow-green grains preferentially so the surrounding matrix stays dark.
function renderEmission() {
  emission.width = mineral.naturalWidth
  emission.height = mineral.naturalHeight
  context.drawImage(mineral, 0, 0)
  const bitmap = context.getImageData(0, 0, emission.width, emission.height)
  const pixels = bitmap.data
  const { tint } = specimens[current]
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const light = (0.3 * r + 0.59 * g + 0.11 * b) / 255
    const response = current === 'willemite' ? Math.min(1, Math.max(0, (g - b) / 42)) : 1
    const intensity = Math.pow(light, 0.72) * response
    for (let channel = 0; channel < 3; channel++) {
      pixels[i + channel] = 1.5 * intensity * tint[channel] + 28 * light
    }
  }
  context.putImageData(bitmap, 0, 0)
  emission.hidden = false
}

function setMode(mode) {
  frame.dataset.mode = mode
  frame.tabIndex = mode === 'spot' ? 0 : -1
  const name = specimens[current].name
  frame.setAttribute('aria-label', name + ' specimen, ' + modeLabels[mode])
  document.querySelector('#lamp').textContent = modeLabels[mode]
  document.querySelector('#help').textContent = {
    spot: 'Move the spot · drag or use arrow keys',
    flood: 'Ultraviolet light across the whole specimen',
    day: 'Natural color under white light',
  }[mode]
}

mineral.addEventListener('load', renderEmission)
if (mineral.complete && mineral.naturalWidth) renderEmission()
for (const [index, button] of buttons.entries()) {
  button.addEventListener('click', () => {
    if (current === button.dataset.mineral) return
    current = button.dataset.mineral
    const specimen = specimens[current]
    for (const item of buttons) item.setAttribute('aria-pressed', String(item === button))
    emission.hidden = true
    mineral.src = button.querySelector('img').src
    mineral.alt = specimen.alt
    document.querySelector('#fig').textContent = String(index + 1).padStart(2, '0')
    document.querySelector('#specimen-caption').replaceChildren(specimen.name + ' ', Object.assign(document.createElement('i'), { textContent: '/' }), ' ' + specimen.formula)
    document.querySelector('#note').textContent = 'This illustrated ' + current + ' specimen fluoresces ' + specimen.color + ' under ultraviolet light.'
    moveSpot(56, 45)
    setMode(frame.dataset.mode)
  })
}
for (const input of document.querySelectorAll('input[name=light]')) {
  input.addEventListener('change', () => setMode(input.value))
}
setMode(document.querySelector('input[name=light]:checked').value)

function pointLamp(event) {
  if (frame.dataset.mode !== 'spot') return
  const bounds = frame.getBoundingClientRect()
  moveSpot(100 * (event.clientX - bounds.left) / bounds.width, 100 * (event.clientY - bounds.top) / bounds.height)
}
frame.addEventListener('pointerdown', event => {
  if (frame.dataset.mode !== 'spot') return
  frame.setPointerCapture(event.pointerId)
  pointLamp(event)
})
frame.addEventListener('pointermove', pointLamp)
const steps = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] }
frame.addEventListener('keydown', event => {
  const step = steps[event.key]
  if (!step || frame.dataset.mode !== 'spot') return
  event.preventDefault()
  moveSpot(spot.x + step[0], spot.y + step[1])
})
