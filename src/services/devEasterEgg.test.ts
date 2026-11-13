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
    for (const name of ['Ana', 'yodaa', 'yo da', 'Aventureiro(a)']) {
      const input = withName(name);
      expect(applyDevEasterEgg(input)).toBe(input);
    }
  });

  it('does nothing in production builds', () => {
    vi.stubEnv('DEV', false);
    const input = withName('yoda');
    expect(applyDevEasterEgg(input)).toBe(input);
  });
});
