import { pillar, planPoint, seats, sightline } from './room.js'
import { drawStage, observeCanvas } from './stage.js'

const markInput = document.querySelector('#mark')
const markPosition = document.querySelector('#mark-position')
const seatName = document.querySelector('#seat-name')
const seatDetail = document.querySelector('#seat-detail')
const seatCount = document.querySelector('#seat-count')
const viewStatus = document.querySelector('#view-status')
const seatGroup = document.querySelector('#seats')
const pillarLabel = document.querySelector('#pillar-label')

const viewLabels = {
  clear: 'Clear view',
  clipped: 'Clipped by the pillar',
  blocked: 'Blocked by the pillar',
}

let selected = seats.find(seat => seat.name === 'B2')
let mark = Number(markInput.value) / 10
const pillarPosition = planPoint(pillar.x, pillar.z)
pillarLabel.style.left = `${pillarPosition.left}%`
pillarLabel.style.top = `${pillarPosition.top}%`
const stagePosition = planPoint(0, 0)
markInput.style.top = `${stagePosition.top}%`
const leftLimit = planPoint(Number(markInput.min) / 10, 0).left
const rightLimit = planPoint(Number(markInput.max) / 10, 0).left
markInput.style.setProperty('--mark-travel', `${rightLimit - leftLimit}%`)

const seatButtons = seats.map(seat => {
  const button = document.createElement('button')
  const position = planPoint(seat.x, seat.z)
  button.type = 'button'
  button.className = 'seat'
  button.textContent = seat.name
  button.style.left = `${position.left}%`
  button.style.top = `${position.top}%`
  seatGroup.append(button)
  return button
})

const redrawStage = observeCanvas(document.querySelector('#stage-view'), (ctx, width, height) => {
  drawStage(ctx, width, height, selected, mark)
})

const redrawPlan = observeCanvas(document.querySelector('#plan-lines'), (ctx, width, height) => {
  const point = (x, z) => {
    const { left, top } = planPoint(x, z)
    return [width * left / 100, height * top / 100]
  }
  ctx.clearRect(0, 0, width, height)

  const [markX, markY] = point(mark, 0)
  const [leftWing] = point(-3.65, 0)
  const [rightWing] = point(3.65, 0)
  ctx.strokeStyle = '#806052'
  ctx.beginPath()
  ctx.moveTo(leftWing, markY)
  ctx.lineTo(rightWing, markY)
  ctx.stroke()

  ctx.strokeStyle = sightline(selected, mark) === 'clear' ? '#efc27f' : '#e58f82'
  ctx.lineWidth = 1.25
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(...point(selected.x, selected.z))
  ctx.lineTo(markX, markY)
  ctx.stroke()
  ctx.setLineDash([])

  const [left, top] = point(pillar.x - pillar.width / 2, pillar.z - pillar.depth / 2)
  const [right, bottom] = point(pillar.x + pillar.width / 2, pillar.z + pillar.depth / 2)
  ctx.fillStyle = '#33262a'
  ctx.strokeStyle = '#e6ad8e'
  ctx.fillRect(left, top, right - left, bottom - top)
  ctx.strokeRect(left, top, right - left, bottom - top)
})

function render() {
  const position = mark === 0 ? 'Centre stage' : `${Math.abs(mark).toFixed(1)} m ${mark < 0 ? 'left' : 'right'} of centre`
  markPosition.value = position
  markInput.setAttribute('aria-valuetext', position)

  let clearSeats = 0
  seats.forEach((seat, index) => {
    const view = sightline(seat, mark)
    if (view === 'clear') clearSeats++
    const button = seatButtons[index]
    button.dataset.view = view
    button.setAttribute('aria-label', `${seat.name}, ${viewLabels[view].toLowerCase()}`)
    button.setAttribute('aria-pressed', String(seat === selected))
    button.tabIndex = seat === selected ? 0 : -1
  })
  seatCount.textContent = `${clearSeats} of ${seats.length} clear`

  const view = sightline(selected, mark)
  seatName.textContent = selected.name
  viewStatus.textContent = viewLabels[view]
  viewStatus.dataset.view = view
  const detail = view === 'clear' ? 'The whole performer is visible' : `The pillar hides ${view === 'blocked' ? 'the whole performer' : 'part of the performer'}`
  const description = `${detail} from seat ${selected.name}.`
  if (seatDetail.textContent !== description) seatDetail.textContent = description

  redrawStage()
  redrawPlan()
}

seatButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    selected = seats[index]
    render()
  })
  button.addEventListener('keydown', event => {
    const seat = seats[index]
    const lastColumn = 6
    const lastRow = 3
    let { row, column } = seat
    switch (event.key) {
      case 'ArrowLeft': column = Math.max(0, column - 1); break
      case 'ArrowRight': column = Math.min(lastColumn, column + 1); break
      case 'ArrowUp': row = Math.max(0, row - 1); break
      case 'ArrowDown': row = Math.min(lastRow, row + 1); break
      case 'Home': column = 0; break
      case 'End': column = lastColumn; break
      default: return
    }
    event.preventDefault()
    const next = row * (lastColumn + 1) + column
    selected = seats[next]
    render()
    seatButtons[next].focus()
  })
})

markInput.addEventListener('input', () => {
  mark = Number(markInput.value) / 10
  render()
})

render()
markInput.disabled = false
