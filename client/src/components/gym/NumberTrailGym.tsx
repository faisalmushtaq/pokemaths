import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { PIXEL_FONT } from '@/lib/gameConstants';

interface TrailChallenge {
  id: string;
  title: string;
  prompt: string;
  target: number;
  start: number;
  range: readonly [number, number];
  hint: string;
  relationship: string;
}

const TRAIL_CHALLENGES: TrailChallenge[] = [
  {
    id: 'find-seven',
    title: 'Find a number',
    prompt: 'Place the trail marker on 7.',
    target: 7,
    start: 3,
    range: [0, 10],
    hint: 'Start at 0 and count each trail marker: 1, 2, 3 ... until you reach 7.',
    relationship: '7 is seven equal steps after 0 on this number trail.',
  },
  {
    id: 'count-on',
    title: 'Count forwards',
    prompt: 'Start at 5. Move 4 steps forwards. Where will you land?',
    target: 9,
    start: 5,
    range: [0, 10],
    hint: 'Begin on 5. Count the spaces, rather than the starting marker: 6, 7, 8, 9.',
    relationship: 'Four steps forwards from 5 lands on 9.',
  },
  {
    id: 'before-ten',
    title: 'Find before',
    prompt: 'Place the marker on the number just before 10.',
    target: 9,
    start: 10,
    range: [0, 10],
    hint: 'The number before means one step to the left. Step back once from 10.',
    relationship: '9 is one less than 10, so it sits directly before 10.',
  },
  {
    id: 'teen-number',
    title: 'Find a teen number',
    prompt: 'Place the marker on 14.',
    target: 14,
    start: 10,
    range: [10, 20],
    hint: 'Start at 10, then move forward four equal steps: 11, 12, 13, 14.',
    relationship: '14 is ten and four more, so it is four steps after 10.',
  },
];

function rangeValues([start, end]: readonly [number, number]) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function NumberTrailGym({
  onBack,
  onReturnToJourney,
}: {
  onBack: () => void;
  onReturnToJourney: () => void;
}) {
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selected, setSelected] = useState(TRAIL_CHALLENGES[0].start);
  const [checked, setChecked] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [showHint, setShowHint] = useState(false);
  const [complete, setComplete] = useState(false);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const challenge = TRAIL_CHALLENGES[challengeIndex];
  const values = useMemo(() => rangeValues(challenge.range), [challenge.range]);
  const selectedIndex = Math.max(0, values.indexOf(selected));
  const selectedPercent = values.length > 1 ? (selectedIndex / (values.length - 1)) * 100 : 0;

  const selectFromPointer = (clientX: number) => {
    const line = lineRef.current;
    if (!line) return;
    const rect = line.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const index = Math.round(fraction * (values.length - 1));
    setSelected(values[index]);
    setChecked('idle');
  };

  const beginDrag = (event: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    selectFromPointer(event.clientX);
  };

  const continueDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (draggingRef.current) selectFromPointer(event.clientX);
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const resetTrail = () => {
    setSelected(challenge.start);
    setChecked('idle');
    setShowHint(false);
  };

  const checkTrail = () => {
    setChecked(selected === challenge.target ? 'correct' : 'incorrect');
  };

  const nextChallenge = () => {
    const nextIndex = challengeIndex + 1;
    if (nextIndex >= TRAIL_CHALLENGES.length) {
      setComplete(true);
      return;
    }
    const next = TRAIL_CHALLENGES[nextIndex];
    setChallengeIndex(nextIndex);
    setSelected(next.start);
    setChecked('idle');
    setShowHint(false);
  };

  if (complete) {
    return (
      <div className="flex-1 w-full overflow-y-auto" style={{ backgroundImage: "linear-gradient(rgba(4,20,23,0.46), rgba(7,12,30,0.88)), url('/images/viridian-number-trail-bg.webp')", backgroundPosition: 'center', backgroundSize: 'cover' }}>
        <div className="w-full flex flex-col items-center" style={{ minHeight: '100%', padding: 'clamp(1rem,4vw,2rem) 1rem' }}>
          <div className="w-full rounded-2xl" style={{ maxWidth: '32rem', padding: 'clamp(1.1rem,5vw,1.8rem)', background: 'rgba(5,20,31,0.9)', border: '2px solid #34d399', boxShadow: '0 0 28px rgba(52,211,153,0.28)', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(2rem,10vw,3rem)', marginBottom: '0.6rem' }}>🌲</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.72rem,3.5vw,1rem)', color: '#86efac', lineHeight: 1.7 }}>TRAIL COMPLETE</div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.56rem)', color: '#e2e8f0', lineHeight: 2, margin: '0.9rem auto 1.25rem', maxWidth: '26rem' }}>You used a number trail to find, count on, and compare numbers. Carry this idea into your Journey battles.</p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={onReturnToJourney} className="w-full rounded-xl" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.5rem,2.4vw,0.7rem)', padding: '0.85rem 0.7rem', background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '2px solid #fde68a', cursor: 'pointer' }}>▶ RETURN TO JOURNEY</button>
              <button type="button" onClick={() => { setChallengeIndex(0); setSelected(TRAIL_CHALLENGES[0].start); setChecked('idle'); setShowHint(false); setComplete(false); }} className="w-full rounded-xl" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', padding: '0.7rem', background: 'rgba(15,23,42,0.82)', color: '#7dd3fc', border: '1px solid #38bdf8', cursor: 'pointer' }}>↻ PRACTISE AGAIN</button>
              <button type="button" onClick={onBack} className="w-full rounded-xl" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.38rem,1.8vw,0.52rem)', padding: '0.65rem', background: 'transparent', color: '#cbd5e1', border: '1px solid #64748b', cursor: 'pointer' }}>← BACK TO KANTO</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full overflow-y-auto" style={{ backgroundImage: "linear-gradient(rgba(4,20,23,0.36), rgba(7,12,30,0.82)), url('/images/viridian-number-trail-bg.webp')", backgroundPosition: 'center', backgroundSize: 'cover' }}>
      <div className="w-full flex flex-col items-center" style={{ minHeight: '100%', padding: 'clamp(0.75rem,3vw,1.35rem) 0.8rem 1.25rem' }}>
        <div className="w-full flex flex-col gap-3" style={{ maxWidth: '35rem' }}>
          <section className="rounded-2xl" style={{ padding: 'clamp(0.8rem,3.5vw,1.2rem)', background: 'rgba(4,24,28,0.88)', border: '2px solid #34d399', boxShadow: '0 0 22px rgba(16,185,129,0.24)' }}>
            <div className="flex items-center justify-between gap-3" style={{ marginBottom: '0.55rem' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.48rem,2.25vw,0.68rem)', color: '#86efac', lineHeight: 1.6 }}>VIRIDIAN FOREST · NUMBER TRAIL</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.75vw,0.5rem)', color: '#fef3c7', padding: '0.36rem 0.5rem', background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.55)', borderRadius: '0.4rem', flexShrink: 0 }}>{challengeIndex + 1}/{TRAIL_CHALLENGES.length}</div>
            </div>
            <div style={{ height: '0.42rem', background: 'rgba(255,255,255,0.14)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.22)' }}>
              <div style={{ width: `${((challengeIndex + (checked === 'correct' ? 1 : 0)) / TRAIL_CHALLENGES.length) * 100}%`, minWidth: '7%', height: '100%', background: 'linear-gradient(90deg, #34d399, #facc15)', transition: 'width 220ms ease' }} />
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.75vw,0.5rem)', color: '#cbd5e1', lineHeight: 1.65, marginTop: '0.65rem' }}>Move the marker by dragging it along the trail or tapping a number marker. Check when you are ready.</div>
          </section>

          <section className="rounded-2xl" style={{ padding: 'clamp(0.95rem,4vw,1.4rem)', background: 'rgba(7,16,30,0.9)', border: '2px solid #facc15', boxShadow: '0 8px 28px rgba(0,0,0,0.38)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: '#facc15', marginBottom: '0.55rem' }}>{challenge.title.toUpperCase()}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.58rem,2.7vw,0.82rem)', color: '#f8fafc', lineHeight: 1.75 }}>{challenge.prompt}</div>

            <div style={{ marginTop: 'clamp(1.8rem,8vw,3rem)', padding: '0.7rem 0.45rem 0.25rem', background: 'linear-gradient(180deg, rgba(15,74,63,0.5), rgba(10,35,39,0.42))', border: '1px solid rgba(52,211,153,0.35)', borderRadius: '0.8rem' }}>
              <div ref={lineRef} style={{ position: 'relative', height: 'clamp(5.6rem,26vw,7.5rem)', touchAction: 'none', userSelect: 'none' }}>
                <div style={{ position: 'absolute', height: '0.42rem', left: '4%', right: '4%', top: '53%', background: 'linear-gradient(90deg, #a16207, #facc15, #a16207)', borderRadius: '1rem', boxShadow: '0 0 9px rgba(250,204,21,0.62)' }} />
                {values.map((value, index) => {
                  const position = values.length > 1 ? (index / (values.length - 1)) * 100 : 50;
                  const active = value === selected;
                  const target = checked !== 'idle' && value === challenge.target;
                  return (
                    <button key={value} type="button" onClick={() => { setSelected(value); setChecked('idle'); }} aria-label={`Place trail marker at ${value}`} style={{ position: 'absolute', left: `${position}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(1.45rem,7.5vw,2.15rem)', height: 'clamp(1.45rem,7.5vw,2.15rem)', borderRadius: '50%', border: `2px solid ${target ? '#22c55e' : active ? '#38bdf8' : '#fef3c7'}`, background: target ? '#166534' : active ? '#0c4a6e' : '#1f2937', color: target || active ? '#fff' : '#e2e8f0', boxShadow: active ? '0 0 12px rgba(56,189,248,0.9)' : '0 0 5px rgba(250,204,21,0.35)', cursor: 'pointer', fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.62rem)', zIndex: 2, padding: 0 }}>{value}</button>
                  );
                })}
                <button type="button" onPointerDown={beginDrag} onPointerMove={continueDrag} onPointerUp={endDrag} onPointerCancel={endDrag} aria-label={`Trail marker currently on ${selected}. Drag it or tap a number marker.`} style={{ position: 'absolute', left: `${selectedPercent}%`, top: '8%', transform: 'translateX(-50%)', width: 'clamp(2.2rem,11vw,3.1rem)', minHeight: 'clamp(2.1rem,10vw,2.8rem)', borderRadius: '0.55rem', border: '2px solid #fef08a', background: 'linear-gradient(135deg, #f97316, #facc15)', color: '#111827', boxShadow: '0 0 15px rgba(250,204,21,0.7)', cursor: 'grab', touchAction: 'none', zIndex: 4, fontFamily: PIXEL_FONT, fontSize: 'clamp(0.62rem,3vw,0.84rem)', lineHeight: 1 }}>▲<br />{selected}</button>
              </div>
            </div>

            {checked !== 'idle' && (
              <div role="status" className="rounded-xl" style={{ marginTop: '0.85rem', padding: '0.72rem', background: checked === 'correct' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.14)', border: `1px solid ${checked === 'correct' ? '#22c55e' : '#ef4444'}` }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: checked === 'correct' ? '#86efac' : '#fca5a5', lineHeight: 1.7 }}>{checked === 'correct' ? 'TRAIL FOUND!' : 'TRY THE TRAIL AGAIN'}</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#e2e8f0', lineHeight: 1.75, marginTop: 4 }}>{checked === 'correct' ? challenge.relationship : challenge.hint}</div>
              </div>
            )}

            {showHint && checked === 'idle' && (
              <div role="status" className="rounded-xl" style={{ marginTop: '0.85rem', padding: '0.72rem', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#bae6fd', lineHeight: 1.8 }}>{challenge.hint}</div>
              </div>
            )}

            <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
              <button type="button" onClick={resetTrail} style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.7vw,0.48rem)', padding: '0.68rem 0.35rem', background: 'rgba(148,163,184,0.13)', color: '#e2e8f0', border: '1px solid #64748b', borderRadius: '0.55rem', cursor: 'pointer' }}>↻ RESET</button>
              <button type="button" onClick={() => setShowHint((current) => !current)} style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.7vw,0.48rem)', padding: '0.68rem 0.35rem', background: 'rgba(56,189,248,0.12)', color: '#7dd3fc', border: '1px solid #38bdf8', borderRadius: '0.55rem', cursor: 'pointer' }}>? HINT</button>
              {checked === 'correct' ? (
                <button type="button" onClick={nextChallenge} style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.7vw,0.48rem)', padding: '0.68rem 0.35rem', background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '1px solid #fde68a', borderRadius: '0.55rem', cursor: 'pointer' }}>NEXT ▶</button>
              ) : (
                <button type="button" onClick={checkTrail} style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.7vw,0.48rem)', padding: '0.68rem 0.35rem', background: 'linear-gradient(135deg, #34d399, #059669)', color: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '0.55rem', cursor: 'pointer' }}>✓ CHECK</button>
              )}
            </div>
          </section>

          <button type="button" onClick={onBack} style={{ alignSelf: 'center', fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.8vw,0.5rem)', color: '#cbd5e1', background: 'rgba(15,23,42,0.74)', border: '1px solid #64748b', borderRadius: '0.5rem', padding: '0.65rem 0.9rem', cursor: 'pointer' }}>← BACK TO KANTO</button>
        </div>
      </div>
    </div>
  );
}
