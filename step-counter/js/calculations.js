export const number = value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(value || 0));
export function progress(steps, goal) { return Math.min(100, Math.max(0, (steps / Math.max(1, goal)) * 100)); }
export function distance(steps, strideCm, unit = 'km') { const km = (steps * Number(strideCm || 72)) / 100000; return unit === 'mi' ? km * 0.621371 : km; }
export function formatDistance(value, unit = 'km') { return `${value < 10 ? value.toFixed(2) : value.toFixed(1)} ${unit}`; }
export function calories(steps, weightKg = 70) { return steps * 0.04 * (Number(weightKg) / 70); }
export function estimateStride(heightCm) { return Math.max(20, Number(heightCm || 170) * 0.415); }
export function activeMinutes(seconds) { return Math.round(Number(seconds || 0) / 60); }
export function pace(steps, activeSeconds) { if (!steps || activeSeconds < 60) return '—'; return `${Math.round(steps / (activeSeconds / 60))}/min`; }
export function formatDate(key, options = { weekday: 'short', month: 'short', day: 'numeric' }) { return new Intl.DateTimeFormat(undefined, options).format(new Date(`${key}T12:00:00`)); }
