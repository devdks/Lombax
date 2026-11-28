import { familyName, lifespan } from './records.js'

const ns = 'http://www.w3.org/2000/svg'
function mark(tag, attrs, parent, text) {
  const el = document.createElementNS(ns, tag)
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
  if (text) el.textContent = text
  parent.append(el)
  return el
}

// Only direct grafts cross the boundary of the chosen family.
export function unfold(container, book, focus, onTrace, reduced) {
  const home = new Set(book.people.filter((p) => p.family === focus.family).map((p) => p.id))
  const shown = new Set(home)
  for (const [a, b] of [...book.descent, ...book.pairs]) {
    if (home.has(a) || home.has(b)) {
      shown.add(a)
      shown.add(b)
    }
  }
  const people = book.people.filter((p) => shown.has(p.id))
  const edges = book.descent.filter(
    ([a, b]) => shown.has(a) && shown.has(b) && (home.has(a) || home.has(b)),
  )
  const pairs = book.pairs.filter(([a, b]) => home.has(a) || home.has(b))
  const children = new Map(),
    incoming = new Map(),
    generation = new Map(),
    positions = new Map()
  for (const p of people) {
    children.set(p.id, [])
    incoming.set(p.id, 0)
    generation.set(p.id, 0)
  }
  for (const [a, b] of edges) {
    children.get(a).push(b)
    incoming.set(b, incoming.get(b) + 1)
  }
  const queue = people.filter((p) => !incoming.get(p.id)).map((p) => p.id)
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i]
    for (const child of children.get(id)) {
      generation.set(child, Math.max(generation.get(child), generation.get(id) + 1))
      incoming.set(child, incoming.get(child) - 1)
      if (!incoming.get(child)) queue.push(child)
    }
  }
  for (const [a, b] of pairs) {
    if (!home.has(b) && !edges.some(([p, c]) => c === b)) generation.set(b, generation.get(a))
    if (!home.has(a) && !edges.some(([p, c]) => c === a)) generation.set(a, generation.get(b))
  }
  const columns = []
  for (const p of people) {
    const g = generation.get(p.id)
    ;(columns[g] ??= []).push(p)
  }
  for (const list of columns) {
    if (!list) continue
    list.sort((a, b) => a.born.localeCompare(b.born) || a.name.localeCompare(b.name))
    // Give the spouse a neighboring bud even in a wide generation.
    for (const [a, b] of pairs) {
      const i = list.findIndex((p) => p.id === a),
        j = list.findIndex((p) => p.id === b)
      if (i >= 0 && j > i + 1) list.splice(i + 1, 0, list.splice(j, 1)[0])
    }
  }
  const high = Math.max(...columns.map((col) => col?.length || 0))
  const height = Math.max(300, high * 95 + 96),
    width = Math.max(430, columns.length * 232 + 58)
  const svg = mark(
    'svg',
    {
      viewBox: '0 0 ' + width + ' ' + height,
      style: 'width:' + width + 'px;height:' + height + 'px',
      'aria-label': familyName(book, focus.family) + ' descent and partner connections',
    },
    container,
  )
  columns.forEach((col, i) => {
    mark('text', { x: i * 232 + 40, y: 27, class: 'generation' }, svg, 'Generation ' + (i + 1))
    col.forEach((p, j) =>
      positions.set(p.id, { x: i * 232 + 42, y: (height - (col.length - 1) * 95) / 2 + j * 95 }),
    )
  })
  for (const [a, b] of edges) {
    const p = positions.get(a),
      q = positions.get(b),
      middle = (p.x + q.x) / 2
    mark(
      'path',
      {
        d:
          'M' +
          p.x +
          ' ' +
          p.y +
          ' C' +
          middle +
          ' ' +
          p.y +
          ' ' +
          middle +
          ' ' +
          q.y +
          ' ' +
          q.x +
          ' ' +
          q.y,
        class: 'descent',
      },
      svg,
    )
  }
  for (const [a, b] of pairs) {
    const p = positions.get(a),
      q = positions.get(b)
    mark(
      'path',
      {
        d:
          'M' +
          p.x +
          ' ' +
          p.y +
          ' C' +
          (p.x - 48) +
          ' ' +
          p.y +
          ' ' +
          (q.x - 48) +
          ' ' +
          q.y +
          ' ' +
          q.x +
          ' ' +
          q.y,
        class: 'union',
      },
      svg,
    )
  }
  for (const p of people) {
    const { x, y } = positions.get(p.id),
      g = mark(
        'g',
        {
          transform: 'translate(' + x + ' ' + y + ')',
          tabindex: 0,
          role: 'button',
          'aria-label': 'Trace ' + p.name,
          class: 'life' + (p.id === focus.id ? ' active' : ''),
        },
        svg,
      )
    mark('title', {}, g, p.name + ' · ' + lifespan(p))
    mark('ellipse', { cx: 7, cy: -2, rx: 13, ry: 6, transform: 'rotate(-28)', class: 'bud' }, g)
    const name = p.name.length > 23 ? p.name.slice(0, 21) + '…' : p.name
    mark('text', { x: 17, y: -8, class: 'mapName' }, g, name + (home.has(p.id) ? '' : ' ↗'))
    mark('text', { x: 18, y: 13, class: 'mapDate' }, g, lifespan(p))
    mark('path', { d: 'M-10 -31h196v62H-10z', fill: 'transparent' }, g)
    g.onclick = () => onTrace(p.id)
    g.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onTrace(p.id)
      }
    }
  }
  if (!reduced.matches && svg.animate)
    svg.animate([{ opacity: 0.1 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' })
}
