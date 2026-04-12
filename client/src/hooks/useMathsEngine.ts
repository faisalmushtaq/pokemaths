import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CORRECT_ANSWER_MESSAGES,
  LEVELS,
  SCORE_CONFIG,
  WRONG_ANSWER_MESSAGES,
  type LevelConfig,
  type QuestionType,
} from '@/lib/gameConstants';

export interface Question {
  text: string;       // e.g. "3 + 4 = ?"
  answer: number;
  hint: string;       // shown after wrong answer
}

export type GameScreen =
  | 'menu'
  | 'playing'
  | 'evolving'    // evolution animation between levels
  | 'victory'     // all levels complete
  | 'levelSelect';

export interface GameState {
  screen: GameScreen;
  currentLevelIndex: number;
  score: number;
  correctCount: number;       // correct answers this level
  wrongCount: number;         // wrong answers this level (total)
  currentQuestion: Question | null;
  feedback: string | null;    // shown briefly after answer
  feedbackCorrect: boolean;
  levelElapsed: number;       // seconds elapsed this level
  levelTimes: number[];       // time taken per completed level
  totalTime: number;
  confetti: boolean;
  isArcadeMode: boolean;      // true = all levels, false = single level
  startLevelIndex: number;    // which level we started from
  questionStartTime: number;  // timestamp when current question was shown
}

function generateQuestion(types: QuestionType[], maxNumber: number): Question {
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'addition') {
    const a = Math.floor(Math.random() * maxNumber) + 1;
    const b = Math.floor(Math.random() * maxNumber) + 1;
    return {
      text: `${a} + ${b} = ?`,
      answer: a + b,
      hint: `Count up ${b} from ${a}`,
    };
  }

  if (type === 'subtraction') {
    const a = Math.floor(Math.random() * maxNumber) + 1;
    const b = Math.floor(Math.random() * a) + 1; // ensure b <= a so answer >= 0
    return {
      text: `${a} - ${b} = ?`,
      answer: a - b,
      hint: `Count back ${b} from ${a}`,
    };
  }

  if (type === 'times_2_5_10') {
    const multipliers = [2, 5, 10];
    const m = multipliers[Math.floor(Math.random() * multipliers.length)];
    const n = Math.floor(Math.random() * maxNumber) + 1;
    return {
      text: `${m} × ${n} = ?`,
      answer: m * n,
      hint: `${m} times table: ${m} × ${n}`,
    };
  }

  if (type === 'times_1_to_12') {
    const m = Math.floor(Math.random() * 12) + 1;
    const n = Math.floor(Math.random() * maxNumber) + 1;
    return {
      text: `${m} × ${n} = ?`,
      answer: m * n,
      hint: `${m} × ${n} = ${m * n}`,
    };
  }

  if (type === 'times_hard') {
    const hardTables = [6, 7, 8, 9, 11, 12];
    const m = hardTables[Math.floor(Math.random() * hardTables.length)];
    const n = Math.floor(Math.random() * maxNumber) + 1;
    return {
      text: `${m} × ${n} = ?`,
      answer: m * n,
      hint: `${m} × ${n} = ${m * n}`,
    };
  }

  // fallback
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { text: `${a} + ${b} = ?`, answer: a + b, hint: `${a} + ${b}` };
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useMathsEngine() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<GameState>({
    screen: 'menu',
    currentLevelIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    currentQuestion: null,
    feedback: null,
    feedbackCorrect: false,
    levelElapsed: 0,
    levelTimes: [],
    totalTime: 0,
    confetti: false,
    isArcadeMode: true,
    startLevelIndex: 0,
    questionStartTime: Date.now(),
  });

  // Timer tick
  useEffect(() => {
    if (state.screen === 'playing') {
      timerRef.current = setInterval(() => {
        setState(s => ({ ...s, levelElapsed: s.levelElapsed + 1, totalTime: s.totalTime + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.screen]);

  const currentLevel: LevelConfig = LEVELS[state.currentLevelIndex];

  const startGame = useCallback((levelIndex = 0, arcadeMode = true) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    const level = LEVELS[levelIndex];
    setState({
      screen: 'playing',
      currentLevelIndex: levelIndex,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      currentQuestion: generateQuestion(level.questionTypes, level.maxNumber),
      feedback: null,
      feedbackCorrect: false,
      levelElapsed: 0,
      levelTimes: [],
      totalTime: 0,
      confetti: false,
      isArcadeMode: arcadeMode,
      startLevelIndex: levelIndex,
      questionStartTime: Date.now(),
    });
  }, []);

  const nextQuestion = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setState(s => ({
      ...s,
      currentQuestion: generateQuestion(level.questionTypes, level.maxNumber),
      questionStartTime: Date.now(),
    }));
  }, []);

  const submitAnswer = useCallback((userAnswer: number) => {
    setState(s => {
      if (!s.currentQuestion || s.screen !== 'playing') return s;

      const isCorrect = userAnswer === s.currentQuestion.answer;
      const elapsed = (Date.now() - s.questionStartTime) / 1000;
      const speedBonus = isCorrect && elapsed <= SCORE_CONFIG.speedBonusThreshold
        ? SCORE_CONFIG.speedBonusPoints : 0;
      const points = isCorrect ? SCORE_CONFIG.pointsPerCorrect + speedBonus : 0;

      const newCorrect = s.correctCount + (isCorrect ? 1 : 0);
      const newWrong = s.wrongCount + (isCorrect ? 0 : 1);
      const level = LEVELS[s.currentLevelIndex];
      const levelComplete = isCorrect && newCorrect >= level.questionsToEvolve;

      const feedbackMsg = isCorrect
        ? randomFrom(CORRECT_ANSWER_MESSAGES) + (speedBonus > 0 ? ` +${speedBonus} SPEED BONUS!` : '')
        : randomFrom(WRONG_ANSWER_MESSAGES);

      const newLevelTimes = levelComplete
        ? [...s.levelTimes, s.levelElapsed]
        : s.levelTimes;

      const newScore = s.score + points + (levelComplete ? SCORE_CONFIG.evolutionBonus : 0);

      return {
        ...s,
        score: newScore,
        correctCount: newCorrect,
        wrongCount: newWrong,
        feedback: feedbackMsg,
        feedbackCorrect: isCorrect,
        levelTimes: newLevelTimes,
        screen: levelComplete ? 'evolving' : 'playing',
        currentQuestion: levelComplete ? s.currentQuestion : generateQuestion(level.questionTypes, level.maxNumber),
        questionStartTime: Date.now(),
      };
    });

    // Clear feedback after 1.5s
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setState(s => ({ ...s, feedback: null }));
    }, 1500);
  }, []);

  const advanceAfterEvolution = useCallback(() => {
    setState(s => {
      const nextIndex = s.currentLevelIndex + 1;
      const isLastLevel = nextIndex >= LEVELS.length || (!s.isArcadeMode);

      if (isLastLevel) {
        return {
          ...s,
          screen: 'victory',
          confetti: true,
        };
      }

      const nextLevel = LEVELS[nextIndex];
      return {
        ...s,
        screen: 'playing',
        currentLevelIndex: nextIndex,
        correctCount: 0,
        wrongCount: 0,
        levelElapsed: 0,
        currentQuestion: generateQuestion(nextLevel.questionTypes, nextLevel.maxNumber),
        questionStartTime: Date.now(),
      };
    });
  }, []);

  const goToMenu = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setState(s => ({
      ...s,
      screen: 'menu',
      confetti: false,
      feedback: null,
    }));
  }, []);

  const goToLevelSelect = useCallback(() => {
    setState(s => ({ ...s, screen: 'levelSelect' }));
  }, []);

  return {
    state,
    currentLevel,
    startGame,
    submitAnswer,
    advanceAfterEvolution,
    goToMenu,
    goToLevelSelect,
    nextQuestion,
  };
}
