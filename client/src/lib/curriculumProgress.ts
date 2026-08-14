// =============================================================================
// POKÉMATHS — CURRICULUM V2 PROGRESSION
// =============================================================================

import {
  CURRICULUM_TOPICS,
  getCurriculumBattle,
  getCurriculumModule,
  getCurriculumTopic,
  type CurriculumBattle,
  type CurriculumModule,
  type CurriculumTopic,
} from './curriculum';
import { hasCurriculumWin, isTestUnlocked, type SaveData } from './pokedex';
import { CURRICULUM_REGIONS, getCurriculumRegionForTopic, type CurriculumRegion } from './curriculumRegions';

export function isModuleComplete(save: SaveData, module: CurriculumModule): boolean {
  return module.battles.every((battle) => hasCurriculumWin(save, battle.id));
}

export function isTopicComplete(save: SaveData, topic: CurriculumTopic): boolean {
  return Boolean(save.curriculumV2.bosses[topic.boss.id]);
}

/** Stable save key for a passed regional entry test. */
export function curriculumRegionTestId(regionId: string): string {
  return `curriculum-region-${regionId}`;
}

export function hasCurriculumRegionTestPass(save: SaveData, regionId: string): boolean {
  return isTestUnlocked(save, curriculumRegionTestId(regionId));
}

/** Stable save key for a passed in-region topic-entry test. */
export function curriculumTopicTestId(topicId: string): string {
  return `curriculum-topic-${topicId}`;
}

export function hasCurriculumTopicTestPass(save: SaveData, topicId: string): boolean {
  return isTestUnlocked(save, curriculumTopicTestId(topicId));
}

/**
 * The first region is available immediately. Later regions open after completing
 * the preceding region or by a perfect 3/3 entry test at the region's opening level.
 */
export function isCurriculumRegionUnlocked(save: SaveData, region: CurriculumRegion): boolean {
  if (region.order === 1) return true;
  if (hasCurriculumRegionTestPass(save, region.id)) return true;
  const previous = CURRICULUM_REGIONS[region.order - 2];
  return Boolean(previous && previous.topics.every((previousTopic) => isTopicComplete(save, previousTopic)));
}

export function isCurriculumTopicUnlocked(save: SaveData, topic: CurriculumTopic): boolean {
  const region = getCurriculumRegionForTopic(topic.id);
  if (!region || !isCurriculumRegionUnlocked(save, region)) return false;
  if (region.topics[0]?.id === topic.id) return true;
  if (hasCurriculumTopicTestPass(save, topic.id)) return true;
  const previous = CURRICULUM_TOPICS[topic.order - 2];
  return Boolean(previous && isTopicComplete(save, previous));
}

export function isCurriculumModuleUnlocked(save: SaveData, module: CurriculumModule): boolean {
  const topic = getCurriculumTopic(module.topicId);
  if (!topic || !isCurriculumTopicUnlocked(save, topic)) return false;
  if (module.order === 1) return true;
  const previous = topic.modules[module.order - 2];
  return Boolean(previous && isModuleComplete(save, previous));
}

export function isCurriculumBattleUnlocked(save: SaveData, battle: CurriculumBattle): boolean {
  if (battle.isBoss) {
    const topic = getCurriculumTopic(battle.topicId);
    return Boolean(topic && topic.modules.every((module) => isModuleComplete(save, module)));
  }
  const module = battle.moduleId ? getCurriculumModule(battle.moduleId) : undefined;
  if (!module || !isCurriculumModuleUnlocked(save, module)) return false;
  if (battle.order === 1) return true;
  const previous = module.battles[battle.order - 2];
  return Boolean(previous && hasCurriculumWin(save, previous.id));
}

export function moduleCompletionCount(save: SaveData, topic: CurriculumTopic): { complete: number; total: number } {
  return {
    complete: topic.modules.filter((module) => isModuleComplete(save, module)).length,
    total: topic.modules.length,
  };
}

export function topicBattleCompletion(save: SaveData, topic: CurriculumTopic): { complete: number; total: number } {
  const battles = topic.modules.flatMap((module) => module.battles);
  return {
    complete: battles.filter((battle) => hasCurriculumWin(save, battle.id)).length,
    total: battles.length,
  };
}

export function curriculumRegionCompletionCount(save: SaveData, region: CurriculumRegion): { complete: number; total: number } {
  return {
    complete: region.topics.filter((topic) => isTopicComplete(save, topic)).length,
    total: region.topics.length,
  };
}

export function isCurriculumBattleId(battleId: string): boolean {
  return Boolean(getCurriculumBattle(battleId));
}
