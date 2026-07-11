// =============================================================================
// POKÉMATHS — SPRITE URLS
// =============================================================================
// Hybrid asset strategy:
//  - Catchable Pokémon use free PokeAPI sprites, keyed by national dex number.
//  - Bespoke logo/splash art stays hosted where it already lives (ASSETS).
// PokeAPI sprites are served from the PokeAPI/sprites GitHub repo over a CDN.
// =============================================================================

const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** Retro pixel sprite (96×96) — matches the game's pixel-art aesthetic. */
export function pixelSprite(dex: number): string {
  return `${SPRITE_BASE}/${dex}.png`;
}

/** High-res official artwork — used for the big "caught!" reveal. */
export function artwork(dex: number): string {
  return `${SPRITE_BASE}/other/official-artwork/${dex}.png`;
}
