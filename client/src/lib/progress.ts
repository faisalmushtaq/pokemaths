// =============================================================================
// POKÉMATHS — UNLOCK / PROGRESS RULES
// =============================================================================
// With every Pokémon catchable, a region can hold 150+ battles — so you don't
// have to catch them all to move on:
//  - Battles unlock sequentially within a region (catch #1 to reach #2, …).
//  - A mainline region opens once the previous region reaches its catch
//    threshold (a handful of Pokémon), not 100%.
//  - Secret regions open once every mainline region has hit its threshold.
// You can always return to a region to complete its dex.
// =============================================================================

import { MAINLINE_REGIONS, REGIONS, type Region } from './regions';
import { hasWon, type SaveData } from './pokedex';

export function caughtInRegion(save: SaveData, region: Region): number {
  return region.battles.reduce((n, b) => n + (hasWon(save, b.id) ? 1 : 0), 0);
}

export function regionComplete(save: SaveData, region: Region): boolean {
  return region.battles.every((b) => hasWon(save, b.id));
}

export function regionThresholdMet(save: SaveData, region: Region): boolean {
  return caughtInRegion(save, region) >= region.unlockThreshold;
}

export function mainlineThresholdsMet(save: SaveData): boolean {
  return MAINLINE_REGIONS.every((rg) => regionThresholdMet(save, rg));
}

export function isRegionUnlocked(save: SaveData, region: Region): boolean {
  if (region.secret) return mainlineThresholdsMet(save);
  const idx = MAINLINE_REGIONS.findIndex((rg) => rg.id === region.id);
  if (idx <= 0) return true;
  return regionThresholdMet(save, MAINLINE_REGIONS[idx - 1]);
}

export function isBattleUnlocked(save: SaveData, region: Region, battleIndex: number): boolean {
  if (!isRegionUnlocked(save, region)) return false;
  if (battleIndex <= 0) return true;
  return hasWon(save, region.battles[battleIndex - 1].id);
}

/** total catchable Pokémon across all regions (the full dex) */
export function totalCatchable(): number {
  return REGIONS.reduce((n, rg) => n + rg.battles.length, 0);
}
