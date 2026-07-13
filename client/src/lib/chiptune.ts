// =============================================================================
// POKÉMATHS — 8-BIT THEME JINGLE
// =============================================================================
// A short, original chiptune played on tap (never autoplay). Uses the Web Audio
// API with square-wave "lead" + triangle "bass" voices for that retro feel.
// Everything degrades gracefully if Web Audio isn't available.
// =============================================================================

let ctx: AudioContext | null = null;
let stopAt = 0; // audio-clock time the current tune ends
let unlocked = false;
const live: { osc: OscillatorNode; gain: GainNode }[] = [];

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

// A looping silent <audio> element flips iOS Safari from the "ambient" audio
// session (muted by the ringer switch) to "playback", so Web Audio is heard
// even when the phone is on silent. Built at runtime so there's no big blob.
let silentEl: HTMLAudioElement | null = null;
function silentWavUrl(): string {
  const rate = 8000, n = rate / 2; // 0.5s
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128); // 8-bit silence
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function primeSilentChannel(): void {
  try {
    if (!silentEl) {
      silentEl = new Audio(silentWavUrl());
      silentEl.loop = true;
      silentEl.setAttribute('playsinline', '');
    }
    void silentEl.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

// iOS/Chrome start the context suspended; it must be resumed AND kicked with a
// silent buffer inside a user gesture before scheduled nodes will sound.
async function unlock(c: AudioContext): Promise<void> {
  primeSilentChannel(); // defeat the iOS ringer switch
  try {
    if (c.state !== 'running') await c.resume();
  } catch {
    /* ignore */
  }
  if (!unlocked) {
    try {
      const src = c.createBufferSource();
      src.buffer = c.createBuffer(1, 1, 22050);
      src.connect(c.destination);
      src.start(0);
      unlocked = true;
    } catch {
      /* ignore */
    }
  }
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
  return !!ctx && ctx.state === 'running' && ctx.currentTime < stopAt;
}

/** Play the theme once. No-op if already playing. */
export async function playTheme(): Promise<void> {
  const c = getCtx();
  if (!c) return;
  await unlock(c); // resume + kick inside the gesture, or nothing sounds on iOS
  if (isThemePlaying()) return;
  const start = c.currentTime + 0.08;
  const master = c.createGain();
  master.gain.value = 0.18;
  master.connect(c.destination);
  const end1 = schedule(c, LEAD, 'square', 0.9, master, start);
  const end2 = schedule(c, BASS, 'triangle', 0.6, master, start);
  stopAt = Math.max(end1, end2) + 0.1;
}

/** Stop immediately (used by a mute toggle). */
export function stopTheme(): void {
  try { silentEl?.pause(); } catch { /* ignore */ }
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
