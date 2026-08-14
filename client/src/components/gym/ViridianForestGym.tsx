import { useState } from 'react';
import { PIXEL_FONT } from '@/lib/gameConstants';
import { NumberTrailGym } from './NumberTrailGym';

type StationId = 'canopy' | 'balance' | 'tenFrame' | 'trail';
type CheckState = 'idle' | 'correct' | 'incorrect';

interface ViridianForestGymProps {
  onBack: () => void;
  onReturnToJourney: () => void;
}

const BACKGROUND = {
  backgroundImage: "linear-gradient(rgba(4,20,23,0.38), rgba(7,12,30,0.88)), url('/images/viridian-number-trail-bg.webp')",
  backgroundPosition: 'center',
  backgroundSize: 'cover',
} as const;

const panelStyle = {
  background: 'rgba(5,20,31,0.9)',
  border: '2px solid #34d399',
  boxShadow: '0 0 22px rgba(16,185,129,0.24)',
} as const;

const controlStyle = {
  fontFamily: PIXEL_FONT,
  fontSize: 'clamp(0.36rem,1.75vw,0.52rem)',
  padding: '0.72rem 0.5rem',
  borderRadius: '0.6rem',
  cursor: 'pointer',
} as const;

function StationPage({
  title,
  subtitle,
  step,
  total,
  children,
  onBack,
}: {
  title: string;
  subtitle: string;
  step: number;
  total: number;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 w-full overflow-y-auto" style={BACKGROUND}>
      <div className="w-full flex flex-col items-center" style={{ minHeight: '100%', padding: 'clamp(0.75rem,3vw,1.35rem) 0.8rem 1.25rem' }}>
        <div className="w-full flex flex-col gap-3" style={{ maxWidth: '35rem' }}>
          <section className="rounded-2xl" style={{ ...panelStyle, padding: 'clamp(0.8rem,3.5vw,1.2rem)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.48rem,2.25vw,0.68rem)', color: '#86efac', lineHeight: 1.6 }}>{title.toUpperCase()}</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#cbd5e1', lineHeight: 1.7, marginTop: '0.3rem' }}>{subtitle}</div>
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.75vw,0.5rem)', color: '#fef3c7', padding: '0.36rem 0.5rem', background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.55)', borderRadius: '0.4rem', flexShrink: 0 }}>{step}/{total}</div>
            </div>
            <div style={{ height: '0.42rem', background: 'rgba(255,255,255,0.14)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.22)', marginTop: '0.7rem' }}>
              <div style={{ width: `${(step / total) * 100}%`, minWidth: '8%', height: '100%', background: 'linear-gradient(90deg, #34d399, #facc15)', transition: 'width 220ms ease' }} />
            </div>
          </section>
          {children}
          <button type="button" onClick={onBack} style={{ alignSelf: 'center', ...controlStyle, color: '#cbd5e1', background: 'rgba(15,23,42,0.74)', border: '1px solid #64748b', padding: '0.65rem 0.9rem' }}>← BACK TO VIRIDIAN GYM</button>
        </div>
      </div>
    </div>
  );
}

function Feedback({ state, explanation, hint }: { state: CheckState; explanation: string; hint: string }) {
  if (state === 'idle') return null;
  const correct = state === 'correct';
  return (
    <div role="status" className="rounded-xl" style={{ marginTop: '0.9rem', padding: '0.78rem', background: correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.14)', border: `1px solid ${correct ? '#22c55e' : '#ef4444'}` }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: correct ? '#86efac' : '#fca5a5', lineHeight: 1.7 }}>{correct ? 'CONCEPT FOUND!' : 'LOOK AGAIN'}</div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#e2e8f0', lineHeight: 1.8, marginTop: 4 }}>{correct ? explanation : hint}</div>
    </div>
  );
}

function Completion({
  title,
  message,
  onReplay,
  onJourney,
  onBack,
}: {
  title: string;
  message: string;
  onReplay: () => void;
  onJourney: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 w-full overflow-y-auto" style={BACKGROUND}>
      <div className="w-full flex flex-col items-center" style={{ minHeight: '100%', padding: 'clamp(1rem,4vw,2rem) 1rem' }}>
        <div className="w-full rounded-2xl" style={{ maxWidth: '32rem', padding: 'clamp(1.1rem,5vw,1.8rem)', background: 'rgba(5,20,31,0.92)', border: '2px solid #34d399', boxShadow: '0 0 28px rgba(52,211,153,0.28)', textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(2.2rem,10vw,3.3rem)', marginBottom: '0.6rem' }}>🌲</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.72rem,3.5vw,1rem)', color: '#86efac', lineHeight: 1.7 }}>{title.toUpperCase()}</div>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.56rem)', color: '#e2e8f0', lineHeight: 2, margin: '0.9rem auto 1.25rem', maxWidth: '26rem' }}>{message}</p>
          <div className="flex flex-col gap-2">
            <button type="button" onClick={onJourney} className="w-full rounded-xl" style={{ ...controlStyle, fontSize: 'clamp(0.5rem,2.4vw,0.7rem)', padding: '0.85rem 0.7rem', background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '2px solid #fde68a' }}>▶ RETURN TO JOURNEY</button>
            <button type="button" onClick={onReplay} className="w-full rounded-xl" style={{ ...controlStyle, color: '#7dd3fc', background: 'rgba(15,23,42,0.82)', border: '1px solid #38bdf8' }}>↻ PRACTISE AGAIN</button>
            <button type="button" onClick={onBack} className="w-full rounded-xl" style={{ ...controlStyle, color: '#cbd5e1', background: 'transparent', border: '1px solid #64748b' }}>← BACK TO GYM</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CANOPY_CHALLENGES = [
  { title: 'Count each creature once', prompt: 'Tap every Caterpie in the clearing, then choose how many there are.', count: 6, choices: [5, 6, 7], explanation: 'There are 6 Caterpie because each creature was counted once: 1, 2, 3, 4, 5, 6.', hint: 'Tap each Caterpie once. A glow means it has already been counted.' },
  { title: 'Count an arrangement', prompt: 'The berries have moved. How many are there now?', count: 8, choices: [7, 8, 9], explanation: 'There are still 8 berries. Changing the arrangement does not change the quantity.', hint: 'Trace from left to right and tap each berry once.' },
  { title: 'Find the empty clearing', prompt: 'Which numeral matches an empty clearing?', count: 0, choices: [0, 1, 2], explanation: 'Zero describes a set with no objects. An empty clearing has 0 berries.', hint: 'Look for the clearing with no berries at all.' },
] as const;

function CanopyCount({ onBack, onJourney }: { onBack: () => void; onJourney: () => void }) {
  const [index, setIndex] = useState(0);
  const [counted, setCounted] = useState<number[]>([]);
  const [answer, setAnswer] = useState<number | null>(null);
  const [state, setState] = useState<CheckState>('idle');
  const [complete, setComplete] = useState(false);
  const challenge = CANOPY_CHALLENGES[index];
  const displayCount = challenge.count === 0 ? 0 : challenge.count;

  const reset = () => { setCounted([]); setAnswer(null); setState('idle'); };
  const toggleCounted = (item: number) => {
    if (state === 'correct') return;
    setCounted((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
    setState('idle');
  };
  const check = () => setState(answer === challenge.count && counted.length === challenge.count ? 'correct' : 'incorrect');
  const next = () => {
    if (index + 1 >= CANOPY_CHALLENGES.length) { setComplete(true); return; }
    setIndex((current) => current + 1);
    reset();
  };

  if (complete) return <Completion title="Canopy Count complete" message="You counted carefully, noticed that an arrangement can change without changing the quantity, and used zero to describe an empty set." onReplay={() => { setIndex(0); reset(); setComplete(false); }} onJourney={onJourney} onBack={onBack} />;

  return (
    <StationPage title="Viridian Forest · Canopy Count" subtitle="Tap each item once, then match the numeral to the quantity." step={index + 1} total={CANOPY_CHALLENGES.length} onBack={onBack}>
      <section className="rounded-2xl" style={{ padding: 'clamp(0.95rem,4vw,1.4rem)', background: 'rgba(7,16,30,0.92)', border: '2px solid #facc15', boxShadow: '0 8px 28px rgba(0,0,0,0.38)' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: '#facc15', marginBottom: '0.55rem' }}>{challenge.title.toUpperCase()}</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.58rem,2.7vw,0.82rem)', color: '#f8fafc', lineHeight: 1.75 }}>{challenge.prompt}</div>
        <div className="grid grid-cols-4" style={{ gap: '0.72rem', marginTop: '1.25rem', padding: '1rem', minHeight: '9rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(52,211,153,0.42)', borderRadius: '1rem' }}>
          {Array.from({ length: displayCount }, (_, item) => {
            const selected = counted.includes(item);
            return <button key={item} type="button" onClick={() => toggleCounted(item)} aria-label={`Caterpie ${item + 1}${selected ? ', counted' : ''}`} style={{ minHeight: '3.25rem', borderRadius: '0.85rem', border: `2px solid ${selected ? '#facc15' : 'rgba(134,239,172,0.62)'}`, background: selected ? 'rgba(250,204,21,0.2)' : 'rgba(5,46,22,0.62)', boxShadow: selected ? '0 0 14px rgba(250,204,21,0.55)' : 'none', cursor: 'pointer', fontSize: 'clamp(1.45rem,7vw,2.1rem)' }}>🐛</button>;
          })}
          {challenge.count === 0 && <div className="col-span-4 flex items-center justify-center" style={{ minHeight: '7rem', border: '1px dashed rgba(134,239,172,0.45)', borderRadius: '0.75rem', fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.6rem)', color: '#bbf7d0' }}>THE CLEARING IS EMPTY</div>}
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#bae6fd', lineHeight: 1.7, marginTop: '0.75rem' }}>COUNTED: {counted.length}/{challenge.count}</div>
        <div className="grid grid-cols-3" style={{ gap: '0.55rem', marginTop: '0.85rem' }}>
          {challenge.choices.map((choice) => <button key={choice} type="button" onClick={() => { setAnswer(choice); setState('idle'); }} style={{ ...controlStyle, minHeight: '3.25rem', fontSize: 'clamp(0.7rem,3vw,1rem)', background: answer === choice ? 'rgba(56,189,248,0.25)' : 'rgba(15,23,42,0.82)', color: answer === choice ? '#e0f2fe' : '#cbd5e1', border: `2px solid ${answer === choice ? '#38bdf8' : '#64748b'}` }}>{choice}</button>)}
        </div>
        <Feedback state={state} explanation={challenge.explanation} hint={challenge.hint} />
        <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
          <button type="button" onClick={reset} style={{ ...controlStyle, color: '#e2e8f0', background: 'rgba(148,163,184,0.13)', border: '1px solid #64748b' }}>↻ RESET</button>
          <button type="button" onClick={() => setState('incorrect')} style={{ ...controlStyle, color: '#7dd3fc', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8' }}>? HINT</button>
          {state === 'correct' ? <button type="button" onClick={next} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '1px solid #fde68a' }}>NEXT ▶</button> : <button type="button" onClick={check} style={{ ...controlStyle, background: 'linear-gradient(135deg, #34d399, #059669)', color: '#ecfdf5', border: '1px solid #6ee7b7' }}>✓ CHECK</button>}
        </div>
      </section>
    </StationPage>
  );
}

const BALANCE_CHALLENGES = [
  { title: 'Compare quantities', left: 5, right: 7, answer: 'right', prompt: 'Which pan has more berries?', explanation: '7 is greater than 5 because the right pan has two more berries.', hint: 'Count both pans. Look for the pan with the larger total.' },
  { title: 'Find equal', left: 6, right: 6, answer: 'equal', prompt: 'Do the two pans show the same quantity?', explanation: 'Both pans show 6 berries. Equal means the quantities are the same.', hint: 'Count each pan one by one and compare the totals.' },
  { title: 'Compare numerals', left: 9, right: 4, answer: 'left', prompt: 'Which pan has the greater number?', explanation: '9 is greater than 4. On a number line, 9 sits further to the right.', hint: 'Think about which number comes later when you count.' },
] as const;

function PikachuBalance({ onBack, onJourney }: { onBack: () => void; onJourney: () => void }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [state, setState] = useState<CheckState>('idle');
  const [complete, setComplete] = useState(false);
  const challenge = BALANCE_CHALLENGES[index];
  const reset = () => { setAnswer(null); setState('idle'); };
  const check = () => setState(answer === challenge.answer ? 'correct' : 'incorrect');
  const next = () => {
    if (index + 1 >= BALANCE_CHALLENGES.length) { setComplete(true); return; }
    setIndex((current) => current + 1); reset();
  };

  if (complete) return <Completion title="Balance complete" message="You compared quantities and numerals, including a pair with exactly the same value. Use this idea when ordering numbers in Journey." onReplay={() => { setIndex(0); reset(); setComplete(false); }} onJourney={onJourney} onBack={onBack} />;

  return (
    <StationPage title="Viridian Forest · Pikachu’s Balance" subtitle="Compare both sides and choose greater, less, or equal." step={index + 1} total={BALANCE_CHALLENGES.length} onBack={onBack}>
      <section className="rounded-2xl" style={{ padding: 'clamp(0.95rem,4vw,1.4rem)', background: 'rgba(7,16,30,0.92)', border: '2px solid #facc15', boxShadow: '0 8px 28px rgba(0,0,0,0.38)' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: '#facc15', marginBottom: '0.55rem' }}>{challenge.title.toUpperCase()}</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.58rem,2.7vw,0.82rem)', color: '#f8fafc', lineHeight: 1.75 }}>{challenge.prompt}</div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end" style={{ gap: '0.65rem', marginTop: '1.25rem' }}>
          <div className="rounded-xl" style={{ minHeight: '8.6rem', padding: '0.65rem', background: 'rgba(56,189,248,0.1)', border: '2px solid #38bdf8', textAlign: 'center' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.5rem,2.4vw,0.7rem)', color: '#bae6fd', marginBottom: '0.7rem' }}>LEFT</div><div style={{ fontSize: 'clamp(1.05rem,5vw,1.6rem)', lineHeight: 1.5, wordBreak: 'break-word' }}>{'🫐'.repeat(challenge.left)}</div><div style={{ fontFamily: PIXEL_FONT, color: '#f8fafc', fontSize: 'clamp(0.68rem,3vw,0.98rem)', marginTop: '0.5rem' }}>{challenge.left}</div></div>
          <div style={{ fontSize: 'clamp(1.5rem,7vw,2.2rem)', paddingBottom: '2.1rem' }}>⚖️</div>
          <div className="rounded-xl" style={{ minHeight: '8.6rem', padding: '0.65rem', background: 'rgba(244,114,182,0.1)', border: '2px solid #f472b6', textAlign: 'center' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.5rem,2.4vw,0.7rem)', color: '#fbcfe8', marginBottom: '0.7rem' }}>RIGHT</div><div style={{ fontSize: 'clamp(1.05rem,5vw,1.6rem)', lineHeight: 1.5, wordBreak: 'break-word' }}>{'🫐'.repeat(challenge.right)}</div><div style={{ fontFamily: PIXEL_FONT, color: '#f8fafc', fontSize: 'clamp(0.68rem,3vw,0.98rem)', marginTop: '0.5rem' }}>{challenge.right}</div></div>
        </div>
        <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
          {[['left', '◀ LEFT'], ['equal', '= EQUAL'], ['right', 'RIGHT ▶']].map(([value, label]) => <button key={value} type="button" onClick={() => { setAnswer(value); setState('idle'); }} style={{ ...controlStyle, minHeight: '3.1rem', background: answer === value ? 'rgba(56,189,248,0.25)' : 'rgba(15,23,42,0.82)', color: answer === value ? '#e0f2fe' : '#cbd5e1', border: `2px solid ${answer === value ? '#38bdf8' : '#64748b'}` }}>{label}</button>)}
        </div>
        <Feedback state={state} explanation={challenge.explanation} hint={challenge.hint} />
        <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
          <button type="button" onClick={reset} style={{ ...controlStyle, color: '#e2e8f0', background: 'rgba(148,163,184,0.13)', border: '1px solid #64748b' }}>↻ RESET</button>
          <button type="button" onClick={() => setState('incorrect')} style={{ ...controlStyle, color: '#7dd3fc', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8' }}>? HINT</button>
          {state === 'correct' ? <button type="button" onClick={next} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '1px solid #fde68a' }}>NEXT ▶</button> : <button type="button" onClick={check} style={{ ...controlStyle, background: 'linear-gradient(135deg, #34d399, #059669)', color: '#ecfdf5', border: '1px solid #6ee7b7' }}>✓ CHECK</button>}
        </div>
      </section>
    </StationPage>
  );
}

const TEN_FRAME_CHALLENGES = [
  { title: 'Build a teen number', target: 14, prompt: 'A full ten-frame is one ten. Add the right number of loose counters to build 14.', explanation: '14 is one ten and four ones. The full frame shows ten, and four loose counters make fourteen.', hint: 'Keep the full frame as ten. Count on four more: 11, 12, 13, 14.' },
  { title: 'Build another teen', target: 17, prompt: 'Change the loose counters to build 17.', explanation: '17 is one ten and seven ones. Ten stays together while the ones tell you the extra amount.', hint: 'Start from ten, then count seven more counters.' },
  { title: 'Read the structure', target: 12, prompt: 'Use the counters to show 12 as a ten and some more.', explanation: '12 is one ten and two ones. The digit 1 shows one ten, and the digit 2 shows two ones.', hint: 'A teen number begins with a full group of ten. Add two loose counters.' },
] as const;

function TenFrameGrove({ onBack, onJourney }: { onBack: () => void; onJourney: () => void }) {
  const [index, setIndex] = useState(0);
  const [ones, setOnes] = useState(0);
  const [state, setState] = useState<CheckState>('idle');
  const [complete, setComplete] = useState(false);
  const challenge = TEN_FRAME_CHALLENGES[index];
  const reset = () => { setOnes(0); setState('idle'); };
  const check = () => setState(10 + ones === challenge.target ? 'correct' : 'incorrect');
  const next = () => {
    if (index + 1 >= TEN_FRAME_CHALLENGES.length) { setComplete(true); return; }
    setIndex((current) => current + 1); reset();
  };
  const fullFrame = Array.from({ length: 10 });
  const looseFrame = Array.from({ length: 10 });

  if (complete) return <Completion title="Ten-Frame Grove complete" message="You used a full ten and loose ones to build teen numbers. A teen number has one ten and some more ones." onReplay={() => { setIndex(0); reset(); setComplete(false); }} onJourney={onJourney} onBack={onBack} />;

  return (
    <StationPage title="Viridian Forest · Ten-Frame Grove" subtitle="Build a teen number as one ten and some more ones." step={index + 1} total={TEN_FRAME_CHALLENGES.length} onBack={onBack}>
      <section className="rounded-2xl" style={{ padding: 'clamp(0.95rem,4vw,1.4rem)', background: 'rgba(7,16,30,0.92)', border: '2px solid #facc15', boxShadow: '0 8px 28px rgba(0,0,0,0.38)' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: '#facc15', marginBottom: '0.55rem' }}>{challenge.title.toUpperCase()}</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.58rem,2.7vw,0.82rem)', color: '#f8fafc', lineHeight: 1.75 }}>{challenge.prompt}</div>
        <div className="grid grid-cols-2" style={{ gap: '0.75rem', marginTop: '1.2rem' }}>
          <div className="rounded-xl" style={{ padding: '0.7rem', background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.55)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#fef3c7', marginBottom: '0.55rem' }}>ONE TEN</div>
            <div className="grid grid-cols-5" style={{ gap: '0.24rem' }}>{fullFrame.map((_, item) => <div key={item} style={{ aspectRatio: '1', borderRadius: '0.32rem', background: '#facc15', border: '1px solid #fef08a', display: 'grid', placeItems: 'center', fontSize: 'clamp(0.62rem,3.2vw,0.9rem)' }}>●</div>)}</div>
          </div>
          <div className="rounded-xl" style={{ padding: '0.7rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.55)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#bae6fd', marginBottom: '0.55rem' }}>ONES: {ones}</div>
            <div className="grid grid-cols-5" style={{ gap: '0.24rem' }}>{looseFrame.map((_, item) => <button key={item} type="button" onClick={() => { setOnes(item + 1); setState('idle'); }} aria-label={`Set loose counters to ${item + 1}`} style={{ aspectRatio: '1', borderRadius: '0.32rem', background: item < ones ? '#38bdf8' : 'rgba(15,23,42,0.78)', color: item < ones ? '#e0f2fe' : '#475569', border: `1px solid ${item < ones ? '#bae6fd' : '#475569'}`, cursor: 'pointer', fontSize: 'clamp(0.62rem,3.2vw,0.9rem)', padding: 0 }}>{item < ones ? '●' : '·'}</button>)}</div>
          </div>
        </div>
        <div className="rounded-xl" style={{ marginTop: '0.9rem', padding: '0.78rem', textAlign: 'center', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.48)' }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.7vw,0.48rem)', color: '#bbf7d0' }}>YOU BUILT</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(1.15rem,5vw,1.75rem)', color: '#fef08a', marginTop: '0.35rem' }}>10 + {ones} = {10 + ones}</div>
        </div>
        <Feedback state={state} explanation={challenge.explanation} hint={challenge.hint} />
        <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
          <button type="button" onClick={reset} style={{ ...controlStyle, color: '#e2e8f0', background: 'rgba(148,163,184,0.13)', border: '1px solid #64748b' }}>↻ RESET</button>
          <button type="button" onClick={() => setState('incorrect')} style={{ ...controlStyle, color: '#7dd3fc', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8' }}>? HINT</button>
          {state === 'correct' ? <button type="button" onClick={next} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '1px solid #fde68a' }}>NEXT ▶</button> : <button type="button" onClick={check} style={{ ...controlStyle, background: 'linear-gradient(135deg, #34d399, #059669)', color: '#ecfdf5', border: '1px solid #6ee7b7' }}>✓ CHECK</button>}
        </div>
      </section>
    </StationPage>
  );
}

const STATIONS: { id: StationId; title: string; concept: string; action: string; colour: string; status: string }[] = [
  { id: 'canopy', title: 'Canopy Count', concept: 'Count each object once, match a numeral, and notice that zero means none.', action: 'TAP TO COUNT', colour: '#f59e0b', status: 'MODULE 1' },
  { id: 'balance', title: "Pikachu’s Balance", concept: 'Compare two quantities and explain greater, less, and equal.', action: 'COMPARE SETS', colour: '#38bdf8', status: 'MODULE 2' },
  { id: 'tenFrame', title: 'Ten-Frame Grove', concept: 'Build teen numbers as one full ten and some more ones.', action: 'BUILD TEENS', colour: '#a78bfa', status: 'MODULE 3' },
  { id: 'trail', title: 'Number Trail', concept: 'Locate, count on, and compare numbers by moving along equal steps.', action: 'FOLLOW TRAIL', colour: '#34d399', status: 'MODULE 4' },
];

export function ViridianForestGym({ onBack, onReturnToJourney }: ViridianForestGymProps) {
  const [station, setStation] = useState<StationId | null>(null);

  if (station === 'trail') return <NumberTrailGym onBack={() => setStation(null)} onReturnToJourney={onReturnToJourney} backLabel="← BACK TO GYM" />;
  if (station === 'canopy') return <CanopyCount onBack={() => setStation(null)} onJourney={onReturnToJourney} />;
  if (station === 'balance') return <PikachuBalance onBack={() => setStation(null)} onJourney={onReturnToJourney} />;
  if (station === 'tenFrame') return <TenFrameGrove onBack={() => setStation(null)} onJourney={onReturnToJourney} />;

  return (
    <div className="flex-1 w-full overflow-y-auto" style={BACKGROUND}>
      <div className="w-full flex flex-col items-center" style={{ minHeight: '100%', padding: 'clamp(0.85rem,4vw,1.6rem) 0.8rem 1.25rem' }}>
        <div className="w-full flex flex-col gap-3" style={{ maxWidth: '35rem' }}>
          <section className="rounded-2xl" style={{ ...panelStyle, padding: 'clamp(1rem,4vw,1.45rem)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.62rem,3vw,0.9rem)', color: '#86efac', lineHeight: 1.55 }}>VIRIDIAN FOREST GYM</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.75vw,0.52rem)', color: '#cbd5e1', lineHeight: 1.8, marginTop: '0.45rem' }}>TRAIN WITH MODELS, MOVEMENT, AND EXPLANATIONS. CHOOSE A CONCEPT STATION.</div>
              </div>
              <div style={{ fontSize: 'clamp(1.5rem,7vw,2.25rem)', lineHeight: 1 }}>🌲</div>
            </div>
          </section>

          <section className="rounded-2xl" style={{ padding: '0.85rem', background: 'rgba(7,16,30,0.9)', border: '2px solid #facc15', boxShadow: '0 8px 28px rgba(0,0,0,0.38)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.55rem)', color: '#fef3c7', padding: '0.28rem 0.2rem 0.65rem' }}>NUMBER SENSE STUDIOS</div>
            <div className="flex flex-col gap-2">
              {STATIONS.map((item) => <button key={item.id} type="button" onClick={() => setStation(item.id)} className="w-full text-left rounded-xl" style={{ padding: '0.85rem', background: 'rgba(15,23,42,0.78)', border: `1px solid ${item.colour}`, cursor: 'pointer', boxShadow: `0 0 12px ${item.colour}22` }}>
                <div className="flex items-center justify-between gap-3"><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.45rem,2.1vw,0.62rem)', color: item.colour }}>{item.title.toUpperCase()}</div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.3rem,1.45vw,0.42rem)', color: '#e2e8f0', border: `1px solid ${item.colour}88`, borderRadius: '0.3rem', padding: '0.25rem 0.34rem', flexShrink: 0 }}>{item.status}</div></div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.55vw,0.46rem)', color: '#cbd5e1', lineHeight: 1.75, marginTop: '0.45rem' }}>{item.concept}</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.55vw,0.46rem)', color: '#fef08a', marginTop: '0.55rem' }}>▶ {item.action}</div>
              </button>)}
            </div>
          </section>

          <div className="grid grid-cols-2" style={{ gap: '0.55rem' }}>
            <button type="button" onClick={onReturnToJourney} style={{ ...controlStyle, color: '#111827', background: 'linear-gradient(135deg, #facc15, #f59e0b)', border: '1px solid #fde68a' }}>▶ JOURNEY</button>
            <button type="button" onClick={onBack} style={{ ...controlStyle, color: '#cbd5e1', background: 'rgba(15,23,42,0.78)', border: '1px solid #64748b' }}>← KANTO</button>
          </div>
        </div>
      </div>
    </div>
  );
}
