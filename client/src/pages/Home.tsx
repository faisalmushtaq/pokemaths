/**
 * POKÉMATHS — Main Game Page
 * Dark arcade aesthetic, pixel font, Pokémon-themed catching mechanics.
 * Flow: menu → regionSelect → battleSelect → playing → caught / failed
 *       (+ arcadeSelect/arcadeResult and pokedex)
 *
 * Layout: every screen is a full-viewport (100dvh) column with a NavBar and a
 * centred content frame (max-width) so it scales from iPhone to iPad to desktop.
 * Sizes use clamp() so text/keys grow on larger screens without overflowing.
 */

import { useCallback, useEffect, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { PIXEL_FONT } from '@/lib/gameConstants';
import { useGame } from '@/hooks/useGame';
import { RegionalGym } from '@/components/gym/RegionalGym';
import {
  REGIONS,
  MAINLINE_REGIONS,
  SECRET_REGIONS,
  getRegion,
  findBattleByDex,
  type Region,
} from '@/lib/regions';
import { getTopic } from '@/lib/topics';
import { ARCADE_LEVELS, getArcadeLevel } from '@/lib/arcade';
import { pixelSprite, artwork } from '@/lib/sprites';
import { useSpeciesNames, useSpeciesDetail } from '@/lib/species';
import { caughtCount, liveStreak, freezeUsedToday, hasCurriculumWin, isLegacyCapture, type MegaEntry } from '@/lib/pokedex';
import { battleModeLabel, bossIsFinalMasteryQuestion, bossMasteryTarget, bossRoundForQuestion, getCurriculumTopic } from '@/lib/curriculum';
import { CURRICULUM_REGIONS, getCurriculumRegion, getCurriculumRegionForTopic } from '@/lib/curriculumRegions';
import { curriculumRegionCompletionCount, hasCurriculumRegionTestPass, hasCurriculumTopicTestPass, isCurriculumBattleUnlocked, isCurriculumModuleUnlocked, isCurriculumRegionUnlocked, isCurriculumTopicUnlocked, isModuleComplete, isTopicComplete, moduleCompletionCount, topicBattleCompletion } from '@/lib/curriculumProgress';
import { playTheme, stopTheme, isThemePlaying } from '@/lib/chiptune';
import { STREAK_MILESTONES, achievedMilestones, milestoneAt } from '@/lib/streak';
import {
  loadProfiles, createProfile, setActiveProfile, deleteProfile, getProfile, updateProfile, getSettings,
  MAX_PROFILES, AVATAR_CHOICES, type Gender,
} from '@/lib/profiles';
import { MEGAS, getMega, ARCADE_COUNTS, MEGA_COUNT } from '@/lib/mega';
import { useAuthUser, signInGoogle, signOutCloud, pullAndMerge, pushAllDebounced, firebaseReady } from '@/lib/cloud';
import { buildShareCard, shareCatch, saveCard } from '@/lib/shareCard';
import {
  isBattlePlayable,
  isRegionUnlocked,
  isRegionOpenable,
  regionComplete,
  totalCatchable,
} from '@/lib/progress';

const panelBg = 'linear-gradient(135deg, #0a0a1a 0%, #1a0a3e 50%, #0a0a1a 100%)';

// Responsive font/size scale — clamp(min, preferred, max)
const FS = {
  title: 'clamp(0.8rem, 4vw, 1.35rem)',
  heading: 'clamp(0.6rem, 3vw, 0.95rem)',
  sub: 'clamp(0.42rem, 2vw, 0.62rem)',
  body: 'clamp(0.45rem, 2.2vw, 0.65rem)',
  small: 'clamp(0.38rem, 1.7vw, 0.5rem)',
  tiny: 'clamp(0.34rem, 1.4vw, 0.44rem)',
  btn: 'clamp(0.6rem, 2.8vw, 0.9rem)',
  question: 'clamp(1.1rem, 6.5vw, 2.1rem)',
  key: 'clamp(1rem, 4.8vw, 1.6rem)',
  hud: 'clamp(0.45rem, 2.2vw, 0.62rem)',
  score: 'clamp(0.9rem, 5vw, 1.5rem)',
};

const FRAME = 'min(32rem, 100%)'; // centred game frame width

// ---------------------------------------------------------------------------
// SCREEN + NAVBAR
// ---------------------------------------------------------------------------
function Screen({ bg, children, scroll = false }: { bg: string; children: ReactNode; scroll?: boolean }) {
  return (
    <div
      className="w-full flex flex-col items-center"
      style={{ height: '100dvh', background: bg, overflowY: scroll ? 'auto' : 'hidden' }}
    >
      {children}
    </div>
  );
}

function NavBar({ onHome, onBack, title, accent = '#FFD700', right }: {
  onHome: () => void;
  onBack?: () => void;
  title?: string;
  accent?: string;
  right?: ReactNode;
}) {
  const iconBtn: CSSProperties = {
    fontFamily: PIXEL_FONT, fontSize: 'clamp(1.1rem, 4.5vw, 1.7rem)', background: 'none', border: 'none',
    cursor: 'pointer', padding: '0.15rem 0.35rem', lineHeight: 1,
  };
  const homeBtn: CSSProperties = {
    width: 'clamp(1.8rem, 7vw, 2.35rem)', height: 'clamp(1.8rem, 7vw, 2.35rem)', position: 'relative',
    borderRadius: '50%', border: '2px solid #FFD700', cursor: 'pointer', flexShrink: 0,
    background: 'linear-gradient(to bottom, #ef4444 0%, #ef4444 43%, #101010 43%, #101010 56%, #f8fafc 56%, #d8dee9 100%)',
    boxShadow: '0 0 8px rgba(255,215,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.65)',
  };
  return (
    <div
      className="w-full flex items-center justify-between shrink-0"
      style={{
        padding: 'clamp(0.4rem, 1.5vw, 0.9rem) clamp(0.5rem, 3vw, 1.25rem)',
        background: 'rgba(0,0,0,0.55)', borderBottom: `1px solid ${accent}44`,
      }}
    >
      <div className="flex items-center" style={{ gap: 'clamp(0.25rem, 1.5vw, 0.75rem)' }}>
        <button onClick={onHome} aria-label="Return to menu" title="Return to menu" style={homeBtn}>
          <span aria-hidden="true" style={{ position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%, -50%)', width: 'clamp(0.5rem, 2.4vw, 0.72rem)', height: 'clamp(0.5rem, 2.4vw, 0.72rem)', borderRadius: '50%', background: '#f8fafc', border: '2px solid #101010', boxShadow: '0 0 0 1px rgba(255,215,0,0.7)' }} />
        </button>
        {onBack && <button onClick={onBack} aria-label="Back" title="Back" style={{ ...iconBtn, color: '#aaa' }}>←</button>}
      </div>
      {title && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: accent, textAlign: 'center', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 0.5rem' }}>{title}</div>}
      <div className="flex items-center justify-end" style={{ minWidth: 'clamp(1.5rem, 8vw, 3rem)', gap: '0.5rem' }}>{right}</div>
    </div>
  );
}

// Centred content column used by list/card screens
function TrainerBadgeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Switch trainer"
      title="Switch trainer"
      style={{
        width: 'clamp(1.85rem, 7vw, 2.35rem)',
        height: 'clamp(1.85rem, 7vw, 2.35rem)',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(15,23,42,0.95))',
        border: '2px solid #38bdf8',
        borderRadius: '0.3rem',
        boxShadow: '0 0 8px rgba(56,189,248,0.35), inset 0 0 0 1px rgba(15,23,42,0.95)',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true" style={{ width: '70%', height: '62%', display: 'flex', alignItems: 'center', gap: '0.15rem', padding: '0 0.12rem', background: '#0f172a', border: '1px solid #facc15', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.65)' }}>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.38rem, 1.8vw, 0.52rem)', color: '#facc15', lineHeight: 1 }}>ID</span>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          <span style={{ height: '0.12rem', background: '#38bdf8', display: 'block' }} />
          <span style={{ height: '0.12rem', width: '72%', background: '#64748b', display: 'block' }} />
        </span>
      </span>
    </button>
  );
}

function PokedexSectionHeader({ label, count, accent, expanded, onToggle, compact = false }: {
  label: string;
  count?: string;
  accent: string;
  expanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="w-full flex items-center justify-between active:scale-[0.99] transition-transform"
      style={{
        fontFamily: PIXEL_FONT,
        fontSize: compact ? FS.small : FS.sub,
        color: accent,
        textAlign: 'left',
        padding: compact ? '0.5rem 0.6rem' : '0.65rem 0.75rem',
        background: expanded ? `${accent}1c` : `${accent}0c`,
        border: `1px solid ${expanded ? `${accent}99` : `${accent}55`}`,
        borderRadius: '0.45rem',
        boxShadow: expanded ? `0 0 10px ${accent}22` : 'none',
        cursor: 'pointer',
        transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
        <span aria-hidden="true" style={{ color: '#e2e8f0', fontSize: compact ? FS.tiny : FS.small, display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}>▶</span>
        <span>{label}</span>
      </span>
      {count && <span style={{ fontSize: FS.tiny, color: '#94a3b8', flexShrink: 0 }}>{count}</span>}
    </button>
  );
}

function PokedexSectionContent({ expanded, children }: { expanded: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={!expanded}
      style={{
        display: 'grid',
        gridTemplateRows: expanded ? '1fr' : '0fr',
        opacity: expanded ? 1 : 0,
        transition: 'grid-template-rows 260ms ease, opacity 180ms ease',
      }}
    >
      <div style={{ minHeight: 0, overflow: 'hidden' }}>
        <div style={{ paddingTop: '0.65rem', transform: expanded ? 'translateY(0)' : 'translateY(-0.35rem)', transition: 'transform 260ms ease' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Frame({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`w-full flex flex-col items-center ${className}`} style={{ width: FRAME, ...style }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CONFETTI
// ---------------------------------------------------------------------------
function ConfettiPiece({ x, color, delay }: { x: number; color: string; delay: number }) {
  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left: `${x}%`, width: 10, height: 10, backgroundColor: color,
        animation: `confettiFall 3s ${delay}s ease-in infinite`,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
      }}
    />
  );
}
const CONFETTI_COLORS = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98FB98'];
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i, x: (i / 60) * 100 + Math.random() * 5,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], delay: (i / 60) * 2,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => <ConfettiPiece key={p.id} x={p.x} color={p.color} delay={p.delay} />)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// NUMBER KEYPAD
// ---------------------------------------------------------------------------
function NumberKeypad({ onKey, onToggleSign, onDelete, onSubmit, currentInput, accent }: {
  onKey: (d: string) => void; onToggleSign: () => void; onDelete: () => void;
  onSubmit: () => void; currentInput: string; accent: string;
}) {
  const keyStyle = (border: string, fs = FS.key, bg = 'linear-gradient(135deg, #1e3a5f, #0d2137)'): CSSProperties => ({
    fontFamily: PIXEL_FONT, fontSize: fs, background: bg, border: `2px solid ${border}`, cursor: 'pointer',
  });
  return (
    <div className="w-full h-full flex flex-col" style={{ gap: 'clamp(0.4rem, 1.2vh, 0.6rem)' }}>
      <div
        className="w-full px-4 text-center rounded-lg border-2 flex items-center justify-center shrink-0"
        style={{
          fontFamily: PIXEL_FONT, fontSize: FS.question, background: 'rgba(0,0,0,0.6)',
          borderColor: '#FFD700', color: currentInput ? '#FFD700' : '#444',
          minHeight: 'clamp(2.75rem, 8vh, 4.5rem)', letterSpacing: '0.12em',
        }}
      >
        {currentInput || '?'}
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(4, 1fr)' }}>
        {['7','8','9','4','5','6','1','2','3'].map(d => (
          <button key={d} className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
            style={keyStyle('#38bdf8')} onPointerDown={e => { e.preventDefault(); onKey(d); }}>{d}</button>
        ))}
        <button className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle(accent, FS.body)} onPointerDown={e => { e.preventDefault(); onToggleSign(); }}>±</button>
        <button className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#38bdf8')} onPointerDown={e => { e.preventDefault(); onKey('0'); }}>0</button>
        <button className="flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle(accent)} onPointerDown={e => { e.preventDefault(); onKey('.'); }}>.</button>
      </div>
      <div className="flex gap-2 shrink-0" style={{ height: 'clamp(2.75rem, 8vh, 4rem)' }}>
        <button className="flex-1 flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#ef4444', FS.btn, 'linear-gradient(135deg, #4a1a1a, #2d0a0a)')}
          onPointerDown={e => { e.preventDefault(); onDelete(); }}>DEL</button>
        <button className="flex-1 flex items-center justify-center rounded-lg text-white select-none active:scale-95 transition-transform"
          style={keyStyle('#22c55e', FS.btn, 'linear-gradient(135deg, #1a4a1a, #0a2d0a)')}
          onPointerDown={e => { e.preventDefault(); onSubmit(); }}>OK ✓</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// POWER BAR
// ---------------------------------------------------------------------------
function PowerBar({ correct, total, accentColor }: { correct: number; total: number; accentColor: string }) {
  const pct = Math.min((correct / total) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1" style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#aaa' }}>
        <span>POWER</span><span>{correct}/{total}</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 'clamp(0.75rem, 2.2vh, 1.1rem)', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}66, ${accentColor})`, boxShadow: `0 0 8px ${accentColor}` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// POKEMON SPRITE
// ---------------------------------------------------------------------------
function PokemonSprite({ src, name, size = 140, glow, bounce = true, fallback, label = true }: {
  src: string; name: string; size?: number; glow?: string; bounce?: boolean; fallback?: string; label?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={src} alt={name}
        onError={fallback ? (e) => { const img = e.currentTarget; if (img.src !== fallback) img.src = fallback; } : undefined}
        style={{
          width: size, height: size, maxWidth: '100%', objectFit: 'contain', imageRendering: 'pixelated',
          filter: glow ? `drop-shadow(0 0 10px ${glow})` : undefined,
          animation: bounce ? 'pokeBounce 1.4s ease-in-out infinite' : undefined,
        }}
      />
      {label && (
        <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#FFD700', textShadow: '0 0 6px #FFD700' }}>
          {name.toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// POKÉBALL LOGO (pure SVG — no network dependency)
// ---------------------------------------------------------------------------
function PokeballLogo({ size }: { size: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size, filter: 'drop-shadow(0 0 18px rgba(255,215,0,0.35))', animation: 'pokeBounce 2.4s ease-in-out infinite' }} aria-hidden>
      <circle cx="50" cy="50" r="47" fill="#0a0a12" />
      <path d="M3 50 A47 47 0 0 1 97 50 Z" fill="#ef4444" />
      <path d="M3 50 A47 47 0 0 0 97 50 Z" fill="#f1f5f9" />
      <rect x="3" y="45.5" width="94" height="9" fill="#0a0a12" />
      <circle cx="50" cy="50" r="15" fill="#0a0a12" />
      <circle cx="50" cy="50" r="10" fill="#f1f5f9" />
      <circle cx="50" cy="50" r="5" fill="#cbd5e1" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="#FFD700" strokeWidth="2.5" opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PIN PAD (profile lock)
// ---------------------------------------------------------------------------
function PinPad({ onDigit, onDelete, accent }: { onDigit: (d: string) => void; onDelete: () => void; accent: string }) {
  const k: CSSProperties = {
    fontFamily: PIXEL_FONT, fontSize: FS.key, padding: 'clamp(0.6rem,2vh,1rem) 0',
    background: 'linear-gradient(135deg, #1e3a5f, #0d2137)', border: `2px solid ${accent}`, cursor: 'pointer', color: '#fff',
  };
  return (
    <div className="grid grid-cols-3 gap-2 w-full" style={{ maxWidth: '15rem' }}>
      {['1','2','3','4','5','6','7','8','9'].map((d) => (
        <button key={d} className="rounded-lg select-none active:scale-95 transition-transform" style={k}
          onPointerDown={(e) => { e.preventDefault(); onDigit(d); }}>{d}</button>
      ))}
      <div />
      <button className="rounded-lg select-none active:scale-95 transition-transform" style={k}
        onPointerDown={(e) => { e.preventDefault(); onDigit('0'); }}>0</button>
      <button className="rounded-lg select-none active:scale-95 transition-transform"
        style={{ ...k, fontSize: FS.btn, border: '2px solid #ef4444', background: 'linear-gradient(135deg, #4a1a1a, #2d0a0a)' }}
        onPointerDown={(e) => { e.preventDefault(); onDelete(); }}>DEL</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
export default function Home() {
  const [profilesData, setProfilesData] = useState(loadProfiles);
  const activeId = profilesData.activeId;
  const activeProfile = getProfile(profilesData, activeId);
  const settings = getSettings(activeProfile);
  const game = useGame(activeId);
  const { state, save } = game;
  const nameOf = useSpeciesNames();
  const entryDetail = useSpeciesDetail(state.screen === 'pokedexEntry' ? state.selectedDex : null);
  const [input, setInput] = useState('');
  const [pokedexSearch, setPokedexSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [collapsedPokedexSections, setCollapsedPokedexSections] = useState<Record<string, boolean>>(() => ({
    megas: true,
    milestones: true,
    ...Object.fromEntries(REGIONS.map((region) => [`region-${region.id}`, true])),
  }));

  // profile flow state (shown when no player is active)
  const [profScreen, setProfScreen] = useState<'select' | 'create'>('select');
  const [manageProfiles, setManageProfiles] = useState(false);
  const [pinTarget, setPinTarget] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(AVATAR_CHOICES[0]);
  const [newPin, setNewPin] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState<Gender | null>(null);

  const chooseProfile = (id: string) => {
    const p = getProfile(profilesData, id);
    if (p?.pin) { setPinTarget(id); setPinInput(''); setPinError(false); }
    else { setProfilesData(setActiveProfile(id)); }
  };
  const submitPin = (pin: string) => {
    const p = getProfile(profilesData, pinTarget);
    if (p && p.pin === pin) { setProfilesData(setActiveProfile(pinTarget)); setPinTarget(null); setPinInput(''); }
    else { setPinError(true); setPinInput(''); }
  };
  const doCreate = () => {
    const ageNum = parseInt(newAge, 10);
    setProfilesData(createProfile(newName, newAvatar, {
      pin: newPin.length === 4 ? newPin : undefined,
      age: Number.isFinite(ageNum) && ageNum > 0 ? ageNum : undefined,
      gender: newGender ?? undefined,
    }));
    setProfScreen('select');
    setNewName(''); setNewPin(''); setNewAvatar(AVATAR_CHOICES[0]); setNewAge(''); setNewGender(null);
  };
  const switchPlayer = () => { setProfilesData(setActiveProfile(null)); setProfScreen('select'); setManageProfiles(false); };

  // ----- settings -----
  const setSetting = (patch: Partial<typeof settings>) => {
    if (!activeId) return;
    setProfilesData(updateProfile(activeId, { settings: { ...settings, ...patch } }));
  };
  // Black & White: grayscale the whole app.
  useEffect(() => {
    const el = document.getElementById('root') ?? document.documentElement;
    el.style.filter = settings.blackWhite ? 'grayscale(1)' : '';
    return () => { el.style.filter = ''; };
  }, [settings.blackWhite]);

  // ----- theme tune (tap the pokéball on the menu) -----
  const playTune = () => {
    if (settings.muteTune) return;
    if (isThemePlaying()) stopTheme();
    else void playTheme();
  };
  const toggleMute = () => {
    const next = !settings.muteTune;
    if (next) stopTheme();
    setSetting({ muteTune: next });
  };

  // ----- profile management (edit / delete) -----
  const [editProfileId, setEditProfileId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState(AVATAR_CHOICES[0]);
  const [editPin, setEditPin] = useState('');
  const openEdit = (p: { id: string; name: string; avatarDex: number; pin?: string }) => {
    setEditName(p.name); setEditAvatar(p.avatarDex); setEditPin(p.pin ?? '');
    setConfirmDeleteId(null); setEditProfileId(p.id);
  };
  const saveEdit = () => {
    if (!editProfileId) return;
    setProfilesData(updateProfile(editProfileId, {
      name: editName.trim().slice(0, 12) || 'Player',
      avatarDex: editAvatar,
      pin: editPin.length === 4 ? editPin : undefined,
    }));
    setEditProfileId(null);
  };

  // arcade setup choices
  const [arcCount, setArcCount] = useState(12);
  const [arcMon, setArcMon] = useState(MEGAS[0].dex);

  // ----- shareable catch card (caught screen + Pokédex entry) -----
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  // What to make a card for on the current screen.
  const cardTarget = (() => {
    if (state.screen === 'caught' && state.mode === 'curriculum' && game.activeCurriculumBattle) {
      return {
        dex: game.activeCurriculumBattle.dex,
        region: 'Curriculum',
        accent: game.activeCurriculumBattle.isBoss ? '#FFD700' : '#38bdf8',
        topic: game.activeCurriculumTopic?.title ?? 'Curriculum',
      };
    }
    if (state.screen === 'caught' && game.activeBattle && game.activeRegion) {
      return { dex: game.activeBattle.dex, region: game.activeRegion.name, accent: game.activeRegion.accentColor, topic: getTopic(game.activeBattle.topic).name };
    }
    if (state.screen === 'pokedexEntry' && state.selectedDex != null) {
      const f = findBattleByDex(state.selectedDex);
      return f ? { dex: f.battle.dex, region: f.region.name, accent: f.region.accentColor, topic: getTopic(f.battle.topic).name } : null;
    }
    return null;
  })();
  const cardDex = cardTarget?.dex ?? null;
  useEffect(() => {
    setCardBlob(null);
    setShareMsg(null);
    if (!cardTarget) return;
    const { dex, region, accent, topic } = cardTarget;
    let alive = true;
    buildShareCard({
      dex,
      name: nameOf(dex),
      region,
      accent,
      topic,
      artworkUrl: artwork(dex),
      spriteUrl: pixelSprite(dex),
    }).then((b) => alive && setCardBlob(b)).catch(() => {});
    return () => { alive = false; };
  }, [cardDex, state.screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const onShare = async () => {
    if (!cardTarget) return;
    const res = await shareCatch(cardBlob, cardTarget.dex, nameOf(cardTarget.dex));
    if (res === 'copied') setShareMsg('COPIED TO CLIPBOARD!');
    else if (res === 'failed') setShareMsg('SHARING NOT AVAILABLE');
  };
  const onSave = async () => {
    if (!cardTarget) return;
    if (!cardBlob) { setShareMsg("COULDN'T MAKE IMAGE — TRY SHARE"); return; }
    const res = await saveCard(cardBlob, cardTarget.dex, nameOf(cardTarget.dex));
    setShareMsg(res === 'failed' ? "COULDN'T SAVE" : 'IMAGE SAVED!');
  };

  // ----- shareable MEGA card (arcade result + mega Pokédex entry) -----
  const arcadeMega =
    state.screen === 'arcadeResult' && state.arcadeCount === MEGA_COUNT && state.arcadePokemonDex != null
      ? getMega(state.arcadePokemonDex)
      : state.screen === 'megaEntry' && state.selectedDex != null
        ? getMega(state.selectedDex)
        : undefined;
  const [megaBlob, setMegaBlob] = useState<Blob | null>(null);
  const [megaMsg, setMegaMsg] = useState<string | null>(null);
  useEffect(() => {
    setMegaBlob(null);
    setMegaMsg(null);
    if (!arcadeMega) return;
    let alive = true;
    buildShareCard({
      dex: arcadeMega.dex,
      name: arcadeMega.name,
      region: 'Arcade',
      accent: '#eab308',
      topic: '',
      artworkUrl: artwork(arcadeMega.formId),
      spriteUrl: artwork(arcadeMega.dex),
      headline: '⚡ MEGA EVOLVED! ⚡',
      caption: 'EARNED IN ARCADE MODE',
    }).then((b) => alive && setMegaBlob(b)).catch(() => {});
    return () => { alive = false; };
  }, [arcadeMega?.dex, state.screen]); // eslint-disable-line react-hooks/exhaustive-deps
  const onShareMega = async () => {
    if (!arcadeMega) return;
    const res = await shareCatch(megaBlob, arcadeMega.formId, arcadeMega.name);
    if (res === 'copied') setMegaMsg('COPIED TO CLIPBOARD!');
    else if (res === 'failed') setMegaMsg('SHARING NOT AVAILABLE');
  };
  const onSaveMega = async () => {
    if (!arcadeMega) return;
    if (!megaBlob) { setMegaMsg("COULDN'T MAKE IMAGE — TRY SHARE"); return; }
    const res = await saveCard(megaBlob, arcadeMega.formId, arcadeMega.name);
    setMegaMsg(res === 'failed' ? "COULDN'T SAVE" : 'IMAGE SAVED!');
  };

  // ----- cloud sync (Google account) -----
  const { user: cloudUser } = useAuthUser();
  // On sign-in, merge local ⇄ cloud, then refresh profiles + active save.
  useEffect(() => {
    if (!cloudUser) return;
    let alive = true;
    pullAndMerge(cloudUser.uid).then(() => {
      if (!alive) return;
      setProfilesData(loadProfiles());
      game.reloadSave();
    });
    return () => { alive = false; };
  }, [cloudUser]); // eslint-disable-line react-hooks/exhaustive-deps
  // Push whenever profiles or the active save change while signed in.
  useEffect(() => {
    if (cloudUser) pushAllDebounced(cloudUser.uid);
  }, [cloudUser, profilesData, save]);

  useEffect(() => { setInput(''); }, [state.question]);

  const appendKey = useCallback((d: string) => {
    setInput(prev => {
      if (d === '.') {
        if (prev.includes('.')) return prev;
        return (prev === '' || prev === '-' ? prev + '0' : prev) + '.';
      }
      if (prev.replace(/[-.]/g, '').length >= 6) return prev;
      return prev + d;
    });
  }, []);

  const toggleSign = useCallback(() => {
    setInput(prev => (prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  }, []);

  const handleSubmit = useCallback(() => {
    const num = parseFloat(input);
    if (!Number.isNaN(num)) { game.submitAnswer(num); setInput(''); }
  }, [input, game]);

  useEffect(() => {
    if (state.screen !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key >= '0' && e.key <= '9') || e.key === '.') appendKey(e.key);
      else if (e.key === '-') toggleSign();
      else if (e.key === 'Backspace') setInput(prev => prev.slice(0, -1));
      else if (e.key === 'Enter') handleSubmit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.screen, appendKey, toggleSign, handleSubmit]);

  // Speed mode: auto-submit once the typed answer reaches the answer's length.
  useEffect(() => {
    if (!settings.speedMode || state.screen !== 'playing' || !state.question) return;
    const expectedLen = String(state.question.answer).length;
    if (input.length >= expectedLen && input !== '-' && input !== '.' && !Number.isNaN(parseFloat(input))) {
      handleSubmit();
    }
  }, [input, state.question, state.screen, settings.speedMode, handleSubmit]);

  const backBtn = (label: string, onClick: () => void, color = '#888'): ReactNode => (
    <button onClick={onClick} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color, border: `1px solid ${color}55`, background: 'transparent', padding: '0.7rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
      {label}
    </button>
  );

  // =========================================================================
  // PROFILE FLOW (shown when no player is active)
  // =========================================================================
  const profBg = 'radial-gradient(circle at 50% 25%, #241456 0%, #14093a 45%, #0a0a1a 100%)';

  if (!activeId && pinTarget) {
    const p = getProfile(profilesData, pinTarget)!;
    return (
      <Screen bg={profBg}>
        <NavBar onHome={() => { setPinTarget(null); setPinError(false); }} onBack={() => { setPinTarget(null); setPinError(false); }} title={p.name.toUpperCase()} />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame className="items-center" style={{ gap: 'clamp(0.75rem,3vh,1.5rem)' }}>
            <img src={pixelSprite(p.avatarDex)} alt={p.name}
              onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(p.avatarDex)) i.src = artwork(p.avatarDex); }}
              style={{ width: 'clamp(72px,20vw,120px)', height: 'clamp(72px,20vw,120px)', objectFit: 'contain', imageRendering: 'pixelated' }} />
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#a78bfa' }}>ENTER PIN</div>
            <div className="flex gap-3">
              {[0,1,2,3].map((i) => (
                <div key={i} style={{ width: 'clamp(14px,4vw,20px)', height: 'clamp(14px,4vw,20px)', borderRadius: '50%', border: `2px solid ${pinError ? '#ef4444' : '#FFD700'}`, background: i < pinInput.length ? (pinError ? '#ef4444' : '#FFD700') : 'transparent' }} />
              ))}
            </div>
            {pinError && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#ef4444' }}>WRONG PIN — TRY AGAIN</div>}
            <PinPad accent="#a78bfa"
              onDigit={(d) => { const v = (pinInput + d).slice(0, 4); setPinInput(v); setPinError(false); if (v.length === 4) submitPin(v); }}
              onDelete={() => { setPinInput(pinInput.slice(0, -1)); setPinError(false); }} />
          </Frame>
        </div>
      </Screen>
    );
  }

  // ----- edit an existing profile (name / avatar / PIN) -----
  if (editProfileId) {
    const canSave = editName.trim().length > 0;
    return (
      <Screen bg={profBg} scroll>
        <NavBar onHome={() => setEditProfileId(null)} onBack={() => setEditProfileId(null)} title="EDIT PLAYER" accent="#38bdf8" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(1rem,4vw,2rem) 1rem clamp(2rem,6vh,3rem)' }}>
          <Frame className="items-center" style={{ flexShrink: 0, gap: 'clamp(1rem,3.5vh,1.75rem)' }}>
            <img src={pixelSprite(editAvatar)} alt="avatar"
              onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(editAvatar)) i.src = artwork(editAvatar); }}
              style={{ width: 'clamp(72px,20vw,120px)', height: 'clamp(72px,20vw,120px)', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 10px #38bdf8)', flexShrink: 0 }} />
            <input value={editName} onChange={(e) => setEditName(e.target.value.slice(0, 12))} placeholder="NAME" maxLength={12}
              className="w-full text-center rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, padding: '0.9rem', background: 'rgba(0,0,0,0.5)', border: '2px solid #38bdf8', color: '#38bdf8', outline: 'none', maxWidth: '18rem', flexShrink: 0 }} />
            <div className="w-full" style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', marginBottom: 12, textAlign: 'center' }}>CHOOSE AN ICON</div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(48px,14vw,72px), 1fr))', gap: 'clamp(0.5rem,1.8vw,0.75rem)' }}>
                {AVATAR_CHOICES.map((dex) => (
                  <button key={dex} onClick={() => setEditAvatar(dex)} className="rounded-lg flex items-center justify-center"
                    style={{ padding: 6, background: 'rgba(0,0,0,0.4)', border: `2px solid ${editAvatar === dex ? '#38bdf8' : '#333'}`, cursor: 'pointer' }}>
                    <img src={pixelSprite(dex)} alt="" loading="lazy"
                      onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(dex)) i.src = artwork(dex); }}
                      style={{ width: 'clamp(40px,11vw,56px)', height: 'clamp(40px,11vw,56px)', objectFit: 'contain', imageRendering: 'pixelated' }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full flex flex-col items-center" style={{ gap: 10, flexShrink: 0 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888' }}>PIN (OPTIONAL)</div>
              <input value={editPin} onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 DIGITS" inputMode="numeric"
                className="text-center rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, padding: '0.75rem 1rem', letterSpacing: '0.4em', background: 'rgba(0,0,0,0.5)', border: '2px solid #a78bfa', color: '#a78bfa', outline: 'none', width: '10rem' }} />
              <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#666', textAlign: 'center', lineHeight: 1.7 }}>LEAVE BLANK TO REMOVE THE PIN</div>
            </div>
            <button onClick={saveEdit} disabled={!canSave} className="w-full rounded-xl font-bold text-black"
              style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vh,1.3rem) 0', maxWidth: '18rem', flexShrink: 0, background: canSave ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)' : '#333', color: canSave ? '#001' : '#666', border: '2px solid #38bdf8', cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }}>
              ✓ SAVE CHANGES
            </button>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (!activeId && profScreen === 'create') {
    const canCreate = newName.trim().length > 0;
    return (
      <Screen bg={profBg} scroll>
        <NavBar onHome={() => setProfScreen('select')} onBack={() => setProfScreen('select')} title="NEW TRAINER" accent="#FFD700" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(1rem,4vw,2rem) 1rem clamp(2rem,6vh,3rem)' }}>
          <Frame className="items-center" style={{ flexShrink: 0, gap: 'clamp(1rem,3.5vh,1.75rem)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', textShadow: '0 0 12px rgba(255,215,0,0.5)', textAlign: 'center', lineHeight: 1.7, flexShrink: 0 }}>BEGIN YOUR<br />JOURNEY!</div>
            <img src={pixelSprite(newAvatar)} alt="avatar"
              onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(newAvatar)) i.src = artwork(newAvatar); }}
              style={{ width: 'clamp(72px,20vw,120px)', height: 'clamp(72px,20vw,120px)', objectFit: 'contain', imageRendering: 'pixelated', filter: `drop-shadow(0 0 10px #FFD700)`, flexShrink: 0 }} />
            <input value={newName} onChange={(e) => setNewName(e.target.value.slice(0, 12))} placeholder="NAME" maxLength={12}
              className="w-full text-center rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, padding: '0.9rem', background: 'rgba(0,0,0,0.5)', border: '2px solid #FFD700', color: '#FFD700', outline: 'none', maxWidth: '18rem', flexShrink: 0 }} />
            <div className="w-full" style={{ flexShrink: 0 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', marginBottom: 12, textAlign: 'center' }}>PICK YOUR PARTNER</div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(48px,14vw,72px), 1fr))', gap: 'clamp(0.5rem,1.8vw,0.75rem)' }}>
                {AVATAR_CHOICES.map((dex) => (
                  <button key={dex} onClick={() => setNewAvatar(dex)} className="rounded-lg flex items-center justify-center"
                    style={{ padding: 6, background: 'rgba(0,0,0,0.4)', border: `2px solid ${newAvatar === dex ? '#FFD700' : '#333'}`, cursor: 'pointer' }}>
                    <img src={pixelSprite(dex)} alt="" loading="lazy"
                      onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(dex)) i.src = artwork(dex); }}
                      style={{ width: 'clamp(40px,11vw,56px)', height: 'clamp(40px,11vw,56px)', objectFit: 'contain', imageRendering: 'pixelated' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* --- trainer card: optional age + gender --- */}
            <div className="w-full rounded-2xl flex flex-col items-center" style={{ flexShrink: 0, gap: 16, maxWidth: '20rem', padding: 'clamp(1rem,4vw,1.4rem)', background: 'rgba(56,189,248,0.05)', border: '2px solid rgba(56,189,248,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#94a3b8', textAlign: 'center' }}>TRAINER CARD <span style={{ color: '#555' }}>(OPTIONAL)</span></div>
              <div className="w-full flex items-center justify-center" style={{ gap: 12 }}>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#aaa' }}>AGE</span>
                <input value={newAge} onChange={(e) => setNewAge(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="--" inputMode="numeric"
                  className="text-center rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, padding: '0.65rem 0.5rem', background: 'rgba(0,0,0,0.5)', border: '2px solid #38bdf8', color: '#38bdf8', outline: 'none', width: '4.5rem' }} />
              </div>
              <div className="w-full flex justify-center" style={{ gap: 10, flexWrap: 'wrap' }}>
                {([['boy', '♂ BOY', '#60a5fa'], ['girl', '♀ GIRL', '#f472b6'], ['other', '✦ OTHER', '#a78bfa']] as [Gender, string, string][]).map(([g, label, col]) => {
                  const sel = newGender === g;
                  return (
                    <button key={g} onClick={() => setNewGender(sel ? null : g)} className="rounded-lg shrink-0"
                      style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, padding: '0.65rem 0.8rem', color: sel ? col : '#999', background: sel ? `${col}22` : 'rgba(0,0,0,0.4)', border: `2px solid ${sel ? col : '#333'}`, cursor: 'pointer' }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full flex flex-col items-center" style={{ gap: 12, flexShrink: 0 }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888' }}>PIN (OPTIONAL)</div>
              <input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 DIGITS" inputMode="numeric"
                className="text-center rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, padding: '0.75rem 1rem', letterSpacing: '0.4em', background: 'rgba(0,0,0,0.5)', border: '2px solid #a78bfa', color: '#a78bfa', outline: 'none', width: '10rem' }} />
            </div>
            <button onClick={doCreate} disabled={!canCreate} className="w-full rounded-xl font-bold text-black"
              style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vh,1.3rem) 0', maxWidth: '18rem', flexShrink: 0, background: canCreate ? 'linear-gradient(135deg, #FFD700, #FFA500)' : '#333', color: canCreate ? '#000' : '#666', border: '2px solid #FFD700', cursor: canCreate ? 'pointer' : 'not-allowed', opacity: canCreate ? 1 : 0.5 }}>
              ✓ START JOURNEY
            </button>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (!activeId) {
    return (
      <Screen bg={profBg} scroll>
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: 'clamp(1.25rem,5vh,3rem) 1rem' }}>
          <Frame className="items-center" style={{ gap: 'clamp(0.75rem,3vh,1.5rem)' }}>
            <PokeballLogo size="clamp(72px, 20vw, 130px)" />
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.title, color: '#FFD700', textShadow: '0 0 16px rgba(255,215,0,0.6)', textAlign: 'center' }}>WHO'S PLAYING?</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', textAlign: 'center', lineHeight: 1.8, marginTop: -4 }}>PICK YOUR TRAINER TO CONTINUE THE JOURNEY</div>
            <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(96px,28vw,150px), 1fr))', gap: 'clamp(0.6rem,2vw,1rem)' }}>
              {profilesData.profiles.map((p) => (
                <div key={p.id} className="relative rounded-xl flex flex-col items-center"
                  style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(255,255,255,0.04)', border: '2px solid #FFD700', boxShadow: '0 0 10px rgba(255,215,0,0.2)' }}>
                  <button onClick={() => !manageProfiles && chooseProfile(p.id)} className="flex flex-col items-center w-full" style={{ background: 'none', border: 'none', cursor: manageProfiles ? 'default' : 'pointer' }}>
                    <img src={pixelSprite(p.avatarDex)} alt={p.name} loading="lazy"
                      onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(p.avatarDex)) i.src = artwork(p.avatarDex); }}
                      style={{ width: 'clamp(56px,16vw,88px)', height: 'clamp(56px,16vw,88px)', objectFit: 'contain', imageRendering: 'pixelated' }} />
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#FFD700', marginTop: 8, lineHeight: 1.5, textAlign: 'center' }}>{p.name.toUpperCase()}{p.pin ? ' 🔒' : ''}</span>
                  </button>
                  {manageProfiles && confirmDeleteId !== p.id && (
                    <>
                      <button onClick={() => openEdit(p)} aria-label="Edit player"
                        style={{ position: 'absolute', top: -8, left: -8, width: 26, height: 26, borderRadius: '50%', background: '#38bdf8', color: '#fff', border: '2px solid #0a0a1a', fontFamily: PIXEL_FONT, fontSize: '0.6rem', cursor: 'pointer' }}>✎</button>
                      <button onClick={() => setConfirmDeleteId(p.id)} aria-label="Delete player"
                        style={{ position: 'absolute', top: -8, right: -8, width: 26, height: 26, borderRadius: '50%', background: '#ef4444', color: '#fff', border: '2px solid #0a0a1a', fontFamily: PIXEL_FONT, fontSize: '0.6rem', cursor: 'pointer' }}>✕</button>
                    </>
                  )}
                  {confirmDeleteId === p.id && (
                    <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center" style={{ background: 'rgba(10,10,26,0.95)', border: '2px solid #ef4444', gap: 8, padding: 8 }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#ef4444', textAlign: 'center', lineHeight: 1.6 }}>DELETE<br />{p.name.toUpperCase()}?</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.45rem', color: '#888', textAlign: 'center', lineHeight: 1.6 }}>THIS ERASES THEIR POKÉDEX</div>
                      <div className="flex" style={{ gap: 6 }}>
                        <button onClick={() => { setProfilesData(deleteProfile(p.id)); setConfirmDeleteId(null); }}
                          style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#fff', background: '#ef4444', border: 'none', borderRadius: 6, padding: '0.4rem 0.5rem', cursor: 'pointer' }}>DELETE</button>
                        <button onClick={() => setConfirmDeleteId(null)}
                          style={{ fontFamily: PIXEL_FONT, fontSize: '0.55rem', color: '#ccc', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '0.4rem 0.5rem', cursor: 'pointer' }}>CANCEL</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {profilesData.profiles.length < MAX_PROFILES && (
                <button onClick={() => setProfScreen('create')} className="rounded-xl flex flex-col items-center justify-center"
                  style={{ padding: 'clamp(0.6rem,2vw,1rem)', minHeight: 'clamp(110px,32vw,170px)', background: 'rgba(56,189,248,0.06)', border: '2px dashed #38bdf8', color: '#38bdf8', cursor: 'pointer' }}>
                  <span style={{ fontSize: 'clamp(1.6rem,6vw,2.4rem)' }}>＋</span>
                  <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, marginTop: 8 }}>NEW PLAYER</span>
                </button>
              )}
            </div>
            {profilesData.profiles.length > 0 && (
              <button onClick={() => setManageProfiles((m) => !m)} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: manageProfiles ? '#FFD700' : '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
                {manageProfiles ? '✓ DONE' : '✎ MANAGE'}
              </button>
            )}

            {/* --- account / cloud sync (same page as the profiles they own) --- */}
            {firebaseReady() && (
              <div className="w-full rounded-xl flex flex-col items-center" style={{ maxWidth: '26rem', marginTop: 'clamp(0.5rem,2vh,1rem)', padding: 'clamp(0.85rem,3.5vw,1.25rem)', background: cloudUser ? 'rgba(34,197,94,0.06)' : 'rgba(56,189,248,0.06)', border: `2px solid ${cloudUser ? 'rgba(34,197,94,0.4)' : '#38bdf8'}`, gap: 10 }}>
                {cloudUser ? (
                  <>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#22c55e' }}>☁️ SYNCED ✓</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#FFD700', textAlign: 'center', lineHeight: 1.7, wordBreak: 'break-all' }}>{cloudUser.email ?? cloudUser.displayName ?? 'your account'}</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>YOUR PROFILES SYNC TO EVERY DEVICE</div>
                    <button onClick={() => signOutCloud()} style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>SIGN OUT</button>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#38bdf8', textAlign: 'center', lineHeight: 1.7 }}>☁️ SAVE ACROSS DEVICES</div>
                    <button onClick={() => signInGoogle()} className="w-full rounded-lg font-bold flex items-center justify-center gap-2"
                      style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', maxWidth: '16rem', background: '#fff', color: '#1a1a1a', border: '2px solid #fff', cursor: 'pointer' }}>
                      <span style={{ color: '#4285F4' }}>G</span> SIGN IN WITH GOOGLE
                    </button>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#888', textAlign: 'center', lineHeight: 1.8 }}>WITHOUT AN ACCOUNT, PROGRESS STAYS ON THIS DEVICE</div>
                  </>
                )}
              </div>
            )}
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // MENU
  // =========================================================================
  if (state.screen === 'menu') {
    const menuBg = 'radial-gradient(circle at 50% 22%, #241456 0%, #14093a 45%, #0a0a1a 100%)';
    return (
      <Screen bg={menuBg}>
        <div className="flex-1 w-full flex flex-col items-center justify-between" style={{ position: 'relative', padding: 'clamp(1.25rem, 5vh, 3rem) 1rem clamp(1rem, 3vh, 2rem)' }}>
          {/* Mute toggle for the theme tune (top-right) */}
          <button onClick={toggleMute} aria-label={settings.muteTune ? 'Unmute theme' : 'Mute theme'} title={settings.muteTune ? 'Theme muted' : 'Theme on'}
            style={{ position: 'absolute', top: 'clamp(0.75rem,3vw,1.25rem)', right: 'clamp(0.75rem,3vw,1.25rem)', fontSize: 'clamp(1.1rem,4.5vw,1.5rem)', background: 'rgba(0,0,0,0.3)', border: '2px solid #444', borderRadius: 999, width: 'clamp(2.2rem,9vw,3rem)', height: 'clamp(2.2rem,9vw,3rem)', cursor: 'pointer', lineHeight: 1 }}>
            {settings.muteTune ? '🔇' : '🔊'}
          </button>

          {/* Hero: pokéball (tap to play the theme) + title */}
          <div className="flex flex-col items-center" style={{ gap: 'clamp(0.6rem, 2vh, 1.25rem)' }}>
            <button onClick={playTune} aria-label="Play theme tune" title="Tap for the theme tune!"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
              <PokeballLogo size="clamp(96px, 26vw, 180px)" />
            </button>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.title, color: '#FFD700', textShadow: '0 0 18px rgba(255,215,0,0.6), 0 3px 0 #7c1d6f', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4 }}>
              POKÉMATHS
            </div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#6b7280', textAlign: 'center', marginTop: -4 }}>♪ TAP THE POKÉBALL ♪</div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#a78bfa', textAlign: 'center', lineHeight: 2 }}>
              WIN MATHS BATTLES<br />TO CATCH POKÉMON!
            </p>
            {activeProfile && (() => {
              const streak = liveStreak(save);
              const best = save.streak?.best ?? 0;
              const freezes = save.streak?.freezes ?? 0;
              const isNewTrainer = save.stats.correct + save.stats.wrong === 0 && caughtCount(save) === 0;
              return (
                <div className="rounded-xl flex flex-col w-full" style={{ maxWidth: '25rem', gap: '0.75rem', padding: 'clamp(0.85rem,3vw,1.15rem)', background: 'linear-gradient(135deg, rgba(58,34,108,0.72), rgba(17,17,46,0.82))', border: '2px solid rgba(255,215,0,0.55)', boxShadow: '0 0 20px rgba(255,215,0,0.1)' }}>
                  <div className="flex items-center" style={{ gap: '0.85rem' }}>
                    <img src={pixelSprite(activeProfile.avatarDex)} alt=""
                      onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(activeProfile.avatarDex)) i.src = artwork(activeProfile.avatarDex); }}
                      style={{ width: 'clamp(3.5rem,15vw,4.75rem)', height: 'clamp(3.5rem,15vw,4.75rem)', imageRendering: 'pixelated', objectFit: 'contain', filter: 'drop-shadow(0 0 10px #FFD700)', flexShrink: 0 }} />
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.4rem,1.55vw,0.55rem)', color: '#a78bfa', lineHeight: 1.55 }}>{isNewTrainer ? 'Welcome,' : 'Welcome back,'}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.72rem,3vw,1rem)', color: '#FFD700', lineHeight: 1.35, marginTop: 3, overflowWrap: 'anywhere' }}>{activeProfile.name}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2" style={{ gap: '0.6rem' }}>
                    <div className="rounded-lg" style={{ padding: '0.65rem 0.7rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.42)' }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.25vw,0.42rem)', color: '#fbbf24' }}>Streak</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.48rem,1.85vw,0.68rem)', color: streak > 0 ? '#f97316' : '#cbd5e1', marginTop: 5, lineHeight: 1.45 }}>🔥 {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'}` : 'Play today'}</div>
                      {best > 0 && <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.28rem,1.05vw,0.36rem)', color: '#94a3b8', marginTop: 3 }}>Best {best}</div>}
                    </div>
                    <div className="rounded-lg" style={{ padding: '0.65rem 0.7rem', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.4)' }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.32rem,1.25vw,0.42rem)', color: '#fbbf24' }}>Collection</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.48rem,1.85vw,0.68rem)', color: '#FFD700', marginTop: 5, lineHeight: 1.45 }}>📕 {caughtCount(save)} caught</div>
                      {freezes > 0 && <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.28rem,1.05vw,0.36rem)', color: '#38bdf8', marginTop: 3 }}>🧊 {freezes} freeze{freezes === 1 ? '' : 's'}</div>}
                    </div>
                  </div>
                  <button onClick={switchPlayer} aria-label="Switch player" className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.42rem,1.55vw,0.55rem)', minHeight: '2.8rem', padding: '0.55rem 0.7rem', color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '2px solid #38bdf8', boxShadow: '0 0 12px rgba(56,189,248,0.2)', cursor: 'pointer' }}>↻ Switch player</button>
                </div>
              );
            })()}
          </div>

          {/* Actions */}
          <Frame className="items-center" style={{ maxWidth: '24rem' }}>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={game.goCurriculumMap} className="w-full rounded-xl font-bold text-black"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vh,1.4rem) 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', border: '2px solid #FFD700', boxShadow: '0 0 24px rgba(255,215,0,0.45)', cursor: 'pointer' }}>
                🗺 {activeProfile ? 'CONTINUE JOURNEY' : 'START JOURNEY'}
              </button>
              <button onClick={game.goArcadeSelect} className="w-full rounded-xl font-bold"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vh,1.4rem) 0', background: 'rgba(56,189,248,0.08)', border: '2px solid #38bdf8', color: '#38bdf8', cursor: 'pointer' }}>
                ▶ ARCADE
              </button>
              <button onClick={game.goPokedex} className="w-full rounded-xl font-bold"
                style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: 'clamp(0.9rem,3vh,1.4rem) 0', background: 'rgba(239,68,68,0.08)', border: '2px solid #ef4444', color: '#ef4444', cursor: 'pointer' }}>
                📕 POKÉDEX ({caughtCount(save)}/{totalCatchable()})
              </button>
            </div>
          </Frame>

          {/* Footer: about / login + copyright */}
          <div className="flex flex-col items-center" style={{ gap: 'clamp(0.6rem, 2vh, 1rem)' }}>
            <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2">
              <button onClick={game.goStats} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#FFD700', background: 'none', border: 'none', cursor: 'pointer' }}>📊 MY STATS</button>
              <button onClick={game.goLogin} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}>👤 LOG IN</button>
              <button onClick={game.goAbout} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer' }}>ℹ ABOUT</button>
              <button onClick={game.goSettings} style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer' }}>⚙ SETTINGS</button>
            </div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#555', textAlign: 'center' }}>
              © 2019-2026 MUSHTAQ ARCADE CORP
            </p>
          </div>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // CURRICULUM MAP
  // =========================================================================
  if (state.screen === 'curriculumMap') {
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="REGION JOURNEY" right={<TrainerBadgeButton onClick={switchPlayer} />} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.6rem,2vw,1rem) 1rem' }}>
          <Frame>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', textAlign: 'center', marginBottom: '0.65rem' }}>CHOOSE A REGION TO BEGIN YOUR MATHS QUEST.</div>
            <div className="flex flex-col gap-2 w-full">
              {CURRICULUM_REGIONS.map((region) => {
                const unlocked = isCurriculumRegionUnlocked(save, region);
                const completed = region.topics.every((topic) => isTopicComplete(save, topic));
                const progress = curriculumRegionCompletionCount(save, region);
                const testedIn = hasCurriculumRegionTestPass(save, region.id);
                const accent = completed ? '#22c55e' : unlocked ? region.accentColor : '#475569';
                return (
                  <button key={region.id} onClick={() => unlocked ? game.openCurriculumRegion(region.id) : game.startCurriculumRegionTest(region.id)}
                    className="w-full rounded-xl text-left flex items-center gap-3 shrink-0"
                    style={{ padding: 'clamp(0.7rem,2.5vw,0.95rem)', background: unlocked ? `${region.accentColor}12` : 'rgba(0,0,0,0.35)', border: `2px solid ${accent}`, opacity: unlocked ? 1 : 0.72, cursor: 'pointer', boxShadow: completed ? '0 0 12px rgba(34,197,94,0.25)' : 'none' }}>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: accent, width: 'clamp(2.1rem,9vw,2.8rem)', textAlign: 'center', flexShrink: 0 }}>{completed ? '✓' : unlocked ? String(region.order).padStart(2, '0') : '🔒'}</div>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: unlocked ? '#f8fafc' : '#64748b', lineHeight: 1.55 }}>{region.name.toUpperCase()}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: unlocked ? '#cbd5e1' : '#94a3b8', lineHeight: 1.55 }}>{region.gen.toUpperCase()} · {progress.complete}/{progress.total} TOPICS</div>
                    </div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.28rem,1.2vw,0.38rem)', color: unlocked ? accent : '#FFD700', textAlign: 'right', lineHeight: 1.55, maxWidth: '7.3rem' }}>{unlocked ? (testedIn ? 'TRIAL\nPASSED' : completed ? 'MASTERED' : 'ENTER') : '3Q\nREADINESS TRIAL'}</div>
                  </button>
                );
              })}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // CURRICULUM REGION
  // =========================================================================
  if (state.screen === 'curriculumRegion' && state.curriculumRegionId) {
    const curriculumRegion = getCurriculumRegion(state.curriculumRegionId);
    if (!curriculumRegion) return null;
    const progress = curriculumRegionCompletionCount(save, curriculumRegion);
    return (
      <Screen bg={curriculumRegion.bgGradient}>
        <NavBar onHome={game.goMenu} onBack={game.goCurriculumMap} title={curriculumRegion.name.toUpperCase()} accent={curriculumRegion.accentColor} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.6rem,2vw,1rem) 1rem' }}>
          <Frame>
            <div className="rounded-xl mb-3" style={{ padding: '0.75rem', background: `${curriculumRegion.accentColor}14`, border: `1px solid ${curriculumRegion.accentColor}` }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: curriculumRegion.accentColor }}>{curriculumRegion.gen.toUpperCase()} · {curriculumRegion.inspiration.toUpperCase()}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', marginTop: 5 }}>{progress.complete}/{progress.total} TOPICS MASTERED</div>
            </div>
            <div className="rounded-xl mb-3" style={{ padding: '0.85rem', background: `${curriculumRegion.accentColor}18`, border: `2px solid ${curriculumRegion.accentColor}`, boxShadow: `0 0 16px ${curriculumRegion.accentColor}33` }}>
              <div className="flex items-center justify-between gap-3">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: curriculumRegion.accentColor, lineHeight: 1.7 }}>🏛️ {curriculumRegion.name.toUpperCase()} GYM</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#dbeafe', lineHeight: 1.7, marginTop: 4 }}>MODELS · MOVEMENT · EXPLANATIONS · TOPIC PRACTICE</div>
                </div>
                <button type="button" onClick={() => game.openGymTrail(curriculumRegion.id)} style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.36rem,1.7vw,0.48rem)', background: `linear-gradient(135deg, ${curriculumRegion.accentColor}, #0f766e)`, color: '#f8fafc', border: `1px solid ${curriculumRegion.accentColor}`, borderRadius: '0.5rem', padding: '0.62rem 0.55rem', cursor: 'pointer', flexShrink: 0 }}>ENTER<br />GYM ▶</button>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {curriculumRegion.topics.map((topic) => {
                const unlocked = isCurriculumTopicUnlocked(save, topic);
                const completed = isTopicComplete(save, topic);
                const testedIn = hasCurriculumTopicTestPass(save, topic.id);
                const moduleProgress = moduleCompletionCount(save, topic);
                const accent = completed ? '#22c55e' : unlocked ? curriculumRegion.accentColor : '#475569';
                return (
                  <button key={topic.id} onClick={() => unlocked ? game.openCurriculumTopic(topic.id) : game.startCurriculumTopicTest(topic.id)} className="w-full rounded-xl text-left flex items-center gap-3"
                    style={{ padding: '0.75rem', background: unlocked ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.28)', border: `2px solid ${accent}`, opacity: unlocked ? 1 : 0.72, cursor: 'pointer' }}>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: accent, width: '2.25rem', textAlign: 'center', flexShrink: 0 }}>{completed ? '✓' : unlocked ? String(topic.order).padStart(2, '0') : '🔒'}</div>
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: unlocked ? '#f8fafc' : '#64748b', lineHeight: 1.55 }}>{topic.title.toUpperCase()}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', lineHeight: 1.55 }}>{unlocked ? `${moduleProgress.complete}/${moduleProgress.total} MODULES` : '3Q READINESS TRIAL'}</div>
                    </div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.28rem,1.15vw,0.36rem)', color: unlocked ? (testedIn ? curriculumRegion.accentColor : '#94a3b8') : '#FFD700', textAlign: 'right' }}>{unlocked ? (testedIn ? 'TRIAL\nPASSED' : completed ? 'MASTERED' : 'ENTER') : '3Q\nTRIAL'}</div>
                  </button>
                );
              })}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // REGIONAL GYM · CONCEPT PRACTICE ROUTE
  // =========================================================================
  if (state.screen === 'gymTrail' && state.curriculumRegionId) {
    const gymRegion = getCurriculumRegion(state.curriculumRegionId);
    if (!gymRegion) return null;
    return (
      <Screen bg={gymRegion.bgGradient}>
        <NavBar onHome={game.goMenu} onBack={() => game.openCurriculumRegion(gymRegion.id)} title={`${gymRegion.name.toUpperCase()} GYM`} accent={gymRegion.accentColor} />
        <RegionalGym
          region={gymRegion}
          save={save}
          onBack={() => game.openCurriculumRegion(gymRegion.id)}
          onReturnToJourney={(topicId) => game.openCurriculumTopic(topicId)}
          onRecordPractice={game.recordGymPractice}
        />
      </Screen>
    );
  }

  // =========================================================================
  // CURRICULUM TOPIC
  // =========================================================================
  if (state.screen === 'curriculumTopic' && state.curriculumTopicId) {
    const curriculumTopic = getCurriculumTopic(state.curriculumTopicId);
    if (!curriculumTopic) return null;
    const bossUnlocked = isCurriculumBattleUnlocked(save, curriculumTopic.boss);
    const bossWon = hasCurriculumWin(save, curriculumTopic.boss.id);
    const bossTarget = bossMasteryTarget(curriculumTopic.boss);
    const bossAttempt = save.curriculumV2.bossAttempts[curriculumTopic.boss.id];
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} onBack={() => game.openCurriculumRegion(state.curriculumRegionId!)} title={`${getCurriculumRegionForTopic(curriculumTopic.id)?.name.toUpperCase() ?? 'REGION'} · T${String(curriculumTopic.order).padStart(2, '0')}`} accent={getCurriculumRegionForTopic(curriculumTopic.id)?.accentColor ?? '#38bdf8'} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="rounded-xl mb-3" style={{ padding: 'clamp(0.85rem,3vw,1.2rem)', background: 'rgba(56,189,248,0.08)', border: '2px solid #38bdf8' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#38bdf8', lineHeight: 1.8 }}>{curriculumTopic.title.toUpperCase()}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', lineHeight: 1.7, marginTop: 4 }}>EVERY MODULE CONTAINS DISCOVER, APPLY, AND MASTER BATTLES.</div>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {curriculumTopic.modules.map((module) => {
                const moduleUnlocked = isCurriculumModuleUnlocked(save, module);
                const moduleComplete = isModuleComplete(save, module);
                return (
                  <div key={module.id} className="rounded-xl" style={{ padding: '0.7rem', background: moduleUnlocked ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.3)', border: `1px solid ${moduleComplete ? '#22c55e' : moduleUnlocked ? '#334155' : '#1e293b'}`, opacity: moduleUnlocked ? 1 : 0.55 }}>
                    <div className="flex items-start gap-2" style={{ marginBottom: '0.55rem' }}>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: moduleComplete ? '#22c55e' : '#FFD700', flexShrink: 0 }}>{moduleComplete ? '✓' : String(module.order).padStart(2, '0')}</span>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: moduleUnlocked ? '#f8fafc' : '#64748b', lineHeight: 1.65 }}>{module.title.toUpperCase()}</div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {module.battles.map((battle) => {
                        const unlocked = isCurriculumBattleUnlocked(save, battle);
                        const complete = hasCurriculumWin(save, battle.id);
                        const legacy = isLegacyCapture(save, battle.dex);
                        const accent = battle.mode === 'elite' ? '#a78bfa' : '#38bdf8';
                        return (
                          <button key={battle.id} disabled={!unlocked} onClick={() => unlocked && game.startCurriculumBattle(battle.id)}
                            className="w-full rounded-lg text-left flex items-center gap-2"
                            style={{ padding: '0.55rem', background: unlocked ? 'rgba(15,23,42,0.72)' : 'rgba(0,0,0,0.35)', border: `1px solid ${complete ? '#22c55e' : unlocked ? accent : '#334155'}`, opacity: unlocked ? 1 : 0.52, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
                            <img src={pixelSprite(battle.dex)} alt="" onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(battle.dex)) img.src = artwork(battle.dex); }} style={{ width: 'clamp(27px,7vw,36px)', height: 'clamp(27px,7vw,36px)', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0, filter: unlocked || complete ? 'none' : 'brightness(0)' }} />
                            <div className="flex-1" style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: complete ? '#22c55e' : unlocked ? accent : '#64748b', lineHeight: 1.6 }}>{battleModeLabel(battle.mode)} · #{battle.dex}</div>
                              <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.3rem,1.3vw,0.4rem)', color: '#94a3b8', lineHeight: 1.5 }}>{battle.questionCount} QUESTIONS{legacy ? ' · LEGACY OWNED' : ''}</div>
                            </div>
                            <span style={{ fontSize: 'clamp(0.8rem,3.5vw,1.1rem)' }}>{complete ? '✅' : unlocked ? '▶' : '🔒'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button disabled={!bossUnlocked} onClick={() => bossUnlocked && game.startCurriculumBattle(curriculumTopic.boss.id)}
                className="w-full rounded-xl text-left flex items-center gap-3"
                style={{ padding: '0.85rem', marginTop: '0.25rem', background: bossUnlocked ? 'rgba(255,215,0,0.09)' : 'rgba(0,0,0,0.35)', border: `2px solid ${bossWon ? '#22c55e' : bossUnlocked ? '#FFD700' : '#475569'}`, opacity: bossUnlocked ? 1 : 0.55, cursor: bossUnlocked ? 'pointer' : 'not-allowed', boxShadow: bossUnlocked ? '0 0 14px rgba(255,215,0,0.18)' : 'none' }}>
                <img src={artwork(curriculumTopic.boss.dex)} alt="" style={{ width: 'clamp(42px,11vw,60px)', height: 'clamp(42px,11vw,60px)', objectFit: 'contain', imageRendering: 'pixelated', filter: bossUnlocked || bossWon ? 'none' : 'brightness(0)' }} />
                <div className="flex-1" style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: bossWon ? '#22c55e' : '#FFD700', lineHeight: 1.6 }}>{bossWon ? '✓ ' : '★ '}{nameOf(curriculumTopic.boss.dex).toUpperCase()} BOSS</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', lineHeight: 1.6 }}>{bossUnlocked ? `TOPIC MASTERY · ${curriculumTopic.boss.questionCount} QUESTIONS · ${bossTarget}/${curriculumTopic.boss.questionCount} TARGET` : 'COMPLETE EVERY MODULE TO UNLOCK'}</div>
                  {bossUnlocked && <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.28rem,1.15vw,0.36rem)', color: '#94a3b8', lineHeight: 1.55, marginTop: 4 }}>{Math.floor((curriculumTopic.boss.timeLimitSec ?? 0) / 60)} MIN · RECALL → APPLY → MASTERY{bossAttempt ? ` · BEST ${bossAttempt.bestCorrect}/${curriculumTopic.boss.questionCount}` : ''}</div>}
                </div>
              </button>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // REGION SELECT
  // =========================================================================
  if (state.screen === 'regionSelect') {
    const renderRegion = (region: Region) => {
      const unlocked = isRegionUnlocked(save, region);
      const openable = isRegionOpenable(save, region);
      const done = regionComplete(save, region);
      const caught = region.battles.filter(b => save.wonBattles.includes(b.id)).length;
      return (
        <button key={region.id} disabled={!openable} onClick={() => openable && game.openRegion(region.id)}
          className="w-full rounded-xl text-left flex items-center gap-3 shrink-0"
          style={{
            padding: 'clamp(0.7rem,2.5vw,1.1rem)',
            background: openable ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.4)',
            border: `2px solid ${openable ? region.accentColor : '#333'}`,
            boxShadow: openable ? `0 0 8px ${region.accentColor}22` : 'none',
            opacity: openable ? 1 : 0.55, cursor: openable ? 'pointer' : 'not-allowed',
          }}>
          <div style={{ fontSize: 'clamp(1.3rem,5vw,1.9rem)', width: 'clamp(2rem,8vw,2.6rem)', textAlign: 'center', flexShrink: 0 }}>
            {!openable ? '🔒' : done ? '✅' : unlocked ? (region.secret ? '✨' : '🌍') : '🔑'}
          </div>
          <div className="flex-1 flex flex-col justify-center" style={{ minWidth: 0, gap: 'clamp(4px,1.4vw,8px)' }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, lineHeight: 1.6, color: openable ? region.accentColor : '#666' }}>{region.name.toUpperCase()}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.6, color: '#888' }}>{region.gen} · {region.inspiration}</div>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.6, color: '#666' }}>
              {!openable ? 'SECRET — CLEAR ALL REGIONS' : `${caught}/${region.battles.length} CAUGHT${unlocked ? '' : ' · TEST OUT'}`}
            </div>
          </div>
        </button>
      );
    };
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="CHOOSE REGION" right={<TrainerBadgeButton onClick={switchPlayer} />} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="flex flex-col gap-2 w-full">
              {MAINLINE_REGIONS.map(renderRegion)}
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#a78bfa', margin: '0.75rem 0 0.25rem', textAlign: 'center' }}>✨ SECRET REGIONS ✨</div>
              {SECRET_REGIONS.map(renderRegion)}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // BATTLE SELECT
  // =========================================================================
  if (state.screen === 'battleSelect' && state.regionId) {
    const region = getRegion(state.regionId)!;
    return (
      <Screen bg={region.bgGradient}>
        <NavBar onHome={game.goMenu} onBack={game.goRegionSelect} title={`${region.name.toUpperCase()} · ${region.gen}`} accent={region.accentColor} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="flex flex-col gap-2 w-full">
              {region.battles.map((b, i) => {
                const playable = isBattlePlayable(save, region, i);
                const won = save.wonBattles.includes(b.id);
                const topic = getTopic(b.topic);
                return (
                  <button key={b.id} onClick={() => (playable ? game.startBattle(b.id) : game.startTest(b.id))}
                    className="w-full rounded-xl text-left flex items-center gap-3 shrink-0"
                    style={{ padding: 'clamp(0.7rem,2.5vw,1.1rem)', background: 'rgba(0,0,0,0.4)', border: `2px solid ${b.isBoss ? '#FFD700' : region.accentColor}`, opacity: playable ? 1 : 0.85, cursor: 'pointer' }}>
                    <img src={pixelSprite(b.dex)} alt={won ? nameOf(b.dex) : 'Unknown'} loading="lazy"
                      onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(b.dex)) img.src = artwork(b.dex); }}
                      style={{ width: 'clamp(38px,11vw,56px)', height: 'clamp(38px,11vw,56px)', objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0, filter: playable || won ? 'none' : 'brightness(0)' }} />
                    <div className="flex-1 flex flex-col justify-center" style={{ minWidth: 0, gap: 'clamp(4px,1.4vw,8px)' }}>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, lineHeight: 1.6, color: b.isBoss ? '#FFD700' : region.accentColor }}>{b.isBoss ? '★ ' : ''}{playable || won ? nameOf(b.dex).toUpperCase() : '???'}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.6, color: '#aaa' }}>#{b.dex} · {topic.name}</div>
                      <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.6, color: '#777' }}>{b.questionCount} Qs · 100%{b.timeLimitSec ? ` · ⏱${b.timeLimitSec}s` : ''}</div>
                    </div>
                    {won ? (
                      <div style={{ fontSize: 'clamp(1rem,4vw,1.4rem)', flexShrink: 0 }}>✅</div>
                    ) : !playable ? (
                      <div className="flex flex-col items-center" style={{ flexShrink: 0, gap: 3 }}>
                        <span style={{ fontSize: 'clamp(0.9rem,3.5vw,1.2rem)' }}>🔑</span>
                        <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.34rem', color: '#FFD700', lineHeight: 1.3, textAlign: 'center' }}>TEST<br />OUT</span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // ARCADE — LEVEL SELECT
  // =========================================================================
  if (state.screen === 'arcadeSelect') {
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="ARCADE" accent="#38bdf8" right={<TrainerBadgeButton onClick={switchPlayer} />} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem clamp(1.5rem,5vh,2.5rem)' }}>
          <Frame style={{ flexShrink: 0 }}>
            {/* --- your Pokémon (mega-capable) --- */}
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#888', marginBottom: '0.6rem', textAlign: 'center' }}>PICK YOUR POKÉMON</p>
            <div className="w-full overflow-x-auto mb-4" style={{ padding: '0.5rem 0.25rem 0.6rem' }}>
              <div className="flex" style={{ gap: '0.6rem', minWidth: 'min-content' }}>
                {MEGAS.map((m) => {
                  const sel = arcMon === m.dex;
                  const tile = 'clamp(64px,17vw,82px)';
                  return (
                    <button key={m.dex} onClick={() => setArcMon(m.dex)}
                      ref={sel ? (el) => el?.scrollIntoView({ block: 'nearest', inline: 'center' }) : undefined}
                      className="rounded-xl shrink-0 flex items-center justify-center"
                      style={{ width: tile, height: tile, minWidth: 0, minHeight: 0, padding: '0.3rem', overflow: 'hidden', background: sel ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)', border: `2px solid ${sel ? '#38bdf8' : '#333'}`, boxShadow: sel ? '0 0 12px rgba(56,189,248,0.45)' : 'none', cursor: 'pointer' }}>
                      <img src={pixelSprite(m.dex)} alt={nameOf(m.dex)} onError={(e) => { (e.currentTarget as HTMLImageElement).src = artwork(m.dex); }} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0, objectFit: 'contain', imageRendering: 'pixelated' }} />
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#38bdf8', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.6 }}>{nameOf(arcMon).toUpperCase()}{getMega(arcMon) ? ` · ${getMega(arcMon)!.name.toUpperCase()}` : ''}</p>

            {/* --- question count --- */}
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#888', marginBottom: '0.75rem', textAlign: 'center' }}>HOW MANY QUESTIONS?</p>
            <div className="flex justify-center w-full" style={{ gap: 'clamp(0.5rem,2vw,0.75rem)', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
              {ARCADE_COUNTS.map((c) => {
                const sel = arcCount === c;
                const isMega = c === MEGA_COUNT;
                return (
                  <button key={c} onClick={() => setArcCount(c)} className="rounded-lg shrink-0 flex flex-col items-center justify-center"
                    style={{ minWidth: 'clamp(58px,16vw,80px)', height: 'clamp(56px,15vw,68px)', gap: 3, padding: '0.4rem 0.6rem', background: sel ? (isMega ? 'rgba(234,179,8,0.18)' : 'rgba(56,189,248,0.15)') : 'rgba(255,255,255,0.04)', border: `2px solid ${sel ? (isMega ? '#eab308' : '#38bdf8') : '#333'}`, boxShadow: sel && isMega ? '0 0 12px rgba(234,179,8,0.5)' : 'none', cursor: 'pointer' }}>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: sel ? (isMega ? '#eab308' : '#38bdf8') : '#ccc' }}>{c}</span>
                    {isMega && <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: sel ? '#eab308' : '#777' }}>⚡MEGA</span>}
                  </button>
                );
              })}
            </div>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: arcCount === MEGA_COUNT ? '#eab308' : '#666', marginBottom: '1.5rem', textAlign: 'center', lineHeight: 1.7 }}>{arcCount === MEGA_COUNT ? 'COMPLETE 24 QUESTIONS TO MEGA-EVOLVE. ACCURACY IS RECORDED, NOT REQUIRED.' : 'PICK 24 TO UNLOCK MEGA EVOLUTION'}</p>

            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#888', marginBottom: '0.75rem', textAlign: 'center' }}>QUICK SCORE ATTACK — PICK A LEVEL</p>
            <div className="flex flex-col gap-2 w-full">
              {ARCADE_LEVELS.map((lvl, i) => (
                <button key={lvl.id} onClick={() => game.startArcade(lvl.id, arcCount, arcMon)} className="w-full rounded-xl text-left flex items-center gap-3 shrink-0"
                  style={{ padding: 'clamp(0.7rem,2.5vw,1.1rem)', background: 'rgba(255,255,255,0.04)', border: `2px solid ${lvl.accentColor}`, boxShadow: `0 0 8px ${lvl.accentColor}22`, cursor: 'pointer' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: lvl.accentColor, width: 'clamp(1.5rem,6vw,2.2rem)', textAlign: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div className="flex-1 flex flex-col justify-center" style={{ minWidth: 0, gap: 'clamp(4px,1.4vw,8px)' }}>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, lineHeight: 1.6, color: lvl.accentColor }}>{lvl.name.toUpperCase()}</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.6, color: '#aaa' }}>{lvl.subtitle}</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.6, color: '#777' }}>{lvl.questionCount} QUESTIONS</div>
                  </div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: lvl.accentColor, flexShrink: 0 }}>▶</div>
                </button>
              ))}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // ARCADE — RESULT
  // =========================================================================
  if (state.screen === 'arcadeResult' && state.arcadeLevelId) {
    const lvl = getArcadeLevel(state.arcadeLevelId)!;
    const accuracy = state.total > 0 ? Math.round((state.correctCount / state.total) * 100) : 0;
    const perfect = accuracy === 100;
    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const mega = state.arcadeCount === MEGA_COUNT && state.arcadePokemonDex != null ? getMega(state.arcadePokemonDex) : undefined;
    return (
      <Screen bg="linear-gradient(135deg, #0a0a1a, #1a0a3e)">
        <NavBar onHome={game.goMenu} title="ARCADE RESULT" accent={lvl.accentColor} />
        {perfect && <Confetti />}
        <div className="flex-1 w-full flex flex-col items-center justify-center overflow-y-auto" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: `3px solid ${mega ? '#eab308' : lvl.accentColor}`, boxShadow: `0 0 40px ${mega ? 'rgba(234,179,8,0.4)' : lvl.accentColor + '44'}` }}>
              {mega && (
                <div className="mb-4">
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#eab308', letterSpacing: 1, marginBottom: '0.5rem', textShadow: '0 0 12px #eab308' }}>⚡ MEGA EVOLUTION! ⚡</div>
                  <div className="flex justify-center">
                    <img src={artwork(mega.formId)} alt={mega.name} onError={(e) => { (e.currentTarget as HTMLImageElement).src = artwork(mega.dex); }} style={{ width: 'clamp(150px,45vw,220px)', height: 'clamp(150px,45vw,220px)', objectFit: 'contain', filter: 'drop-shadow(0 0 22px rgba(234,179,8,0.6))' }} />
                  </div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: '0.5rem' }}>{mega.name.toUpperCase()}</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#22c55e', marginTop: '0.5rem' }}>✓ ADDED TO MEGA POKÉDEX</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.28rem,1.1vw,0.36rem)', color: '#cbd5e1', marginTop: 6, lineHeight: 1.6 }}>24 QUESTIONS COMPLETE · ACCURACY DOES NOT AFFECT EVOLUTION</div>
                  <div className="flex gap-2" style={{ marginTop: '0.75rem' }}>
                    <button onClick={onShareMega} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '2px solid #22c55e', cursor: 'pointer' }}>📤 SHARE</button>
                    <button onClick={onSaveMega} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '2px solid #a78bfa', cursor: 'pointer' }}>💾 SAVE</button>
                  </div>
                  {megaMsg && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#FFD700', marginTop: 8 }}>{megaMsg}</div>}
                </div>
              )}
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.25rem' }}>{perfect ? '🌟' : '🎮'}</div>
              <h1 style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: lvl.accentColor, marginBottom: '0.25rem' }}>{lvl.name.toUpperCase()}</h1>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: perfect ? '#FFD700' : '#e2e8f0', marginBottom: '1rem' }}>{perfect ? 'PERFECT RUN!' : 'RUN COMPLETE!'}</p>
              <div className="rounded-lg mb-3" style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', marginBottom: 4 }}>SCORE</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.score, color: '#FFD700' }}>{state.score.toLocaleString()}</div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 rounded-lg" style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>ACCURACY</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: perfect ? '#22c55e' : '#fff', marginTop: 3 }}>{accuracy}%</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#666', marginTop: 3 }}>{state.correctCount}/{state.total}</div>
                </div>
                <div className="flex-1 rounded-lg" style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>TIME</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: 3 }}>{fmt(state.elapsed)}</div>
                </div>
              </div>
              {(() => { const st = liveStreak(save); const ms = milestoneAt(st); return st > 0 ? (
                <div className="mb-4 flex flex-col" style={{ gap: 8 }}>
                  <div className="rounded-lg flex items-center justify-center" style={{ gap: 8, padding: '0.6rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)' }}>
                    <span style={{ fontSize: 'clamp(1rem,4vw,1.3rem)' }}>🔥</span>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#f97316' }}>{st} DAY STREAK!</span>
                  </div>
                  {ms && (
                    <div className="rounded-lg flex items-center justify-center" style={{ gap: 8, padding: '0.7rem', background: `${ms.color}1a`, border: `2px solid ${ms.color}`, boxShadow: `0 0 14px ${ms.color}55` }}>
                      <span style={{ fontSize: 'clamp(1.1rem,4.5vw,1.5rem)' }}>{ms.icon}</span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: ms.color, lineHeight: 1.6 }}>{ms.name.toUpperCase()} BADGE EARNED!</span>
                    </div>
                  )}
                  {freezeUsedToday(save) && (
                    <div className="rounded-lg flex items-center justify-center" style={{ gap: 8, padding: '0.6rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.4)' }}>
                      <span style={{ fontSize: 'clamp(1rem,4vw,1.3rem)' }}>🧊</span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#38bdf8', lineHeight: 1.6 }}>FREEZE USED — STREAK SAFE!</span>
                    </div>
                  )}
                </div>
              ) : null; })()}
              <div className="flex flex-col gap-2">
                <button onClick={game.replayArcade} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ PLAY AGAIN</button>
                <button onClick={game.goArcadeSelect} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#38bdf8', background: 'transparent', border: '1px solid #38bdf8', cursor: 'pointer' }}>☰ CHANGE LEVEL</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // CAUGHT
  // =========================================================================
  if (state.screen === 'caught' && (game.activeBattle || game.activeCurriculumBattle)) {
    const curriculumBattle = state.mode === 'curriculum' ? game.activeCurriculumBattle : null;
    const b = curriculumBattle ?? game.activeBattle!;
    const legacyOwned = Boolean(curriculumBattle && isLegacyCapture(save, b.dex));
    const rewardAccent = curriculumBattle?.isBoss ? '#FFD700' : game.activeRegion?.accentColor ?? '#38bdf8';
    return (
      <Screen bg="linear-gradient(135deg, #0a0a1a, #1a0a3e)">
        <NavBar onHome={game.goMenu} title={curriculumBattle?.isBoss ? 'TOPIC MASTERED!' : 'GOTCHA!'} />
        <Confetti />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #FFD700', boxShadow: '0 0 40px rgba(255,215,0,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', marginBottom: '0.75rem', textShadow: '0 0 12px #FFD700' }}>{curriculumBattle?.isBoss ? 'TOPIC MASTERED!' : 'GOTCHA!'}</div>
              <div className="flex justify-center mb-3">
                <PokemonSprite src={artwork(b.dex)} name={nameOf(b.dex)} size={150} glow={rewardAccent} />
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>{curriculumBattle?.isBoss ? <>{nameOf(b.dex).toUpperCase()} DEFEATED!<br />TOPIC BADGE EARNED.</> : legacyOwned ? <>{nameOf(b.dex).toUpperCase()} IS ALREADY IN<br />YOUR LEGACY POKÉDEX! TOKEN EARNED.</> : <>{nameOf(b.dex).toUpperCase()} WAS CAUGHT<br />AND ADDED TO YOUR POKÉDEX!</>}</p>
              <div className="rounded-lg mb-4" style={{ padding: 'clamp(0.6rem,2vw,1rem)', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', marginBottom: 4 }}>SCORE</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.score, color: '#FFD700' }}>{state.score.toLocaleString()}</div>
              </div>
              {(() => { const st = liveStreak(save); const ms = milestoneAt(st); return st > 0 ? (
                <div className="mb-4 flex flex-col" style={{ gap: 8 }}>
                  <div className="rounded-lg flex items-center justify-center" style={{ gap: 8, padding: '0.6rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.4)' }}>
                    <span style={{ fontSize: 'clamp(1rem,4vw,1.3rem)' }}>🔥</span>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#f97316' }}>{st} DAY STREAK!</span>
                  </div>
                  {ms && (
                    <div className="rounded-lg flex items-center justify-center" style={{ gap: 8, padding: '0.7rem', background: `${ms.color}1a`, border: `2px solid ${ms.color}`, boxShadow: `0 0 14px ${ms.color}55` }}>
                      <span style={{ fontSize: 'clamp(1.1rem,4.5vw,1.5rem)' }}>{ms.icon}</span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: ms.color, lineHeight: 1.6 }}>{ms.name.toUpperCase()} BADGE EARNED!</span>
                    </div>
                  )}
                  {freezeUsedToday(save) && (
                    <div className="rounded-lg flex items-center justify-center" style={{ gap: 8, padding: '0.6rem', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.4)' }}>
                      <span style={{ fontSize: 'clamp(1rem,4vw,1.3rem)' }}>🧊</span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#38bdf8', lineHeight: 1.6 }}>FREEZE USED — STREAK SAFE!</span>
                    </div>
                  )}
                </div>
              ) : null; })()}
              <div className="flex gap-2 mb-2">
                <button onClick={onShare} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '2px solid #22c55e', cursor: 'pointer' }}>📤 SHARE</button>
                <button onClick={onSave} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '2px solid #a78bfa', cursor: 'pointer' }}>💾 SAVE</button>
              </div>
              {shareMsg && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#FFD700', marginBottom: 8 }}>{shareMsg}</div>}
              <div className="flex flex-col gap-2">
                <button onClick={() => curriculumBattle ? game.openCurriculumTopic(curriculumBattle.topicId) : game.openRegion(game.activeRegion!.id)} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>▶ CONTINUE</button>
                <button onClick={game.goPokedex} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#38bdf8', background: 'transparent', border: '1px solid #38bdf8', cursor: 'pointer' }}>📕 VIEW POKÉDEX</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // FAILED
  // =========================================================================
  if (state.screen === 'failed' && (game.activeBattle || game.activeCurriculumBattle)) {
    const curriculumBattle = state.mode === 'curriculum' ? game.activeCurriculumBattle : null;
    const b = curriculumBattle ?? game.activeBattle!;
    const isCurriculumBoss = Boolean(curriculumBattle?.isBoss);
    const bossTarget = isCurriculumBoss ? bossMasteryTarget(curriculumBattle!) : b.questionCount;
    const retryGuidance = curriculumBattle?.bossSpec?.retryGuidance;
    const failureText = isCurriculumBoss
      ? state.bossFailure === 'time'
        ? 'TIME RAN OUT. THE BOSS WILL WAIT.'
        : state.bossFailure === 'final-mastery'
          ? 'THE FINAL MASTERY QUESTION MUST BE CORRECT.'
          : `YOU NEED ${bossTarget}/${b.questionCount} CORRECT.`
      : `YOU NEED 100% TO CATCH ${nameOf(b.dex).toUpperCase()}.`;
    return (
      <Screen bg="linear-gradient(135deg, #1a0000, #0a0a1a)">
        <NavBar onHome={game.goMenu} onBack={() => curriculumBattle ? game.openCurriculumTopic(curriculumBattle.topicId) : game.openRegion(game.activeRegion!.id)} title="BATTLE LOST" accent="#ef4444" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #ef4444' }}>
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.5rem' }}>💨</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#ef4444', marginBottom: '0.75rem' }}>{state.feedback === "Time's up!" ? "TIME'S UP!" : 'SO CLOSE!'}</div>
              <div className="flex justify-center mb-3">
                <PokemonSprite src={pixelSprite(b.dex)} name={nameOf(b.dex)} size={110} bounce={false} fallback={artwork(b.dex)} />
              </div>
              <div className="rounded-lg mb-3" style={{ padding: 'clamp(0.5rem,2vw,0.9rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>YOU GOT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: 3 }}>{state.correctCount}/{state.total} CORRECT</div>
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: retryGuidance ? '0.65rem' : '1.25rem' }}>{failureText}<br />TRY AGAIN!</p>
              {retryGuidance && <div className="rounded-lg mb-4" style={{ padding: '0.6rem', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.28)' }}><div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#FFD700', lineHeight: 1.75 }}>TRAINING TIP</div><div style={{ fontFamily: PIXEL_FONT, fontSize: 'clamp(0.3rem,1.25vw,0.4rem)', color: '#cbd5e1', lineHeight: 1.7, marginTop: 4 }}>{retryGuidance}</div></div>}
              <div className="flex flex-col gap-2">
                <button onClick={game.retryBattle} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ RETRY</button>
                <button onClick={() => curriculumBattle ? game.openCurriculumTopic(curriculumBattle.topicId) : game.openRegion(game.activeRegion!.id)} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#aaa', background: 'transparent', border: '1px solid #444', cursor: 'pointer' }}>← BACK</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // TEST-OUT PASSED / FAILED
  // =========================================================================
  if (state.screen === 'testPassed' && state.mode === 'topicTest' && state.curriculumTopicId && state.curriculumRegionId) {
    const curriculumTopic = getCurriculumTopic(state.curriculumTopicId);
    const curriculumRegion = getCurriculumRegion(state.curriculumRegionId);
    if (!curriculumTopic || !curriculumRegion) return null;
    return (
      <Screen bg={curriculumRegion.bgGradient}>
        <NavBar onHome={game.goMenu} onBack={() => game.openCurriculumRegion(curriculumRegion.id)} title="READY TO ADVANCE" accent="#22c55e" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #22c55e', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', marginBottom: '0.75rem', textShadow: '0 0 12px #FFD700' }}>READY TO ADVANCE!</div>
              <img src="/pokemaths/images/curriculum-crest.png" alt="Curriculum crest" style={{ width: 'clamp(4.5rem,25vw,7rem)', height: 'clamp(4.5rem,25vw,7rem)', objectFit: 'contain', imageRendering: 'pixelated', margin: '0 auto 0.8rem' }} />
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>YOU SHOWED YOU'RE READY!<br />{curriculumTopic.title.toUpperCase()} IS NOW OPEN.</p>
              <button onClick={() => game.openCurriculumTopic(curriculumTopic.id)} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>▶ START TOPIC</button>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (state.screen === 'testPassed' && state.mode === 'regionTest' && state.curriculumRegionId) {
    const curriculumRegion = getCurriculumRegion(state.curriculumRegionId);
    if (!curriculumRegion) return null;
    return (
      <Screen bg={curriculumRegion.bgGradient}>
        <NavBar onHome={game.goMenu} onBack={game.goCurriculumMap} title="READY TO EXPLORE" accent="#22c55e" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #22c55e', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', marginBottom: '0.75rem', textShadow: '0 0 12px #FFD700' }}>READY TO EXPLORE!</div>
              <img src="/pokemaths/images/curriculum-crest.png" alt="Curriculum crest" style={{ width: 'clamp(4.5rem,25vw,7rem)', height: 'clamp(4.5rem,25vw,7rem)', objectFit: 'contain', imageRendering: 'pixelated', margin: '0 auto 0.8rem' }} />
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>YOU SHOWED YOU'RE READY!<br />{curriculumRegion.name.toUpperCase()} IS NOW OPEN.</p>
              <button onClick={() => game.openCurriculumRegion(curriculumRegion.id)} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>▶ ENTER {curriculumRegion.name.toUpperCase()}</button>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (state.screen === 'testPassed' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    return (
      <Screen bg="linear-gradient(135deg, #05230f, #0a0a1a)">
        <NavBar onHome={game.goMenu} onBack={() => game.openRegion(game.activeRegion!.id)} title="UNLOCKED" accent="#22c55e" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #22c55e', boxShadow: '0 0 30px rgba(34,197,94,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', marginBottom: '0.5rem', textShadow: '0 0 12px #FFD700' }}>🔑 UNLOCKED!</div>
              <div className="flex justify-center mb-3">
                <PokemonSprite src={artwork(b.dex)} name={nameOf(b.dex)} size={140} glow={game.activeRegion.accentColor} />
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>TEST PASSED! YOU CAN NOW<br />BATTLE {nameOf(b.dex).toUpperCase()} TO CATCH IT.</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => game.startBattle(b.id)} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>▶ PLAY NOW</button>
                <button onClick={() => game.openRegion(game.activeRegion!.id)} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#22c55e', background: 'transparent', border: '1px solid #22c55e', cursor: 'pointer' }}>← BACK TO LEVELS</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (state.screen === 'testFailed' && state.mode === 'topicTest' && state.curriculumTopicId && state.curriculumRegionId) {
    const curriculumTopic = getCurriculumTopic(state.curriculumTopicId);
    const curriculumRegion = getCurriculumRegion(state.curriculumRegionId);
    if (!curriculumTopic || !curriculumRegion) return null;
    return (
      <Screen bg="linear-gradient(135deg, #1a0000, #0a0a1a)">
        <NavBar onHome={game.goMenu} onBack={() => game.openCurriculumRegion(curriculumRegion.id)} title="READINESS TRIAL" accent="#ef4444" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #ef4444' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#ef4444', marginBottom: '0.75rem' }}>NOT QUITE!</div>
              <div className="rounded-lg mb-3" style={{ padding: 'clamp(0.5rem,2vw,0.9rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>YOU GOT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: 3 }}>{state.correctCount}/3 CORRECT</div>
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>SHOW YOU'RE READY FOR THIS TOPIC.<br />A READINESS TRIAL NEEDS 3/3.</p>
              <div className="flex flex-col gap-2">
                <button onClick={game.retryTest} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ RETRY READINESS TRIAL</button>
                <button onClick={() => game.openCurriculumRegion(curriculumRegion.id)} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#aaa', background: 'transparent', border: '1px solid #444', cursor: 'pointer' }}>← BACK TO REGION</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (state.screen === 'testFailed' && state.mode === 'regionTest' && state.curriculumRegionId) {
    const curriculumRegion = getCurriculumRegion(state.curriculumRegionId);
    if (!curriculumRegion) return null;
    return (
      <Screen bg="linear-gradient(135deg, #1a0000, #0a0a1a)">
        <NavBar onHome={game.goMenu} onBack={game.goCurriculumMap} title="READINESS TRIAL" accent="#ef4444" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #ef4444' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#ef4444', marginBottom: '0.75rem' }}>NOT QUITE!</div>
              <div className="rounded-lg mb-3" style={{ padding: 'clamp(0.5rem,2vw,0.9rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>YOU GOT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: 3 }}>{state.correctCount}/3 CORRECT</div>
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>SHOW YOU'RE READY FOR THIS REGION.<br />A READINESS TRIAL NEEDS 3/3.</p>
              <div className="flex flex-col gap-2">
                <button onClick={game.retryTest} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ RETRY READINESS TRIAL</button>
                <button onClick={game.goCurriculumMap} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#aaa', background: 'transparent', border: '1px solid #444', cursor: 'pointer' }}>← REGION MAP</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  if (state.screen === 'testFailed' && game.activeBattle && game.activeRegion) {
    const b = game.activeBattle;
    return (
      <Screen bg="linear-gradient(135deg, #1a0000, #0a0a1a)">
        <NavBar onHome={game.goMenu} onBack={() => game.openRegion(game.activeRegion!.id)} title="TEST FAILED" accent="#ef4444" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.85)', border: '3px solid #ef4444' }}>
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.5rem' }}>📝</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#ef4444', marginBottom: '0.75rem' }}>NOT QUITE!</div>
              <div className="rounded-lg mb-3" style={{ padding: 'clamp(0.5rem,2vw,0.9rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>YOU GOT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#fff', marginTop: 3 }}>{state.correctCount}/{state.total} CORRECT</div>
              </div>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2, marginBottom: '1.25rem' }}>GET ALL 3 RIGHT TO UNLOCK<br />THIS LEVEL. TRY AGAIN!</p>
              <div className="flex flex-col gap-2">
                <button onClick={game.retryTest} className="w-full rounded-lg font-bold text-black" style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.8rem 0', background: 'linear-gradient(135deg, #FFD700, #FFA500)', cursor: 'pointer' }}>↻ TRY TEST AGAIN</button>
                <button onClick={() => game.openRegion(game.activeRegion!.id)} className="w-full rounded-lg" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.6rem 0', color: '#aaa', background: 'transparent', border: '1px solid #444', cursor: 'pointer' }}>← BACK</button>
              </div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // POKÉDEX
  // =========================================================================
  if (state.screen === 'pokedex') {
    const searchTerm = pokedexSearch.trim().toLocaleLowerCase();
    const caughtList = REGIONS
      .flatMap((rg) => rg.battles)
      .filter((b) => save.caught[b.dex])
      .sort((a, b) => a.dex - b.dex);
    const matchingCaughtList = searchTerm
      ? caughtList.filter((b) => nameOf(b.dex).toLocaleLowerCase().includes(searchTerm))
      : caughtList;
    // Legacy ownership takes precedence over Journey secrecy: a caught Pokémon
    // must always remain visible in its own named Pokédex region.
    const visibleRegions = REGIONS.filter((rg) => !rg.secret || isRegionUnlocked(save, rg) || rg.battles.some((battle) => Boolean(save.caught[battle.dex])));
    const filteredRegions = regionFilter
      ? visibleRegions.filter((region) => region.id === regionFilter)
      : visibleRegions;
    const isExpanded = (key: string) => !collapsedPokedexSections[key];
    const togglePokedexSection = (key: string) => {
      setCollapsedPokedexSections((current) => ({ ...current, [key]: !current[key] }));
    };
    const selectRegionFilter = (regionId: string) => {
      setRegionFilter(regionId);
      if (regionId) {
        setCollapsedPokedexSections((current) => ({
          ...current,
          regions: false,
          [`region-${regionId}`]: false,
        }));
      }
    };
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="POKÉDEX" accent="#ef4444" right={<TrainerBadgeButton onClick={switchPlayer} />} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#FFD700', marginBottom: '0.75rem' }}>{caughtCount(save)} / {totalCatchable()} CAUGHT</p>

            <div className="w-full" style={{ marginBottom: '1rem' }}>
              <label htmlFor="pokedex-search" style={{ display: 'block', fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', marginBottom: 6 }}>
                SEARCH YOUR CAUGHT POKÉMON
              </label>
              <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.5)', border: '2px solid #ef4444', borderRadius: '0.55rem', boxShadow: '0 0 10px rgba(239,68,68,0.12)' }}>
                <span aria-hidden="true" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#ef4444', paddingLeft: '0.7rem' }}>⌕</span>
                <input
                  id="pokedex-search"
                  type="search"
                  value={pokedexSearch}
                  onChange={(event) => setPokedexSearch(event.target.value)}
                  placeholder="TYPE A NAME"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full"
                  style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#f8fafc', background: 'transparent', border: 'none', outline: 'none', padding: '0.75rem 0.6rem', minWidth: 0 }}
                />
                {pokedexSearch && (
                  <button
                    type="button"
                    onClick={() => setPokedexSearch('')}
                    aria-label="Clear Pokédex search"
                    style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.75rem' }}
                  >
                    CLEAR
                  </button>
                )}
              </div>
            </div>

            {/* --- caught showcase: everything you own, up top --- */}
            {(() => {
              if (caughtList.length === 0) {
                return (
                  <div className="w-full rounded-xl text-center" style={{ padding: 'clamp(1rem,4vw,1.5rem)', background: 'rgba(255,215,0,0.05)', border: '1px dashed rgba(255,215,0,0.3)', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: 'clamp(1.5rem,6vw,2rem)', marginBottom: 8 }}>🔍</div>
                    <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', lineHeight: 1.8 }}>NO POKÉMON YET —<br />WIN BATTLES TO CATCH THEM!</div>
                  </div>
                );
              }
              return (
                <div className="w-full" style={{ marginBottom: '1.25rem' }}>
                  <PokedexSectionHeader
                    label="★ CAUGHT"
                    count={searchTerm ? `${matchingCaughtList.length}/${caughtList.length}` : String(caughtList.length)}
                    accent="#FFD700"
                    expanded={isExpanded('caught')}
                    onToggle={() => togglePokedexSection('caught')}
                  />
                  <PokedexSectionContent expanded={isExpanded('caught')}>
                    <div>
                      {matchingCaughtList.length === 0 ? (
                        <div className="w-full rounded-lg text-center" style={{ padding: '1rem', background: 'rgba(0,0,0,0.35)', border: '1px dashed rgba(255,215,0,0.35)' }}>
                          <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', lineHeight: 1.8 }}>NO CAUGHT POKÉMON<br />MATCH THAT NAME</div>
                        </div>
                      ) : (
                        <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(84px, 26vw, 120px), 1fr))', gap: 'clamp(0.4rem,1.5vw,0.75rem)' }}>
                          {matchingCaughtList.map((b) => (
                            <button key={`caught-${b.id}`} onClick={() => game.viewEntry(b.dex)} className="rounded-lg flex flex-col items-center"
                              style={{ padding: 'clamp(0.35rem,1.5vw,0.6rem)', background: 'rgba(255,215,0,0.06)', border: '1px solid #FFD700', boxShadow: '0 0 8px rgba(255,215,0,0.15)', cursor: 'pointer' }}>
                              <img src={pixelSprite(b.dex)} alt={nameOf(b.dex)} loading="lazy"
                                onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(b.dex)) img.src = artwork(b.dex); }}
                                style={{ width: 'clamp(56px,18vw,88px)', height: 'clamp(56px,18vw,88px)', objectFit: 'contain', imageRendering: 'pixelated' }} />
                              <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#666', marginTop: 4 }}>#{b.dex}</span>
                              <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#FFD700', marginTop: 2, textAlign: 'center', lineHeight: 1.4 }}>{nameOf(b.dex)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </PokedexSectionContent>
                </div>
              );
            })()}

            {/* --- mega evolutions earned in arcade --- */}
            {(() => {
              const megaCount = Object.keys(save.megas).length;
              return (
                <div className="w-full" style={{ marginBottom: '1.25rem' }}>
                  <PokedexSectionHeader
                    label="⚡ MEGA EVOLUTIONS"
                    count={`${megaCount}/${MEGAS.length}`}
                    accent="#eab308"
                    expanded={isExpanded('megas')}
                    onToggle={() => togglePokedexSection('megas')}
                  />
                  <PokedexSectionContent expanded={isExpanded('megas')}>
                    <div>
                      {megaCount === 0 && (
                        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#777', lineHeight: 1.8, marginBottom: 10, textAlign: 'center' }}>
                          FINISH A 24-QUESTION ARCADE RUN<br />WITH A MEGA-CAPABLE POKÉMON TO EARN ONE!
                        </div>
                      )}
                      <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(84px, 26vw, 120px), 1fr))', gap: 'clamp(0.4rem,1.5vw,0.75rem)' }}>
                        {MEGAS.map((m) => {
                          const owned = Boolean(save.megas[m.dex]);
                          return (
                            <button key={`mega-${m.dex}`} disabled={!owned} onClick={() => owned && game.viewMega(m.dex)} className="rounded-lg flex flex-col items-center"
                              style={{ padding: 'clamp(0.35rem,1.5vw,0.6rem)', background: owned ? 'rgba(234,179,8,0.06)' : 'rgba(0,0,0,0.4)', border: `1px solid ${owned ? '#eab308' : '#2a2a2a'}`, boxShadow: owned ? '0 0 8px rgba(234,179,8,0.15)' : 'none', cursor: owned ? 'pointer' : 'default' }}>
                              <img src={artwork(m.formId)} alt={owned ? m.name : 'Unknown'} loading="lazy"
                                onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(m.dex)) img.src = artwork(m.dex); }}
                                style={{ width: 'clamp(56px,18vw,88px)', height: 'clamp(56px,18vw,88px)', objectFit: 'contain', filter: owned ? 'none' : 'brightness(0)' }} />
                              <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: owned ? '#eab308' : '#555', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>{owned ? m.name.toUpperCase() : '???'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </PokedexSectionContent>
                </div>
              );
            })()}

            {/* --- streak milestones --- */}
            {(() => {
              const best = save.streak?.best ?? 0;
              const earned = achievedMilestones(best).length;
              return (
                <div className="w-full" style={{ marginBottom: '1.25rem' }}>
                  <PokedexSectionHeader
                    label="🏅 STREAK MILESTONES"
                    count={`${earned}/${STREAK_MILESTONES.length}`}
                    accent="#f97316"
                    expanded={isExpanded('milestones')}
                    onToggle={() => togglePokedexSection('milestones')}
                  />
                  <PokedexSectionContent expanded={isExpanded('milestones')}>
                    <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(84px, 26vw, 120px), 1fr))', gap: 'clamp(0.4rem,1.5vw,0.75rem)' }}>
                      {STREAK_MILESTONES.map((m) => {
                        const got = best >= m.days;
                        return (
                          <div key={`ms-${m.days}`} className="rounded-lg flex flex-col items-center justify-center"
                            style={{ padding: 'clamp(0.5rem,2vw,0.8rem)', minHeight: 'clamp(84px,24vw,110px)', background: got ? `${m.color}14` : 'rgba(0,0,0,0.4)', border: `1px solid ${got ? m.color : '#2a2a2a'}`, boxShadow: got ? `0 0 8px ${m.color}33` : 'none' }}>
                            <span style={{ fontSize: 'clamp(1.4rem,6vw,2rem)', filter: got ? 'none' : 'grayscale(1) opacity(0.35)' }}>{got ? m.icon : '🔒'}</span>
                            <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: got ? m.color : '#555', marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>{m.days} DAY{m.days === 1 ? '' : 'S'}</span>
                            {got && <span style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#888', marginTop: 3, textAlign: 'center', lineHeight: 1.4 }}>{m.name.toUpperCase()}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </PokedexSectionContent>
                </div>
              );
            })()}

            <div className="w-full" style={{ marginBottom: '1.25rem' }}>
              <PokedexSectionHeader
                label="REGIONS"
                count={`${caughtCount(save)}/${totalCatchable()}`}
                accent="#94a3b8"
                expanded={isExpanded('regions')}
                onToggle={() => togglePokedexSection('regions')}
              />
              <PokedexSectionContent expanded={isExpanded('regions')}>
                <div className="flex flex-col w-full" style={{ gap: '0.65rem' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#64748b', textAlign: 'center', lineHeight: 1.7 }}>
                    TAP A REGION TO VIEW OR HIDE ITS POKÉMON
                  </div>
                  <div>
                    <label htmlFor="region-finder" style={{ display: 'block', fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', marginBottom: 6 }}>
                      QUICK JUMP TO A REGION
                    </label>
                    <div className="flex items-center" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid #94a3b866', borderRadius: '0.45rem', overflow: 'hidden' }}>
                      <select
                        id="region-finder"
                        value={regionFilter}
                        onChange={(event) => selectRegionFilter(event.target.value)}
                        aria-label="Quick jump to a Pokédex region"
                        className="w-full"
                        style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', background: 'transparent', border: 'none', outline: 'none', padding: '0.7rem', cursor: 'pointer', minWidth: 0 }}
                      >
                        <option value="" style={{ color: '#111827', background: '#e2e8f0' }}>ALL REGIONS</option>
                        {visibleRegions.map((region) => (
                          <option key={region.id} value={region.id} style={{ color: '#111827', background: '#e2e8f0' }}>
                            {region.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                      {regionFilter && (
                        <button
                          type="button"
                          onClick={() => selectRegionFilter('')}
                          aria-label="Show all Pokédex regions"
                          style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', background: 'rgba(148,163,184,0.12)', border: 'none', borderLeft: '1px solid #94a3b866', cursor: 'pointer', padding: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          ALL
                        </button>
                      )}
                    </div>
                  </div>
                  {filteredRegions.map((rg) => {
                    const owned = rg.battles.reduce((n, b) => n + (save.caught[b.dex] ? 1 : 0), 0);
                    const regionKey = `region-${rg.id}`;
                    return (
                      <div key={rg.id} className="w-full">
                        <PokedexSectionHeader
                          label={rg.name.toUpperCase()}
                          count={`${owned}/${rg.battles.length}`}
                          accent={rg.accentColor}
                          expanded={isExpanded(regionKey)}
                          onToggle={() => togglePokedexSection(regionKey)}
                          compact
                        />
                        <PokedexSectionContent expanded={isExpanded(regionKey)}>
                          <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(84px, 26vw, 120px), 1fr))', gap: 'clamp(0.4rem,1.5vw,0.75rem)' }}>
                            {rg.battles.map((b) => {
                              const isOwned = Boolean(save.caught[b.dex]);
                              return (
                                <button key={b.id} disabled={!isOwned} onClick={() => isOwned && game.viewEntry(b.dex)}
                                  className="rounded-lg flex flex-col items-center"
                                  style={{ padding: 'clamp(0.35rem,1.5vw,0.6rem)', background: 'rgba(0,0,0,0.4)', border: `1px solid ${isOwned ? rg.accentColor : '#2a2a2a'}`, cursor: isOwned ? 'pointer' : 'default' }}>
                                  <img src={pixelSprite(b.dex)} alt={isOwned ? nameOf(b.dex) : 'Unknown'} loading="lazy"
                                    onError={(e) => { const img = e.currentTarget; if (img.src !== artwork(b.dex)) img.src = artwork(b.dex); }}
                                    style={{ width: 'clamp(56px,18vw,88px)', height: 'clamp(56px,18vw,88px)', objectFit: 'contain', imageRendering: 'pixelated', filter: isOwned ? 'none' : 'brightness(0)' }} />
                                  <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#666', marginTop: 4 }}>#{b.dex}</span>
                                  <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: isOwned ? '#FFD700' : '#555', marginTop: 2, textAlign: 'center', lineHeight: 1.4 }}>{isOwned ? nameOf(b.dex) : '???'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </PokedexSectionContent>
                      </div>
                    );
                  })}
                </div>
              </PokedexSectionContent>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // MY STATS
  // =========================================================================
  if (state.screen === 'stats') {
    const st = save.stats;
    const total = st.correct + st.wrong;
    const accuracy = total > 0 ? Math.round((st.correct / total) * 100) : 0;
    const avgSec = total > 0 ? st.seconds / total : 0;
    const caught = caughtCount(save);
    const megas = Object.keys(save.megas).length;
    const fmtDur = (s: number) => {
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
      return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    };
    const Card = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) => (
      <div className="rounded-xl flex flex-col" style={{ padding: 'clamp(0.7rem,3vw,1.1rem)', background: `${color}12`, border: `2px solid ${color}55`, gap: 4 }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 'clamp(0.9rem,3.5vw,1.15rem)' }}>{icon}</span>{label}</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color, lineHeight: 1.3 }}>{value}</div>
        {sub && <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#777', lineHeight: 1.6 }}>{sub}</div>}
      </div>
    );
    // A little playful commentary based on how much they've done.
    const quips: string[] = [];
    if (st.seconds >= 60) quips.push('WHO SAID SCREEN TIME WAS BAD? 😎');
    if (st.correct >= 1) quips.push(`THAT'S ${st.correct.toLocaleString()} SUMS SOLVED — YOUR BRAIN IS BUFF! 💪`);
    if (accuracy >= 90 && total >= 20) quips.push('SHARPSHOOTER ACCURACY! 🎯');
    else if (accuracy >= 75 && total >= 20) quips.push('SOLID ACCURACY — KEEP GOING! ✨');
    if (caught >= 1) quips.push(`${caught} POKÉMON CAUGHT WITH PURE MATHS POWER! ⚡`);
    if (st.daysPlayed >= 3) quips.push(`${st.daysPlayed} DAYS OF PRACTICE — THAT'S DEDICATION! 📆`);
    if (quips.length === 0) quips.push('PLAY A BATTLE TO START YOUR STATS! ▶');
    return (
      <Screen bg={panelBg} scroll>
        <NavBar onHome={game.goMenu} title="MY STATS" accent="#FFD700" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem clamp(2rem,6vh,3rem)' }}>
          <Frame style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginBottom: '0.5rem', textAlign: 'center' }}>{activeProfile ? `${activeProfile.name.toUpperCase()}'S PROGRESS` : ''}</div>

            {/* Hero: total time */}
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1rem,4vw,1.5rem)', background: 'rgba(255,215,0,0.08)', border: '2px solid #FFD700', boxShadow: '0 0 24px rgba(255,215,0,0.18)', marginBottom: '1rem' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginBottom: 6 }}>⏱ TIME LEARNING</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.score, color: '#FFD700' }}>{fmtDur(st.seconds)}</div>
            </div>

            {/* Playful commentary */}
            <div className="w-full rounded-xl" style={{ padding: 'clamp(0.7rem,3vw,1rem)', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)', marginBottom: '1rem' }}>
              {quips.map((q, i) => (
                <div key={i} style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', lineHeight: 2, textAlign: 'center' }}>{q}</div>
              ))}
            </div>

            <div className="grid w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(130px,42vw,180px), 1fr))', gap: 'clamp(0.5rem,2vw,0.75rem)' }}>
              <Card icon="✅" label="CORRECT" value={st.correct.toLocaleString()} color="#22c55e" />
              <Card icon="❌" label="INCORRECT" value={st.wrong.toLocaleString()} color="#ef4444" />
              <Card icon="🎯" label="ACCURACY" value={`${accuracy}%`} sub={`${total.toLocaleString()} QUESTIONS ANSWERED`} color="#38bdf8" />
              <Card icon="⚡" label="AVG / QUESTION" value={`${avgSec.toFixed(1)}s`} color="#eab308" />
              <Card icon="📕" label="POKÉMON CAUGHT" value={`${caught}`} sub={`OF ${totalCatchable()}`} color="#FFD700" />
              <Card icon="⚡" label="MEGA EVOLUTIONS" value={`${megas}`} sub={`OF ${MEGAS.length}`} color="#eab308" />
              <Card icon="🗺" label="BATTLES WON" value={st.battlesWon.toLocaleString()} color="#22c55e" />
              <Card icon="🎮" label="ARCADE RUNS" value={st.arcadeRuns.toLocaleString()} color="#38bdf8" />
              <Card icon="🔑" label="TESTS PASSED" value={st.testsPassed.toLocaleString()} color="#a78bfa" />
              <Card icon="🔥" label="STREAK" value={`${liveStreak(save)}`} sub={`BEST ${save.streak?.best ?? 0} · ${st.daysPlayed} DAYS PLAYED`} color="#f97316" />
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // ABOUT
  // =========================================================================
  if (state.screen === 'about') {
    const Section = ({ title, children }: { title: string; children: ReactNode }) => (
      <div className="w-full rounded-xl" style={{ padding: 'clamp(0.75rem,3vw,1.25rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#FFD700', marginBottom: 8 }}>{title}</div>
        <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#cbd5e1', lineHeight: 2 }}>{children}</div>
      </div>
    );
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="ABOUT" accent="#a78bfa" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="flex flex-col gap-3 w-full">
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.title, color: '#FFD700', textAlign: 'center', textShadow: '0 0 14px rgba(255,215,0,0.5)', margin: '0.25rem 0 0.5rem' }}>POKÉMATHS</div>
              <Section title="WHAT IS IT?">
                A maths adventure! Answer questions to battle and catch Pokémon across 11 regions, from Kanto to Terarium.
              </Section>
              <Section title="JOURNEY">
                Travel region by region. Each battle is a maths topic — answer every question correctly (100%!) to catch that Pokémon into your Pokédex. Legendary bosses are timed. Clear all nine regions to unlock two secret regions.
              </Section>
              <Section title="ARCADE">
                Quick pick-up-and-play. Choose a level and race a fixed run of questions for score and accuracy — wrong answers are allowed, so it's great for practice.
              </Section>
              <Section title="🔥 DAILY STREAK">
                Play at least one battle or arcade run each day to build your streak. Reach 3, 7, 14, 30, 60, 100 and 365 days to earn milestone badges — see them in the Pokédex. Every 5 days you also earn a 🧊 streak freeze: if you miss a day, a freeze is spent automatically to keep your streak alive.
              </Section>
              <Section title="LEARNING">
                37 topics span the primary maths curriculum, from counting and number bonds up to fractions, decimals, percentages, and early algebra.
              </Section>
              <Section title="CREDITS">
                Made by Mushtaq Arcade Corp. © 2019–2026.<br />
                Pokémon sprites via PokeAPI. This is an unofficial fan-made educational game and is not affiliated with, endorsed by, or sponsored by Nintendo, Game Freak, or The Pokémon Company.
              </Section>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // SETTINGS (per-player, synced)
  // =========================================================================
  if (state.screen === 'settings') {
    const Toggle = ({ on, onClick, accent }: { on: boolean; onClick: (e: MouseEvent) => void; accent: string }) => (
      <button onClick={onClick} aria-pressed={on}
        style={{ width: 'clamp(52px,14vw,68px)', height: 'clamp(28px,7.5vw,36px)', borderRadius: 999, border: `2px solid ${on ? accent : '#555'}`, background: on ? accent : 'rgba(255,255,255,0.06)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
        <span style={{ position: 'absolute', top: '50%', left: on ? 'calc(100% - clamp(24px,6.5vw,30px))' : '3px', transform: 'translateY(-50%)', width: 'clamp(20px,5.5vw,26px)', height: 'clamp(20px,5.5vw,26px)', borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
      </button>
    );
    const Row = ({ title, desc, on, onToggle, accent }: { title: string; desc: string; on: boolean; onToggle: () => void; accent: string }) => (
      <div onClick={onToggle} role="button" className="w-full rounded-xl flex items-center gap-3" style={{ padding: 'clamp(0.75rem,3vw,1.1rem)', background: 'rgba(255,255,255,0.04)', border: `2px solid ${on ? accent : '#333'}`, cursor: 'pointer' }}>
        <div className="flex-1" style={{ minWidth: 0 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, lineHeight: 1.6, color: on ? accent : '#ccc' }}>{title}</div>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, lineHeight: 1.7, color: '#888', marginTop: 6 }}>{desc}</div>
        </div>
        <Toggle on={on} onClick={(e) => { e.stopPropagation(); onToggle(); }} accent={accent} />
      </div>
    );
    return (
      <Screen bg={panelBg} scroll>
        <NavBar onHome={game.goMenu} title="SETTINGS" accent="#a78bfa" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.8 }}>
              {activeProfile ? `${activeProfile.name.toUpperCase()}'S SETTINGS` : ''}{cloudUser ? ' · SYNCED' : ' · THIS DEVICE'}
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Row title="⚡ SPEED MODE" desc="No OK button — your answer is sent automatically as soon as you've typed enough digits." on={settings.speedMode} accent="#eab308" onToggle={() => setSetting({ speedMode: !settings.speedMode })} />
              <Row title="◑ BLACK & WHITE" desc="Show the whole game in monochrome." on={settings.blackWhite} accent="#94a3b8" onToggle={() => setSetting({ blackWhite: !settings.blackWhite })} />
            </div>

            {/* --- install to home screen (PWA) --- */}
            <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#94a3b8', margin: '1.75rem 0 0.75rem', textAlign: 'center' }}>📲 INSTALL AS AN APP</div>
            <div className="flex flex-col gap-3 w-full">
              <div className="w-full rounded-xl" style={{ padding: 'clamp(0.85rem,3.5vw,1.2rem)', background: 'rgba(255,255,255,0.04)', border: '2px solid #333' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#38bdf8', marginBottom: 10 }}>🍎 IPHONE &amp; IPAD</div>
                <ol style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', lineHeight: 2.1, listStyle: 'none', margin: 0, padding: 0 }}>
                  <li>1. OPEN THIS PAGE IN SAFARI</li>
                  <li>2. TAP THE SHARE BUTTON <span style={{ color: '#38bdf8' }}>⬆️</span></li>
                  <li>3. CHOOSE "ADD TO HOME SCREEN"</li>
                  <li>4. TAP "ADD" — DONE!</li>
                </ol>
              </div>
              <div className="w-full rounded-xl" style={{ padding: 'clamp(0.85rem,3.5vw,1.2rem)', background: 'rgba(255,255,255,0.04)', border: '2px solid #333' }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#22c55e', marginBottom: 10 }}>🤖 ANDROID</div>
                <ol style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', lineHeight: 2.1, listStyle: 'none', margin: 0, padding: 0 }}>
                  <li>1. OPEN THIS PAGE IN CHROME</li>
                  <li>2. TAP THE MENU <span style={{ color: '#22c55e' }}>⋮</span> (TOP-RIGHT)</li>
                  <li>3. TAP "ADD TO HOME SCREEN" / "INSTALL APP"</li>
                  <li>4. TAP "ADD" / "INSTALL" — DONE!</li>
                </ol>
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: '0.5rem', color: '#777', textAlign: 'center', lineHeight: 1.9 }}>IT ADDS A POKÉMATHS ICON THAT OPENS FULLSCREEN, JUST LIKE A REAL APP.</div>
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // LOGIN (Google sync — coming soon)
  // =========================================================================
  if (state.screen === 'login') {
    const signedIn = Boolean(cloudUser);
    return (
      <Screen bg={panelBg}>
        <NavBar onHome={game.goMenu} title="ACCOUNT" accent="#38bdf8" />
        <div className="flex-1 w-full flex flex-col items-center justify-center" style={{ padding: '1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1.25rem,5vw,2rem)', background: 'rgba(0,0,0,0.7)', border: '2px solid #38bdf8' }}>
              <div style={{ fontSize: 'clamp(2rem,9vw,3rem)', marginBottom: '0.5rem' }}>{signedIn ? '☁️' : '👤'}</div>
              {!firebaseReady() ? (
                <>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#38bdf8', marginBottom: '0.75rem' }}>CLOUD SYNC</div>
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#888', lineHeight: 2 }}>Not configured yet.<br />Your progress is saved on this device.</p>
                </>
              ) : signedIn ? (
                <>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#22c55e', marginBottom: '0.75rem' }}>SYNCED ✓</div>
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#cbd5e1', lineHeight: 2, marginBottom: '0.75rem' }}>
                    Signed in as<br /><span style={{ color: '#FFD700' }}>{cloudUser!.email ?? cloudUser!.displayName ?? 'your account'}</span>
                  </p>
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', lineHeight: 2, marginBottom: '1.25rem' }}>
                    Your {profilesData.profiles.length} profile{profilesData.profiles.length === 1 ? '' : 's'} sync to this account on every device.
                  </p>
                  <button onClick={() => signOutCloud()} className="w-full rounded-lg font-bold"
                    style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.9rem 0', background: 'transparent', color: '#ef4444', border: '2px solid #ef4444', cursor: 'pointer' }}>
                    SIGN OUT
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#38bdf8', marginBottom: '0.75rem' }}>SAVE ACROSS DEVICES</div>
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#cbd5e1', lineHeight: 2, marginBottom: '1.25rem' }}>
                    Sign in with Google to sync your profiles and Pokédex to every device.
                  </p>
                  <button onClick={() => signInGoogle()} className="w-full rounded-lg font-bold flex items-center justify-center gap-2"
                    style={{ fontFamily: PIXEL_FONT, fontSize: FS.btn, padding: '0.9rem 0', background: '#fff', color: '#1a1a1a', border: '2px solid #fff', cursor: 'pointer' }}>
                    <span style={{ color: '#4285F4' }}>G</span> SIGN IN WITH GOOGLE
                  </button>
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', lineHeight: 2, marginTop: '1rem' }}>
                    Free while in testing. Without an account, progress is saved on this device.
                  </p>
                </>
              )}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // POKÉDEX ENTRY (detail)
  // =========================================================================
  if (state.screen === 'pokedexEntry' && state.selectedDex != null) {
    const dex = state.selectedDex;
    const found = findBattleByDex(dex);
    const region = found?.region;
    const battle = found?.battle;
    const entry = save.caught[dex];
    const topicName = battle ? getTopic(battle.topic).name : '';
    const accent = region?.accentColor ?? '#FFD700';
    const TYPE_COLORS: Record<string, string> = {
      normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030', grass: '#78c850',
      ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0', ground: '#e0c068', flying: '#a890f0',
      psychic: '#f85888', bug: '#a8b820', rock: '#b8a038', ghost: '#705898', dragon: '#7038f8',
      dark: '#705848', steel: '#b8b8d0', fairy: '#ee99ac',
    };
    return (
      <Screen bg={region?.bgGradient ?? panelBg} scroll>
        <NavBar onHome={game.goMenu} onBack={game.goPokedex} title={`#${dex}`} accent={accent} />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1rem,4vw,1.75rem)', background: 'rgba(0,0,0,0.8)', border: `3px solid ${accent}`, boxShadow: `0 0 30px ${accent}33` }}>
              <div className="flex justify-center">
                <PokemonSprite src={artwork(dex)} name={nameOf(dex)} size={160} glow={accent} label={false} fallback={pixelSprite(dex)} />
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#FFD700', marginTop: 6, textShadow: '0 0 10px #FFD700' }}>{nameOf(dex).toUpperCase()}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginTop: 4 }}>#{dex} · {region?.name.toUpperCase()}</div>

              {/* Types (from PokeAPI) */}
              {entryDetail && entryDetail.types.length > 0 && (
                <div className="flex items-center justify-center gap-2" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                  {entryDetail.types.map((t) => (
                    <span key={t} style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#0a0a0a', background: TYPE_COLORS[t] ?? '#888', padding: '0.3rem 0.6rem', borderRadius: '0.4rem' }}>{t.toUpperCase()}</span>
                  ))}
                </div>
              )}
              {entryDetail?.genus && (
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#aaa', marginTop: 8 }}>{entryDetail.genus.toUpperCase()}</div>
              )}

              {/* How it was caught */}
              <div className="rounded-lg text-left" style={{ marginTop: 14, padding: 'clamp(0.6rem,2.5vw,1rem)', background: `${accent}14`, border: `1px solid ${accent}55` }}>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: accent, marginBottom: 8 }}>★ HOW YOU CAUGHT IT</div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#e2e8f0', lineHeight: 2 }}>
                  By mastering <span style={{ color: '#FFD700' }}>{topicName}</span>
                  {battle?.isBoss ? ' — as a timed legendary battle! ⏱' : '!'}
                </div>
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginTop: 8, lineHeight: 1.9 }}>
                  DIFFICULTY: LV {battle?.level}/{battle ? getTopic(battle.topic).maxLevel : ''}
                  {entry ? <><br />CAUGHT: {new Date(entry.caughtAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</> : null}
                </div>
              </div>

              {/* Flavour text */}
              {entryDetail === undefined && (
                <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#666', marginTop: 12 }}>LOADING INFO…</div>
              )}
              {entryDetail?.flavor && (
                <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#cbd5e1', lineHeight: 2, marginTop: 12 }}>{entryDetail.flavor}</p>
              )}

              {/* Share / save this Pokémon */}
              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button onClick={onShare} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '2px solid #22c55e', cursor: 'pointer' }}>📤 SHARE</button>
                <button onClick={onSave} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '2px solid #a78bfa', cursor: 'pointer' }}>💾 SAVE</button>
              </div>
              {shareMsg && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#FFD700', marginTop: 10 }}>{shareMsg}</div>}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // MEGA POKÉDEX ENTRY (detail)
  // =========================================================================
  if (state.screen === 'megaEntry' && state.selectedDex != null) {
    const m = getMega(state.selectedDex);
    const entry: MegaEntry | undefined = save.megas[state.selectedDex];
    if (!m || !entry) {
      // shouldn't happen, but fail safe back to the Pokédex
      return (
        <Screen bg={panelBg}>
          <NavBar onHome={game.goMenu} onBack={game.goPokedex} title="MEGA" accent="#eab308" />
        </Screen>
      );
    }
    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
    const earned = new Date(entry.caughtAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    return (
      <Screen bg="linear-gradient(135deg, #0a0a1a, #2a2308)" scroll>
        <NavBar onHome={game.goMenu} onBack={game.goPokedex} title={m.name.toUpperCase()} accent="#eab308" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center" style={{ padding: 'clamp(0.75rem,3vw,1.5rem) 1rem' }}>
          <Frame style={{ flexShrink: 0 }}>
            <div className="w-full rounded-2xl text-center" style={{ padding: 'clamp(1rem,4vw,1.75rem)', background: 'rgba(0,0,0,0.8)', border: '3px solid #eab308', boxShadow: '0 0 30px rgba(234,179,8,0.3)' }}>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, color: '#eab308', letterSpacing: 1, marginBottom: 8, textShadow: '0 0 10px #eab308' }}>⚡ MEGA EVOLUTION ⚡</div>
              <div className="flex justify-center">
                <img src={artwork(m.formId)} alt={m.name} onError={(e) => { const i = e.currentTarget; if (i.src !== artwork(m.dex)) i.src = artwork(m.dex); }}
                  style={{ width: 'clamp(150px,45vw,220px)', height: 'clamp(150px,45vw,220px)', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(234,179,8,0.55))' }} />
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.heading, color: '#fff', marginTop: 6 }}>{m.name.toUpperCase()}</div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888', marginTop: 4 }}>#{m.dex} · {nameOf(m.dex).toUpperCase()}</div>

              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <div className="flex-1 rounded-lg" style={{ padding: 'clamp(0.6rem,2vw,0.9rem)', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>⚡ FASTEST</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.body, color: '#eab308', marginTop: 5 }}>{entry.bestTime != null ? fmtTime(entry.bestTime) : '—'}</div>
                </div>
                <div className="flex-1 rounded-lg" style={{ padding: 'clamp(0.6rem,2vw,0.9rem)', background: 'rgba(255,255,255,0.04)', border: '1px solid #333' }}>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>📅 EARNED</div>
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.small, color: '#fff', marginTop: 5, lineHeight: 1.5 }}>{earned}</div>
                </div>
              </div>

              <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#94a3b8', lineHeight: 2, marginTop: 14 }}>
                Earned by completing any 24-question Arcade run with {nameOf(m.dex).toUpperCase()}. Accuracy is recorded, and your fastest time can still improve.
              </p>

              <div className="flex gap-2" style={{ marginTop: 16 }}>
                <button onClick={onShareMega} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '2px solid #22c55e', cursor: 'pointer' }}>📤 SHARE</button>
                <button onClick={onSaveMega} className="flex-1 rounded-lg font-bold" style={{ fontFamily: PIXEL_FONT, fontSize: FS.sub, padding: '0.7rem 0', color: '#a78bfa', background: 'rgba(167,139,250,0.08)', border: '2px solid #a78bfa', cursor: 'pointer' }}>💾 SAVE</button>
              </div>
              {megaMsg && <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#FFD700', marginTop: 10 }}>{megaMsg}</div>}
            </div>
          </Frame>
        </div>
      </Screen>
    );
  }

  // =========================================================================
  // PLAYING (journey + arcade)
  // =========================================================================
  if (state.screen === 'playing' && state.question) {
    const journey = state.mode === 'journey';
    const curriculum = state.mode === 'curriculum';
    const test = state.mode === 'test';
    const regionTest = state.mode === 'regionTest';
    const topicTest = state.mode === 'topicTest';
    const entryTest = regionTest || topicTest;
    const curriculumTestTopic = topicTest && state.curriculumTopicId ? getCurriculumTopic(state.curriculumTopicId) : undefined;
    const curriculumTestRegion = entryTest && state.curriculumRegionId ? getCurriculumRegion(state.curriculumRegionId) : undefined;
    const regionMode = journey || test || curriculum || entryTest;
    const b = curriculum ? game.activeCurriculumBattle : game.activeBattle;
    const region = game.activeRegion;
    const arcadeLevel = state.arcadeLevelId ? getArcadeLevel(state.arcadeLevelId) : null;
    const accent = entryTest ? curriculumTestRegion?.accentColor ?? '#FFD700' : curriculum ? (b?.isBoss ? '#FFD700' : '#38bdf8') : regionMode ? region?.accentColor ?? '#38bdf8' : arcadeLevel?.accentColor ?? '#38bdf8';
    const bg = entryTest ? curriculumTestRegion?.bgGradient ?? panelBg : curriculum ? panelBg : regionMode ? region?.bgGradient ?? panelBg : panelBg;
    const title = topicTest
      ? `READINESS TRIAL · T${String(curriculumTestTopic?.order ?? 0).padStart(2, '0')}`
      : regionTest
        ? `READINESS TRIAL · ${curriculumTestRegion?.name.toUpperCase() ?? 'REGION'}`
        : test
          ? `🔑 TEST · ${b ? nameOf(b.dex).toUpperCase() : ''}`
          : curriculum ? `${b?.isBoss ? '★ BOSS · ' : ''}${b ? nameOf(b.dex).toUpperCase() : 'CURRICULUM'}`
          : journey ? `${b?.isBoss ? '★ ' : ''}${b ? nameOf(b.dex).toUpperCase() : ''}` : arcadeLevel?.name.toUpperCase() ?? 'ARCADE';
    const doneCount = state.attempted;
    const curriculumBoss = curriculum && game.activeCurriculumBattle?.isBoss ? game.activeCurriculumBattle : null;
    const isCurriculumBoss = Boolean(curriculumBoss);
    const bossTarget = curriculumBoss ? bossMasteryTarget(curriculumBoss) : state.total;
    const bossRound = curriculumBoss ? bossRoundForQuestion(curriculumBoss, state.attempted + 1) : undefined;
    const finalMasteryQuestion = curriculumBoss ? bossIsFinalMasteryQuestion(curriculumBoss, state.attempted + 1) : false;
    const progressPct = Math.min((state.correctCount / state.total) * 100, 100);
    const onExit = topicTest && curriculumTestRegion
      ? () => game.openCurriculumRegion(curriculumTestRegion.id)
      : regionTest
        ? game.goCurriculumMap
        : curriculum && game.activeCurriculumTopic
          ? () => game.openCurriculumTopic(game.activeCurriculumTopic!.id)
          : regionMode && region
            ? () => game.openRegion(region.id)
            : game.goArcadeSelect;

    return (
      <Screen bg={bg}>
        <NavBar
          onHome={game.goMenu} onBack={onExit} title={title} accent={accent}
          right={
            <>
              {regionMode && state.timeRemaining !== null && (
                <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: state.timeRemaining <= 10 ? '#ef4444' : '#22c55e' }}>⏱{state.timeRemaining}</span>
              )}
              <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: '#22c55e' }}>{state.correctCount}✓</span>
              {state.wrong > 0 && <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: '#ef4444' }}>{state.wrong}✗</span>}
              <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.hud, color: '#FFD700' }}>{state.score.toLocaleString()}</span>
            </>
          }
        />
        <div className="flex-1 min-h-0 w-full flex items-stretch justify-center" style={{ padding: 'clamp(0.5rem,2vh,1.25rem) clamp(0.5rem,3vw,1rem)' }}>
          <div className="flex flex-col" style={{ width: FRAME, height: '100%', maxHeight: '46rem', gap: 'clamp(0.5rem, 2vh, 1rem)' }}>
            {/* Wild Pokémon (journey/test) / progress (arcade) */}
            {regionMode && (b || entryTest) ? (
              <div className="w-full flex items-center gap-3 shrink-0">
                {entryTest
                  ? <img src="/pokemaths/images/curriculum-crest.png" alt={topicTest ? 'Topic readiness trial' : 'Regional readiness trial'} style={{ width: 62, height: 62, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                  : b && <PokemonSprite src={pixelSprite(b.dex)} name={nameOf(b.dex)} size={72} glow={progressPct > 60 ? accent : undefined} fallback={artwork(b.dex)} label={false} />}
                <div className="flex-1">
                  <PowerBar correct={state.correctCount} total={state.total} accentColor={accent} />
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: state.wrong > 0 ? '#ef4444' : '#888', marginTop: 4 }}>
                    {topicTest
                      ? (state.wrong > 0 ? `MISSED ${state.wrong} · A TRIAL NEEDS 3/3!` : `SHOW YOU'RE READY · 3/3 TO UNLOCK THIS TOPIC!`)
                      : regionTest
                        ? (state.wrong > 0 ? `MISSED ${state.wrong} · A TRIAL NEEDS 3/3!` : `SHOW YOU'RE READY · 3/3 TO ENTER THIS REGION!`)
                        : test
                          ? (state.wrong > 0 ? `MISSED ${state.wrong} · NEED 3/3!` : `GET ${state.total}/${state.total} TO UNLOCK!`)
                          : isCurriculumBoss
                            ? `${bossRound?.label ?? 'MASTERY'} · ${state.correctCount}/${bossTarget} TARGET${finalMasteryQuestion ? ' · FINAL MUST BE RIGHT!' : ''}`
                            : (state.wrong > 0 ? `MISSED ${state.wrong} · NEED 100%!` : `${state.total - state.attempted} LEFT · STAY PERFECT!`)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full shrink-0"><PowerBar correct={state.attempted} total={state.total} accentColor={accent} /></div>
            )}

            {/* Question */}
            <div className="w-full rounded-xl text-center flex flex-col justify-center shrink-0" style={{ padding: 'clamp(1rem,4vh,2rem) 1rem', background: 'rgba(0,0,0,0.65)', border: `2px solid ${accent}`, boxShadow: `0 0 12px ${accent}22` }}>
              <div className="flex items-center justify-center gap-2" style={{ marginBottom: 8 }}>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: '#888' }}>{isCurriculumBoss && bossRound ? `${bossRound.label} · ` : ''}QUESTION {doneCount + 1} OF {state.total}</span>
                {state.maxLevel > 1 && (
                  <span style={{ fontFamily: PIXEL_FONT, fontSize: FS.tiny, color: accent }}>· LV {state.level}/{state.maxLevel}</span>
                )}
              </div>
              <div style={{ fontFamily: PIXEL_FONT, fontSize: FS.question, color: '#fff', letterSpacing: '0.04em', lineHeight: 1.5 }}>{state.question?.text ?? '...'}</div>
            </div>

            {/* Keypad — grows to fill remaining height */}
            <div className="flex-1 min-h-0">
              <NumberKeypad currentInput={input} accent={accent} onKey={appendKey} onToggleSign={toggleSign} onDelete={() => setInput(prev => prev.slice(0, -1))} onSubmit={handleSubmit} />
            </div>
          </div>
        </div>

        {/* Feedback overlay (fixed so keypad never shifts) */}
        {state.feedback && (
          <div style={{
            position: 'fixed', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999,
            fontFamily: PIXEL_FONT, fontSize: FS.body,
            background: state.feedbackCorrect ? 'rgba(0,20,0,0.92)' : 'rgba(20,0,0,0.92)',
            border: `2px solid ${state.feedbackCorrect ? '#22c55e' : '#ef4444'}`,
            color: state.feedbackCorrect ? '#22c55e' : '#ef4444',
            borderRadius: '0.75rem', padding: '0.75rem 1.5rem', textAlign: 'center', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>{state.feedback}</div>
        )}
      </Screen>
    );
  }

  // Fallback
  return (
    <Screen bg={panelBg}>
      <div className="flex-1 flex items-center justify-center">{backBtn('← MENU', game.goMenu, '#FFD700')}</div>
    </Screen>
  );
}
