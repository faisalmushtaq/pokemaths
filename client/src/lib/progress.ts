// =============================================================================
// POKÉMATHS — UNLOCK / PROGRESS RULES
// =============================================================================
// Pure functions describing what is unlocked given the player's save data.
//  - Battles unlock sequentially within a region.
//  - A mainline region unlocks when the previous mainline region is fully won.
//  - Secret regions unlock once every mainline battle is won.
// =============================================================================

import { MAINLINE_REGIONS, REGIONS, type Region } from './regions';
import { hasWon, type SaveData } from './pokedex';

export function regionComplete(save: SaveData, region: Region): boolean {
  return region.battles.every((b) => hasWon(save, b.id));
}

export function mainlineComplete(save: SaveData): boolean {
  return MAINLINE_REGIONS.every((rg) => regionComplete(save, rg));
}

export function isRegionUnlocked(save: SaveData, region: Region): boolean {
  if (region.secret) return mainlineComplete(save);
  const idx = MAINLINE_REGIONS.findIndex((rg) => rg.id === region.id);
  if (idx <= 0) return true; // first region always open
  return regionComplete(save, MAINLINE_REGIONS[idx - 1]);
}

export function isBattleUnlocked(
  save: SaveData,
  region: Region,
  battleIndex: number,
): boolean {
  if (!isRegionUnlocked(save, region)) return false;
  if (battleIndex <= 0) return true;
  return hasWon(save, region.battles[battleIndex - 1].id);
}

/** dex numbers of every catchable Pokémon, for Pokédex completion stats */
export function totalCatchable(): number {
  return REGIONS.reduce((n, rg) => n + rg.battles.length, 0);
}
