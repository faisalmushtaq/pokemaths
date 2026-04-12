// =============================================================================
// POKÉMATHS — GAME CONSTANTS
// =============================================================================
// This file controls everything about the game difficulty and content.
// Edit the LEVELS array below to adjust questions per level, question types,
// and the Pokémon involved.
// =============================================================================

export type QuestionType =
  | 'addition'        // e.g. 3 + 4 = ?
  | 'subtraction'     // e.g. 9 - 3 = ?
  | 'times_2_5_10'    // mixed 2, 5, 10 times tables
  | 'times_1_to_12'   // any times table 1–12
  | 'times_hard';     // harder mixed tables (6, 7, 8, 9, 11, 12)

export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  questionsToEvolve: number;
  questionTypes: QuestionType[];
  maxNumber: number;
  basePokemon: PokemonData;
  evolvedPokemon: PokemonData;
  bgGradient: string;
  accentColor: string;
}

export interface PokemonData {
  name: string;
  sprite: string;
  cry: string;
}

// ---------------------------------------------------------------------------
// ASSET URLS — generated pixel art sprites
// ---------------------------------------------------------------------------
const SPRITES = {
  fletchling:     'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-fletchling-84gGckdRrZgwosChLJZyvd.png',
  fletchinder:    'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-fletchinder-CazwD9qvsKJ59EBHEUiFGh.png',
  psyduck:        'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-psyduck-3tfuU3qSH4ofRXNx8Vebfx.png',
  golduck:        'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-golduck-L37wePBTThkZaFy7iiedTA.png',
  charmeleon:     'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-charmeleon-cpLD2WsFsqiiXexsULwVEk.png',
  charizard:      'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-charizard-XQNWDvpMp8aggzGgzUJoR7.png',
  talonflame:     'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-talonflame-iwuHZkFDJFSEvkpCqazaKb.png',
  megaCharizardX: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-mega-charizard-x-cHcuhXWWu9NRqxyARnobff.png',
};

// ---------------------------------------------------------------------------
// LEVELS — edit questionsToEvolve and maxNumber to adjust difficulty
// ---------------------------------------------------------------------------
export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Beginner',
    subtitle: 'Addition',
    questionsToEvolve: 5,
    questionTypes: ['addition'],
    maxNumber: 10,
    bgGradient: 'linear-gradient(135deg, #0c1445 0%, #0a2a6e 50%, #0d1b3e 100%)',
    accentColor: '#38bdf8',
    basePokemon: {
      name: 'Fletchling',
      sprite: SPRITES.fletchling,
      cry: 'Fletchling wants to fly! Help it power up with addition!',
    },
    evolvedPokemon: {
      name: 'Fletchinder',
      sprite: SPRITES.fletchinder,
      cry: 'Fletchling evolved into Fletchinder! Amazing maths skills!',
    },
  },
  {
    id: 2,
    name: 'Intermediate',
    subtitle: 'Subtraction',
    questionsToEvolve: 5,
    questionTypes: ['subtraction'],
    maxNumber: 20,
    bgGradient: 'linear-gradient(135deg, #1a0a3e 0%, #2d1b69 50%, #1a0a3e 100%)',
    accentColor: '#a78bfa',
    basePokemon: {
      name: 'Psyduck',
      sprite: SPRITES.psyduck,
      cry: 'Psyduck has a headache! Solve subtractions to cure it!',
    },
    evolvedPokemon: {
      name: 'Golduck',
      sprite: SPRITES.golduck,
      cry: 'Psyduck evolved into Golduck! Headache cured by maths!',
    },
  },
  {
    id: 3,
    name: 'Expert',
    subtitle: '2, 5 & 10 Times Tables',
    questionsToEvolve: 8,
    questionTypes: ['times_2_5_10'],
    maxNumber: 10,
    bgGradient: 'linear-gradient(135deg, #3d0a00 0%, #7c1a00 50%, #3d0a00 100%)',
    accentColor: '#fb923c',
    basePokemon: {
      name: 'Charmeleon',
      sprite: SPRITES.charmeleon,
      cry: 'Charmeleon is training hard! Master the 2, 5 and 10 times tables!',
    },
    evolvedPokemon: {
      name: 'Charizard',
      sprite: SPRITES.charizard,
      cry: 'Charmeleon evolved into Charizard! Times tables mastered!',
    },
  },
  {
    id: 4,
    name: 'Advanced',
    subtitle: 'All Times Tables (1–12)',
    questionsToEvolve: 10,
    questionTypes: ['times_1_to_12'],
    maxNumber: 12,
    bgGradient: 'linear-gradient(135deg, #002a1a 0%, #004d2e 50%, #002a1a 100%)',
    accentColor: '#34d399',
    basePokemon: {
      name: 'Fletchinder',
      sprite: SPRITES.fletchinder,
      cry: 'Fletchinder is soaring! Answer any times table to reach Talonflame!',
    },
    evolvedPokemon: {
      name: 'Talonflame',
      sprite: SPRITES.talonflame,
      cry: 'Fletchinder evolved into Talonflame! Times table champion!',
    },
  },
  {
    id: 5,
    name: 'Genius',
    subtitle: 'Hard Times Tables (6–12)',
    questionsToEvolve: 10,
    questionTypes: ['times_hard'],
    maxNumber: 12,
    bgGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
    accentColor: '#60a5fa',
    basePokemon: {
      name: 'Charizard',
      sprite: SPRITES.charizard,
      cry: 'Charizard senses a Mega Stone! Conquer the hardest tables!',
    },
    evolvedPokemon: {
      name: 'Mega Charizard X',
      sprite: SPRITES.megaCharizardX,
      cry: 'MEGA EVOLUTION! Charizard became Mega Charizard X! LEGENDARY!',
    },
  },
];

// ---------------------------------------------------------------------------
// SCORE SETTINGS
// ---------------------------------------------------------------------------
export const SCORE_CONFIG = {
  pointsPerCorrect: 100,
  speedBonusThreshold: 5,   // seconds — answer within this for bonus
  speedBonusPoints: 50,
  wrongAnswerPenalty: 0,
  evolutionBonus: 500,
};

// ---------------------------------------------------------------------------
// SPLASH / LOGO ASSETS
// ---------------------------------------------------------------------------
export const ASSETS = {
  logo:   'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-logo-8ngagY6NShWcpp6aToFar9.png',
  splash: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/pm-splash-cgyGqjARjy4W87aFcLgopd.png',
};

// ---------------------------------------------------------------------------
// FEEDBACK MESSAGES
// ---------------------------------------------------------------------------
export const WRONG_ANSWER_MESSAGES = [
  "Not quite! Try again! 💪",
  "Oops! Give it another go!",
  "So close! You can do it!",
  "Nearly there! Keep trying!",
  "Don't give up! Try again!",
  "Hmm, not this time! Have another go!",
];

export const CORRECT_ANSWER_MESSAGES = [
  "Brilliant! ⚡",
  "Amazing! 🌟",
  "Correct! Keep going!",
  "Superstar! ✨",
  "Fantastic! 🎉",
  "You're on fire! 🔥",
  "Incredible! 💥",
];

export const PIXEL_FONT = "'Press Start 2P', monospace";
