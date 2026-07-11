import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CORRECT_ANSWER_MESSAGES,
  SCORE_CONFIG,
  WRONG_ANSWER_MESSAGES,
} from '@/lib/gameConstants';
import { findBattle } from '@/lib/regions';
import { getTopic, isAnswerCorrect, type Question } from '@/lib/topics';
import {
  loadSave,
  recordWin,
  type SaveData,
} from '@/lib/pokedex';

export type GameScreen =
  | 'menu'
  | 'regionSelect'
  | 'battleSelect'
  | 'playing'
  | 'caught' // battle won at 100% — Pokémon caught
  | 'failed' // wrong answer or ran out of time
  | 'pokedex';

export interface GameState {
  screen: GameScreen;
  regionId: string | null;
  battleId: string | null;
  question: Question | null;
  questionIndex: number; // 0-based within the battle
  correctCount: number;
  score: number;
  feedback: string | null;
  feedbackCorrect: boolean;
  timeRemaining: number | null; // seconds; null when not a timed boss battle
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INITIAL: GameState = {
  screen: 'menu',
  regionId: null,
  battleId: null,
  question: null,
  questionIndex: 0,
  correctCount: 0,
  score: 0,
  feedback: null,
  feedbackCorrect: false,
  timeRemaining: null,
};

export function useGame() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [state, setState] = useState<GameState>(INITIAL);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStart = useRef<number>(Date.now());

  const clearFeedbackTimer = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  };

  // --- navigation -----------------------------------------------------------
  const goMenu = useCallback(() => {
    clearFeedbackTimer();
    setState((s) => ({ ...INITIAL, screen: 'menu', score: s.score }));
  }, []);

  const goRegionSelect = useCallback(() => {
    setState((s) => ({ ...s, screen: 'regionSelect' }));
  }, []);

  const goPokedex = useCallback(() => {
    setState((s) => ({ ...s, screen: 'pokedex' }));
  }, []);

  const openRegion = useCallback((regionId: string) => {
    setState((s) => ({ ...s, screen: 'battleSelect', regionId }));
  }, []);

  // --- battle lifecycle -----------------------------------------------------
  const startBattle = useCallback((battleId: string) => {
    const found = findBattle(battleId);
    if (!found) return;
    const { region, battle } = found;
    const topic = getTopic(battle.topic);
    questionStart.current = Date.now();
    setState({
      screen: 'playing',
      regionId: region.id,
      battleId: battle.id,
      question: topic.generate(),
      questionIndex: 0,
      correctCount: 0,
      score: 0,
      feedback: null,
      feedbackCorrect: false,
      timeRemaining: battle.timeLimitSec ?? null,
    });
  }, []);

  const submitAnswer = useCallback(
    (typed: number) => {
      setState((s) => {
        if (s.screen !== 'playing' || !s.question || !s.battleId) return s;
        const found = findBattle(s.battleId);
        if (!found) return s;
        const { region, battle } = found;

        const correct = isAnswerCorrect(s.question, typed);

        // Wrong answer ends the battle — catching needs 100% accuracy.
        if (!correct) {
          return {
            ...s,
            screen: 'failed',
            feedback: randomFrom(WRONG_ANSWER_MESSAGES),
            feedbackCorrect: false,
            timeRemaining: null,
          };
        }

        const elapsed = (Date.now() - questionStart.current) / 1000;
        const speedBonus =
          elapsed <= SCORE_CONFIG.speedBonusThreshold
            ? SCORE_CONFIG.speedBonusPoints
            : 0;
        const nextCorrect = s.correctCount + 1;
        const nextScore = s.score + SCORE_CONFIG.pointsPerCorrect + speedBonus;
        const won = nextCorrect >= battle.questionCount;

        if (won) {
          // Catch! Persist to the Pokédex.
          setSave((prev) =>
            recordWin(prev, battle.id, {
              dex: battle.dex,
              name: battle.pokemon,
              region: region.id,
              caughtAt: Date.now(),
            }),
          );
          return {
            ...s,
            screen: 'caught',
            correctCount: nextCorrect,
            score: nextScore + SCORE_CONFIG.evolutionBonus,
            feedback: null,
            feedbackCorrect: true,
            timeRemaining: null,
          };
        }

        // Next question
        const topic = getTopic(battle.topic);
        questionStart.current = Date.now();
        return {
          ...s,
          question: topic.generate(),
          questionIndex: s.questionIndex + 1,
          correctCount: nextCorrect,
          score: nextScore,
          feedback:
            randomFrom(CORRECT_ANSWER_MESSAGES) +
            (speedBonus > 0 ? ` +${speedBonus}` : ''),
          feedbackCorrect: true,
        };
      });

      // flash feedback briefly
      clearFeedbackTimer();
      feedbackTimer.current = setTimeout(() => {
        setState((s) => (s.screen === 'playing' ? { ...s, feedback: null } : s));
      }, 1200);
    },
    [],
  );

  // Boss countdown timer
  useEffect(() => {
    if (state.screen !== 'playing' || state.timeRemaining === null) return;
    const id = setInterval(() => {
      setState((s) => {
        if (s.screen !== 'playing' || s.timeRemaining === null) return s;
        if (s.timeRemaining <= 1) {
          return { ...s, screen: 'failed', timeRemaining: 0, feedback: "Time's up!" };
        }
        return { ...s, timeRemaining: s.timeRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.screen, state.timeRemaining === null]);

  useEffect(() => () => clearFeedbackTimer(), []);

  const retryBattle = useCallback(() => {
    if (state.battleId) startBattle(state.battleId);
  }, [state.battleId, startBattle]);

  // Derived: the region/battle currently in play
  const active = state.battleId ? findBattle(state.battleId) : undefined;

  return {
    save,
    state,
    activeBattle: active?.battle ?? null,
    activeRegion: active?.region ?? null,
    goMenu,
    goRegionSelect,
    goPokedex,
    openRegion,
    startBattle,
    submitAnswer,
    retryBattle,
  };
}
