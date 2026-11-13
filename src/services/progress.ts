import { CHALLENGE_PRICE, CHALLENGE_TOTAL_QUESTIONS, CHALLENGE_LIVES } from './challengeConfig';
import { computeChallengeMedal } from './challengeEngine';
import { containsProfanity } from './profanity';
import { WORLDS } from './mathEngine';
import type { MascotSkin, PlayerProgress, ChallengeMedal, ChallengeResult } from '../types/game';
import { ACCESSORY_HATS, ACHIEVEMENTS_LIST, DEFAULT_PROGRESS, MASCOT_LIST } from './gameData';

export const MAX_NAME_LENGTH = 20;
const MAX_NUMBER = 1_000_000;
const MAX_ARRAY_LENGTH = 100;
const MAX_LEVEL_ENTRIES = 500;

export function sanitizeName(raw: unknown): string {
  if (typeof raw !== 'string') return DEFAULT_PROGRESS.playerName;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH).trim();
  return cleaned && !containsProfanity(cleaned) ? cleaned : DEFAULT_PROGRESS.playerName;
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

const LEGACY_ACCESSORY_ID_MAP: Record<string, string> = {
  headphones: 'sunglasses',
};

const migrateAccessoryId = (id: unknown): unknown =>
  typeof id === 'string' ? (LEGACY_ACCESSORY_ID_MAP[id] ?? id) : id;

// Validate and clamp saved data; anything unknown or out of range falls back to defaults.
export function sanitizeProgress(raw: unknown): PlayerProgress {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return DEFAULT_PROGRESS;
  const d = raw as Record<string, unknown>;

  const unlockedMascots = filterIds(d.unlockedMascots, MASCOT_LIST.map((m) => m.id), DEFAULT_PROGRESS.unlockedMascots);
  const rawAccessories = Array.isArray(d.unlockedAccessories)
    ? d.unlockedAccessories.map(migrateAccessoryId)
    : d.unlockedAccessories;
  const unlockedAccessories = filterIds(rawAccessories, ACCESSORY_HATS.map((h) => h.id), DEFAULT_PROGRESS.unlockedAccessories);
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
  const migratedHat = migrateAccessoryId(d.selectedHat);
  const selectedHat =
    typeof migratedHat === 'string' && unlockedAccessories.includes(migratedHat)
      ? migratedHat
      : DEFAULT_PROGRESS.selectedHat;

  const savedChallenge = typeof d.challenge === 'object' && d.challenge !== null && !Array.isArray(d.challenge)
    ? d.challenge as Record<string, unknown> : {};
  const medals: ChallengeMedal[] = ['none', 'bronze', 'silver', 'gold'];
  return {
    challenge: {
      unlocked: typeof savedChallenge.unlocked === 'boolean' ? savedChallenge.unlocked : false,
      attempts: clampInt(savedChallenge.attempts, 0),
      bestScore: clampInt(savedChallenge.bestScore, 0),
      bestStreak: Math.min(CHALLENGE_TOTAL_QUESTIONS, clampInt(savedChallenge.bestStreak, 0)),
      bestMedal: medals.includes(savedChallenge.bestMedal as ChallengeMedal) ? savedChallenge.bestMedal as ChallengeMedal : 'none',
    },
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

/** Only canonical runner world ids count; legacy level ids cannot bypass the gate. */
export function allWorldsCompleted(progress: Pick<PlayerProgress, 'completedLevels'>): boolean {
  return WORLDS.every(({ id }) => Object.hasOwn(progress.completedLevels, id)
    && Number.isFinite(progress.completedLevels[id]) && progress.completedLevels[id] >= 1);
}

export function meetsUnlockRequirement(item: Pick<MascotSkin, 'requiresAllWorlds'>, progress: Pick<PlayerProgress, 'completedLevels'>): boolean {
  return !item.requiresAllWorlds || allWorldsCompleted(progress);
}

/** A victory records one realm, retaining the best valid star count across replays. */
export function recordWorldCompletion(progress: PlayerProgress, worldId: string, starsEarned: number): PlayerProgress {
  if (!WORLDS.some(({ id }) => id === worldId) || !Number.isFinite(starsEarned) || starsEarned < 1) return progress;
  return { ...progress, completedLevels: { ...progress.completedLevels,
    [worldId]: Math.max(Math.min(3, Math.max(0, progress.completedLevels[worldId] || 0)), Math.min(3, Math.trunc(starsEarned))) } };
}

/** Canonical price and gate checks also protect callers that bypass wardrobe UI. */
export function unlockMascot(progress: PlayerProgress, mascotId: string, cost: number): PlayerProgress {
  const item = MASCOT_LIST.find(({ id }) => id === mascotId);
  if (!item || cost !== item.cost || progress.gems < item.cost || progress.unlockedMascots.includes(mascotId)
    || !meetsUnlockRequirement(item, progress)) return progress;
  return { ...progress, gems: progress.gems - item.cost,
    unlockedMascots: [...progress.unlockedMascots, mascotId], selectedMascot: mascotId };
}

/** Accessories use the same canonical price and realm gate as mascot purchases. */
export function unlockAccessory(progress: PlayerProgress, hatId: string, cost: number): PlayerProgress {
  const item = ACCESSORY_HATS.find(({ id }) => id === hatId);
  if (!item || cost !== item.cost || progress.gems < item.cost || progress.unlockedAccessories.includes(hatId)
    || !meetsUnlockRequirement(item, progress)) return progress;
  return { ...progress, gems: progress.gems - item.cost,
    unlockedAccessories: [...progress.unlockedAccessories, hatId], selectedHat: hatId };
}

export function isChallengeAvailable(progress: PlayerProgress): boolean { return allWorldsCompleted(progress); }
export function canBuyChallenge(progress: PlayerProgress): boolean {
  return isChallengeAvailable(progress) && !progress.challenge.unlocked && progress.gems >= CHALLENGE_PRICE;
}
export function purchaseChallenge(progress: PlayerProgress): PlayerProgress {
  return canBuyChallenge(progress) ? { ...progress, gems: progress.gems - CHALLENGE_PRICE,
    challenge: { ...progress.challenge, unlocked: true } } : progress;
}
export function recordChallengeResult(progress: PlayerProgress, result: ChallengeResult): PlayerProgress {
  if (!progress.challenge.unlocked) return progress;
  const medals: ChallengeMedal[] = ['none', 'bronze', 'silver', 'gold'];
  const completed = result.completed && result.correct + result.wrong === CHALLENGE_TOTAL_QUESTIONS && result.wrong < CHALLENGE_LIVES;
  const medal = computeChallengeMedal({ completed, wrong: result.wrong });
  return { ...progress, challenge: { ...progress.challenge,
    attempts: clampInt(progress.challenge.attempts + 1, 0),
    bestScore: Math.max(progress.challenge.bestScore, clampInt(result.score, 0)),
    bestStreak: Math.max(progress.challenge.bestStreak, Math.min(CHALLENGE_TOTAL_QUESTIONS, clampInt(result.bestStreak, 0))),
    bestMedal: medals[Math.max(medals.indexOf(progress.challenge.bestMedal), medals.indexOf(medal))],
  } };
}
export function challengeTitleForMedal(medal: ChallengeMedal): string | null {
  return ({ none: null, bronze: 'Escalador da Torre', silver: 'Guardião da Torre', gold: 'Mestre da Torre' })[medal] ?? null;
}
export function bestChallengeTitle(progress: PlayerProgress): string | null { return challengeTitleForMedal(progress.challenge.bestMedal); }
