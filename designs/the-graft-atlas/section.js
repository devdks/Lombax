import { random, hash } from './ink.js'

// Each aril is a child of the person whose fruit has been opened.
export function paintSection(canvas, person, children) {
  const width = 720,
    height = 380,
    c = canvas.getContext('2d'),
    rng = random(hash(person.id))
  canvas.width = width * 1.5
  canvas.height = height * 1.5
  c.scale(1.5, 1.5)
  c.translate(360, 187)
  const skin = new Path2D()
  skin.moveTo(-11, -132)
  skin.bezierCurveTo(-112, -157, -180, -90, -163, 8)
  skin.bezierCurveTo(-153, 95, -78, 150, -25, 138)
  skin.lineTo(-21, 165)
  skin.lineTo(-8, 152)
  skin.lineTo(1, 174)
  skin.lineTo(11, 151)
  skin.lineTo(27, 162)
  skin.lineTo(22, 136)
  skin.bezierCurveTo(107, 143, 164, 72, 166, -12)
  skin.bezierCurveTo(170, -99, 92, -156, -11, -132)
  c.fillStyle = '#a44430'
  c.fill(skin)
  c.strokeStyle = '#66372d'
  c.lineWidth = 2
  c.stroke(skin)
  c.save()
  c.clip(skin)
  for (let i = 0; i < 105; i++) {
    const a = (i / 104) * Math.PI * 2
    c.beginPath()
    c.moveTo(Math.cos(a) * 135, Math.sin(a) * 118)
    c.quadraticCurveTo(
      Math.cos(a + 0.14) * 160,
      Math.sin(a + 0.14) * 143,
      Math.cos(a + 0.07) * 181,
      Math.sin(a + 0.07) * 178,
    )
    c.strokeStyle = i % 3 ? '#763524' : '#daa675'
    c.lineWidth = 0.65 + rng()
    c.stroke()
  }
  c.beginPath()
  c.ellipse(0, -4, 149, 125, -0.08, 0, Math.PI * 2)
  c.fillStyle = '#e4c49a'
  c.fill()
  for (let i = 0; i < 3000; i++) {
    const x = (rng() - 0.5) * 300,
      y = (rng() - 0.5) * 250
    if ((x / 146) ** 2 + (y / 120) ** 2 < 1) {
      c.fillStyle = rng() > 0.5 ? '#aa795c75' : '#fff4ccaa'
      c.fillRect(x, y, rng() * 1.6 + 0.45, rng() * 1.2 + 0.4)
    }
  }
  for (let row = -7; row <= 7; row++)
    for (let col = -9; col <= 9; col++) {
      const x = (col + (row % 2) * 0.45) * 14 + rng() * 3,
        y = row * 14 + rng() * 3
      const rad = Math.hypot(x / 139, y / 112),
        a = Math.atan2(y, x)
      if (rad > 0.97 || rad < 0.16 || Math.abs(Math.sin((a - 0.13) * 3)) < 0.2) continue
      c.beginPath()
      c.ellipse(x, y, 5 + rng() * 2, 6 + rng() * 2, a * 0.65, 0, Math.PI * 2)
      c.fillStyle = rng() > 0.5 ? '#d6aa8275' : '#d2a27b66'
      c.fill()
      c.strokeStyle = '#ae795d99'
      c.lineWidth = 0.55
      c.stroke()
      c.beginPath()
      c.ellipse(x - 1, y + 1, 4.7, 5.5, a * 0.65, 0.18, 2.15)
      c.strokeStyle = '#f6deb6'
      c.lineWidth = 1.3
      c.stroke()
    }
  // Pale septa radiate from the center and divide the chambers.
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.13
    c.save()
    c.rotate(a)
    c.beginPath()
    c.moveTo(-7, 0)
    c.quadraticCurveTo(27, -11, 55, 0)
    c.quadraticCurveTo(89, 13, 120, 0)
    c.quadraticCurveTo(80, 19, 56, 7)
    c.quadraticCurveTo(34, -3, 0, 8)
    c.fillStyle = '#f3e1b9'
    c.fill()
    c.restore()
  }
  const anchors = children.map((_, i) => {
    const a = children.length === 1 ? -1.1 : Math.PI + 0.28 + (i / children.length) * Math.PI * 2
    const x = Math.cos(a) * 91,
      y = Math.sin(a) * 69
    c.save()
    c.translate(x, y)
    c.rotate(a * 0.12)
    const aril = new Path2D('M-17 -14 Q-2 -27 16 -15 Q27 -1 12 17 Q-4 28 -19 14 Q-28 1 -17 -14Z')
    const g = c.createRadialGradient(-6, -9, 1, 0, 3, 27)
    g.addColorStop(0, '#e9a28b')
    g.addColorStop(0.35, '#c44c3e')
    g.addColorStop(0.76, '#a12d2a')
    g.addColorStop(1, '#6a2424')
    c.fillStyle = g
    c.fill(aril)
    c.strokeStyle = '#7e322a'
    c.lineWidth = 1.15
    c.stroke(aril)
    c.beginPath()
    c.ellipse(-7, -10, 5, 2.1, -0.6, 0, Math.PI * 2)
    c.fillStyle = '#ffe2bc'
    c.fill()
    c.restore()
    return { x: 360 + x, y: 187 + y }
  })
  c.restore()
  c.translate(-360, -187)
  anchors.forEach(({ x, y }, i) => {
    const right = x >= 360,
      peers = anchors.filter((p) => p.x >= 360 === right).sort((a, b) => a.y - b.y)
    const rank = peers.findIndex((p) => p.x === x && p.y === y),
      endY = 190 + (rank - (peers.length - 1) / 2) * 70
    const endX = right ? 592 : 128
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(right ? 509 : 211, endY)
    c.lineTo(endX, endY)
    c.strokeStyle = '#814433'
    c.lineWidth = 0.9
    c.stroke()
    anchors[i].labelX = right ? 640 : 80
    anchors[i].labelY = endY
  })
  return anchors
}
