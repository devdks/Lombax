const draft = document.querySelector('.draft')
const reset = document.querySelector('#reset')
const totals = document.querySelector('#totals')
const status = document.querySelector('#status')
const annotation = document.querySelector('#annotation-template').content.firstElementChild.cloneNode(true)
const removedCopy = annotation.querySelector('.removed-copy')
const previousWording = annotation.querySelector('del')
const nextWording = annotation.querySelector('ins')
const restoreFromNote = annotation.querySelector('.restore-from-note')
const acceptRewrite = annotation.querySelector('.accept-rewrite')

const sources = new Map([...draft.querySelectorAll('[data-source]')].map(block => {
  const { source, title } = block.dataset
  return [source, {
    title,
    copy: block.querySelector('.source-copy'),
    gap: block.querySelector('.cut-gap'),
    button: block.querySelector('.cut'),
    icon: block.querySelector('.cut-icon'),
    label: block.querySelector('.cut-label'),
    cut: false,
  }]
}))

const references = [...draft.querySelectorAll('[data-reference]')].map(wrapper => {
  const wording = wrapper.textContent
  const text = document.createElement('span')
  text.tabIndex = -1
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'unresolved'
  button.textContent = wording
  button.setAttribute('aria-label', `Inspect missing context for “${wording}”`)
  wrapper.replaceChildren(text, button)
  return {
    source: sources.get(wrapper.dataset.reference),
    rewrite: wrapper.dataset.rewrite,
    wording,
    paragraph: wrapper.parentElement,
    text,
    button,
    rewritten: false,
  }
})

let activeReference = null

function isUnresolved(reference) {
  return reference.source.cut && !reference.rewritten
}

function updateDraft() {
  let cuts = 0
  for (const source of sources.values()) {
    const { cut, copy, gap, icon, label, button, title } = source
    if (cut) cuts++
    copy.hidden = cut
    gap.hidden = !cut
    icon.textContent = cut ? '↶' : '✂'
    label.textContent = cut ? 'Restore paragraph' : 'Cut paragraph'
    button.setAttribute('aria-label', `${label.textContent} about ${title.toLowerCase()}`)
    button.hidden = false
  }

  for (const reference of references) {
    const unresolved = isUnresolved(reference)
    const { text, button, rewritten, rewrite, wording } = reference
    text.textContent = rewritten ? rewrite : wording
    text.hidden = unresolved
    button.hidden = !unresolved
    button.setAttribute('aria-expanded', String(reference === activeReference))
    if (reference === activeReference) button.setAttribute('aria-controls', annotation.id)
    else button.removeAttribute('aria-controls')
  }

  totals.textContent = `${cuts} ${cuts === 1 ? 'cut' : 'cuts'} · ${references.filter(isUnresolved).length} unresolved`
  reset.disabled = cuts === 0 && !references.some(reference => reference.rewritten)
}

function setAnnotation(reference) {
  activeReference = reference
  if (reference) {
    removedCopy.textContent = reference.source.copy.textContent
    previousWording.textContent = reference.wording
    nextWording.textContent = reference.rewrite
    reference.paragraph.after(annotation)
    annotation.hidden = false
  } else {
    annotation.hidden = true
  }
  updateDraft()
}

function toggleSource(source, returnToSource = false) {
  source.cut = !source.cut
  setAnnotation(activeReference?.source === source ? null : activeReference)
  if (returnToSource) source.button.focus()
  status.textContent = `${source.cut ? 'Cut' : 'Restored'} the paragraph about ${source.title.toLowerCase()}. ${totals.textContent}.`
}

for (const source of sources.values()) {
  source.button.addEventListener('click', () => toggleSource(source))
}

for (const reference of references) {
  reference.button.addEventListener('click', () => {
    setAnnotation(activeReference === reference ? null : reference)
  })
}

restoreFromNote.addEventListener('click', () => toggleSource(activeReference.source, true))

acceptRewrite.addEventListener('click', () => {
  const reference = activeReference
  reference.rewritten = true
  setAnnotation(null)
  reference.text.focus()
  status.textContent = `Updated wording to “${reference.rewrite}”. ${totals.textContent}.`
})

draft.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !activeReference) return
  const trigger = activeReference.button
  setAnnotation(null)
  trigger.focus()
})

reset.addEventListener('click', () => {
  for (const source of sources.values()) source.cut = false
  for (const reference of references) reference.rewritten = false
  setAnnotation(null)
  sources.values().next().value.button.focus()
  status.textContent = 'Draft reset. Both paragraphs and all original wording restored.'
})

updateDraft()
