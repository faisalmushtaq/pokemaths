// =============================================================================
// POKÉMATHS — SAVE DATA (Pokédex + progress)
// =============================================================================
// One save per player profile, keyed by profile id in localStorage. This module
// is the single source of truth for save/load + merge, so the Firebase sync
// layer can reuse the exact same shape and merge rule.
// =============================================================================

export interface CaughtEntry {
  dex: number;
  name: string;
  region: string;
  caughtAt: number; // epoch ms
}

export interface MegaEntry {
  dex: number; // base national dex
  formId: number; // PokeAPI mega form id (for the sprite)
  name: string; // mega display name
  caughtAt: number; // epoch ms (first earned)
  bestTime?: number; // fastest 24-question run, in seconds
}

export interface StreakData {
  current: number; // consecutive days played
  best: number; // longest streak ever
  lastDay: string; // 'YYYY-MM-DD' (local) of the last counted day
  freezes: number; // streak-freeze grace days held (auto-used to bridge a missed day)
  lastFreezeUsed?: string; // 'YYYY-MM-DD' a freeze was last auto-spent
}

/** Most freezes a player can hold at once. */
export const MAX_FREEZES = 3;

export interface SaveData {
  version: 1;
  /** keyed by dex number so a Pokémon is only recorded once */
  caught: Record<number, CaughtEntry>;
  /** mega evolutions earned in Arcade, keyed by base dex */
  megas: Record<number, MegaEntry>;
  /** battle ids that have been won (100% accuracy) */
  wonBattles: string[];
  /** battle ids unlocked early by passing a 3-question test */
  testUnlocked: string[];
  /** daily play streak */
  streak: StreakData;
  /** lifetime usage stats */
  stats: Stats;
}

export const EMPTY_STREAK: StreakData = { current: 0, best: 0, lastDay: '', freezes: 0 };

export interface Stats {
  correct: number; // questions answered correctly (all modes)
  wrong: number; // questions answered wrong
  seconds: number; // total time spent answering
  battlesWon: number; // journey battles won at 100%
  arcadeRuns: number; // arcade runs finished
  testsPassed: number; // test-outs passed
  daysPlayed: number; // distinct days played
}

export const EMPTY_STATS: Stats = { correct: 0, wrong: 0, seconds: 0, battlesWon: 0, arcadeRuns: 0, testsPassed: 0, daysPlayed: 0 };

const KEY_PREFIX = 'pokemaths.save.';
const LEGACY_KEY = 'pokemaths.save.v1'; // pre-profiles single save

export const EMPTY_SAVE: SaveData = { version: 1, caught: {}, megas: {}, wonBattles: [], testUnlocked: [], streak: { ...EMPTY_STREAK }, stats: { ...EMPTY_STATS } };

function keyFor(profileId: string): string {
  return `${KEY_PREFIX}${profileId}`;
}

function parse(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE };
  try {
    const p = JSON.parse(raw) as Partial<SaveData>;
    return { version: 1, caught: p.caught ?? {}, megas: p.megas ?? {}, wonBattles: p.wonBattles ?? [], testUnlocked: p.testUnlocked ?? [], streak: { ...EMPTY_STREAK, ...(p.streak ?? {}) }, stats: { ...EMPTY_STATS, ...(p.stats ?? {}) } };
  } catch {
    return { ...EMPTY_SAVE };
  }
}

export function loadSave(profileId: string): SaveData {
  return parse(localStorage.getItem(keyFor(profileId)));
}

export function persistSave(profileId: string, data: SaveData): void {
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(data));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

export function deleteSave(profileId: string): void {
  try {
    localStorage.removeItem(keyFor(profileId));
  } catch {
    /* ignore */
  }
}

/** Record a win + catch, persisting to the profile. Returns the new save. */
export function recordWin(
  profileId: string,
  data: SaveData,
  battleId: string,
  entry: CaughtEntry,
): SaveData {
  const next: SaveData = {
    ...data,
    version: 1,
    caught: { ...data.caught, [entry.dex]: data.caught[entry.dex] ?? entry },
    wonBattles: data.wonBattles.includes(battleId) ? data.wonBattles : [...data.wonBattles, battleId],
  };
  persistSave(profileId, next);
  return next;
}

/** Local 'YYYY-MM-DD' for a date. */
function dayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Whole days from a→b (both 'YYYY-MM-DD'); positive if b is later. */
function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

/** A freeze is earned every 5th day of a streak. */
const FREEZE_EVERY = 5;

/**
 * Mark that the player completed something today and update the daily streak.
 *  - same day → no change
 *  - next day → +1
 *  - a gap → streak freezes (held grace days) are auto-spent to bridge the
 *    missed days and keep the streak alive; if there aren't enough, it resets.
 * A freeze is earned every 5th streak day (capped at MAX_FREEZES).
 * Returns the new save (unchanged if already counted today).
 */
export function recordPlay(profileId: string, data: SaveData): SaveData {
  const today = dayStr(new Date());
  const s = data.streak ?? EMPTY_STREAK;
  if (s.lastDay === today) return data; // already counted today

  let current: number;
  let freezes = s.freezes;
  let lastFreezeUsed = s.lastFreezeUsed;
  if (!s.lastDay) {
    current = 1;
  } else {
    const gap = daysBetween(s.lastDay, today); // ≥1
    if (gap === 1) {
      current = s.current + 1;
    } else {
      const missed = gap - 1; // full days skipped
      if (freezes >= missed) {
        freezes -= missed; // spend grace days to keep the streak
        lastFreezeUsed = today;
        current = s.current + 1;
      } else {
        current = 1; // streak broke
      }
    }
  }
  // Earn a freeze on every 5th streak day.
  if (current > 0 && current % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);

  const streak: StreakData = { current, best: Math.max(s.best, current), lastDay: today, freezes, lastFreezeUsed };
  const next: SaveData = { ...data, streak, stats: { ...data.stats, daysPlayed: data.stats.daysPlayed + 1 } };
  persistSave(profileId, next);
  return next;
}

/** Record one answered question (correct/wrong + time), for lifetime stats. */
export function recordAnswer(profileId: string, data: SaveData, correct: boolean, seconds: number): SaveData {
  const capped = Math.min(Math.max(seconds, 0), 120); // ignore idle/away time
  const next: SaveData = {
    ...data,
    stats: {
      ...data.stats,
      correct: data.stats.correct + (correct ? 1 : 0),
      wrong: data.stats.wrong + (correct ? 0 : 1),
      seconds: data.stats.seconds + capped,
    },
  };
  persistSave(profileId, next);
  return next;
}

/** Bump a run-completion counter (a battle won, an arcade run, a test passed). */
export function recordRun(profileId: string, data: SaveData, kind: 'battlesWon' | 'arcadeRuns' | 'testsPassed'): SaveData {
  const next: SaveData = { ...data, stats: { ...data.stats, [kind]: data.stats[kind] + 1 } };
  persistSave(profileId, next);
  return next;
}

/** True if a streak freeze was auto-spent today (to celebrate/confirm it). */
export function freezeUsedToday(data: SaveData): boolean {
  return (data.streak?.lastFreezeUsed ?? '') === dayStr(new Date());
}

/**
 * The streak as it should read right now. Live if the last play was today or
 * yesterday, or if held freezes can still cover the missed days; else 0.
 */
export function liveStreak(data: SaveData): number {
  const s = data.streak ?? EMPTY_STREAK;
  if (!s.lastDay) return 0;
  const gap = daysBetween(s.lastDay, dayStr(new Date()));
  if (gap <= 1) return s.current;
  return s.freezes >= gap - 1 ? s.current : 0;
}

/** Combine two mega records: earliest catch date, fastest run time. */
function mergeMega(a: MegaEntry | undefined, b: MegaEntry): MegaEntry {
  if (!a) return b;
  const times = [a.bestTime, b.bestTime].filter((t): t is number => t != null);
  return {
    ...a,
    caughtAt: Math.min(a.caughtAt, b.caughtAt),
    bestTime: times.length ? Math.min(...times) : undefined,
  };
}

/** Record a mega evolution earned in Arcade (keeps earliest date + fastest time). */
export function recordMega(profileId: string, data: SaveData, entry: MegaEntry): SaveData {
  const next: SaveData = {
    ...data,
    megas: { ...data.megas, [entry.dex]: mergeMega(data.megas[entry.dex], entry) },
  };
  persistSave(profileId, next);
  return next;
}

/** Unlock a battle early via a passed test. Returns the new save. */
export function recordTestUnlock(profileId: string, data: SaveData, battleId: string): SaveData {
  if (data.testUnlocked.includes(battleId)) return data;
  const next: SaveData = { ...data, testUnlocked: [...data.testUnlocked, battleId] };
  persistSave(profileId, next);
  return next;
}

export function isTestUnlocked(data: SaveData, battleId: string): boolean {
  return data.testUnlocked.includes(battleId);
}

/**
 * Merge two saves. Progress only grows, so this is a conflict-free union:
 * keep every caught Pokémon (earliest catch wins) and every won battle.
 * Used to reconcile local ⇄ cloud saves during sync.
 */
export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const caught: Record<number, CaughtEntry> = { ...a.caught };
  for (const [dex, entry] of Object.entries(b.caught)) {
    const d = Number(dex);
    const existing = caught[d];
    caught[d] = !existing || entry.caughtAt < existing.caughtAt ? entry : existing;
  }
  const megas: Record<number, MegaEntry> = { ...a.megas };
  for (const entry of Object.values(b.megas ?? {})) {
    megas[entry.dex] = mergeMega(megas[entry.dex], entry);
  }
  // Streak: keep the most recent day's current, and the best of both.
  const sa = a.streak ?? EMPTY_STREAK;
  const sb = b.streak ?? EMPTY_STREAK;
  const recent = sb.lastDay > sa.lastDay ? sb : sa;
  const streak: StreakData = {
    current: recent.current,
    best: Math.max(sa.best, sb.best),
    lastDay: recent.lastDay,
    freezes: recent.freezes ?? 0,
  };
  // Stats are monotonic counters; take the higher of each (device that's ahead).
  const sta = a.stats ?? EMPTY_STATS;
  const stb = b.stats ?? EMPTY_STATS;
  const stats: Stats = {
    correct: Math.max(sta.correct, stb.correct),
    wrong: Math.max(sta.wrong, stb.wrong),
    seconds: Math.max(sta.seconds, stb.seconds),
    battlesWon: Math.max(sta.battlesWon, stb.battlesWon),
    arcadeRuns: Math.max(sta.arcadeRuns, stb.arcadeRuns),
    testsPassed: Math.max(sta.testsPassed, stb.testsPassed),
    daysPlayed: Math.max(sta.daysPlayed, stb.daysPlayed),
  };
  return {
    version: 1,
    caught,
    megas,
    wonBattles: Array.from(new Set([...a.wonBattles, ...b.wonBattles])),
    testUnlocked: Array.from(new Set([...a.testUnlocked, ...b.testUnlocked])),
    streak,
    stats,
  };
}

export function hasWon(data: SaveData, battleId: string): boolean {
  return data.wonBattles.includes(battleId);
}

export function caughtCount(data: SaveData): number {
  return Object.keys(data.caught).length;
}

/** Read (and clear) a pre-profiles single save, if one exists, for migration. */
export function takeLegacySave(): SaveData | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  const data = parse(raw);
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  return data;
}
