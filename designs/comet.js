import Lenis from 'lenis'
import { createDust } from './comet-dust.js'

const flightPaths = [
  { wide: [59, 43, 134], narrow: [26, 46, 89], color: '#93aaff', depth: 52, angle: -.71 },
  { wide: [81, 30, 106], narrow: [73, 40, 75], color: '#c1afff', depth: -88, angle: -.84 },
  { wide: [83, 64, 128], narrow: [74, 71, 86], color: '#f1c87d', depth: 15, angle: -.70 },
  { wide: [54, 72, 99], narrow: [28, 76, 72], color: '#f0a48c', depth: -28, angle: -.63 },
  { wide: [57, 40, 124], narrow: [27, 39, 84], color: '#e1ad89', depth: 25, angle: -.74 },
  { wide: [81, 34, 119], narrow: [73, 50, 80], color: '#8de1d4', depth: -58, angle: -.82 },
  { wide: [74, 70, 110], narrow: [31, 69, 83], color: '#a2b8ff', depth: 6, angle: -.67 },
  { wide: [51, 67, 104], narrow: [74, 77, 75], color: '#e1a8c9', depth: -15, angle: -.62 },
]

const storageKey = 'lombax-vault-dimensions'
const previewFrames = [
  { clipPath: 'inset(49.6% 0)', opacity: 0 },
  { clipPath: 'inset(0)', opacity: 1 },
]

function easeBetween(start, end, value) {
  const t = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

function orbitPose(bounds, index, scroll, height) {
  const field = bounds[index]
  const localScroll = scroll - field.top
  const lastRest = Math.max(0, field.height - height)
  if (localScroll < 0 && index > 0) {
    const duration = Math.min(bounds[index - 1].height, height)
    const progress = Math.max(0, 1 + localScroll / duration)
    return {
      entering: true, progress, offset: localScroll,
      alpha: easeBetween(.03, .38, progress),
      caption: easeBetween(.40, .91, progress),
      captionTravel: 1 - easeBetween(.16, .98, progress),
    }
  }
  if (localScroll > lastRest && index < bounds.length - 1) {
    const progress = Math.min(1, (localScroll - lastRest) / (field.height - lastRest))
    return {
      entering: false, progress, offset: localScroll - lastRest,
      alpha: 1 - easeBetween(.63, .95, progress),
      caption: 1 - easeBetween(.07, .52, progress),
      captionTravel: -easeBetween(0, .68, progress),
    }
  }
  return null
}

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
  const dust = createDust(sky.querySelector('.sky-dust'), sky.querySelector('.sky-plasma'))
  if (!dust) return
  const spaceCanvas = sky.querySelector('.sky-space')
  const preview = sky.querySelector('.comet-preview')
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
    const anchor = document.createElement('a')
    anchor.href = plate.href
    anchor.className = 'comet'
    anchor.setAttribute('aria-expanded', 'false')
    anchor.setAttribute('aria-controls', preview.id)

    for (const [suffix, [x, y, size]] of [['', path.wide], ['mobile-', path.narrow]]) {
      anchor.style.setProperty('--comet-' + suffix + 'x', x + '%')
      anchor.style.setProperty('--comet-' + suffix + 'y', y + '%')
      anchor.style.setProperty('--comet-' + suffix + 'size', size + 'px')
    }
    anchor.style.setProperty('--comet-color', path.color)

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
    anchor.append(disc, label)
    groups[field].append(anchor)

    return { ...path, title, number, kind, image, field, anchor, index, reveal: 0 }
  })
  sky.querySelectorAll('[data-project-count]').forEach(label => {
    label.textContent = String(projects.length).padStart(2, '0')
  })

  let active = null
  let openedByHover = false
  let closing = false
  let dismissTimer
  let previewMotion
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
  let lastScroll = 0
  let scrollSpeed = 0
  let lenis
  let wheelGesture = null
  let releasedForward = false
  let previewWidth = 0
  let previewHeight = 0
  let mastheadHeight = 0
  let fieldBounds = []
  let sceneVisible = false
  let layoutDirty = true
  let pointerX = 0
  let pointerY = 0
  let lookX = 0
  let lookY = 0

  function invalidate() {
    if (sceneVisible && !document.hidden && !frame) frame = requestAnimationFrame(render)
  }

  function limitScrollInput(input) {
    const { event, deltaX, deltaY } = input
    if (event.ctrlKey || (event.type === 'wheel' && Math.abs(deltaX) > Math.abs(deltaY))) return false
    if (event.type === 'touchstart') {
      lenis.userData = {}
      wheelGesture = null
      releasedForward = false
    }
    if (event.type === 'touchend') releasedForward = deltaY > 0
    if (event.type !== 'wheel' || !deltaY) return

    const direction = Math.sign(deltaY)
    const landing = lenis.userData.landing
    if (wheelGesture?.direction !== direction || event.timeStamp - wheelGesture.lastInput > 180) {
      const next = direction > 0 ? fieldBounds.findIndex(field => field.top > lenis.animatedScroll + 1) : -1
      wheelGesture = { direction, next, lastInput: event.timeStamp }
    }
    wheelGesture.lastInput = event.timeStamp
    const next = fieldBounds[wheelGesture.next]
    const remaining = next ? Math.max(0, next.top - lenis.targetScroll) : Infinity
    const distance = Math.min(Math.abs(deltaY) * .88, (height || innerHeight) * .72, remaining)
    // Momentum in the same direction can finish at the selected batch. Reversing takes control back.
    if ((landing !== undefined && direction === Math.sign(landing - lenis.animatedScroll)) || !distance) {
      if (event.cancelable) event.preventDefault()
      return false
    }
    const previous = fieldBounds[wheelGesture.next - 1]
    if (direction > 0 && landing === undefined && next && previous
      && lenis.animatedScroll >= next.top - Math.min(previous.height, height) - 1) {
      if (event.cancelable) event.preventDefault()
      scrollToOrbit(wheelGesture.next)
      return false
    }
    input.deltaY = direction * distance
  }

  function syncSmoothScroll() {
    if (sceneVisible && !reduced.matches) {
      lenis ??= new Lenis({
        eventsTarget: sky,
        lerp: .10,
        syncTouch: true,
        syncTouchLerp: .12,
        touchInertiaExponent: 1.12,
        virtualScroll: limitScrollInput,
      })
    } else {
      lenis?.destroy()
      lenis = null
      wheelGesture = null
      releasedForward = false
    }
  }

  function scrollToOrbit(index, speed = 0) {
    const destination = fieldBounds[index]?.top ?? fields[index].offsetTop
    const distance = Math.abs(destination - lenis.animatedScroll)
    if (!distance) return
    const duration = Math.min(1.05, .56 + distance / height * .49)
    const slope = Math.min(2.5, speed * duration / distance)
    lenis.scrollTo(destination, {
      duration,
      easing: t => t * t * (3 - 2 * t) + slope * t * (1 - t) ** 2,
      userData: { landing: destination },
    })
  }

  function continueDeparture(poses, speed) {
    if (lenis.isTouching || lenis.userData.landing !== undefined || (speed <= 0 && !releasedForward)) return
    const index = poses.findIndex(pose => pose && !pose.entering && pose.progress < 1)
    if (index !== -1) scrollToOrbit(index + 1, Math.max(0, speed))
  }

  function resetPreview(restoreFocus = false) {
    clearTimeout(dismissTimer)
    if (!active) return
    const { anchor } = active
    anchor.setAttribute('aria-expanded', 'false')
    preview.hidden = true
    preview.inert = false
    previewMotion?.cancel()
    previewMotion = null
    active = null
    closing = false
    if (restoreFocus) {
      focusOnClose = true
      anchor.focus({ preventScroll: true })
      focusOnClose = false
    }
    invalidate()
  }

  function choose(project, byHover = false) {
    clearTimeout(dismissTimer)
    if (active === project) {
      if (!byHover) openedByHover = false
      if (closing) revealPreview(project)
      return
    }
    resetPreview()
    active = project
    openedByHover = byHover
    previewImage.src = project.image
    preview.querySelector('.comet-preview-plate').textContent = project.number
    preview.querySelector('#comet-title').textContent = project.title
    preview.querySelector('.comet-preview-kind').textContent = project.kind
    preview.style.setProperty('--preview-tint', project.color)
    project.anchor.after(preview)
    preview.hidden = false
    previewWidth = preview.offsetWidth
    previewHeight = preview.offsetHeight
    revealPreview(project)
  }

  function revealPreview(project) {
    closing = false
    preview.inert = false
    project.anchor.setAttribute('aria-expanded', 'true')
    if (previewMotion) {
      previewMotion.onfinish = null
      previewMotion.reverse()
    } else if (!reduced.matches) {
      previewMotion = animatePreview()
    }
    invalidate()
  }

  function animatePreview() {
    return preview.animate(previewFrames, {
      duration: 390, easing: 'cubic-bezier(.16, 1, .3, 1)', fill: 'both',
    })
  }

  function dismissAfterHover() {
    clearTimeout(dismissTimer)
    if (!active || !openedByHover || closing) return
    const project = active
    // Give the pointer time to reach the preview's close button.
    dismissTimer = setTimeout(() => {
      if (active !== project || project.anchor.matches(':hover, :focus-visible')
        || preview.matches(':hover, :focus-within')) return
      if (reduced.matches) return resetPreview()
      closing = true
      project.anchor.setAttribute('aria-expanded', 'false')
      preview.inert = true
      if (!previewMotion) {
        previewMotion = animatePreview()
        previewMotion.finish()
      }
      previewMotion.onfinish = () => {
        if (active === project && closing) resetPreview()
      }
      previewMotion.reverse()
      invalidate()
    }, 230)
  }

  projects.forEach(project => {
    project.anchor.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return
      if ((active === project || scrollSpeed < .12) && !preview.contains(document.activeElement)) choose(project, true)
    })
    project.anchor.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse' && active === project) dismissAfterHover()
    })
    project.anchor.addEventListener('focus', () => {
      if (focusOnClose || !project.anchor.matches(':focus-visible')) return
      const bounds = project.anchor.getBoundingClientRect()
      if (project.inFlight || bounds.top < masthead.offsetHeight + 10 || bounds.bottom + 48 > window.innerHeight) {
        const field = fields[project.field]
        const [, top] = narrow.matches ? project.narrow : project.wide
        const within = Math.min(field.offsetHeight - window.innerHeight, field.offsetHeight * top / 100 - window.innerHeight * .55)
        const destination = field.offsetTop + Math.max(0, within)
        if (lenis) lenis.scrollTo(destination, { immediate: true })
        else window.scrollTo({ top: destination, behavior: 'instant' })
      }
      choose(project)
    })
  })
  preview.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') clearTimeout(dismissTimer)
  })
  preview.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse') dismissAfterHover()
  })
  preview.addEventListener('focusin', () => clearTimeout(dismissTimer))
  preview.addEventListener('focusout', dismissAfterHover)
  close.addEventListener('click', () => resetPreview(true))
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault()
      resetPreview(preview.contains(document.activeElement) || document.activeElement === active.anchor)
    }
  })
  document.addEventListener('pointerdown', event => {
    if (active && !event.target.closest('.comet, .comet-preview')) resetPreview()
  })

  function placePreview(project) {
    const mobile = narrow.matches && (height > 490 || width < 450)
    const margin = narrow.matches ? 16 : 30
    const { anchorX, anchorY, selectedRadius } = project
    const side = anchorX > width * .48 ? -1 : 1
    const left = mobile
      ? (width - previewWidth) / 2
      : Math.max(margin, Math.min(width - previewWidth - margin,
        side === -1 ? anchorX - selectedRadius - 56 - previewWidth : anchorX + selectedRadius + 56))
    const above = mobile && anchorY > height * .57
    let top = anchorY - previewHeight * .5
    if (mobile) top = above ? anchorY - selectedRadius - previewHeight - 34 : height - previewHeight - margin
    top = Math.max(mastheadHeight + 11, Math.min(height - previewHeight - margin, top))
    preview.style.left = left + 'px'
    preview.style.top = top + 'px'
    return { left, top, width: previewWidth, height: previewHeight, mobile, above, side }
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
    if (lenis?.isScrolling === 'smooth' && Math.abs(lenis.animatedScroll - window.scrollY) > 1) {
      lenis.scrollTo(window.scrollY, { immediate: true })
    }
    // Use the scene's capped frame clock so a slow frame cannot skip ahead in the flight.
    lenis?.raf(time * 1000)
    const scroll = lenis?.animatedScroll ?? window.scrollY
    const spatial = mode === '3d'
    const compact = narrow.matches
    const flightDistance = Math.min(width * (compact ? 1.75 : 1.36), height * 1.30)
    const ease = 1 - Math.exp(-step * 10)
    lookX += (pointerX - lookX) * ease
    lookY += (pointerY - lookY) * ease
    const delta = scroll - lastScroll
    const velocity = Math.min(1, Math.abs(delta) / (step * 1600))
    scrollSpeed = still ? 0 : scrollSpeed + (velocity - scrollSpeed) * ease
    lastScroll = scroll
    const poses = fields.map((field, index) => {
      const pose = still ? null : orbitPose(fieldBounds, index, scroll, height)
      const captionTravel = Math.min(width, height) * .32 * (pose?.captionTravel ?? 0)
      field.style.setProperty('--orbit-caption-x', captionTravel * .79 + 'px')
      field.style.setProperty('--orbit-caption-y', ((pose?.offset ?? 0) - captionTravel * .61) + 'px')
      field.style.setProperty('--orbit-caption', pose?.caption ?? 1)
      field.toggleAttribute('data-caption-away', !!pose && pose.caption < .04)
      return pose
    })

    for (const project of projects) {
      const [left, top, size] = compact ? project.narrow : project.wide
      const bounds = fieldBounds[project.field]
      const pose = poses[project.field]
      const selected = active === project && !closing
      project.reveal = still ? Number(selected) : project.reveal + (Number(selected) - project.reveal) * ease
      const phase = time * (.94 + project.index % 3 * .13) + project.index * 1.81
      const hover = still ? 0 : (compact ? 4 : 6) * (1 - project.reveal)
      const drift = spatial && !still ? 7 + (project.depth + 90) * .09 : 0
      const stagger = project.index % 4 * .029
      let flight = 0
      if (pose) {
        flight = pose.entering
          ? easeBetween(.03 + stagger, .97, pose.progress) - 1
          : easeBetween(stagger, .90 + stagger, pose.progress)
      }
      project.inFlight = Math.abs(flight) > .035
      project.heading = project.angle - (compact ? .20 : 0)
      const distance = flight * flightDistance
      const flightX = -Math.cos(project.heading) * distance
      const flightY = -Math.sin(project.heading) * distance + (pose?.offset ?? 0)
      const floatX = lookX * drift + Math.cos(phase) * hover * .78
      const floatY = lookY * drift + Math.sin(phase) * hover
      const lift = spatial ? .29 : .15
      const scale = 1 + project.reveal * lift
      project.anchorX = width * left / 100 + flightX
      project.anchorY = bounds.top + bounds.height * top / 100 - scroll + flightY
      project.selectedRadius = size * (1 + lift) / 2
      project.x = project.anchorX + floatX
      project.y = project.anchorY + floatY
      project.r = size * scale / 2
      project.alpha = pose?.alpha ?? 1
      project.speed = pose ? scrollSpeed : 0
      // A head below or left of the viewport can still have a visible flame.
      project.visible = project.alpha > .003 && project.x > -size * 3.5 && project.x < width + size
        && project.y > -size && project.y < height + size * 3.5
      project.anchor.style.setProperty('--drift-x', (flightX + floatX) + 'px')
      project.anchor.style.setProperty('--drift-y', (flightY + floatY) + 'px')
      project.anchor.style.setProperty('--comet-scale', scale)
      project.anchor.style.setProperty('--label-drop', (project.r - size / 2) + 'px')
      project.anchor.style.setProperty('--comet-alpha', project.alpha)
      project.anchor.toggleAttribute('data-far', project.alpha < .15)
    }

    if (lenis) continueDeparture(poses, delta / step)
    releasedForward = false

    if (active && (active.alpha < .15 || active.y < mastheadHeight || active.y > height + active.r
      || active.x < -active.r || active.x > width + active.r)) {
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
    syncSmoothScroll()
    lastScroll = window.scrollY
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
  reduced.addEventListener('change', () => {
    syncSmoothScroll()
    if (reduced.matches) {
      if (closing) resetPreview()
      previewMotion?.cancel()
      previewMotion = null
    }
    invalidate()
  })
  document.addEventListener('visibilitychange', invalidate)
  sky.querySelectorAll('.sky-scroll').forEach(anchor => anchor.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    resetPreview()
    const target = document.querySelector(anchor.hash)
    target.tabIndex = -1
    target.focus({ preventScroll: true })
    if (lenis) scrollToOrbit(fields.indexOf(target))
    else target.scrollIntoView({ behavior: 'instant' })
  }))

  skySwitch.hidden = false
  setMode('2d')
  showView(urlHasPlates())
}
