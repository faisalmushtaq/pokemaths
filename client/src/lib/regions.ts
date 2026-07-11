// =============================================================================
// POKÉMATHS — REGIONS & BATTLES
// =============================================================================
// 11 regions, each a themed difficulty band. A region contains several battles.
// Each battle = one maths topic + one region-native Pokémon you catch at 100%
// accuracy. The final battle of each region is a timed legendary "boss".
//
// Regions 10 (Kitakami) and 11 (Terarium) are SECRET — unlocked only after the
// nine mainline regions are cleared.
// =============================================================================

import type { TopicId } from './topics';

export interface Battle {
  id: string; // unique, stable id e.g. "kanto-1"
  topic: TopicId;
  /** National Pokédex number — used for the PokeAPI sprite. */
  dex: number;
  pokemon: string; // display name
  questionCount: number;
  isBoss?: boolean;
  /** Seconds allowed for the whole boss battle (only bosses are timed). */
  timeLimitSec?: number;
}

export interface Region {
  id: string;
  name: string;
  gen: string;
  inspiration: string;
  bgGradient: string;
  accentColor: string;
  secret?: boolean; // unlock only after mainline regions complete
  battles: Battle[];
}

// Small helper to keep the data below terse and consistent.
const battle = (
  id: string,
  topic: TopicId,
  dex: number,
  pokemon: string,
  questionCount: number,
  boss?: { timeLimitSec: number },
): Battle => ({
  id,
  topic,
  dex,
  pokemon,
  questionCount,
  ...(boss ? { isBoss: true, timeLimitSec: boss.timeLimitSec } : {}),
});

export const REGIONS: Region[] = [
  // 1 — KANTO (Gen I) — Explorer band: counting & adding/subtracting
  {
    id: 'kanto',
    name: 'Kanto',
    gen: 'Gen I',
    inspiration: 'Kantō, Japan',
    bgGradient: 'linear-gradient(135deg, #0c1445 0%, #0a2a6e 50%, #0d1b3e 100%)',
    accentColor: '#38bdf8',
    battles: [
      battle('kanto-1', 'counting', 1, 'Bulbasaur', 8),
      battle('kanto-2', 'adding', 4, 'Charmander', 8),
      battle('kanto-3', 'subtracting', 7, 'Squirtle', 8),
      battle('kanto-4', 'more_adding', 150, 'Mewtwo', 10, { timeLimitSec: 60 }),
    ],
  },
  // 2 — JOHTO (Gen II)
  {
    id: 'johto',
    name: 'Johto',
    gen: 'Gen II',
    inspiration: 'Kansai, Japan',
    bgGradient: 'linear-gradient(135deg, #2a1a05 0%, #6e4a0a 50%, #2a1a05 100%)',
    accentColor: '#eab308',
    battles: [
      battle('johto-1', 'more_subtracting', 152, 'Chikorita', 8),
      battle('johto-2', 'tables_1_2_5_10', 155, 'Cyndaquil', 10),
      battle('johto-3', 'adding_bigger', 250, 'Ho-Oh', 10, { timeLimitSec: 70 }),
    ],
  },
  // 3 — HOENN (Gen III) — Adventurer band
  {
    id: 'hoenn',
    name: 'Hoenn',
    gen: 'Gen III',
    inspiration: 'Kyushu, Japan',
    bgGradient: 'linear-gradient(135deg, #05230f 0%, #0a5a2e 50%, #05230f 100%)',
    accentColor: '#22c55e',
    battles: [
      battle('hoenn-1', 'tables_3_6_9', 252, 'Treecko', 10),
      battle('hoenn-2', 'place_value', 258, 'Mudkip', 8),
      battle('hoenn-3', 'tables_4_8', 384, 'Rayquaza', 12, { timeLimitSec: 80 }),
    ],
  },
  // 4 — SINNOH (Gen IV)
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    gen: 'Gen IV',
    inspiration: 'Hokkaido, Japan',
    bgGradient: 'linear-gradient(135deg, #0a1a2e 0%, #1e3a5f 50%, #0a1a2e 100%)',
    accentColor: '#7dd3fc',
    battles: [
      battle('sinnoh-1', 'subtracting_bigger', 387, 'Turtwig', 8),
      battle('sinnoh-2', 'tens_hundreds_thousands', 390, 'Chimchar', 8),
      battle('sinnoh-3', 'table_7', 483, 'Dialga', 12, { timeLimitSec: 80 }),
    ],
  },
  // 5 — UNOVA (Gen V) — Pioneer band: division & negatives
  {
    id: 'unova',
    name: 'Unova',
    gen: 'Gen V',
    inspiration: 'New York, USA',
    bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #3a2a4a 50%, #1a1a1a 100%)',
    accentColor: '#c084fc',
    battles: [
      battle('unova-1', 'dividing_to_10', 495, 'Snivy', 10),
      battle('unova-2', 'dividing_remainders', 498, 'Tepig', 8),
      battle('unova-3', 'negatives', 643, 'Reshiram', 12, { timeLimitSec: 80 }),
    ],
  },
  // 6 — KALOS (Gen VI)
  {
    id: 'kalos',
    name: 'Kalos',
    gen: 'Gen VI',
    inspiration: 'France',
    bgGradient: 'linear-gradient(135deg, #2a0a2a 0%, #6e0a5a 50%, #2a0a2a 100%)',
    accentColor: '#f472b6',
    battles: [
      battle('kalos-1', 'mult_div_powers10', 650, 'Chespin', 10),
      battle('kalos-2', 'tables_11_12', 653, 'Fennekin', 10),
      battle('kalos-3', 'fractions', 716, 'Xerneas', 12, { timeLimitSec: 90 }),
    ],
  },
  // 7 — ALOLA (Gen VII)
  {
    id: 'alola',
    name: 'Alola',
    gen: 'Gen VII',
    inspiration: 'Hawaii, USA',
    bgGradient: 'linear-gradient(135deg, #05233a 0%, #0a6e6e 50%, #05233a 100%)',
    accentColor: '#2dd4bf',
    battles: [
      battle('alola-1', 'decimals', 722, 'Rowlet', 10),
      battle('alola-2', 'long_mult_start', 725, 'Litten', 8),
      battle('alola-3', 'long_div_start', 791, 'Solgaleo', 12, { timeLimitSec: 90 }),
    ],
  },
  // 8 — GALAR (Gen VIII)
  {
    id: 'galar',
    name: 'Galar',
    gen: 'Gen VIII',
    inspiration: 'United Kingdom',
    bgGradient: 'linear-gradient(135deg, #12233a 0%, #2a3a5a 50%, #12233a 100%)',
    accentColor: '#60a5fa',
    battles: [
      battle('galar-1', 'percentages_start', 810, 'Grookey', 10),
      battle('galar-2', 'more_decimals', 813, 'Scorbunny', 8),
      battle('galar-3', 'more_fractions', 888, 'Zacian', 12, { timeLimitSec: 90 }),
    ],
  },
  // 9 — PALDEA (Gen IX) — Discoverer band
  {
    id: 'paldea',
    name: 'Paldea',
    gen: 'Gen IX',
    inspiration: 'Iberian Peninsula',
    bgGradient: 'linear-gradient(135deg, #3a1505 0%, #8a3a0a 50%, #3a1505 100%)',
    accentColor: '#fb923c',
    battles: [
      battle('paldea-1', 'percentages_money', 906, 'Sprigatito', 10),
      battle('paldea-2', 'squares_roots_cubes', 909, 'Fuecoco', 10),
      battle('paldea-3', 'long_mult_pro', 912, 'Quaxly', 8),
      battle('paldea-4', 'long_div_pro', 1007, 'Koraidon', 14, { timeLimitSec: 100 }),
    ],
  },
  // 10 — KITAKAMI (Gen IX DLC) — SECRET
  {
    id: 'kitakami',
    name: 'Kitakami',
    gen: 'Gen IX DLC',
    inspiration: 'Tōhoku, Japan',
    bgGradient: 'linear-gradient(135deg, #1a0a2a 0%, #4a1a5a 50%, #1a0a2a 100%)',
    accentColor: '#a78bfa',
    secret: true,
    battles: [
      battle('kitakami-1', 'sequences_patterns', 1011, 'Dipplin', 10),
      battle('kitakami-2', 'ratio_proportion', 1012, 'Poltchageist', 10),
      battle('kitakami-3', 'estimating', 1017, 'Ogerpon', 14, { timeLimitSec: 100 }),
    ],
  },
  // 11 — TERARIUM (Gen IX DLC) — SECRET
  {
    id: 'terarium',
    name: 'Terarium',
    gen: 'Gen IX DLC',
    inspiration: 'Blueberry Academy',
    bgGradient: 'linear-gradient(135deg, #04121f 0%, #0a3a4a 50%, #04121f 100%)',
    accentColor: '#38bdf8',
    secret: true,
    battles: [
      battle('terarium-1', 'number_skills', 998, 'Baxcalibur', 10),
      battle('terarium-2', 'fdp', 1000, 'Gholdengo', 10),
      battle('terarium-3', 'ratio_proportion_2', 987, 'Flutter Mane', 10),
      battle('terarium-4', 'algebra_start', 1004, 'Chi-Yu', 12),
      battle('terarium-5', 'sequences', 1024, 'Terapagos', 16, { timeLimitSec: 120 }),
    ],
  },
];

// ---------------------------------------------------------------------------
// lookups
// ---------------------------------------------------------------------------
export const MAINLINE_REGIONS = REGIONS.filter((rg) => !rg.secret);
export const SECRET_REGIONS = REGIONS.filter((rg) => rg.secret);

export function getRegion(id: string): Region | undefined {
  return REGIONS.find((rg) => rg.id === id);
}

export function findBattle(battleId: string): { region: Region; battle: Battle } | undefined {
  for (const region of REGIONS) {
    const b = region.battles.find((x) => x.id === battleId);
    if (b) return { region, battle: b };
  }
  return undefined;
}

/** Every catchable Pokémon in dex order — the full Pokédex target list. */
export const ALL_BATTLES: Battle[] = REGIONS.flatMap((rg) => rg.battles);
