// =============================================================================
// POKÉMATHS — TOPIC ENGINE (graded difficulty)
// =============================================================================
// 37 curriculum-aligned maths topics. Every topic is a LADDER: generate(level)
// produces a question at a specific difficulty level (1 = easiest). Within a
// level the range is tight, so questions feel consistent; battles ramp the
// level slowly from 1 up to the topic's maxLevel, so difficulty grades gently
// instead of jumping around.
//
// A Question's `answer` is always numeric (supports decimals/negatives).
// =============================================================================

export interface Question {
  text: string;
  answer: number;
  hint: string;
  tolerance?: number; // how close a typed answer must be (for decimals). Default 0.
}

export type TopicId =
  | 'counting' | 'adding' | 'subtracting' | 'more_adding' | 'more_subtracting'
  | 'tables_1_2_5_10' | 'adding_bigger' | 'tables_3_6_9' | 'place_value'
  | 'tables_4_8' | 'subtracting_bigger' | 'tens_hundreds_thousands' | 'table_7'
  | 'dividing_to_10' | 'dividing_remainders' | 'negatives' | 'mult_div_powers10'
  | 'tables_11_12' | 'fractions' | 'decimals' | 'long_mult_start' | 'long_div_start'
  | 'percentages_start' | 'more_decimals' | 'more_fractions' | 'percentages_money'
  | 'squares_roots_cubes' | 'long_mult_pro' | 'long_div_pro' | 'sequences_patterns'
  | 'ratio_proportion' | 'estimating' | 'number_skills' | 'fdp' | 'ratio_proportion_2'
  | 'algebra_start' | 'sequences';

export interface Topic {
  id: TopicId;
  name: string;
  maxLevel: number;
  generate: (level: number) => Question;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const r = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const round = (x: number, n = 2): number => { const f = 10 ** n; return Math.round(x * f) / f; };
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(v, hi));
/** pick a value from a per-level array (1-indexed level, clamped to the array) */
const byLevel = <T,>(level: number, arr: T[]): T => arr[clamp(level, 1, arr.length) - 1];

type Spec = { maxLevel: number; gen: (level: number) => Question };

// ---------------------------------------------------------------------------
// generators — each graded by level
// ---------------------------------------------------------------------------
const SPECS: Record<TopicId, Spec> = {
  // 1. Counting & number lines — step size / range grow
  counting: {
    maxLevel: 6,
    gen: (lv) => {
      const step = byLevel(lv, [1, 2, 5, 10, 3, 25]);
      const startMax = byLevel(lv, [5, 10, 20, 50, 60, 250]);
      const start = r(0, startMax);
      const seq = [start, start + step, start + step * 2];
      return { text: `${seq[0]}, ${seq[1]}, ${seq[2]}, ?`, answer: start + step * 3, hint: `Counting up in ${step}s` };
    },
  },

  // 2. Adding up — sum cap grows
  adding: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [5, 10, 15, 20, 50, 100]);
      let a = r(1, cap - 1), b = r(1, cap - 1);
      while (a + b > cap) { a = r(1, cap - 1); b = r(1, cap - 1); }
      return { text: `${a} + ${b} = ?`, answer: a + b, hint: `Count on ${b} from ${a}` };
    },
  },

  // 3. Subtracting — range grows
  subtracting: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [5, 10, 15, 20, 50, 100]);
      const a = r(2, cap), b = r(1, a);
      return { text: `${a} − ${b} = ?`, answer: a - b, hint: `Count back ${b} from ${a}` };
    },
  },

  // 4. More adding up — bigger, and three numbers at higher levels
  more_adding: {
    maxLevel: 6,
    gen: (lv) => {
      if (lv >= 3 && Math.random() < 0.5) {
        const cap = byLevel(lv, [9, 9, 9, 12, 15, 20]);
        const a = r(1, cap), b = r(1, cap), c = r(1, cap);
        return { text: `${a} + ${b} + ${c} = ?`, answer: a + b + c, hint: `Add two, then the third` };
      }
      const cap = byLevel(lv, [10, 20, 30, 50, 100, 200]);
      const a = r(1, cap), b = r(1, cap);
      return { text: `${a} + ${b} = ?`, answer: a + b, hint: `Make the tens first, then add the rest` };
    },
  },

  // 5. More subtracting — range grows
  more_subtracting: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [10, 20, 30, 50, 100, 200]);
      const a = r(Math.floor(cap / 2), cap), b = r(1, a);
      return { text: `${a} − ${b} = ?`, answer: a - b, hint: `Count back from ${a}` };
    },
  },

  // 6. The 1, 2, 5 & 10 times tables — multiplier range grows
  tables_1_2_5_10: {
    maxLevel: 6,
    gen: (lv) => {
      const m = pick([1, 2, 5, 10]);
      const n = r(1, clamp(2 + lv * 2, 3, 12));
      return { text: `${m} × ${n} = ?`, answer: m * n, hint: `${m} lots of ${n}` };
    },
  },

  // 7. Adding bigger numbers — magnitude grows
  adding_bigger: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [50, 99, 200, 500, 999, 2000]);
      const a = r(Math.floor(cap / 3), cap), b = r(Math.floor(cap / 3), cap);
      return { text: `${a} + ${b} = ?`, answer: a + b, hint: `Add the tens, then the units` };
    },
  },

  // 8. The 3, 6 & 9 times tables — tables and range grow
  tables_3_6_9: {
    maxLevel: 6,
    gen: (lv) => {
      const m = pick(byLevel(lv, [[3], [3], [3, 6], [3, 6], [3, 6, 9], [3, 6, 9]]));
      const n = r(1, clamp(3 + lv, 4, 12));
      return { text: `${m} × ${n} = ?`, answer: m * n, hint: `${m} times table` };
    },
  },

  // 9. Units, tens, hundreds & thousands — place value; magnitude grows
  place_value: {
    maxLevel: 5,
    gen: (lv) => {
      const digits = byLevel(lv, [2, 3, 3, 4, 4]);
      const min = 10 ** (digits - 1), max = 10 ** digits - 1;
      const num = r(min, max);
      const places = [
        { name: 'units', div: 1 }, { name: 'tens', div: 10 },
        { name: 'hundreds', div: 100 }, { name: 'thousands', div: 1000 },
      ].slice(0, digits);
      const p = pick(places);
      return { text: `In ${num}, which digit is in the ${p.name}?`, answer: Math.floor(num / p.div) % 10, hint: `Look at the ${p.name} column` };
    },
  },

  // 10. The 4 & 8 times tables
  tables_4_8: {
    maxLevel: 6,
    gen: (lv) => {
      const m = pick(byLevel(lv, [[4], [4], [4, 8], [4, 8], [4, 8], [4, 8]]));
      const n = r(1, clamp(3 + lv, 4, 12));
      return { text: `${m} × ${n} = ?`, answer: m * n, hint: `${m} times table` };
    },
  },

  // 11. Subtracting bigger numbers
  subtracting_bigger: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [50, 99, 200, 500, 999, 2000]);
      const a = r(Math.floor(cap / 2), cap), b = r(Math.floor(cap / 4), a);
      return { text: `${a} − ${b} = ?`, answer: a - b, hint: `Take away in steps` };
    },
  },

  // 12. Rounding to 10s / 100s / 1000s
  tens_hundreds_thousands: {
    maxLevel: 5,
    gen: (lv) => {
      const to = byLevel(lv, [10, 10, 100, 100, 1000]);
      const numMax = byLevel(lv, [99, 199, 980, 4999, 9999]);
      const num = r(to + 1, numMax);
      return { text: `Round ${num} to the nearest ${to}`, answer: Math.round(num / to) * to, hint: `Closer to the lower or higher ${to}?` };
    },
  },

  // 13. The 7 times table — range grows
  table_7: {
    maxLevel: 6,
    gen: (lv) => {
      const n = r(1, clamp(3 + lv, 4, 12));
      return { text: `7 × ${n} = ?`, answer: 7 * n, hint: `7 times table` };
    },
  },

  // 14. Dividing by numbers up to 10
  dividing_to_10: {
    maxLevel: 6,
    gen: (lv) => {
      const bMax = byLevel(lv, [3, 5, 6, 8, 10, 10]);
      const b = r(2, bMax);
      const q = r(1, clamp(3 + lv, 4, 12));
      return { text: `${b * q} ÷ ${b} = ?`, answer: q, hint: `How many ${b}s make ${b * q}?` };
    },
  },

  // 15. Dividing with remainders
  dividing_remainders: {
    maxLevel: 5,
    gen: (lv) => {
      const b = r(3, byLevel(lv, [4, 5, 6, 8, 9]));
      const q = r(2, clamp(2 + lv, 3, 9));
      const rem = r(1, b - 1);
      return { text: `What is the remainder in ${b * q + rem} ÷ ${b}?`, answer: rem, hint: `${b} × ${q} = ${b * q}, what is left over?` };
    },
  },

  // 16. Numbers less than zero — magnitude grows
  negatives: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [5, 10, 15, 20, 50, 100]);
      const a = r(1, Math.floor(cap / 2));
      const b = r(a + 1, a + cap);
      return { text: `${a} − ${b} = ?`, answer: a - b, hint: `Go below zero on the number line` };
    },
  },

  // 17. Multiply & divide by 10, 100, 1000
  mult_div_powers10: {
    maxLevel: 5,
    gen: (lv) => {
      const p = byLevel(lv, [10, 10, 100, 100, 1000]);
      const nMax = byLevel(lv, [9, 99, 99, 999, 999]);
      if (Math.random() < 0.5) {
        const n = r(2, nMax);
        return { text: `${n} × ${p} = ?`, answer: n * p, hint: `Shift the digits left` };
      }
      const q = r(2, nMax);
      return { text: `${q * p} ÷ ${p} = ?`, answer: q, hint: `Shift the digits right` };
    },
  },

  // 18. The 11 & 12 times tables
  tables_11_12: {
    maxLevel: 5,
    gen: (lv) => {
      const m = pick(byLevel(lv, [[11], [11], [11, 12], [11, 12], [11, 12]]));
      const n = r(1, clamp(4 + lv, 5, 12));
      return { text: `${m} × ${n} = ?`, answer: m * n, hint: `${m} times table` };
    },
  },

  // 19. Lovely fractions — fraction of an amount
  fractions: {
    maxLevel: 6,
    gen: (lv) => {
      const den = pick(byLevel(lv, [[2], [2, 4], [2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 8]]));
      const whole = den * r(2, clamp(2 + lv, 3, 9));
      return { text: `1/${den} of ${whole} = ?`, answer: whole / den, hint: `Split ${whole} into ${den} equal parts` };
    },
  },

  // 20. Lovely decimals — add/sub, precision & magnitude grow
  decimals: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = byLevel(lv, [20, 50, 90, 90, 90, 90]);
      const twoDp = lv >= 5;
      const scale = twoDp ? 100 : 10;
      const a = round(r(1, cap) / scale, twoDp ? 2 : 1);
      const b = round(r(1, cap) / scale, twoDp ? 2 : 1);
      if (Math.random() < 0.5) return { text: `${a} + ${b} = ?`, answer: round(a + b, 2), hint: `Line up the decimal points`, tolerance: 0.001 };
      const hi = Math.max(a, b), lo = Math.min(a, b);
      return { text: `${hi} − ${lo} = ?`, answer: round(hi - lo, 2), hint: `Line up the decimal points`, tolerance: 0.001 };
    },
  },

  // 21. Starting long multiplication (2-digit × 1-digit)
  long_mult_start: {
    maxLevel: 6,
    gen: (lv) => {
      const aMax = byLevel(lv, [15, 19, 25, 39, 49, 99]);
      const a = r(11, aMax), b = r(byLevel(lv, [2, 3, 3, 4, 6, 9]), 9);
      return { text: `${a} × ${b} = ?`, answer: a * b, hint: `Multiply units, then tens` };
    },
  },

  // 22. Starting long division (÷ 1-digit, exact)
  long_div_start: {
    maxLevel: 6,
    gen: (lv) => {
      const b = r(3, byLevel(lv, [4, 5, 6, 7, 8, 9]));
      const q = r(11, byLevel(lv, [19, 25, 30, 40, 60, 99]));
      return { text: `${b * q} ÷ ${b} = ?`, answer: q, hint: `How many ${b}s fit?` };
    },
  },

  // 23. Starting percentages
  percentages_start: {
    maxLevel: 6,
    gen: (lv) => {
      const p = pick(byLevel(lv, [[50], [50, 10], [10, 50, 25], [10, 25, 50], [10, 20, 25, 50], [5, 10, 20, 25, 50]]));
      const whole = pick(byLevel(lv, [[20, 40, 60], [20, 40, 80], [40, 60, 100], [40, 80, 100], [100, 200], [80, 120, 200]]));
      return { text: `${p}% of ${whole} = ?`, answer: (whole * p) / 100, hint: p === 50 ? 'Half it' : p === 25 ? 'Quarter it' : p === 10 ? 'Divide by 10' : `${p} out of 100` };
    },
  },

  // 24. More decimals — × / ÷ by 10 / 100
  more_decimals: {
    maxLevel: 5,
    gen: (lv) => {
      const a = round(r(10, 990) / 100, 2);
      const p = byLevel(lv, [10, 10, 100, 100, 1000]);
      return { text: `${a} × ${p} = ?`, answer: round(a * p, 2), hint: `Digits shift left`, tolerance: 0.001 };
    },
  },

  // 25. More fractions — non-unit fraction of an amount
  more_fractions: {
    maxLevel: 6,
    gen: (lv) => {
      const den = pick(byLevel(lv, [[3], [3, 4], [3, 4, 5], [4, 5, 6], [5, 6, 8], [6, 8, 10]]));
      const num = r(2, den - 1);
      const whole = den * r(2, clamp(2 + lv, 3, 7));
      return { text: `${num}/${den} of ${whole} = ?`, answer: (whole / den) * num, hint: `Find 1/${den} first, then ×${num}` };
    },
  },

  // 26. Percentages & money
  percentages_money: {
    maxLevel: 6,
    gen: (lv) => {
      const p = pick(byLevel(lv, [[50], [10, 50], [10, 25, 50], [10, 20, 25, 50], [5, 10, 20, 25], [5, 15, 20, 30]]));
      const pounds = pick(byLevel(lv, [[20, 40], [20, 40, 80], [40, 80, 100], [50, 80, 100], [100, 200], [60, 120, 200]]));
      return { text: `${p}% of £${pounds} = £?`, answer: round((pounds * p) / 100, 2), hint: `${p}% means ${p} out of 100`, tolerance: 0.001 };
    },
  },

  // 27. Squares, square roots & cubes
  squares_roots_cubes: {
    maxLevel: 6,
    gen: (lv) => {
      const kind = lv <= 2 ? 'square' : lv <= 4 ? pick(['square', 'root']) : pick(['square', 'root', 'cube']);
      if (kind === 'square') { const n = r(2, clamp(4 + lv, 5, 12)); return { text: `${n}² = ?`, answer: n * n, hint: `${n} × ${n}` }; }
      if (kind === 'cube') { const n = r(2, clamp(2 + Math.floor(lv / 2), 3, 6)); return { text: `${n}³ = ?`, answer: n ** 3, hint: `${n} × ${n} × ${n}` }; }
      const n = r(2, clamp(4 + lv, 5, 12));
      return { text: `√${n * n} = ?`, answer: n, hint: `What times itself makes ${n * n}?` };
    },
  },

  // 28. Being brilliant at long multiplication (2-digit × 2-digit)
  long_mult_pro: {
    maxLevel: 6,
    gen: (lv) => {
      const a = r(11, byLevel(lv, [15, 20, 25, 35, 50, 99]));
      const b = r(11, byLevel(lv, [13, 15, 19, 25, 40, 99]));
      return { text: `${a} × ${b} = ?`, answer: a * b, hint: `Split into tens and units` };
    },
  },

  // 29. Being brilliant at long division
  long_div_pro: {
    maxLevel: 6,
    gen: (lv) => {
      const b = r(3, byLevel(lv, [5, 6, 7, 8, 9, 12]));
      const q = r(11, byLevel(lv, [30, 45, 60, 90, 150, 300]));
      return { text: `${b * q} ÷ ${b} = ?`, answer: q, hint: `Divide each part in turn` };
    },
  },

  // 30. Number patterns & sequences — step grows, then multiplicative
  sequences_patterns: {
    maxLevel: 6,
    gen: (lv) => {
      if (lv >= 5 && Math.random() < 0.5) {
        const ratio = byLevel(lv, [2, 2, 2, 2, 2, 3]);
        const start = r(1, 4);
        const s = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
        return { text: `${s.join(', ')}, ?`, answer: start * ratio ** 4, hint: `Each term ×${ratio}` };
      }
      const step = r(2, clamp(2 + lv, 3, 12));
      const start = r(1, 9);
      const s = [start, start + step, start + step * 2, start + step * 3];
      return { text: `${s.join(', ')}, ?`, answer: start + step * 4, hint: `The step is +${step}` };
    },
  },

  // 31. Ratio & proportion — scale factor grows
  ratio_proportion: {
    maxLevel: 5,
    gen: (lv) => {
      const a = r(1, byLevel(lv, [3, 4, 5, 6, 8])), b = r(2, byLevel(lv, [4, 5, 6, 8, 10]));
      const k = r(2, clamp(1 + lv, 2, 8));
      return { text: `${a} : ${b} = ${a * k} : ?`, answer: b * k, hint: `Both sides ×${k}` };
    },
  },

  // 32. Estimating & checking — magnitude grows
  estimating: {
    maxLevel: 5,
    gen: (lv) => {
      const cap = byLevel(lv, [99, 199, 499, 999, 4999]);
      const a = r(11, cap), b = r(11, cap);
      const to = cap <= 199 ? 10 : 100;
      return { text: `Estimate ${a} + ${b} (nearest ${to})`, answer: Math.round(a / to) * to + Math.round(b / to) * to, hint: `Round each number first` };
    },
  },

  // 33. Number skills — order of operations
  number_skills: {
    maxLevel: 6,
    gen: (lv) => {
      const cap = clamp(4 + lv, 5, 12);
      const a = r(2, cap), b = r(2, cap), c = r(2, cap);
      if (lv >= 4 && Math.random() < 0.5) return { text: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c, hint: `Brackets first` };
      return { text: `${a} + ${b} × ${c} = ?`, answer: a + b * c, hint: `Do × before +` };
    },
  },

  // 34. Fractions, decimals & percentages — convert
  fdp: {
    maxLevel: 5,
    gen: (lv) => {
      const easy = [{ f: '1/2', v: 0.5 }, { f: '1/4', v: 0.25 }, { f: '1/10', v: 0.1 }];
      const hard = [{ f: '3/4', v: 0.75 }, { f: '1/5', v: 0.2 }, { f: '3/10', v: 0.3 }, { f: '2/5', v: 0.4 }];
      const m = pick(lv <= 2 ? easy : [...easy, ...hard]);
      if (lv >= 4 && Math.random() < 0.5) return { text: `${m.f} as a % = ?`, answer: round(m.v * 100, 0), hint: `Out of 100` };
      return { text: `${m.f} as a decimal = ?`, answer: m.v, hint: `Divide top by bottom`, tolerance: 0.001 };
    },
  },

  // 35. Ratio & proportion II — sharing
  ratio_proportion_2: {
    maxLevel: 5,
    gen: (lv) => {
      const a = r(1, byLevel(lv, [2, 3, 3, 4, 5])), b = r(1, byLevel(lv, [2, 3, 4, 4, 5]));
      const part = r(2, clamp(2 + lv, 3, 9));
      const total = (a + b) * part;
      return { text: `Share ${total} as ${a}:${b}. What is the ${a}-part?`, answer: a * part, hint: `${a + b} parts make ${total}, so 1 part = ${part}` };
    },
  },

  // 36. Starting algebra — one-step then two-step
  algebra_start: {
    maxLevel: 6,
    gen: (lv) => {
      const x = r(2, clamp(4 + lv, 5, 15));
      if (lv >= 5 && Math.random() < 0.5) {
        const m = r(2, 5), c = r(1, 9);
        return { text: `${m}x + ${c} = ${m * x + c}, x = ?`, answer: x, hint: `Take ${c} off, then ÷${m}` };
      }
      if (lv <= 2 || Math.random() < 0.5) {
        const c = r(1, 9);
        return { text: `x + ${c} = ${x + c}, x = ?`, answer: x, hint: `Take ${c} off both sides` };
      }
      const m = r(2, 6);
      return { text: `${m}x = ${m * x}, x = ?`, answer: x, hint: `Divide both sides by ${m}` };
    },
  },

  // 37. Sequences — step grows, then requires the rule
  sequences: {
    maxLevel: 6,
    gen: (lv) => {
      const step = r(3, clamp(4 + lv, 5, 15));
      const start = r(1, 6);
      const n = 5;
      const terms = Array.from({ length: n }, (_, i) => start + step * i);
      return { text: `${terms.join(', ')}, ?`, answer: start + step * n, hint: `Start ${start}, add ${step} each time` };
    },
  },
};

// ---------------------------------------------------------------------------
// display labels
// ---------------------------------------------------------------------------
const TOPIC_NAMES: Record<TopicId, string> = {
  counting: 'Counting & number lines', adding: 'Adding up', subtracting: 'Subtracting',
  more_adding: 'More adding up', more_subtracting: 'More subtracting',
  tables_1_2_5_10: 'The 1, 2, 5 & 10 times tables', adding_bigger: 'Adding bigger numbers',
  tables_3_6_9: 'The 3, 6 & 9 times tables', place_value: 'Units, tens, hundreds & thousands',
  tables_4_8: 'The 4 & 8 times tables', subtracting_bigger: 'Subtracting bigger numbers',
  tens_hundreds_thousands: 'Rounding to 10s, 100s & 1000s', table_7: 'The 7 times table',
  dividing_to_10: 'Dividing by numbers up to 10', dividing_remainders: 'Dividing with remainders',
  negatives: 'Numbers less than zero', mult_div_powers10: 'Multiply & divide by 10, 100, 1000',
  tables_11_12: 'The 11 & 12 times tables', fractions: 'Lovely fractions', decimals: 'Lovely decimals',
  long_mult_start: 'Starting long multiplication', long_div_start: 'Starting long division',
  percentages_start: 'Starting percentages', more_decimals: 'More decimals', more_fractions: 'More fractions',
  percentages_money: 'Percentages & money', squares_roots_cubes: 'Squares, square roots & cubes',
  long_mult_pro: 'Brilliant long multiplication', long_div_pro: 'Brilliant long division',
  sequences_patterns: 'Number patterns & sequences', ratio_proportion: 'Ratio & proportion',
  estimating: 'Estimating & checking', number_skills: 'Number skills',
  fdp: 'Fractions, decimals & percentages', ratio_proportion_2: 'Ratio & proportion II',
  algebra_start: 'Starting algebra', sequences: 'Sequences',
};

export const TOPICS: Record<TopicId, Topic> = Object.fromEntries(
  (Object.keys(SPECS) as TopicId[]).map((id) => [
    id, { id, name: TOPIC_NAMES[id], maxLevel: SPECS[id].maxLevel, generate: SPECS[id].gen },
  ]),
) as Record<TopicId, Topic>;

export function getTopic(id: TopicId): Topic {
  return TOPICS[id];
}

/** Difficulty level (1..maxLevel) for progress `done` of `total` questions. */
export function levelForProgress(done: number, total: number, maxLevel: number): number {
  if (total <= 1) return 1;
  const frac = Math.min(done, total) / total;
  return clamp(1 + Math.floor(frac * maxLevel), 1, maxLevel);
}

export function isAnswerCorrect(q: Question, typed: number): boolean {
  return Math.abs(typed - q.answer) <= (q.tolerance ?? 0);
}
