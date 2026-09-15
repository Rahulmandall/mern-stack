const KEY = 'steptrack-state-v1';
const TODAY = () => dateKey();
const defaults = () => ({
  profile: { name: '', age: 30, height: 170, weight: 70, goal: 10000, stride: 72, unit: 'km', theme: 'light' },
  settings: { motionEnabled: false, developerMode: false },
  days: {},
  achievements: {},
  createdAt: new Date().toISOString()
});
function dayTemplate(goal = 10000) { return { steps: 0, goal, activeSeconds: 0, updatedAt: new Date().toISOString() }; }
export function dateKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function loadState() {
  let state = null;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { state = null; }
  if (!state || typeof state !== 'object') state = defaults();
  state.profile = { ...defaults().profile, ...(state.profile || {}) };
  state.settings = { ...defaults().settings, ...(state.settings || {}) };
  state.days = state.days && typeof state.days === 'object' ? state.days : {};
  state.achievements = state.achievements && typeof state.achievements === 'object' ? state.achievements : {};
  ensureToday(state);
  return state;
}
export function saveState(state) { state.days[dateKey()] = state.days[dateKey()] || dayTemplate(state.profile.goal); state.days[dateKey()].goal = state.profile.goal; state.days[dateKey()].updatedAt = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(state)); }
export function ensureToday(state) { const key = TODAY(); if (!state.days[key]) state.days[key] = dayTemplate(state.profile.goal); state.days[key].goal = state.profile.goal; return state.days[key]; }
export function addSteps(state, amount, date = TODAY()) { const day = state.days[date] || dayTemplate(state.profile.goal); day.steps = Math.max(0, Math.round(day.steps + Number(amount))); day.updatedAt = new Date().toISOString(); state.days[date] = day; return day; }
export function resetToday(state) { state.days[TODAY()] = dayTemplate(state.profile.goal); saveState(state); }
export function exportState(state) { return JSON.stringify({ ...state, exportedAt: new Date().toISOString(), version: 1 }, null, 2); }
export function validateImport(value) {
  if (!value || typeof value !== 'object' || typeof value.days !== 'object' || !value.profile) throw new Error('This file is not a valid StepTrack backup.');
  const clean = defaults();
  clean.profile = { ...clean.profile, ...value.profile };
  clean.profile.name = typeof clean.profile.name === 'string' ? clean.profile.name.slice(0, 40) : '';
  clean.profile.age = Math.min(120, Math.max(13, Number(clean.profile.age) || 30));
  clean.profile.height = Math.min(250, Math.max(100, Number(clean.profile.height) || 170));
  clean.profile.weight = Math.min(300, Math.max(25, Number(clean.profile.weight) || 70));
  clean.profile.goal = Math.min(100000, Math.max(100, Number(clean.profile.goal) || 10000));
  clean.profile.stride = Math.min(250, Math.max(20, Number(clean.profile.stride) || 72));
  clean.profile.unit = clean.profile.unit === 'mi' ? 'mi' : 'km';
  clean.profile.theme = clean.profile.theme === 'dark' ? 'dark' : 'light';
  clean.settings = { ...clean.settings, ...(value.settings || {}) };
  clean.settings.motionEnabled = Boolean(clean.settings.motionEnabled);
  clean.settings.developerMode = Boolean(clean.settings.developerMode);
  clean.days = {};
  Object.entries(value.days).forEach(([key, day]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !day || !Number.isFinite(Number(day.steps))) return;
    clean.days[key] = { ...dayTemplate(clean.profile.goal), ...day, steps: Math.max(0, Math.round(Number(day.steps))) };
  });
  clean.achievements = value.achievements && typeof value.achievements === 'object' ? value.achievements : {};
  ensureToday(clean);
  return clean;
}
export function persist(state) { ensureToday(state); saveState(state); }
export { KEY };
