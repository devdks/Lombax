import { gsap } from 'gsap'
import {
  storageKey,
  specimen,
  readBook,
  relatives,
  familyName,
  linkParent,
  linkPartners,
  lifespan,
} from './records.js'
import { drawInk, inkLayout, hash } from './ink.js'
import { unfold } from './lineage.js'
import { drawDusk } from './dusk.js'
import { paintSection } from './section.js'

const $ = (id) => document.getElementById(id)
const icons = {
  leaf: 'M4 23Q7 6 28 4Q25 22 4 23ZM5 22 25 7M12 17l-1-6m7 1 6 0',
  grove: 'M4 24h25M10 22V9m0 8-5-6m5 3 5-7m5 15V6m0 9 7-7m-7 4-4-5',
  graft:
    'M3 27Q14 24 20 13L31 2M14 21 5 11m11 9L8 9m5 8 6 4m-4-7 6 4m-3-7 5 4M23 9q-3-7 2-8m0 6 7-4',
  register: 'M2 24q10-7 12-18 5 5 2 16Q11 20 2 24Zm14-2q7-14 15-15-1 12-15 15ZM7 24l9-4 11-10',
  root: 'M15 3v11l-4 6-8 5m12-10 7 5 7 2m-17-3-1 8m5-13 1 11m5-5 2 6',
  fruit: 'M17 2q-4 2-3 7m1-3q6-5 10-2-3 5-10 2M14 9C0 5 5 24 13 24l1 3 2-2 3 1 1-3c10-6 6-19-6-14Z',
  bud: 'M7 25q11-7 13-19M13 20Q2 11 5 7q10 3 9 12Zm4-7q0-10 12-11-2 10-12 11Z',
}
for (const i of document.querySelectorAll('[data-icon]'))
  i.innerHTML =
    '<svg viewBox="0 0 34 30" aria-hidden="true"><path d="' + icons[i.dataset.icon] + '"/></svg>'
const reduced = matchMedia('(prefers-reduced-motion: reduce)')
const sheet = $('sheet'),
  inner = $('sheetInner')
const escape = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  )
const person = (id) => book.people.find((p) => p.id === id)
let book,
  readIssue = ''
try {
  book = readBook()
} catch {
  book = specimen()
  readIssue = 'Stored records could not be read. Changes cannot be saved.'
}
let selected = 'mara',
  partnerId = 'ivo',
  mode = 'ink',
  lens = 'all',
  grove,
  groveRequest = 0,
  lastGrowth = null
let pages = { parents: 0, children: 0 },
  paintAnim,
  closeFocus = null,
  noticeTimer
try {
  const saved = JSON.parse(sessionStorage.getItem('graft.place') || 'null')
  if (saved && person(saved.selected)) {
    selected = saved.selected
    partnerId = saved.partnerId
    mode = saved.mode === 'grove' ? 'grove' : 'ink'
  }
} catch {}
if (!person(selected)) selected = book.people[0].id
function announce(message) {
  clearTimeout(noticeTimer)
  $('news').textContent = message
  noticeTimer = setTimeout(() => {
    $('news').textContent = ''
  }, 5000)
}
function kinship() {
  const focus = person(selected),
    r = relatives(book, selected)
  const childIds = new Set(r.children.map((p) => p.id))
  const others = new Set(
    book.descent.filter(([a, b]) => a !== selected && childIds.has(b)).map(([a]) => a),
  )
  const partners = [
    ...r.partners,
    ...book.people.filter((p) => others.has(p.id) && !r.partners.some((q) => q.id === p.id)),
  ]
  const partner =
    partnerId === 'solo' ? null : partners.find((p) => p.id === partnerId) || partners[0]
  if (partner) partnerId = partner.id
  // All children remain accessible through the record. The drawing shows the chosen union.
  const children = r.children.filter((p) =>
    partner
      ? book.descent.some(([a, b]) => a === partner.id && b === p.id)
      : !book.descent.some(([a, b]) => b === p.id && a !== selected),
  )
  return {
    focus,
    parents: r.parents,
    children,
    partners,
    partner,
    formal: !!partner && r.partners.some((p) => p.id === partner.id),
  }
}
function button(label, action, id, cls = '') {
  return (
    '<button type="button" class="' +
    cls +
    '" data-action="' +
    action +
    '" data-id="' +
    escape(id) +
    '">' +
    escape(label) +
    '</button>'
  )
}
function heading(caption, title) {
  return (
    '<p class="sheetTitle">' +
    escape(caption) +
    '</p><h2 id="dialogTitle">' +
    escape(title) +
    '</h2>'
  )
}
function openSheet(html, focusSelector) {
  const wasOpen = sheet.open
  if (!wasOpen) closeFocus = document.activeElement
  inner.innerHTML = html
  sheet.setAttribute('aria-labelledby', 'dialogTitle')
  if (!wasOpen) sheet.showModal()
  sheet.querySelector('.sheetScroll').scrollTop = 0
  const target = focusSelector ? inner.querySelector(focusSelector) : inner.querySelector('h2')
  if (target) {
    if (target.tagName === 'H2') target.tabIndex = -1
    target.focus({ preventScroll: true })
  }
}
sheet.querySelector('.close').onclick = () => sheet.close()
sheet.addEventListener('close', () => {
  delete sheet.dataset.map
  if (closeFocus?.isConnected) closeFocus.focus({ preventScroll: true })
  else $('record').focus({ preventScroll: true })
})

function projectPins(nodes) {
  const w = $('scene').clientWidth,
    h = $('scene').clientHeight,
    layer = $('leaders')
  const coords = new Map()
  for (const childRow of [false, true]) {
    const group = nodes.filter((n) => (n.role === 'Child') === childRow).sort((a, b) => a.x - b.x)
    if (!group.length) continue
    const gap = (Math.min((w * 0.89) / group.length, w < 550 ? 91 : 144) * 100) / w
    const y = Math.max(...group.map((n) => n.y)) + (childRow ? (w < 550 ? 9 : 4) : -2)
    let last = -Infinity
    const xs = group.map((n) => (last = Math.max(n.x, last + gap, gap / 2)))
    const shift = Math.max(0, xs.at(-1) + gap / 2 - 100)
    group.forEach((n, i) => coords.set(n.person.id, { x: xs[i] - shift, y: Math.min(94, y) }))
  }
  if (layer.children.length !== nodes.length) {
    layer.replaceChildren(
      ...nodes.map(() => document.createElementNS('http://www.w3.org/2000/svg', 'line')),
    )
  }
  const adjusted = nodes.map((n, i) => {
    const p = coords.get(n.person.id),
      line = layer.children[i]
    for (const [key, v] of Object.entries({ x1: n.x, y1: n.y, x2: p.x, y2: p.y }))
      line.setAttribute(key, v + '%')
    return { ...n, ...p }
  })
  setPins(adjusted, true)
}
function setPins(nodes, percent = false) {
  const holder = $('pins')
  const signature = nodes.map((n) => n.role + n.person.id).join('|')
  if (holder.dataset.key !== signature) {
    holder.replaceChildren()
    nodes.forEach((n) => {
      const b = document.createElement('button')
      b.className = 'pin ' + n.role.toLowerCase()
      b.dataset.id = n.person.id
      b.onclick = () => {
        if (n.role === 'Partner') {
          trace(n.person.id, selected)
          announce('Crossed the graft to ' + familyName(book, n.person.family))
        } else if (mode === 'ink' && n.role === 'Child') section(n.person.id)
        else showRecord(n.person.id)
      }
      b.append(document.createElement('small'), document.createElement('span'))
      holder.append(b)
    })
    holder.dataset.key = signature
  }
  nodes.forEach((n, i) => {
    const b = holder.children[i]
    b.style.left = (percent ? n.x : n.x / 9.6) + '%'
    b.style.top = (percent ? n.y : n.y / 6.1) + '%'
    b.firstChild.textContent =
      n.role === 'Partner' ? $('pins').dataset.join + ' · cross graft' : n.role
    b.lastChild.textContent = n.person.name
    b.setAttribute(
      'aria-label',
      n.role === 'Partner' ? 'Cross graft to ' + n.person.name : n.role + ' · ' + n.person.name,
    )
  })
}
function trace(id, via) {
  selected = id
  partnerId = via || null
  pages = { parents: 0, children: 0 }
  lens = 'all'
  lastGrowth = null
  if (sheet.open) sheet.close()
  render(true)
}
function stagePulse(nodes, event) {
  paintAnim?.kill()
  const layer = $('traceInk')
  layer.replaceChildren()
  if (reduced.matches) return
  const endpoints = event
    ? nodes.filter((n) => n.person.id === event.id)
    : nodes.filter((n) => (lens === 'roots' ? n.role === 'Parent' : n.role === 'Child'))
  const paths = endpoints.map((n) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    const d =
      n.role === 'Parent'
        ? 'M464 389 Q449 475 469 505 Q433 537 ' + n.x + ' ' + n.y
        : 'M469 503 Q440 437 464 390 T477 308 Q' +
          (n.x + 489) / 2 +
          ' 293 ' +
          n.x +
          ' ' +
          (n.y + 39)
    path.setAttribute('d', d)
    path.setAttribute('pathLength', '1')
    layer.append(path)
    return path
  })
  paintAnim = gsap.timeline()
  if (paths.length)
    paintAnim
      .fromTo(
        paths,
        { strokeDashoffset: 1, opacity: 1 },
        { strokeDashoffset: 0, duration: 0.88, stagger: 0.11, ease: 'power2.inOut' },
      )
      .to(paths, { opacity: 0, duration: 0.58 }, '+=.18')
  else paintAnim.fromTo($('engraving'), { opacity: 0.62 }, { opacity: 1, duration: 0.34 })
}
function ink(animate, event) {
  const k = kinship(),
    nodes = inkLayout(k, k.partner, pages, lens)
  const hits = $('fruitHits')
  hits.replaceChildren()
  for (const n of nodes.filter((n) => n.role === 'Child')) {
    n.issue = relatives(book, n.person.id).children.length
    const hit = document.createElement('button')
    hit.className = 'fruitHit'
    hit.setAttribute('aria-label', 'Open the fruit of ' + n.person.name)
    hit.style.left = (n.x + (n.x < 478 ? -8 : 8)) / 9.6 + '%'
    hit.style.top = (n.y + 63) / 6.1 + '%'
    hit.onclick = () => section(n.person.id)
    hits.append(hit)
  }
  drawInk($('engraving'), nodes, hash(selected))
  setPins(nodes)
  if (animate) stagePulse(nodes, event)
}
function updateTools(k) {
  const tools = $('inkTools')
  tools.querySelectorAll('[data-page]').forEach((b) => b.remove())
  for (const key of mode === 'ink' ? ['parents', 'children'] : ['children']) {
    if (k[key].length <= 3) continue
    const b = document.createElement('button')
    b.dataset.page = key
    b.textContent = 'More ' + key + ' ↻'
    b.onclick = () => {
      pages[key] = pages[key] + 3 >= k[key].length ? 0 : pages[key] + 3
      render(true)
    }
    ;(mode === 'ink' ? tools : $('orbitTools')).append(b)
  }
  $('lens').textContent = { all: 'All kin', roots: 'Ancestry', fruit: 'Descendants' }[lens]
  $('ancestors').setAttribute('aria-pressed', lens === 'roots')
  $('descendants').setAttribute('aria-pressed', lens === 'fruit')
}
async function render(animate = false, growth = null) {
  const ticket = ++groveRequest,
    k = kinship()
  $('pins').dataset.join = k.formal ? 'Partner' : 'Co-parent'
  document.body.dataset.view = mode
  $('inkMode').setAttribute('aria-pressed', mode === 'ink')
  $('groveMode').setAttribute('aria-pressed', mode === 'grove')
  $('inkTools').hidden = mode !== 'ink'
  $('orbitTools').hidden = mode !== 'grove'
  $('engraving').hidden = mode !== 'ink'
  $('orchard').hidden = mode !== 'grove'
  document.querySelector('.intro h1').innerHTML =
    mode === 'ink' ? 'The Graft<br><em>Atlas.</em>' : 'Night<br><em>Orchard.</em>'
  $('viewNote').innerHTML =
    mode === 'ink'
      ? 'Read a family from root to fruit.<br> Follow a graft into another tree.'
      : 'Walk between the parent trees.<br> Find their children taking root.'
  $('modeTitle').textContent =
    mode === 'ink' ? 'Herbarium · Ink on paper' : 'Night orchard · Living wood'
  $('familyTag').textContent = mode === 'ink' ? 'Current family' : 'In this clearing'
  $('add').lastElementChild.textContent = mode === 'ink' ? 'Add kin' : 'Plant kin'
  $('register').lastElementChild.textContent = mode === 'ink' ? 'Family register' : 'Find a tree'
  $('familyTitle').textContent = familyName(book, k.focus.family)
  $('unfold').hidden = mode !== 'ink'
  const soloChildren = relatives(book, selected).children.some(
    (p) => !book.descent.some(([a, b]) => b === p.id && a !== selected),
  )
  $('chooseUnion').hidden = k.partners.length < 2 && !(k.partners.length && soloChildren)
  $('record').textContent = k.focus.name + ' · ' + lifespan(k.focus) + ' ↗'
  $('counts').textContent = book.people.length + ' people · ' + book.families.length + ' families'
  $('orbitTools')
    .querySelectorAll('[data-page]')
    .forEach((b) => b.remove())
  updateTools(k)
  try {
    sessionStorage.setItem('graft.place', JSON.stringify({ selected, partnerId, mode }))
  } catch {}
  if (mode === 'ink') {
    grove?.hide()
    ink(animate, growth)
    return
  }
  try {
    if (!grove) {
      const { createGrove } = await import('./grove.js')
      if (ticket !== groveRequest) return
      grove = createGrove($('orchard'), projectPins, reduced)
    }
    const children = k.children
      .slice(pages.children, pages.children + 3)
      .map((p) => ({ ...p, issue: relatives(book, p.id).children.length }))
    grove.set({ ...k, children }, k.partner)
    const event = growth || (animate ? lastGrowth : null)
    if (event) grove.grow(event.id, event.birth)
    $('replay').disabled = !children.length && !k.focus
  } catch (error) {
    console.warn('Orchard rendering unavailable', error)
    mode = 'ink'
    render()
    announce('This browser could not open the 3D orchard. Your tree is available in the herbarium.')
  }
}
$('inkMode').onclick = () => {
  if (mode !== 'ink') {
    mode = 'ink'
    render(true)
  }
}
$('groveMode').onclick = () => {
  if (mode !== 'grove') {
    mode = 'grove'
    render(true)
  }
}
for (const [id, filter] of [
  ['ancestors', 'roots'],
  ['descendants', 'fruit'],
])
  $(id).onclick = () => {
    lens = lens === filter ? 'all' : filter
    render(true)
  }
$('west').onclick = () => grove?.rotate(-0.32)
$('east').onclick = () => grove?.rotate(0.32)
$('replay').onclick = () => {
  const k = kinship(),
    child = k.children[pages.children],
    event = lastGrowth || { id: child?.id || selected, birth: !!child }
  grove?.grow(event.id, event.birth)
  announce(event.birth ? 'Growth of ' + person(event.id).name : 'Growth of the parent tree')
}
let drag
$('orchard').addEventListener('pointerdown', (e) => {
  drag = e.clientX
  e.target.setPointerCapture(e.pointerId)
})
$('orchard').addEventListener('pointermove', (e) => {
  if (drag != null) {
    grove?.rotate((drag - e.clientX) * 0.009, false)
    drag = e.clientX
  }
})
for (const event of ['pointercancel', 'pointerup', 'lostpointercapture'])
  $('orchard').addEventListener(event, () => {
    drag = null
  })
new ResizeObserver(() => {
  if (mode === 'ink') ink(false)
  else grove?.resize()
}).observe($('scene'))
new ResizeObserver(() => drawDusk($('dusk'))).observe($('dusk'))
reduced.addEventListener('change', () => {
  if (reduced.matches) {
    paintAnim?.progress(1)
    grove?.stop()
  }
})
function showRecord(id) {
  const p = person(id),
    r = relatives(book, id)
  const members = (name, list) =>
    list.length
      ? '<dt>' +
        name +
        '</dt><dd>' +
        list.map((kin) => button(kin.name, 'record', kin.id)).join(' · ') +
        '</dd>'
      : ''
  openSheet(
    heading(familyName(book, p.family) + ' · Family record', p.name) +
      '<dl class="recordData"><dt>Life</dt><dd>' +
      escape(lifespan(p)) +
      '</dd>' +
      (p.place ? '<dt>Place</dt><dd>' + escape(p.place) + '</dd>' : '') +
      members('Parents', r.parents) +
      members('Partners', r.partners) +
      members('Children', r.children) +
      '</dl>' +
      (p.note ? '<p class="notes">' + escape(p.note) + '</p>' : '') +
      '<div class="sheetActions">' +
      button('Trace from here ↗', 'trace', id, 'primary') +
      button('Add kin', 'add', id) +
      button('Edit record', 'edit', id) +
      '</div>',
  )
}
function section(id, page = 0) {
  const p = person(id),
    offspring = relatives(book, id).children,
    list = offspring.slice(page, page + 6)
  openSheet(
    heading('Fruit section · ' + familyName(book, p.family), p.name) +
      '<p class="sheetHint">' +
      (offspring.length
        ? 'Each seed is a child. Follow one to its tree.'
        : 'No children recorded.') +
      '</p><div class="cut"><canvas id="sectionArt" aria-hidden="true"></canvas><div id="seeds"></div></div><div class="sheetActions">' +
      button('Read record', 'record', id) +
      button('Trace from here', 'trace', id) +
      button('Add kin', 'add', id) +
      '</div>',
  )
  const anchors = paintSection($('sectionArt'), p, list)
  list.forEach((child, i) => {
    const anchor = anchors[i],
      b = document.createElement('button')
    b.className = 'seedName'
    b.textContent = child.name
    b.setAttribute('aria-label', 'Trace ' + child.name)
    b.style.left = anchor.labelX / 7.2 + '%'
    b.style.top = anchor.labelY / 3.8 + '%'
    b.onclick = () => trace(child.id)
    const seed = document.createElement('button')
    seed.className = 'seedHit'
    seed.style.left = anchor.x / 7.2 + '%'
    seed.style.top = anchor.y / 3.8 + '%'
    seed.tabIndex = -1
    seed.setAttribute('aria-label', 'Trace the seed of ' + child.name)
    seed.onclick = b.onclick
    $('seeds').append(b, seed)
  })
  if (offspring.length > 6) {
    const next = document.createElement('button')
    next.textContent = 'More seeds ↻'
    next.onclick = () => section(id, page + 6 >= offspring.length ? 0 : page + 6)
    inner.querySelector('.sheetActions').append(next)
  }
  if (!reduced.matches)
    gsap.fromTo(
      $('sectionArt'),
      { clipPath: 'ellipse(2% 49% at 50% 50%)' },
      {
        clipPath: 'ellipse(72% 75% at 50% 50%)',
        duration: 0.65,
        ease: 'power2.out',
        clearProps: 'clipPath',
      },
    )
}
function register() {
  const example = JSON.stringify(book) === JSON.stringify(specimen())
  openSheet(
    heading('Family register', 'Find a life.') +
      '<div class="cols"><div><label for="search">Person</label><input type="search" id="search" placeholder="Find by name"></div><div><label for="filter">Family</label><select id="filter"><option value="">All families</option>' +
      families() +
      '</select></div></div><div id="matches"></div><div class="sheetActions">' +
      button(
        example ? 'Start my register' : 'Plant a new family',
        example ? 'start' : 'found',
        '',
        'primary',
      ) +
      button('Save a backup', 'export', '') +
      button('Restore backup', 'import', '') +
      '</div><p class="sheetHint">Records stay in this browser.' +
      (example
        ? ' Start your register with your first person, or explore the fictional Sorrel family.'
        : '') +
      '</p><input type="file" accept=".json,application/json" id="importFile" hidden>',
  )
  function list() {
    const q = $('search').value.trim().toLocaleLowerCase(),
      f = $('filter').value
    const matches = book.people
      .filter((p) => (!f || p.family === f) && p.name.toLocaleLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
    $('matches').innerHTML =
      matches
        .map(
          (p) =>
            '<button class="registerEntry" data-action="record" data-id="' +
            escape(p.id) +
            '"><span>' +
            escape(p.name) +
            '</span><small>' +
            escape(lifespan(p)) +
            '</small></button>',
        )
        .join('') || '<p>No matching people.</p>'
  }
  $('search').oninput = list
  $('filter').onchange = list
  list()
  $('importFile').onchange = importFile
}
function families() {
  return book.families
    .map((f) => '<option value="' + escape(f.id) + '">' + escape(f.name) + '</option>')
    .join('')
}
function options(people) {
  return people
    .map(
      (p) =>
        '<option value="' +
        escape(p.id) +
        '">' +
        escape(p.name) +
        ' · ' +
        escape(lifespan(p)) +
        '</option>',
    )
    .join('')
}
const field = (id, label, value = '', extra = '') =>
  '<label for="' +
  id +
  '">' +
  label +
  '</label><input id="' +
  id +
  '" name="' +
  id +
  '" value="' +
  escape(value) +
  '" ' +
  extra +
  '>'
function form(kind, id) {
  const anchor = person(id),
    editing = kind === 'edit',
    found = kind === 'found' || kind === 'start'
  const title = editing ? 'Edit this life.' : found ? 'Plant a family.' : 'Add kin.'
  const r = anchor ? relatives(book, id) : null
  const relation =
    editing || found
      ? ''
      : '<label for="relation">Relationship to ' +
        escape(anchor.name) +
        '</label><select id="relation"><option value="child">Child</option><option value="partner">Partner</option><option value="parent">Parent</option></select><div id="coField"><label for="coparent">Other parent</label><select id="coparent"><option value="">Unrecorded</option>' +
        options(book.people.filter((p) => p.id !== id)) +
        '</select></div><label for="existing">Use a record</label><select id="existing"><option value="">Create a person</option>' +
        options(book.people.filter((p) => p.id !== id)) +
        '</select>'
  openSheet(
    heading(anchor ? anchor.name : 'Family register', title) +
      '<form id="entryForm">' +
      relation +
      '<div id="fields">' +
      field(
        'name',
        'Full name',
        editing ? anchor.name : '',
        'required maxlength="160" autocomplete="off"',
      ) +
      '<label for="family">Home tree</label><select id="family">' +
      (found ? '' : families()) +
      '<option value="__new">New family tree…</option></select><div id="newFamily">' +
      field('treeName', 'Family name', '', 'maxlength="120"') +
      '</div>' +
      '<div class="cols"><div>' +
      field(
        'born',
        'Born',
        editing ? anchor.born : '',
        'placeholder="Year or date" maxlength="40"',
      ) +
      '</div><div>' +
      field('died', 'Died', editing ? anchor.died : '', 'placeholder="If known" maxlength="40"') +
      '</div></div>' +
      field('place', 'Place', editing ? anchor.place : '', 'maxlength="250"') +
      '<label for="note">Family note</label><textarea id="note" maxlength="5000">' +
      escape(editing ? anchor.note : '') +
      '</textarea></div>' +
      '<p class="error" role="alert"></p><div class="sheetActions"><button class="primary" type="submit">Save to the tree ↗</button></div></form>',
  )
  const rel = $('relation'),
    existing = $('existing')
  if (!found) $('family').value = anchor.family
  if ($('coparent'))
    $('coparent').value = id === selected ? kinship().partner?.id || '' : r.partners[0]?.id || ''
  function sync() {
    const create = !existing?.value
    $('fields').hidden = !create
    $('name').required = create
    $('newFamily').hidden = $('family').value !== '__new'
    $('treeName').required = create && !$('newFamily').hidden
    if (rel) $('coField').hidden = rel.value !== 'child'
  }
  $('family').onchange = sync
  if (rel) {
    rel.onchange = () => {
      if (!existing.value) $('family').value = rel.value === 'partner' ? '__new' : anchor.family
      sync()
    }
    existing.onchange = sync
  }
  sync()
  $('entryForm').onsubmit = async (e) => {
    e.preventDefault()
    const submit = e.submitter
    submit.disabled = true
    try {
      const relation = rel?.value,
        other = $('coparent')?.value
      const newId = editing ? id : existing?.value || crypto.randomUUID()
      await persist((next) => {
        if (kind === 'start') {
          if (JSON.stringify(next) !== JSON.stringify(specimen()))
            throw Error('The register has changed. Open the family register again.')
          for (const key of ['people', 'families', 'pairs', 'descent']) next[key] = []
        }
        const needed = [id, existing?.value, relation === 'child' ? other : null].filter(Boolean)
        if (needed.some((key) => !next.people.some((p) => p.id === key)))
          throw Error('The register changed. Open the record again.')
        if (!next.people.some((p) => p.id === newId) || editing) {
          let family = $('family').value
          if (family === '__new') {
            const name = $('treeName').value.trim()
            if (!name) throw Error('Enter a family name.')
            family = crypto.randomUUID()
            next.families.push({ id: family, name })
          }
          if (!next.families.some((f) => f.id === family))
            throw Error('The selected family has changed. Open the record again.')
          const values = Object.fromEntries(
            ['name', 'born', 'died', 'place', 'note'].map((k) => [k, $(k).value.trim()]),
          )
          if (!values.name) throw Error('Enter a name for this person.')
          if (editing)
            Object.assign(
              next.people.find((p) => p.id === id),
              values,
              { family },
            )
          else next.people.push({ id: newId, family, ...values })
        }
        if (relation === 'partner') linkPartners(next, id, newId)
        if (relation === 'parent') linkParent(next, newId, id)
        if (relation === 'child') {
          linkParent(next, id, newId)
          if (other) linkParent(next, other, newId)
        }
      })
      sheet.close()
      if (found) {
        selected = newId
        partnerId = null
        lens = 'all'
        pages = { parents: 0, children: 0 }
        lastGrowth = { id: newId, birth: false }
        await render(true, lastGrowth)
        announce('Planted the ' + familyName(book, person(newId).family) + ' family')
        return
      }
      selected = id
      pages = { parents: 0, children: 0 }
      lens = 'all'
      lastGrowth = null
      if (relation === 'partner') {
        partnerId = newId
        lastGrowth = { id: newId, birth: false }
      }
      if (relation === 'child') {
        partnerId = other || 'solo'
        const k = kinship()
        const index = k.children.findIndex((p) => p.id === newId)
        pages.children = Math.max(0, Math.floor(index / 3) * 3)
        lastGrowth = { id: newId, birth: true }
      }
      if (relation === 'parent' && mode === 'grove') {
        selected = newId
        partnerId = null
        lastGrowth = { id: newId, birth: false }
      }
      await render(true, lastGrowth)
      announce(editing ? 'Record updated' : person(newId).name + ' joined the tree')
    } catch (error) {
      inner.querySelector('.error').textContent = error.message
      submit.disabled = false
    }
  }
}
async function persist(change) {
  if (readIssue) throw Error(readIssue)
  const save = () => {
    const next = readBook()
    change(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    book = next
  }
  if (navigator.locks) await navigator.locks.request(storageKey, save)
  else save()
}
function exportBook() {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(book, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = 'the-graft-atlas.json'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
async function importFile() {
  try {
    const file = $('importFile').files[0]
    if (!file) return
    const data = JSON.parse(await file.text())
    if (
      data.version !== 1 ||
      !Array.isArray(data.families) ||
      !Array.isArray(data.people) ||
      !data.people.length ||
      !Array.isArray(data.pairs) ||
      !Array.isArray(data.descent)
    )
      throw Error()
    const families = new Set(),
      people = new Set()
    for (const f of data.families) {
      if (
        typeof f.id !== 'string' ||
        typeof f.name !== 'string' ||
        !f.name.trim() ||
        families.has(f.id)
      )
        throw Error()
      families.add(f.id)
    }
    for (const p of data.people) {
      if (
        !families.has(p.family) ||
        typeof p.id !== 'string' ||
        people.has(p.id) ||
        !['name', 'born', 'died', 'place', 'note'].every((k) => typeof p[k] === 'string') ||
        !p.name.trim()
      )
        throw Error()
      people.add(p.id)
    }
    const checked = { ...data, pairs: [], descent: [] }
    for (const [edges, link] of [
      [data.pairs, linkPartners],
      [data.descent, linkParent],
    ])
      for (const [a, b] of edges) {
        if (!people.has(a) || !people.has(b)) throw Error()
        link(checked, a, b)
      }
    openSheet(
      heading('Restore backup', 'Replace this register?') +
        '<p>This backup contains ' +
        people.size +
        ' people in ' +
        families.size +
        ' families. Restoring it replaces the records in this browser.</p><div class="sheetActions"><button id="restore">Restore these records</button>' +
        button('Cancel', 'register', '') +
        '</div><p class="error" role="alert"></p>',
    )
    $('restore').onclick = async () => {
      try {
        await persist((next) => Object.assign(next, checked))
        trace(book.people[0].id)
        announce('Register restored')
      } catch (e) {
        inner.querySelector('.error').textContent = e.message
      }
    }
  } catch {
    announce('This file is not a valid Graft Atlas backup.')
  }
}
inner.addEventListener('click', (e) => {
  const b = e.target.closest('[data-action]')
  if (!b) return
  const { action, id } = b.dataset
  if (action === 'record') showRecord(id)
  if (action === 'trace') trace(id)
  if (action === 'union') {
    partnerId = id
    pages.children = 0
    lastGrowth = null
    sheet.close()
    render(true)
  }
  if (['edit', 'add', 'found', 'start'].includes(action)) form(action, id)
  if (action === 'register') register()
  if (action === 'export') exportBook()
  if (action === 'import') $('importFile').click()
})
$('record').onclick = () => showRecord(selected)
$('add').onclick = () => form('add', selected)
$('register').onclick = register
$('chooseUnion').onclick = () => {
  const k = kinship()
  openSheet(
    heading('Branches of ' + k.focus.name, 'Choose a graft.') +
      k.partners.map((p) => button(p.name, 'union', p.id, 'registerEntry')).join('') +
      button('Single-parent branch', 'union', 'solo', 'registerEntry'),
  )
}
$('unfold').onclick = () => {
  const k = kinship()
  sheet.dataset.map = 'open'
  openSheet(
    heading('Unfolded lineage', familyName(book, k.focus.family)) +
      '<div class="mapKey"><span>Parent to child</span><span>Partners</span></div><div class="lineageScroll" tabindex="0" aria-label="Scrollable family drawing"></div><p class="sheetHint">Follow a name to its tree.</p>',
  )
  unfold(inner.querySelector('.lineageScroll'), book, k.focus, trace, reduced)
}
window.addEventListener('storage', (e) => {
  if (e.key !== storageKey) return
  try {
    book = readBook()
    if (!person(selected)) selected = book.people[0].id
    if (sheet.open) sheet.close()
    pages = { parents: 0, children: 0 }
    lastGrowth = null
    render()
    announce('Family register updated in another tab')
  } catch {
    announce('Could not read the updated register')
  }
})
render()
if (readIssue) announce(readIssue)
