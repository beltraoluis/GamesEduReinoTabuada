import type { PlayerProgress } from '../types/game';
import { ACCESSORY_HATS, ACHIEVEMENTS_LIST, DEFAULT_PROGRESS, MASCOT_LIST } from './gameData';

export const MAX_NAME_LENGTH = 20;
const MAX_NUMBER = 1_000_000;
const MAX_ARRAY_LENGTH = 100;
const MAX_LEVEL_ENTRIES = 500;

export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_PROGRESS.playerName;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH).trim();
  return cleaned || DEFAULT_PROGRESS.playerName;
}

const clampInt = (v: unknown, fallback: number): number => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(MAX_NUMBER, Math.max(0, Math.trunc(v)));
};

const filterIds = (v: unknown, known: string[], defaults: string[]): string[] => {
  const out = new Set<string>(defaults);
  if (Array.isArray(v)) {
    for (const x of v) {
      if (out.size >= MAX_ARRAY_LENGTH) break;
      if (typeof x === 'string' && known.includes(x)) out.add(x);
    }
  }
  return [...out];
};

// Validate and clamp saved data; anything unknown or out of range falls back to defaults.
export function sanitizeProgress(raw: unknown): PlayerProgress {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return DEFAULT_PROGRESS;
  const d = raw as Record<string, unknown>;

  const unlockedMascots = filterIds(d.unlockedMascots, MASCOT_LIST.map((m) => m.id), DEFAULT_PROGRESS.unlockedMascots);
  const unlockedAccessories = filterIds(d.unlockedAccessories, ACCESSORY_HATS.map((h) => h.id), DEFAULT_PROGRESS.unlockedAccessories);
  const unlockedAchievements = filterIds(d.unlockedAchievements, ACHIEVEMENTS_LIST.map((a) => a.id), DEFAULT_PROGRESS.unlockedAchievements);

  const completedLevels: Record<string, number> = {};
  if (typeof d.completedLevels === 'object' && d.completedLevels !== null && !Array.isArray(d.completedLevels)) {
    for (const [k, v] of Object.entries(d.completedLevels).slice(0, MAX_LEVEL_ENTRIES)) {
      if (k === '__proto__' || k.length > 64 || typeof v !== 'number' || !Number.isFinite(v)) continue;
      completedLevels[k] = Math.min(3, Math.max(0, Math.trunc(v)));
    }
  }

  const selectedMascot =
    typeof d.selectedMascot === 'string' && unlockedMascots.includes(d.selectedMascot)
      ? d.selectedMascot
      : DEFAULT_PROGRESS.selectedMascot;
  const selectedHat =
    typeof d.selectedHat === 'string' && unlockedAccessories.includes(d.selectedHat)
      ? d.selectedHat
      : DEFAULT_PROGRESS.selectedHat;

  return {
    playerName: sanitizeName(d.playerName),
    stars: clampInt(d.stars, DEFAULT_PROGRESS.stars),
    gems: clampInt(d.gems, DEFAULT_PROGRESS.gems),
    highScoreRunner: clampInt(d.highScoreRunner, 0),
    highScoreBalloons: clampInt(d.highScoreBalloons, 0),
    highScoreCauldron: clampInt(d.highScoreCauldron, 0),
    selectedMascot,
    selectedHat,
    unlockedMascots,
    unlockedAccessories,
    completedLevels,
    unlockedAchievements,
  };
}
