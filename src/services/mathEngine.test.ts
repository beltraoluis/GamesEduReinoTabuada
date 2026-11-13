import { describe, expect, it } from 'vitest';
import {
  ACCESSORY_HATS,
  ACHIEVEMENTS_LIST,
  DEFAULT_PROGRESS,
  MASCOT_LIST,
  WORLDS,
  generateQuestion,
} from './mathEngine';
import * as gameData from './gameData';

describe('generateQuestion', () => {
  it('always includes the correct result and produces 3 distinct positive options across 3000 runs over all tables', () => {
    const allTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    for (let i = 0; i < 3000; i++) {
      const q = generateQuestion(allTables);

      expect(q.result).toBe(q.factorA * q.factorB);
      expect(q.options).toHaveLength(3);
      expect(q.options).toContain(q.result);
      expect(new Set(q.options).size).toBe(3);

      for (const option of q.options) {
        expect(Number.isInteger(option)).toBe(true);
        expect(option).toBeGreaterThan(0);
      }

      expect(allTables).toContain(q.factorA);
      expect(q.factorB).toBeGreaterThanOrEqual(1);
      expect(q.factorB).toBeLessThanOrEqual(10);
    }
  });

  it('handles edge cases like table=1 and factorB=1 with 3 distinct positive options', () => {
    for (let i = 0; i < 500; i++) {
      const q = generateQuestion([1], 1);
      expect(q.factorA).toBe(1);
      expect(q.factorB).toBe(1);
      expect(q.result).toBe(1);
      expect(q.options).toHaveLength(3);
      expect(q.options).toContain(1);
      expect(new Set(q.options).size).toBe(3);
      for (const option of q.options) {
        expect(option).toBeGreaterThan(0);
      }
    }

    for (const table of [1, 2, 5, 9, 10]) {
      for (let i = 0; i < 200; i++) {
        const q = generateQuestion([table], 2);
        expect(q.options).toHaveLength(3);
        expect(q.options).toContain(q.result);
        expect(new Set(q.options).size).toBe(3);
        for (const option of q.options) {
          expect(option).toBeGreaterThan(0);
        }
      }
    }
  });

  it('avoids repeating the previous factor pair when other pairs exist', () => {
    let previous: { factorA: number; factorB: number } | undefined;

    for (let i = 0; i < 1000; i++) {
      const q = generateQuestion([2, 5], 10, previous);
      if (previous) {
        const isSamePair =
          q.factorA === previous.factorA && q.factorB === previous.factorB;
        expect(isSamePair).toBe(false);
      }
      previous = { factorA: q.factorA, factorB: q.factorB };
    }
  });

  it('still returns a valid question when only one factor pair exists and previous matches it', () => {
    const q = generateQuestion([1], 1, { factorA: 1, factorB: 1 });
    expect(q.factorA).toBe(1);
    expect(q.factorB).toBe(1);
    expect(q.result).toBe(1);
    expect(q.options).toHaveLength(3);
    expect(q.options).toContain(1);
    expect(new Set(q.options).size).toBe(3);
  });
});

describe('WORLDS configuration', () => {
  it('has requiredStars in strictly ascending order starting at 0 and valid tables in 1..10', () => {
    expect(WORLDS.length).toBeGreaterThan(0);
    expect(WORLDS[0].requiredStars).toBe(0);

    for (let i = 0; i < WORLDS.length; i++) {
      const world = WORLDS[i];
      expect(world.tables.length).toBeGreaterThan(0);
      expect(world.totalLevels).toBeGreaterThan(0);

      for (const table of world.tables) {
        expect(Number.isInteger(table)).toBe(true);
        expect(table).toBeGreaterThanOrEqual(1);
        expect(table).toBeLessThanOrEqual(10);
      }

      if (i > 0) {
        expect(world.requiredStars).toBeGreaterThan(WORLDS[i - 1].requiredStars);
      }
    }
  });
});

describe('gameData re-exports', () => {
  it('re-exports MASCOT_LIST, ACCESSORY_HATS, DEFAULT_PROGRESS, and ACHIEVEMENTS_LIST from mathEngine', () => {
    expect(MASCOT_LIST).toBe(gameData.MASCOT_LIST);
    expect(ACCESSORY_HATS).toBe(gameData.ACCESSORY_HATS);
    expect(DEFAULT_PROGRESS).toBe(gameData.DEFAULT_PROGRESS);
    expect(ACHIEVEMENTS_LIST).toBe(gameData.ACHIEVEMENTS_LIST);
  });
});
