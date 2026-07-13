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
  caughtAt: number; // epoch ms
}

export interface StreakData {
  current: number; // consecutive days played
  best: number; // longest streak ever
  lastDay: string; // 'YYYY-MM-DD' (local) of the last counted day
}

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
}

export const EMPTY_STREAK: StreakData = { current: 0, best: 0, lastDay: '' };

const KEY_PREFIX = 'pokemaths.save.';
const LEGACY_KEY = 'pokemaths.save.v1'; // pre-profiles single save

export const EMPTY_SAVE: SaveData = { version: 1, caught: {}, megas: {}, wonBattles: [], testUnlocked: [], streak: { ...EMPTY_STREAK } };

function keyFor(profileId: string): string {
  return `${KEY_PREFIX}${profileId}`;
}

function parse(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE };
  try {
    const p = JSON.parse(raw) as Partial<SaveData>;
    return { version: 1, caught: p.caught ?? {}, megas: p.megas ?? {}, wonBattles: p.wonBattles ?? [], testUnlocked: p.testUnlocked ?? [], streak: { ...EMPTY_STREAK, ...(p.streak ?? {}) } };
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

/**
 * Mark that the player completed something today and update the daily streak.
 * Same day → no change; consecutive day → +1; a gap → reset to 1.
 * Returns the new save (unchanged if already counted today).
 */
export function recordPlay(profileId: string, data: SaveData): SaveData {
  const today = dayStr(new Date());
  const s = data.streak ?? EMPTY_STREAK;
  if (s.lastDay === today) return data; // already counted today
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = dayStr(y);
  const current = s.lastDay === yesterday ? s.current + 1 : 1;
  const streak: StreakData = { current, best: Math.max(s.best, current), lastDay: today };
  const next: SaveData = { ...data, streak };
  persistSave(profileId, next);
  return next;
}

/**
 * A streak is "live" only if the last counted day was today or yesterday;
 * otherwise it has lapsed and should read as 0 (the next play restarts it).
 */
export function liveStreak(data: SaveData): number {
  const s = data.streak ?? EMPTY_STREAK;
  if (!s.lastDay) return 0;
  const today = dayStr(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = dayStr(y);
  return s.lastDay === today || s.lastDay === yesterday ? s.current : 0;
}

/** Record a mega evolution earned in Arcade. Earliest keep wins. Returns the new save. */
export function recordMega(profileId: string, data: SaveData, entry: MegaEntry): SaveData {
  const next: SaveData = {
    ...data,
    megas: { ...data.megas, [entry.dex]: data.megas[entry.dex] ?? entry },
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
  for (const [dex, entry] of Object.entries(b.megas ?? {})) {
    const d = Number(dex);
    const existing = megas[d];
    megas[d] = !existing || entry.caughtAt < existing.caughtAt ? entry : existing;
  }
  // Streak: keep the most recent day's current, and the best of both.
  const sa = a.streak ?? EMPTY_STREAK;
  const sb = b.streak ?? EMPTY_STREAK;
  const recent = sb.lastDay > sa.lastDay ? sb : sa;
  const streak: StreakData = {
    current: recent.current,
    best: Math.max(sa.best, sb.best),
    lastDay: recent.lastDay,
  };
  return {
    version: 1,
    caught,
    megas,
    wonBattles: Array.from(new Set([...a.wonBattles, ...b.wonBattles])),
    testUnlocked: Array.from(new Set([...a.testUnlocked, ...b.testUnlocked])),
    streak,
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
