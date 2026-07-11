// =============================================================================
// POKÉMATHS — ARCADE MODE
// =============================================================================
// Quick pick-up-and-play. Choose a level, then answer a fixed run of questions
// drawn from that level's topics. Wrong answers are allowed (they only affect
// your accuracy) — this is score-attack practice, not catching.
// =============================================================================

import type { TopicId } from './topics';

export interface ArcadeLevel {
  id: string;
  name: string;
  subtitle: string;
  topics: TopicId[];
  questionCount: number;
  accentColor: string;
}

export const ARCADE_LEVELS: ArcadeLevel[] = [
  {
    id: 'starter',
    name: 'Beginner',
    subtitle: 'Counting, adding & subtracting',
    topics: ['counting', 'adding', 'subtracting'],
    questionCount: 12,
    accentColor: '#38bdf8',
  },
  {
    id: 'number-bonds',
    name: 'Number Bonds',
    subtitle: 'Adding & subtracting to 20',
    topics: ['more_adding', 'more_subtracting'],
    questionCount: 15,
    accentColor: '#a78bfa',
  },
  {
    id: 'tables-jr',
    name: 'Times Tables Jr',
    subtitle: '2, 3, 4, 5, 6, 8, 9 & 10',
    topics: ['tables_1_2_5_10', 'tables_3_6_9', 'tables_4_8'],
    questionCount: 15,
    accentColor: '#fb923c',
  },
  {
    id: 'tables-pro',
    name: 'Times Tables Pro',
    subtitle: '7, 11 & 12 times tables',
    topics: ['table_7', 'tables_11_12'],
    questionCount: 15,
    accentColor: '#f472b6',
  },
  {
    id: 'division',
    name: 'Division',
    subtitle: 'Dividing, with & without remainders',
    topics: ['dividing_to_10', 'dividing_remainders'],
    questionCount: 15,
    accentColor: '#22c55e',
  },
  {
    id: 'big-numbers',
    name: 'Big Numbers',
    subtitle: 'Bigger sums & place value',
    topics: ['adding_bigger', 'subtracting_bigger', 'place_value', 'negatives'],
    questionCount: 15,
    accentColor: '#c084fc',
  },
  {
    id: 'fractions-decimals',
    name: 'Fractions & Decimals',
    subtitle: 'Parts, points & percentages',
    topics: ['fractions', 'more_fractions', 'decimals', 'more_decimals', 'percentages_start'],
    questionCount: 15,
    accentColor: '#2dd4bf',
  },
  {
    id: 'brain-buster',
    name: 'Brain Buster',
    subtitle: 'Powers, algebra & sequences',
    topics: ['squares_roots_cubes', 'number_skills', 'algebra_start', 'sequences_patterns', 'ratio_proportion'],
    questionCount: 15,
    accentColor: '#60a5fa',
  },
];

export function getArcadeLevel(id: string): ArcadeLevel | undefined {
  return ARCADE_LEVELS.find((l) => l.id === id);
}
