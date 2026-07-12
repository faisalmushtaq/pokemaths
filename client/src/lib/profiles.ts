// =============================================================================
// POKÉMATHS — PLAYER PROFILES
// =============================================================================
// Up to 5 local players on one device. Each profile has its own save (keyed by
// profile id in pokedex.ts). A profile can optionally be linked to a Google
// account (googleUid) for cross-device cloud sync.
// =============================================================================

import { deleteSave, persistSave, takeLegacySave } from './pokedex';

export interface Profile {
  id: string;
  name: string;
  avatarDex: number; // Pokémon shown as the profile icon
  createdAt: number;
  pin?: string; // optional 4-digit lock
  googleUid?: string | null; // linked Google account for cloud sync
}

export interface ProfilesData {
  version: 1;
  activeId: string | null;
  profiles: Profile[];
}

const KEY = 'pokemaths.profiles.v1';
export const MAX_PROFILES = 5;
/** Starters offered as profile avatars. */
export const AVATAR_CHOICES = [25, 1, 4, 7, 133, 152, 155, 158, 252, 255, 258, 393];

const genId = (): string =>
  'p_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

function read(): ProfilesData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<ProfilesData>;
      return { version: 1, activeId: p.activeId ?? null, profiles: p.profiles ?? [] };
    }
  } catch {
    /* ignore */
  }
  return { version: 1, activeId: null, profiles: [] };
}

function write(d: ProfilesData): ProfilesData {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
  return d;
}

// One-time migration: fold any pre-profiles single save into "Player 1".
function migrated(d: ProfilesData): ProfilesData {
  if (d.profiles.length > 0) return d;
  const legacy = takeLegacySave();
  if (!legacy) return d;
  const id = genId();
  persistSave(id, legacy);
  return write({
    version: 1,
    activeId: id,
    profiles: [{ id, name: 'Player 1', avatarDex: 25, createdAt: Date.now() }],
  });
}

export function loadProfiles(): ProfilesData {
  return migrated(read());
}

export function createProfile(name: string, avatarDex: number, pin?: string): ProfilesData {
  const d = read();
  if (d.profiles.length >= MAX_PROFILES) return d;
  const profile: Profile = {
    id: genId(),
    name: name.trim().slice(0, 12) || 'Player',
    avatarDex,
    createdAt: Date.now(),
    ...(pin ? { pin } : {}),
  };
  return write({ ...d, profiles: [...d.profiles, profile], activeId: profile.id });
}

export function setActiveProfile(id: string | null): ProfilesData {
  return write({ ...read(), activeId: id });
}

export function deleteProfile(id: string): ProfilesData {
  const d = read();
  deleteSave(id);
  return write({
    ...d,
    profiles: d.profiles.filter((p) => p.id !== id),
    activeId: d.activeId === id ? null : d.activeId,
  });
}

export function updateProfile(id: string, patch: Partial<Profile>): ProfilesData {
  const d = read();
  return write({ ...d, profiles: d.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
}

export function getProfile(d: ProfilesData, id: string | null): Profile | undefined {
  return id ? d.profiles.find((p) => p.id === id) : undefined;
}
