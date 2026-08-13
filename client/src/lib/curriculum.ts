// =============================================================================
// POKÉMATHS — CURRICULUM V2
// =============================================================================
// Generated from the approved 37-topic progression reviews. A revised module is
// a coherent mathematical idea. It contains several short practice battles.
// Every National Pokédex entry is assigned exactly once: ordinary Pokémon are
// earned in module battles and a unique legendary or mythical is the topic boss.
// =============================================================================

import type { TopicId } from './topics';

export type BattleMode = 'discover' | 'apply' | 'master' | 'challenge' | 'elite' | 'boss';

export interface CurriculumBattle {
  id: string;
  topicId: string;
  moduleId: string | null;
  order: number;
  title: string;
  mode: BattleMode;
  dex: number;
  questionCount: number;
  level: number;
  isBoss: boolean;
  timeLimitSec?: number;
}

export interface CurriculumModule {
  id: string;
  topicId: string;
  order: number;
  title: string;
  battles: CurriculumBattle[];
}

export interface CurriculumTopic {
  id: string;
  order: number;
  title: string;
  mathTopicId: TopicId;
  modules: CurriculumModule[];
  boss: CurriculumBattle;
}

type TopicSeed = {
  id: string;
  order: number;
  title: string;
  mathTopicId: TopicId;
  bossDex: number;
  modules: { id: string; order: number; title: string; battleCount: number }[];
};

const TOPIC_SEEDS: TopicSeed[] = [
  {
    "id": "t01",
    "order": 1,
    "title": "Counting and number lines",
    "mathTopicId": "counting",
    "bossDex": 144,
    "modules": [
      {
        "id": "t01-m01",
        "order": 1,
        "title": "Counting quantities to 10",
        "battleCount": 4
      },
      {
        "id": "t01-m02",
        "order": 2,
        "title": "Numbers to 10: compare and order",
        "battleCount": 4
      },
      {
        "id": "t01-m03",
        "order": 3,
        "title": "Teen numbers",
        "battleCount": 4
      },
      {
        "id": "t01-m04",
        "order": 4,
        "title": "Number lines to 20",
        "battleCount": 4
      },
      {
        "id": "t01-m05",
        "order": 5,
        "title": "Counting and structure to 100",
        "battleCount": 4
      },
      {
        "id": "t01-m06",
        "order": 6,
        "title": "Order and locate numbers to 100",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t02",
    "order": 2,
    "title": "Adding up",
    "mathTopicId": "adding",
    "bossDex": 145,
    "modules": [
      {
        "id": "t02-m01",
        "order": 1,
        "title": "Addition as combining",
        "battleCount": 4
      },
      {
        "id": "t02-m02",
        "order": 2,
        "title": "Count on from the larger number",
        "battleCount": 4
      },
      {
        "id": "t02-m03",
        "order": 3,
        "title": "Number bonds to 10",
        "battleCount": 4
      },
      {
        "id": "t02-m04",
        "order": 4,
        "title": "Add within 10",
        "battleCount": 4
      },
      {
        "id": "t02-m05",
        "order": 5,
        "title": "Make 10, then add",
        "battleCount": 4
      },
      {
        "id": "t02-m06",
        "order": 6,
        "title": "Add within 20 and 30",
        "battleCount": 4
      },
      {
        "id": "t02-m07",
        "order": 7,
        "title": "Addition facts and problems",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t03",
    "order": 3,
    "title": "Subtracting",
    "mathTopicId": "subtracting",
    "bossDex": 146,
    "modules": [
      {
        "id": "t03-m01",
        "order": 1,
        "title": "Subtraction as taking away",
        "battleCount": 4
      },
      {
        "id": "t03-m02",
        "order": 2,
        "title": "Count back 1, 2 and 3",
        "battleCount": 4
      },
      {
        "id": "t03-m03",
        "order": 3,
        "title": "Number bonds and fact families",
        "battleCount": 4
      },
      {
        "id": "t03-m04",
        "order": 4,
        "title": "Subtracting from 10",
        "battleCount": 4
      },
      {
        "id": "t03-m05",
        "order": 5,
        "title": "Difference and comparison",
        "battleCount": 4
      },
      {
        "id": "t03-m06",
        "order": 6,
        "title": "Subtract within 20 and 30",
        "battleCount": 4
      },
      {
        "id": "t03-m07",
        "order": 7,
        "title": "Mixed addition and subtraction problems",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t04",
    "order": 4,
    "title": "More adding up",
    "mathTopicId": "more_adding",
    "bossDex": 150,
    "modules": [
      {
        "id": "t04-m01",
        "order": 1,
        "title": "Tens and ones in two-digit numbers",
        "battleCount": 4
      },
      {
        "id": "t04-m02",
        "order": 2,
        "title": "Add small numbers without crossing a ten",
        "battleCount": 4
      },
      {
        "id": "t04-m03",
        "order": 3,
        "title": "Cross a ten with 1, 2 and 3",
        "battleCount": 4
      },
      {
        "id": "t04-m04",
        "order": 4,
        "title": "Add 4 to 9 by bridging",
        "battleCount": 4
      },
      {
        "id": "t04-m05",
        "order": 5,
        "title": "Add one digit within 100",
        "battleCount": 4
      },
      {
        "id": "t04-m06",
        "order": 6,
        "title": "Check and solve problems",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t05",
    "order": 5,
    "title": "More subtracting",
    "mathTopicId": "more_subtracting",
    "bossDex": 151,
    "modules": [
      {
        "id": "t05-m01",
        "order": 1,
        "title": "Subtract 4 to 9 within 30",
        "battleCount": 4
      },
      {
        "id": "t05-m02",
        "order": 2,
        "title": "Subtract 10 and multiples of 10",
        "battleCount": 5
      },
      {
        "id": "t05-m03",
        "order": 3,
        "title": "Subtract 1, 2 and 3 within 100 without crossing a ten",
        "battleCount": 4
      },
      {
        "id": "t05-m04",
        "order": 4,
        "title": "Cross back through a ten",
        "battleCount": 4
      },
      {
        "id": "t05-m05",
        "order": 5,
        "title": "Subtract 4 to 9 within 100",
        "battleCount": 4
      },
      {
        "id": "t05-m06",
        "order": 6,
        "title": "Subtract 1 to 10 within 100",
        "battleCount": 4
      },
      {
        "id": "t05-m07",
        "order": 7,
        "title": "Mixed problems and inverse checking",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t06",
    "order": 6,
    "title": "The 1, 2, 5 and 10 times tables",
    "mathTopicId": "tables_1_2_5_10",
    "bossDex": 243,
    "modules": [
      {
        "id": "t06-m01",
        "order": 1,
        "title": "Multiplication foundations and structure",
        "battleCount": 5
      },
      {
        "id": "t06-m02",
        "order": 2,
        "title": "The 1 and 2 times tables",
        "battleCount": 4
      },
      {
        "id": "t06-m03",
        "order": 3,
        "title": "The 5 times table",
        "battleCount": 4
      },
      {
        "id": "t06-m04",
        "order": 4,
        "title": "The 10 times table and place-value pattern",
        "battleCount": 4
      },
      {
        "id": "t06-m05",
        "order": 5,
        "title": "Comparing, switching and retrieving the 5 and 10 times tables",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t07",
    "order": 7,
    "title": "Adding bigger numbers",
    "mathTopicId": "adding_bigger",
    "bossDex": 244,
    "modules": [
      {
        "id": "t07-m01",
        "order": 1,
        "title": "Addition fluency and two-digit readiness",
        "battleCount": 4
      },
      {
        "id": "t07-m02",
        "order": 2,
        "title": "Column addition with a one-digit addend",
        "battleCount": 4
      },
      {
        "id": "t07-m03",
        "order": 3,
        "title": "Adding tens in column form",
        "battleCount": 4
      },
      {
        "id": "t07-m04",
        "order": 4,
        "title": "Two-digit column addition without and with carrying",
        "battleCount": 4
      },
      {
        "id": "t07-m05",
        "order": 5,
        "title": "Flexible addition across representations",
        "battleCount": 4
      },
      {
        "id": "t07-m06",
        "order": 6,
        "title": "Multiple-addend addition and cumulative assessment",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t08",
    "order": 8,
    "title": "The 3, 6 and 9 times tables",
    "mathTopicId": "tables_3_6_9",
    "bossDex": 245,
    "modules": [
      {
        "id": "t08-m01",
        "order": 1,
        "title": "Build and represent the 3 times table through equal groups, repeated addition, and multiplication facts",
        "battleCount": 5
      },
      {
        "id": "t08-m02",
        "order": 2,
        "title": "Secure the 6 times table and connect it with known multiplication facts, including doubled 3-times products where useful",
        "battleCount": 5
      },
      {
        "id": "t08-m03",
        "order": 3,
        "title": "Develop the 9 times table through structured patterns, repeated addition, and reliable fact retrieval",
        "battleCount": 4
      },
      {
        "id": "t08-m04",
        "order": 4,
        "title": "Integrate and retrieve the 3, 6 and 9 times tables across varied multiplication prompts",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t09",
    "order": 9,
    "title": "Units, tens, hundreds and thousands",
    "mathTopicId": "place_value",
    "bossDex": 249,
    "modules": [
      {
        "id": "t09-m01",
        "order": 1,
        "title": "Reading and representing place value to 9,999",
        "battleCount": 4
      },
      {
        "id": "t09-m02",
        "order": 2,
        "title": "Comparing digit values and powers of ten",
        "battleCount": 4
      },
      {
        "id": "t09-m03",
        "order": 3,
        "title": "Rounding 2-digit numbers to the nearest 10",
        "battleCount": 4
      },
      {
        "id": "t09-m04",
        "order": 4,
        "title": "Rounding to the nearest 10 or 100",
        "battleCount": 4
      },
      {
        "id": "t09-m05",
        "order": 5,
        "title": "Integrated place-value and rounding reasoning",
        "battleCount": 4
      },
      {
        "id": "t09-m06",
        "order": 6,
        "title": "Grand Genius Test",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t10",
    "order": 10,
    "title": "The 4 and 8 times tables",
    "mathTopicId": "tables_4_8",
    "bossDex": 250,
    "modules": [
      {
        "id": "t10-m01",
        "order": 1,
        "title": "Build and consolidate the 4 times table through repeated, connected fact retrieval",
        "battleCount": 4
      },
      {
        "id": "t10-m02",
        "order": 2,
        "title": "Extend 4-table knowledge into the 8 times table through linked and progressively less supported retrieval",
        "battleCount": 4
      },
      {
        "id": "t10-m03",
        "order": 3,
        "title": "Compare and distinguish the 2, 3, 4 and 8 times tables",
        "battleCount": 4
      },
      {
        "id": "t10-m04",
        "order": 4,
        "title": "Integrate the 2, 3, 4 and 8 times tables in mixed retrieval and application",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t11",
    "order": 11,
    "title": "Subtracting bigger numbers",
    "mathTopicId": "subtracting_bigger",
    "bossDex": 251,
    "modules": [
      {
        "id": "t11-m01",
        "order": 1,
        "title": "Revision and readiness for column subtraction",
        "battleCount": 4
      },
      {
        "id": "t11-m02",
        "order": 2,
        "title": "Column subtraction of 2-digit numbers without exchanging",
        "battleCount": 4
      },
      {
        "id": "t11-m03",
        "order": 3,
        "title": "Exchanging within 2-digit subtraction",
        "battleCount": 4
      },
      {
        "id": "t11-m04",
        "order": 4,
        "title": "Complete 2-digit minus 2-digit subtraction",
        "battleCount": 4
      },
      {
        "id": "t11-m05",
        "order": 5,
        "title": "Extending column subtraction to 3-digit numbers",
        "battleCount": 4
      },
      {
        "id": "t11-m06",
        "order": 6,
        "title": "Single exchanging in 3-digit subtraction",
        "battleCount": 4
      },
      {
        "id": "t11-m07",
        "order": 7,
        "title": "Double exchanging and consolidation",
        "battleCount": 4
      },
      {
        "id": "t11-m08",
        "order": 8,
        "title": "Cumulative topic assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t12",
    "order": 12,
    "title": "Tens, hundreds and thousands",
    "mathTopicId": "tens_hundreds_thousands",
    "bossDex": 377,
    "modules": [
      {
        "id": "t12-m01",
        "order": 1,
        "title": "Order and compare multi-digit numbers",
        "battleCount": 4
      },
      {
        "id": "t12-m02",
        "order": 2,
        "title": "Add 10 and multiples of 10 to two-digit numbers",
        "battleCount": 5
      },
      {
        "id": "t12-m03",
        "order": 3,
        "title": "Add multiples of 10 to three-digit numbers",
        "battleCount": 5
      },
      {
        "id": "t12-m04",
        "order": 4,
        "title": "Subtract 10 and multiples of 10 across two- and three-digit numbers",
        "battleCount": 5
      },
      {
        "id": "t12-m05",
        "order": 5,
        "title": "Multiply single digits by 10 and 100",
        "battleCount": 4
      },
      {
        "id": "t12-m06",
        "order": 6,
        "title": "Multiply two-digit numbers by 10 and 100",
        "battleCount": 4
      },
      {
        "id": "t12-m07",
        "order": 7,
        "title": "Choose and apply multiplication by 10, 100 or 1,000",
        "battleCount": 5
      },
      {
        "id": "t12-m08",
        "order": 8,
        "title": "Recognise equivalent forms for multiplication by 100 and 1,000",
        "battleCount": 5
      },
      {
        "id": "t12-m09",
        "order": 9,
        "title": "Cumulative topic test",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t13",
    "order": 13,
    "title": "The 7 times table",
    "mathTopicId": "table_7",
    "bossDex": 378,
    "modules": [
      {
        "id": "t13-m01",
        "order": 1,
        "title": "Build and represent the 7 times table",
        "battleCount": 4
      },
      {
        "id": "t13-m02",
        "order": 2,
        "title": "Secure 7-times-table facts through ordered and mixed retrieval",
        "battleCount": 5
      },
      {
        "id": "t13-m03",
        "order": 3,
        "title": "Compare and consolidate the 7, 8, 9 and 10 times tables",
        "battleCount": 4
      },
      {
        "id": "t13-m04",
        "order": 4,
        "title": "Retrieve the 7, 8, 9 and 10 times tables in mixed order",
        "battleCount": 5
      },
      {
        "id": "t13-m05",
        "order": 5,
        "title": "Integrate the 7 times table with the full 1 to 10 times-table set",
        "battleCount": 4
      },
      {
        "id": "t13-m06",
        "order": 6,
        "title": "Demonstrate full 1 to 10 times-table fluency with emphasis on 7s",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t14",
    "order": 14,
    "title": "Dividing by numbers up to 10",
    "mathTopicId": "dividing_to_10",
    "bossDex": 379,
    "modules": [
      {
        "id": "t14-m01",
        "order": 1,
        "title": "Division foundations and fact families",
        "battleCount": 4
      },
      {
        "id": "t14-m02",
        "order": 2,
        "title": "Division by 2, 5 and 10",
        "battleCount": 4
      },
      {
        "id": "t14-m03",
        "order": 3,
        "title": "Division by 3, 6 and 9",
        "battleCount": 4
      },
      {
        "id": "t14-m04",
        "order": 4,
        "title": "Division by 4 and 8",
        "battleCount": 4
      },
      {
        "id": "t14-m05",
        "order": 5,
        "title": "Division by 7",
        "battleCount": 4
      },
      {
        "id": "t14-m06",
        "order": 6,
        "title": "Mixed exact division by 2 to 10",
        "battleCount": 5
      },
      {
        "id": "t14-m07",
        "order": 7,
        "title": "Cumulative division mastery check",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t15",
    "order": 15,
    "title": "Dividing with remainders",
    "mathTopicId": "dividing_remainders",
    "bossDex": 380,
    "modules": [
      {
        "id": "t15-m01",
        "order": 1,
        "title": "Meaning of division with a remainder",
        "battleCount": 5
      },
      {
        "id": "t15-m02",
        "order": 2,
        "title": "Remainders across related divisors",
        "battleCount": 5
      },
      {
        "id": "t15-m03",
        "order": 3,
        "title": "Dividing by 3, 6 and 9 with remainders",
        "battleCount": 5
      },
      {
        "id": "t15-m04",
        "order": 4,
        "title": "Comparing and selecting divisors in the 3, 6 and 9 group",
        "battleCount": 4
      },
      {
        "id": "t15-m05",
        "order": 5,
        "title": "Dividing by 4 and 8 with remainders",
        "battleCount": 5
      },
      {
        "id": "t15-m06",
        "order": 6,
        "title": "Comparing and selecting divisors in the 2, 4 and 8 group",
        "battleCount": 4
      },
      {
        "id": "t15-m07",
        "order": 7,
        "title": "Dividing by 7 with remainders",
        "battleCount": 5
      },
      {
        "id": "t15-m08",
        "order": 8,
        "title": "Dividing by any number from 2 to 10 with remainders",
        "battleCount": 5
      },
      {
        "id": "t15-m09",
        "order": 9,
        "title": "Cumulative remainder mastery",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t16",
    "order": 16,
    "title": "Numbers less than zero",
    "mathTopicId": "negatives",
    "bossDex": 381,
    "modules": [
      {
        "id": "t16-m01",
        "order": 1,
        "title": "Representing numbers less than zero",
        "battleCount": 4
      },
      {
        "id": "t16-m02",
        "order": 2,
        "title": "Comparing and ordering values around zero",
        "battleCount": 4
      },
      {
        "id": "t16-m03",
        "order": 3,
        "title": "Adding and subtracting single-digit integers",
        "battleCount": 4
      },
      {
        "id": "t16-m04",
        "order": 4,
        "title": "Adding and subtracting across zero with mixed operand sizes",
        "battleCount": 5
      },
      {
        "id": "t16-m05",
        "order": 5,
        "title": "Adding and subtracting two-digit integers",
        "battleCount": 4
      },
      {
        "id": "t16-m06",
        "order": 6,
        "title": "Cumulative negative-number fluency",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t17",
    "order": 17,
    "title": "Multiplying and dividing by tens, hundreds and thousands",
    "mathTopicId": "mult_div_powers10",
    "bossDex": 382,
    "modules": [
      {
        "id": "t17-m01",
        "order": 1,
        "title": "Re-establish scaling by powers of ten",
        "battleCount": 4
      },
      {
        "id": "t17-m02",
        "order": 2,
        "title": "Divide by 10 through place-value structure",
        "battleCount": 5
      },
      {
        "id": "t17-m03",
        "order": 3,
        "title": "Divide by 100 and 1,000 with exact whole-number results",
        "battleCount": 5
      },
      {
        "id": "t17-m04",
        "order": 4,
        "title": "Connect division by 5 to division by 10 and halving",
        "battleCount": 4
      },
      {
        "id": "t17-m05",
        "order": 5,
        "title": "Connect multiplication by 5 to multiplication by 10 and halving",
        "battleCount": 5
      },
      {
        "id": "t17-m06",
        "order": 6,
        "title": "Mixed multiplication and division by 5, 10, 100 and 1,000",
        "battleCount": 5
      }
    ]
  },
  {
    "id": "t18",
    "order": 18,
    "title": "The 11 and 12 times tables",
    "mathTopicId": "tables_11_12",
    "bossDex": 383,
    "modules": [
      {
        "id": "t18-m01",
        "order": 1,
        "title": "Establishing the 11 times table",
        "battleCount": 4
      },
      {
        "id": "t18-m02",
        "order": 2,
        "title": "Establishing the 12 times table",
        "battleCount": 4
      },
      {
        "id": "t18-m03",
        "order": 3,
        "title": "Consolidating 11 and 12 through structure and inverse links",
        "battleCount": 4
      },
      {
        "id": "t18-m04",
        "order": 4,
        "title": "Mixed retrieval across the 1 to 12 times tables",
        "battleCount": 5
      },
      {
        "id": "t18-m05",
        "order": 5,
        "title": "Applying multiplication and division facts across the 1 to 12 range",
        "battleCount": 5
      },
      {
        "id": "t18-m06",
        "order": 6,
        "title": "Cumulative Topic 18 mastery check",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t19",
    "order": 19,
    "title": "Lovely fractions",
    "mathTopicId": "fractions",
    "bossDex": 384,
    "modules": [
      {
        "id": "t19-m01",
        "order": 1,
        "title": "Fraction meaning and representation",
        "battleCount": 5
      },
      {
        "id": "t19-m02",
        "order": 2,
        "title": "Fractions as quantities: halves and quarters",
        "battleCount": 5
      },
      {
        "id": "t19-m03",
        "order": 3,
        "title": "Improper and mixed fractions",
        "battleCount": 5
      },
      {
        "id": "t19-m04",
        "order": 4,
        "title": "Eighths and equivalent forms",
        "battleCount": 4
      },
      {
        "id": "t19-m05",
        "order": 5,
        "title": "Comparing and ordering fractions",
        "battleCount": 5
      },
      {
        "id": "t19-m06",
        "order": 6,
        "title": "Sixteenths and denominator conversions",
        "battleCount": 4
      },
      {
        "id": "t19-m07",
        "order": 7,
        "title": "Numerators, denominators and fraction calculations",
        "battleCount": 4
      },
      {
        "id": "t19-m08",
        "order": 8,
        "title": "Simplifying fractions to lowest form",
        "battleCount": 4
      },
      {
        "id": "t19-m09",
        "order": 9,
        "title": "Fractions with powers of ten and cumulative assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t20",
    "order": 20,
    "title": "Lovely decimals",
    "mathTopicId": "decimals",
    "bossDex": 385,
    "modules": [
      {
        "id": "t20-m01",
        "order": 1,
        "title": "Decimal meaning and place value",
        "battleCount": 4
      },
      {
        "id": "t20-m02",
        "order": 2,
        "title": "Reading, representing and comparing decimals",
        "battleCount": 4
      },
      {
        "id": "t20-m03",
        "order": 3,
        "title": "Fraction-decimal equivalence",
        "battleCount": 4
      },
      {
        "id": "t20-m04",
        "order": 4,
        "title": "Multiplying decimals by 10 and 100",
        "battleCount": 4
      },
      {
        "id": "t20-m05",
        "order": 5,
        "title": "Dividing decimals by 10 and 100",
        "battleCount": 4
      },
      {
        "id": "t20-m06",
        "order": 6,
        "title": "Selecting and applying decimal scaling",
        "battleCount": 4
      },
      {
        "id": "t20-m07",
        "order": 7,
        "title": "Cumulative decimal assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t21",
    "order": 21,
    "title": "Starting long multiplication",
    "mathTopicId": "long_mult_start",
    "bossDex": 386,
    "modules": [
      {
        "id": "t21-m01",
        "order": 1,
        "title": "Multiplication-fact and place-value readiness",
        "battleCount": 4
      },
      {
        "id": "t21-m02",
        "order": 2,
        "title": "Two-digit by one-digit multiplication without carrying",
        "battleCount": 4
      },
      {
        "id": "t21-m03",
        "order": 3,
        "title": "Two-digit by one-digit multiplication with carrying",
        "battleCount": 4
      },
      {
        "id": "t21-m04",
        "order": 4,
        "title": "Multiplication by multiples of 10, 100 and 1,000",
        "battleCount": 4
      },
      {
        "id": "t21-m05",
        "order": 5,
        "title": "Three-digit by one-digit multiplication without carrying",
        "battleCount": 4
      },
      {
        "id": "t21-m06",
        "order": 6,
        "title": "Three-digit by one-digit multiplication with carrying in one place",
        "battleCount": 4
      },
      {
        "id": "t21-m07",
        "order": 7,
        "title": "Three-digit by one-digit multiplication with mixed carrying and checking",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t22",
    "order": 22,
    "title": "Starting long division",
    "mathTopicId": "long_div_start",
    "bossDex": 480,
    "modules": [
      {
        "id": "t22-m01",
        "order": 1,
        "title": "Division readiness and remainder review",
        "battleCount": 4
      },
      {
        "id": "t22-m02",
        "order": 2,
        "title": "Chunking as distributive division",
        "battleCount": 4
      },
      {
        "id": "t22-m03",
        "order": 3,
        "title": "Short division of 2-digit dividends without remainders",
        "battleCount": 4
      },
      {
        "id": "t22-m04",
        "order": 4,
        "title": "Short division of 3-digit dividends without remainders",
        "battleCount": 4
      },
      {
        "id": "t22-m05",
        "order": 5,
        "title": "Short division with remainders",
        "battleCount": 4
      },
      {
        "id": "t22-m06",
        "order": 6,
        "title": "Consolidated short-division practice and checking",
        "battleCount": 4
      },
      {
        "id": "t22-m07",
        "order": 7,
        "title": "Interpreting and rounding remainders",
        "battleCount": 4
      },
      {
        "id": "t22-m08",
        "order": 8,
        "title": "Cumulative long-division readiness assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t23",
    "order": 23,
    "title": "Starting percentages",
    "mathTopicId": "percentages_start",
    "bossDex": 481,
    "modules": [
      {
        "id": "t23-m01",
        "order": 1,
        "title": "Decimal place-value readiness for percentage work",
        "battleCount": 4
      },
      {
        "id": "t23-m02",
        "order": 2,
        "title": "Benchmark fraction to percentage conversions",
        "battleCount": 4
      },
      {
        "id": "t23-m03",
        "order": 3,
        "title": "Extending fraction to percentage conversions",
        "battleCount": 4
      },
      {
        "id": "t23-m04",
        "order": 4,
        "title": "Decimal to percentage and percentage to decimal conversions",
        "battleCount": 4
      },
      {
        "id": "t23-m05",
        "order": 5,
        "title": "Integrated fraction, decimal and percentage equivalence",
        "battleCount": 4
      },
      {
        "id": "t23-m06",
        "order": 6,
        "title": "Starting percentages cumulative assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t24",
    "order": 24,
    "title": "More decimals",
    "mathTopicId": "more_decimals",
    "bossDex": 482,
    "modules": [
      {
        "id": "t24-m01",
        "order": 1,
        "title": "Decimal notation and money contexts",
        "battleCount": 4
      },
      {
        "id": "t24-m02",
        "order": 2,
        "title": "Adding decimals by place value",
        "battleCount": 4
      },
      {
        "id": "t24-m03",
        "order": 3,
        "title": "Subtracting decimals by place value",
        "battleCount": 4
      },
      {
        "id": "t24-m04",
        "order": 4,
        "title": "Rounding decimals and judging precision",
        "battleCount": 4
      },
      {
        "id": "t24-m05",
        "order": 5,
        "title": "Multiplying decimals by a single digit",
        "battleCount": 4
      },
      {
        "id": "t24-m06",
        "order": 6,
        "title": "Dividing a one-decimal-place decimal by a single digit",
        "battleCount": 4
      },
      {
        "id": "t24-m07",
        "order": 7,
        "title": "Mixed decimal calculation and checking",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t25",
    "order": 25,
    "title": "More fractions",
    "mathTopicId": "more_fractions",
    "bossDex": 483,
    "modules": [
      {
        "id": "t25-m01",
        "order": 1,
        "title": "Equivalence, cancellation and fraction readiness",
        "battleCount": 4
      },
      {
        "id": "t25-m02",
        "order": 2,
        "title": "Common denominators and the LCD",
        "battleCount": 4
      },
      {
        "id": "t25-m03",
        "order": 3,
        "title": "Adding and subtracting fractions with a common denominator",
        "battleCount": 4
      },
      {
        "id": "t25-m04",
        "order": 4,
        "title": "Combining several fractions",
        "battleCount": 4
      },
      {
        "id": "t25-m05",
        "order": 5,
        "title": "Improper fractions and mixed-number representations",
        "battleCount": 4
      },
      {
        "id": "t25-m06",
        "order": 6,
        "title": "Adding and subtracting mixed numbers",
        "battleCount": 4
      },
      {
        "id": "t25-m07",
        "order": 7,
        "title": "Finding fractions of whole numbers",
        "battleCount": 4
      },
      {
        "id": "t25-m08",
        "order": 8,
        "title": "Multiplying proper fractions and cumulative fraction fluency",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t26",
    "order": 26,
    "title": "Percentages and money",
    "mathTopicId": "percentages_money",
    "bossDex": 484,
    "modules": [
      {
        "id": "t26-m01",
        "order": 1,
        "title": "Percentage foundations and key benchmark percentages",
        "battleCount": 4
      },
      {
        "id": "t26-m02",
        "order": 2,
        "title": "Calculating simple percentages of whole numbers",
        "battleCount": 4
      },
      {
        "id": "t26-m03",
        "order": 3,
        "title": "Percentages of monetary amounts",
        "battleCount": 4
      },
      {
        "id": "t26-m04",
        "order": 4,
        "title": "Calculator percentages and method selection",
        "battleCount": 4
      },
      {
        "id": "t26-m05",
        "order": 5,
        "title": "Percentage increases and decreases in prices",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t27",
    "order": 27,
    "title": "Squares, square roots and cubes",
    "mathTopicId": "squares_roots_cubes",
    "bossDex": 487,
    "modules": [
      {
        "id": "t27-m01",
        "order": 1,
        "title": "Meaning and construction of square numbers",
        "battleCount": 4
      },
      {
        "id": "t27-m02",
        "order": 2,
        "title": "Square-number fluency and recognition",
        "battleCount": 4
      },
      {
        "id": "t27-m03",
        "order": 3,
        "title": "Operating with square numbers",
        "battleCount": 4
      },
      {
        "id": "t27-m04",
        "order": 4,
        "title": "Square roots as inverse reasoning",
        "battleCount": 4
      },
      {
        "id": "t27-m05",
        "order": 5,
        "title": "Cube numbers and multiplicative structure",
        "battleCount": 4
      },
      {
        "id": "t27-m06",
        "order": 6,
        "title": "Integrated squares, roots and cubes review",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t28",
    "order": 28,
    "title": "Being brilliant at long multiplication",
    "mathTopicId": "long_mult_pro",
    "bossDex": 494,
    "modules": [
      {
        "id": "t28-m01",
        "order": 1,
        "title": "Reactivate column multiplication and place-value alignment",
        "battleCount": 4
      },
      {
        "id": "t28-m02",
        "order": 2,
        "title": "Build two-digit by two-digit multiplication without carrying",
        "battleCount": 4
      },
      {
        "id": "t28-m03",
        "order": 3,
        "title": "Extend two-digit by two-digit multiplication with carrying",
        "battleCount": 4
      },
      {
        "id": "t28-m04",
        "order": 4,
        "title": "Multiply three-digit numbers by two-digit numbers without carrying",
        "battleCount": 4
      },
      {
        "id": "t28-m05",
        "order": 5,
        "title": "Manage carrying in three-digit by two-digit multiplication",
        "battleCount": 4
      },
      {
        "id": "t28-m06",
        "order": 6,
        "title": "Multiply three-digit numbers by three-digit numbers without carrying",
        "battleCount": 4
      },
      {
        "id": "t28-m07",
        "order": 7,
        "title": "Complete three-digit by three-digit multiplication with carrying and independent checking",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t29",
    "order": 29,
    "title": "Being brilliant at long division",
    "mathTopicId": "long_div_pro",
    "bossDex": 638,
    "modules": [
      {
        "id": "t29-m01",
        "order": 1,
        "title": "Two-digit divisors and quotient construction",
        "battleCount": 4
      },
      {
        "id": "t29-m02",
        "order": 2,
        "title": "Three-digit dividends divided by two-digit numbers",
        "battleCount": 4
      },
      {
        "id": "t29-m03",
        "order": 3,
        "title": "Four-digit dividends divided by two-digit numbers",
        "battleCount": 4
      },
      {
        "id": "t29-m04",
        "order": 4,
        "title": "Extending division into decimal answers",
        "battleCount": 4
      },
      {
        "id": "t29-m05",
        "order": 5,
        "title": "Decimal precision with larger dividends and two-digit divisors",
        "battleCount": 4
      },
      {
        "id": "t29-m06",
        "order": 6,
        "title": "Three-digit divisors and larger whole-number division",
        "battleCount": 4
      },
      {
        "id": "t29-m07",
        "order": 7,
        "title": "Cumulative long-division mastery",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t30",
    "order": 30,
    "title": "Number patterns and sequences",
    "mathTopicId": "sequences_patterns",
    "bossDex": 641,
    "modules": [
      {
        "id": "t30-m01",
        "order": 1,
        "title": "Classifying odd and even patterns",
        "battleCount": 4
      },
      {
        "id": "t30-m02",
        "order": 2,
        "title": "Factors, multiples and prime factors",
        "battleCount": 4
      },
      {
        "id": "t30-m03",
        "order": 3,
        "title": "Recognising and generating square number sequences",
        "battleCount": 4
      },
      {
        "id": "t30-m04",
        "order": 4,
        "title": "Recognising and generating cube number sequences",
        "battleCount": 4
      },
      {
        "id": "t30-m05",
        "order": 5,
        "title": "Building triangular number sequences",
        "battleCount": 4
      },
      {
        "id": "t30-m06",
        "order": 6,
        "title": "Building and extending the Fibonacci sequence",
        "battleCount": 4
      },
      {
        "id": "t30-m07",
        "order": 7,
        "title": "Identifying, continuing and explaining sequence rules",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t31",
    "order": 31,
    "title": "Ratio and proportion",
    "mathTopicId": "ratio_proportion",
    "bossDex": 643,
    "modules": [
      {
        "id": "t31-m01",
        "order": 1,
        "title": "Ratio language and equivalent relationships",
        "battleCount": 4
      },
      {
        "id": "t31-m02",
        "order": 2,
        "title": "Multiplicative scaling up",
        "battleCount": 4
      },
      {
        "id": "t31-m03",
        "order": 3,
        "title": "Multiplicative scaling down",
        "battleCount": 4
      },
      {
        "id": "t31-m04",
        "order": 4,
        "title": "Sharing a quantity in proportion",
        "battleCount": 4
      },
      {
        "id": "t31-m05",
        "order": 5,
        "title": "Proportion in currency conversions",
        "battleCount": 4
      },
      {
        "id": "t31-m06",
        "order": 6,
        "title": "Proportion in imperial and metric conversions",
        "battleCount": 4
      },
      {
        "id": "t31-m07",
        "order": 7,
        "title": "Integrated ratio and proportion mastery",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t32",
    "order": 32,
    "title": "Estimating and checking",
    "mathTopicId": "estimating",
    "bossDex": 646,
    "modules": [
      {
        "id": "t32-m01",
        "order": 1,
        "title": "Estimation purpose and plausibility",
        "battleCount": 4
      },
      {
        "id": "t32-m02",
        "order": 2,
        "title": "Rounding, significant figures, and required precision",
        "battleCount": 4
      },
      {
        "id": "t32-m03",
        "order": 3,
        "title": "Estimating addition and subtraction",
        "battleCount": 4
      },
      {
        "id": "t32-m04",
        "order": 4,
        "title": "Checking addition and subtraction",
        "battleCount": 4
      },
      {
        "id": "t32-m05",
        "order": 5,
        "title": "Estimating multiplication and division",
        "battleCount": 4
      },
      {
        "id": "t32-m06",
        "order": 6,
        "title": "Checking multiplication and division",
        "battleCount": 4
      },
      {
        "id": "t32-m07",
        "order": 7,
        "title": "Choosing methods and applying estimation across operations",
        "battleCount": 4
      },
      {
        "id": "t32-m08",
        "order": 8,
        "title": "Cumulative estimation and checking assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t33",
    "order": 33,
    "title": "Number skills",
    "mathTopicId": "number_skills",
    "bossDex": 649,
    "modules": [
      {
        "id": "t33-m01",
        "order": 1,
        "title": "Rounding and approximation",
        "battleCount": 4
      },
      {
        "id": "t33-m02",
        "order": 2,
        "title": "Negative numbers and directed calculation",
        "battleCount": 4
      },
      {
        "id": "t33-m03",
        "order": 3,
        "title": "Factors and multiples as number structure",
        "battleCount": 4
      },
      {
        "id": "t33-m04",
        "order": 4,
        "title": "Square numbers within numerical expressions",
        "battleCount": 4
      },
      {
        "id": "t33-m05",
        "order": 5,
        "title": "Integrated number skills and checking",
        "battleCount": 4
      },
      {
        "id": "t33-m06",
        "order": 6,
        "title": "Topic mastery assessment",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t34",
    "order": 34,
    "title": "Fractions, decimals and percentages",
    "mathTopicId": "fdp",
    "bossDex": 716,
    "modules": [
      {
        "id": "t34-m01",
        "order": 1,
        "title": "Fraction fluency and application, including equivalence, comparison, calculation, and finding fractions of quantities",
        "battleCount": 4
      },
      {
        "id": "t34-m02",
        "order": 2,
        "title": "Decimal fluency and application, including place value, ordering, calculation, and interpretation of decimal quantities",
        "battleCount": 4
      },
      {
        "id": "t34-m03",
        "order": 3,
        "title": "Percentage fluency and application, including percentage quantities, comparison, and percentage change",
        "battleCount": 4
      },
      {
        "id": "t34-m04",
        "order": 4,
        "title": "Connecting fractions, decimals and percentages in mixed problems, selecting efficient representations and checking reasonableness",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t35",
    "order": 35,
    "title": "Ratio and proportion",
    "mathTopicId": "ratio_proportion_2",
    "bossDex": 720,
    "modules": [
      {
        "id": "t35-m01",
        "order": 1,
        "title": "Direct proportion and multiplicative relationships",
        "battleCount": 4
      },
      {
        "id": "t35-m02",
        "order": 2,
        "title": "Writing and interpreting ratios",
        "battleCount": 4
      },
      {
        "id": "t35-m03",
        "order": 3,
        "title": "Applying ratios to calculate quantities",
        "battleCount": 4
      },
      {
        "id": "t35-m04",
        "order": 4,
        "title": "Comparing proportions through percentages",
        "battleCount": 4
      },
      {
        "id": "t35-m05",
        "order": 5,
        "title": "Integrated ratio and proportion reasoning",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t36",
    "order": 36,
    "title": "Starting algebra",
    "mathTopicId": "algebra_start",
    "bossDex": 785,
    "modules": [
      {
        "id": "t36-m01",
        "order": 1,
        "title": "Algebraic number operations and conventions",
        "battleCount": 4
      },
      {
        "id": "t36-m02",
        "order": 2,
        "title": "Function machines: inputs, outputs and rules",
        "battleCount": 4
      },
      {
        "id": "t36-m03",
        "order": 3,
        "title": "From rules to algebraic expressions",
        "battleCount": 4
      },
      {
        "id": "t36-m04",
        "order": 4,
        "title": "Substitution and evaluating formulae",
        "battleCount": 4
      },
      {
        "id": "t36-m05",
        "order": 5,
        "title": "Integrated starting-algebra reasoning and review",
        "battleCount": 4
      }
    ]
  },
  {
    "id": "t37",
    "order": 37,
    "title": "Sequences",
    "mathTopicId": "sequences",
    "bossDex": 1001,
    "modules": [
      {
        "id": "t37-m01",
        "order": 1,
        "title": "Describe and extend term-to-term rules",
        "battleCount": 4
      },
      {
        "id": "t37-m02",
        "order": 2,
        "title": "Generate terms from position and nth-term rules",
        "battleCount": 4
      },
      {
        "id": "t37-m03",
        "order": 3,
        "title": "Distinguish and work with arithmetic and geometric sequences",
        "battleCount": 4
      },
      {
        "id": "t37-m04",
        "order": 4,
        "title": "Apply and consolidate sequence reasoning",
        "battleCount": 4
      }
    ]
  }
];

const BATTLE_BLUEPRINTS: { mode: Exclude<BattleMode, 'boss'>; label: string; questionCount: number }[] = [
  { mode: 'discover', label: 'Discover', questionCount: 8 },
  { mode: 'apply', label: 'Apply', questionCount: 10 },
  { mode: 'master', label: 'Master', questionCount: 12 },
  { mode: 'challenge', label: 'Challenge', questionCount: 14 },
  { mode: 'elite', label: 'Elite', questionCount: 16 },
];

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(value, high));
}

function buildCurriculum(): CurriculumTopic[] {
  const bossDex = new Set(TOPIC_SEEDS.map((topic) => topic.bossDex));
  const ordinaryDex = Array.from({ length: 1025 }, (_, index) => index + 1).filter((dex) => !bossDex.has(dex));
  let ordinaryCursor = 0;

  return TOPIC_SEEDS.map((seed) => {
    const totalBattles = seed.modules.reduce((total, module) => total + module.battleCount, 0);
    let topicBattlePosition = 0;
    const modules: CurriculumModule[] = seed.modules.map((moduleSeed) => {
      const battles: CurriculumBattle[] = Array.from({ length: moduleSeed.battleCount }, (_, index) => {
        const blueprint = BATTLE_BLUEPRINTS[index] ?? BATTLE_BLUEPRINTS[BATTLE_BLUEPRINTS.length - 1];
        const dex = ordinaryDex[ordinaryCursor++];
        if (dex == null) throw new Error('Curriculum allocation exceeded the ordinary Pokédex pool');
        const level = clamp(1 + Math.floor((topicBattlePosition / Math.max(totalBattles, 1)) * 6), 1, 6);
        topicBattlePosition += 1;
        return {
          id: `${moduleSeed.id}-b${String(index + 1).padStart(2, '0')}`,
          topicId: seed.id,
          moduleId: moduleSeed.id,
          order: index + 1,
          title: `${blueprint.label}: ${moduleSeed.title}`,
          mode: blueprint.mode,
          dex,
          questionCount: blueprint.questionCount,
          level,
          isBoss: false,
        };
      });
      return { ...moduleSeed, topicId: seed.id, battles };
    });
    const boss: CurriculumBattle = {
      id: `${seed.id}-boss`,
      topicId: seed.id,
      moduleId: null,
      order: seed.modules.length + 1,
      title: `${seed.title} Mastery Boss`,
      mode: 'boss',
      dex: seed.bossDex,
      questionCount: 15,
      level: 6,
      isBoss: true,
      timeLimitSec: 180,
    };
    return { ...seed, modules, boss };
  });
}


export const CURRICULUM_TOPICS: CurriculumTopic[] = buildCurriculum();
export const CURRICULUM_BATTLES: CurriculumBattle[] = CURRICULUM_TOPICS.flatMap((topic) => [
  ...topic.modules.flatMap((module) => module.battles),
  topic.boss,
]);

const TOPIC_INDEX = new Map(CURRICULUM_TOPICS.map((topic) => [topic.id, topic]));
const MODULE_INDEX = new Map(CURRICULUM_TOPICS.flatMap((topic) => topic.modules.map((module) => [module.id, module])));
const BATTLE_INDEX = new Map(CURRICULUM_BATTLES.map((battle) => [battle.id, battle]));
const DEX_INDEX = new Map(CURRICULUM_BATTLES.map((battle) => [battle.dex, battle]));

export function getCurriculumTopic(topicId: string): CurriculumTopic | undefined {
  return TOPIC_INDEX.get(topicId);
}

export function getCurriculumModule(moduleId: string): CurriculumModule | undefined {
  return MODULE_INDEX.get(moduleId);
}

export function getCurriculumBattle(battleId: string): CurriculumBattle | undefined {
  return BATTLE_INDEX.get(battleId);
}

export function getCurriculumBattleByDex(dex: number): CurriculumBattle | undefined {
  return DEX_INDEX.get(dex);
}

export function getPreviousTopic(topicId: string): CurriculumTopic | undefined {
  const topic = getCurriculumTopic(topicId);
  return topic && topic.order > 1 ? CURRICULUM_TOPICS[topic.order - 2] : undefined;
}

export function battleModeLabel(mode: BattleMode): string {
  return ({ discover: 'DISCOVER', apply: 'APPLY', master: 'MASTER', challenge: 'CHALLENGE', elite: 'ELITE', boss: 'LEGENDARY BOSS' })[mode];
}

export function isBossBattle(battleId: string): boolean {
  return getCurriculumBattle(battleId)?.isBoss ?? false;
}

export function curriculumSummary(): { topics: number; modules: number; battles: number; bosses: number } {
  return {
    topics: CURRICULUM_TOPICS.length,
    modules: CURRICULUM_TOPICS.reduce((count, topic) => count + topic.modules.length, 0),
    battles: CURRICULUM_BATTLES.length,
    bosses: CURRICULUM_TOPICS.length,
  };
}
