import { CURRICULUM_BATTLES, CURRICULUM_TOPICS, curriculumSummary, getCurriculumBattle } from '../client/src/lib/curriculum';
import { loadSave, recordCurriculumWin, type CaughtEntry } from '../client/src/lib/pokedex';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  get length() { return store.size; },
  clear: () => store.clear(),
  getItem: (key: string) => store.get(key) ?? null,
  key: (index: number) => Array.from(store.keys())[index] ?? null,
  removeItem: (key: string) => { store.delete(key); },
  setItem: (key: string, value: string) => { store.set(key, String(value)); },
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const summary = curriculumSummary();
assert(summary.topics === 37, `Expected 37 topics, received ${summary.topics}`);
assert(summary.modules === 238, `Expected 238 revised modules, received ${summary.modules}`);
assert(summary.battles === 1025, `Expected 1,025 encounters, received ${summary.battles}`);
assert(summary.bosses === 37, `Expected 37 bosses, received ${summary.bosses}`);
assert(new Set(CURRICULUM_BATTLES.map((battle) => battle.dex)).size === 1025, 'Every Pokédex number must be assigned once');
assert(new Set(CURRICULUM_BATTLES.map((battle) => battle.id)).size === 1025, 'Every curriculum battle id must be unique');
assert(CURRICULUM_TOPICS.every((topic) => topic.boss.isBoss), 'Every topic requires a boss');

const legacyEntry: CaughtEntry = { dex: 1, name: 'Bulbasaur', region: 'kanto', caughtAt: 1 };
store.set('pokemaths.save.legacy-test', JSON.stringify({
  version: 1,
  caught: { 1: legacyEntry },
  megas: {},
  wonBattles: ['kanto-1'],
  testUnlocked: [],
  streak: {},
  stats: {},
}));

const migrated = loadSave('legacy-test');
assert(migrated.version === 2, 'V1 save must migrate to V2');
assert(migrated.caught[1]?.name === 'Bulbasaur', 'Migration must preserve an existing capture');
assert(migrated.curriculumV2.legacyCapturedDex.includes(1), 'Existing capture must be recorded as legacy ownership');

const legacyBattle = getCurriculumBattle('t01-m01-b01');
const freshBattle = getCurriculumBattle('t01-m01-b02');
assert(legacyBattle?.dex === 1 && freshBattle?.dex === 2, 'Expected deterministic early battle mapping');
const afterLegacyReward = recordCurriculumWin('legacy-test', migrated, legacyBattle!, legacyEntry, legacyBattle!.questionCount);
assert(afterLegacyReward.caught[1]?.name === 'Bulbasaur', 'Legacy reward must preserve ownership record');
assert(afterLegacyReward.curriculumV2.masteryTokens === 1, 'Legacy reward must award one mastery token');
assert(afterLegacyReward.curriculumV2.battles[legacyBattle!.id]?.rewardStatus === 'legacy-owned', 'Legacy battle status must be explicit');

const freshEntry: CaughtEntry = { dex: 2, name: 'Ivysaur', region: 'curriculum', caughtAt: 2 };
const afterFreshReward = recordCurriculumWin('legacy-test', afterLegacyReward, freshBattle!, freshEntry, freshBattle!.questionCount);
assert(afterFreshReward.caught[2]?.name === 'Ivysaur', 'New curriculum reward must add the Pokémon to the Pokédex');
assert(!afterFreshReward.curriculumV2.legacyCapturedDex.includes(2), 'New curriculum reward must not be marked as legacy');
assert(afterFreshReward.curriculumV2.battles[freshBattle!.id]?.rewardStatus === 'captured', 'Fresh battle reward must be recorded as captured');

console.log('Curriculum verification passed: 37 topics, 238 modules, 1,025 unique encounters, and legacy migration preserved.');
