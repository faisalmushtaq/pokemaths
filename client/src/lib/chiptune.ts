// =============================================================================
// POKÉMATHS — THEME TUNE
// =============================================================================
// Plays the bundled theme track on tap (never autoplay). Uses a plain <audio>
// element, which on iOS goes through the media channel — so it's heard even
// with the ringer switch on — and degrades gracefully everywhere else.
// =============================================================================

const THEME_URL = `${import.meta.env.BASE_URL}theme.mp3`;

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio(THEME_URL);
    audio.preload = 'none'; // 3 MB file — only fetch it when the player taps play
    audio.setAttribute('playsinline', '');
  }
  return audio;
}

/** True while the theme is playing. */
export function isThemePlaying(): boolean {
  return !!audio && !audio.paused && !audio.ended;
}

/** Start the theme from the top. Must be called from a user gesture. */
export async function playTheme(): Promise<void> {
  const a = getAudio();
  if (!a) return;
  try {
    a.currentTime = 0;
    await a.play();
  } catch {
    /* autoplay blocked or unsupported — no-op */
  }
}

/** Stop the theme. */
export function stopTheme(): void {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    /* ignore */
  }
}
