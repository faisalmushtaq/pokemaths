import { CURRICULUM_BATTLES, CURRICULUM_TOPICS, bossIsFinalMasteryQuestion, bossMasteryTarget, bossRoundForQuestion, curriculumSummary, evaluateBossMastery, getCurriculumBattle } from '../client/src/lib/curriculum';
import { CURRICULUM_REGIONS } from '../client/src/lib/curriculumRegions';
import { curriculumRegionTestId, curriculumTopicTestId, isCurriculumRegionUnlocked, isCurriculumTopicUnlocked } from '../client/src/lib/curriculumProgress';
import { loadSave, recordCurriculumBossAttempt, recordCurriculumWin, recordTestUnlock, type CaughtEntry } from '../client/src/lib/pokedex';

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
assert(CURRICULUM_REGIONS.length === 11, 'The regional curriculum route must retain all 11 named Pokémon regions');
assert(CURRICULUM_REGIONS.flatMap((region) => region.topics).length === 37, 'Every revised topic must appear in a named region');
assert(CURRICULUM_REGIONS.every((region) => region.name !== 'Unidentified'), 'All curriculum regions must use their proper names');
assert(CURRICULUM_TOPICS.every((topic) => topic.boss.bossSpec?.rounds.length === 3), 'Every boss requires Recall, Apply, and Mastery rounds');
assert(CURRICULUM_TOPICS.every((topic) => topic.boss.bossSpec?.rounds.at(-1)?.endQuestion === topic.boss.questionCount), 'Every boss round plan must cover its full encounter');
assert(CURRICULUM_TOPICS.every((topic) => topic.boss.bossSpec?.finalMasteryRequired), 'Every boss must require a correct final Mastery item');
assert(CURRICULUM_TOPICS.every((topic) => bossMasteryTarget(topic.boss) === (topic.boss.questionCount === 10 ? 8 : 10)), 'Boss score targets must use 8/10 or 10/12');

const firstBoss = CURRICULUM_TOPICS[0].boss;
const fluencyBoss = CURRICULUM_TOPICS[5].boss;
const writtenBoss = CURRICULUM_TOPICS[20].boss;
const finalBoss = CURRICULUM_TOPICS[36].boss;
assert(firstBoss.questionCount === 10 && firstBoss.timeLimitSec === 210 && firstBoss.level === 2, 'Topic 1 boss must use the foundation band');
assert(fluencyBoss.questionCount === 12 && fluencyBoss.timeLimitSec === 180 && fluencyBoss.level === 4, 'Topic 6 boss must use the fluency band');
assert(writtenBoss.questionCount === 10 && writtenBoss.timeLimitSec === 300 && writtenBoss.level === 5, 'Topic 21 boss must use the written-method band');
assert(finalBoss.questionCount === 12 && finalBoss.timeLimitSec === 240 && finalBoss.level === 6, 'Topic 37 boss must use the final mastery band');
assert(bossRoundForQuestion(firstBoss, 1)?.id === 'recall', 'A boss must begin with Recall');
assert(bossRoundForQuestion(firstBoss, 4)?.id === 'apply', 'The second boss round must be Apply');
assert(bossRoundForQuestion(firstBoss, 10)?.id === 'mastery' && bossIsFinalMasteryQuestion(firstBoss, 10), 'The final boss item must be the Mastery checkpoint');
assert(evaluateBossMastery(firstBoss, 7, true) === 'score', 'A boss score below target must fail');
assert(evaluateBossMastery(firstBoss, 8, false) === 'final-mastery', 'A correct score without the final Mastery item must fail');
assert(evaluateBossMastery(firstBoss, 8, true) === 'passed', 'A score at target with the final Mastery item must pass');

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
const kanto = CURRICULUM_REGIONS[0];
const johto = CURRICULUM_REGIONS[1];
assert(isCurriculumRegionUnlocked(migrated, kanto), 'Kanto must remain open for every player');
assert(!isCurriculumRegionUnlocked(migrated, johto), 'A later region must begin locked before its entry test or preceding-region completion');
assert(!isCurriculumTopicUnlocked(migrated, johto.topics[0]), 'The opening topic of a locked region must remain gated');
const afterJohtoTest = recordTestUnlock('legacy-test', migrated, curriculumRegionTestId(johto.id));
assert(isCurriculumRegionUnlocked(afterJohtoTest, johto), 'A passed 3/3 regional test must open that region');
assert(isCurriculumTopicUnlocked(afterJohtoTest, johto.topics[0]), 'A passed regional test must open the first topic only');
assert(!isCurriculumTopicUnlocked(afterJohtoTest, johto.topics[1]), 'Later topics in a test-opened region must remain gated before their own test or prerequisite');
const afterJohtoTopicTest = recordTestUnlock('legacy-test', afterJohtoTest, curriculumTopicTestId(johto.topics[1].id));
assert(isCurriculumTopicUnlocked(afterJohtoTopicTest, johto.topics[1]), 'A passed 3/3 topic test must open its selected in-region topic');
assert(!isCurriculumTopicUnlocked(afterJohtoTopicTest, johto.topics[2]), 'A passed topic test must not open later topics in the region');

const legacyBattle = getCurriculumBattle('t01-m01-b01');
const freshBattle = getCurriculumBattle('t01-m01-b02');
assert(legacyBattle?.dex === 1 && freshBattle?.dex === 2, 'Expected deterministic early battle mapping');
const afterLegacyReward = recordCurriculumWin('legacy-test', afterJohtoTopicTest, legacyBattle!, legacyEntry, legacyBattle!.questionCount);
assert(afterLegacyReward.caught[1]?.name === 'Bulbasaur', 'Legacy reward must preserve ownership record');
assert(afterLegacyReward.curriculumV2.masteryTokens === 1, 'Legacy reward must award one mastery token');
assert(afterLegacyReward.curriculumV2.battles[legacyBattle!.id]?.rewardStatus === 'legacy-owned', 'Legacy battle status must be explicit');

const freshEntry: CaughtEntry = { dex: 2, name: 'Ivysaur', region: 'curriculum', caughtAt: 2 };
const afterFreshReward = recordCurriculumWin('legacy-test', afterLegacyReward, freshBattle!, freshEntry, freshBattle!.questionCount);
assert(afterFreshReward.caught[2]?.name === 'Ivysaur', 'New curriculum reward must add the Pokémon to the Pokédex');
assert(!afterFreshReward.curriculumV2.legacyCapturedDex.includes(2), 'New curriculum reward must not be marked as legacy');
assert(afterFreshReward.curriculumV2.battles[freshBattle!.id]?.rewardStatus === 'captured', 'Fresh battle reward must be recorded as captured');

const retryBoss = firstBoss;
const afterBossRetry = recordCurriculumBossAttempt('legacy-test', afterFreshReward, retryBoss, 7, 'score');
assert(!afterBossRetry.curriculumV2.bosses[retryBoss.id], 'A failed boss attempt must not unlock the topic');
assert(afterBossRetry.curriculumV2.bossAttempts[retryBoss.id]?.attempts === 1, 'A failed boss attempt must be retained');
assert(afterBossRetry.curriculumV2.bossAttempts[retryBoss.id]?.bestCorrect === 7, 'A failed boss attempt must retain its best score');
const bossEntry: CaughtEntry = { dex: retryBoss.dex, name: 'Articuno', region: 'curriculum', caughtAt: 3 };
const afterBossWin = recordCurriculumWin('legacy-test', afterBossRetry, retryBoss, bossEntry, bossMasteryTarget(retryBoss));
assert(afterBossWin.curriculumV2.bosses[retryBoss.id]?.attempts === 2, 'A defeated boss must include earlier failed attempts');
assert(afterBossWin.curriculumV2.bosses[retryBoss.id]?.bestCorrect === bossMasteryTarget(retryBoss), 'A defeated boss must retain its best score');

console.log('Curriculum verification passed: 37 topics in 11 named regions, 238 modules, 1,025 unique encounters, regional and in-region topic entry-test gates, progressive boss specifications, and legacy migration preserved.');
