import { random } from './ink.js'

// A distant orchard ridge, etched once at viewport size.
export function drawDusk(canvas) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight
  if (!w || !h) return
  const c = canvas.getContext('2d'),
    r = Math.min(devicePixelRatio, 1.5),
    rng = random(1934)
  canvas.width = w * r
  canvas.height = h * r
  c.scale(r, r)
  const light = c.createRadialGradient(w * 0.67, h * 0.54, 0, w * 0.67, h * 0.54, w * 0.75)
  light.addColorStop(0, '#926e6685')
  light.addColorStop(0.5, '#50404c65')
  light.addColorStop(1, '#22212b00')
  c.fillStyle = light
  c.fillRect(0, 0, w, h)
  for (let i = 0; i < Math.ceil(w * 0.59); i++) {
    const x = rng() * w,
      y = rng() * h * 0.69,
      s = rng() * 0.68 + 0.23
    c.fillStyle = 'rgba(249,224,190,' + (0.1 + rng() * 0.46) + ')'
    c.beginPath()
    c.arc(x, y, s, 0, Math.PI * 2)
    c.fill()
  }
  for (let layer = 0; layer < 4; layer++) {
    const level = h * (0.57 + layer * 0.078),
      amp = h * (0.04 + layer * 0.001),
      points = []
    const offset = rng() * 20
    for (let x = -2; x <= w + 3; x += 3) {
      const t = x / w
      const y =
        level +
        amp *
          (Math.sin(t * 8 + offset) * 0.6 +
            Math.sin(t * 20 + offset) * 0.48 +
            Math.cos(t * 48 + offset) * 0.19 +
            Math.sin(t * 96) * 0.055)
      points.push([x, y])
    }
    c.fillStyle = ['#37303c85', '#302c368c', '#24242eac', '#1b1d26ce'][layer]
    c.beginPath()
    c.moveTo(-2, h)
    for (const [x, y] of points) c.lineTo(x, y)
    c.lineTo(w + 3, h)
    c.fill()
    for (const [x, y] of points) {
      const tall = (0.8 + rng() * 4) * (1 + layer * 0.4)
      c.beginPath()
      c.moveTo(x - 1, y + 1)
      c.lineTo(x + 0.7, y - tall)
      c.lineTo(x + 2, y + 2)
      c.fill()
    }
  }
}
