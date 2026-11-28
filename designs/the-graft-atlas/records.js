export const storageKey = 'lombax.graft-atlas.v1'

export function specimen() {
  const rows = [
    [
      'ada',
      'Ada Sorrel',
      'Sorrel',
      '1934',
      '2007',
      'Avignon',
      'Collected windfall seeds in folded paper envelopes.',
    ],
    [
      'orin',
      'Orin Bell',
      'Bell',
      '1931',
      '2010',
      'Arles',
      'Kept the river ferry running through winter.',
    ],
    [
      'mara',
      'Mara Sorrel',
      'Sorrel',
      '1962',
      '',
      'Avignon',
      'Grafted the first pomegranate in the courtyard.',
    ],
    ['ivo', 'Ivo Vale', 'Vale', '1959', '', 'Nîmes', 'Made the clay pots for Mara’s cuttings.'],
    [
      'nell',
      'Nell Sorrel',
      'Sorrel',
      '1988',
      '',
      'Arles',
      'Took a cutting when she moved across the river.',
    ],
    ['theo', 'Theo Sorrel', 'Sorrel', '1993', '', 'Lyon', 'Keeps the family letters.'],
    [
      'alba',
      'Alba Sorrel',
      'Sorrel',
      '2014',
      '',
      'Arles',
      'Planted a seed from Nell’s first harvest.',
    ],
    [
      'remy',
      'Rémy Sorrel',
      'Sorrel',
      '2018',
      '',
      'Arles',
      'Pressed a leaf beside his name in the family book.',
    ],
    ['elio', 'Elio Vale', 'Vale', '1928', '2001', 'Nîmes', 'Worked at the old kiln.'],
    [
      'iris',
      'Iris Reed',
      'Reed',
      '1935',
      '',
      'Uzès',
      'Drew wildflowers in the margins of her notebooks.',
    ],
  ]
  return {
    version: 1,
    families: ['Sorrel', 'Vale', 'Bell', 'Reed'].map((name) => ({ id: name, name })),
    people: rows.map(([id, name, family, born, died, place, note]) => ({
      id,
      name,
      family,
      born,
      died,
      place,
      note,
    })),
    pairs: [
      ['mara', 'ivo'],
      ['ada', 'orin'],
      ['elio', 'iris'],
    ],
    descent: [
      ['ada', 'mara'],
      ['orin', 'mara'],
      ['elio', 'ivo'],
      ['iris', 'ivo'],
      ['mara', 'nell'],
      ['ivo', 'nell'],
      ['mara', 'theo'],
      ['ivo', 'theo'],
      ['nell', 'alba'],
      ['nell', 'remy'],
    ],
  }
}

export function relatives(book, id) {
  const people = new Map(book.people.map((person) => [person.id, person]))
  return {
    parents: book.descent.filter((edge) => edge[1] === id).map((edge) => people.get(edge[0])),
    children: book.descent.filter((edge) => edge[0] === id).map((edge) => people.get(edge[1])),
    partners: book.pairs
      .filter((edge) => edge.includes(id))
      .map((edge) => people.get(edge.find((key) => key !== id))),
  }
}

export function linkParent(book, parent, child) {
  if (book.descent.some(([p, c]) => p === parent && c === child)) return
  const visited = new Set()
  const pending = [child]
  while (pending.length) {
    const id = pending.pop()
    if (id === parent) throw Error('This would make someone their own ancestor.')
    if (visited.has(id)) continue
    visited.add(id)
    for (const [p, c] of book.descent) if (p === id) pending.push(c)
  }
  book.descent.push([parent, child])
}

export function linkPartners(book, a, b) {
  if (a === b) throw Error('Choose two different people.')
  if (book.pairs.some((edge) => edge.includes(a) && edge.includes(b)))
    throw Error('These partners are already joined.')
  book.pairs.push([a, b])
}

export function readBook() {
  const raw = localStorage.getItem(storageKey)
  return raw ? JSON.parse(raw) : specimen()
}

export function lifespan(person) {
  if (!person.born && !person.died) return 'Dates unrecorded'
  if (person.died) return (person.born || '?') + ' – ' + person.died
  return 'b. ' + person.born
}

export function familyName(book, id) {
  return book.families.find((family) => family.id === id)?.name || ''
}
