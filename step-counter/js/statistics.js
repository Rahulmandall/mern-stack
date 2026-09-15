import { dateKey } from './storage.js';
export function rangeDays(days, end = new Date()) { return Array.from({ length: days }, (_, index) => { const d = new Date(end); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (days - 1 - index)); return dateKey(d); }); }
export function series(state, days) { return rangeDays(days).map(key => ({ key, ...(state.days[key] || { steps: 0, goal: state.profile.goal, activeSeconds: 0 }) })); }
export function summarize(items) {
  const total = items.reduce((sum, day) => sum + Number(day.steps || 0), 0);
  const best = items.reduce((winner, day) => (Number(day.steps || 0) > Number(winner?.steps || 0) ? day : winner), null);
  const complete = items.filter(day => day.steps >= (day.goal || 10000)).length;
  return { total, average: items.length ? Math.round(total / items.length) : 0, best, completion: items.length ? Math.round((complete / items.length) * 100) : 0 };
}
export function streaks(state) {
  const keys = Object.keys(state.days).sort();
  let current = 0; let best = 0; let run = 0; let previous = null;
  keys.forEach(key => { const day = state.days[key]; const next = previous && (new Date(`${key}T12:00:00`) - new Date(`${previous}T12:00:00`)) === 86400000; if (day.steps >= day.goal) run = next ? run + 1 : 1; else run = 0; best = Math.max(best, run); previous = key; });
  let cursor = new Date(); cursor.setHours(12, 0, 0, 0);
  let key = dateKey(cursor); let day = state.days[key];
  if (!day || day.steps < day.goal) { cursor.setDate(cursor.getDate() - 1); key = dateKey(cursor); day = state.days[key]; }
  while (day && day.steps >= day.goal) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
    key = dateKey(cursor);
    day = state.days[key];
  }
  return { current, best };
}
