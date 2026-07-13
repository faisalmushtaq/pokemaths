// =============================================================================
// POKÉMATHS — STREAK MILESTONES
// =============================================================================
// Collectible badges earned by keeping a daily play streak going. Achievement
// is derived from the all-time best streak, so a badge you've earned stays
// earned even after a streak resets.
// =============================================================================

export interface Milestone {
  days: number;
  name: string;
  icon: string;
  color: string;
}

export const STREAK_MILESTONES: Milestone[] = [
  { days: 3, name: 'Spark', icon: '🔥', color: '#f97316' },
  { days: 7, name: 'One Week', icon: '⭐', color: '#facc15' },
  { days: 14, name: 'Fortnight', icon: '🌟', color: '#38bdf8' },
  { days: 30, name: 'One Month', icon: '🏅', color: '#a78bfa' },
  { days: 60, name: 'Two Months', icon: '🏆', color: '#22c55e' },
  { days: 100, name: 'Century', icon: '💯', color: '#ef4444' },
  { days: 365, name: 'One Year', icon: '👑', color: '#FFD700' },
];

/** Milestones the player has unlocked, based on their best-ever streak. */
export function achievedMilestones(best: number): Milestone[] {
  return STREAK_MILESTONES.filter((m) => best >= m.days);
}

/** The milestone reached exactly at `days` (used to celebrate a fresh unlock). */
export function milestoneAt(days: number): Milestone | undefined {
  return STREAK_MILESTONES.find((m) => m.days === days);
}

/** The next milestone still to reach, given the current streak. */
export function nextMilestone(current: number): Milestone | undefined {
  return STREAK_MILESTONES.find((m) => m.days > current);
}
