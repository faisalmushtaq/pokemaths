// =============================================================================
// POKÉMATHS — SAVE DATA (Pokédex + progress)
// =============================================================================
// Persisted to localStorage for now. This module is the single source of truth
// for save/load so a future Firebase sync layer can wrap the same shape.
// =============================================================================

export interface CaughtEntry {
  dex: number;
  name: string;
  region: string;
  caughtAt: number; // epoch ms
}

export interface SaveData {
  version: 1;
  /** keyed by dex number so a Pokémon is only recorded once */
  caught: Record<number, CaughtEntry>;
  /** battle ids that have been won (100% accuracy) */
  wonBattles: string[];
}

const STORAGE_KEY = 'pokemaths.save.v1';

const EMPTY: SaveData = { version: 1, caught: {}, wonBattles: [] };

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      version: 1,
      caught: parsed.caught ?? {},
      wonBattles: parsed.wonBattles ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function persistSave(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full / unavailable — non-fatal
  }
}

/** Record a win + catch. Returns the updated save (immutable). */
export function recordWin(
  data: SaveData,
  battleId: string,
  entry: CaughtEntry,
): SaveData {
  const next: SaveData = {
    version: 1,
    caught: { ...data.caught, [entry.dex]: data.caught[entry.dex] ?? entry },
    wonBattles: data.wonBattles.includes(battleId)
      ? data.wonBattles
      : [...data.wonBattles, battleId],
  };
  persistSave(next);
  return next;
}

export function hasWon(data: SaveData, battleId: string): boolean {
  return data.wonBattles.includes(battleId);
}

export function caughtCount(data: SaveData): number {
  return Object.keys(data.caught).length;
}

export function resetSave(): SaveData {
  const fresh = { ...EMPTY, caught: {}, wonBattles: [] };
  persistSave(fresh);
  return fresh;
}
