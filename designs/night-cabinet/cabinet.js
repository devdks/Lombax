import { renderFluorescence, specimens } from './fluorescence.js'

const frame = document.querySelector('#frame')
const mineral = document.querySelector('#mineral')
const emission = document.querySelector('#emission')
const buttons = [...document.querySelectorAll('[data-mineral]')]
const openSpecimen = document.querySelector('#open-specimen')
const modeLabels = { day: 'Daylight', spot: 'UV spot', flood: 'UV flood' }
let current = 'fluorite'
let spot = { x: 56, y: 45 }

function moveSpot(x, y) {
  spot = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  frame.style.setProperty('--x', spot.x + '%')
  frame.style.setProperty('--y', spot.y + '%')
}

function renderEmission() {
  emission.hidden = !renderFluorescence(mineral, emission, current)
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

function selectSpecimen(button) {
  if (!button || current === button.dataset.mineral) return
  current = button.dataset.mineral
  const specimen = specimens[current]
  for (const item of buttons) item.setAttribute('aria-pressed', String(item === button))
  emission.hidden = true
  mineral.src = button.querySelector('img').src
  mineral.alt = specimen.alt
  document.querySelector('#fig').textContent = String(buttons.indexOf(button) + 1).padStart(2, '0')
  document.querySelector('#specimen-caption').replaceChildren(specimen.name + ' ', Object.assign(document.createElement('i'), { textContent: '/' }), ' ' + specimen.formula)
  document.querySelector('#note').textContent = 'This illustrated ' + current + ' specimen fluoresces ' + specimen.color + ' under ultraviolet light.'
  openSpecimen.href = `./${current}/`
  openSpecimen.querySelector('span').textContent = 'Open ' + specimen.name
  moveSpot(56, 45)
  setMode(frame.dataset.mode)
}

mineral.addEventListener('load', renderEmission)
const initialSpecimen = new URLSearchParams(window.location.search).get('specimen')
selectSpecimen(buttons.find(button => button.dataset.mineral === initialSpecimen))
if (mineral.complete && mineral.naturalWidth) renderEmission()

for (const button of buttons) {
  button.addEventListener('click', () => {
    selectSpecimen(button)
    const url = new URL(window.location.href)
    url.searchParams.set('specimen', current)
    history.replaceState(history.state, '', url)
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
