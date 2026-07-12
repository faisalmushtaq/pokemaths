// =============================================================================
// POKÉMATHS — SPECIES NAMES
// =============================================================================
// Every Pokémon is catchable, so we resolve names for the whole National Dex
// from PokeAPI once, then cache them in localStorage. Until the list is loaded
// (or if the fetch fails offline) names fall back to "#<dex>". The game is fully
// playable without names — they just fill in.
// =============================================================================

import { useEffect, useState } from 'react';

const CACHE_KEY = 'pokemaths.species.v1';
const API = 'https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0';

let cache: Record<number, string> | null = null;
let inflight: Promise<Record<number, string>> | null = null;

function prettify(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Synchronous name lookup — returns "#dex" until the list has loaded. */
export function getName(dex: number): string {
  return cache?.[dex] ?? `#${dex}`;
}

export function loadSpecies(): Promise<Record<number, string>> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  // localStorage cache first
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      cache = JSON.parse(raw) as Record<number, string>;
      return Promise.resolve(cache);
    }
  } catch {
    /* ignore */
  }

  inflight = (async () => {
    const res = await fetch(API);
    if (!res.ok) throw new Error(`PokeAPI ${res.status}`);
    const data = (await res.json()) as { results: { name: string }[] };
    const map: Record<number, string> = {};
    data.results.forEach((r, i) => {
      map[i + 1] = prettify(r.name); // list is ordered by national dex id
    });
    cache = map;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(map));
    } catch {
      /* storage full — names still work in-memory this session */
    }
    return map;
  })();

  return inflight;
}

/**
 * React hook: kicks off the load and re-renders when names arrive.
 * Returns a stable `nameOf(dex)` lookup.
 */
export function useSpeciesNames(): (dex: number) => string {
  const [, bump] = useState(0);
  useEffect(() => {
    let alive = true;
    loadSpecies()
      .then(() => alive && bump((n) => n + 1))
      .catch(() => {
        /* offline — fall back to #dex */
      });
    return () => {
      alive = false;
    };
  }, []);
  return getName;
}
