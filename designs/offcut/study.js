import '@fontsource/instrument-serif/latin-400.css'
import { example, MAX_PIECES, MAX_ROWS, planCuts } from './plan.js'

const form = document.querySelector('#planner')
const rows = document.querySelector('#cut-rows')
const template = document.querySelector('#cut-template')
const boardList = document.querySelector('#boards')
const ruler = document.querySelector('#ruler')
const addButton = document.querySelector('#add-cut')
const message = document.querySelector('#form-message')
const strategies = document.querySelector('.strategies')
const cutDialog = document.querySelector('#cut-list')
const marksDialog = document.querySelector('#marks-dialog')
const pageNav = document.querySelector('.board-pages')
const prevPage = document.querySelector('#earlier-boards')
const nextPage = document.querySelector('#later-boards')
const shortView = matchMedia('(max-height: 475px)')
const shortestView = matchMedia('(max-height: 390px)')
const compactView = matchMedia('(max-height: 880px)')
const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 1 })
const storageKey = 'lombax-offcut-v1'

const mm = tenths => formatter.format(tenths / 10)
const letter = index => 'ABCDEF'[index]
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`

function make(tag, className, text) {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text !== undefined) element.textContent = text
  return element
}

function validInteger(value, low, high) {
  return Number.isInteger(value) && value >= low && value <= high
}

function validSettings(settings) {
  return settings &&
    validInteger(settings.stock, 10, 120000) &&
    validInteger(settings.kerf, 0, 200) &&
    validInteger(settings.keep, 10, 120000) &&
    Array.isArray(settings.cuts) && settings.cuts.length > 0 && settings.cuts.length <= MAX_ROWS &&
    settings.cuts.every(cut => cut && typeof cut.name === 'string' && cut.name.trim() &&
      cut.name.length <= 32 && validInteger(cut.length, 10, settings.stock) &&
      validInteger(cut.quantity, 1, MAX_PIECES)) &&
    settings.cuts.reduce((sum, cut) => sum + cut.quantity, 0) <= MAX_PIECES
}

let settings = example
let mode = 'long'
try {
  const saved = JSON.parse(localStorage.getItem(storageKey))
  if (validSettings(saved?.settings)) {
    settings = saved.settings
    mode = saved.mode === 'many' ? 'many' : 'long'
  }
} catch {
  // The planner works when storage is unavailable.
}

let plans = planCuts(settings)
let pageIndex = 0

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ settings, mode }))
  } catch {
    // Storage is optional.
  }
}

function rowInputs(row) {
  return [...row.querySelectorAll('input')]
}

function totalPieces() {
  return [...rows.querySelectorAll('[name="quantity"]')].reduce((sum, input) => sum + (input.valueAsNumber || 0), 0)
}

function refreshRows() {
  const items = [...rows.children]
  items.forEach((row, index) => {
    const code = letter(index)
    row.querySelector('.cut-letter').textContent = code
    const [name, length, quantity] = rowInputs(row)
    name.setAttribute('aria-label', `Piece ${code} name`)
    length.setAttribute('aria-label', `Piece ${code} length in millimetres`)
    quantity.setAttribute('aria-label', `Piece ${code} quantity`)
    const remove = row.querySelector('.remove')
    remove.setAttribute('aria-label', `Remove piece ${code}`)
    remove.disabled = items.length === 1
  })
  addButton.disabled = items.length >= MAX_ROWS
  document.querySelector('#piece-count').textContent = `${formatter.format(totalPieces())} total`
}

function addRow(cut = { name: '', length: '', quantity: 1 }) {
  const row = template.content.firstElementChild.cloneNode(true)
  const [name, length, quantity] = rowInputs(row)
  name.value = cut.name
  length.value = cut.length === '' ? '' : cut.length / 10
  quantity.value = cut.quantity
  rows.append(row)
  return name
}

function fillForm() {
  for (const field of ['stock', 'kerf', 'keep']) {
    form.elements[field].value = settings[field] / 10
    form.elements[field].removeAttribute('aria-invalid')
  }
  rows.replaceChildren()
  settings.cuts.forEach(addRow)
  refreshRows()
  strategies.querySelector(`[value="${mode}"]`).checked = true
}

function drawRuler(stock) {
  const target = stock / 4
  const power = 10 ** Math.floor(Math.log10(target))
  const step = [1, 2, 5, 10].map(tick => tick * power).find(tick => tick >= target)
  ruler.style.setProperty('--tick-step', `${100 * step / stock}%`)
  ruler.replaceChildren()
  const ticks = [0]
  for (let value = step; value < stock * 0.87; value += step) ticks.push(value)
  ticks.push(stock)
  ticks.forEach((value, index) => {
    const last = index === ticks.length - 1
    const label = make('span', last ? 'ruler-end' : '', last ? `${mm(value)} mm` : mm(value))
    label.style.left = `${100 * value / stock}%`
    if (!last && value / stock > 0.75) label.dataset.nearEnd = ''
    ruler.append(label)
  })
}

function position(segment, start, length) {
  segment.style.left = `${start / settings.stock * 100}%`
  segment.style.width = `${length / settings.stock * 100}%`
}

function buildMeasurements(pieces) {
  const measurements = make('div', 'measurements')
  measurements.hidden = true
  measurements.append(make('p', '', 'Mark the whole board from the same squared end before cutting. Keep the blade on the waste side of each mark.'))
  const table = make('table')
  const head = table.createTHead().insertRow()
  for (const name of ['Order', 'Piece', 'Length', 'Mark from start']) {
    const heading = make('th', '', name)
    heading.scope = 'col'
    head.append(heading)
  }
  const body = table.createTBody()
  pieces.forEach((piece, index) => {
    const row = body.insertRow()
    const values = [
      index + 1,
      `${letter(piece.index)} · ${piece.name}`,
      `${mm(piece.length)} mm`,
      piece.needsCut ? `${mm(piece.mark)} mm` : 'Use remaining end',
    ]
    values.forEach(value => { row.insertCell().textContent = value })
  })
  measurements.append(table)
  return measurements
}

function buildBoard(board, index) {
  const item = make('li', 'board')
  const heading = make('div', 'board-header')
  const number = String(index + 1).padStart(2, '0')
  const name = make('h3', '', `Board ${number}`)
  const end = board.leftover ? `${mm(board.leftover)} mm ${board.keeper ? 'keeper' : 'scrap'}` : 'No offcut'
  const remaining = make('span', board.keeper ? 'board-end is-keeper' : 'board-end', end)
  const toggle = make('button', 'cut-marks', 'Cut marks')
  toggle.type = 'button'
  toggle.setAttribute('aria-label', `Cut marks for board ${number}`)
  toggle.setAttribute('aria-haspopup', 'dialog')
  const measurements = buildMeasurements(board.pieces)
  toggle.addEventListener('click', () => {
    document.querySelector('#marks-title').textContent = `Board ${number} cut marks`
    const copy = measurements.cloneNode(true)
    copy.hidden = false
    document.querySelector('#marks-content').replaceChildren(copy)
    marksDialog.showModal()
  })
  heading.append(name, remaining, toggle)

  const strip = make('div', 'board-strip')
  strip.setAttribute('role', 'img')
  const pieceDescriptions = board.pieces.map(piece => `${piece.name} ${mm(piece.length)} millimetres`)
  strip.setAttribute('aria-label', `From left to right, ${pieceDescriptions.join(', ')}. ${end}.`)
  for (const piece of board.pieces) {
    const segment = make('span', 'segment piece')
    const code = make('span', 'segment-letter', letter(piece.index))
    const name = make('span', 'segment-name', piece.name)
    const length = make('span', 'segment-length', mm(piece.length))
    segment.append(code, name, length)
    position(segment, piece.start, piece.length)
    segment.title = `${letter(piece.index)} · ${piece.name} · ${mm(piece.length)} mm`
    strip.append(segment)
    if (piece.needsCut) {
      const blade = make('span', 'segment blade')
      position(blade, piece.mark, piece.loss)
      strip.append(blade)
    }
  }
  if (board.leftover) {
    const offcut = make('span', board.keeper ? 'segment keeper' : 'segment scrap')
    offcut.append(make('span', 'leftover-label', board.keeper ? 'KEEP' : 'SCRAP'))
    position(offcut, board.end, board.leftover)
    strip.append(offcut)
  }
  item.append(heading, strip, measurements)
  return item
}

function showBoardPage() {
  const boardCount = boardList.children.length
  const twoBoards = shortView.matches || (compactView.matches && boardCount > 3)
  const pageSize = shortestView.matches ? 1 : twoBoards ? 2 : 3
  const lastPage = Math.ceil(boardCount / pageSize) - 1
  pageIndex = Math.min(pageIndex, lastPage)
  const first = pageIndex * pageSize
  const end = Math.min(boardCount, first + pageSize)
  const boards = [...boardList.children]
  boards.forEach((board, index) => { board.hidden = index < first || index >= end })
  pageNav.hidden = lastPage === 0
  document.querySelector('#board-range').textContent = first + 1 === end
    ? `Board ${end} of ${boardCount}`
    : `Boards ${first + 1}–${end} of ${boardCount}`
  prevPage.setAttribute('aria-disabled', String(pageIndex === 0))
  nextPage.setAttribute('aria-disabled', String(pageIndex === lastPage))
}

function renderPlan(announce = false) {
  const plan = plans[mode]
  const stock = `${plural(plan.boards.length, 'board')} × ${mm(settings.stock)} mm`
  const sameOffcuts = plans.long.boards.every((board, index) => board.leftover === plans.many.boards[index].leftover)
  const blades = plan.boards.flatMap(board => board.pieces).reduce((sum, piece) => sum + piece.loss, 0)

  document.querySelector('#stock-count').textContent = plan.boards.length
  document.querySelector('.stock-word').textContent = plan.boards.length === 1 ? ' board' : ' boards'
  document.querySelector('#stock-length').textContent = `${mm(settings.stock)} mm`
  document.querySelector('#kerf-reading').textContent = `${mm(settings.kerf)} mm kerf`
  const comparison = sameOffcuts ? 'The same offcuts satisfy both priorities.' : 'Both layouts use the fewest boards.'
  document.querySelector('#comparison').textContent = `${comparison} `
  document.querySelector('#keep-reading').textContent = `Keepers start at ${mm(settings.keep)} mm.`
  document.querySelector('#long-result').textContent = `${mm(plans.long.longest)} mm · ${plural(plans.long.keepers, 'keeper')}`
  document.querySelector('#many-result').textContent = `${mm(plans.many.longest)} mm · ${plural(plans.many.keepers, 'keeper')}`
  document.querySelector('#plan-title').dataset.printSummary =
    `${mode === 'many' ? 'Most keepers' : 'Longest offcut'} · ${mm(plan.longest)} mm longest · ${plural(plan.keepers, 'keeper')} · ${mm(blades)} mm lost to kerf`
  drawRuler(settings.stock)
  boardList.replaceChildren(...plan.boards.map(buildBoard))
  pageIndex = 0
  showBoardPage()
  if (announce) {
    document.querySelector('#plan-announcement').textContent =
      `${stock}. Longest offcut ${mm(plan.longest)} millimetres. ${plural(plan.keepers, 'keeper')}.`
  }
}

function tell(text, error = false) {
  message.textContent = text
  message.classList.toggle('error', error)
}

function edited() {
  for (const input of form.querySelectorAll('[aria-invalid]')) input.removeAttribute('aria-invalid')
  document.querySelector('#piece-count').textContent = `${formatter.format(totalPieces())} total`
  tell('Changes ready to apply.')
}

form.addEventListener('input', edited)
addButton.addEventListener('click', () => {
  const name = addRow()
  refreshRows()
  edited()
  name.focus()
})
rows.addEventListener('click', event => {
  const remove = event.target.closest('.remove')
  if (!remove) return
  const row = remove.closest('.cut-row')
  const next = row.nextElementSibling || row.previousElementSibling
  row.remove()
  refreshRows()
  edited()
  next?.querySelector('input').focus()
})

form.addEventListener('submit', event => {
  event.preventDefault()
  const read = name => Math.round(form.elements[name].valueAsNumber * 10)
  const stock = read('stock')
  const cuts = []
  let total = 0

  function error(input, text) {
    input.setAttribute('aria-invalid', 'true')
    input.focus()
    tell(text, true)
  }

  for (const [index, row] of [...rows.children].entries()) {
    const [name, length, quantity] = rowInputs(row)
    const cut = { name: name.value.trim(), length: Math.round(length.valueAsNumber * 10), quantity: quantity.valueAsNumber }
    if (!cut.name) return error(name, `Enter a name for piece ${letter(index)}.`)
    if (cut.length > stock) return error(length, `${cut.name} is longer than the ${mm(stock)} mm board.`)
    total += cut.quantity
    if (total > MAX_PIECES) return error(quantity, `The plan can include up to ${MAX_PIECES} pieces in total.`)
    cuts.push(cut)
  }

  settings = { stock, kerf: read('kerf'), keep: read('keep'), cuts }
  plans = planCuts(settings)
  renderPlan(true)
  save()
  tell('')
  cutDialog.close()
})

strategies.addEventListener('change', event => {
  mode = event.target.value
  renderPlan(true)
  save()
})

document.querySelector('#reset-example').addEventListener('click', () => {
  settings = example
  mode = 'long'
  plans = planCuts(settings)
  fillForm()
  renderPlan(true)
  save()
  tell('Bench example loaded.')
})

document.querySelector('#print-plan').addEventListener('click', () => window.print())
document.querySelector('#edit-list').addEventListener('click', () => cutDialog.showModal())
document.querySelector('#show-guide').addEventListener('click', () => document.querySelector('#guide').showModal())
for (const button of document.querySelectorAll('[data-close]')) {
  button.addEventListener('click', () => button.closest('dialog').close())
}
for (const [button, direction] of [[prevPage, -1], [nextPage, 1]]) {
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return
    pageIndex += direction
    showBoardPage()
  })
}
shortView.addEventListener('change', showBoardPage)
shortestView.addEventListener('change', showBoardPage)
compactView.addEventListener('change', showBoardPage)

fillForm()
renderPlan()
