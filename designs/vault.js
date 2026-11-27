import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import './comet.css'
import { mountCometVault } from './comet.js'
import { drawCore } from './terrain.js'
import { seats } from './behind-the-pillar/room.js'
import { drawStage, observeCanvas } from './behind-the-pillar/stage.js'

const canvas = document.querySelector('.plate canvas')
new ResizeObserver(() => {
  if (canvas.clientWidth) drawCore(canvas)
}).observe(canvas)

const stageCover = document.querySelector('.pillar-preview')
const coverSeat = seats.find(seat => seat.name === 'B2')
observeCanvas(stageCover, (ctx, width, height) => drawStage(ctx, width, height, coverSeat, 1.8))

function previewArt(plate) {
  const image = plate.querySelector('img')
  if (image) return image.currentSrc || image.src

  const width = 640
  const height = 360
  const art = document.createElement('canvas')
  art.width = width
  art.height = height
  const ctx = art.getContext('2d')
  const paragraph = plate.querySelector('.paragraph-preview')

  if (plate.querySelector('.pillar-preview')) {
    drawStage(ctx, width, height, coverSeat, 1.8)
  } else if (paragraph) {
    ctx.fillStyle = '#73251e'
    ctx.fillRect(0, 0, width, height)
    ctx.font = '36px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#f4dbce'
    const marked = paragraph.querySelector('span')
    const lead = marked.previousSibling.textContent
    const firstLine = lead + marked.textContent + marked.nextSibling.textContent
    ctx.fillText(firstLine, width / 2, 164)
    ctx.fillText(paragraph.lastChild.textContent, width / 2, 209)
    const start = (width - ctx.measureText(firstLine).width) / 2 + ctx.measureText(lead).width
    const end = start + ctx.measureText(marked.textContent).width
    ctx.beginPath()
    ctx.moveTo(start, 175)
    for (let x = start; x <= end; x++) {
      const y = 175 + Math.sin(x / 3) * 2
      ctx.lineTo(x, y)
    }
    ctx.strokeStyle = '#f4b38e'
    ctx.lineWidth = 2
    ctx.stroke()
  } else {
    drawCore(art, null, width, height)
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = '#1d3292'
    ctx.fillRect(0, 0, width, height)
  }
  return art.toDataURL('image/webp', .85)
}

mountCometVault(previewArt)
