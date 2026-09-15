import { loadState, persist, addSteps, resetToday, exportState, validateImport, dateKey } from './storage.js';
import { evaluate } from './achievements.js';
import { StepDetector } from './stepDetector.js';
import { renderHome, renderHistory, renderStats, renderAchievements, populateSettings, showView, toast, el } from './ui.js';
import { number, distance, estimateStride } from './calculations.js';

let state = loadState();
let detector;
let activeView = 'home';
let tipIndex = 0;
let lastStepAt = 0;
const tips = [
  ['A small walk is a big win', 'Try a two-minute walk after your next glass of water.'],
  ['Make it automatic', 'Park a little farther away and turn routine trips into steps.'],
  ['Take the scenic route', 'A few extra minutes outside can boost both steps and mood.'],
  ['Your future self says thanks', 'Consistency matters more than a perfect day.']
];

function commit() {
  evaluate(state);
  persist(state);
  renderAll();
}
function renderAll() {
  renderHome(state);
  renderHistory(state);
  renderStats(state, Number(el('stats-range').value || 7));
  renderAchievements(state);
  populateSettings(state);
  updateMotionStatus();
}
function updateMotionStatus() {
  const status = el('motion-status');
  const on = Boolean(detector?.running && !state.days[dateKey()]?.paused);
  status.textContent = on ? 'Motion on' : state.settings.motionEnabled ? 'Motion ready' : 'Motion off';
  status.classList.toggle('on', on);
}
function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob); link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
function startDetector() {
  if (!detector || !state.settings.motionEnabled || state.days[dateKey()]?.paused) return;
  detector.start();
}
async function enableMotion() {
  try {
    await detector.requestPermission();
    state.settings.motionEnabled = true;
    persist(state);
    startDetector();
    toast('Motion tracking enabled.', 'success');
    renderAll();
  } catch (error) { toast(error.message, 'error'); }
}
function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach(link => link.addEventListener('click', () => { activeView = link.dataset.nav; showView(activeView); if (activeView === 'statistics') renderStats(state, Number(el('stats-range').value || 7)); }));
  window.addEventListener('hashchange', () => { const name = location.hash.slice(1) || 'home'; activeView = ['home', 'history', 'statistics', 'achievements', 'settings'].includes(name) ? name : 'home'; showView(activeView); if (activeView === 'statistics') renderStats(state, Number(el('stats-range').value || 7)); });
  el('pause-button').addEventListener('click', () => {
    if (!state.settings.motionEnabled) { location.hash = '#settings'; toast('Enable motion tracking in Settings first.'); return; }
    const day = state.days[dateKey()]; day.paused = !day.paused;
    if (day.paused) detector.stop(); else startDetector();
    commit(); toast(day.paused ? 'Tracking paused.' : 'Tracking resumed.');
  });
  el('reset-button').addEventListener('click', () => { if (confirm('Reset today’s steps? This cannot be undone.')) { resetToday(state); commit(); toast('Today has been reset.'); } });
  el('add-steps-button').addEventListener('click', () => { addSteps(state, 100); commit(); toast('+100 steps added.'); });
  el('add-thousand-button').addEventListener('click', () => { addSteps(state, 1000); commit(); toast('+1,000 steps added.'); });
  el('new-tip').addEventListener('click', () => { tipIndex = (tipIndex + 1) % tips.length; el('tip-title').textContent = tips[tipIndex][0]; el('tip-text').textContent = tips[tipIndex][1]; });
  el('theme-toggle').addEventListener('click', () => { state.profile.theme = state.profile.theme === 'dark' ? 'light' : 'dark'; persist(state); renderAll(); });
  el('profile-form').addEventListener('submit', event => {
    event.preventDefault();
    state.profile.name = el('profile-name').value.trim();
    state.profile.age = Math.min(120, Math.max(13, Number(el('profile-age').value) || 30));
    state.profile.height = Math.min(250, Math.max(100, Number(el('profile-height').value) || 170));
    state.profile.weight = Math.min(300, Math.max(25, Number(el('profile-weight').value) || 70));
    state.profile.goal = Math.min(100000, Math.max(100, Number(el('profile-goal').value) || 10000));
    state.profile.stride = Math.min(250, Math.max(20, Number(el('profile-stride').value) || estimateStride(state.profile.height)));
    state.profile.unit = el('profile-unit').value === 'mi' ? 'mi' : 'km';
    persist(state); toast('Profile saved.', 'success'); renderAll();
  });
  el('dark-theme').addEventListener('change', event => { state.profile.theme = event.target.checked ? 'dark' : 'light'; persist(state); renderAll(); });
  el('motion-enabled').addEventListener('change', async event => { if (event.target.checked) await enableMotion(); else { state.settings.motionEnabled = false; detector.stop(); persist(state); renderAll(); } });
  el('developer-mode').addEventListener('change', event => { state.settings.developerMode = event.target.checked; persist(state); renderAll(); });
  el('request-motion').addEventListener('click', enableMotion);
  el('stats-range').addEventListener('change', event => renderStats(state, Number(event.target.value)));
  el('export-json').addEventListener('click', () => download(`steptrack-backup-${dateKey()}.json`, exportState(state), 'application/json'));
  el('export-csv').addEventListener('click', () => {
    const rows = [['Date', 'Steps', 'Goal', 'Distance', 'Status']];
    Object.entries(state.days).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, day]) => rows.push([key, day.steps, day.goal, distance(day.steps, state.profile.stride, state.profile.unit).toFixed(2), day.steps >= day.goal ? 'Complete' : 'In progress']));
    download(`steptrack-history-${dateKey()}.csv`, rows.map(row => row.join(',')).join('\n'), 'text/csv');
  });
  el('import-json').addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    try { const imported = validateImport(JSON.parse(await file.text())); if (!confirm('Replace the current StepTrack data with this backup?')) return; state = imported; persist(state); renderAll(); toast('Backup restored.', 'success'); }
    catch (error) { toast(error.message, 'error'); }
    event.target.value = '';
  });
  el('clear-data').addEventListener('click', () => {
    if (confirm('Delete all StepTrack data from this device?')) { localStorage.removeItem('steptrack-state-v1'); state = loadState(); detector.stop(); renderAll(); toast('Local data deleted.'); }
  });
  el('focus-goal').addEventListener('click', () => { location.hash = '#settings'; setTimeout(() => el('profile-goal').focus(), 0); });
}

function init() {
  detector = new StepDetector({ onStep: amount => { if (!state.days[dateKey()]?.paused) { lastStepAt = Date.now(); addSteps(state, amount); persist(state); renderHome(state); } }, onStatus: updateMotionStatus });
  bindEvents();
  evaluate(state);
  persist(state);
  renderAll();
  const initial = location.hash.slice(1) || 'home'; activeView = ['home', 'history', 'statistics', 'achievements', 'settings'].includes(initial) ? initial : 'home'; showView(activeView);
  if (state.settings.motionEnabled) startDetector();
  if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  window.addEventListener('resize', () => { if (activeView === 'statistics') renderStats(state, Number(el('stats-range').value || 7)); });
  setInterval(() => {
    const today = dateKey();
    if (!state.days[today]) { state = loadState(); commit(); }
    if (detector?.running && !state.days[today]?.paused && Date.now() - lastStepAt < 10000) { state.days[today].activeSeconds = (state.days[today].activeSeconds || 0) + 1; if (state.days[today].activeSeconds % 15 === 0) persist(state); }
  }, 1000);
}
init();
