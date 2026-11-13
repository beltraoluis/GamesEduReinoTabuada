import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyDevEasterEgg } from './devEasterEgg';
import { ACCESSORY_HATS, DEFAULT_PROGRESS, MASCOT_LIST } from './gameData';

const withName = (playerName: string) => ({ ...DEFAULT_PROGRESS, playerName });

describe('applyDevEasterEgg', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('unlocks every mascot and hat for "yoda" in development (any case, trimmed)', () => {
    for (const name of ['yoda', 'Yoda', 'YODA', '  yoda ']) {
      const result = applyDevEasterEgg(withName(name));
      expect(result.unlockedMascots).toEqual(MASCOT_LIST.map((m) => m.id));
      expect(result.unlockedAccessories).toEqual(ACCESSORY_HATS.map((h) => h.id));
    }
  });

  it('does nothing for other names', () => {
    for (const name of ['Ana', 'yodaa', 'yo da', 'resett', 're set', 'Aventureiro(a)']) {
      const input = withName(name);
      expect(applyDevEasterEgg(input)).toBe(input);
    }
  });

  it('does nothing in production builds', () => {
    vi.stubEnv('DEV', false);
    const input = withName('yoda');
    expect(applyDevEasterEgg(input)).toBe(input);
  });

  describe('reset', () => {
    const played = {
      ...DEFAULT_PROGRESS,
      playerName: 'reset',
      stars: 12,
      gems: 99,
      highScoreRunner: 500,
      highScoreBalloons: 300,
      highScoreCauldron: 200,
      selectedMascot: 'dino',
      selectedHat: 'crown',
      unlockedMascots: ['pip', 'lunna', 'dino'],
      unlockedAccessories: ['none', 'crown'],
      completedLevels: { 'world-1_0': 3 },
      unlockedAchievements: ['welcome', 'first_win'],
    };

    it('restores the original state, including the default name, for "reset" in development', () => {
      for (const name of ['reset', 'Reset', 'RESET', '  reset ']) {
        expect(applyDevEasterEgg({ ...played, playerName: name })).toEqual(DEFAULT_PROGRESS);
      }
    });

    it('returns a fresh copy that cannot mutate the shared defaults', () => {
      const result = applyDevEasterEgg(played);
      expect(result).not.toBe(DEFAULT_PROGRESS);
      result.unlockedMascots.push('dino');
      result.completedLevels['x'] = 1;
      expect(DEFAULT_PROGRESS.unlockedMascots).toEqual(['pip', 'lunna']);
      expect(DEFAULT_PROGRESS.completedLevels).toEqual({});
    });

    it('also undoes the yoda unlock', () => {
      const unlocked = applyDevEasterEgg({ ...DEFAULT_PROGRESS, playerName: 'yoda' });
      expect(applyDevEasterEgg({ ...unlocked, playerName: 'reset' })).toEqual(DEFAULT_PROGRESS);
    });

    it('does nothing in production builds', () => {
      vi.stubEnv('DEV', false);
      expect(applyDevEasterEgg(played)).toBe(played);
    });
  });
});
