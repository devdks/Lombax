import { duration, runoff, sites } from './runoff.js'
import { createCourtyard } from './courtyard.js'

const get = id => document.getElementById(id)
const rain = get('rain')
const minute = get('minute')
const replay = get('replay')
const overflow = get('overflow')
const scene = get('scene')
const model = get('model-notes')
const viewButtons = [get('slope-view'), get('plan-view')]
const radios = [...document.querySelectorAll('[name="site"]')]
const pins = [...document.querySelectorAll('[data-pin]')]
const sideValues = [...document.querySelectorAll('[data-volume]')]
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })
const litres = value => `${number.format(value)} L`
const illustration = createCourtyard(scene, document.querySelector('.annotations'))

let placement = radios.find(radio => radio.checked).value
let playback = 0
let startedAt = 0
let currentMinute = Number(minute.value)
let currentRain = Number(rain.value)
let currentResult = runoff(currentRain, currentMinute, placement)

function sliderProgress(slider, value) {
  slider.style.setProperty('--progress', `${100 * (value - Number(slider.min)) / (Number(slider.max) - Number(slider.min))}%`)
}

function changeReadout(element, template, value) {
  element.replaceChildren(document.createTextNode(value), template.cloneNode(true))
}

const rainReadout = get('rain-readout')
const rainUnit = rainReadout.querySelector('span')
const timeReadout = get('time-readout')
const timeUnit = timeReadout.querySelector('span')

function updateComparison() {
  const endings = Object.fromEntries(radios.map(({ value }) => [value, runoff(currentRain, duration, value)]))
  for (const cell of sideValues) cell.textContent = litres(endings[cell.dataset.volume].door)

  const best = Object.keys(sites).reduce((winner, candidate) => endings[candidate].door < endings[winner].door ? candidate : winner)
  const bestResult = endings[best]
  const improvement = endings[placement].door - bestResult.door
  const equal = Math.abs(improvement) < 1e-8
  const lead = document.createElement('strong')
  lead.textContent = equal ? `${sites[placement].name} gives the lowest runoff.` : `${sites[best].name} leaves ${litres(improvement)} less at the door.`
  const reason = best === 'low' && !bestResult.full
    ? 'Both runoff paths fit within the garden’s storage and drainage.'
    : sites[equal ? placement : best].reason
  get('recommendation').replaceChildren(lead, document.createTextNode(reason))
  const overflowMinute = endings[placement].overflowMinute
  overflow.hidden = overflowMinute > duration
  if (!overflow.hidden) {
    overflow.dataset.minute = overflowMinute
    overflow.textContent = `Overflow at ${overflowMinute} min ↗`
  }
}

function draw(phase = 0) {
  illustration?.draw({ ...currentResult, elapsed: currentMinute }, phase)
}

function readMinute({ announce = false, phase = 0 } = {}) {
  currentResult = runoff(currentRain, currentMinute, placement)
  minute.value = currentMinute
  minute.setAttribute('aria-valuetext', `Minute ${currentMinute} of ${duration}`)
  sliderProgress(minute, currentMinute)
  changeReadout(timeReadout, timeUnit, currentMinute)
  get('door-volume').textContent = number.format(currentResult.door)
  get('comparison').textContent = placement === 'none'
    ? 'All runoff reaches the door.'
    : `${litres(currentResult.kept)} kept away by the garden.`
  const site = sites[placement]
  get('site-note').textContent = site?.note ?? 'Both channels lead to the workshop entrance.'
  if (announce) {
    get('announcement').textContent = `${site?.name ?? 'No garden'}. Minute ${currentMinute}. ${litres(currentResult.door)} reaches the door. ${get('recommendation').textContent}`
  }
  draw(phase)
}

function selectPlacement(next) {
  placement = next
  for (const radio of radios) radio.checked = radio.value === placement
  for (const pin of pins) pin.setAttribute('aria-pressed', String(pin.dataset.pin === placement))
  illustration?.setPlacement(placement)
  updateComparison()
  readMinute({ announce: true })
}

function readRain(announce = false) {
  currentRain = Number(rain.value)
  sliderProgress(rain, currentRain)
  changeReadout(rainReadout, rainUnit, `${currentRain} `)
  rain.setAttribute('aria-valuetext', `${currentRain} millimetres per hour`)
  updateComparison()
  readMinute({ announce })
}

function setReplayLabel(icon, label) {
  get('replay-icon').textContent = icon
  get('replay-label').textContent = label
}

function stopPlayback(label) {
  cancelAnimationFrame(playback)
  playback = 0
  setReplayLabel(label === 'Resume' ? '▶' : '↻', label)
}

function tick(time) {
  const elapsed = Math.min(duration, (time - startedAt) / 255)
  const nextMinute = Math.floor(elapsed)
  const phase = reducedMotion.matches ? 0 : (time - startedAt) / 760
  if (nextMinute !== currentMinute || elapsed >= duration) {
    currentMinute = nextMinute
    readMinute({ announce: elapsed >= duration, phase })
  } else if (!reducedMotion.matches) {
    draw(phase)
  }
  if (elapsed < duration) playback = requestAnimationFrame(tick)
  else stopPlayback('Replay storm')
}

replay.addEventListener('click', () => {
  if (playback) {
    stopPlayback('Resume')
    return
  }
  if (currentMinute === duration) currentMinute = 0
  readMinute()
  startedAt = performance.now() - currentMinute * 255
  setReplayLabel('Ⅱ', 'Pause')
  playback = requestAnimationFrame(tick)
})

function seek(next, announce = false) {
  currentMinute = next
  stopPlayback(currentMinute === duration ? 'Replay storm' : 'Resume')
  readMinute({ announce })
}

overflow.addEventListener('click', () => seek(Number(overflow.dataset.minute), true))
minute.addEventListener('input', () => seek(Number(minute.value)))
minute.addEventListener('change', () => readMinute({ announce: true }))
rain.addEventListener('input', () => readRain())
rain.addEventListener('change', () => readRain(true))

for (const radio of radios) radio.addEventListener('change', () => selectPlacement(radio.value))
for (const pin of pins) pin.addEventListener('click', () => selectPlacement(pin.dataset.pin))
for (const button of viewButtons) {
  button.addEventListener('click', () => {
    for (const choice of viewButtons) choice.setAttribute('aria-pressed', String(choice === button))
    illustration?.setView(button.id === 'plan-view' ? 'plan' : 'slope')
    draw()
  })
}

get('open-model').addEventListener('click', () => model.showModal())
if (illustration) {
  new ResizeObserver(() => {
    if (illustration.layout()) draw()
  }).observe(scene.parentElement)
} else {
  document.querySelector('.view-options').hidden = true
  scene.replaceWith(Object.assign(document.createElement('img'), { src: new URL('./cover.webp', import.meta.url).href, alt: 'A sloping courtyard with two runoff paths converging at the workshop door.' }))
}

readRain()
