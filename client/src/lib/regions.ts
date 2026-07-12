// =============================================================================
// POKÉMATHS — REGIONS & BATTLES (full National Pokédex)
// =============================================================================
// Every Pokémon is catchable. Each region maps to its generation's slice of the
// National Pokédex and to a pool of maths topics. We generate one battle per
// species: a short fixed-difficulty encounter you win at 100% accuracy to catch
// that Pokémon. Difficulty grades slowly from level 1 up to the topic's top
// level across the region, and the last species in each region is a timed boss.
//
// Names are resolved live from PokeAPI (see species.ts) — battles only store the
// dex number here.
// =============================================================================

import { getTopic, type TopicId } from './topics';

export interface Battle {
  id: string; // stable: `${regionId}-${dex}`
  regionId: string;
  dex: number;
  topic: TopicId;
  level: number; // fixed difficulty for this battle
  questionCount: number;
  isBoss?: boolean;
  timeLimitSec?: number;
}

export interface Region {
  id: string;
  name: string;
  gen: string;
  inspiration: string;
  bgGradient: string;
  accentColor: string;
  secret?: boolean;
  dexRange: [number, number];
  topics: TopicId[];
  unlockThreshold: number; // catches needed in this region to open the next
  battles: Battle[];
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

// National-dex numbers of legendary & mythical Pokémon — these become special
// timed boss encounters within their region (in addition to each region's final
// species). Catching them still needs 100% accuracy, but now against the clock.
const LEGENDARY_DEX = new Set<number>([
  // Gen I
  144, 145, 146, 150, 151,
  // Gen II
  243, 244, 245, 249, 250, 251,
  // Gen III
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen IV
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  // Gen V
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
  // Gen VI
  716, 717, 718, 719, 720, 721,
  // Gen VII
  785, 786, 787, 788, 789, 790, 791, 792, 800, 801, 802, 807, 808, 809,
  // Gen VIII
  888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 905,
  // Gen IX (+ DLC)
  1001, 1002, 1003, 1004, 1007, 1008, 1013, 1014, 1015, 1017,
  1020, 1021, 1022, 1023, 1024, 1025,
]);

// Early regions run shorter battles; later regions run longer ones.
const EARLY_REGIONS = new Set(['kanto', 'johto', 'hoenn', 'sinnoh', 'unova']);

interface RegionDef {
  id: string;
  name: string;
  gen: string;
  inspiration: string;
  bgGradient: string;
  accentColor: string;
  secret?: boolean;
  dexRange: [number, number];
  topics: TopicId[];
}

const REGION_DEFS: RegionDef[] = [
  { id: 'kanto', name: 'Kanto', gen: 'Gen I', inspiration: 'Kantō, Japan',
    bgGradient: 'linear-gradient(135deg, #0c1445 0%, #0a2a6e 50%, #0d1b3e 100%)', accentColor: '#38bdf8',
    dexRange: [1, 151], topics: ['counting', 'adding', 'subtracting', 'more_adding'] },
  { id: 'johto', name: 'Johto', gen: 'Gen II', inspiration: 'Kansai, Japan',
    bgGradient: 'linear-gradient(135deg, #2a1a05 0%, #6e4a0a 50%, #2a1a05 100%)', accentColor: '#eab308',
    dexRange: [152, 251], topics: ['more_subtracting', 'tables_1_2_5_10', 'adding_bigger'] },
  { id: 'hoenn', name: 'Hoenn', gen: 'Gen III', inspiration: 'Kyushu, Japan',
    bgGradient: 'linear-gradient(135deg, #05230f 0%, #0a5a2e 50%, #05230f 100%)', accentColor: '#22c55e',
    dexRange: [252, 386], topics: ['tables_3_6_9', 'place_value', 'tables_4_8'] },
  { id: 'sinnoh', name: 'Sinnoh', gen: 'Gen IV', inspiration: 'Hokkaido, Japan',
    bgGradient: 'linear-gradient(135deg, #0a1a2e 0%, #1e3a5f 50%, #0a1a2e 100%)', accentColor: '#7dd3fc',
    dexRange: [387, 493], topics: ['subtracting_bigger', 'tens_hundreds_thousands', 'table_7'] },
  { id: 'unova', name: 'Unova', gen: 'Gen V', inspiration: 'New York, USA',
    bgGradient: 'linear-gradient(135deg, #1a1a1a 0%, #3a2a4a 50%, #1a1a1a 100%)', accentColor: '#c084fc',
    dexRange: [494, 649], topics: ['dividing_to_10', 'dividing_remainders', 'negatives'] },
  { id: 'kalos', name: 'Kalos', gen: 'Gen VI', inspiration: 'France',
    bgGradient: 'linear-gradient(135deg, #2a0a2a 0%, #6e0a5a 50%, #2a0a2a 100%)', accentColor: '#f472b6',
    dexRange: [650, 721], topics: ['mult_div_powers10', 'tables_11_12', 'fractions'] },
  { id: 'alola', name: 'Alola', gen: 'Gen VII', inspiration: 'Hawaii, USA',
    bgGradient: 'linear-gradient(135deg, #05233a 0%, #0a6e6e 50%, #05233a 100%)', accentColor: '#2dd4bf',
    dexRange: [722, 809], topics: ['decimals', 'long_mult_start', 'long_div_start'] },
  { id: 'galar', name: 'Galar', gen: 'Gen VIII', inspiration: 'United Kingdom',
    bgGradient: 'linear-gradient(135deg, #12233a 0%, #2a3a5a 50%, #12233a 100%)', accentColor: '#60a5fa',
    dexRange: [810, 898], topics: ['percentages_start', 'more_decimals', 'more_fractions'] },
  { id: 'paldea', name: 'Paldea', gen: 'Gen IX', inspiration: 'Iberian Peninsula',
    bgGradient: 'linear-gradient(135deg, #3a1505 0%, #8a3a0a 50%, #3a1505 100%)', accentColor: '#fb923c',
    dexRange: [906, 1010], topics: ['percentages_money', 'squares_roots_cubes', 'long_mult_pro', 'long_div_pro'] },
  { id: 'kitakami', name: 'Unidentified', gen: 'Gen IX DLC', inspiration: 'Paradox & mystery',
    bgGradient: 'linear-gradient(135deg, #1a0a2a 0%, #4a1a5a 50%, #1a0a2a 100%)', accentColor: '#a78bfa', secret: true,
    dexRange: [1011, 1025], topics: ['sequences_patterns', 'ratio_proportion', 'estimating'] },
  { id: 'terarium', name: 'Hisui', gen: 'Legends: Arceus', inspiration: 'Ancient Sinnoh',
    bgGradient: 'linear-gradient(135deg, #04121f 0%, #0a3a4a 50%, #04121f 100%)', accentColor: '#38bdf8', secret: true,
    dexRange: [899, 905], topics: ['number_skills', 'fdp', 'ratio_proportion_2', 'algebra_start', 'sequences'] },
];

function buildBattles(def: RegionDef): Battle[] {
  const [start, end] = def.dexRange;
  const count = end - start + 1;
  // 15 questions in early regions, 20 in later ones — this is a long journey.
  const questionCount = EARLY_REGIONS.has(def.id) ? 15 : 20;
  const battles: Battle[] = [];
  for (let i = 0; i < count; i++) {
    const dex = start + i;
    const topic = def.topics[i % def.topics.length];
    const maxLevel = getTopic(topic).maxLevel;
    const level = clamp(1 + Math.floor((i / count) * maxLevel), 1, maxLevel);
    const isBoss = LEGENDARY_DEX.has(dex) || i === count - 1;
    battles.push({
      id: `${def.id}-${dex}`,
      regionId: def.id,
      dex,
      topic,
      level,
      questionCount,
      // Bosses are timed — roughly 12 seconds per question.
      ...(isBoss ? { isBoss: true, timeLimitSec: questionCount * 12 } : {}),
    });
  }
  return battles;
}

export const REGIONS: Region[] = REGION_DEFS.map((def) => {
  const size = def.dexRange[1] - def.dexRange[0] + 1;
  return {
    ...def,
    unlockThreshold: Math.min(8, size), // catches needed to open the next region
    battles: buildBattles(def),
  };
});

// ---------------------------------------------------------------------------
// lookups
// ---------------------------------------------------------------------------
export const MAINLINE_REGIONS = REGIONS.filter((rg) => !rg.secret);
export const SECRET_REGIONS = REGIONS.filter((rg) => rg.secret);
export const ALL_BATTLES: Battle[] = REGIONS.flatMap((rg) => rg.battles);

const BATTLE_INDEX = new Map<string, { region: Region; battle: Battle }>();
for (const region of REGIONS) {
  for (const battle of region.battles) BATTLE_INDEX.set(battle.id, { region, battle });
}

export function getRegion(id: string): Region | undefined {
  return REGIONS.find((rg) => rg.id === id);
}

export function findBattle(battleId: string): { region: Region; battle: Battle } | undefined {
  return BATTLE_INDEX.get(battleId);
}

const DEX_INDEX = new Map<number, { region: Region; battle: Battle }>();
for (const region of REGIONS) {
  for (const battle of region.battles) DEX_INDEX.set(battle.dex, { region, battle });
}

export function findBattleByDex(dex: number): { region: Region; battle: Battle } | undefined {
  return DEX_INDEX.get(dex);
}
