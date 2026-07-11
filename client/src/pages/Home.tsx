/**
 * POKÉMATHS — Main Game Page
 * Dark arcade aesthetic, pixel font, Pokémon-themed catching mechanics.
 * Flow: menu → regionSelect → battleSelect → playing → caught / failed
 *       (+ arcadeSelect/arcadeResult and pokedex)
 *
 * Layout: every screen is a full-viewport (100dvh) column with a NavBar and a
 * centred content frame (max-width) so it scales from iPhone to iPad to desktop.
 * Sizes use clamp() so text/keys grow on larger screens without overflowing.
 */

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { PIXEL_FONT } from '@/lib/gameConstants';
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
import { ARCADE_LEVELS, getArcadeLevel } from '@/lib/arcade';
import { pixelSprite, artwork } from '@/lib/sprites';
import { caughtCount } from '@/lib/pokedex';
import {
  isBattleUnlocked,
  isRegionUnlocked,
  regionComplete,
  totalCatchable,
} from '@/lib/progress';

const panelBg = 'linear-gradient(135deg, #0a0a1a 0%, #1a0a3e 50%, #0a0a1a 100%)';

// Responsive font/size scale — clamp(min, preferred, max)
const FS = {
  title: 'clamp(0.8rem, 4vw, 1.35rem)',
  heading: 'clamp(0.6rem, 3vw, 0.95rem)',
  sub: 'clamp(0.42rem, 2vw, 0.62rem)',
  body: 'clamp(0.45rem, 2.2vw, 0.65rem)',
  small: 'clamp(0.38rem, 1.7vw, 0.5rem)',
  tiny: 'clamp(0.34rem, 1.4vw, 0.44rem)',
  btn: 'clamp(0.6rem, 2.8vw, 0.9rem)',
  question: 'clamp(1.1rem, 6.5vw, 2.1rem)',
  key: 'clamp(1rem, 4.8vw, 1.6rem)',
  hud: 'clamp(0.45rem, 2.2vw, 0.62rem)',
  score: 'clamp(0.9rem, 5vw, 1.5rem)',
};

const FRAME = 'min(32rem, 100%)'; // centred game frame width

// ---------------------------------------------------------------------------
// SCREEN + NAVBAR
// ---------------------------------------------------------------------------
function Screen({ bg, children, scroll = false }: { bg: string; children: ReactNode; scroll?: boolean }) {
  return (
    <div
      className="w-full flex flex-col items-center"
      style={{ height: '100dvh', background: bg, overflowY: scroll ? 'auto' : 'hidden' }}
    >
      {children}
    </div>
  );
}

function NavBar({ onHome, onBack, title, accent = '#FFD700', right }: {
  onHome: () => void;
  onBack?: () => void;
  title?: string;
  accent?: string;
  right?: ReactNode;
}) {
  const iconBtn: CSSProperties = {
    fontFamily: PIXEL_FONT, fontSize: FS.hud, background: 'none', border: 'none',
    cursor: 'pointer', padding: '0.25rem 0.4rem', lineHeight: 1,
  };
  return (
    <div
      className="w-full flex items-center justify-between shrink-0"
      style={{
        padding: 'clamp(0.4rem, 1.5vw, 0.9rem) clamp(0.5rem, 3vw, 1.25rem)',
        background: 'rgba(0,0,0,0.55)', borderBottom: `1px solid ${accent}44`,
      }}
    >
      <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 1.5vw, 0.75rem)' }}>
        <button onClick={onHome} aria-label="Home" title="Home" style={{ ...iconBtn, color: '#FFD700' }}>🏠</button>
        {onBack && <button onClick={onBack} aria-label="Back" title="Back" style={{ ...iconBtn, color: '#aaa' }}>←</button>}
      </div>
      {title && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: accent, textAlign: 'center', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.5rem' }}>{title}</div>}
      <div className="flex items-center justify-end" style={{ minWidth: 'clamp(1.5rem, 8vw, 3rem)', gap: '0.5rem' }}>{right}</div>
    </div>
  );
}

// Centred content column used by list/card screens
function Frame({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`w-full flex flex-col items-center ${className}`} style={{ width: FRAME, ...style }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONFETTI
// ---------------------------------------------------------------------------
function ConfettiPiece({ x, color, delay }: { x: number; color: string; delay: number }) {
  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${x}%`, width: 10, height: 10, backgroundColor: color,
        animation: `confettiFall 3s ${delay}s ease-in infinite`,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
      }}
    />
  );
}
const CONFETTI_COLORS = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98FB98'];
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: (i / 60) * 100 + Math.random() * 5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], delay: (i / 60) * 2,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => <ConfettiPiece key={p.id} x={p.x} color={p.color} delay={p.delay} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NUMBER KEYPAD
// ---------------------------------------------------------------------------
function NumberKeypad({ onKey, onToggleSign, onDelete, onSubmit, currentInput, accent }: {
  onKey: (d: string) => void; onToggleSign: () => void; onDelete: () => void;
  onSubmit: () => void; currentInput: string; accent: string;
}) {
  const keyStyle = (border: string, fs = FS.key, bg = 'linear-gradient(135deg, #1e3a5f, #0d2137)'): CSSProperties => ({
    fontFamily: PIXEL_FONT, fontSize: fs, background: bg, border: `2px solid ${border}`, cursor: 'pointer',
  });
  return (
    <div className="w-full h-full flex flex-col" style={{ gap: 'clamp(0.4rem, 1.2vh, 0.6rem)' }}>
      <div
        className="w-full px-4 text-center rounded-lg border-2 flex items-center justify-center shrink-0"
        style={{
          fontFamily: PIXEL_FONT, fontSize: FS.question, background: 'rgba(0,0,0,0.6)',
          borderColor: '#FFD700', color: currentInput ? '#FFD700' : '#444',
          minHeight: 'clamp(2.75rem, 8vh, 4.5rem)', letterSpacing: '0.12em',
        }}
      >
        {currentInput || '?'}
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(4, 1fr)' }}>
        {['7','8','9','4','5','6','1','2','3'].map(d => (
          <button key={d} className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
            style={keyStyle('#38bdf8')} onPointerDown={e => { e.preventDefault(); onKey(d); }}>{d}</button>
        ))}
        <button className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle(accent, FS.body)} onPointerDown={e => { e.preventDefault(); onToggleSign(); }}>±</button>
        <button className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#38bdf8')} onPointerDown={e => { e.preventDefault(); onKey('0'); }}>0</button>
        <button className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle(accent)} onPointerDown={e => { e.preventDefault(); onKey('.'); }}>.</button>
      </div>
      <div className="flex gap-2 shrink-0" style={{ height: 'clamp(2.75rem, 8vh, 4rem)' }}>
        <button className="flex-1 flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#ef4444', FS.btn, 'linear-gradient(135deg, #4a1a1a, #2d0a0a)')}
          onPointerDown={e => { e.preventDefault(); onDelete(); }}>DEL</button>
        <button className="flex-1 flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#22c55e', FS.btn, 'linear-gradient(135deg, #1a4a1a, #0a2d0a)')}
          onPointerDown={e => { e.preventDefault(); onSubmit(); }}>OK ✓</button>
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
      <div className="flex justify-between mb-1" style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#aaa' }}>
        <span>POWER</span><span>{correct}/{total}</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 'clamp(0.75rem, 2.2vh, 1.1rem)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`, boxShadow: `0 0 8px ${accentColor}` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// POKEMON SPRITE
// ---------------------------------------------------------------------------
function PokemonSprite({ src, name, size = 140, glow, bounce = true, fallback, label = true }: {
  src: string; name: string; size?: number; glow?: string; bounce?: boolean; fallback?: string; label?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={src} alt={name}
        onError={fallback ? (e) => { const img = e.currentTarget; if (img.src !== fallback) img.src = fallback; } : undefined}
        style={{
          width: size, height: size, maxWidth: '100%', objectFit: 'contain', imageRendering: 'pixelated',
          filter: glow ? `drop-shadow(0 0 10px ${glow})` : undefined,
          animation: bounce ? 'pokeBounce 1.4s ease-in-out infinite' : undefined,
        }}
      />
      {label && (
        <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#FFD700', textShadow: '0 0 6px #FFD700' }}>
          {name.toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
export default function Home() {
  const game = useGame();
  const { state, save } = game;
  const [input, setInput] = useState('');

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
    if (!Number.isNaN(num)) { game.submitAnswer(num); setInput(''); }
  }, [input, game]);

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

  const backBtn = (label: string, onClick: () => void, color = '#888'): ReactNode => (
    <button onClick={onClick} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color, border: `1px solid ${color}55`, background: 'transparent', padding: '0.7rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
      {label}
    </button>
  );

  // =========================================================================
  // MENU
  // =========================================================================
  if (state.screen === 'menu') {
    return (
      <Screen bg={panelBg}>
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: 'clamp(1rem, 5vw, 2.5rem) 1rem' }}>
          <Frame className="items-center">
            {/* Text logo (robust, scales) */}
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.title, color: '#FFD700', textShadow: '0 0 16px rgba(255,215,0,0.55), 0 2px 0 rgba(0,0,0,0.6)', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4 }}>
              POKÉMATHS
            </div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#a78bfa', margin: 'clamp(0.75rem,3vw,1.5rem) 0', textAlign: 'center', lineHeight: 2 }}>
              WIN MATHS BATTLES<br />TO CATCH POKÉMON!
            </p>
            <div className="flex flex-col gap-3 w-full" style={{ maxWidth: '22rem' }}>
              <button onClick={game.goRegionSelect} className="w-full rounded-xl font-bold text-black"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vw,1.3rem) 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', border: '2px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.4)', cursor: 'pointer' }}>
                🗺 JOURNEY
              </button>
              <button onClick={game.goArcadeSelect} className="w-full rounded-xl font-bold"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vw,1.3rem) 0', background: 'transparent', border: '2px solid #38bdf8', color: '#38bdf8', cursor: 'pointer' }}>
                ▶ ARCADE
              </button>
              <button onClick={game.goPokedex} className="w-full rounded-xl font-bold"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vw,1.3rem) 0', background: 'transparent', border: '2px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
                📕 POKÉDEX ({caughtCount(save)}/{totalCatchable()})
              </button>
            </div>
            <div className="flex items-center justify-center gap-5" style={{ marginTop: 'clamp(1rem,4vw,1.75rem)' }}>
              <button onClick={game.goLogin} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}>👤 LOG IN</button>
              <button onClick={game.goAbout} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}>ℹ ABOUT</button>
            </div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#444', marginTop: 'clamp(0.75rem,3vw,1.25rem)', textAlign: 'center' }}>
              © 2019-2026 MUSHTAQ ARCADE CORP
            </p>
          </Frame>
        </div>
      </Screen>
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
        <button key={region.id} disabled={!unlocked} onClick={() => unlocked && game.openRegion(region.id)}
          className="w-full rounded-xl text-left flex items-center gap-3"
          style={{
            padding: 'clamp(0.6rem,2vw,1rem)',
            background: unlocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.4)',
            border: `2px solid ${unlocked ? region.accentColor : '#333'}`,
            boxShadow: unlocked ? `0 0 8px ${region.accentColor}22` : 'none',
            opacity: unlocked ? 1 : 0.55, cursor: unlocked ? 'pointer' : 'not-allowed',
          }}>
          <div style={{ fontSize: 'clamp(1.3rem,5vw,1.9rem)', width: 'clamp(2rem,8vw,2.6rem)', textAlign: 'center', flexShrink: 0 }}>
            {unlocked ? (done ? '✅' : region.secret ? '✨' : '🌍') : '🔒'}
          </div>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: unlocked ? region.accentColor : '#666' }}>{region.name.toUpperCase()}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginTop: 3 }}>{region.gen} · {region.inspiration}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#666', marginTop: 3 }}>
              {unlocked ? `${caught}/${region.battles.length} CAUGHT` : region.secret ? 'SECRET — CLEAR ALL REGIONS' : 'LOCKED'}
            </div>
          </div>
        </button>
      );
    };
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="CHOOSE REGION" right={<button onClick={game.goLogin} aria-label="Log in" title="Log in" style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>👤</button>} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="flex flex-col gap-2 w-full">
              {MAINLINE_REGIONS.map(renderRegion)}
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#a78bfa', margin: '0.75rem 0 0.25rem', textAlign: 'center' }}>✨ SECRET REGIONS ✨</div>
              {SECRET_REGIONS.map(renderRegion)}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // BATTLE SELECT
  // =========================================================================
  if (state.screen === 'battleSelect' && state.regionId) {
    const region = getRegion(state.regionId)!;
    return (
      <Screen bg={region.bgGradient}>
        <NavBar onHome={game.goMenu} onBack={game.goRegionSelect} title={`${region.name.toUpperCase()} · ${region.gen}`} accent={region.accentColor} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="flex flex-col gap-2 w-full">
              {region.battles.map((b, i) => {
                const unlocked = isBattleUnlocked(save, region, i);
                const won = save.wonBattles.includes(b.id);
                const topic = getTopic(b.topic);
                return (
                  <button key={b.id} disabled={!unlocked} onClick={() => unlocked && game.startBattle(b.id)}
                    className="w-full rounded-xl text-left flex items-center gap-3"
                    style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(0,0,0,0.4)', border: `2px solid ${b.isBoss ? '#FFD700' : region.accentColor}`, opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
                    <img src={pixelSprite(b.dex)} alt={b.pokemon}
                      onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(b.dex)) img.src = artwork(b.dex); }}
                      style={{ width: 'clamp(40px,12vw,60px)', height: 'clamp(40px,12vw,60px)', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0, filter: unlocked || won ? 'none' : 'brightness(0)' }} />
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: b.isBoss ? '#FFD700' : region.accentColor }}>{b.isBoss ? '★ ' : ''}{unlocked || won ? b.pokemon.toUpperCase() : '???'}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#aaa', marginTop: 3 }}>{topic.name}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#777', marginTop: 3 }}>{b.questionCount} Qs · 100%{b.timeLimitSec ? ` · ⏱${b.timeLimitSec}s` : ''}</div>
                    </div>
                    <div style={{ fontSize: 'clamp(1rem,4vw,1.4rem)', flexShrink: 0 }}>{won ? '✅' : unlocked ? '' : '🔒'}</div>
                  </button>
                );
              })}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // ARCADE — LEVEL SELECT
  // =========================================================================
  if (state.screen === 'arcadeSelect') {
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="ARCADE" accent="#38bdf8" right={<button onClick={game.goLogin} aria-label="Log in" title="Log in" style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>👤</button>} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#888', marginBottom: '0.75rem', textAlign: 'center' }}>QUICK SCORE ATTACK — PICK A LEVEL</p>
            <div className="flex flex-col gap-2 w-full">
              {ARCADE_LEVELS.map((lvl, i) => (
                <button key={lvl.id} onClick={() => game.startArcade(lvl.id)} className="w-full rounded-xl text-left flex items-center gap-3"
                  style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(255,255,255,0.04)', border: `2px solid ${lvl.accentColor}`, boxShadow: `0 0 8px ${lvl.accentColor}22`, cursor: 'pointer' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: lvl.accentColor, width: 'clamp(1.5rem,6vw,2.2rem)', textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: lvl.accentColor }}>{lvl.name.toUpperCase()}</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#aaa', marginTop: 3 }}>{lvl.subtitle}</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#777', marginTop: 3 }}>{lvl.questionCount} QUESTIONS</div>
                  </div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: lvl.accentColor, flexShrink: 0 }}>▶</div>
                </button>
              ))}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // ARCADE — RESULT
  // =========================================================================
  if (state.screen === 'arcadeResult' && state.arcadeLevelId) {
    const lvl = getArcadeLevel(state.arcadeLevelId)!;
    const accuracy = state.total > 0 ? Math.round((state.correctCount / state.total) * 100) : 0;
    const perfect = accuracy === 100;
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    return (
      <Screen bg="linear-gradient(135deg, #0a0a1a, #1a0a3e)">
        <NavBar onHome={game.goMenu} title="ARCADE RESULT" accent={lvl.accentColor} />
        {perfect && <Confetti />}
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: `3px solid ${lvl.accentColor}`, boxShadow: `0 0 40px ${lvl.accentColor}44` }}>
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.25rem' }}>{perfect ? '🌟' : '🎮'}</div>
              <h1 style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: lvl.accentColor, marginBottom: '0.25rem' }}>{lvl.name.toUpperCase()}</h1>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: perfect ? '#FFD700' : '#e2e8f0', marginBottom: '1rem' }}>{perfect ? 'PERFECT RUN!' : 'RUN COMPLETE!'}</p>
              <div className="rounded-lg mb-3" style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', marginBottom: 4 }}>SCORE</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.score, color: '#FFD700' }}>{state.score.toLocaleString()}</div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 rounded-lg" style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>ACCURACY</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: perfect ? '#22c55e' : '#fff', marginTop: 3 }}>{accuracy}%</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#666', marginTop: 3 }}>{state.correctCount}/{state.total}</div>
                </div>
                <div className="flex-1 rounded-lg" style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>TIME</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: 3 }}>{fmt(state.elapsed)}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={game.replayArcade} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ PLAY AGAIN</button>
                <button onClick={game.goArcadeSelect} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#38bdf8', background: 'transparent', border: '1px solid #38bdf8', cursor: 'pointer' }}>☰ CHANGE LEVEL</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // CAUGHT
  // =========================================================================
  if (state.screen === 'caught' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    return (
      <Screen bg="linear-gradient(135deg, #0a0a1a, #1a0a3e)">
        <NavBar onHome={game.goMenu} title="GOTCHA!" />
        <Confetti />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #FFD700', boxShadow: '0 0 40px rgba(255,215,0,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', marginBottom: '0.75rem', textShadow: '0 0 12px #FFD700' }}>GOTCHA!</div>
              <div className="flex justify-center mb-3">
                <PokemonSprite src={artwork(b.dex)} name={b.pokemon} size={150} glow={game.activeRegion.accentColor} />
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>{b.pokemon.toUpperCase()} WAS CAUGHT<br />AND ADDED TO YOUR POKÉDEX!</p>
              <div className="rounded-lg mb-4" style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', marginBottom: 4 }}>SCORE</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.score, color: '#FFD700' }}>{state.score.toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => game.openRegion(game.activeRegion!.id)} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>▶ CONTINUE</button>
                <button onClick={game.goPokedex} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#38bdf8', background: 'transparent', border: '1px solid #38bdf8', cursor: 'pointer' }}>📕 VIEW POKÉDEX</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // FAILED
  // =========================================================================
  if (state.screen === 'failed' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    return (
      <Screen bg="linear-gradient(135deg, #1a0000, #0a0a1a)">
        <NavBar onHome={game.goMenu} onBack={() => game.openRegion(game.activeRegion!.id)} title="BATTLE LOST" accent="#ef4444" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #ef4444' }}>
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.5rem' }}>💨</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#ef4444', marginBottom: '0.75rem' }}>{state.feedback === "Time's up!" ? "TIME'S UP!" : 'IT GOT AWAY!'}</div>
              <div className="flex justify-center mb-3">
                <PokemonSprite src={pixelSprite(b.dex)} name={b.pokemon} size={110} bounce={false} fallback={artwork(b.dex)} />
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>YOU NEED 100% TO CATCH<br />{b.pokemon.toUpperCase()}. TRY AGAIN!</p>
              <div className="flex flex-col gap-2">
                <button onClick={game.retryBattle} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ RETRY</button>
                <button onClick={() => game.openRegion(game.activeRegion!.id)} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#aaa', background: 'transparent', border: '1px solid #444', cursor: 'pointer' }}>← BACK</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // POKÉDEX
  // =========================================================================
  if (state.screen === 'pokedex') {
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="POKÉDEX" accent="#ef4444" right={<button onClick={game.goLogin} aria-label="Log in" title="Log in" style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>👤</button>} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#FFD700', marginBottom: '1rem' }}>{caughtCount(save)} / {totalCatchable()} CAUGHT</p>
            <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(72px, 22vw, 110px), 1fr))', gap: 'clamp(0.4rem,1.5vw,0.75rem)' }}>
              {ALL_BATTLES.map((b: Battle) => {
                const owned = Boolean(save.caught[b.dex]);
                return (
                  <div key={b.id} className="rounded-lg p-2 flex flex-col items-center" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${owned ? '#FFD700' : '#333'}` }}>
                    <img src={pixelSprite(b.dex)} alt={owned ? b.pokemon : 'Unknown'}
                      onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(b.dex)) img.src = artwork(b.dex); }}
                      style={{ width: 'clamp(48px,14vw,80px)', height: 'clamp(48px,14vw,80px)', objectFit: 'contain', imageRendering: 'pixelated', filter: owned ? 'none' : 'brightness(0)' }} />
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: owned ? '#FFD700' : '#555', marginTop: 4, textAlign: 'center' }}>{owned ? b.pokemon : '???'}</span>
                  </div>
                );
              })}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // ABOUT
  // =========================================================================
  if (state.screen === 'about') {
    const Section = ({ title, children }: { title: string; children: ReactNode }) => (
      <div className="w-full rounded-xl" style={{ padding: 'clamp(0.75rem,3vw,1.25rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#FFD700', marginBottom: 8 }}>{title}</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#cbd5e1', lineHeight: 2 }}>{children}</div>
      </div>
    );
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="ABOUT" accent="#a78bfa" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="flex flex-col gap-3 w-full">
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.title, color: '#FFD700', textAlign: 'center', textShadow: '0 0 14px rgba(255,215,0,0.5)', margin: '0.25rem 0 0.5rem' }}>POKÉMATHS</div>
              <Section title="WHAT IS IT?">
                A maths adventure! Answer questions to battle and catch Pokémon across 11 regions, from Kanto to Terarium.
              </Section>
              <Section title="JOURNEY">
                Travel region by region. Each battle is a maths topic — answer every question correctly (100%!) to catch that Pokémon into your Pokédex. Legendary bosses are timed. Clear all nine regions to unlock two secret regions.
              </Section>
              <Section title="ARCADE">
                Quick pick-up-and-play. Choose a level and race a fixed run of questions for score and accuracy — wrong answers are allowed, so it's great for practice.
              </Section>
              <Section title="LEARNING">
                37 topics span the primary maths curriculum, from counting and number bonds up to fractions, decimals, percentages, and early algebra.
              </Section>
              <Section title="CREDITS">
                Made by Mushtaq Arcade Corp. © 2019–2026.<br />
                Pokémon sprites via PokeAPI. This is an unofficial fan-made educational game and is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, or The Pokémon Company.
              </Section>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // LOGIN (Google sync — coming soon)
  // =========================================================================
  if (state.screen === 'login') {
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="LOG IN" accent="#38bdf8" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.7)', border: '2px solid #38bdf8' }}>
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.5rem' }}>👤</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#38bdf8', marginBottom: '0.75rem' }}>SAVE ACROSS DEVICES</div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#cbd5e1', lineHeight: 2, marginBottom: '1.25rem' }}>
                Sign in with Google to sync your Pokédex and progress to every device.
              </p>
              <button disabled aria-disabled
                className="w-full rounded-lg font-bold flex items-center justify-center gap-2"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.9rem 0', background: 'rgba(255,255,255,0.1)', color: '#888', border: '1px solid #444', cursor: 'not-allowed' }}>
                <span>🔒</span> SIGN IN WITH GOOGLE
              </button>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#eab308', lineHeight: 2, marginTop: '1rem' }}>
                COMING SOON
              </p>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', lineHeight: 2, marginTop: '0.5rem' }}>
                For now, your progress is saved safely on this device.
              </p>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // PLAYING (journey + arcade)
  // =========================================================================
  if (state.screen === 'playing' && state.question) {
    const journey = state.mode === 'journey';
    const b = game.activeBattle;
    const region = game.activeRegion;
    const arcadeLevel = state.arcadeLevelId ? getArcadeLevel(state.arcadeLevelId) : null;
    const accent = journey ? region?.accentColor ?? '#38bdf8' : arcadeLevel?.accentColor ?? '#38bdf8';
    const bg = journey ? region?.bgGradient ?? panelBg : panelBg;
    const title = journey ? `${b?.isBoss ? '★ ' : ''}${b?.pokemon.toUpperCase() ?? ''}` : arcadeLevel?.name.toUpperCase() ?? 'ARCADE';
    const doneCount = journey ? state.correctCount : state.attempted;
    const progressPct = Math.min((doneCount / state.total) * 100, 100);
    const onExit = journey ? () => game.openRegion(region!.id) : game.goArcadeSelect;

    return (
      <Screen bg={bg}>
        <NavBar
          onHome={game.goMenu} onBack={onExit} title={title} accent={accent}
          right={
            <>
              {journey && state.timeRemaining !== null && (
                <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: state.timeRemaining <= 10 ? '#ef4444' : '#22c55e' }}>⏱{state.timeRemaining}</span>
              )}
              {!journey && <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: '#22c55e' }}>{state.correctCount}✓</span>}
              <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: '#FFD700' }}>{state.score.toLocaleString()}</span>
            </>
          }
        />
        <div className="flex-1 min-h-0 w-full flex items-stretch justify-center" style={{ padding: 'clamp(0.5rem,2vh,1.25rem) clamp(0.5rem,3vw,1rem)' }}>
          <div className="flex flex-col" style={{ width: FRAME, height: '100%', maxHeight: '46rem', gap: 'clamp(0.5rem, 2vh, 1rem)' }}>
            {/* Wild Pokémon (journey) / progress (arcade) */}
            {journey && b ? (
              <div className="w-full flex items-center gap-3 shrink-0">
                <PokemonSprite src={pixelSprite(b.dex)} name={b.pokemon} size={72} glow={progressPct > 60 ? accent : undefined} fallback={artwork(b.dex)} label={false} />
                <div className="flex-1">
                  <PowerBar correct={state.correctCount} total={state.total} accentColor={accent} />
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginTop: 4 }}>{state.total - state.correctCount} MORE TO CATCH!</p>
                </div>
              </div>
            ) : (
              <div className="w-full shrink-0"><PowerBar correct={state.attempted} total={state.total} accentColor={accent} /></div>
            )}

            {/* Question */}
            <div className="w-full rounded-xl text-center flex flex-col justify-center shrink-0" style={{ padding: 'clamp(1rem,4vh,2rem) 1rem', background: 'rgba(0,0,0,0.65)', border: `2px solid ${accent}`, boxShadow: `0 0 12px ${accent}22` }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginBottom: 8 }}>QUESTION {doneCount + 1} OF {state.total}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.question, color: '#fff', letterSpacing: '0.04em', lineHeight: 1.5 }}>{state.question?.text ?? '...'}</div>
            </div>

            {/* Keypad — grows to fill remaining height */}
            <div className="flex-1 min-h-0">
              <NumberKeypad currentInput={input} accent={accent} onKey={appendKey} onToggleSign={toggleSign} onDelete={() => setInput(prev => prev.slice(0, -1))} onSubmit={handleSubmit} />
            </div>
          </div>
        </div>

        {/* Feedback overlay (fixed so keypad never shifts) */}
        {state.feedback && (
          <div style={{
            position: 'fixed', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999,
            fontFamily: PIXEL_FONT, fontSize: FS.body,
            background: state.feedbackCorrect ? 'rgba(0,20,0,0.92)' : 'rgba(20,0,0,0.92)',
            border: `2px solid ${state.feedbackCorrect ? '#22c55e' : '#ef4444'}`,
            color: state.feedbackCorrect ? '#22c55e' : '#ef4444',
            borderRadius: '0.75rem', padding: '0.75rem 1.5rem', textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>{state.feedback}</div>
        )}
      </Screen>
    );
  }

  // Fallback
  return (
    <Screen bg={panelBg}>
      <div className="flex-1 flex items-center justify-center">{backBtn('← MENU', game.goMenu, '#FFD700')}</div>
    </Screen>
  );
}
