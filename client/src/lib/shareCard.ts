// =============================================================================
// POKÉMATHS — SHAREABLE CATCH CARD
// =============================================================================
// Draws a "I caught #X …" card to a canvas and lets the player save it or share
// it via the Web Share API. Everything degrades gracefully: if the image can't
// be generated (e.g. CORS), sharing falls back to text, and buttons never crash.
// =============================================================================

export const GAME_URL = 'https://faisalmushtaq.github.io/pokemaths/';
const PIXEL = "'Press Start 2P', monospace";

export interface CardOpts {
  dex: number;
  name: string;
  region: string;
  accent: string;
  topic: string;
  artworkUrl: string;
  spriteUrl: string;
}

export function catchText(dex: number, name: string): string {
  return `I caught #${dex} ${name} on Pokémaths! 🎮 ${GAME_URL}`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // needed so the canvas isn't tainted on export
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    // A crossOrigin request is a separate cache entry from the displayed <img>,
    // and raw.githubusercontent.com sends `access-control-allow-origin: *`, so
    // the canvas won't be tainted.
    img.src = url;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Shrink the font until the text fits maxWidth. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startPx: number): number {
  let px = startPx;
  ctx.font = `${px}px ${PIXEL}`;
  while (ctx.measureText(text).width > maxWidth && px > 12) {
    px -= 4;
    ctx.font = `${px}px ${PIXEL}`;
  }
  return px;
}

function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/** Build the catch card as a PNG Blob. Throws if the artwork can't be loaded. */
export async function buildShareCard(o: CardOpts): Promise<Blob> {
  try {
    await (document.fonts?.ready ?? Promise.resolve());
  } catch {
    /* fonts optional */
  }

  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');

  // background
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0a0a1a');
  g.addColorStop(0.5, shade(o.accent, -0.55));
  g.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // border
  ctx.strokeStyle = o.accent;
  ctx.lineWidth = 12;
  roundRect(ctx, 34, 34, W - 68, H - 68, 44);
  ctx.stroke();

  ctx.textAlign = 'center';

  // header
  ctx.fillStyle = '#FFD700';
  ctx.font = `54px ${PIXEL}`;
  ctx.fillText('★ GOTCHA! ★', W / 2, 150);

  // artwork (fall back to pixel sprite)
  let img: HTMLImageElement;
  try {
    img = await loadImage(o.artworkUrl);
  } catch {
    img = await loadImage(o.spriteUrl);
  }
  const box = 600;
  ctx.imageSmoothingEnabled = false;
  const ratio = Math.min(box / img.width, box / img.height);
  const iw = img.width * ratio, ih = img.height * ratio;
  ctx.drawImage(img, (W - iw) / 2, 210 + (box - ih) / 2, iw, ih);

  // name
  const upper = o.name.toUpperCase();
  const namePx = fitFont(ctx, upper, W - 180, 78);
  ctx.font = `${namePx}px ${PIXEL}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(upper, W / 2, 910);

  // dex + region
  ctx.font = `34px ${PIXEL}`;
  ctx.fillStyle = o.accent;
  ctx.fillText(`#${o.dex} · ${o.region.toUpperCase()}`, W / 2, 985);

  // mastered topic
  const mastered = `MASTERED ${o.topic.toUpperCase()}`;
  const mPx = fitFont(ctx, mastered, W - 200, 28);
  ctx.font = `${mPx}px ${PIXEL}`;
  ctx.fillStyle = '#aaaaaa';
  ctx.fillText(mastered, W / 2, 1055);

  // footer branding
  ctx.font = `44px ${PIXEL}`;
  ctx.fillStyle = '#FFD700';
  ctx.fillText('POKÉMATHS', W / 2, 1210);
  ctx.font = `24px ${PIXEL}`;
  ctx.fillStyle = '#888888';
  ctx.fillText('faisalmushtaq.github.io/pokemaths', W / 2, 1265);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}

export type ShareResult = 'shared' | 'copied' | 'failed';

/** Share the (pre-built) card + text via the Web Share API, with fallbacks. */
export async function shareCatch(blob: Blob | null, dex: number, name: string): Promise<ShareResult> {
  const text = catchText(dex, name);
  const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean };

  if (blob && nav.canShare) {
    const file = new File([blob], `pokemaths-${dex}.png`, { type: 'image/png' });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], text, title: 'Pokémaths' });
        return 'shared';
      } catch (e) {
        if ((e as DOMException)?.name === 'AbortError') return 'shared';
      }
    }
  }
  if (nav.share) {
    try {
      await nav.share({ text, title: 'Pokémaths', url: GAME_URL });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Download the (pre-built) card as a PNG. */
export function downloadCard(blob: Blob, dex: number, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pokemaths-${dex}-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
