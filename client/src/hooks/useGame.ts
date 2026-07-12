import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CORRECT_ANSWER_MESSAGES,
  SCORE_CONFIG,
  WRONG_ANSWER_MESSAGES,
} from '@/lib/gameConstants';
import { findBattle } from '@/lib/regions';
import { getArcadeLevel } from '@/lib/arcade';
import { getTopic, isAnswerCorrect, levelForProgress, type Question } from '@/lib/topics';
import { loadSave, recordWin, recordTestUnlock, EMPTY_SAVE, type SaveData } from '@/lib/pokedex';
import { getName } from '@/lib/species';

export type GameMode = 'journey' | 'arcade' | 'test';

export type GameScreen =
  | 'menu'
  | 'regionSelect'
  | 'battleSelect'
  | 'arcadeSelect'
  | 'playing'
  | 'caught' // journey: battle won at 100% — Pokémon caught
  | 'failed' // journey: wrong answer or ran out of time
  | 'testPassed' // test-out: unlocked a level
  | 'testFailed' // test-out: didn't get 3/3
  | 'arcadeResult' // arcade: run finished
  | 'pokedex'
  | 'pokedexEntry'
  | 'about'
  | 'login';

export interface GameState {
  screen: GameScreen;
  mode: GameMode;
  regionId: string | null;
  battleId: string | null;
  arcadeLevelId: string | null;
  question: Question | null;
  questionIndex: number; // 0-based within the run
  correctCount: number;
  wrong: number; // arcade: wrong answers this run
  attempted: number; // arcade: questions answered this run
  total: number; // questions in this run
  score: number;
  elapsed: number; // seconds (arcade run timer)
  level: number; // current difficulty level of the question in play
  maxLevel: number; // top level for the current topic
  feedback: string | null;
  feedbackCorrect: boolean;
  timeRemaining: number | null; // journey boss countdown; null otherwise
  selectedDex: number | null; // Pokédex entry being viewed
}

/** Generate a question, avoiding an immediate repeat of the previous one. */
function generateDistinct(
  topic: { generate: (level: number) => Question },
  level: number,
  avoid: string | undefined,
): Question {
  let q = topic.generate(level);
  for (let tries = 0; tries < 12 && q.text === avoid; tries++) {
    q = topic.generate(level);
  }
  return q;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INITIAL: GameState = {
  screen: 'menu',
  mode: 'journey',
  regionId: null,
  battleId: null,
  arcadeLevelId: null,
  question: null,
  questionIndex: 0,
  correctCount: 0,
  wrong: 0,
  attempted: 0,
  total: 0,
  score: 0,
  elapsed: 0,
  level: 1,
  maxLevel: 1,
  feedback: null,
  feedbackCorrect: false,
  timeRemaining: null,
  selectedDex: null,
};

export function useGame(profileId: string | null) {
  const [save, setSave] = useState<SaveData>(() => (profileId ? loadSave(profileId) : EMPTY_SAVE));
  const [state, setState] = useState<GameState>(INITIAL);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStart = useRef<number>(Date.now());
  const profileRef = useRef(profileId);
  profileRef.current = profileId;

  // Load the active profile's save; reset the game when switching players.
  useEffect(() => {
    setSave(profileId ? loadSave(profileId) : EMPTY_SAVE);
    setState(INITIAL);
  }, [profileId]);

  const clearFeedbackTimer = () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  };

  // --- navigation -----------------------------------------------------------
  const goMenu = useCallback(() => {
    clearFeedbackTimer();
    setState({ ...INITIAL, screen: 'menu' });
  }, []);

  const goRegionSelect = useCallback(() => {
    setState((s) => ({ ...s, screen: 'regionSelect', mode: 'journey' }));
  }, []);

  const goArcadeSelect = useCallback(() => {
    setState((s) => ({ ...s, screen: 'arcadeSelect', mode: 'arcade' }));
  }, []);

  const goPokedex = useCallback(() => {
    setState((s) => ({ ...s, screen: 'pokedex', selectedDex: null }));
  }, []);

  const viewEntry = useCallback((dex: number) => {
    setState((s) => ({ ...s, screen: 'pokedexEntry', selectedDex: dex }));
  }, []);

  const goAbout = useCallback(() => {
    setState((s) => ({ ...s, screen: 'about' }));
  }, []);

  const goLogin = useCallback(() => {
    setState((s) => ({ ...s, screen: 'login' }));
  }, []);

  const openRegion = useCallback((regionId: string) => {
    setState((s) => ({ ...s, screen: 'battleSelect', mode: 'journey', regionId }));
  }, []);

  // --- journey battles ------------------------------------------------------
  const startBattle = useCallback((battleId: string) => {
    const found = findBattle(battleId);
    if (!found) return;
    const { region, battle } = found;
    const topic = getTopic(battle.topic);
    const first = topic.generate(battle.level);
    questionStart.current = Date.now();
    setState({
      ...INITIAL,
      screen: 'playing',
      mode: 'journey',
      regionId: region.id,
      battleId: battle.id,
      question: first,
      total: battle.questionCount,
      level: battle.level,
      maxLevel: topic.maxLevel,
      timeRemaining: battle.timeLimitSec ?? null,
    });
  }, []);

  // --- test-out (3 questions to unlock a level) -----------------------------
  const startTest = useCallback((battleId: string) => {
    const found = findBattle(battleId);
    if (!found) return;
    const { region, battle } = found;
    const topic = getTopic(battle.topic);
    const first = topic.generate(battle.level);
    questionStart.current = Date.now();
    setState({
      ...INITIAL,
      screen: 'playing',
      mode: 'test',
      regionId: region.id,
      battleId: battle.id,
      question: first,
      total: 3,
      level: battle.level,
      maxLevel: topic.maxLevel,
    });
  }, []);

  // --- arcade runs ----------------------------------------------------------
  const startArcade = useCallback((levelId: string) => {
    const level = getArcadeLevel(levelId);
    if (!level) return;
    const topic = getTopic(randomFrom(level.topics));
    const first = topic.generate(1);
    questionStart.current = Date.now();
    setState({
      ...INITIAL,
      screen: 'playing',
      mode: 'arcade',
      arcadeLevelId: level.id,
      question: first,
      total: level.questionCount,
      level: 1,
      maxLevel: topic.maxLevel,
    });
  }, []);

  // --- answering ------------------------------------------------------------
  // Arcade: pick a random topic and grade it by how far through the run we are.
  const nextArcadeQuestion = (levelId: string, attempted: number, total: number, avoid: string | undefined) => {
    const level = getArcadeLevel(levelId)!;
    const topic = getTopic(randomFrom(level.topics));
    const lv = levelForProgress(attempted, total, topic.maxLevel);
    return { question: generateDistinct(topic, lv, avoid), level: lv, maxLevel: topic.maxLevel };
  };

  const submitAnswer = useCallback((typed: number) => {
    setState((s) => {
      if (s.screen !== 'playing' || !s.question) return s;
      const correct = isAnswerCorrect(s.question, typed);
      const elapsed = (Date.now() - questionStart.current) / 1000;
      const speedBonus =
        correct && elapsed <= SCORE_CONFIG.speedBonusThreshold ? SCORE_CONFIG.speedBonusPoints : 0;
      const points = correct ? SCORE_CONFIG.pointsPerCorrect + speedBonus : 0;
      const feedbackMsg = correct
        ? randomFrom(CORRECT_ANSWER_MESSAGES) + (speedBonus > 0 ? ` +${speedBonus}` : '')
        : randomFrom(WRONG_ANSWER_MESSAGES);

      // -------- ARCADE: wrong answers allowed, run to a fixed length --------
      if (s.mode === 'arcade') {
        const attempted = s.attempted + 1;
        const done = attempted >= s.total;
        questionStart.current = Date.now();
        const next = done ? null : nextArcadeQuestion(s.arcadeLevelId!, attempted, s.total, s.question?.text);
        return {
          ...s,
          screen: done ? 'arcadeResult' : 'playing',
          correctCount: s.correctCount + (correct ? 1 : 0),
          wrong: s.wrong + (correct ? 0 : 1),
          attempted,
          score: s.score + points,
          question: next ? next.question : s.question,
          level: next ? next.level : s.level,
          maxLevel: next ? next.maxLevel : s.maxLevel,
          questionIndex: s.questionIndex + 1,
          feedback: feedbackMsg,
          feedbackCorrect: correct,
        };
      }

      // -------- TEST-OUT: answer 3, unlock the level at 3/3 ----------------
      if (s.mode === 'test') {
        const found = s.battleId ? findBattle(s.battleId) : undefined;
        if (!found) return s;
        const { battle } = found;
        const attempted = s.attempted + 1;
        const nextCorrect = s.correctCount + (correct ? 1 : 0);
        const done = attempted >= s.total;
        if (done) {
          const passed = nextCorrect === s.total;
          if (passed && profileRef.current) {
            const pid = profileRef.current;
            setSave((prev) => recordTestUnlock(pid, prev, battle.id));
          }
          return { ...s, screen: passed ? 'testPassed' : 'testFailed', attempted, correctCount: nextCorrect, wrong: s.wrong + (correct ? 0 : 1), feedback: null, feedbackCorrect: correct };
        }
        questionStart.current = Date.now();
        const topic = getTopic(battle.topic);
        return {
          ...s,
          attempted,
          correctCount: nextCorrect,
          wrong: s.wrong + (correct ? 0 : 1),
          question: generateDistinct(topic, battle.level, s.question?.text),
          level: battle.level,
          maxLevel: topic.maxLevel,
          questionIndex: s.questionIndex + 1,
          feedback: feedbackMsg,
          feedbackCorrect: correct,
        };
      }

      // -------- JOURNEY: play the whole battle, catch only at 100% ---------
      const found = s.battleId ? findBattle(s.battleId) : undefined;
      if (!found) return s;
      const { region, battle } = found;
      const attempted = s.attempted + 1;
      const nextCorrect = s.correctCount + (correct ? 1 : 0);
      const nextWrong = s.wrong + (correct ? 0 : 1);
      const done = attempted >= s.total;

      if (done) {
        const perfect = nextCorrect === s.total;
        if (perfect && profileRef.current) {
          const pid = profileRef.current;
          setSave((prev) =>
            recordWin(pid, prev, battle.id, {
              dex: battle.dex,
              name: getName(battle.dex),
              region: region.id,
              caughtAt: Date.now(),
            }),
          );
        }
        return {
          ...s,
          screen: perfect ? 'caught' : 'failed',
          attempted,
          correctCount: nextCorrect,
          wrong: nextWrong,
          score: s.score + points + (perfect ? SCORE_CONFIG.evolutionBonus : 0),
          feedback: null,
          feedbackCorrect: correct,
          timeRemaining: null,
        };
      }

      // Next question — fixed difficulty for this battle, no repeats.
      questionStart.current = Date.now();
      const topic = getTopic(battle.topic);
      const nextQ = generateDistinct(topic, battle.level, s.question?.text);
      return {
        ...s,
        attempted,
        correctCount: nextCorrect,
        wrong: nextWrong,
        score: s.score + points,
        question: nextQ,
        level: battle.level,
        maxLevel: topic.maxLevel,
        questionIndex: s.questionIndex + 1,
        feedback: feedbackMsg,
        feedbackCorrect: correct,
      };
    });

    // flash feedback briefly
    clearFeedbackTimer();
    feedbackTimer.current = setTimeout(() => {
      setState((s) => (s.screen === 'playing' ? { ...s, feedback: null } : s));
    }, 1200);
  }, []);

  // Journey boss countdown
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

  // Arcade run timer (counts up)
  useEffect(() => {
    if (state.screen !== 'playing' || state.mode !== 'arcade') return;
    const id = setInterval(() => {
      setState((s) => (s.screen === 'playing' && s.mode === 'arcade' ? { ...s, elapsed: s.elapsed + 1 } : s));
    }, 1000);
    return () => clearInterval(id);
  }, [state.screen, state.mode]);

  useEffect(() => () => clearFeedbackTimer(), []);

  const retryBattle = useCallback(() => {
    if (state.battleId) startBattle(state.battleId);
  }, [state.battleId, startBattle]);

  const retryTest = useCallback(() => {
    if (state.battleId) startTest(state.battleId);
  }, [state.battleId, startTest]);

  const replayArcade = useCallback(() => {
    if (state.arcadeLevelId) startArcade(state.arcadeLevelId);
  }, [state.arcadeLevelId, startArcade]);

  const reloadSave = useCallback(() => {
    setSave(profileRef.current ? loadSave(profileRef.current) : EMPTY_SAVE);
  }, []);

  const active = state.battleId ? findBattle(state.battleId) : undefined;

  return {
    save,
    reloadSave,
    state,
    activeBattle: active?.battle ?? null,
    activeRegion: active?.region ?? null,
    goMenu,
    goRegionSelect,
    goArcadeSelect,
    goPokedex,
    viewEntry,
    goAbout,
    goLogin,
    openRegion,
    startBattle,
    startTest,
    startArcade,
    submitAnswer,
    retryBattle,
    retryTest,
    replayArcade,
  };
}
