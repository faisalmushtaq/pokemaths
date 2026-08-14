// =============================================================================
// POKÉMATHS — REGIONAL CURRICULUM ROUTE
// =============================================================================
// The revised 37-topic curriculum keeps the established Pokémon journey intact.
// Each named region contains its mapped topics and can be reached either through
// normal preceding-region completion or by passing its three-question entry test.

import { CURRICULUM_TOPICS, getCurriculumTopic, type CurriculumTopic } from './curriculum';
import { REGIONS, type Region } from './regions';
import { getTopic } from './topics';

export interface CurriculumRegion {
  id: string;
  name: string;
  gen: string;
  inspiration: string;
  bgGradient: string;
  accentColor: string;
  dexRange: [number, number];
  order: number;
  topics: CurriculumTopic[];
  entryLevel: number;
}

/**
 * Region entry tests rise gradually from Level 2 to Level 6. The first region
 * remains immediately available, while later regions offer a 3/3 bypass test.
 */
function entryLevelFor(regionOrder: number, openingTopic: CurriculumTopic): number {
  const proposed = Math.max(2, Math.ceil((regionOrder + 1) / 2));
  return Math.min(getTopic(openingTopic.mathTopicId).maxLevel, proposed);
}

function buildCurriculumRegion(region: Region, order: number): CurriculumRegion {
  const topics = region.topics
    .map((mathTopicId) => CURRICULUM_TOPICS.find((topic) => topic.mathTopicId === mathTopicId))
    .filter((topic): topic is CurriculumTopic => Boolean(topic));
  if (topics.length === 0) throw new Error(`Curriculum region ${region.id} has no topics`);
  return {
    id: region.id,
    name: region.name,
    gen: region.gen,
    inspiration: region.inspiration,
    bgGradient: region.bgGradient,
    accentColor: region.accentColor,
    dexRange: region.dexRange,
    order,
    topics,
    entryLevel: entryLevelFor(order, topics[0]),
  };
}

/** All 37 curriculum topics, in their existing named Pokémon region route. */
export const CURRICULUM_REGIONS: CurriculumRegion[] = REGIONS
  .filter((region) => region.topics.length > 0)
  .map((region, index) => buildCurriculumRegion(region, index + 1));

export function getCurriculumRegion(regionId: string): CurriculumRegion | undefined {
  return CURRICULUM_REGIONS.find((region) => region.id === regionId);
}

export function getCurriculumRegionForTopic(topicId: string): CurriculumRegion | undefined {
  return CURRICULUM_REGIONS.find((region) => region.topics.some((topic) => topic.id === topicId));
}

export function curriculumRegionForTopic(topicId: string): CurriculumRegion | undefined {
  const topic = getCurriculumTopic(topicId);
  return topic ? getCurriculumRegionForTopic(topic.id) : undefined;
}

export function regionTopicProgressLabel(region: CurriculumRegion): string {
  return `${region.topics.length} TOPIC${region.topics.length === 1 ? '' : 'S'}`;
}
