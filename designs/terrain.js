// A folded core drawn as closed, offset contour rings.
export function drawCore(canvas, layer = null, w = canvas.clientWidth, h = canvas.clientHeight) {
  const scale = Math.min(devicePixelRatio || 1, 2)
  canvas.width = w * scale
  canvas.height = h * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)
  const radius = Math.min(w * .38, h * .81)
  const center = w * (w < 620 ? .51 : .56)
  for (let i = 0; i <= 96; i++) {
    const t = i / 96, active = layer !== null && Math.abs(layer - i) < 1.2
    ctx.beginPath()
    for (let j = 0; j <= 200; j++) {
      const a = j * Math.PI / 100
      const r = radius * (.86 + .14 * Math.cos(t * 4)) * (1 + .16 * Math.sin(3*a + t*3) + .1 * Math.cos(2*a - t*4))
      const x = center + r * Math.cos(a) + radius * .17 * Math.sin(t*5)
      const y = h*.64 - t*h*.31 + r*(.28*Math.sin(a) - .19*Math.cos(a) + .12*Math.sin(3*a+t*5))
      if (!j) ctx.moveTo(x,y)
      else ctx.lineTo(x,y)
    }
    ctx.closePath()
    ctx.fillStyle = active ? '#ffab67' : '#203595'
    ctx.fill()
    ctx.lineWidth = active ? 3 : .85
    ctx.strokeStyle = active ? '#ffab67' : '#eddbc2'
    ctx.stroke()
  }
}
