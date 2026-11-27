import { renderFluorescence, specimens } from './fluorescence.js'
import { playArrival } from './arrival.js'

const page = document.body
const mineral = page.dataset.mineral
const image = document.querySelector('#specimen')
const fluorescence = document.querySelector('#fluorescence')
const lights = document.querySelector('fieldset')
const reading = document.querySelector('#reading')
const arrival = document.querySelector('#arrival')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')
const restored = performance.getEntriesByType('navigation')[0]?.type === 'back_forward'

function setLight(mode) {
  page.dataset.light = mode
  reading.textContent = mode === 'uv' ? specimens[mineral].color + ' emission' : 'Reflected light'
}

async function prepareSpecimen() {
  try {
    await image.decode()
  } catch {
    return
  }
  if (!renderFluorescence(image, fluorescence, mineral)) return

  fluorescence.hidden = false
  page.dataset.ready = ''
  lights.disabled = false
  const initialLight = lights.querySelector('input:checked').value
  setLight(initialLight)
  lights.addEventListener('change', event => setLight(event.target.value))

  if (!reduceMotion.matches && !restored && !document.hidden) {
    playArrival(arrival, mineral, image, fluorescence, reduceMotion)
  }
}

prepareSpecimen()
