import { drawCore } from './terrain.js'
import { seats } from './behind-the-pillar/room.js'
import { drawStage, observeCanvas } from './behind-the-pillar/stage.js'

const canvas = document.querySelector('.plate canvas')
new ResizeObserver(() => drawCore(canvas)).observe(canvas)

const stageCover = document.querySelector('.pillar-preview')
const coverSeat = seats.find(seat => seat.name === 'B2')
observeCanvas(stageCover, (ctx, width, height) => drawStage(ctx, width, height, coverSeat, 1.8))
