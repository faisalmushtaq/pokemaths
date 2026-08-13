// =============================================================================
// POKÉMATHS — SAVE DATA (Pokédex, legacy collection, and Curriculum V2)
// =============================================================================
// `caught` remains the enduring ownership record. Curriculum V2 is deliberately
// separate: old captures are recognised as legacy ownership and never removed or
// translated automatically into learning completion.
// =============================================================================

import type { CurriculumBattle } from './curriculum';

export interface CaughtEntry {
  dex: number;
  name: string;
  region: string;
  caughtAt: number;
}

export interface MegaEntry {
  dex: number;
  formId: number;
  name: string;
  caughtAt: number;
  bestTime?: number;
}

export interface StreakData {
  current: number;
  best: number;
  lastDay: string;
  freezes: number;
  lastFreezeUsed?: string;
}

export const MAX_FREEZES = 3;

export interface Stats {
  correct: number;
  wrong: number;
  seconds: number;
  battlesWon: number;
  arcadeRuns: number;
  testsPassed: number;
  daysPlayed: number;
}

export interface CurriculumBattleProgress {
  completedAt: number;
  attempts: number;
  bestCorrect: number;
  rewardStatus: 'captured' | 'legacy-owned';
}

export interface CurriculumBossProgress {
  defeatedAt: number;
  attempts: number;
  rewardStatus: 'captured' | 'legacy-owned';
}

export interface CurriculumProgress {
  schemaVersion: 2;
  migratedAt: number;
  /** Snapshot of every dex number owned when Curriculum V2 first loaded. */
  legacyCapturedDex: number[];
  battles: Record<string, CurriculumBattleProgress>;
  bosses: Record<string, CurriculumBossProgress>;
  /** Earned when a revised battle rewards a Pokémon already owned in legacy data. */
  masteryTokens: number;
}

export interface SaveData {
  version: 2;
  caught: Record<number, CaughtEntry>;
  megas: Record<number, MegaEntry>;
  /** Historical region-battle wins are retained for legacy journey views. */
  wonBattles: string[];
  testUnlocked: string[];
  streak: StreakData;
  stats: Stats;
  curriculumV2: CurriculumProgress;
}

export const EMPTY_STREAK: StreakData = { current: 0, best: 0, lastDay: '', freezes: 0 };
export const EMPTY_STATS: Stats = { correct: 0, wrong: 0, seconds: 0, battlesWon: 0, arcadeRuns: 0, testsPassed: 0, daysPlayed: 0 };

function emptyCurriculum(capturedDex: number[] = []): CurriculumProgress {
  return {
    schemaVersion: 2,
    migratedAt: Date.now(),
    legacyCapturedDex: Array.from(new Set(capturedDex)).sort((a, b) => a - b),
    battles: {},
    bosses: {},
    masteryTokens: 0,
  };
}

export const EMPTY_SAVE: SaveData = {
  version: 2,
  caught: {},
  megas: {},
  wonBattles: [],
  testUnlocked: [],
  streak: { ...EMPTY_STREAK },
  stats: { ...EMPTY_STATS },
  curriculumV2: emptyCurriculum(),
};

const KEY_PREFIX = 'pokemaths.save.';
const LEGACY_KEY = 'pokemaths.save.v1';

function keyFor(profileId: string): string {
  return `${KEY_PREFIX}${profileId}`;
}

function normaliseCurriculum(raw: Partial<CurriculumProgress> | undefined, caught: Record<number, CaughtEntry>): CurriculumProgress {
  const capturedDex = Object.keys(caught).map(Number).filter((dex) => Number.isFinite(dex));
  const isFirstMigration = !raw;
  const base = raw ?? emptyCurriculum(capturedDex);
  return {
    schemaVersion: 2,
    migratedAt: typeof base.migratedAt === 'number' ? base.migratedAt : Date.now(),
    legacyCapturedDex: Array.from(new Set(isFirstMigration ? capturedDex : (base.legacyCapturedDex ?? []))).sort((a, b) => a - b),
    battles: base.battles ?? {},
    bosses: base.bosses ?? {},
    masteryTokens: Math.max(0, base.masteryTokens ?? 0),
  };
}

/** Parse V1 or V2 safely. A V1 save becomes V2 without altering `caught`. */
function parse(raw: string | null): SaveData {
  if (!raw) return { ...EMPTY_SAVE, curriculumV2: emptyCurriculum() };
  try {
    const p = JSON.parse(raw) as Partial<SaveData> & { curriculum?: Partial<CurriculumProgress> };
    const caught = p.caught ?? {};
    const curriculumV2 = normaliseCurriculum(p.curriculumV2 ?? p.curriculum, caught);
    return {
      version: 2,
      caught,
      megas: p.megas ?? {},
      wonBattles: p.wonBattles ?? [],
      testUnlocked: p.testUnlocked ?? [],
      streak: { ...EMPTY_STREAK, ...(p.streak ?? {}) },
      stats: { ...EMPTY_STATS, ...(p.stats ?? {}) },
      curriculumV2,
    };
  } catch {
    return { ...EMPTY_SAVE, curriculumV2: emptyCurriculum() };
  }
}

export function loadSave(profileId: string): SaveData {
  const save = parse(localStorage.getItem(keyFor(profileId)));
  // Persist upgraded V1 saves immediately so migration happens once and is cloud-safe.
  persistSave(profileId, save);
  return save;
}

export function persistSave(profileId: string, data: SaveData): void {
  try {
    localStorage.setItem(keyFor(profileId), JSON.stringify(data));
  } catch {
    // Storage may be full or unavailable. Game play remains usable in memory.
  }
}

export function deleteSave(profileId: string): void {
  try {
    localStorage.removeItem(keyFor(profileId));
  } catch {
    /* ignore */
  }
}

/** Record a historical region win and retain the original capture behaviour. */
export function recordWin(profileId: string, data: SaveData, battleId: string, entry: CaughtEntry): SaveData {
  const next: SaveData = {
    ...data,
    version: 2,
    caught: { ...data.caught, [entry.dex]: data.caught[entry.dex] ?? entry },
    wonBattles: data.wonBattles.includes(battleId) ? data.wonBattles : [...data.wonBattles, battleId],
  };
  persistSave(profileId, next);
  return next;
}

/**
 * Record a V2 curriculum battle. Existing captures remain untouched. If its
 * assigned Pokémon was already owned, the player earns a mastery token instead
 * of a duplicate capture, while the learning battle is still completed.
 */
export function recordCurriculumWin(
  profileId: string,
  data: SaveData,
  battle: CurriculumBattle,
  entry: CaughtEntry,
  correctCount: number,
): SaveData {
  const alreadyOwned = Boolean(data.caught[battle.dex]);
  const priorBattle = data.curriculumV2.battles[battle.id];
  const priorBoss = data.curriculumV2.bosses[battle.id];
  const prior = battle.isBoss ? priorBoss : priorBattle;
  const rewardStatus: 'captured' | 'legacy-owned' = alreadyOwned ? 'legacy-owned' : 'captured';
  const masteryTokens = data.curriculumV2.masteryTokens + (alreadyOwned && !prior ? 1 : 0);
  const baseProgress: CurriculumBattleProgress = {
    completedAt: priorBattle?.completedAt ?? Date.now(),
    attempts: (priorBattle?.attempts ?? 0) + 1,
    bestCorrect: Math.max(priorBattle?.bestCorrect ?? 0, correctCount),
    rewardStatus: priorBattle?.rewardStatus === 'captured' ? 'captured' : rewardStatus,
  };
  const curriculumV2: CurriculumProgress = battle.isBoss
    ? {
        ...data.curriculumV2,
        masteryTokens,
        bosses: {
          ...data.curriculumV2.bosses,
          [battle.id]: {
            defeatedAt: priorBoss?.defeatedAt ?? Date.now(),
            attempts: (priorBoss?.attempts ?? 0) + 1,
            rewardStatus: priorBoss?.rewardStatus === 'captured' ? 'captured' : rewardStatus,
          },
        },
      }
    : {
        ...data.curriculumV2,
        masteryTokens,
        battles: { ...data.curriculumV2.battles, [battle.id]: baseProgress },
      };
  const next: SaveData = {
    ...data,
    caught: alreadyOwned ? data.caught : { ...data.caught, [entry.dex]: entry },
    curriculumV2,
  };
  persistSave(profileId, next);
  return next;
}

export function hasCurriculumWin(data: SaveData, battleId: string): boolean {
  return Boolean(data.curriculumV2.battles[battleId] || data.curriculumV2.bosses[battleId]);
}

export function isLegacyCapture(data: SaveData, dex: number): boolean {
  return data.curriculumV2.legacyCapturedDex.includes(dex);
}

function dayStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

const FREEZE_EVERY = 5;

export function recordPlay(profileId: string, data: SaveData): SaveData {
  const today = dayStr(new Date());
  const s = data.streak ?? EMPTY_STREAK;
  if (s.lastDay === today) return data;
  let current: number;
  let freezes = s.freezes;
  let lastFreezeUsed = s.lastFreezeUsed;
  if (!s.lastDay) current = 1;
  else {
    const gap = daysBetween(s.lastDay, today);
    if (gap === 1) current = s.current + 1;
    else {
      const missed = gap - 1;
      if (freezes >= missed) {
        freezes -= missed;
        lastFreezeUsed = today;
        current = s.current + 1;
      } else current = 1;
    }
  }
  if (current > 0 && current % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
  const streak: StreakData = { current, best: Math.max(s.best, current), lastDay: today, freezes, lastFreezeUsed };
  const next: SaveData = { ...data, streak, stats: { ...data.stats, daysPlayed: data.stats.daysPlayed + 1 } };
  persistSave(profileId, next);
  return next;
}

export function recordAnswer(profileId: string, data: SaveData, correct: boolean, seconds: number): SaveData {
  const capped = Math.min(Math.max(seconds, 0), 120);
  const next: SaveData = {
    ...data,
    stats: {
      ...data.stats,
      correct: data.stats.correct + (correct ? 1 : 0),
      wrong: data.stats.wrong + (correct ? 0 : 1),
      seconds: data.stats.seconds + capped,
    },
  };
  persistSave(profileId, next);
  return next;
}

export function recordRun(profileId: string, data: SaveData, kind: 'battlesWon' | 'arcadeRuns' | 'testsPassed'): SaveData {
  const next: SaveData = { ...data, stats: { ...data.stats, [kind]: data.stats[kind] + 1 } };
  persistSave(profileId, next);
  return next;
}

export function freezeUsedToday(data: SaveData): boolean {
  return (data.streak?.lastFreezeUsed ?? '') === dayStr(new Date());
}

export function liveStreak(data: SaveData): number {
  const s = data.streak ?? EMPTY_STREAK;
  if (!s.lastDay) return 0;
  const gap = daysBetween(s.lastDay, dayStr(new Date()));
  return gap <= 1 || s.freezes >= gap - 1 ? s.current : 0;
}

function mergeMega(a: MegaEntry | undefined, b: MegaEntry): MegaEntry {
  if (!a) return b;
  const times = [a.bestTime, b.bestTime].filter((t): t is number => t != null);
  return { ...a, caughtAt: Math.min(a.caughtAt, b.caughtAt), bestTime: times.length ? Math.min(...times) : undefined };
}

export function recordMega(profileId: string, data: SaveData, entry: MegaEntry): SaveData {
  const next: SaveData = { ...data, megas: { ...data.megas, [entry.dex]: mergeMega(data.megas[entry.dex], entry) } };
  persistSave(profileId, next);
  return next;
}

export function recordTestUnlock(profileId: string, data: SaveData, battleId: string): SaveData {
  if (data.testUnlocked.includes(battleId)) return data;
  const next: SaveData = { ...data, testUnlocked: [...data.testUnlocked, battleId] };
  persistSave(profileId, next);
  return next;
}

export function isTestUnlocked(data: SaveData, battleId: string): boolean {
  return data.testUnlocked.includes(battleId);
}

function mergeCurriculum(a: CurriculumProgress, b: CurriculumProgress, caught: Record<number, CaughtEntry>): CurriculumProgress {
  const battles: Record<string, CurriculumBattleProgress> = { ...a.battles };
  for (const [id, progress] of Object.entries(b.battles)) {
    const existing = battles[id];
    battles[id] = !existing
      ? progress
      : {
          completedAt: Math.min(existing.completedAt, progress.completedAt),
          attempts: Math.max(existing.attempts, progress.attempts),
          bestCorrect: Math.max(existing.bestCorrect, progress.bestCorrect),
          rewardStatus: existing.rewardStatus === 'captured' || progress.rewardStatus === 'captured' ? 'captured' : 'legacy-owned',
        };
  }
  const bosses: Record<string, CurriculumBossProgress> = { ...a.bosses };
  for (const [id, progress] of Object.entries(b.bosses)) {
    const existing = bosses[id];
    bosses[id] = !existing
      ? progress
      : {
          defeatedAt: Math.min(existing.defeatedAt, progress.defeatedAt),
          attempts: Math.max(existing.attempts, progress.attempts),
          rewardStatus: existing.rewardStatus === 'captured' || progress.rewardStatus === 'captured' ? 'captured' : 'legacy-owned',
        };
  }
  return {
    schemaVersion: 2,
    migratedAt: Math.min(a.migratedAt, b.migratedAt),
    legacyCapturedDex: Array.from(new Set([...a.legacyCapturedDex, ...b.legacyCapturedDex])).sort((x, y) => x - y),
    battles,
    bosses,
    masteryTokens: Math.max(a.masteryTokens, b.masteryTokens),
  };
}

export function mergeSaves(a: SaveData, b: SaveData): SaveData {
  const caught: Record<number, CaughtEntry> = { ...a.caught };
  for (const [dex, entry] of Object.entries(b.caught)) {
    const d = Number(dex);
    const existing = caught[d];
    caught[d] = !existing || entry.caughtAt < existing.caughtAt ? entry : existing;
  }
  const megas: Record<number, MegaEntry> = { ...a.megas };
  for (const entry of Object.values(b.megas ?? {})) megas[entry.dex] = mergeMega(megas[entry.dex], entry);
  const sa = a.streak ?? EMPTY_STREAK;
  const sb = b.streak ?? EMPTY_STREAK;
  const recent = sb.lastDay > sa.lastDay ? sb : sa;
  const streak: StreakData = { current: recent.current, best: Math.max(sa.best, sb.best), lastDay: recent.lastDay, freezes: recent.freezes ?? 0 };
  const sta = a.stats ?? EMPTY_STATS;
  const stb = b.stats ?? EMPTY_STATS;
  const stats: Stats = {
    correct: Math.max(sta.correct, stb.correct),
    wrong: Math.max(sta.wrong, stb.wrong),
    seconds: Math.max(sta.seconds, stb.seconds),
    battlesWon: Math.max(sta.battlesWon, stb.battlesWon),
    arcadeRuns: Math.max(sta.arcadeRuns, stb.arcadeRuns),
    testsPassed: Math.max(sta.testsPassed, stb.testsPassed),
    daysPlayed: Math.max(sta.daysPlayed, stb.daysPlayed),
  };
  return {
    version: 2,
    caught,
    megas,
    wonBattles: Array.from(new Set([...a.wonBattles, ...b.wonBattles])),
    testUnlocked: Array.from(new Set([...a.testUnlocked, ...b.testUnlocked])),
    streak,
    stats,
    curriculumV2: mergeCurriculum(a.curriculumV2, b.curriculumV2, caught),
  };
}

export function hasWon(data: SaveData, battleId: string): boolean {
  return data.wonBattles.includes(battleId);
}

export function caughtCount(data: SaveData): number {
  return Object.keys(data.caught).length;
}

export function takeLegacySave(): SaveData | null {
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return null;
  const data = parse(raw);
  try {
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
  return data;
}
