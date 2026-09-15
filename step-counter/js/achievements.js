import { streaks } from './statistics.js';
export const definitions = [
  { id: 'first-step', icon: '👟', title: 'First step', text: 'Take your first step.', test: ({ total }) => total >= 1 },
  { id: 'five-k', icon: '🌱', title: 'Getting started', text: 'Reach 5,000 total steps.', test: ({ total }) => total >= 5000 },
  { id: 'ten-k', icon: '🏃', title: 'Ten thousand', text: 'Reach 10,000 steps in one day.', test: ({ best }) => best >= 10000 },
  { id: 'goal-streak', icon: '🔥', title: 'On a roll', text: 'Complete your goal 3 days in a row.', test: ({ bestStreak }) => bestStreak >= 3 },
  { id: 'seven-day-streak', icon: '🌟', title: 'One great week', text: 'Complete your goal 7 days in a row.', test: ({ bestStreak }) => bestStreak >= 7 },
  { id: 'thirty-day-streak', icon: '🏆', title: 'Monthly momentum', text: 'Complete your goal 30 days in a row.', test: ({ bestStreak }) => bestStreak >= 30 },
  { id: 'fifty-k', icon: '⭐', title: 'Big week', text: 'Reach 50,000 total steps.', test: ({ total }) => total >= 50000 },
  { id: 'hundred-k', icon: '💎', title: 'Path maker', text: 'Reach 100,000 total steps.', test: ({ total }) => total >= 100000 }
];
export function evaluate(state) {
  const days = Object.values(state.days); const total = days.reduce((sum, day) => sum + (day.steps || 0), 0); const best = Math.max(0, ...days.map(day => day.steps || 0)); const { best: bestStreak } = streaks(state);
  const context = { total, best, bestStreak };
  definitions.forEach(item => { if (item.test(context) && !state.achievements[item.id]) state.achievements[item.id] = new Date().toISOString(); });
  return state.achievements;
}
