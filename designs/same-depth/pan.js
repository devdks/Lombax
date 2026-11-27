const segments = 40;

function footprint(t, pan) {
  const squareX = Math.max(-1, Math.min(1, (t - 0.5) * 4));
  const squareZ = Math.min(1, t * 4, (1 - t) * 4);
  const circleX = -Math.cos(Math.PI * t);
  const circleZ = Math.sin(Math.PI * t);
  return [
    (squareX + (circleX - squareX) * pan.roundness) * pan.width / 2,
    (squareZ + (circleZ - squareZ) * pan.roundness) * pan.length / 2,
  ];
}

function shape(ctx, points) {
  ctx.beginPath();
  for (const [index, [x, y]] of points.entries()) {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function gradient(ctx, top, bottom, start, end) {
  const color = ctx.createLinearGradient(0, top, 0, bottom);
  color.addColorStop(0, start);
  color.addColorStop(1, end);
  return color;
}

function filledShape(ctx, points, color) {
  shape(ctx, points);
  ctx.fillStyle = color;
  ctx.fill();
}

function stroke(ctx, points, color, width) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function paintPan(ctx, pan, layout) {
  const { center, floor, maxHeight, scale, level, shimmer } = layout;
  const points = Array.from({ length: segments + 1 }, (_, i) => footprint(i / segments, pan));
  const project = (elevation, offset = 0) => points.map(([x, z]) => [
    center + x * scale * (1 - z / pan.length * .27) + z * scale * .08 + Math.sign(x) * offset,
    floor - z * scale * 0.47 - elevation,
  ]);
  const base = project(0);
  const roof = project(maxHeight);
  const top = project(level);
  const left = base[0][0];
  const right = base.at(-1)[0];
  const span = right - left;
  const back = Math.min(...top.map(([, y]) => y));
  const surface = floor - level;
  const rim = floor - maxHeight;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.save();
  ctx.fillStyle = '#0a123f58';
  ctx.beginPath();
  ctx.ellipse(center + span * .065, floor + 5, span * .62, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  filledShape(ctx, [...roof, ...base.toReversed()], gradient(ctx, rim - 27, floor, '#d2defe', '#596ab4'));
  stroke(ctx, project(maxHeight - 3), '#e3eaff55', 1);
  filledShape(ctx, top, gradient(ctx, back, surface, '#7d4b36', '#aa6d50'));
  filledShape(ctx, [top[0], top.at(-1), base.at(-1), base[0]], gradient(ctx, surface, floor, '#c0895e', '#895039'));

  // The sheen is clipped to the moving surface so it reads as liquid inside the tin.
  ctx.save();
  shape(ctx, top);
  ctx.clip();
  const reflectedLight = ctx.createRadialGradient(center - span * .19, surface - 9, 0, center - span * .19, surface - 9, Math.max(1, span * .42));
  reflectedLight.addColorStop(0, '#ffd89e58');
  reflectedLight.addColorStop(1, '#ffd89e00');
  ctx.fillStyle = reflectedLight;
  ctx.fillRect(left - 10, back, span * 1.25 + 20, surface - back);
  if (shimmer > 0.005) {
    ctx.strokeStyle = `rgba(255, 229, 182, ${shimmer * .48})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(center + span * .085, surface - (surface - back) * .31, span * .27, Math.max(1, (surface - back) * .17), 0, .15, Math.PI * 1.06);
    ctx.stroke();
  }
  ctx.restore();

  stroke(ctx, [top[0], top.at(-1)], '#f3c794', 1.25);
  stroke(ctx, [roof[0], base[0], base.at(-1), roof.at(-1)], '#a8bcf1', 2.1);
  stroke(ctx, project(maxHeight, 2), '#d6e0ff', 2.25);
  stroke(ctx, [[left - 3, floor + 2], [right + 3, floor + 2]], '#8295df', 1);
}

export function drawPan(canvas, pan, level, range, rimLevel, shimmer, hasHandle = false) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  const pixelsWide = Math.round(width * ratio);
  const pixelsHigh = Math.round(height * ratio);
  if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
  if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
  const ctx = canvas.getContext('2d');
  if (!ctx || !width || !height) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const floor = height * .82;
  const plotWidth = (width - 38) * .77;
  const scale = Math.min(plotWidth / range.width, height * 1.53 / range.length);
  const depthUnit = height * .41 / range.rimLevel;
  const reference = floor - depthUnit;

  ctx.save();
  ctx.setLineDash([3, 4]);
  stroke(ctx, [[0, reference], [width, reference]], '#e0e7ff80', 1);
  ctx.restore();

  if (!pan) return;
  paintPan(ctx, pan, {
    center: width * .48,
    floor,
    maxHeight: rimLevel * depthUnit,
    scale,
    level: level * depthUnit,
    shimmer,
  });

  // Carry the guide across the cut face as well as the empty space around the tin.
  const smallGuide = pan.width * scale * .5;
  if (smallGuide > 7 && level !== 1) {
    ctx.save();
    ctx.setLineDash([3, 4]);
    stroke(ctx, [[width * .48 - smallGuide, reference], [width * .48 + smallGuide, reference]], '#e0e7ff99', 1);
    ctx.restore();
  }

  if (hasHandle) {
    const surface = floor - level * depthUnit;
    stroke(ctx, [[width * .48 + smallGuide, surface], [width - 19, surface]], '#f9dc91aa', 1);
  }
  return { floor, depthUnit };
}
