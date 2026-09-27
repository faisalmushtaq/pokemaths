// =============================================================================
// POKÉMATHS — GYM PRACTICE TASKS
// =============================================================================
// Turns a Gym room's profile (engine + seed values) into concrete practice
// questions. Every question must be answerable from what is on screen: the
// prompt names the exact target, the model uses the same units as the prompt,
// and nothing the player needs is hidden.
//
// Answers are whole numbers of "units". A decimal line from 1 to 2 in
// hundredths has units 100..200 with scale 0.01, so checking never compares
// floating-point values.
// =============================================================================

import type { GymTopicConfig } from './gymContent';

export type GymTaskKind = 'fraction' | 'counter' | 'line' | 'digit' | 'number';

export interface GymTask {
  kind: GymTaskKind;
  prompt: string;
  hint: string;
  explanation: string;
  /** Correct answer, in units. */
  expected: number;
  /** Smallest and largest answer the model allows, in units. */
  min: number;
  max: number;
  /** Value of one unit on a line (0.1 for tenths). */
  scale?: number;
  /** Decimal places when showing a line value. */
  decimals?: number;
  /** Suffix when showing a line value, e.g. '%'. */
  suffix?: string;
  /** Number shown on the card for a digit question. */
  card?: string;
  /** Pattern or sum shown above the model. */
  display?: string;
  /** What the counters or answer represent, e.g. 'BLUE BERRIES'. */
  label?: string;
}

const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];

function pick<T>(items: T[], n: number): T {
  return items[((n % items.length) + items.length) % items.length];
}

function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function decimalPlaces(value: number): number {
  if (Number.isInteger(value)) return 0;
  return roundTo(value, 1) === value ? 1 : 2;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-GB');
}

/** Answer via a stepper when the model would need too many counters to tap. */
function countOrNumber(total: number): 'counter' | 'number' {
  return total <= 24 ? 'counter' : 'number';
}

function decimalTask(v: number, stage: number, n: number): GymTask {
  const d = Math.max(1, decimalPlaces(v));
  const scale = 10 ** -d;
  const units = Math.round(v / scale);
  const whole = Math.floor(v);
  const text = v.toFixed(d);
  const stepWord = d === 1 ? 'tenth (0.1)' : 'hundredth (0.01)';

  if (stage === 0) {
    // Which digit sits in a named place?
    const places = d === 1 ? ['tenths', 'ones'] : ['hundredths', 'tenths', 'ones'];
    const place = pick(places, n);
    const digit = place === 'ones'
      ? whole % 10
      : place === 'tenths'
        ? Math.floor(roundTo(v * 10, 6)) % 10
        : Math.round(v * 100) % 10;
    return {
      kind: 'digit',
      card: text,
      expected: digit,
      min: 0,
      max: 9,
      prompt: `Which digit is in the ${place} place of ${text}?`,
      hint: 'After the decimal point the places are tenths, then hundredths. Before it are the ones.',
      explanation: `In ${text}, the ${place} digit is ${digit}.`,
    };
  }

  const line: Pick<GymTask, 'kind' | 'min' | 'max' | 'scale' | 'decimals' | 'expected'> = {
    kind: 'line',
    min: Math.round(whole / scale),
    max: Math.round((whole + 1) / scale),
    scale,
    decimals: d,
    expected: units,
  };
  const hint = `The line goes from ${whole} to ${whole + 1}. Each small step is one ${stepWord}. Use the − and + buttons for small steps.`;

  if (stage === 1) {
    // Same position, given as a fraction so the player links the two forms.
    const denominator = d === 1 ? 10 : 100;
    const part = units - whole * denominator;
    const fraction = whole > 0 ? `${whole} and ${part}/${denominator}` : `${part}/${denominator}`;
    return {
      ...line,
      prompt: `Move the marker to ${fraction}.`,
      hint: `${part}/${denominator} means ${part} ${d === 1 ? 'tenths' : 'hundredths'}. ${hint}`,
      explanation: `${fraction} is the same as ${text}.`,
    };
  }

  return {
    ...line,
    prompt: `Move the marker to ${text}.`,
    hint,
    explanation: `${text} is ${whole} whole${whole === 1 ? '' : 's'} and ${(v - whole).toFixed(d)} more.`,
  };
}

function placeValueTask(base: number, n: number): GymTask {
  const source = Math.abs(Math.trunc(base));
  const digits = String(source).split('').map(Number);
  const placeIndex = n % digits.length; // 0 = ones
  const place = PLACE_NAMES[placeIndex];
  const expected = digits[digits.length - 1 - placeIndex];
  const card = formatNumber(source);
  return {
    kind: 'digit',
    card,
    expected,
    min: 0,
    max: 9,
    prompt: digits.length === 1
      ? `Which digit is in the ones place of ${card}?`
      : `Which digit is in the ${place} place of ${card}?`,
    hint: 'Start at the right-hand end: ones, then tens, then hundreds, then thousands.',
    explanation: `The ${place} digit of ${card} is ${expected}, so it is worth ${formatNumber(expected * 10 ** placeIndex)}.`,
  };
}

function patternTask(values: number[], n: number): GymTask {
  const start = Math.max(0, Math.round(Math.abs(pick(values, n))));
  const step = 2 + (n % 4);
  const terms = [0, 1, 2, 3].map((i) => start + step * i);
  const expected = start + step * 4;
  return {
    kind: 'number',
    display: `${terms.join(', ')}, ?`,
    expected,
    min: 0,
    max: expected + 20,
    prompt: 'What number comes next in the pattern?',
    hint: 'Find how much the pattern goes up by each time, then add that once more.',
    explanation: `The pattern goes up by ${step} each time, so ${terms[3]} + ${step} = ${expected}.`,
  };
}

function groupsTask(base: number, n: number): GymTask {
  const size = Math.max(1, Math.min(12, Math.round(Math.abs(base))));
  let groups = 2 + (n % 4);
  while (groups > 1 && groups * size > 60) groups -= 1;
  const expected = groups * size;
  return {
    kind: countOrNumber(expected),
    label: 'COUNTERS',
    expected,
    min: 0,
    max: Math.max(10, expected + 10),
    prompt: `Make ${groups} groups of ${size}. How many is that altogether?`,
    hint: `Count ${size}, ${groups} times. Or use the ${size} times table: ${groups} × ${size}.`,
    explanation: `${groups} groups of ${size} make ${expected}, so ${groups} × ${size} = ${expected}.`,
  };
}

function divisionTask(base: number, n: number): GymTask {
  const total = Math.max(2, Math.round(Math.abs(base)));
  const divisor = pick([2, 3, 4, 5].filter((d) => d <= total), n);
  const each = Math.floor(total / divisor);
  const left = total % divisor;
  return {
    kind: countOrNumber(each),
    label: 'EACH FRIEND GETS',
    expected: each,
    min: 0,
    max: Math.max(10, each + 10),
    prompt: `Share ${total} sweets equally between ${divisor} friends. How many does each friend get?`,
    hint: `Hand out one sweet to each friend at a time until you can't go round again. Or ask: how many ${divisor}s make ${total}?`,
    explanation: left === 0
      ? `${total} ÷ ${divisor} = ${each}. Each friend gets ${each}.`
      : `${total} ÷ ${divisor} = ${each} remainder ${left}. Each friend gets ${each} and ${left} ${left === 1 ? 'is' : 'are'} left over.`,
  };
}

function ratioTask(values: number[], n: number): GymTask {
  const a = Math.max(1, Math.round(values[0]));
  const b = Math.max(1, Math.round(values[1] ?? a + 1));
  const times = 1 + (n % 3);
  const amber = a * times;
  const expected = b * times;
  return {
    kind: countOrNumber(expected),
    label: 'BLUE BERRIES',
    expected,
    min: 0,
    max: Math.max(10, expected + 10),
    prompt: `A recipe uses ${a} amber berries for every ${b} blue berries. You use ${amber} amber berries. How many blue berries do you need?`,
    hint: times === 1
      ? `It's one batch of the recipe, so use the same numbers.`
      : `${amber} amber is ${times} lots of ${a}. So you need ${times} lots of ${b} blue.`,
    explanation: `${a} : ${b} is the same as ${amber} : ${expected}. Both parts were multiplied by ${times}.`,
  };
}

function combineTask(values: number[], n: number): GymTask {
  const a = Math.round(Math.abs(pick(values, n)));
  const b = Math.round(Math.abs(pick(values, n + 1)));
  const expected = a + b;
  return {
    kind: countOrNumber(expected),
    label: 'TOTAL',
    display: `${a} + ${b} = ?`,
    expected,
    min: 0,
    max: expected + 10,
    prompt: `Put ${a} and ${b} together. How many altogether?`,
    hint: `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`,
    explanation: `${a} + ${b} = ${expected}.`,
  };
}

function takeAwayTask(values: number[], n: number): GymTask {
  const x = Math.round(Math.abs(pick(values, n)));
  const y = Math.round(Math.abs(pick(values, n + 1)));
  const start = Math.max(x, y);
  const remove = Math.min(x, y);
  const expected = start - remove;
  return {
    kind: countOrNumber(expected),
    label: 'LEFT',
    display: `${start} − ${remove} = ?`,
    expected,
    min: 0,
    max: start,
    prompt: `Start with ${start}. Take away ${remove}. How many are left?`,
    hint: `Count back ${remove} from ${start}. Check: your answer + ${remove} should make ${start}.`,
    explanation: `${start} − ${remove} = ${expected}, and ${expected} + ${remove} = ${start}.`,
  };
}

export function gymTaskFor(config: GymTopicConfig, n: number): GymTask {
  const stage = n % 3;
  // Rotate the seed value each module so the three examples don't repeat.
  const base = pick(config.values, n + Math.floor(n / 3));

  switch (config.engine) {
    case 'fraction': {
      const denominator = Math.max(2, Math.min(10, Math.round(Math.abs(base) < 1 ? 1 / Math.abs(base) : Math.abs(base)) || 2));
      const numerator = Math.min(denominator, (n % denominator) + 1);
      return {
        kind: 'fraction',
        expected: numerator,
        min: 1,
        max: denominator,
        prompt: `Shade ${numerator}/${denominator} of the bar.`,
        hint: `The bar is cut into ${denominator} equal parts. Shade ${numerator} of them.`,
        explanation: `${numerator} of the ${denominator} equal parts are shaded: that is ${numerator}/${denominator}.`,
      };
    }
    case 'percentage': {
      const expected = Math.max(0, Math.min(100, Math.round(base)));
      return {
        kind: 'line',
        expected,
        min: 0,
        max: 100,
        scale: 1,
        suffix: '%',
        prompt: `Move the marker to ${expected}%.`,
        hint: 'The left end is 0% and the right end is 100%. Halfway is 50%.',
        explanation: `${expected}% means ${expected} out of every 100.`,
      };
    }
    case 'decimal':
      return decimalTask(base, stage, n);
    case 'placeValue':
    case 'column':
      return placeValueTask(base, n);
    case 'function':
    case 'pattern':
      return patternTask(config.values, n);
    case 'ratio':
      return ratioTask(config.values, n);
    case 'groups':
      return groupsTask(base, n);
    case 'division':
      return divisionTask(base, n);
    case 'combine':
      return combineTask(config.values, n);
    case 'takeAway':
      return takeAwayTask(config.values, n);
    case 'numberLine': {
      const expected = Math.round(base);
      // Whole fives at both ends so the labelled ticks land on round numbers.
      const min = Math.floor(Math.min(-10, expected - 5) / 5) * 5;
      const max = Math.ceil(Math.max(10, expected + 5) / 5) * 5;
      return {
        kind: 'line',
        expected,
        min,
        max,
        scale: 1,
        prompt: `Move the marker to ${expected}.`,
        hint: expected < 0
          ? `Negative numbers are to the left of 0. Count ${-expected} steps left from 0.`
          : `Start at 0 and count ${expected} steps to the right.`,
        explanation: `${expected} is ${Math.abs(expected)} step${Math.abs(expected) === 1 ? '' : 's'} ${expected < 0 ? 'left' : 'right'} of 0.`,
      };
    }
    default: {
      const expected = Math.max(1, Math.min(24, Math.round(Math.abs(base))));
      return {
        kind: 'counter',
        label: 'COUNTERS',
        expected,
        min: 0,
        max: expected + 6,
        prompt: `Tap to make exactly ${expected} counters.`,
        hint: 'Touch each counter as you count it. The last number you say is how many there are.',
        explanation: `You made ${expected} counters.`,
      };
    }
  }
}

/** Where the model starts before the player moves it. */
export function gymTaskStart(task: GymTask): number {
  if (task.kind === 'line') return task.min <= 0 && task.max >= 0 ? 0 : task.min;
  return 0;
}
