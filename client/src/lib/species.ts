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

// ---------------------------------------------------------------------------
// Per-Pokémon detail (types + flavour text), fetched on demand for the Pokédex.
// ---------------------------------------------------------------------------
export interface SpeciesDetail {
  types: string[];
  genus: string;
  flavor: string;
}

const detailCache = new Map<number, SpeciesDetail | null>();

export async function loadDetail(dex: number): Promise<SpeciesDetail | null> {
  if (detailCache.has(dex)) return detailCache.get(dex) ?? null;
  try {
    const [p, s] = await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${dex}`).then((r) => r.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${dex}`).then((r) => r.json()),
    ]);
    const types: string[] = (p.types ?? []).map((t: { type: { name: string } }) => t.type.name);
    const genus = (s.genera ?? []).find((g: { language: { name: string } }) => g.language.name === 'en')?.genus ?? '';
    const flavor = ((s.flavor_text_entries ?? []).find((f: { language: { name: string } }) => f.language.name === 'en')?.flavor_text ?? '')
      .replace(/[\f\n\r­]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const detail: SpeciesDetail = { types, genus, flavor };
    detailCache.set(dex, detail);
    return detail;
  } catch {
    detailCache.set(dex, null);
    return null;
  }
}

/** undefined = loading, null = unavailable/offline, object = loaded */
export function useSpeciesDetail(dex: number | null): SpeciesDetail | null | undefined {
  const [detail, setDetail] = useState<SpeciesDetail | null | undefined>(undefined);
  useEffect(() => {
    if (dex == null) {
      setDetail(undefined);
      return;
    }
    let alive = true;
    setDetail(undefined);
    loadDetail(dex).then((d) => alive && setDetail(d));
    return () => {
      alive = false;
    };
  }, [dex]);
  return detail;
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
