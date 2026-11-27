import { createDust } from './comet-dust.js'

const flightPaths = [
  { wide: [59, 43, 134], narrow: [26, 46, 89], color: '#93aaff', depth: 52, angle: -.58 },
  { wide: [81, 30, 106], narrow: [73, 40, 75], color: '#c1afff', depth: -88, angle: -.62 },
  { wide: [83, 64, 128], narrow: [74, 71, 86], color: '#f1c87d', depth: 15, angle: -.61 },
  { wide: [54, 72, 99], narrow: [28, 76, 72], color: '#f0a48c', depth: -28, angle: -.50 },
  { wide: [57, 40, 124], narrow: [27, 39, 84], color: '#e1ad89', depth: 25, angle: -.59 },
  { wide: [81, 34, 119], narrow: [73, 50, 80], color: '#8de1d4', depth: -58, angle: -.57 },
  { wide: [74, 70, 110], narrow: [31, 69, 83], color: '#a2b8ff', depth: 6, angle: -.56 },
  { wide: [51, 67, 104], narrow: [74, 77, 75], color: '#e1a8c9', depth: -15, angle: -.49 },
]

const storageKey = 'lombax-vault-dimensions'

export function mountCometVault(previewArt) {
  const archive = document.querySelector('.plate-vault')
  const sky = document.querySelector('.comet-vault')
  const plates = [...archive.querySelectorAll('.plate')]
  const [firstField, nextField] = sky.querySelectorAll('.sky-field')
  const fieldCount = Math.max(1, Math.ceil(plates.length / 4))
  const fields = Array.from({ length: fieldCount }, (_, index) => {
    if (index === 0) return firstField
    if (index === 1) return nextField
    const field = nextField.cloneNode(true)
    field.id = 'orbit-' + (index + 1)
    const title = field.querySelector('h2')
    title.id = field.id + '-title'
    field.setAttribute('aria-labelledby', title.id)
    sky.querySelector('.sky-main').append(field)
    return field
  })
  if (fieldCount === 1) nextField.remove()
  const groups = fields.map((field, index) => {
    const start = index * 4 + 1
    const end = Math.min(plates.length, start + 3)
    const range = String(start).padStart(2, '0') + '–' + String(end).padStart(2, '0')
    field.querySelectorAll('[data-field-range]').forEach(label => { label.textContent = range })
    const action = field.querySelector('.sky-scroll')
    if (fields[index + 1]) {
      action.href = '#' + fields[index + 1].id
      action.innerHTML = '<span aria-hidden="true">↓</span> Scroll to explore'
    } else if (index === 0) {
      action.hidden = true
    }
    const group = field.querySelector('.sky-comets')
    group.setAttribute('aria-label', start === end ? 'Project ' + start : `Projects ${start} through ${end}`)
    return group
  })
  const dust = createDust(sky.querySelector('.sky-dust'))
  if (!dust) return
  const spaceCanvas = sky.querySelector('.sky-space')
  const preview = sky.querySelector('.comet-preview')
  const link = preview.querySelector('.comet-preview-open')
  const previewImage = preview.querySelector('img')
  const close = preview.querySelector('.comet-preview-close')
  const masthead = sky.querySelector('.sky-masthead')
  const plateSwitch = sky.querySelector('.sky-plates')
  const skySwitch = archive.querySelector('.plates-return')
  const modes = [...sky.querySelectorAll('[data-dimensions]')]
  const status = document.createElement('div')
  status.className = 'sky-status'
  status.setAttribute('role', 'status')
  sky.append(status)

  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const narrow = matchMedia('(max-width: 720px)')
  const projects = plates.map((plate, index) => {
    const title = plate.querySelector('h2').textContent
    const number = plate.querySelector('.plate-head span').textContent
    const kind = plate.querySelector('.caption small').textContent
    const image = previewArt(plate)
    const path = flightPaths[index < 4 ? index : 4 + index % 4]
    const field = Math.floor(index / 4)
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'comet'
    button.setAttribute('aria-expanded', 'false')
    button.setAttribute('aria-controls', preview.id)

    for (const [suffix, [x, y, size]] of [['', path.wide], ['mobile-', path.narrow]]) {
      button.style.setProperty('--comet-' + suffix + 'x', x + '%')
      button.style.setProperty('--comet-' + suffix + 'y', y + '%')
      button.style.setProperty('--comet-' + suffix + 'size', size + 'px')
    }
    button.style.setProperty('--comet-color', path.color)

    const disc = document.createElement('span')
    disc.className = 'comet-disc'
    const art = document.createElement('img')
    art.alt = ''
    art.src = image
    disc.append(art)
    const label = document.createElement('span')
    label.className = 'comet-label'
    const plateNumber = document.createElement('span')
    plateNumber.className = 'comet-number'
    plateNumber.textContent = number
    const name = document.createElement('span')
    name.className = 'comet-name'
    name.textContent = title
    label.append(plateNumber, name)
    button.append(disc, label)
    groups[field].append(button)

    return { ...path, title, number, kind, image, href: plate.href, field, button, index, reveal: 0 }
  })
  sky.querySelectorAll('[data-project-count]').forEach(label => {
    label.textContent = String(projects.length).padStart(2, '0')
  })

  let active = null
  let focusOnClose = false
  let mode = '2d'
  let space
  let spacePromise
  let spaceUnavailable = false
  let frame = 0
  let last = 0
  let time = 0
  let width = 0
  let height = 0
  let previewWidth = 0
  let previewHeight = 0
  let mastheadHeight = 0
  let fieldBounds = []
  let selectedSide = 0
  let sceneVisible = false
  let layoutDirty = true
  let pointerX = 0
  let pointerY = 0
  let lookX = 0
  let lookY = 0

  function invalidate() {
    if (sceneVisible && !document.hidden && !frame) frame = requestAnimationFrame(render)
  }

  function resetPreview(restoreFocus = false) {
    if (!active) return
    const { button } = active
    button.setAttribute('aria-expanded', 'false')
    preview.hidden = true
    active = null
    if (restoreFocus) {
      focusOnClose = true
      button.focus({ preventScroll: true })
      focusOnClose = false
    }
    invalidate()
  }

  function choose(project) {
    if (active === project) return
    resetPreview()
    active = project
    project.button.setAttribute('aria-expanded', 'true')
    previewImage.src = project.image
    preview.querySelector('.comet-preview-plate').textContent = project.number
    preview.querySelector('#comet-title').textContent = project.title
    preview.querySelector('.comet-preview-kind').textContent = project.kind
    preview.style.setProperty('--preview-tint', project.color)
    link.href = project.href
    project.button.after(preview)
    preview.hidden = false
    preview.removeAttribute('data-reveal')
    previewWidth = preview.offsetWidth
    previewHeight = preview.offsetHeight
    selectedSide = project.button.getBoundingClientRect().left > window.innerWidth * .48 ? -1 : 1
    preview.setAttribute('data-reveal', '')
    invalidate()
  }

  projects.forEach(project => {
    project.button.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && !preview.contains(document.activeElement)) choose(project)
    })
    project.button.addEventListener('focus', () => {
      if (focusOnClose || !project.button.matches(':focus-visible')) return
      const bounds = project.button.getBoundingClientRect()
      if (bounds.top < masthead.offsetHeight + 10 || bounds.bottom + 48 > window.innerHeight) {
        project.button.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      choose(project)
    })
    project.button.addEventListener('click', () => choose(project))
  })
  close.addEventListener('click', () => resetPreview(true))
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault()
      resetPreview(preview.contains(document.activeElement) || document.activeElement === active.button)
    }
  })
  document.addEventListener('pointerdown', event => {
    if (active && !event.target.closest('.comet, .comet-preview')) resetPreview()
  })

  function placePreview(project) {
    const mobile = narrow.matches && (height > 490 || width < 450)
    const margin = narrow.matches ? 16 : 30
    const left = mobile
      ? (width - previewWidth) / 2
      : Math.max(margin, Math.min(width - previewWidth - margin,
        selectedSide === -1 ? project.x - project.r - 56 - previewWidth : project.x + project.r + 56))
    const above = mobile && project.y > height * .57
    let top = project.y - previewHeight * .5
    if (mobile) top = above ? project.y - project.r - previewHeight - 34 : height - previewHeight - margin
    top = Math.max(mastheadHeight + 11, Math.min(height - previewHeight - margin, top))
    preview.style.left = left + 'px'
    preview.style.top = top + 'px'
    return { left, top, width: previewWidth, height: previewHeight, mobile, above, side: selectedSide }
  }

  function render(now) {
    frame = 0
    const still = reduced.matches
    const step = last ? Math.min((now - last) / 1000, .05) : 1 / 60
    last = now
    if (!still) time += step
    if (layoutDirty) {
      width = sky.clientWidth
      height = window.innerHeight
      dust.resize(width, height)
      space?.resize(width, height)
      fieldBounds = fields.map(field => ({ top: field.offsetTop, height: field.offsetHeight }))
      previewWidth = preview.offsetWidth
      previewHeight = preview.offsetHeight
      mastheadHeight = masthead.offsetHeight
      layoutDirty = false
    }
    const scroll = window.scrollY
    const spatial = mode === '3d'
    const ease = 1 - Math.exp(-step * 10)
    lookX += (pointerX - lookX) * ease
    lookY += (pointerY - lookY) * ease

    for (const project of projects) {
      const [left, top, size] = narrow.matches ? project.narrow : project.wide
      const bounds = fieldBounds[project.field]
      const selected = active === project
      project.reveal = still ? Number(selected) : project.reveal + (Number(selected) - project.reveal) * ease
      const drift = spatial && !still ? 7 + (project.depth + 90) * .09 : 0
      const dx = lookX * drift
      const dy = lookY * drift
      const scale = 1 + project.reveal * (spatial ? .29 : .15)
      project.x = width * left / 100 + dx
      project.y = bounds.top + bounds.height * top / 100 - scroll + dy
      project.r = size * scale / 2
      project.visible = project.y > -size * 2 && project.y < height + size * 2
      if (project.visible) {
        project.button.style.setProperty('--drift-x', dx + 'px')
        project.button.style.setProperty('--drift-y', dy + 'px')
        project.button.style.setProperty('--comet-scale', scale)
        project.button.style.setProperty('--label-drop', (project.r - size / 2) + 'px')
      }
    }

    if (active && (active.y < mastheadHeight || active.y > height + active.r)) {
      resetPreview(preview.contains(document.activeElement))
    }
    const target = active ? placePreview(active) : null
    dust.draw(projects, {
      time: still ? 0 : time, spatial, active, target,
      lookX: still ? 0 : lookX, lookY: still ? 0 : lookY, scroll: still ? 0 : scroll,
    })
    if (spatial) space?.draw(projects, time, still ? 0 : lookX, still ? 0 : lookY)
    if (!still) invalidate()
  }

  function setMode(next) {
    mode = next
    const spatial = mode === '3d'
    sky.classList.toggle('has-space', spatial)
    spaceCanvas.hidden = !spatial
    modes.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.dimensions === mode)))
    invalidate()
  }

  function disableSpace() {
    spaceUnavailable = true
    space = null
    setMode('2d')
    modes.find(button => button.dataset.dimensions === '3d').disabled = true
    status.textContent = '3D is unavailable. Showing the 2D comet view.'
  }

  async function show3D(announce) {
    if (spaceUnavailable) return
    spacePromise ??= import('./comet-space.js')
      .then(({ createSpace }) => createSpace(spaceCanvas, projects, invalidate))
      .catch(() => null)
    const loaded = await spacePromise
    if (spaceUnavailable) return
    if (!loaded) return disableSpace()
    space = loaded
    if (readMode() !== '2d') {
      space.resize(width || sky.clientWidth, height || window.innerHeight)
      setMode('3d')
      if (announce) status.textContent = '3D comet view'
    }
  }

  let savedMode
  function readMode() {
    try { return savedMode ?? sessionStorage.getItem(storageKey) } catch { return savedMode }
  }
  modes.forEach(button => button.addEventListener('click', () => {
    savedMode = button.dataset.dimensions
    try { sessionStorage.setItem(storageKey, savedMode) } catch {}
    if (savedMode === '3d') show3D(true)
    else {
      setMode('2d')
      status.textContent = '2D comet view'
    }
  }))
  spaceCanvas.addEventListener('webglcontextlost', disableSpace)

  function showView(plates, transferFocus = false) {
    sceneVisible = !plates
    sky.hidden = plates
    archive.hidden = !plates
    if (plates) {
      resetPreview()
      cancelAnimationFrame(frame)
      frame = 0
    } else {
      layoutDirty = true
      last = 0
      invalidate()
      if (readMode() !== '2d') show3D(false)
    }
    if (transferFocus) {
      window.scrollTo(0, 0)
      const control = plates ? skySwitch : plateSwitch
      control.focus({ preventScroll: true })
    }
  }

  function navigateView(plates) {
    const url = new URL(location.href)
    if (plates) url.searchParams.set('view', 'plates')
    else url.searchParams.delete('view')
    url.hash = ''
    history.pushState(null, '', url)
    showView(plates, true)
  }

  const urlHasPlates = () => new URLSearchParams(location.search).get('view') === 'plates'
  plateSwitch.addEventListener('click', () => navigateView(true))
  skySwitch.addEventListener('click', () => navigateView(false))
  window.addEventListener('popstate', () => {
    if (sceneVisible === urlHasPlates()) showView(urlHasPlates())
  })
  window.addEventListener('resize', () => {
    layoutDirty = true
    invalidate()
  })
  window.addEventListener('scroll', invalidate, { passive: true })
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return
    pointerX = event.clientX / window.innerWidth * 2 - 1
    pointerY = event.clientY / window.innerHeight * 2 - 1
    invalidate()
  }, { passive: true })
  reduced.addEventListener('change', invalidate)
  document.addEventListener('visibilitychange', invalidate)
  sky.querySelectorAll('.sky-scroll').forEach(anchor => anchor.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    resetPreview()
    const target = document.querySelector(anchor.hash)
    target.tabIndex = -1
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' })
  }))

  skySwitch.hidden = false
  setMode('2d')
  showView(urlHasPlates())
}
