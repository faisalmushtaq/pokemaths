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
}

const KEY_PREFIX = 'pokemaths.save.';
const LEGACY_KEY = 'pokemaths.save.v1'; // pre-profiles single save

export const EMPTY_SAVE: SaveData = { version: 1, caught: {}, megas: {}, wonBattles: [], testUnlocked: [] };

function keyFor(profileId: string): string {
  return `${KEY_PREFIX}${profileId}`;
}

function parse(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE };
  try {
    const p = JSON.parse(raw) as Partial<SaveData>;
    return { version: 1, caught: p.caught ?? {}, megas: p.megas ?? {}, wonBattles: p.wonBattles ?? [], testUnlocked: p.testUnlocked ?? [] };
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
  return {
    version: 1,
    caught,
    megas,
    wonBattles: Array.from(new Set([...a.wonBattles, ...b.wonBattles])),
    testUnlocked: Array.from(new Set([...a.testUnlocked, ...b.testUnlocked])),
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
