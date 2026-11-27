export const pillar = { x: -1.15, z: 3.65, width: .45, depth: .32, height: 4.9 }
export const performerHalfWidth = .24

const rowDepths = [4.9, 6.15, 7.4, 8.65]
export const seats = rowDepths.flatMap((z, row) => Array.from({ length: 7 }, (_, column) => ({
  name: `${'ABCD'[row]}${column + 1}`,
  x: (column - 3) * 1.05,
  z,
  eye: 1.22 + row * .12,
  row,
  column,
})))

// Extend rays from the seat through each corner of the pillar to the performer's plane.
export function sightline(seat, mark) {
  const edges = []
  for (const side of [-1, 1]) {
    for (const face of [-1, 1]) {
      const x = pillar.x + side * pillar.width / 2
      const z = pillar.z + face * pillar.depth / 2
      edges.push(seat.x + (x - seat.x) * seat.z / (seat.z - z))
    }
  }

  const left = Math.min(...edges)
  const right = Math.max(...edges)
  const performerLeft = mark - performerHalfWidth
  const performerRight = mark + performerHalfWidth
  if (right <= performerLeft || left >= performerRight) return 'clear'
  if (left <= performerLeft && right >= performerRight) return 'blocked'
  return 'clipped'
}

// Percentages keep the plan canvas and the HTML seat controls on the same coordinates.
export function planPoint(x, z) {
  return { left: 50 + x / 8.6 * 100, top: 9 + z / 9.2 * 86 }
}
