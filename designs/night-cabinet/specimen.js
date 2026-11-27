import { renderFluorescence, specimens } from './fluorescence.js'
import { coverPoint, imageArea, playArrival } from './arrival.js'

const page = document.body
const mineral = page.dataset.mineral
const image = document.querySelector('#specimen')
const fluorescence = document.querySelector('#fluorescence')
const lights = document.querySelector('fieldset')
const reading = document.querySelector('#reading')
const arrival = document.querySelector('#arrival')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
const root = document.documentElement

function uncover() {
  root.classList.remove('opening')
  root.style.removeProperty('--held-frame')
}

function setLight(mode) {
  page.dataset.light = mode
  reading.textContent = mode === 'uv' ? specimens[mineral].color + ' emission' : 'Reflected light'
}

async function prepareSpecimen() {
  try {
    await image.decode()
  } catch {
    uncover()
    return
  }
  if (!renderFluorescence(image, fluorescence, mineral)) {
    uncover()
    return
  }

  fluorescence.hidden = false
  page.dataset.ready = ''
  lights.disabled = false
  const initialLight = lights.querySelector('input:checked').value
  setLight(initialLight)
  lights.addEventListener('change', event => setLight(event.target.value))

  const handoff = window.nightCabinetArrival
  delete window.nightCabinetArrival
  if (root.classList.contains('opening') && !reduceMotion.matches && !document.hidden &&
    playArrival(arrival, mineral, image, fluorescence, {
      from: coverPoint[mineral],
      origin: handoff?.origin ?? imageArea(image),
      seed: handoff?.seed,
      onDraw: uncover,
    })) return
  uncover()
}

prepareSpecimen()
