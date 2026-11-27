import {drawCore} from '../terrain.js'
const layers = [
  ['Loose earth', 'Wind and weather collect in a thin skin at the surface.'],
  ['Ochre silt', 'Fine grains settle in ribbons where a river once slowed.'],
  ['Folded shale', 'Dark sheets buckle into pleats under pressure.'],
  ['Basalt bed', 'An old lava flow holds the deepest seam of the sample.']
]
const depth = document.querySelector('#depth')
const canvas = document.querySelector('canvas')
function sound() {
  const value = depth.valueAsNumber
  const [name, note] = layers[Math.min(3, Math.floor(value / 24))]
  document.querySelector('output').value = value + ' m below surface'
  depth.setAttribute('aria-valuetext', value + ' metres, ' + name)
  document.querySelector('h2').textContent = name
  document.querySelector('#note').textContent = note
  drawCore(canvas, 96 - value)
}
depth.addEventListener('input', sound)
new ResizeObserver(sound).observe(canvas)
sound()
