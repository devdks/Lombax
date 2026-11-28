export const MAX_ROWS = 6
export const MAX_PIECES = 24

// All dimensions use integer tenths of a millimetre.
export const example = {
  stock: 24000,
  kerf: 30,
  keep: 3000,
  cuts: [
    { name: 'Seat rail', length: 11600, quantity: 2 },
    { name: 'Upright', length: 7400, quantity: 3 },
    { name: 'Brace', length: 3800, quantity: 2 },
  ],
}

function makePattern(code, counts, occupied, stock, keep) {
  const leftover = Math.max(0, stock - occupied)
  return { code, counts: [...counts], leftover, keeper: Number(leftover >= keep) }
}

function patternsFor({ stock, kerf, keep, cuts }, strides) {
  const byCut = cuts.map(() => [])
  const counts = cuts.map(() => 0)

  function visit(index, occupied, code) {
    if (index === cuts.length) {
      if (!code) return
      const pattern = makePattern(code, counts, occupied, stock, keep)
      counts.forEach((count, cut) => { if (count) byCut[cut].push(pattern) })
      return
    }

    const { length, quantity } = cuts[index]
    const cost = length + kerf
    const limit = Math.min(quantity, Math.floor((stock + kerf - occupied) / cost))
    for (let count = 0; count <= limit; count++) {
      counts[index] = count
      visit(index + 1, occupied + count * cost, code + count * strides[index])
    }
  }

  visit(0, 0, 0)
  return byCut
}

function withBoard(plan, board) {
  const boards = [...plan.boards]
  const index = boards.findIndex(other => other.leftover < board.leftover)
  boards.splice(index < 0 ? boards.length : index, 0, board)
  return { boards, keepers: plan.keepers + board.keeper }
}

function better(candidate, current, preferKeepers) {
  if (!current || candidate.boards.length < current.boards.length) return true
  if (candidate.boards.length > current.boards.length) return false
  if (preferKeepers && candidate.keepers !== current.keepers) return candidate.keepers > current.keepers
  for (const [index, board] of candidate.boards.entries()) {
    const difference = board.leftover - current.boards[index].leftover
    if (difference) return difference > 0
  }
  return false
}

function measureBoard(pattern, { stock, kerf, cuts }) {
  let position = 0
  const pieces = []
  cuts.forEach((cut, index) => {
    for (let copy = 0; copy < pattern.counts[index]; copy++) {
      const mark = position + cut.length
      const loss = Math.min(kerf, stock - mark)
      pieces.push({ name: cut.name, index, length: cut.length, start: position, mark, loss, needsCut: mark < stock })
      position = mark + loss
    }
  })
  return { pieces, leftover: pattern.leftover, keeper: Boolean(pattern.keeper), end: position }
}

export function planCuts(settings) {
  const { cuts, stock, kerf, keep } = settings
  let states = 1
  const strides = cuts.map(({ quantity }) => {
    const stride = states
    states *= quantity + 1
    return stride
  })
  const byCut = patternsFor(settings, strides)
  const empty = { boards: [], keepers: 0 }
  const memo = [{ long: empty, many: empty }]

  // A state encodes the remaining quantity of each cut. Every solution has a
  // board containing its first outstanding cut, so anchor the search there.
  function solve(code) {
    if (memo[code]) return memo[code]
    const remaining = cuts.map(({ quantity }, index) => Math.floor(code / strides[index]) % (quantity + 1))
    const occupied = remaining.reduce((sum, count, index) => sum + count * (cuts[index].length + kerf), 0)
    if (occupied <= stock + kerf) {
      const plan = withBoard(empty, makePattern(code, remaining, occupied, stock, keep))
      return (memo[code] = { long: plan, many: plan })
    }
    const anchor = remaining.findIndex(Boolean)
    let long
    let many
    for (const pattern of byCut[anchor]) {
      if (pattern.counts.some((count, index) => count > remaining[index])) continue
      const rest = solve(code - pattern.code)
      if (long && rest.long.boards.length + 1 > long.boards.length) continue
      const longCandidate = withBoard(rest.long, pattern)
      const manyCandidate = rest.long === rest.many ? longCandidate : withBoard(rest.many, pattern)
      if (better(longCandidate, long, false)) long = longCandidate
      if (better(manyCandidate, many, true)) many = manyCandidate
    }
    return (memo[code] = { long, many })
  }

  const { long, many } = solve(states - 1)
  return Object.fromEntries(Object.entries({ long, many }).map(([mode, result]) => [
    mode,
    {
      longest: result.boards[0].leftover,
      keepers: result.keepers,
      boards: [...result.boards].reverse().map(pattern => measureBoard(pattern, settings)),
    },
  ]))
}
