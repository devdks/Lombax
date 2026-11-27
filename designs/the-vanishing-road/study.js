import { CYCLE, CROSSING, DEFAULT_DEPARTURE, LAST_DEPARTURE, RETURN_OFFSET, clock, firstFloodedMinute, roadHeight, tideAt } from './tide.js';

const byId = id => document.getElementById(id);
const scene = byId('scene');
const slider = byId('departure');
const plot = byId('plot');
const chart = byId('tide-chart');
const pen = chart.getContext('2d');
const route = byId('route-chart');
const routePen = route.getContext('2d');
const play = byId('play');
const playText = play.querySelector('span');
const returnView = byId('return-view');
const viewSwitch = document.querySelector('.view-switch');
const places = document.querySelector('.places');
const views = viewSwitch.querySelectorAll('button');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lowRoad = Math.min(...Array.from({ length: 161 }, (_, i) => roadHeight(i / 160)));
let minute = DEFAULT_DEPARTURE;
let model;
let plan = false;
let showReturn = false;
let playback = 0;
let announcement = '';

function drawChart() {
  const { width, height } = plot.getBoundingClientRect();
  if (!pen || width < 21 || height < 1) return;
  const ratio = Math.min(window.devicePixelRatio, 2);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (chart.width !== pixelWidth || chart.height !== pixelHeight) {
    chart.width = pixelWidth;
    chart.height = pixelHeight;
  }
  const x = time => 10 + (width - 20) * Math.min(CYCLE, time) / CYCLE;
  const y = level => height - 4 - level * (height - 11) / 4;
  pen.setTransform(ratio, 0, 0, ratio, 0, 0);
  pen.clearRect(0, 0, width, height);
  pen.lineWidth = 1;
  pen.strokeStyle = '#54746a80';
  pen.beginPath();
  for (let i = 0; i <= 4; i++) {
    const xi = x(i * CYCLE / 4);
    pen.moveTo(xi, 2);
    pen.lineTo(xi, height);
  }
  pen.stroke();
  pen.beginPath();
  pen.moveTo(x(0), y(lowRoad));
  pen.lineTo(x(CYCLE), y(lowRoad));
  pen.setLineDash([3, 4]);
  pen.strokeStyle = '#d1ad7490';
  pen.stroke();
  pen.setLineDash([]);

  function curve() {
    pen.beginPath();
    pen.moveTo(x(0), y(tideAt(0)));
    for (let time = 5; time <= CYCLE; time += 5) pen.lineTo(x(time), y(tideAt(time)));
  }
  curve();
  pen.lineTo(x(CYCLE), height);
  pen.lineTo(x(0), height);
  pen.closePath();
  pen.fillStyle = '#77bba228';
  pen.fill();
  curve();
  pen.strokeStyle = '#a7cbbb';
  pen.lineWidth = 1.45;
  pen.stroke();

  if (showReturn) {
    const returnAt = minute + RETURN_OFFSET + CROSSING;
    const returnX = x(returnAt);
    pen.beginPath();
    pen.moveTo(returnX, 0);
    pen.lineTo(returnX, height);
    pen.strokeStyle = '#ffb79d';
    pen.setLineDash([4, 3]);
    pen.stroke();
    pen.setLineDash([]);
  }
  const active = x(minute);
  const heightAtTime = y(tideAt(minute));
  pen.beginPath();
  pen.moveTo(active, 0);
  pen.lineTo(active, height);
  pen.strokeStyle = '#d9ed9f';
  pen.lineWidth = 1.5;
  pen.stroke();
  pen.beginPath();
  pen.arc(active, heightAtTime, 4.75, 0, Math.PI * 2);
  pen.fillStyle = '#d9ed9f';
  pen.fill();
  pen.strokeStyle = '#102423';
  pen.stroke();
}

function setLeg(prefix, start, floodedAt, available = true) {
  byId(`${prefix}-time`).textContent = available ? `${clock(start)}–${clock(start + CROSSING)}` : '—';
  const status = byId(`${prefix}-status`);
  status.dataset.state = available ? (floodedAt === null ? 'dry' : 'covered') : 'unavailable';
  status.textContent = available ? (floodedAt === null ? 'Dry' : 'Flooded') : 'Unavailable';
}

function drawRoute() {
  const { width, height } = route.getBoundingClientRect();
  if (!routePen || width < 24 || height < 1) return;
  const ratio = Math.min(window.devicePixelRatio, 2);
  const pixelWidth = Math.round(width * ratio);
  const pixelHeight = Math.round(height * ratio);
  if (route.width !== pixelWidth || route.height !== pixelHeight) {
    route.width = pixelWidth;
    route.height = pixelHeight;
  }
  routePen.setTransform(ratio, 0, 0, ratio, 0, 0);
  routePen.clearRect(0, 0, width, height);
  const left = 7;
  const island = width / 2;
  const right = width - 7;
  const shoreY = height * .73;
  const islandY = height * .24;

  function leg(start, startY, end, endY, status) {
    const colors = { dry: '#ead699', covered: '#ffb79d', unavailable: '#62786d' };
    const span = end - start;
    routePen.beginPath();
    routePen.moveTo(start, startY);
    routePen.bezierCurveTo(start + span * .46, startY, end - span * .35, endY, end, endY);
    routePen.strokeStyle = colors[status];
    routePen.lineWidth = 1.5;
    routePen.setLineDash(status === 'dry' ? [] : [4, 5]);
    routePen.stroke();
  }
  leg(left, shoreY, island, islandY, byId('out-status').dataset.state);
  leg(island, islandY, right, shoreY, byId('back-status').dataset.state);
  routePen.setLineDash([]);
  for (const [x, y] of [[left, shoreY], [island, islandY], [right, shoreY]]) {
    routePen.beginPath();
    routePen.arc(x, y, 4.5, 0, 2 * Math.PI);
    routePen.fillStyle = '#102423';
    routePen.fill();
    routePen.strokeStyle = '#d3dfc7';
    routePen.stroke();
  }
}

function updateTrip() {
  const outboundFlood = firstFloodedMinute(minute);
  const startBack = minute + RETURN_OFFSET;
  const returnFlood = outboundFlood === null ? firstFloodedMinute(startBack, true) : null;
  let status = 'dry';
  let title = 'Out and back on dry ground';
  let detail = 'The road stays above water as you cross in both directions.';
  if (outboundFlood !== null) {
    status = 'blocked';
    title = 'Outbound blocked';
    detail = `At ${clock(outboundFlood)}, part of the crossing is underwater when you reach it.`;
  } else if (returnFlood !== null) {
    status = 'cutoff';
    title = 'Cut off on return';
    detail = `At ${clock(returnFlood)}, part of the road is underwater when you reach it on the way back.`;
  }
  byId('verdict').dataset.status = status;
  byId('verdict-title').textContent = title;
  byId('verdict-detail').textContent = detail;
  setLeg('out', minute, outboundFlood);
  setLeg('back', startBack, returnFlood, outboundFlood === null);
  drawRoute();
  returnView.hidden = outboundFlood !== null;
  announcement = `${clock(minute)}. ${title}. ${detail}`;
}

function mapTime() {
  return showReturn ? minute + RETURN_OFFSET + CROSSING : minute;
}

function renderModel() {
  const time = mapTime();
  model?.draw(tideAt(time), time, plan);
}

function renderTimeView() {
  const time = mapTime();
  const phase = time % CYCLE;
  byId('water-label').textContent = showReturn ? `Return tide · ${clock(time)}` : 'Water at departure';
  byId('water-height').textContent = `${tideAt(time).toFixed(2)} m`;
  byId('tide-direction').textContent = phase === CYCLE / 2 ? 'Low tide'
    : phase === 0 ? 'High tide'
    : phase < CYCLE / 2 ? 'Falling' : 'Rising';
  returnView.setAttribute('aria-pressed', String(showReturn));
  drawChart();
  renderModel();
}

function setTime(value) {
  minute = Math.min(CYCLE, Math.max(0, Math.round(value)));
  showReturn = false;
  const displayedTime = clock(minute);
  slider.value = minute;
  slider.setAttribute('aria-valuetext', displayedTime);
  byId('departure-clock').textContent = displayedTime;
  updateTrip();
  renderTimeView();
}

function announceTrip() {
  byId('announcement').textContent = announcement;
}

function syncPlayLabel() {
  play.toggleAttribute('data-playing', Boolean(playback));
  playText.textContent = reducedMotion.matches ? 'Advance 30 min' : playback ? 'Pause tide' : 'Play tide';
}

function stopPlayback() {
  cancelAnimationFrame(playback);
  playback = 0;
  syncPlayLabel();
}

play.addEventListener('click', () => {
  if (reducedMotion.matches) {
    setTime(minute === CYCLE ? 0 : minute + 30);
    announceTrip();
    return;
  }
  if (playback) {
    stopPlayback();
    announceTrip();
    return;
  }
  if (minute === CYCLE) setTime(0);
  const origin = performance.now();
  const from = minute;
  function advance(now) {
    const next = Math.min(CYCLE, Math.round(from + (now - origin) * .027));
    if (next !== minute) setTime(next);
    if (next < CYCLE) playback = requestAnimationFrame(advance);
    else {
      stopPlayback();
      announceTrip();
    }
  }
  playback = requestAnimationFrame(advance);
  syncPlayLabel();
});
reducedMotion.addEventListener('change', stopPlayback);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && playback) stopPlayback();
});

slider.addEventListener('input', () => {
  stopPlayback();
  setTime(Number(slider.value));
});
slider.addEventListener('change', announceTrip);
returnView.addEventListener('click', () => {
  stopPlayback();
  showReturn = !showReturn;
  renderTimeView();
  byId('announcement').textContent = `${byId('water-label').textContent}. ${byId('water-height').textContent}.`;
});
const lastDeparture = byId('last-departure');
lastDeparture.textContent = clock(LAST_DEPARTURE);
lastDeparture.setAttribute('aria-label', `Set the last round-trip departure, ${clock(LAST_DEPARTURE)}`);
lastDeparture.addEventListener('click', () => {
  stopPlayback();
  setTime(LAST_DEPARTURE);
  announceTrip();
});
views.forEach(button => button.addEventListener('click', () => {
  plan = button.dataset.view === 'plan';
  views.forEach(view => view.setAttribute('aria-pressed', String(view === button)));
  renderModel();
}));

function projectLabels(landmarks, northAngle) {
  for (const [id, [x, y]] of Object.entries(landmarks)) {
    const label = byId(id);
    label.style.left = `${Math.min(92, Math.max(8, x))}%`;
    label.style.top = `${y}%`;
  }
  scene.parentElement.style.setProperty('--north-angle', `${northAngle}deg`);
}

function showFallback() {
  model = undefined;
  scene.removeAttribute('data-live');
  byId('fallback').hidden = false;
  places.hidden = viewSwitch.hidden = true;
}

new ResizeObserver(drawChart).observe(plot);
new ResizeObserver(drawRoute).observe(route);
new ResizeObserver(renderModel).observe(scene);
syncPlayLabel();
setTime(minute);

try {
  const { createTerrain } = await import('./terrain.js');
  model = createTerrain(byId('terrain'), projectLabels, showFallback);
  renderModel();
  scene.setAttribute('data-live', '');
  places.hidden = viewSwitch.hidden = false;
} catch {
  showFallback();
}
