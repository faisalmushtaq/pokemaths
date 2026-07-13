// =============================================================================
// POKÉMATHS — 8-BIT THEME JINGLE
// =============================================================================
// A short, original chiptune played on tap (never autoplay). Uses the Web Audio
// API with square-wave "lead" + triangle "bass" voices for that retro feel.
// Everything degrades gracefully if Web Audio isn't available.
// =============================================================================

let ctx: AudioContext | null = null;
let stopAt = 0; // audio-clock time the current tune ends
const live: { osc: OscillatorNode; gain: GainNode }[] = [];

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

// Note → frequency (Hz).
const F: Record<string, number> = {
  G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
};

// Lead melody — [note | 'rest', beats]. An original, upbeat "adventure" riff.
const LEAD: [string, number][] = [
  ['G4', 0.5], ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['E5', 0.5], ['G5', 1], ['rest', 0.5],
  ['A4', 0.5], ['C5', 0.5], ['F5', 0.5], ['A5', 0.5], ['F5', 0.5], ['A5', 1], ['rest', 0.5],
  ['G5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F5', 0.5],
  ['G5', 2],
];

// Bass — one root note per beat, lower octave.
const BASS: [string, number][] = [
  ['C4', 1], ['C4', 1], ['G3', 1], ['G3', 1],
  ['F4', 1], ['F4', 1], ['C4', 1], ['C4', 1],
  ['C4', 1], ['A3', 1], ['G3', 1], ['G3', 1],
  ['C4', 2],
];

const BPM = 156;

function schedule(c: AudioContext, seq: [string, number][], type: OscillatorType, gainLevel: number, master: GainNode, startAt: number): number {
  const beat = 60 / BPM;
  let t = startAt;
  for (const [note, beats] of seq) {
    const dur = beats * beat;
    if (note !== 'rest' && F[note]) {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = F[note];
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gainLevel, t + 0.012);
      g.gain.exponentialRampToValueAtTime(gainLevel * 0.35, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.98);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + dur);
      live.push({ osc, gain: g });
    }
    t += dur;
  }
  return t;
}

/** True while the jingle is still playing. */
export function isThemePlaying(): boolean {
  return !!ctx && ctx.currentTime < stopAt;
}

/** Play the theme once. No-op if already playing. */
export function playTheme(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  if (isThemePlaying()) return;
  const start = c.currentTime + 0.06;
  const master = c.createGain();
  master.gain.value = 0.18;
  master.connect(c.destination);
  const end1 = schedule(c, LEAD, 'square', 0.9, master, start);
  const end2 = schedule(c, BASS, 'triangle', 0.6, master, start);
  stopAt = Math.max(end1, end2) + 0.1;
}

/** Stop immediately (used by a mute toggle). */
export function stopTheme(): void {
  const c = ctx;
  if (!c) return;
  const now = c.currentTime;
  for (const { osc, gain } of live.splice(0)) {
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.stop(now + 0.05);
    } catch {
      /* already stopped */
    }
  }
  stopAt = now;
}
