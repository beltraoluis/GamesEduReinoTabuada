import { describe, expect, it } from 'vitest';
import { WORLDS } from './mathEngine';
import { ACCESSORY_HATS, MASCOT_LIST } from './gameData';
import { BASE_GEMS_PER_CORRECT_ANSWER, FREE_PLAY_WORLD_MULTIPLIER, FREE_PLAY_SESSION_GEM_CAP, finalizeFreePlayGems, WORLD_GEM_MULTIPLIERS, WRONG_ANSWER_GEM_PENALTY, finalizeGems, gemsForCorrectAnswer, gemsForFreePlayCorrectAnswer, questionDifficulty, speedMultiplier } from './rewards';

/** Exact uniform expectation, including floor AFTER summing the round.
 * Difficulty is rational in units of 1/3960, world bonuses in twentieths.
 * Convolution enumerates every possible sum without Monte Carlo sampling.
 */
function expectedPass(elapsedSec: number, wrong: number): number[] {
  return WORLDS.map(world => {
    const outcomes = world.tables.flatMap(a => Array.from({ length: 10 }, (_, i) =>
      Math.round(questionDifficulty(a, i + 1) * 3960 * WORLD_GEM_MULTIPLIERS[world.id] * 20)));
    let distribution = new Map([[0, 1]]);
    for (let correct = 0; correct < 7 - wrong; correct++) {
      const next = new Map<number, number>();
      for (const [sum, probability] of distribution) {
        for (const outcome of outcomes) next.set(sum + outcome, (next.get(sum + outcome) ?? 0) + probability / outcomes.length);
      }
      distribution = next;
    }
    let expected = 0;
    for (const [sum, probability] of distribution) {
      // Tiny epsilon only corrects floating representation of exact integer boundaries.
      expected += Math.floor(sum / 79200 * BASE_GEMS_PER_CORRECT_ANSWER * speedMultiplier(elapsedSec, 5)
        * (1 - WRONG_ANSWER_GEM_PENALTY * wrong) + 1e-9) * probability;
    }
    return expected;
  });
}

const typical = expectedPass(3, 1);
const perfect = expectedPass(1, 0);
const struggling = expectedPass(5, 2);
/** Model 2 stars per victory, no pre-existing stars, no free-play income.
 * Always replay the highest unlocked world; finish after the first world-5 victory.
 */
function expectedJourney() {
  let stars = 0;
  const runs: { worldId: string; starsBefore: number; gems: number }[] = [];
  while (true) {
    const index = WORLDS.reduce((best, world, i) => world.requiredStars <= stars ? i : best, 0);
    runs.push({ worldId: WORLDS[index].id, starsBefore: stars, gems: typical[index] });
    stars += 2;
    if (index === WORLDS.length - 1) break;
  }
  return runs;
}
const journey = expectedJourney();
const journeyTotal = journey.reduce((sum, run) => sum + run.gems, 0);
const top = Math.round(journeyTotal / 50) * 50;

/* Exact expected gems per seven-question realm (rounded here for readability):
 * Player                  world-1 world-2 world-3 world-4 world-5 total
 * Typical: 3s, 1 wrong      82.14  117.19  166.25  199.08  204.03  768.69
 * Perfect: <=2s, 0 wrong   120.01  171.14  242.68  290.56  297.78 1122.16
 * Struggling: 5s, 2 wrong   45.41   64.89   92.14  110.38  113.13  425.95
 * Journey at 2 stars/run: worlds 1,1,2,2,3,3,4,4,4,5; 10 runs total.
 * Realm subtotals: 164.27, 234.39, 332.50, 597.24, 204.03; total 1532.43.
 * TOP=1550; starting balance (10) and free-play gems are excluded.
 * Price table: pip/lunna/none=0; flower=80 (fixed); cap=170; wizard=190;
 * sunglasses=290; crown=390; dino=580; sol=970; estrela=1550.
 * Flower is now uniquely cheapest; the remaining order is preserved.
 */
describe('economy sizing', () => {
  it('documents exact round-floor expectations and proportional prices', () => {
    expect(typical.map(n => +n.toFixed(2))).toEqual([82.14, 117.19, 166.25, 199.08, 204.03]);
    expect(perfect.map(n => +n.toFixed(2))).toEqual([120.01, 171.14, 242.68, 290.56, 297.78]);
    expect(struggling.map(n => +n.toFixed(2))).toEqual([45.41, 64.89, 92.14, 110.38, 113.13]);
    expect(journey.map(run => run.worldId)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 4, 5].map(n => `world-${n}`));
    expect(journey.map(run => run.starsBefore)).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    expect(journeyTotal).toBeCloseTo(1532.43403422745, 8);
    expect(WORLDS.map(world => +journey.filter(run => run.worldId === world.id)
      .reduce((sum, run) => sum + run.gems, 0).toFixed(2))).toEqual([164.27, 234.39, 332.50, 597.24, 204.03]);
    expect(top).toBe(1550);
    for (const scenario of [typical, perfect, struggling]) {
      for (let i = 1; i < scenario.length; i++) expect(scenario[i]).toBeGreaterThan(scenario[i - 1]);
    }
    expect(MASCOT_LIST.find(m => m.id === 'estrela')?.cost).toBe(top);
    for (const [id, old] of Object.entries({ dino: 280, sol: 470, wizard: 90, crown: 190, cap: 80, sunglasses: 140 })) {
      const item = [...MASCOT_LIST, ...ACCESSORY_HATS].find(item => item.id === id);
      expect(item?.cost).toBe(Math.round(top * old / 750 / 10) * 10);
    }
    expect(ACCESSORY_HATS.find(h => h.id === 'flower')?.cost).toBe(80);
    expect([...MASCOT_LIST, ...ACCESSORY_HATS].filter(i => ['pip', 'lunna', 'none'].includes(i.id)).every(i => i.cost === 0)).toBe(true);
  });
});

describe('shared rewards', () => {
  it('is symmetric, finite, >=1 and rewards harder families and larger products', () => {
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) {
      expect(questionDifficulty(a, b)).toBe(questionDifficulty(b, a));
      expect(questionDifficulty(a, b)).toBeGreaterThanOrEqual(1);
    }
    expect(questionDifficulty(7, 8)).toBeGreaterThan(questionDifficulty(3, 4));
    expect(questionDifficulty(3, 4)).toBeGreaterThan(questionDifficulty(1, 2));
    expect(questionDifficulty(9, 9)).toBeGreaterThan(questionDifficulty(6, 6));
    expect(questionDifficulty(9, 9)).toBeGreaterThan(2);
  });
  it('clamps speed and declines linearly after the fast window', () => {
    expect(speedMultiplier(0, 5)).toBe(1.5);
    expect(speedMultiplier(2, 5)).toBe(1.5);
    expect(speedMultiplier(3, 5)).toBeCloseTo(4 / 3);
    expect(speedMultiplier(5, 5)).toBe(1);
    expect(speedMultiplier(50, 5)).toBe(1);
    expect(speedMultiplier(-1, 5)).toBe(1.5);
    expect(speedMultiplier(0, 1)).toBe(1.5);
    expect(speedMultiplier(1, 1)).toBe(1);
  });
  it('keeps fractional answers and increases with world and speed', () => {
    const input = { factorA: 7, factorB: 8, worldMultiplier: 1, elapsedSec: 3, timeLimitSec: 5 };
    const base = gemsForCorrectAnswer(input);
    expect(Number.isInteger(base)).toBe(false);
    expect(gemsForCorrectAnswer({ ...input, elapsedSec: 1 })).toBeGreaterThan(base);
    expect(gemsForCorrectAnswer({ ...input, worldMultiplier: 2 })).toBe(base * 2);
    expect(gemsForFreePlayCorrectAnswer(input)).toBeCloseTo(base * FREE_PLAY_WORLD_MULTIPLIER);
    expect(FREE_PLAY_WORLD_MULTIPLIER).toBe(0.05);
    expect(WORLDS.map(w => WORLD_GEM_MULTIPLIERS[w.id])).toEqual([1, 1.25, 1.5, 1.75, 2.1]);
  });
  it.each([[0, 100], [1, 90], [2, 80], [3, 70], [10, 0], [20, 0]])('applies %i errors/timeouts additively', (wrong, expected) => {
    expect(finalizeGems(100, wrong)).toBe(expected);
  });
  it('floors once, never goes negative, and handles invalid inputs safely', () => {
    expect(finalizeGems(10.9, 1)).toBe(9);
    expect(finalizeGems(0.6 + 0.6, 0)).toBe(1);
    expect(finalizeGems(-1, 1)).toBe(0);
    expect(finalizeGems(10, -1)).toBe(10);
    expect(finalizeGems(NaN, 0)).toBe(0);
    expect(speedMultiplier(NaN, 0)).toBe(1);
    expect(Number.isFinite(questionDifficulty(NaN, Infinity))).toBe(true);
  });
});

/** Uniform mean reward over every allowed (table, factor) pair, before round flooring. */
function meanFreePlayReward(tables: number[], elapsedSec: number, timeLimitSec: number): number {
  return tables.reduce((sum, a) => sum + Array.from({ length: 10 }, (_, i) =>
    gemsForFreePlayCorrectAnswer({ factorA: a, factorB: i + 1, elapsedSec, timeLimitSec })
  ).reduce((a, b) => a + b, 0), 0) / (tables.length * 10);
}

/* Per-minute economy table, no free-play errors (optimistic earnings ceiling).
 * Expected raw reward is enumerated uniformly; floor(mean round reward) is shown
 * for free play, within one gem of E[floor(round reward)] before caps.
 * Runner typical, realms 1..5 at 120s/run: 41.07, 58.60, 83.13, 99.54, 102.02 gems/min.
 * Runner typical journey: 3s responses, 1 wrong/run, 120s/run: 76.62 gems/min.
 * Balloons default tables [2,3,4,5], 3s responses, 6s limit: 16 gems/min.
 * Balloons strong, same tables, 1.5s responses: 36 gems/min.
 * Balloons strong, ALL tables, 1.5s responses: 40 gems/min.
 * Cauldron tables [2..8], 3s responses, 8s limit: 19 gems/min ignoring feedback.
 * Cauldron strong, 2s responses: 30 gems/min ignoring feedback; 16 with 1.6s feedback.
 * A 120s runner assumption is conservative: faster runs increase its advantage.
 */
describe('free-play economy limits', () => {
  it('keeps strong free-play minutes below the typical runner journey rate', () => {
    const runnerPerMinute = journeyTotal / (journey.length * 2);
    const balloons = [2, 3, 4, 5];
    const cauldron = [2, 3, 4, 5, 6, 7, 8];
    const minute = (tables: number[], response: number, limit: number, feedback = 0) =>
      finalizeFreePlayGems(meanFreePlayReward(tables, response, limit) * Math.floor(60 / (response + feedback)), 0);
    const table = {
      balloonsTypical: minute(balloons, 3, 6),
      balloonsStrong: minute(balloons, 1.5, 6),
      balloonsStrongAllTables: minute([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1.5, 6),
      cauldronTypical: minute(cauldron, 3, 8),
      cauldronStrong: minute(cauldron, 2, 8),
      cauldronStrongWithFeedback: minute(cauldron, 2, 8, 1.6),
    };
    expect(runnerPerMinute).toBeCloseTo(76.6217, 4);
    expect(typical.map(gems => +(gems / 2).toFixed(2))).toEqual([41.07, 58.60, 83.13, 99.54, 102.02]);
    expect(table).toEqual({ balloonsTypical: 16, balloonsStrong: 36, balloonsStrongAllTables: 40,
      cauldronTypical: 19, cauldronStrong: 30, cauldronStrongWithFeedback: 16 });
    for (const rate of Object.values(table)) {
      expect(rate).toBeLessThan(runnerPerMinute);
      expect(rate).toBeLessThan(Math.min(...typical) / 2);
    }
    expect(table.balloonsStrong).toBeGreaterThanOrEqual(25);
    expect(table.balloonsStrong).toBeLessThanOrEqual(40);
    expect(table.cauldronStrong).toBeGreaterThanOrEqual(25);
    expect(table.cauldronStrong).toBeLessThanOrEqual(40);
  });

  it('caps final payouts, applies penalties first, and never modifies runner rewards', () => {
    expect(FREE_PLAY_SESSION_GEM_CAP).toBe(60);
    expect(finalizeFreePlayGems(1000, 0)).toBe(60);
    expect(finalizeFreePlayGems(1000, 9)).toBe(60);
    expect(finalizeFreePlayGems(1000, 10)).toBe(0);
    expect(finalizeFreePlayGems(65, 1)).toBe(58);
    expect(finalizeFreePlayGems(31.9, 0)).toBe(31);
    expect(finalizeFreePlayGems(-10, 1)).toBe(0);
    expect(finalizeFreePlayGems(NaN, 0)).toBe(0);
    expect(finalizeGems(1000, 0)).toBe(1000);
  });
});

describe('reward input and floating point hardening', () => {
  it('clamps factors to 1..10 instead of rewarding huge or negative operands', () => {
    expect(questionDifficulty(-9, 5)).toBe(questionDifficulty(1, 5));
    expect(questionDifficulty(0, 5)).toBe(questionDifficulty(1, 5));
    expect(questionDifficulty(1e20, 8)).toBe(questionDifficulty(10, 8));
    expect(questionDifficulty(8, 1e20)).toBe(questionDifficulty(8, 10));
    expect(questionDifficulty(NaN, 8)).toBe(questionDifficulty(1, 8));
  });

  it('repairs sub-epsilon integer boundary drift without rounding real fractions up', () => {
    expect(finalizeGems(99.9999999995, 0)).toBe(100);
    expect(finalizeGems(99.99999999, 0)).toBe(99);
    expect(finalizeGems(100 / 0.9 - 5e-10, 1)).toBe(100);
    expect(finalizeGems(99.99, 0)).toBe(99);
    expect(finalizeFreePlayGems(29.9999999995, 0)).toBe(30);
  });
});
