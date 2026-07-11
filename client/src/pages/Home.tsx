/**
 * POKÉMATHS — Main Game Page
 * Dark arcade aesthetic, pixel font, Pokémon-themed catching mechanics.
 * Flow: menu → regionSelect → battleSelect → playing → caught / failed
 *       (+ pokedex from the menu)
 */

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { ASSETS, PIXEL_FONT } from '@/lib/gameConstants';
import { useGame } from '@/hooks/useGame';
import {
  ALL_BATTLES,
  MAINLINE_REGIONS,
  SECRET_REGIONS,
  getRegion,
  type Battle,
  type Region,
} from '@/lib/regions';
import { getTopic } from '@/lib/topics';
import { pixelSprite, artwork } from '@/lib/sprites';
import { caughtCount } from '@/lib/pokedex';
import {
  isBattleUnlocked,
  isRegionUnlocked,
  regionComplete,
  totalCatchable,
} from '@/lib/progress';

// ---------------------------------------------------------------------------
// CONFETTI
// ---------------------------------------------------------------------------
function ConfettiPiece({ x, color, delay }: { x: number; color: string; delay: number }) {
  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${x}%`,
        width: 10,
        height: 10,
        backgroundColor: color,
        animation: `confettiFall 3s ${delay}s ease-in infinite`,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
      }}
    />
  );
}

const CONFETTI_COLORS = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98FB98'];

function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: (i / 60) * 100 + Math.random() * 5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i / 60) * 2,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => <ConfettiPiece key={p.id} x={p.x} color={p.color} delay={p.delay} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NUMBER KEYPAD (now supports decimal point and sign toggle)
// ---------------------------------------------------------------------------
function NumberKeypad({ onKey, onToggleSign, onDelete, onSubmit, currentInput, accent }: {
  onKey: (d: string) => void;
  onToggleSign: () => void;
  onDelete: () => void;
  onSubmit: () => void;
  currentInput: string;
  accent: string;
}) {
  const keyStyle = (border: string, fs = '1.1rem'): CSSProperties => ({
    fontFamily: PIXEL_FONT,
    fontSize: fs,
    padding: '0.8rem 0',
    background: 'linear-gradient(135deg, #1e3a5f, #0d2137)',
    border: `2px solid ${border}`,
    cursor: 'pointer',
  });

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Display */}
      <div
        className="w-full mb-3 px-4 py-3 text-center rounded-lg border-2"
        style={{
          fontFamily: PIXEL_FONT,
          fontSize: '1.5rem',
          background: 'rgba(0,0,0,0.6)',
          borderColor: '#FFD700',
          color: currentInput ? '#FFD700' : '#444',
          minHeight: '3.5rem',
          letterSpacing: '0.15em',
        }}
      >
        {currentInput || '?'}
      </div>

      {/* Digit grid: 1-9, then  ±  0  . */}
      <div className="grid grid-cols-3 gap-2">
        {['7','8','9','4','5','6','1','2','3'].map(d => (
          <button
            key={d}
            className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
            style={keyStyle('#38bdf8')}
            onPointerDown={e => { e.preventDefault(); onKey(d); }}
          >
            {d}
          </button>
        ))}
        <button
          className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle(accent, '1rem')}
          onPointerDown={e => { e.preventDefault(); onToggleSign(); }}
        >
          ±
        </button>
        <button
          className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#38bdf8')}
          onPointerDown={e => { e.preventDefault(); onKey('0'); }}
        >
          0
        </button>
        <button
          className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle(accent)}
          onPointerDown={e => { e.preventDefault(); onKey('.'); }}
        >
          .
        </button>
      </div>

      {/* Action row: DEL / OK */}
      <div className="flex gap-2 mt-2">
        <button
          className="flex-1 flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={{ ...keyStyle('#ef4444', '0.65rem'), background: 'linear-gradient(135deg, #4a1a1a, #2d0a0a)' }}
          onPointerDown={e => { e.preventDefault(); onDelete(); }}
        >
          DEL
        </button>
        <button
          className="flex-1 flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={{ ...keyStyle('#22c55e', '0.65rem'), background: 'linear-gradient(135deg, #1a4a1a, #0a2d0a)' }}
          onPointerDown={e => { e.preventDefault(); onSubmit(); }}
        >
          OK ✓
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// POWER BAR
// ---------------------------------------------------------------------------
function PowerBar({ correct, total, accentColor }: { correct: number; total: number; accentColor: string }) {
  const pct = Math.min((correct / total) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1" style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#aaa' }}>
        <span>POWER</span>
        <span>{correct}/{total}</span>
      </div>
      <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// POKEMON SPRITE
// ---------------------------------------------------------------------------
function PokemonSprite({ src, name, size = 140, glow, bounce = true }: {
  src: string; name: string; size?: number; glow?: string; bounce?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          imageRendering: 'pixelated',
          filter: glow ? `drop-shadow(0 0 10px ${glow})` : undefined,
          animation: bounce ? 'pokeBounce 1.4s ease-in-out infinite' : undefined,
        }}
      />
      <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#FFD700', textShadow: '0 0 6px #FFD700' }}>
        {name.toUpperCase()}
      </span>
    </div>
  );
}

const panelBg = 'linear-gradient(135deg, #0a0a1a 0%, #1a0a3e 50%, #0a0a1a 100%)';

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
export default function Home() {
  const game = useGame();
  const { state, save } = game;
  const [input, setInput] = useState('');

  // reset input whenever a new question appears
  useEffect(() => { setInput(''); }, [state.question]);

  const appendKey = useCallback((d: string) => {
    setInput(prev => {
      if (d === '.') {
        if (prev.includes('.')) return prev;
        return (prev === '' || prev === '-' ? prev + '0' : prev) + '.';
      }
      if (prev.replace(/[-.]/g, '').length >= 6) return prev;
      return prev + d;
    });
  }, []);

  const toggleSign = useCallback(() => {
    setInput(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  }, []);

  const handleSubmit = useCallback(() => {
    const num = parseFloat(input);
    if (!Number.isNaN(num)) {
      game.submitAnswer(num);
      setInput('');
    }
  }, [input, game]);

  // physical keyboard while playing
  useEffect(() => {
    if (state.screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key >= '0' && e.key <= '9') || e.key === '.') appendKey(e.key);
      else if (e.key === '-') toggleSign();
      else if (e.key === 'Backspace') setInput(prev => prev.slice(0, -1));
      else if (e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.screen, appendKey, toggleSign, handleSubmit]);

  // =========================================================================
  // MENU
  // =========================================================================
  if (state.screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: panelBg }}>
        <div className="mb-3" style={{ width: 220, height: 220 }}>
          <img src={ASSETS.logo} alt="Pokémaths" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
        </div>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#a78bfa', marginBottom: '1.5rem', textAlign: 'center', lineHeight: 2 }}>
          WIN MATHS BATTLES<br />TO CATCH POKÉMON!
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={game.goRegionSelect}
            className="w-full py-4 rounded-xl font-bold text-black"
            style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', background: 'linear-gradient(135deg, #FFD700, #FFA500)', border: '2px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.4)', cursor: 'pointer' }}>
            ▶ ADVENTURE
          </button>
          <button onClick={game.goPokedex}
            className="w-full py-4 rounded-xl font-bold"
            style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
            📕 POKÉDEX ({caughtCount(save)}/{totalCatchable()})
          </button>
        </div>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#444', marginTop: '2rem' }}>
          © 2019-2026 MUSHTAQ ARCADE CORP
        </p>
      </div>
    );
  }

  // =========================================================================
  // REGION SELECT
  // =========================================================================
  if (state.screen === 'regionSelect') {
    const renderRegion = (region: Region) => {
      const unlocked = isRegionUnlocked(save, region);
      const done = regionComplete(save, region);
      const caught = region.battles.filter(b => save.wonBattles.includes(b.id)).length;
      return (
        <button
          key={region.id}
          disabled={!unlocked}
          onClick={() => unlocked && game.openRegion(region.id)}
          className="w-full rounded-xl p-3 text-left flex items-center gap-3"
          style={{
            background: unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.4)',
            border: `2px solid ${unlocked ? region.accentColor : '#333'}`,
            boxShadow: unlocked ? `0 0 8px ${region.accentColor}22` : 'none',
            opacity: unlocked ? 1 : 0.55,
            cursor: unlocked ? 'pointer' : 'not-allowed',
          }}
        >
          <div style={{ fontSize: '1.6rem', width: 40, textAlign: 'center' }}>
            {unlocked ? (done ? '✅' : region.secret ? '✨' : '🌍') : '🔒'}
          </div>
          <div className="flex-1">
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', color: unlocked ? region.accentColor : '#666' }}>
              {region.name.toUpperCase()}
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#888', marginTop: 3 }}>
              {region.gen} · {region.inspiration}
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#666', marginTop: 3 }}>
              {unlocked ? `${caught}/${region.battles.length} CAUGHT` : region.secret ? 'SECRET — CLEAR ALL REGIONS' : 'LOCKED'}
            </div>
          </div>
        </button>
      );
    };

    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6" style={{ background: panelBg }}>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: '0.8rem', color: '#FFD700', marginBottom: '0.25rem', textShadow: '0 0 10px #FFD700' }}>
          CHOOSE REGION
        </h1>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.42rem', color: '#888', marginBottom: '1rem' }}>YOUR JOURNEY AWAITS</p>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {MAINLINE_REGIONS.map(renderRegion)}
          <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#a78bfa', margin: '0.75rem 0 0.25rem', textAlign: 'center' }}>
            ✨ SECRET REGIONS ✨
          </div>
          {SECRET_REGIONS.map(renderRegion)}
        </div>
        <button onClick={game.goMenu} style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#666', border: '1px solid #333', background: 'transparent', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', marginTop: '1.5rem', cursor: 'pointer' }}>
          ← MENU
        </button>
      </div>
    );
  }

  // =========================================================================
  // BATTLE SELECT
  // =========================================================================
  if (state.screen === 'battleSelect' && state.regionId) {
    const region = getRegion(state.regionId)!;
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6" style={{ background: region.bgGradient }}>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: '0.8rem', color: region.accentColor, marginBottom: '0.25rem', textShadow: `0 0 10px ${region.accentColor}` }}>
          {region.name.toUpperCase()}
        </h1>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.42rem', color: '#bbb', marginBottom: '1rem' }}>{region.gen} · {region.inspiration}</p>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          {region.battles.map((b, i) => {
            const unlocked = isBattleUnlocked(save, region, i);
            const won = save.wonBattles.includes(b.id);
            const topic = getTopic(b.topic);
            return (
              <button
                key={b.id}
                disabled={!unlocked}
                onClick={() => unlocked && game.startBattle(b.id)}
                className="w-full rounded-xl p-3 text-left flex items-center gap-3"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `2px solid ${b.isBoss ? '#FFD700' : region.accentColor}`,
                  opacity: unlocked ? 1 : 0.5,
                  cursor: unlocked ? 'pointer' : 'not-allowed',
                }}
              >
                <img
                  src={pixelSprite(b.dex)}
                  alt={b.pokemon}
                  style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0, filter: unlocked || won ? 'none' : 'brightness(0)' }}
                />
                <div className="flex-1">
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: b.isBoss ? '#FFD700' : region.accentColor }}>
                    {b.isBoss ? '★ ' : ''}{unlocked || won ? b.pokemon.toUpperCase() : '???'}
                  </div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#aaa', marginTop: 3 }}>{topic.name}</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#777', marginTop: 3 }}>
                    {b.questionCount} Qs · 100%{b.timeLimitSec ? ` · ⏱${b.timeLimitSec}s` : ''}
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem' }}>{won ? '✅' : unlocked ? '' : '🔒'}</div>
              </button>
            );
          })}
        </div>
        <button onClick={game.goRegionSelect} style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#aaa', border: '1px solid #444', background: 'transparent', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', marginTop: '1.5rem', cursor: 'pointer' }}>
          ← REGIONS
        </button>
      </div>
    );
  }

  // =========================================================================
  // CAUGHT
  // =========================================================================
  if (state.screen === 'caught' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #0a0a1a, #1a0a3e)' }}>
        <Confetti />
        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: 'rgba(0,0,0,0.85)', border: '3px solid #FFD700', boxShadow: '0 0 40px rgba(255,215,0,0.3)' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', color: '#FFD700', marginBottom: '1rem', textShadow: '0 0 12px #FFD700' }}>
            GOTCHA!
          </div>
          <div className="flex justify-center mb-3">
            <PokemonSprite src={artwork(b.dex)} name={b.pokemon} size={150} glow={game.activeRegion.accentColor} />
          </div>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>
            {b.pokemon.toUpperCase()} WAS CAUGHT<br />AND ADDED TO YOUR POKÉDEX!
          </p>
          <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#888', marginBottom: 4 }}>SCORE</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '1.1rem', color: '#FFD700' }}>{state.score.toLocaleString()}</div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={() => game.openRegion(game.activeRegion!.id)}
              className="w-full py-3 rounded-lg font-bold text-black"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>
              ▶ CONTINUE
            </button>
            <button onClick={game.goPokedex}
              className="w-full py-2 rounded-lg"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#38bdf8', background: 'transparent', border: '1px solid #38bdf8', cursor: 'pointer' }}>
              📕 VIEW POKÉDEX
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // FAILED
  // =========================================================================
  if (state.screen === 'failed' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #1a0000, #0a0a1a)' }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: 'rgba(0,0,0,0.85)', border: '3px solid #ef4444' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💨</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.65rem', color: '#ef4444', marginBottom: '0.75rem' }}>
            {state.feedback === "Time's up!" ? "TIME'S UP!" : 'IT GOT AWAY!'}
          </div>
          <div className="flex justify-center mb-3">
            <PokemonSprite src={pixelSprite(b.dex)} name={b.pokemon} size={110} bounce={false} />
          </div>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>
            YOU NEED 100% TO CATCH<br />{b.pokemon.toUpperCase()}. TRY AGAIN!
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={game.retryBattle}
              className="w-full py-3 rounded-lg font-bold text-black"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>
              ↻ RETRY
            </button>
            <button onClick={() => game.openRegion(game.activeRegion!.id)}
              className="w-full py-2 rounded-lg"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#aaa', background: 'transparent', border: '1px solid #444', cursor: 'pointer' }}>
              ← BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // POKÉDEX
  // =========================================================================
  if (state.screen === 'pokedex') {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6" style={{ background: panelBg }}>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.25rem', textShadow: '0 0 10px #ef4444' }}>
          POKÉDEX
        </h1>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#FFD700', marginBottom: '1rem' }}>
          {caughtCount(save)} / {totalCatchable()} CAUGHT
        </p>
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {ALL_BATTLES.map((b: Battle) => {
            const owned = Boolean(save.caught[b.dex]);
            return (
              <div key={b.id} className="rounded-lg p-2 flex flex-col items-center"
                style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${owned ? '#FFD700' : '#333'}` }}>
                <img
                  src={pixelSprite(b.dex)}
                  alt={owned ? b.pokemon : 'Unknown'}
                  style={{ width: 56, height: 56, objectFit: 'contain', imageRendering: 'pixelated', filter: owned ? 'none' : 'brightness(0)' }}
                />
                <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.32rem', color: owned ? '#FFD700' : '#555', marginTop: 4, textAlign: 'center' }}>
                  {owned ? b.pokemon : '???'}
                </span>
              </div>
            );
          })}
        </div>
        <button onClick={game.goMenu} style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#666', border: '1px solid #333', background: 'transparent', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', marginTop: '1.5rem', cursor: 'pointer' }}>
          ← MENU
        </button>
      </div>
    );
  }

  // =========================================================================
  // PLAYING
  // =========================================================================
  if (state.screen === 'playing' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    const region = game.activeRegion;
    const progressPct = Math.min((state.correctCount / b.questionCount) * 100, 100);
    return (
      <div className="min-h-screen flex flex-col" style={{ background: region.bgGradient }}>
        {/* HUD */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ background: 'rgba(0,0,0,0.6)', borderBottom: `1px solid ${region.accentColor}44` }}>
          <button onClick={() => game.openRegion(region.id)} style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: region.accentColor }}>
            {b.isBoss ? '★ ' : ''}{b.pokemon.toUpperCase()}
          </div>
          <div className="flex gap-3">
            {state.timeRemaining !== null && (
              <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: state.timeRemaining <= 10 ? '#ef4444' : '#22c55e' }}>
                ⏱ {state.timeRemaining}
              </span>
            )}
            <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#FFD700' }}>{state.score.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 max-w-sm mx-auto w-full gap-3">
          {/* Wild Pokémon + power bar */}
          <div className="w-full flex items-center gap-3">
            <PokemonSprite src={pixelSprite(b.dex)} name={b.pokemon} size={72} glow={progressPct > 60 ? region.accentColor : undefined} />
            <div className="flex-1">
              <PowerBar correct={state.correctCount} total={b.questionCount} accentColor={region.accentColor} />
              <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.38rem', color: '#888', marginTop: 4 }}>
                {b.questionCount - state.correctCount} MORE TO CATCH!
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="w-full rounded-xl px-4 py-3 text-center"
            style={{ background: 'rgba(0,0,0,0.65)', border: `2px solid ${region.accentColor}`, boxShadow: `0 0 12px ${region.accentColor}22` }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#888', marginBottom: 6 }}>
              QUESTION {state.correctCount + 1} OF {b.questionCount}
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '1.3rem', color: '#fff', letterSpacing: '0.04em', lineHeight: 1.5 }}>
              {state.question?.text ?? '...'}
            </div>
          </div>

          {/* Feedback (fixed, centred so keypad never shifts) */}
          {state.feedback && (
            <div style={{
              position: 'fixed', top: '45%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999,
              fontFamily: PIXEL_FONT, fontSize: '0.55rem',
              background: state.feedbackCorrect ? 'rgba(0,20,0,0.92)' : 'rgba(20,0,0,0.92)',
              border: `2px solid ${state.feedbackCorrect ? '#22c55e' : '#ef4444'}`,
              color: state.feedbackCorrect ? '#22c55e' : '#ef4444',
              borderRadius: '0.75rem', padding: '0.75rem 1.5rem', textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap',
            }}>
              {state.feedback}
            </div>
          )}

          {/* Keypad */}
          <div className="w-full">
            <NumberKeypad
              currentInput={input}
              accent={region.accentColor}
              onKey={appendKey}
              onToggleSign={toggleSign}
              onDelete={() => setInput(prev => prev.slice(0, -1))}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback — shouldn't happen
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: panelBg }}>
      <button onClick={game.goMenu} style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', color: '#FFD700', background: 'transparent', border: '1px solid #FFD700', padding: '1rem 2rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
        ← MENU
      </button>
    </div>
  );
}
