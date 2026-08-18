import { useMemo, useState } from 'react';
import { PIXEL_FONT } from '@/lib/gameConstants';
import { GYM_ENGINE_LABELS, getGymTopicsForRegion, type GymEngineId, type GymTopicConfig } from '@/lib/gymContent';
import type { CurriculumRegion } from '@/lib/curriculumRegions';
import { getGymBadge, type GymBadgeDefinition } from '@/lib/gymBadges';
import { hasGymBadge, type SaveData } from '@/lib/pokedex';
import { ViridianForestGym } from './ViridianForestGym';

type CheckState = 'idle' | 'correct' | 'incorrect';
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
          <button type="button" onClick={onBack} style={{ ...controlStyle, alignSelf: 'center', color: '#dbeafe', background: 'rgba(15,23,42,0.78)', border: '1px solid #64748b', padding: '0.6rem 0.9rem' }}>← BACK TO REGION</button>
        </div>
      </div>
    </div>
  );
}

function Feedback({ state, explanation, hint }: { state: CheckState; explanation: string; hint: string }) {
  if (state === 'idle') return null;
  const correct = state === 'correct';
  return (
    <div role="status" className="rounded-xl" style={{ marginTop: '0.85rem', padding: '0.78rem', background: correct ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)', border: `1px solid ${correct ? '#22c55e' : '#ef4444'}` }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.56rem)', color: correct ? '#86efac' : '#fca5a5', lineHeight: 1.7 }}>{correct ? 'MODEL CONNECTED' : 'ADJUST THE MODEL'}</div>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.58vw,0.47rem)', color: '#e2e8f0', lineHeight: 1.8, marginTop: '0.3rem' }}>{correct ? explanation : hint}</div>
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
        {Array.from({ length: denominator }, (_, item) => <button key={item} type="button" onClick={() => onSelect(item + 1)} aria-label={`Shade ${item + 1} equal part${item === 0 ? '' : 's'}`} style={{ minHeight: '3.35rem', borderRadius: '0.48rem', cursor: 'pointer', border: `2px solid ${item < selected ? accent : 'rgba(203,213,225,0.45)'}`, background: item < selected ? `${accent}55` : 'rgba(15,23,42,0.8)', color: item < selected ? '#fff' : '#64748b', fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,2vw,0.58rem)' }}>{item < selected ? '●' : '·'}</button>)}
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
        {Array.from({ length: cells }, (_, item) => <button key={item} type="button" onClick={() => onSelect(item + 1)} aria-label={`Set model to ${item + 1}`} style={{ minHeight: '2.35rem', borderRadius: '0.4rem', cursor: 'pointer', border: `1px solid ${item < selected ? accent : '#475569'}`, background: item < selected ? `${accent}55` : 'rgba(15,23,42,0.78)', color: item < selected ? '#fff' : '#64748b', fontSize: 'clamp(0.66rem,3vw,0.9rem)' }}>{item < selected ? '●' : '·'}</button>)}
      </div>
    </div>
  );
}

function NumberLineModel({ min, max, selected, onSelect, accent, step = 1 }: { min: number; max: number; selected: number; onSelect: (value: number) => void; accent: string; step?: number }) {
  return (
    <div style={{ marginTop: '0.95rem', padding: '0.75rem', borderRadius: '0.8rem', background: 'rgba(15,23,42,0.7)', border: `1px solid ${accent}88` }}>
      <input type="range" min={min} max={max} step={step} value={selected} onChange={(event) => onSelect(Number(event.target.value))} aria-label="Move the number-line marker" style={{ width: '100%', accentColor: accent, minHeight: '2rem', cursor: 'pointer' }} />
      <div className="flex justify-between" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.55vw,0.45rem)', color: '#cbd5e1' }}><span>{min}</span><span style={{ color: '#fef08a' }}>MARKER: {selected}</span><span>{max}</span></div>
    </div>
  );
}

function DigitModel({ value, selected, onSelect, accent, title }: { value: number; selected: number; onSelect: (value: number) => void; accent: string; title: string }) {
  const digits = String(Math.abs(Math.trunc(value))).split('').map(Number);
  const expected = digits[Math.min(digits.length - 1, 1)] ?? digits[0] ?? 0;
  return (
    <div style={{ marginTop: '0.85rem' }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.7vw,0.5rem)', color: '#bae6fd', lineHeight: 1.7 }}>{title}: {value}</div>
      <div className="grid grid-cols-5" style={{ gap: '0.42rem', marginTop: '0.55rem' }}>
        {Array.from({ length: 10 }, (_, digit) => <button key={digit} type="button" onClick={() => onSelect(digit)} aria-pressed={selected === digit} style={{ ...controlStyle, minHeight: '2.35rem', padding: '0.35rem', color: selected === digit ? '#fff' : '#cbd5e1', background: selected === digit ? `${accent}55` : 'rgba(15,23,42,0.78)', border: `1px solid ${selected === digit ? accent : '#475569'}` }}>{digit}</button>)}
      </div>
      <div style={{ display: 'none' }}>{expected}</div>
    </div>
  );
}

function taskFor(config: GymTopicConfig, moduleIndex: number) {
  const base = config.values[moduleIndex % config.values.length];
  const stage = moduleIndex % 3;
  const stageLabel = stage === 0 ? config.buildLabel : stage === 1 ? config.connectLabel : config.explainLabel;
  if (config.engine === 'fraction') {
    const denominator = Math.max(2, Math.min(10, Math.round(Math.abs(base)) || 2));
    const numerator = Math.min(denominator, (moduleIndex % denominator) + 1);
    return { kind: 'fraction' as const, stageLabel, expected: numerator, max: denominator, prompt: `${stageLabel}: show ${numerator}/${denominator} with equal parts.`, explanation: `${numerator} of the ${denominator} equal parts are selected. The whole has been divided fairly.`, hint: `Start with ${denominator} equal parts, then select ${numerator}.` };
  }
  if (config.engine === 'percentage') {
    const expected = Math.max(0, Math.min(100, Math.round(base)));
    return { kind: 'line' as const, stageLabel, expected, min: 0, max: 100, step: 1, prompt: `${stageLabel}: move the marker to ${expected}% on the hundred scale.`, explanation: `${expected}% means ${expected} parts out of 100 equal parts.`, hint: 'Use the ends of the scale as 0% and 100%, then place the marker.' };
  }
  if (config.engine === 'ratio') {
    const a = Math.max(1, Math.round(config.values[0]));
    const expected = Math.max(1, Math.round(config.values[1]));
    return { kind: 'line' as const, stageLabel, expected, min: 0, max: Math.max(expected * 2, 10), step: 1, prompt: `${stageLabel}: keep ${a} amber tokens linked with ${expected} blue tokens. Move the blue counter.`, explanation: `The relationship is ${a} amber for every ${expected} blue. Both parts describe one linked recipe.`, hint: 'Read the relationship in order. Keep the amber amount fixed, then set the blue amount.' };
  }
  if (config.engine === 'decimal') {
    const expected = Math.max(0, Math.min(50, Math.round(Math.abs(base) * 10)));
    return { kind: 'line' as const, stageLabel, expected, min: 0, max: 50, step: 1, prompt: `${stageLabel}: represent ${expected}/10 as tenths on the decimal scale.`, explanation: `${expected}/10 has ${expected} tenths. The position shows its decimal value.`, hint: 'Each full step is one tenth. Count the tenths from zero.' };
  }
  if (config.engine === 'placeValue' || config.engine === 'column') {
    const source = Math.abs(Math.trunc(base));
    const digits = String(source).split('').map(Number);
    const expected = digits[Math.min(digits.length - 1, 1)] ?? digits[0] ?? 0;
    return { kind: 'digit' as const, stageLabel, expected, min: 0, max: 9, prompt: `${stageLabel}: select the highlighted place-value digit in ${source}.`, explanation: `The selected digit is ${expected}. Its value depends on the place it occupies in the number.`, hint: 'Read the number from right to left as ones, tens, hundreds, then thousands.' };
  }
  if (config.engine === 'function' || config.engine === 'pattern') {
    const expected = Math.round(config.values[(moduleIndex + 1) % config.values.length]);
    return { kind: 'line' as const, stageLabel, expected, min: Math.min(0, expected - 6), max: Math.max(20, expected + 6), step: 1, prompt: `${stageLabel}: move the marker to the next value, ${expected}, in the structure.`, explanation: `The next value is ${expected}. The rule connects each position to the next one.`, hint: 'Look for the repeated change, then continue it once.' };
  }
  if (config.engine === 'numberLine') {
    const expected = Math.round(base);
    return { kind: 'line' as const, stageLabel, expected, min: Math.min(-10, expected - 8), max: Math.max(20, expected + 8), step: 1, prompt: `${stageLabel}: place the marker at ${expected} on the line.`, explanation: `${expected} has a definite position. Moving right increases value and moving left decreases value.`, hint: 'Use zero as an anchor, then count equal steps.' };
  }
  if (config.engine === 'groups' || config.engine === 'division') {
    const expected = Math.max(1, Math.min(24, Math.round(base)));
    return { kind: 'counter' as const, stageLabel, expected, min: 0, max: Math.max(10, expected + 4), prompt: `${stageLabel}: build a model with ${expected} counters before checking the equal-group relationship.`, explanation: `${expected} counters can be arranged into equal groups. The arrangement shows the multiplication or division structure.`, hint: 'Count one counter at a time. Equal groups have the same number in each group.' };
  }
  const expected = Math.max(0, Math.min(24, Math.round(Math.abs(base))));
  return { kind: 'counter' as const, stageLabel, expected, min: 0, max: Math.max(10, expected + 4), prompt: `${stageLabel}: build a model that shows ${expected}.`, explanation: `The model shows ${expected} as a structured quantity.`, hint: 'Use one item for each count and check that none have been skipped.' };
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
  const task = useMemo(() => taskFor(config, moduleIndex * 3 + exampleIndex), [config, moduleIndex, exampleIndex]);

  const reset = () => { setSelected(0); setState('idle'); };
  const check = () => setState(selected === task.expected ? 'correct' : 'incorrect');
  const next = () => {
    if (exampleIndex < 2) {
      setExampleIndex((current) => current + 1);
      reset();
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
    reset();
  };
  const showHint = () => { setHints((current) => current + 1); setState('incorrect'); };

  if (finished) {
    return (
      <Shell region={region} title={`${config.room} complete`} subtitle="Your concept practice is recorded separately from Journey progress." onBack={onBack}>
        <section className="rounded-2xl text-center" style={{ ...panel(config.accent), padding: 'clamp(1.1rem,5vw,1.8rem)' }}>
          <div style={{ fontSize: 'clamp(2.1rem,10vw,3.2rem)' }}>🏅</div>
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
            <button type="button" onClick={onJourney} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', border: '1px solid #fde68a', color: '#111827' }}>▶ OPEN JOURNEY TOPIC</button>
            <button type="button" onClick={() => { setModuleIndex(0); setExampleIndex(0); setHints(0); setNewlyEarnedBadge(undefined); reset(); setFinished(false); }} style={{ ...controlStyle, background: 'rgba(15,23,42,0.78)', border: `1px solid ${config.accent}`, color: config.accent }}>↻ PRACTISE AGAIN</button>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell region={region} title={`${config.room} · ${config.topic.id.toUpperCase()}`} subtitle={`${config.topic.title} · Module ${module.order}/${config.topic.modules.length}, example ${exampleIndex + 1}/3: ${module.title}`} onBack={onBack}>
      <section className="rounded-2xl" style={{ ...panel(config.accent), padding: 'clamp(0.95rem,4vw,1.35rem)' }}>
        <div className="flex items-center justify-between gap-3">
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.39rem,1.85vw,0.54rem)', color: '#fef3c7' }}>{task.stageLabel.toUpperCase()}</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.31rem,1.5vw,0.43rem)', color: config.accent, border: `1px solid ${config.accent}88`, padding: '0.27rem 0.4rem', borderRadius: '0.35rem' }}>{GYM_ENGINE_LABELS[config.engine].toUpperCase()}</div>
        </div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.56rem,2.65vw,0.8rem)', color: '#f8fafc', lineHeight: 1.75, marginTop: '0.7rem' }}>{task.prompt}</div>
        {task.kind === 'fraction' && <FractionModel denominator={task.max} selected={selected} onSelect={(value) => { setSelected(value); setState('idle'); }} accent={config.accent} />}
        {task.kind === 'counter' && <CounterModel max={task.max} selected={selected} onSelect={(value) => { setSelected(value); setState('idle'); }} accent={config.accent} label="MODEL COUNTERS" />}
        {task.kind === 'line' && <NumberLineModel min={task.min} max={task.max} step={task.step} selected={selected} onSelect={(value) => { setSelected(value); setState('idle'); }} accent={config.accent} />}
        {task.kind === 'digit' && <DigitModel value={config.values[moduleIndex % config.values.length]} selected={selected} onSelect={(value) => { setSelected(value); setState('idle'); }} accent={config.accent} title="NUMBER CARD" />}
        <Feedback state={state} explanation={task.explanation} hint={task.hint} />
        <div className="grid grid-cols-3" style={{ gap: '0.45rem', marginTop: '1rem' }}>
          <button type="button" onClick={reset} style={{ ...controlStyle, color: '#e2e8f0', background: 'rgba(148,163,184,0.13)', border: '1px solid #64748b' }}>↻ RESET</button>
          <button type="button" onClick={showHint} style={{ ...controlStyle, color: '#7dd3fc', background: 'rgba(56,189,248,0.12)', border: '1px solid #38bdf8' }}>? HINT</button>
          {state === 'correct'
            ? <button type="button" onClick={next} style={{ ...controlStyle, background: 'linear-gradient(135deg, #facc15, #f59e0b)', color: '#111827', border: '1px solid #fde68a' }}>NEXT ▶</button>
            : <button type="button" onClick={check} style={{ ...controlStyle, background: 'linear-gradient(135deg, #34d399, #059669)', color: '#ecfdf5', border: '1px solid #6ee7b7' }}>✓ CHECK</button>}
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

  if (view === 'viridian') return <ViridianForestGym onBack={() => setView('hub')} onReturnToJourney={() => onReturnToJourney(topics[0]?.topic.id ?? '')} />;
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
            : <div style={{ fontSize: 'clamp(1.6rem,7vw,2.3rem)' }}>🏛️</div>}
        </div>
      </section>

      {region.id === 'kanto' && <button type="button" onClick={() => setView('viridian')} className="w-full text-left rounded-2xl" style={{ padding: '0.9rem', background: 'rgba(5,46,22,0.8)', border: '2px solid #34d399', boxShadow: '0 0 18px rgba(52,211,153,0.22)', cursor: 'pointer' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.46rem,2.2vw,0.65rem)', color: '#86efac' }}>🌲 VIRIDIAN FOREST NUMBER SENSE STUDIOS</div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.55vw,0.46rem)', color: '#d1fae5', lineHeight: 1.75, marginTop: '0.42rem' }}>ENTER THE FOUR SPECIALIST STATIONS FOR COUNTING, COMPARISON, TEEN NUMBERS, AND NUMBER LINES.</div></button>}

      {region.id === 'johto' && <button type="button" onClick={() => setView('johtoWorkshop')} className="w-full text-left rounded-2xl" style={{ padding: '0.9rem', background: 'rgba(69,39,4,0.82)', border: '2px solid #eab308', boxShadow: '0 0 18px rgba(234,179,8,0.22)', cursor: 'pointer' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.46rem,2.2vw,0.65rem)', color: '#fde047' }}>🏯 ECRUTEAK FRACTION AND RATIO WORKSHOP</div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.33rem,1.55vw,0.46rem)', color: '#fef3c7', lineHeight: 1.75, marginTop: '0.42rem' }}>SHARE EQUAL WHOLES, BUILD FRACTION BARS, AND CONNECT RELATIONSHIPS WITH DRAG-READY MODELS.</div></button>}

      <section className="rounded-2xl" style={{ padding: '0.85rem', background: 'rgba(7,16,30,0.91)', border: `2px solid ${region.accentColor}` }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.9vw,0.55rem)', color: region.accentColor, padding: '0.25rem 0.2rem 0.65rem' }}>TOPIC PRACTICE ROOMS</div>
        <div className="flex flex-col gap-2">
          {topics.map((topic) => {
            const progress = save.gym.stations[topic.stationId];
            return <button key={topic.stationId} type="button" onClick={() => { setActiveTopicId(topic.topic.id); setView('practice'); }} className="w-full text-left rounded-xl" style={{ padding: '0.85rem', background: 'rgba(15,23,42,0.8)', border: `1px solid ${topic.accent}`, cursor: 'pointer', boxShadow: `0 0 12px ${topic.accent}22` }}>
              <div className="flex items-start justify-between gap-3"><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.41rem,1.95vw,0.57rem)', color: topic.accent, lineHeight: 1.55 }}>{topic.topic.id.toUpperCase()} · {topic.room.toUpperCase()}</div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.29rem,1.4vw,0.4rem)', color: progress ? '#86efac' : '#fef3c7', border: `1px solid ${progress ? '#22c55e' : '#facc15'}`, borderRadius: '0.3rem', padding: '0.23rem 0.32rem', flexShrink: 0 }}>{progress ? 'FAMILIAR' : `${topic.topic.modules.length} MODULES`}</div></div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.34rem,1.6vw,0.47rem)', color: '#f8fafc', lineHeight: 1.7, marginTop: '0.36rem' }}>{topic.topic.title}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.31rem,1.5vw,0.44rem)', color: '#cbd5e1', lineHeight: 1.75, marginTop: '0.35rem' }}>{topic.objective}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.31rem,1.5vw,0.44rem)', color: '#fef08a', marginTop: '0.55rem' }}>▶ ENTER {GYM_ENGINE_LABELS[topic.engine].toUpperCase()}</div>
            </button>;
          })}
        </div>
      </section>

      <button type="button" onClick={() => onReturnToJourney(topics[0]?.topic.id ?? '')} style={{ ...controlStyle, color: '#111827', background: 'linear-gradient(135deg, #facc15, #f59e0b)', border: '1px solid #fde68a' }}>▶ RETURN TO JOURNEY</button>
    </Shell>
  );
}
