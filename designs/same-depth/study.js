import { drawPan } from './pan.js';

const centimetres = { cm: 1, in: 2.54 };
const dimensionLabels = { square: 'Side', round: 'Diameter', rectangle: 'Width' };
const defaultRecipe = [
  { name: 'Dark chocolate', amount: 180, unit: 'g' },
  { name: 'Unsalted butter', amount: 140, unit: 'g' },
  { name: 'Sugar', amount: 180, unit: 'g' },
  { name: 'Eggs', amount: 3, unit: '' },
  { name: 'Plain flour', amount: 90, unit: 'g' },
  { name: 'Cocoa powder', amount: 20, unit: 'g' },
];
const storageKey = 'lombax.same-depth.recipe';
const numeric = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const precise = new Intl.NumberFormat('en', { maximumSignificantDigits: 3 });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const recipeRim = 1.55;
const sameButton = document.querySelector('#same-batch');
const matchButton = document.querySelector('#match-depth');
const matchFactor = document.querySelector('#match-factor');
const fill = document.querySelector('#fill-level');
const comparison = document.querySelector('#comparison');
const factor = document.querySelector('#factor');
const factorNumber = factor.firstChild;
const timesSign = factor.querySelector('span');
const factorNote = document.querySelector('#factor-note');
const depths = [...document.querySelectorAll('.depth strong')];
const charts = [...document.querySelectorAll('.charts canvas')];
const panSettings = [...document.querySelectorAll('[data-pan]')].map(section => ({
  shape: section.querySelector('[name=shape]'),
  unit: section.querySelector('[name=unit]'),
  width: section.querySelector('[name=width]'),
  length: section.querySelector('[name=length]'),
  dimensionLabel: section.querySelector('[data-dimension]'),
  lengthLabel: section.querySelector('[data-length]'),
  summary: section.parentElement.querySelector('summary span'),
}));
const panControls = [...document.querySelectorAll('.pan-control')];
const results = document.querySelector('#ingredient-results');
const recipeNote = document.querySelector('#recipe-note');
const recipeView = document.querySelector('#recipe-view');
const recipeEditor = document.querySelector('#recipe-editor');
const fields = document.querySelector('#ingredient-fields');
const template = document.querySelector('#ingredient-template');
const editButton = document.querySelector('#edit-recipe');
const addButton = document.querySelector('#add-ingredient');

let recipe = loadRecipe();
let areaRatio = null;
let batchMode = 'same';
let batchSize = 1;
let target;
let rendered;
let frame = 0;

function loadRecipe() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Array.isArray(saved) && saved.length && saved.every(item => (
      item && typeof item.name === 'string' && Number.isFinite(item.amount) && item.amount >= 0 && typeof item.unit === 'string'
    ))) return saved;
  } catch {
    // The calculator also works when browser storage is unavailable.
  }
  return defaultRecipe;
}

function readPan({ shape, unit, width, length, dimensionLabel, lengthLabel, summary }) {
  const rectangle = shape.value === 'rectangle';
  dimensionLabel.textContent = dimensionLabels[shape.value];
  lengthLabel.hidden = !rectangle;
  length.disabled = !rectangle;
  for (const input of [width, length]) {
    input.max = unit.value === 'cm' ? '100' : '40';
    input.setAttribute('aria-invalid', String(!input.disabled && !input.validity.valid));
  }
  if (!width.validity.valid || (rectangle && !length.validity.valid)) {
    summary.textContent = 'Set pan size';
    return null;
  }

  const unitScale = centimetres[unit.value];
  const innerWidth = width.valueAsNumber * unitScale;
  const innerLength = rectangle ? length.valueAsNumber * unitScale : innerWidth;
  const dimensions = rectangle ? `${width.value} × ${length.value}` : width.value;
  summary.textContent = `${dimensions} ${unit.value}${rectangle ? '' : ` ${shape.value}`}`;
  const roundness = Number(shape.value === 'round');
  const area = roundness ? Math.PI * (innerWidth / 2) ** 2 : innerWidth * innerLength;
  return { width: innerWidth, length: innerLength, roundness, area };
}

function formatNumber(value) {
  return value !== 0 && Math.abs(value) < .01 ? precise.format(value) : numeric.format(value);
}

function formatDepth(level) {
  const percentage = level * 100;
  return `${percentage > 0 && percentage < 1 ? formatNumber(percentage) : Math.round(percentage).toLocaleString('en')}%`;
}

function updateComparison(newDepth) {
  fill.disabled = sameButton.disabled = matchButton.disabled = areaRatio === null;
  sameButton.setAttribute('aria-pressed', String(batchMode === 'same'));
  matchButton.setAttribute('aria-pressed', String(batchMode === 'match'));
  if (areaRatio === null) {
    comparison.textContent = 'Enter a size from 1 to 100 cm or 1 to 40 in for each measurement.';
    factorNumber.data = '—';
    timesSign.hidden = true;
    factorNote.textContent = 'Add both pan sizes to scale the recipe.';
    matchFactor.textContent = '—';
    return;
  }

  const multiplier = formatNumber(batchSize);
  factorNumber.data = multiplier;
  timesSign.hidden = false;
  factorNote.textContent = batchSize === 1 ? 'Original recipe' : 'Times the original recipe';
  matchFactor.textContent = `${formatNumber(areaRatio)}×`;
  fill.setAttribute('aria-valuetext', `${formatDepth(newDepth)} of recipe depth, ${multiplier} times the original batch`);

  const change = Math.round(Math.abs(1 - newDepth) * 100);
  const subject = batchMode === 'same' ? 'The same batch' : 'This batch';
  if (Math.abs(1 - newDepth) < .0000001) {
    comparison.textContent = 'The batter reaches the original level.';
  } else if (change === 0) {
    comparison.textContent = `${subject} is almost the same depth.`;
  } else {
    comparison.textContent = `${subject} is ${change.toLocaleString('en')}% ${newDepth < 1 ? 'shallower' : 'deeper'}.`;
  }
}

function renderCharts(shimmer = 0) {
  const { pans, level, rimLevel } = rendered;
  const range = {
    width: Math.max(1, ...pans.map(pan => pan?.width ?? 0)),
    length: Math.max(1, ...pans.map(pan => pan?.length ?? 0)),
    rimLevel,
  };
  drawPan(charts[0], pans[0], 1, range, recipeRim, 0);
  const plot = drawPan(charts[1], level === null ? null : pans[1], level ?? 1, range, rimLevel, shimmer, true);
  if (plot) {
    const max = rimLevel / 1.18;
    const sliderTravel = max * plot.depthUnit;
    fill.max = max;
    fill.valueAsNumber = level;
    fill.style.setProperty('--fill-length', `${sliderTravel + 24}px`);
    fill.style.setProperty('--fill-top', `${plot.floor - sliderTravel - 12}px`);
  }
  depths[0].textContent = pans[0] ? '100%' : '—';
  depths[1].textContent = level === null ? '—' : formatDepth(level);
}

function mix(from, to, progress) {
  return from + (to - from) * progress;
}

function interpolatePan(from, to, progress) {
  return {
    width: mix(from.width, to.width, progress),
    length: mix(from.length, to.length, progress),
    roundness: mix(from.roundness, to.roundness, progress),
  };
}

function settle() {
  cancelAnimationFrame(frame);
  frame = 0;
  rendered = target;
  renderCharts();
}

function transitionTo(next) {
  cancelAnimationFrame(frame);
  target = next;
  if (!rendered || reducedMotion.matches || rendered.level === null || next.level === null) {
    settle();
    return;
  }
  const start = rendered;
  const changed = next.level !== start.level || next.rimLevel !== start.rimLevel || next.pans.some((pan, i) => (
    pan.width !== start.pans[i].width || pan.length !== start.pans[i].length || pan.roundness !== start.pans[i].roundness
  ));
  if (!changed) {
    settle();
    return;
  }

  const startedAt = performance.now();
  const duration = 540;
  function tick(now) {
    const time = Math.min(1, Math.max(0, (now - startedAt) / duration));
    if (time === 1) {
      settle();
      return;
    }
    const eased = time * time * (3 - 2 * time);
    rendered = {
      pans: next.pans.map((pan, index) => interpolatePan(start.pans[index], pan, eased)),
      level: mix(start.level, next.level, eased),
      rimLevel: mix(start.rimLevel, next.rimLevel, eased),
    };
    const shimmer = start.level === next.level ? 0 : Math.sin(time * Math.PI) ** 2;
    renderCharts(shimmer);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
}

function calculate() {
  const pans = panSettings.map(readPan);
  areaRatio = pans.every(Boolean) ? pans[1].area / pans[0].area : null;
  const sameBatchDepth = areaRatio === null ? null : 1 / areaRatio;
  if (batchMode === 'same') batchSize = 1;
  if (batchMode === 'match' && areaRatio !== null) batchSize = areaRatio;
  const level = sameBatchDepth === null ? null : batchSize * sameBatchDepth;
  updateComparison(level);
  renderRecipe();
  transitionTo({ pans, level, rimLevel: Math.max(recipeRim, (sameBatchDepth ?? 1) * 1.18, (level ?? 1) * 1.18) });
}

function formatAmount(amount, unit) {
  return unit ? `${formatNumber(amount)} ${unit}` : formatNumber(amount);
}

function renderRecipe() {
  const rows = recipe.map(ingredient => {
    const row = document.createElement('tr');
    const amounts = [
      ingredient.name,
      formatAmount(ingredient.amount, ingredient.unit),
      areaRatio === null ? '—' : formatAmount(ingredient.amount * batchSize, ingredient.unit),
    ];
    for (const value of amounts) row.insertCell().textContent = value;
    return row;
  });
  results.replaceChildren(...rows);
  recipeNote.hidden = recipe !== defaultRecipe;
}

function labelRemoveButtons() {
  for (const [index, field] of [...fields.children].entries()) {
    const remove = field.querySelector('.remove');
    remove.hidden = fields.children.length === 1;
    remove.setAttribute('aria-label', `Remove ingredient ${index + 1}`);
  }
}

function addIngredientField(ingredient = { name: '', amount: '', unit: '' }) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector('[name=ingredient]').value = ingredient.name;
  row.querySelector('[name=amount]').value = ingredient.amount;
  row.querySelector('[name=measure]').value = ingredient.unit;
  fields.append(row);
  labelRemoveButtons();
  return row;
}

function showEditor(open) {
  recipeEditor.hidden = !open;
  recipeView.hidden = open;
  editButton.setAttribute('aria-expanded', String(open));
  editButton.textContent = open ? 'Cancel' : 'Edit';
  if (open) {
    fields.replaceChildren();
    recipe.forEach(addIngredientField);
    fields.querySelector('input').focus();
  } else {
    editButton.focus();
  }
}

editButton.addEventListener('click', () => showEditor(recipeEditor.hidden));
addButton.addEventListener('click', () => addIngredientField().querySelector('input').focus());
fields.addEventListener('click', event => {
  if (!event.target.matches('.remove') || fields.children.length === 1) return;
  const row = event.target.closest('.ingredient-fields');
  const destination = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  labelRemoveButtons();
  destination.querySelector('input').focus();
});
fields.addEventListener('input', event => {
  if (event.target.name === 'ingredient') event.target.setCustomValidity('');
});
recipeEditor.addEventListener('submit', event => {
  event.preventDefault();
  const blankName = [...fields.querySelectorAll('[name=ingredient]')].find(input => !input.value.trim());
  if (blankName) {
    blankName.setCustomValidity('Enter an ingredient name.');
    blankName.reportValidity();
    return;
  }
  recipe = [...fields.children].map(row => ({
    name: row.querySelector('[name=ingredient]').value.trim(),
    amount: row.querySelector('[name=amount]').valueAsNumber,
    unit: row.querySelector('[name=measure]').value.trim(),
  }));
  try {
    localStorage.setItem(storageKey, JSON.stringify(recipe));
  } catch {
    // The edited ingredients remain available in this tab.
  }
  renderRecipe();
  showEditor(false);
});

// Unit selectors describe the measurements as entered, including when pans use different units.
document.querySelector('#measurements').addEventListener('input', calculate);
sameButton.addEventListener('click', () => {
  batchMode = 'same';
  calculate();
});
matchButton.addEventListener('click', () => {
  batchMode = 'match';
  calculate();
});
fill.addEventListener('input', event => {
  event.stopPropagation();
  batchMode = 'custom';
  const level = fill.valueAsNumber;
  batchSize = level * areaRatio;
  updateComparison(level);
  renderRecipe();
  target = { ...rendered, level };
  settle();
});
document.addEventListener('click', event => {
  for (const control of panControls) {
    if (!control.contains(event.target)) control.open = false;
  }
});
document.addEventListener('keydown', event => {
  const control = event.target.closest('.pan-control[open]');
  if (event.key === 'Escape' && control) {
    control.open = false;
    control.querySelector('summary').focus();
  }
});
reducedMotion.addEventListener('change', settle);
calculate();
const resize = new ResizeObserver(() => renderCharts());
charts.forEach(canvas => resize.observe(canvas));
