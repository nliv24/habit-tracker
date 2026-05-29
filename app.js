'use strict';

const STORAGE_KEY = 'habit-tracker';
const THEME_KEY = 'habit-tracker-theme';

// ── Theme ─────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-btn');
  btn.textContent = theme === 'dark' ? 'Light' : 'Dark';
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function localDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getToday() {
  return localDateStr(new Date());
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(localDateStr(d));
  }
  return days;
}

function weekdayAbbr(dateStr) {
  // Parse in local time to avoid UTC off-by-one
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en', { weekday: 'short' });
}

function dayNumber(dateStr) {
  return String(parseInt(dateStr.slice(8), 10));
}

// ── Persistence ───────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { habits: [] };
  } catch {
    return { habits: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── State mutations ───────────────────────────────────────────────────────────

let state = loadState();

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function addHabit(name, description) {
  state.habits.push({
    id: genId(),
    name: name.trim(),
    description: description.trim(),
    completions: [],
  });
  saveState();
  render();
}

function removeHabit(id) {
  state.habits = state.habits.filter(h => h.id !== id);
  saveState();
  render();
}

function toggleDay(habitId, dateStr) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  const idx = habit.completions.indexOf(dateStr);
  if (idx === -1) {
    habit.completions.push(dateStr);
  } else {
    habit.completions.splice(idx, 1);
  }
  saveState();
  render();
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function makeDayCol(habit, dateStr, today) {
  const isToday = dateStr === today;
  const completed = habit.completions.includes(dateStr);

  const col = document.createElement('div');
  col.className = 'day-col';

  const label = document.createElement('span');
  label.className = 'day-label' + (isToday ? ' is-today' : '');
  label.textContent = isToday ? 'Today' : weekdayAbbr(dateStr);

  const dot = document.createElement('button');
  const classes = ['day-dot'];
  if (isToday) classes.push('is-today');
  if (completed) classes.push('completed');
  dot.className = classes.join(' ');
  dot.textContent = dayNumber(dateStr);
  dot.setAttribute('aria-label', `${dateStr}${completed ? ', completed' : ', not completed'}`);
  dot.setAttribute('aria-pressed', String(completed));
  dot.addEventListener('click', () => toggleDay(habit.id, dateStr));

  col.append(label, dot);
  return col;
}

function makeHabitCard(habit, today, last7) {
  const card = document.createElement('article');
  card.className = 'habit-card';

  // Header row
  const header = document.createElement('div');
  header.className = 'habit-header';

  const info = document.createElement('div');

  const nameEl = document.createElement('h2');
  nameEl.className = 'habit-name';
  nameEl.textContent = habit.name;
  info.append(nameEl);

  if (habit.description) {
    const desc = document.createElement('p');
    desc.className = 'habit-desc';
    desc.textContent = habit.description;
    info.append(desc);
  }

  const delBtn = document.createElement('button');
  delBtn.className = 'delete-btn';
  delBtn.setAttribute('aria-label', `Remove ${habit.name}`);
  delBtn.textContent = '✕';
  delBtn.addEventListener('click', () => {
    if (confirm(`Remove "${habit.name}"?`)) removeHabit(habit.id);
  });

  header.append(info, delBtn);

  // 7-day grid
  const grid = document.createElement('div');
  grid.className = 'habit-grid';
  last7.forEach(date => grid.append(makeDayCol(habit, date, today)));

  card.append(header, grid);
  return card;
}

function render() {
  const container = document.getElementById('habits-container');
  const emptyState = document.getElementById('empty-state');
  const today = getToday();
  const last7 = getLast7Days();

  container.innerHTML = '';

  if (state.habits.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  state.habits.forEach(habit => container.append(makeHabitCard(habit, today, last7)));
}

// ── Modal ─────────────────────────────────────────────────────────────────────

const modal = document.getElementById('modal');
const backdrop = document.getElementById('modal-backdrop');
const form = document.getElementById('add-form');
const nameInput = document.getElementById('input-name');
const descInput = document.getElementById('input-desc');
const nameError = document.getElementById('name-error');

function openModal() {
  form.reset();
  nameInput.classList.remove('invalid');
  nameError.textContent = '';
  modal.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  nameInput.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  backdrop.classList.add('hidden');
}

document.getElementById('open-modal-btn').addEventListener('click', openModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.classList.add('invalid');
    nameError.textContent = 'Name is required.';
    nameInput.focus();
    return;
  }
  addHabit(name, descInput.value);
  closeModal();
});

nameInput.addEventListener('input', () => {
  nameInput.classList.remove('invalid');
  nameError.textContent = '';
});

// ── Boot ──────────────────────────────────────────────────────────────────────

// Sync button label with the theme that was already applied by the inline <head> script
applyTheme(localStorage.getItem(THEME_KEY) || 'light');
document.getElementById('theme-btn').addEventListener('click', toggleTheme);

render();
