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
import { hasCurriculumWin, type SaveData } from './pokedex';

export function isModuleComplete(save: SaveData, module: CurriculumModule): boolean {
  return module.battles.every((battle) => hasCurriculumWin(save, battle.id));
}

export function isTopicComplete(save: SaveData, topic: CurriculumTopic): boolean {
  return Boolean(save.curriculumV2.bosses[topic.boss.id]);
}

export function isCurriculumTopicUnlocked(save: SaveData, topic: CurriculumTopic): boolean {
  if (topic.order === 1) return true;
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

export function isCurriculumBattleId(battleId: string): boolean {
  return Boolean(getCurriculumBattle(battleId));
}
