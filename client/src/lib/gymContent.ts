import { CURRICULUM_TOPICS, type CurriculumTopic } from './curriculum';
import { getCurriculumRegionForTopic } from './curriculumRegions';

export type GymEngineId =
  | 'quantity'
  | 'combine'
  | 'takeAway'
  | 'placeValue'
  | 'groups'
  | 'division'
  | 'numberLine'
  | 'fraction'
  | 'decimal'
  | 'percentage'
  | 'column'
  | 'ratio'
  | 'pattern'
  | 'function';

export interface GymProfile {
  room: string;
  engine: GymEngineId;
  objective: string;
  buildLabel: string;
  connectLabel: string;
  explainLabel: string;
  values: number[];
  accent: string;
}

export interface GymTopicConfig extends GymProfile {
  topic: CurriculumTopic;
  regionId: string;
  regionName: string;
  stationId: string;
}

const PROFILES: Record<string, GymProfile> = {
  counting: { room: 'Number Trail', engine: 'quantity', objective: 'Build quantities, compare them, and locate their positions on a number line.', buildLabel: 'Build quantities', connectLabel: 'Compare and order', explainLabel: 'Locate on a trail', values: [6, 8, 14], accent: '#34d399' },
  adding: { room: 'Combine Lab', engine: 'combine', objective: 'Join parts, make tens, and explain how two quantities become one total.', buildLabel: 'Join the parts', connectLabel: 'Make a ten', explainLabel: 'Choose a strategy', values: [7, 3, 12], accent: '#facc15' },
  subtracting: { room: 'Take-away Lab', engine: 'takeAway', objective: 'Remove, compare, and use inverse relationships to find a missing part.', buildLabel: 'Remove counters', connectLabel: 'Find the difference', explainLabel: 'Check with a fact family', values: [10, 4, 17], accent: '#fb7185' },
  more_adding: { room: 'Bridge Workshop', engine: 'placeValue', objective: 'Use tens and ones to bridge across a ten and make addition structure visible.', buildLabel: 'Build tens and ones', connectLabel: 'Exchange across ten', explainLabel: 'Check the total', values: [18, 7, 42], accent: '#38bdf8' },
  more_subtracting: { room: 'Exchange Workshop', engine: 'takeAway', objective: 'Unbundle tens, count back, and check larger subtraction by rebuilding the difference.', buildLabel: 'Unbundle a ten', connectLabel: 'Count back', explainLabel: 'Check by adding', values: [32, 7, 54], accent: '#f97316' },
  tables_1_2_5_10: { room: 'Array Dojo', engine: 'groups', objective: 'Build equal groups and connect arrays with the 1, 2, 5, and 10 times tables.', buildLabel: 'Build equal groups', connectLabel: 'Match an array', explainLabel: 'Read the table fact', values: [2, 5, 10], accent: '#eab308' },
  adding_bigger: { room: 'Column Clinic', engine: 'column', objective: 'Align tens and ones, combine larger addends, and choose a checking strategy.', buildLabel: 'Align addends', connectLabel: 'Combine columns', explainLabel: 'Estimate then check', values: [46, 28, 135], accent: '#f59e0b' },
  tables_3_6_9: { room: 'Triple Array Arena', engine: 'groups', objective: 'Partition arrays and use links among the 3, 6, and 9 times tables.', buildLabel: 'Build triple groups', connectLabel: 'Double a 3-array', explainLabel: 'Trace a 9 pattern', values: [3, 6, 9], accent: '#22c55e' },
  place_value: { room: 'Place-value Vault', engine: 'placeValue', objective: 'Place digits in units, tens, hundreds, and thousands and explain their values.', buildLabel: 'Place digit cards', connectLabel: 'Trade a place', explainLabel: 'Round on a line', values: [4, 36, 428], accent: '#38bdf8' },
  tables_4_8: { room: 'Doubling Arena', engine: 'groups', objective: 'Use repeated doubling to connect 2, 4, and 8 times-table facts.', buildLabel: 'Build a 4-array', connectLabel: 'Double to eight', explainLabel: 'Sort related facts', values: [2, 4, 8], accent: '#4ade80' },
  subtracting_bigger: { room: 'Column Exchange Lab', engine: 'column', objective: 'Regroup base-ten quantities and check larger subtraction through addition.', buildLabel: 'Regroup a column', connectLabel: 'Subtract by place', explainLabel: 'Check with addition', values: [73, 28, 402], accent: '#7dd3fc' },
  tens_hundreds_thousands: { room: 'Scaling Elevator', engine: 'placeValue', objective: 'Move values through tens, hundreds, and thousands by scaling place value.', buildLabel: 'Move digit cards', connectLabel: 'Scale by ten', explainLabel: 'Choose a scale change', values: [10, 100, 1000], accent: '#60a5fa' },
  table_7: { room: 'Seven-step Array Trail', engine: 'groups', objective: 'Arrange seven groups, compare related facts, and connect multiplication with division.', buildLabel: 'Arrange sevens', connectLabel: 'Build a 7-array', explainLabel: 'Use an inverse fact', values: [7, 14, 49], accent: '#a5b4fc' },
  dividing_to_10: { room: 'Sharing Bench', engine: 'division', objective: 'Share a whole into equal groups and distinguish group size from number of groups.', buildLabel: 'Share equally', connectLabel: 'Choose the divisor', explainLabel: 'Complete the fact family', values: [12, 20, 30], accent: '#c084fc' },
  dividing_remainders: { room: 'Remainder Dock', engine: 'division', objective: 'Distribute objects fairly, isolate leftovers, and interpret remainders in context.', buildLabel: 'Distribute objects', connectLabel: 'Keep leftovers', explainLabel: 'Write quotient and remainder', values: [13, 17, 29], accent: '#d8b4fe' },
  negatives: { room: 'Temperature Trail', engine: 'numberLine', objective: 'Move through zero, compare directed values, and explain steps on an integer line.', buildLabel: 'Place integer tiles', connectLabel: 'Cross zero', explainLabel: 'Read a temperature change', values: [-6, -2, 5], accent: '#8b5cf6' },
  mult_div_powers10: { room: 'Place-value Conveyor', engine: 'placeValue', objective: 'Shift digits through place value to multiply and divide by 10, 100, and 1,000.', buildLabel: 'Shift digit cards', connectLabel: 'Compare scale changes', explainLabel: 'Choose × or ÷', values: [34, 340, 3.4], accent: '#f472b6' },
  tables_11_12: { room: 'Table Lattice', engine: 'groups', objective: 'Build strips and arrays to connect eleven and twelve times-table structures.', buildLabel: 'Build a lattice', connectLabel: 'Match a strip', explainLabel: 'Use a division link', values: [11, 12, 132], accent: '#f9a8d4' },
  fractions: { room: 'Fraction Forge', engine: 'fraction', objective: 'Partition equal wholes, match fraction forms, and locate fractions on a line.', buildLabel: 'Split equal parts', connectLabel: 'Match a fraction', explainLabel: 'Locate a value', values: [2, 4, 5], accent: '#ec4899' },
  decimals: { room: 'Decimal Lagoon', engine: 'decimal', objective: 'Build decimal place value and link tenths and hundredths to fractions and lines.', buildLabel: 'Place decimal digits', connectLabel: 'Shade a grid', explainLabel: 'Move on a line', values: [0.4, 1.25, 3.07], accent: '#2dd4bf' },
  long_mult_start: { room: 'Partial-product Studio', engine: 'column', objective: 'Partition multiplication into partial products and align the place-value shifts.', buildLabel: 'Partition an array', connectLabel: 'Align partial products', explainLabel: 'Check with an estimate', values: [24, 3, 72], accent: '#14b8a6' },
  long_div_start: { room: 'Chunking Cove', engine: 'division', objective: 'Remove manageable chunks from a dividend and build a quotient step by step.', buildLabel: 'Remove a chunk', connectLabel: 'Build a quotient', explainLabel: 'Check by multiplying', values: [84, 4, 21], accent: '#5eead4' },
  percentages_start: { room: 'Hundred-grid Gallery', engine: 'percentage', objective: 'Link a hundred grid with decimal, fraction, and percentage representations.', buildLabel: 'Shade a hundred grid', connectLabel: 'Match equivalent forms', explainLabel: 'Read a percentage', values: [25, 50, 75], accent: '#60a5fa' },
  more_decimals: { room: 'Money Bench', engine: 'decimal', objective: 'Align decimals, compare money values, and choose rounding that fits the context.', buildLabel: 'Align price cards', connectLabel: 'Combine money', explainLabel: 'Set a rounding point', values: [1.25, 3.6, 12.75], accent: '#93c5fd' },
  more_fractions: { room: 'Common-denominator Workshop', engine: 'fraction', objective: 'Build equivalent fractions, compare denominators, and combine parts of equal wholes.', buildLabel: 'Build equivalents', connectLabel: 'Find common parts', explainLabel: 'Combine fractions', values: [3, 6, 12], accent: '#818cf8' },
  percentages_money: { room: 'Price Lab', engine: 'percentage', objective: 'Model discounts and increases with grids, price cards, and reasonableness checks.', buildLabel: 'Set a discount', connectLabel: 'Compare prices', explainLabel: 'Check the result', values: [10, 20, 25], accent: '#fb923c' },
  squares_roots_cubes: { room: 'Square and Cube Builder', engine: 'pattern', objective: 'Construct square and cube patterns and connect each structure to its inverse root.', buildLabel: 'Tile a square', connectLabel: 'Stack a cube', explainLabel: 'Match an inverse', values: [4, 9, 27], accent: '#fdba74' },
  long_mult_pro: { room: 'Lattice Workshop', engine: 'column', objective: 'Align multi-digit partial products, manage carrying, and estimate before calculating.', buildLabel: 'Lay a lattice', connectLabel: 'Carry by place', explainLabel: 'Estimate and check', values: [236, 14, 3304], accent: '#f97316' },
  long_div_pro: { room: 'Quotient Builder', engine: 'division', objective: 'Build partial quotients, choose precision, and check division with multiplication.', buildLabel: 'Build quotients', connectLabel: 'Set precision', explainLabel: 'Check a remainder', values: [248, 8, 31], accent: '#fed7aa' },
  sequences_patterns: { room: 'Pattern Studio', engine: 'pattern', objective: 'Extend structured patterns, classify number relationships, and state the rule.', buildLabel: 'Extend a pattern', connectLabel: 'Sort number families', explainLabel: 'State the rule', values: [2, 4, 8], accent: '#a78bfa' },
  ratio_proportion: { room: 'Recipe Mixer', engine: 'ratio', objective: 'Build equivalent ratios, scale quantities, and share amounts proportionally.', buildLabel: 'Build a recipe', connectLabel: 'Scale both parts', explainLabel: 'Compare ratios', values: [2, 5, 10], accent: '#c4b5fd' },
  estimating: { room: 'Estimate Radar', engine: 'numberLine', objective: 'Place plausible bounds, choose a useful precision, and compare an estimate to an exact result.', buildLabel: 'Set estimate bounds', connectLabel: 'Choose precision', explainLabel: 'Check plausibility', values: [48, 50, 52], accent: '#ddd6fe' },
  number_skills: { room: 'Strategy Map', engine: 'numberLine', objective: 'Choose representations and checks for integrated number decisions.', buildLabel: 'Choose a route', connectLabel: 'Place a check', explainLabel: 'Justify a strategy', values: [18, -4, 125], accent: '#38bdf8' },
  fdp: { room: 'Representation Portal', engine: 'fraction', objective: 'Transform and compare equivalent fractions, decimals, and percentages.', buildLabel: 'Match forms', connectLabel: 'Transform a value', explainLabel: 'Choose a representation', values: [0.25, 0.5, 0.75], accent: '#7dd3fc' },
  ratio_proportion_2: { room: 'Scale Mission', engine: 'ratio', objective: 'Link ratio tables, bar models, double number lines, and percentage comparisons.', buildLabel: 'Link a ratio table', connectLabel: 'Scale a bar model', explainLabel: 'Compare proportion', values: [3, 4, 12], accent: '#0ea5e9' },
  algebra_start: { room: 'Function Machine', engine: 'function', objective: 'Send inputs through operation rules and connect the output pattern to an expression.', buildLabel: 'Set an operation', connectLabel: 'Run an input', explainLabel: 'Write the rule', values: [2, 5, 11], accent: '#67e8f9' },
  sequences: { room: 'Sequence Engine', engine: 'function', objective: 'Generate terms from position, compare growth, and explain a sequence rule.', buildLabel: 'Place a term', connectLabel: 'Set a rule', explainLabel: 'Predict a position', values: [3, 6, 9], accent: '#22d3ee' },
};

function fallbackProfile(topic: CurriculumTopic): GymProfile {
  return {
    room: 'Number Workshop',
    engine: 'numberLine',
    objective: `Represent and explain the core ideas in ${topic.title.toLowerCase()}.`,
    buildLabel: 'Build a model',
    connectLabel: 'Connect representations',
    explainLabel: 'Explain the relationship',
    values: [1, 2, 3],
    accent: '#38bdf8',
  };
}

export const GYM_TOPICS: GymTopicConfig[] = CURRICULUM_TOPICS.map((topic) => {
  const region = getCurriculumRegionForTopic(topic.id);
  const profile = PROFILES[topic.mathTopicId] ?? fallbackProfile(topic);
  return {
    ...profile,
    topic,
    regionId: region?.id ?? 'kanto',
    regionName: region?.name ?? 'Kanto',
    stationId: `gym-${topic.id}`,
  };
});

export function getGymTopicsForRegion(regionId: string): GymTopicConfig[] {
  return GYM_TOPICS.filter((topic) => topic.regionId === regionId);
}

export function getGymTopicConfig(topicId: string): GymTopicConfig | undefined {
  return GYM_TOPICS.find((topic) => topic.topic.id === topicId);
}

export const GYM_ENGINE_LABELS: Record<GymEngineId, string> = {
  quantity: 'Quantities and number lines',
  combine: 'Part-whole models',
  takeAway: 'Difference and inverse models',
  placeValue: 'Place-value models',
  groups: 'Arrays and equal groups',
  division: 'Sharing and quotient models',
  numberLine: 'Directed number lines',
  fraction: 'Fraction representations',
  decimal: 'Decimal representations',
  percentage: 'Hundred-grid representations',
  column: 'Column and partial-product models',
  ratio: 'Ratio and scaling models',
  pattern: 'Pattern and structure models',
  function: 'Function and sequence models',
};
