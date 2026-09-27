import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { PIXEL_FONT } from '@/lib/gameConstants';
import { PixelIcon, PixelIconLabel } from '@/components/ui/PixelIcon';
import { GYM_ENGINE_LABELS, getGymTopicsForRegion, type GymEngineId, type GymTopicConfig } from '@/lib/gymContent';
import type { CurriculumRegion } from '@/lib/curriculumRegions';
import { getGymBadge, type GymBadgeDefinition } from '@/lib/gymBadges';
import { gymTaskFor, gymTaskStart, type GymTask } from '@/lib/gymTasks';
import { hasGymBadge, type SaveData } from '@/lib/pokedex';

const ViridianForestGym = lazy(async () => {
  const module = await import('./ViridianForestGym');
  return { default: module.ViridianForestGym };
});

type CheckState = 'idle' | 'correct' | 'incorrect' | 'hint';
type View = 'hub' | 'practice' | 'viridian' | 'johtoWorkshop';

interface RegionalGymProps {
  region: CurriculumRegion;
  save: SaveData;
  onBack: () => void;
  onReturnToJourney: (topicId: string) => void;
  onRecordPractice: (stationId: string, examplesCompleted: number, hintsUsed: number) => void;
}

const controlStyle = {
  fontFamily: PIXEL_FONT,
  fontSize: 'clamp(0.36rem, 1.7vw, 0.5rem)',
  minHeight: '2.95rem',
  borderRadius: '0.65rem',
  cursor: 'pointer',
} as const;

function panel(accent: string) {
  return {
    background: 'rgba(7,16,30,0.91)',
    border: `2px solid ${accent}`,
    boxShadow: `0 0 22px ${accent}33`,
  } as const;
}

function Shell({
  region,
  title,
  subtitle,
  children,
  onBack,
}: {
  region: CurriculumRegion;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 w-full overflow-y-auto" style={{ background: region.bgGradient }}>
      <div className="w-full flex flex-col items-center" style={{ minHeight: '100%', padding: 'clamp(0.8rem,4vw,1.5rem) 0.8rem 1.25rem' }}>
        <div className="w-full flex flex-col gap-3" style={{ maxWidth: '36rem' }}>
          <section className="rounded-2xl" style={{ ...panel(region.accentColor), padding: 'clamp(0.95rem,4vw,1.35rem)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.64rem,3vw,0.9rem)', color: region.accentColor, lineHeight: 1.55 }}>{title.toUpperCase()}</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.49rem)', color: '#dbeafe', lineHeight: 1.8, marginTop: '0.35rem' }}>{subtitle}</div>
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.55vw,0.44rem)', color: '#fef3c7', background: 'rgba(250,204,21,0.13)', border: '1px solid rgba(250,204,21,0.65)', borderRadius: '0.4rem', padding: '0.38rem 0.48rem', flexShrink: 0 }}>{region.name.toUpperCase()}</div>
            </div>
          </section>
          {children}
          <button type="button" onClick={onBack} style={{ ...controlStyle, alignSelf: 'center', color: '#dbeafe', background: 'rgba(15,23,42,0.78)', border: '1px solid #64748b', padding: '0.6rem 0.9rem' }}><PixelIconLabel name="arrowLeft" size="0.8em">BACK TO REGION</PixelIconLabel></button>
        </div>
      </div>
    </div>
  );
}

function Feedback({ state, explanation, hint }: { state: CheckState; explanation: string; hint: string }) {
  if (state === 'idle') return null;
  const tone = state === 'correct'
    ? { title: 'CORRECT!', text: explanation, color: '#86efac', border: '#22c55e', bg: 'rgba(34,197,94,0.14)' }
    : state === 'hint'
      ? { title: 'HINT', text: hint, color: '#7dd3fc', border: '#38bdf8', bg: 'rgba(56,189,248,0.12)' }
      : { title: 'NOT QUITE. TRY AGAIN', text: hint, color: '#fca5a5', border: '#ef4444', bg: 'rgba(239,68,68,0.14)' };
  return (
    <div role="status" className="rounded-xl" style={{ marginTop: '0.85rem', padding: '0.78rem', background: tone.bg, border: `1px solid ${tone.border}` }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.56rem)', color: tone.color, lineHeight: 1.7 }}>{tone.title}</div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.58vw,0.47rem)', color: '#e2e8f0', lineHeight: 1.8, marginTop: '0.3rem' }}>{tone.text}</div>
    </div>
  );
}

function FractionModel({ denominator, selected, onSelect, accent }: { denominator: number; selected: number; onSelect: (value: number) => void; accent: string }) {
  const [dragging, setDragging] = useState(false);
  const setFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const proportion = Math.min(0.999, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    onSelect(Math.max(1, Math.min(denominator, Math.ceil(proportion * denominator))));
  };
  return (
    <div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.5vw,0.44rem)', color: '#cbd5e1', marginTop: '0.68rem' }}>DRAG ACROSS PARTS OR TAP A PART TO SHADE IT</div>
      <div
        className="grid"
        role="slider"
        aria-label="Drag to shade equal fraction parts"
        aria-valuemin={1}
        aria-valuemax={denominator}
        aria-valuenow={selected}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); setFromPointer(event); }}
        onPointerMove={(event) => { if (dragging) setFromPointer(event); }}
        onPointerUp={(event) => { setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => setDragging(false)}
        style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))`, gap: '0.3rem', marginTop: '0.45rem', touchAction: 'none', cursor: 'ew-resize' }}
      >
        {Array.from({ length: denominator }, (_, item) => <button key={item} type="button" onClick={() => onSelect(item + 1)} aria-label={`Shade ${item + 1} equal part${item === 0 ? '' : 's'}`} style={{ minHeight: '3.35rem', borderRadius: '0.48rem', cursor: 'pointer', border: `2px solid ${item < selected ? accent : 'rgba(203,213,225,0.45)'}`, background: item < selected ? `${accent}55` : 'rgba(15,23,42,0.8)', color: item < selected ? '#fff' : '#64748b', fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)' }}><PixelIcon name="token" size="0.84em" /></button>)}
      </div>
    </div>
  );
}

function CounterModel({ max, selected, onSelect, accent, label }: { max: number; selected: number; onSelect: (value: number) => void; accent: string; label: string }) {
  const cells = Math.min(Math.max(max, 8), 24);
  return (
    <div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.65vw,0.48rem)', color: '#cbd5e1', marginTop: '0.75rem' }}>{label}: {selected}</div>
      <div className="grid grid-cols-6" style={{ gap: '0.34rem', marginTop: '0.5rem' }}>
        {Array.from({ length: cells }, (_, item) => <button key={item} type="button" onClick={() => onSelect(item + 1)} aria-label={`Set model to ${item + 1}`} style={{ minHeight: '2.35rem', borderRadius: '0.4rem', cursor: 'pointer', border: `1px solid ${item < selected ? accent : '#475569'}`, background: item < selected ? `${accent}55` : 'rgba(15,23,42,0.78)', color: item < selected ? '#fff' : '#64748b', fontSize: 'clamp(0.66rem,3vw,0.9rem)' }}><PixelIcon name="token" size="0.84em" /></button>)}
      </div>
    </div>
  );
}

function formatUnits(units: number, scale = 1, decimals = 0, suffix = ''): string {
  return `${(units * scale).toFixed(decimals)}${suffix}`;
}

/** Tick spacing (in units) giving at most ten labelled gaps. */
function tickEvery(span: number): number {
  for (const candidate of [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]) if (span / candidate <= 10) return candidate;
  return Math.ceil(span / 10);
}

const stepButton = (accent: string) => ({ ...controlStyle, minHeight: '2.6rem', minWidth: '3rem', padding: '0 0.6rem', color: '#f8fafc', background: 'rgba(15,23,42,0.85)', border: `1px solid ${accent}` }) as const;

function NumberLineModel({ task, selected, onSelect, accent }: { task: GymTask; selected: number; onSelect: (value: number) => void; accent: string }) {
  const { min, max, scale = 1, decimals = 0, suffix = '' } = task;
  const span = max - min;
  const every = tickEvery(span);
  const ticks: number[] = [];
  for (let unit = Math.ceil(min / every) * every; unit <= max; unit += every) ticks.push(unit);
  // Label ticks only as precisely as their spacing: 0.1 steps read 1.1, not 1.10.
  const tickDecimals = Math.min(decimals, Math.max(0, Math.ceil(-Math.log10(every * scale) - 1e-9)));
  const labelEvery = ticks.length > 6 ? 2 : 1;
  const clamp = (value: number) => Math.max(min, Math.min(max, value));
  return (
    <div style={{ marginTop: '0.95rem', padding: '0.75rem', borderRadius: '0.8rem', background: 'rgba(15,23,42,0.7)', border: `1px solid ${accent}88` }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.5rem,2.4vw,0.72rem)', color: '#fef08a', textAlign: 'center', marginBottom: '0.5rem' }}>MARKER: {formatUnits(selected, scale, decimals, suffix)}</div>
      <input type="range" min={min} max={max} step={1} value={selected} onChange={(event) => onSelect(Number(event.target.value))} aria-label="Move the number-line marker" aria-valuetext={formatUnits(selected, scale, decimals, suffix)} style={{ width: '100%', accentColor: accent, minHeight: '2rem', cursor: 'pointer' }} />
      {/* Ticks sit inside the slider's usable track (thumb radius ≈ 10px). */}
      <div style={{ position: 'relative', height: '1.6rem', margin: '0 10px' }}>
        {/* A short mark for every single step when there are few enough to count. */}
        {every > 1 && span <= 40 && Array.from({ length: span + 1 }, (_, i) => min + i).filter((unit) => unit % every !== 0).map((unit) => (
          <div key={`step-${unit}`} style={{ position: 'absolute', left: `${((unit - min) / span) * 100}%`, transform: 'translateX(-50%)', width: 1, height: 4, background: '#64748b' }} />
        ))}
        {ticks.map((unit, index) => (
          <div key={unit} style={{ position: 'absolute', left: `${((unit - min) / span) * 100}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 2, height: index % labelEvery === 0 ? 8 : 5, background: '#94a3b8' }} />
            {index % labelEvery === 0 && <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.3rem,1.4vw,0.42rem)', color: '#cbd5e1', marginTop: 3, whiteSpace: 'nowrap' }}>{formatUnits(unit, scale, tickDecimals, suffix)}</div>}
          </div>
        ))}
      </div>
      <div className="flex justify-center" style={{ gap: '0.5rem', marginTop: '0.6rem' }}>
        <button type="button" onClick={() => onSelect(clamp(selected - 1))} aria-label="Move marker one step left" style={stepButton(accent)}>−</button>
        <button type="button" onClick={() => onSelect(clamp(selected + 1))} aria-label="Move marker one step right" style={stepButton(accent)}>+</button>
      </div>
    </div>
  );
}

function NumberStepper({ task, selected, onSelect, accent }: { task: GymTask; selected: number; onSelect: (value: number) => void; accent: string }) {
  const clamp = (value: number) => Math.max(task.min, Math.min(task.max, value));
  return (
    <div style={{ marginTop: '0.95rem', padding: '0.75rem', borderRadius: '0.8rem', background: 'rgba(15,23,42,0.7)', border: `1px solid ${accent}88` }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.6vw,0.46rem)', color: '#cbd5e1', textAlign: 'center' }}>{task.label ?? 'YOUR ANSWER'}</div>
      <div aria-live="polite" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(1.1rem,6vw,1.8rem)', color: '#fef08a', textAlign: 'center', margin: '0.5rem 0 0.7rem' }}>{selected}</div>
      <div className="flex justify-center" style={{ gap: '0.4rem' }}>
        <button type="button" onClick={() => onSelect(clamp(selected - 10))} aria-label="Take away ten" style={stepButton(accent)}>−10</button>
        <button type="button" onClick={() => onSelect(clamp(selected - 1))} aria-label="Take away one" style={stepButton(accent)}>−1</button>
        <button type="button" onClick={() => onSelect(clamp(selected + 1))} aria-label="Add one" style={stepButton(accent)}>+1</button>
        <button type="button" onClick={() => onSelect(clamp(selected + 10))} aria-label="Add ten" style={stepButton(accent)}>+10</button>
      </div>
    </div>
  );
}

function DigitModel({ card, selected, onSelect, accent }: { card: string; selected: number; onSelect: (value: number) => void; accent: string }) {
  return (
    <div style={{ marginTop: '0.85rem' }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(1rem,5.5vw,1.6rem)', color: '#fef08a', textAlign: 'center', letterSpacing: '0.12em', padding: '0.7rem', borderRadius: '0.6rem', background: 'rgba(15,23,42,0.7)', border: `1px solid ${accent}88` }}>{card}</div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.5vw,0.44rem)', color: '#cbd5e1', marginTop: '0.6rem' }}>TAP THE DIGIT</div>
      <div className="grid grid-cols-5" style={{ gap: '0.42rem', marginTop: '0.45rem' }}>
        {Array.from({ length: 10 }, (_, digit) => <button key={digit} type="button" onClick={() => onSelect(digit)} aria-pressed={selected === digit} style={{ ...controlStyle, minHeight: '2.35rem', padding: '0.35rem', color: selected === digit ? '#fff' : '#cbd5e1', background: selected === digit ? `${accent}55` : 'rgba(15,23,42,0.78)', border: `1px solid ${selected === digit ? accent : '#475569'}` }}>{digit}</button>)}
      </div>
    </div>
  );
}

function TopicPractice({
  config,
  region,
  onBack,
  onJourney,
  onComplete,
  badgeAward,
}: {
  config: GymTopicConfig;
  region: CurriculumRegion;
  onBack: () => void;
  onJourney: () => void;
  onComplete: (examples: number, hints: number) => void;
  badgeAward?: GymBadgeDefinition;
}) {
  const [moduleIndex, setModuleIndex] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [selected, setSelected] = useState(0);
  const [state, setState] = useState<CheckState>('idle');
  const [hints, setHints] = useState(0);
  const [finished, setFinished] = useState(false);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState<GymBadgeDefinition | undefined>();
  const module = config.topic.modules[moduleIndex];
  // Keyed on primitives: JohtoWorkshop builds a fresh config object each render.
  const taskKey = `${config.stationId}:${moduleIndex}:${exampleIndex}`;
  const task = useMemo(() => gymTaskFor(config, moduleIndex * 3 + exampleIndex), [taskKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // A digit question starts with nothing picked, so 0 is never pre-selected.
  const [picked, setPicked] = useState(false);

  const reset = () => { setSelected(gymTaskStart(task)); setPicked(false); setState('idle'); };
  useEffect(reset, [taskKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (value: number) => { setSelected(value); setPicked(true); setState('idle'); };
  const check = () => setState(selected === task.expected && (picked || task.kind !== 'digit') ? 'correct' : 'incorrect');
  const next = () => {
    if (exampleIndex < 2) {
      setExampleIndex((current) => current + 1);
      return;
    }
    if (moduleIndex + 1 >= config.topic.modules.length) {
      if (badgeAward) setNewlyEarnedBadge(badgeAward);
      onComplete(config.topic.modules.length * 3, hints);
      setFinished(true);
      return;
    }
    setModuleIndex((current) => current + 1);
    setExampleIndex(0);
  };
  const showHint = () => { setHints((current) => current + 1); setState('hint'); };

  if (finished) {
    return (
      <Shell region={region} title={`${config.room} complete`} subtitle="Your concept practice is recorded separately from Journey progress." onBack={onBack}>
        <section className="rounded-2xl text-center" style={{ ...panel(config.accent), padding: 'clamp(1.1rem,5vw,1.8rem)' }}>
          <div style={{ fontSize: 'clamp(2.1rem,10vw,3.2rem)', color: config.accent }}><PixelIcon name="badge" size="0.92em" /></div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.62rem,3vw,0.88rem)', color: config.accent, marginTop: '0.55rem' }}>FAMILIARITY RECORDED</div>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.7vw,0.5rem)', color: '#e2e8f0', lineHeight: 1.9, margin: '0.75rem auto 1.15rem', maxWidth: '29rem' }}>You practised three varied examples for every module in {config.topic.title}. Return to Journey when you are ready to use these models in a battle.</p>
          {newlyEarnedBadge && (
            <div className="rounded-xl flex flex-col items-center" style={{ margin: '0 auto 1rem', maxWidth: '23rem', padding: '0.78rem', background: `${newlyEarnedBadge.accent}16`, border: `1px solid ${newlyEarnedBadge.accent}`, boxShadow: `0 0 14px ${newlyEarnedBadge.accent}33` }}>
              <img src={`${import.meta.env.BASE_URL}${newlyEarnedBadge.assetPath.replace(/^\//, '')}`} alt={newlyEarnedBadge.name} style={{ width: 'clamp(62px,20vw,86px)', height: 'clamp(62px,20vw,86px)', objectFit: 'contain', imageRendering: 'pixelated' }} />
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.43rem,2vw,0.58rem)', color: newlyEarnedBadge.accent, marginTop: '0.35rem', lineHeight: 1.65 }}>REGIONAL GYM COMPLETE</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.6vw,0.47rem)', color: '#fef3c7', marginTop: '0.2rem', lineHeight: 1.65 }}>YOU EARNED THE {newlyEarnedBadge.name.toUpperCase()}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.3rem,1.45vw,0.42rem)', color: '#dbeafe', marginTop: '0.32rem', lineHeight: 1.7 }}>VIEW IT IN YOUR POKÉDEX BADGE COLLECTION.</div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button type="button" onClick={onJourney} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', border: '1px solid #fde68a', color: '#111827' }}><PixelIconLabel name="arrowRight" size="0.8em">OPEN JOURNEY TOPIC</PixelIconLabel></button>
            <button type="button" onClick={() => { setModuleIndex(0); setExampleIndex(0); setHints(0); setNewlyEarnedBadge(undefined); reset(); setFinished(false); }} style={{ ...controlStyle, background: 'rgba(15,23,42,0.78)', border: `1px solid ${config.accent}`, color: config.accent }}><PixelIconLabel name="reset" size="0.8em">PRACTISE AGAIN</PixelIconLabel></button>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell region={region} title={`${config.room} · ${config.topic.id.toUpperCase()}`} subtitle={`${config.topic.title} · Module ${module.order}/${config.topic.modules.length}, example ${exampleIndex + 1}/3: ${module.title}`} onBack={onBack}>
      <section className="rounded-2xl" style={{ ...panel(config.accent), padding: 'clamp(0.95rem,4vw,1.35rem)' }}>
        <div className="flex items-center justify-between gap-3">
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.39rem,1.85vw,0.54rem)', color: '#fef3c7' }}>QUESTION {exampleIndex + 1} OF 3</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.31rem,1.5vw,0.43rem)', color: config.accent, border: `1px solid ${config.accent}88`, padding: '0.27rem 0.4rem', borderRadius: '0.35rem' }}>{GYM_ENGINE_LABELS[config.engine].toUpperCase()}</div>
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.56rem,2.65vw,0.8rem)', color: '#f8fafc', lineHeight: 1.75, marginTop: '0.7rem' }}>{task.prompt}</div>
        {task.display && <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.8rem,4.2vw,1.25rem)', color: '#fef08a', textAlign: 'center', marginTop: '0.8rem' }}>{task.display}</div>}
        {task.kind === 'fraction' && <FractionModel denominator={task.max} selected={selected} onSelect={choose} accent={config.accent} />}
        {task.kind === 'counter' && <CounterModel max={task.max} selected={selected} onSelect={choose} accent={config.accent} label={task.label ?? 'COUNTERS'} />}
        {task.kind === 'line' && <NumberLineModel task={task} selected={selected} onSelect={choose} accent={config.accent} />}
        {task.kind === 'number' && <NumberStepper task={task} selected={selected} onSelect={choose} accent={config.accent} />}
        {task.kind === 'digit' && <DigitModel card={task.card ?? ''} selected={picked ? selected : -1} onSelect={choose} accent={config.accent} />}
        <Feedback state={state} explanation={task.explanation} hint={task.hint} />
        <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
          <button type="button" onClick={reset} style={{ ...controlStyle, color: '#e2e8f0', background: 'rgba(148,163,184,0.13)', border: '1px solid #64748b' }}><PixelIconLabel name="reset" size="0.8em">RESET</PixelIconLabel></button>
          <button type="button" onClick={showHint} style={{ ...controlStyle, color: '#7dd3fc', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8' }}><PixelIconLabel name="hint" size="0.8em">HINT</PixelIconLabel></button>
          {state === 'correct'
            ? <button type="button" onClick={next} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '1px solid #fde68a' }}><PixelIconLabel name="arrowRight" size="0.8em">NEXT</PixelIconLabel></button>
            : <button type="button" onClick={check} style={{ ...controlStyle, background: 'linear-gradient(135deg, #34d399, #059669)', color: '#ecfdf5', border: '1px solid #6ee7b7' }}><PixelIconLabel name="check" size="0.8em">CHECK</PixelIconLabel></button>}
        </div>
      </section>
      <section className="rounded-xl" style={{ padding: '0.7rem', background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(203,213,225,0.35)' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.55vw,0.45rem)', color: '#cbd5e1', lineHeight: 1.7 }}>PRACTICE PATH: {config.topic.modules.map((item, index) => <span key={item.id} style={{ color: index === moduleIndex ? '#fef08a' : index < moduleIndex ? '#86efac' : '#64748b' }}>{index === 0 ? '' : ' · '}{item.order}</span>)} · EXAMPLE {exampleIndex + 1}/3</div>
      </section>
    </Shell>
  );
}

function JohtoWorkshop({ region, onBack, onReturnToJourney, onRecordPractice }: Omit<RegionalGymProps, 'save'>) {
  const seed = getGymTopicsForRegion('johto')[0];
  const config: GymTopicConfig | undefined = seed ? {
    ...seed,
    stationId: 'gym-johto-ecruteak-fraction-ratio',
    room: 'Ecruteak Fraction and Ratio Workshop',
    engine: 'fraction',
    objective: 'Share equal wholes, build fraction bars, and connect fair sharing to simple ratio language.',
    buildLabel: 'Share equal parts',
    connectLabel: 'Build a fraction bar',
    explainLabel: 'Connect a ratio',
    values: [2, 4, 5],
    accent: '#eab308',
    topic: {
      ...seed.topic,
      id: 'gym-johto-fraction-ratio',
      title: 'Fraction and ratio foundations',
      modules: seed.topic.modules.slice(0, 3).map((module, index) => ({
        ...module,
        id: `gym-johto-fraction-ratio-m${index + 1}`,
        order: index + 1,
        title: ['Apricorn Share', 'Ruins Fraction Forge', 'Goldenrod Recipe Market'][index],
      })),
    },
  } : undefined;
  if (!config || !seed) return null;
  return <TopicPractice config={config} region={region} onBack={onBack} onJourney={() => onReturnToJourney(seed.topic.id)} onComplete={(examples, hints) => onRecordPractice(config.stationId, examples, hints)} />;
}

export function RegionalGym({ region, save, onBack, onReturnToJourney, onRecordPractice }: RegionalGymProps) {
  const [view, setView] = useState<View>('hub');
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const topics = getGymTopicsForRegion(region.id);
  const active = topics.find((topic) => topic.topic.id === activeTopicId) ?? null;
  const completed = topics.filter((topic) => Boolean(save.gym.stations[topic.stationId])).length;
  const regionalBadge = getGymBadge(region.id);
  const regionalBadgeEarned = hasGymBadge(save, region.id);
  const badgeAwardForRoom = (candidate: GymTopicConfig): GymBadgeDefinition | undefined => {
    if (regionalBadgeEarned || !regionalBadge) return undefined;
    const finalRoomForRegion = topics.every((topic) => topic.stationId === candidate.stationId || (save.gym.stations[topic.stationId]?.examplesCompleted ?? 0) >= topic.topic.modules.length * 3);
    return finalRoomForRegion ? regionalBadge : undefined;
  };

  if (view === 'viridian') return (
    <Suspense fallback={<div className="flex-1 w-full flex items-center justify-center" role="status" aria-live="polite"><div className="rounded-xl" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.8vw,0.56rem)', color: '#86efac', padding: '1rem', background: 'rgba(5,20,31,0.9)', border: '2px solid #34d399' }}><PixelIconLabel name="forest" size="0.84em">LOADING FOREST STUDIO</PixelIconLabel></div></div>}>
      <ViridianForestGym onBack={() => setView('hub')} onReturnToJourney={() => onReturnToJourney(topics[0]?.topic.id ?? '')} />
    </Suspense>
  );
  if (view === 'johtoWorkshop') return <JohtoWorkshop region={region} onBack={() => setView('hub')} onReturnToJourney={onReturnToJourney} onRecordPractice={onRecordPractice} />;
  if (view === 'practice' && active) return <TopicPractice config={active} region={region} onBack={() => { setActiveTopicId(null); setView('hub'); }} onJourney={() => onReturnToJourney(active.topic.id)} onComplete={(examples, hints) => onRecordPractice(active.stationId, examples, hints)} badgeAward={badgeAwardForRoom(active)} />;

  return (
    <Shell region={region} title={`${region.name} Gym`} subtitle="Practise with models, movement, and explanations. Gym familiarity is separate from Journey rewards." onBack={onBack}>
      <section className="rounded-2xl" style={{ ...panel(region.accentColor), padding: '0.85rem' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)', color: '#fef3c7' }}>CONCEPT ROOMS</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.55vw,0.45rem)', color: '#cbd5e1', lineHeight: 1.75, marginTop: '0.34rem' }}>{completed}/{topics.length} TOPIC ROOMS FAMILIAR</div>
            {regionalBadge && <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.29rem,1.4vw,0.41rem)', color: regionalBadgeEarned ? '#86efac' : '#94a3b8', lineHeight: 1.7, marginTop: '0.32rem' }}>{regionalBadgeEarned ? `${regionalBadge.name.toUpperCase()} EARNED` : 'COMPLETE ALL ROOMS FOR A BADGE'}</div>}
          </div>
          {regionalBadge && regionalBadgeEarned
            ? <img src={`${import.meta.env.BASE_URL}${regionalBadge.assetPath.replace(/^\//, '')}`} alt={regionalBadge.name} style={{ width: 'clamp(2.25rem,10vw,3.1rem)', height: 'clamp(2.25rem,10vw,3.1rem)', objectFit: 'contain', imageRendering: 'pixelated' }} />
            : <div style={{ fontSize: 'clamp(1.6rem,7vw,2.3rem)', color: region.accentColor }}><PixelIcon name="gym" size="0.9em" /></div>}
        </div>
      </section>

      {region.id === 'kanto' && <button type="button" onClick={() => setView('viridian')} className="w-full text-left rounded-2xl" style={{ padding: '0.9rem', background: 'rgba(5,46,22,0.8)', border: '2px solid #34d399', boxShadow: '0 0 18px rgba(52,211,153,0.22)', cursor: 'pointer' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.46rem,2.2vw,0.65rem)', color: '#86efac' }}><PixelIconLabel name="forest" size="0.84em">VIRIDIAN FOREST NUMBER SENSE STUDIOS</PixelIconLabel></div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.55vw,0.46rem)', color: '#d1fae5', lineHeight: 1.75, marginTop: '0.42rem' }}>ENTER THE FOUR SPECIALIST STATIONS FOR COUNTING, COMPARISON, TEEN NUMBERS, AND NUMBER LINES.</div></button>}

      {region.id === 'johto' && <button type="button" onClick={() => setView('johtoWorkshop')} className="w-full text-left rounded-2xl" style={{ padding: '0.9rem', background: 'rgba(69,39,4,0.82)', border: '2px solid #eab308', boxShadow: '0 0 18px rgba(234,179,8,0.22)', cursor: 'pointer' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.46rem,2.2vw,0.65rem)', color: '#fde047' }}><PixelIconLabel name="shrine" size="0.84em">ECRUTEAK FRACTION AND RATIO WORKSHOP</PixelIconLabel></div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.55vw,0.46rem)', color: '#fef3c7', lineHeight: 1.75, marginTop: '0.42rem' }}>SHARE EQUAL WHOLES, BUILD FRACTION BARS, AND CONNECT RELATIONSHIPS WITH DRAG-READY MODELS.</div></button>}

      <section className="rounded-2xl" style={{ padding: '0.85rem', background: 'rgba(7,16,30,0.91)', border: `2px solid ${region.accentColor}` }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.55rem)', color: region.accentColor, padding: '0.25rem 0.2rem 0.65rem' }}>TOPIC PRACTICE ROOMS</div>
        <div className="flex flex-col gap-2">
          {topics.map((topic) => {
            const progress = save.gym.stations[topic.stationId];
            return <button key={topic.stationId} type="button" onClick={() => { setActiveTopicId(topic.topic.id); setView('practice'); }} className="w-full text-left rounded-xl" style={{ padding: '0.85rem', background: 'rgba(15,23,42,0.8)', border: `1px solid ${topic.accent}`, cursor: 'pointer', boxShadow: `0 0 12px ${topic.accent}22` }}>
              <div className="flex items-start justify-between gap-3"><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.41rem,1.95vw,0.57rem)', color: topic.accent, lineHeight: 1.55 }}>{topic.topic.id.toUpperCase()} · {topic.room.toUpperCase()}</div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.29rem,1.4vw,0.4rem)', color: progress ? '#86efac' : '#fef3c7', border: `1px solid ${progress ? '#22c55e' : '#facc15'}`, borderRadius: '0.3rem', padding: '0.23rem 0.32rem', flexShrink: 0 }}>{progress ? 'FAMILIAR' : `${topic.topic.modules.length} MODULES`}</div></div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.6vw,0.47rem)', color: '#f8fafc', lineHeight: 1.7, marginTop: '0.36rem' }}>{topic.topic.title}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.31rem,1.5vw,0.44rem)', color: '#cbd5e1', lineHeight: 1.75, marginTop: '0.35rem' }}>{topic.objective}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.31rem,1.5vw,0.44rem)', color: '#fef08a', marginTop: '0.55rem' }}><PixelIconLabel name="arrowRight" size="0.8em">ENTER {GYM_ENGINE_LABELS[topic.engine].toUpperCase()}</PixelIconLabel></div>
            </button>;
          })}
        </div>
      </section>

      <button type="button" onClick={() => onReturnToJourney(topics[0]?.topic.id ?? '')} style={{ ...controlStyle, color: '#111827', background: 'linear-gradient(135deg, #facc15, #f59e0b)', border: '1px solid #fde68a' }}><PixelIconLabel name="arrowRight" size="0.8em">RETURN TO JOURNEY</PixelIconLabel></button>
    </Shell>
  );
}
