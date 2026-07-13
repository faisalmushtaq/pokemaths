// =============================================================================
// POKÉMATHS — MEGA EVOLUTIONS (Arcade)
// =============================================================================
// A curated set of Mega-capable Pokémon. In Arcade you pick one and a question
// count; a 24-question run mega-evolves it at the results screen. Mega sprites
// use PokeAPI's alternate-form ids (10033+); anything missing falls back to the
// base Pokémon's artwork.
// =============================================================================

export interface Mega {
  dex: number; // base National Dex number
  formId: number; // PokeAPI form id for the mega sprite
  name: string; // mega display name
}

export const MEGAS: Mega[] = [
  { dex: 3, formId: 10033, name: 'Mega Venusaur' },
  { dex: 6, formId: 10034, name: 'Mega Charizard X' },
  { dex: 9, formId: 10036, name: 'Mega Blastoise' },
  { dex: 65, formId: 10037, name: 'Mega Alakazam' },
  { dex: 94, formId: 10038, name: 'Mega Gengar' },
  { dex: 115, formId: 10039, name: 'Mega Kangaskhan' },
  { dex: 127, formId: 10040, name: 'Mega Pinsir' },
  { dex: 130, formId: 10041, name: 'Mega Gyarados' },
  { dex: 142, formId: 10042, name: 'Mega Aerodactyl' },
  { dex: 150, formId: 10043, name: 'Mega Mewtwo X' },
  { dex: 181, formId: 10045, name: 'Mega Ampharos' },
  { dex: 212, formId: 10046, name: 'Mega Scizor' },
  { dex: 214, formId: 10047, name: 'Mega Heracross' },
  { dex: 229, formId: 10048, name: 'Mega Houndoom' },
  { dex: 248, formId: 10049, name: 'Mega Tyranitar' },
  { dex: 257, formId: 10050, name: 'Mega Blaziken' },
  { dex: 282, formId: 10051, name: 'Mega Gardevoir' },
  { dex: 306, formId: 10053, name: 'Mega Aggron' },
  { dex: 359, formId: 10057, name: 'Mega Absol' },
  { dex: 445, formId: 10058, name: 'Mega Garchomp' },
  { dex: 448, formId: 10059, name: 'Mega Lucario' },
];

export function getMega(dex: number): Mega | undefined {
  return MEGAS.find((m) => m.dex === dex);
}

/** Selectable arcade question counts — 24 is the max and triggers Mega. */
export const ARCADE_COUNTS = [6, 12, 18, 24];
export const MEGA_COUNT = 24;
