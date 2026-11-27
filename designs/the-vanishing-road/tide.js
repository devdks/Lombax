export const CYCLE = 720;
export const CROSSING = 24;
export const VISIT = 35;
export const DEFAULT_DEPARTURE = 415;

export function smoothstep(low, high, value) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

export function tideAt(minutes) {
  return 2.04 + 1.72 * Math.cos(minutes / CYCLE * 2 * Math.PI);
}

export function roadHeight(progress) {
  const edge = 2 * progress - 1;
  return 1.23 + 1.75 * edge ** 4 + 0.10 * edge + 2.2 * smoothstep(.77, 1, Math.abs(edge));
}

export function roadPosition(progress) {
  return {
    x: -9.1 + 16.25 * progress,
    y: roadHeight(progress),
    z: 1.35 - 2.7 * progress + .54 * Math.sin(progress * Math.PI * 2),
  };
}

export function firstFloodedMinute(departure, reverse = false) {
  // Check five-second intervals along the road, including either approach.
  for (let tick = 0; tick <= CROSSING * 12; tick++) {
    const elapsed = tick / 12;
    const progress = elapsed / CROSSING;
    if (tideAt(departure + elapsed) >= roadHeight(reverse ? 1 - progress : progress)) {
      return departure + elapsed;
    }
  }
  return null;
}

export const RETURN_OFFSET = CROSSING + VISIT;
export const LAST_DEPARTURE = Array.from({ length: CYCLE + 1 }, (_, minute) => minute)
  .findLast(minute => firstFloodedMinute(minute) === null && firstFloodedMinute(minute + RETURN_OFFSET, true) === null);

export function clock(minutes) {
  const rounded = 360 + Math.round(minutes);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}
