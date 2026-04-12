/**
 * POKÉMATHS — Main Game Page
 * Design: Dark arcade aesthetic, pixel font, Pokémon-themed evolution mechanics.
 * Screens: menu → (levelSelect) → playing → evolving → victory
 */

import { useCallback, useEffect, useState } from 'react';
import { ASSETS, LEVELS, PIXEL_FONT } from '@/lib/gameConstants';
import { useMathsEngine } from '@/hooks/useMathsEngine';

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
// NUMBER KEYPAD
// ---------------------------------------------------------------------------
function NumberKeypad({ onDigit, onDelete, onSubmit, currentInput }: {
  onDigit: (d: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  currentInput: string;
}) {
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

      {/* Digit grid */}
      <div className="grid grid-cols-3 gap-2">
        {['7','8','9','4','5','6','1','2','3'].map(d => (
          <button
            key={d}
            className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: '1.1rem',
              padding: '0.9rem 0',
              background: 'linear-gradient(135deg, #1e3a5f, #0d2137)',
              border: '2px solid #38bdf8',
              cursor: 'pointer',
            }}
            onPointerDown={e => { e.preventDefault(); onDigit(d); }}
          >
            {d}
          </button>
        ))}
        {/* Bottom row: DEL, 0, OK */}
        <button
          className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: '0.65rem',
            padding: '0.9rem 0',
            background: 'linear-gradient(135deg, #4a1a1a, #2d0a0a)',
            border: '2px solid #ef4444',
            cursor: 'pointer',
          }}
          onPointerDown={e => { e.preventDefault(); onDelete(); }}
        >
          DEL
        </button>
        <button
          className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: '1.1rem',
            padding: '0.9rem 0',
            background: 'linear-gradient(135deg, #1e3a5f, #0d2137)',
            border: '2px solid #38bdf8',
            cursor: 'pointer',
          }}
          onPointerDown={e => { e.preventDefault(); onDigit('0'); }}
        >
          0
        </button>
        <button
          className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: '0.65rem',
            padding: '0.9rem 0',
            background: 'linear-gradient(135deg, #1a4a1a, #0a2d0a)',
            border: '2px solid #22c55e',
            cursor: 'pointer',
          }}
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
function PokemonSprite({ src, name, size = 140, glow }: { src: string; name: string; size?: number; glow?: string }) {
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
          animation: 'pokeBounce 1.4s ease-in-out infinite',
        }}
      />
      <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#FFD700', textShadow: '0 0 6px #FFD700' }}>
        {name.toUpperCase()}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EVOLUTION SCREEN
// ---------------------------------------------------------------------------
function EvolutionScreen({ baseName, baseSprite, evolvedName, evolvedSprite, cry, onContinue, accentColor }: {
  baseName: string; baseSprite: string;
  evolvedName: string; evolvedSprite: string;
  cry: string; onContinue: () => void; accentColor: string;
}) {
  const [phase, setPhase] = useState<'flash' | 'reveal' | 'done'>('flash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1800);
    const t2 = setTimeout(() => setPhase('done'), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-40 px-4"
      style={{
        background: phase === 'flash'
          ? 'white'
          : 'linear-gradient(135deg, #0a0a1a, #1a0a3e)',
        transition: 'background 0.5s',
      }}
    >
      {phase === 'flash' && (
        <div style={{ fontFamily: PIXEL_FONT, fontSize: '1rem', color: '#000', animation: 'pulse 0.4s infinite' }}>
          EVOLVING...
        </div>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <div className="text-center max-w-sm w-full">
          <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', color: '#FFD700', marginBottom: '1rem', textShadow: '0 0 10px #FFD700' }}>
            ★ EVOLUTION! ★
          </div>

          <div className="flex items-center justify-center gap-4 mb-4">
            <div style={{ opacity: 0.35 }}>
              <PokemonSprite src={baseSprite} name={baseName} size={90} />
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '1.5rem', color: accentColor }}>→</div>
            <div>
              <PokemonSprite src={evolvedSprite} name={evolvedName} size={130} glow={accentColor} />
            </div>
          </div>

          <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#e2e8f0', lineHeight: 2, marginBottom: '1.5rem', padding: '0 1rem' }}>
            {cry}
          </p>

          {phase === 'done' && (
            <button
              onClick={onContinue}
              className="px-8 py-3 rounded-lg font-bold text-black"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: '0.65rem',
                background: `linear-gradient(135deg, ${accentColor}, #FFD700)`,
                border: 'none',
                cursor: 'pointer',
                animation: 'pulse 1s infinite',
              }}
            >
              CONTINUE →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN HOME COMPONENT
// ---------------------------------------------------------------------------
export default function Home() {
  const {
    state, currentLevel, startGame, submitAnswer,
    advanceAfterEvolution, goToMenu, goToLevelSelect,
  } = useMathsEngine();

  const [input, setInput] = useState('');

  // Physical keyboard support
  useEffect(() => {
    if (state.screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setInput(prev => prev.length < 4 ? prev + e.key : prev);
      } else if (e.key === 'Backspace') {
        setInput(prev => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.screen, input]);

  // Reset input on new question
  useEffect(() => { setInput(''); }, [state.currentQuestion]);

  const handleSubmit = useCallback(() => {
    const num = parseInt(input, 10);
    if (!isNaN(num)) {
      submitAnswer(num);
      setInput('');
    }
  }, [input, submitAnswer]);

  const handleShare = useCallback(() => {
    const level = LEVELS[state.currentLevelIndex];
    const text = `🎮 Pokémaths Score: ${state.score} pts\n⏱ Time: ${Math.floor(state.totalTime / 60)}m ${state.totalTime % 60}s\n📚 Reached: ${level.name} — ${level.subtitle}\n🎯 Play at: https://faisalmushtaq.github.io/pokemaths/`;
    if (navigator.share) {
      navigator.share({ title: 'Pokémaths', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Score copied to clipboard!'));
    }
  }, [state]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  // ---- MENU ----
  if (state.screen === 'menu') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a3e 50%, #0a0a1a 100%)' }}>
        <div className="mb-3" style={{ width: 240, height: 240 }}>
          <img src={ASSETS.logo} alt="Pokémaths" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }} />
        </div>
        <div className="mb-5 w-full max-w-xs rounded-xl overflow-hidden" style={{ border: '2px solid #FFD700' }}>
          <img src={ASSETS.splash} alt="Pokémaths" style={{ width: '100%', display: 'block', imageRendering: 'pixelated' }} />
        </div>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#a78bfa', marginBottom: '1.5rem', textAlign: 'center', lineHeight: 2 }}>
          ANSWER MATHS QUESTIONS<br />TO EVOLVE YOUR POKÉMON!
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => startGame(0, true)}
            className="w-full py-4 rounded-xl font-bold text-black"
            style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', background: 'linear-gradient(135deg, #FFD700, #FFA500)', border: '2px solid #FFD700', boxShadow: '0 0 20px rgba(255,215,0,0.4)', cursor: 'pointer' }}>
            ▶ ARCADE MODE
          </button>
          <button onClick={goToLevelSelect}
            className="w-full py-4 rounded-xl font-bold"
            style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', background: 'transparent', border: '2px solid #a78bfa', color: '#a78bfa', cursor: 'pointer' }}>
            ☰ LEVEL SELECT
          </button>
        </div>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#444', marginTop: '2rem' }}>
          © 2019-2026 MUSHTAQ ARCADE CORP
        </p>
      </div>
    );
  }

  // ---- LEVEL SELECT ----
  if (state.screen === 'levelSelect') {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8"
        style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a3e 50%, #0a0a1a 100%)' }}>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: '0.8rem', color: '#FFD700', marginBottom: '0.5rem', textShadow: '0 0 10px #FFD700' }}>
          SELECT LEVEL
        </h1>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#888', marginBottom: '1.5rem' }}>CHOOSE YOUR CHALLENGE</p>
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {LEVELS.map((level, i) => (
            <button key={level.id} onClick={() => startGame(i, false)}
              className="w-full rounded-xl p-4 text-left flex items-center gap-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: `2px solid ${level.accentColor}`, boxShadow: `0 0 8px ${level.accentColor}22`, cursor: 'pointer' }}>
              <img src={level.basePokemon.sprite} alt={level.basePokemon.name}
                style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', color: level.accentColor }}>
                  LV{level.id}: {level.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#aaa', marginTop: 4 }}>{level.subtitle}</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#666', marginTop: 2 }}>
                  {level.basePokemon.name} → {level.evolvedPokemon.name}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={goToMenu} style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#666', border: '1px solid #333', background: 'transparent', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', marginTop: '1.5rem', cursor: 'pointer' }}>
          ← BACK
        </button>
      </div>
    );
  }

  // ---- EVOLUTION ----
  if (state.screen === 'evolving') {
    return (
      <EvolutionScreen
        baseName={currentLevel.basePokemon.name}
        baseSprite={currentLevel.basePokemon.sprite}
        evolvedName={currentLevel.evolvedPokemon.name}
        evolvedSprite={currentLevel.evolvedPokemon.sprite}
        cry={currentLevel.evolvedPokemon.cry}
        onContinue={advanceAfterEvolution}
        accentColor={currentLevel.accentColor}
      />
    );
  }

  // ---- VICTORY ----
  if (state.screen === 'victory') {
    const finalLevel = LEVELS[LEVELS.length - 1];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: 'linear-gradient(135deg, #0a0a1a, #1a0a3e)' }}>
        {state.confetti && <Confetti />}
        <div className="w-full max-w-sm rounded-2xl p-6 text-center"
          style={{ background: 'rgba(0,0,0,0.85)', border: '3px solid #FFD700', boxShadow: '0 0 40px rgba(255,215,0,0.3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🏆</div>
          <h1 style={{ fontFamily: PIXEL_FONT, fontSize: '0.7rem', color: '#FFD700', lineHeight: 1.8, textShadow: '0 0 15px #FFD700', marginBottom: '0.5rem' }}>
            MATHS MASTER!
          </h1>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#e2e8f0', lineHeight: 2, marginBottom: '1rem' }}>
            YOU EVOLVED ALL YOUR POKÉMON!
          </p>
          <div className="flex justify-center mb-4">
            <PokemonSprite src={finalLevel.evolvedPokemon.sprite} name="Mega Charizard X" size={110} glow="#60a5fa" />
          </div>
          <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#888', marginBottom: 4 }}>FINAL SCORE</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '1.1rem', color: '#FFD700' }}>{state.score.toLocaleString()}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#aaa', marginTop: 4 }}>TOTAL TIME: {fmt(state.totalTime)}</div>
          </div>
          {state.levelTimes.length > 0 && (
            <div className="mb-4 text-left">
              <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#888', marginBottom: 6 }}>LEVEL TIMES:</div>
              {state.levelTimes.map((t, i) => (
                <div key={i} className="flex justify-between" style={{ fontFamily: PIXEL_FONT, fontSize: '0.4rem', color: '#aaa', marginBottom: 3 }}>
                  <span style={{ color: LEVELS[i]?.accentColor }}>{LEVELS[i]?.name.toUpperCase()}</span>
                  <span>{fmt(t)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button onClick={() => startGame(0, true)}
              className="w-full py-3 rounded-lg font-bold text-black"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>
              ▶ PLAY AGAIN
            </button>
            <button onClick={handleShare}
              className="w-full py-3 rounded-lg font-bold"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.6rem', background: 'transparent', border: '2px solid #38bdf8', color: '#38bdf8', cursor: 'pointer' }}>
              📤 SHARE SCORE
            </button>
            <button onClick={goToMenu}
              className="w-full py-2 rounded-lg"
              style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#555', background: 'transparent', border: '1px solid #333', cursor: 'pointer' }}>
              ← MENU
            </button>
          </div>
        </div>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.38rem', color: '#333', marginTop: '1.5rem' }}>
          © 2019-2026 MUSHTAQ ARCADE CORP
        </p>
      </div>
    );
  }

  // ---- PLAYING ----
  const level = currentLevel;
  const progressPct = Math.min((state.correctCount / level.questionsToEvolve) * 100, 100);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: level.bgGradient }}>
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', borderBottom: `1px solid ${level.accentColor}44` }}>
        <button onClick={goToMenu} style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: level.accentColor }}>
          LV{level.id}: {level.name.toUpperCase()}
        </div>
        <div className="flex gap-3">
          <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#22c55e' }}>⏱ {fmt(state.levelElapsed)}</span>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#FFD700' }}>{state.score.toLocaleString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 max-w-sm mx-auto w-full gap-4">

        {/* Pokémon + power bar */}
        <div className="w-full flex flex-col items-center gap-3">
          <PokemonSprite
            src={level.basePokemon.sprite}
            name={level.basePokemon.name}
            size={110}
            glow={progressPct > 60 ? level.accentColor : undefined}
          />
          <div className="w-full">
            <PowerBar correct={state.correctCount} total={level.questionsToEvolve} accentColor={level.accentColor} />
          </div>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: '0.42rem', color: '#888', textAlign: 'center' }}>
            {level.questionsToEvolve - state.correctCount} MORE CORRECT TO EVOLVE!
          </p>
        </div>

        {/* Question */}
        <div className="w-full flex flex-col items-center gap-3">
          <div className="w-full rounded-xl p-4 text-center"
            style={{ background: 'rgba(0,0,0,0.65)', border: `2px solid ${level.accentColor}`, boxShadow: `0 0 12px ${level.accentColor}22` }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#888', marginBottom: 8 }}>
              QUESTION {state.correctCount + 1} OF {level.questionsToEvolve}
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: '1.5rem', color: '#ffffff', letterSpacing: '0.05em' }}>
              {state.currentQuestion?.text ?? '...'}
            </div>
          </div>

          {/* Feedback */}
          {state.feedback && (
            <div className="w-full rounded-lg py-2 px-4 text-center"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: '0.5rem',
                background: state.feedbackCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${state.feedbackCorrect ? '#22c55e' : '#ef4444'}`,
                color: state.feedbackCorrect ? '#22c55e' : '#ef4444',
              }}>
              {state.feedback}
            </div>
          )}
        </div>

        {/* Keypad */}
        <div className="w-full pb-4">
          <NumberKeypad
            currentInput={input}
            onDigit={d => setInput(prev => prev.length < 4 ? prev + d : prev)}
            onDelete={() => setInput(prev => prev.slice(0, -1))}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
