export const duration = 30
export const storage = 900
export const effectiveArea = { roof: 84, court: 54 }

export const sites = {
  roof: {
    name: 'Roof edge', point: [-4.3, 0.68], infiltration: 16,
    note: 'The garden catches the downspout. Runoff from the paving still goes to the door.',
    reason: 'Faster-draining soil frees up storage during the storm.',
  },
  court: {
    name: 'Court inlet', point: [4.15, -0.7], infiltration: 10,
    note: 'The garden catches the paving runoff. Water from the downspout bypasses it.',
    reason: 'It catches runoff from the paving as it enters the channel.',
  },
  low: {
    name: 'Low corner', point: [0.55, 3.3], infiltration: 4,
    note: 'The two paths meet here, but the soil absorbs water slowly.',
    reason: 'It catches both paths where they meet.',
  },
}

export function runoff(rain, minute, placement) {
  // A millimetre of rain on a square metre contributes one litre.
  const roof = rain * effectiveArea.roof / 60
  const court = rain * effectiveArea.court / 60
  const total = roof + court
  const inlet = { roof, court, low: total, none: 0 }[placement]
  const soak = Math.min(inlet, sites[placement]?.infiltration ?? 0)
  const fillRate = inlet - soak
  const stored = Math.min(storage, fillRate * minute)
  const kept = stored + soak * minute
  const spill = fillRate * minute > storage ? fillRate : 0

  return {
    total: total * minute, door: Math.max(0, total * minute - kept), kept, stored,
    full: stored >= storage,
    overflowMinute: fillRate > 0 ? Math.floor(storage / fillRate + 1e-9) + 1 : Infinity,
    roof, court, spill,
    roofExit: placement === 'roof' ? spill : roof,
    courtExit: placement === 'court' ? spill : court,
    sharedExit: placement === 'low' ? spill : total - inlet + spill,
  }
}
