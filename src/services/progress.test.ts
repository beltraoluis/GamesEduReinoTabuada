import { describe, expect, it } from 'vitest';
import { sanitizeProgress } from './progress';
import { DEFAULT_PROGRESS } from './gameData';

describe('sanitizeProgress', () => {
  it('returns defaults for non-objects', () => {
    expect(sanitizeProgress(null)).toEqual(DEFAULT_PROGRESS);
    expect(sanitizeProgress([])).toEqual(DEFAULT_PROGRESS);
  });

  it('clamps and filters hostile data', () => {
    const p = sanitizeProgress({
      playerName: '  ' + 'x'.repeat(50),
      stars: 1e12,
      gems: -5,
      highScoreRunner: 3.7,
      unlockedMascots: ['dino', 'evil', 'dino'],
      selectedMascot: 'sol',
      selectedHat: 'crown',
      unlockedAccessories: ['crown'],
      completedLevels: { a: 99, b: -1 },
      unlockedAchievements: ['nope'],
    });
    expect(p.playerName).toHaveLength(20);
    expect(p.stars).toBe(1_000_000);
    expect(p.gems).toBe(0);
    expect(p.highScoreRunner).toBe(3);
    expect(p.unlockedMascots).toEqual(['pip', 'lunna', 'dino']);
    expect(p.selectedMascot).toBe('pip');
    expect(p.selectedHat).toBe('crown');
    expect(p.completedLevels).toEqual({ a: 3, b: 0 });
    expect(p.unlockedAchievements).toEqual(['welcome']);
  });

  it('falls back on empty name', () => {
    expect(sanitizeProgress({ playerName: '   ' }).playerName).toBe(DEFAULT_PROGRESS.playerName);
  });
});
