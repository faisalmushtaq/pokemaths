export interface GymBadgeDefinition {
  regionId: string;
  regionName: string;
  name: string;
  motif: string;
  accent: string;
  assetPath: string;
}

export const GYM_BADGES: GymBadgeDefinition[] = [
  { regionId: 'kanto', regionName: 'Kanto', name: 'Verdant Badge', motif: 'Number-sense leaf', accent: '#34d399', assetPath: '/images/gym-badges/kanto-badge.webp' },
  { regionId: 'johto', regionName: 'Johto', name: 'Shrine Badge', motif: 'Fraction and ratio blossom', accent: '#c084fc', assetPath: '/images/gym-badges/johto-badge.webp' },
  { regionId: 'hoenn', regionName: 'Hoenn', name: 'Tidal Badge', motif: 'Multiplicative wave', accent: '#2dd4bf', assetPath: '/images/gym-badges/hoenn-badge.webp' },
  { regionId: 'sinnoh', regionName: 'Sinnoh', name: 'Summit Badge', motif: 'Place-value crystal', accent: '#93c5fd', assetPath: '/images/gym-badges/sinnoh-badge.webp' },
  { regionId: 'unova', regionName: 'Unova', name: 'Circuit Badge', motif: 'Number-system gear', accent: '#60a5fa', assetPath: '/images/gym-badges/unova-badge.webp' },
  { regionId: 'kalos', regionName: 'Kalos', name: 'Prism Badge', motif: 'Fractional facets', accent: '#f472b6', assetPath: '/images/gym-badges/kalos-badge.webp' },
  { regionId: 'alola', regionName: 'Alola', name: 'Sunwave Badge', motif: 'Decimal sun shell', accent: '#fb923c', assetPath: '/images/gym-badges/alola-badge.webp' },
  { regionId: 'galar', regionName: 'Galar', name: 'Crown Badge', motif: 'Operation crown', accent: '#a5b4fc', assetPath: '/images/gym-badges/galar-badge.webp' },
  { regionId: 'paldea', regionName: 'Paldea', name: 'Mosaic Badge', motif: 'Proportion mosaic', accent: '#facc15', assetPath: '/images/gym-badges/paldea-badge.webp' },
  { regionId: 'kitakami', regionName: 'Kitakami', name: 'Maple Badge', motif: 'Pattern leaf', accent: '#c4b5fd', assetPath: '/images/gym-badges/kitakami-badge.webp' },
  { regionId: 'terarium', regionName: 'Hisui', name: 'Rune Badge', motif: 'Algebraic rune', accent: '#67e8f9', assetPath: '/images/gym-badges/hisui-badge.webp' },
];

const GYM_BADGE_INDEX = new Map(GYM_BADGES.map((badge) => [badge.regionId, badge]));

export function getGymBadge(regionId: string): GymBadgeDefinition | undefined {
  return GYM_BADGE_INDEX.get(regionId);
}
