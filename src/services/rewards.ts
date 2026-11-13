/** Shared gem economy. Accumulate fractional rewards, then finalize once per round. */
export const BASE_GEMS_PER_CORRECT_ANSWER = 9;
export const WRONG_ANSWER_GEM_PENALTY = 0.1;
// 5% keeps even a fast 60-second round around 25–40 gems; 20% exceeds that budget.
export const FREE_PLAY_WORLD_MULTIPLIER = 0.05;
/** A free-play session cannot bankroll the shop through an endless cauldron run. */
export const FREE_PLAY_SESSION_GEM_CAP = 60;
// The final realm mixes easy tables back in; 2.1 keeps its expected payout above realm four.
export const WORLD_GEM_MULTIPLIERS: Readonly<Record<string, number>> = {
  'world-1': 1, 'world-2': 1.25, 'world-3': 1.5, 'world-4': 1.75, 'world-5': 2.1,
};

const positiveFactor = (value: number): number => Number.isFinite(value) ? Math.min(10, Math.max(1, value)) : 1;
const tableWeight = (factor: number): number =>
  [1, 2, 5, 10].includes(factor) ? 0 : [3, 4].includes(factor) ? 0.35 : 0.7;

/** Symmetric difficulty: both table families and operand/product size matter (1..2.2 for 1..10). */
export function questionDifficulty(factorA: number, factorB: number): number {
  const a = positiveFactor(factorA);
  const b = positiveFactor(factorB);
  return 1 + (tableWeight(a) + tableWeight(b)) / 2
    + 0.25 * (Math.min(a, b) - 1) / 9 + 0.25 * (a * b - 1) / 99;
}

/** Full speed bonus through two seconds (or 40% of shorter limits), then linear decay. */
export function speedMultiplier(elapsedSec: number, timeLimitSec: number): number {
  const limit = Number.isFinite(timeLimitSec) && timeLimitSec > 0 ? timeLimitSec : 5;
  const fast = Math.min(2, limit * 0.4);
  const elapsed = Number.isFinite(elapsedSec) ? elapsedSec : limit;
  return 1 + 0.5 * Math.max(0, Math.min(1, (limit - elapsed) / (limit - fast)));
}

export interface CorrectAnswerReward {
  factorA: number;
  factorB: number;
  worldMultiplier: number;
  elapsedSec: number;
  timeLimitSec: number;
}

/** Returns a FLOAT: do not round individual answers. Wrong answers earn no reward. */
export function gemsForCorrectAnswer(input: CorrectAnswerReward): number {
  const world = Number.isFinite(input.worldMultiplier) ? Math.max(0, input.worldMultiplier) : 1;
  return BASE_GEMS_PER_CORRECT_ANSWER * questionDifficulty(input.factorA, input.factorB)
    * world * speedMultiplier(input.elapsedSec, input.timeLimitSec);
}

/** Balloons and cauldron share the formula without a realm bonus; pass their own time limit. */
export function gemsForFreePlayCorrectAnswer(input: Omit<CorrectAnswerReward, 'worldMultiplier'>): number {
  return gemsForCorrectAnswer({ ...input, worldMultiplier: FREE_PLAY_WORLD_MULTIPLIER });
}

/** Count wrong answers AND timeouts. Each removes 10% of the round's raw reward, additively. */
export function finalizeGems(rawGems: number, wrongAnswers: number): number {
  const raw = Number.isFinite(rawGems) ? Math.max(0, rawGems) : 0;
  const wrong = Number.isFinite(wrongAnswers) ? Math.max(0, wrongAnswers) : 0;
  return Math.floor(raw * Math.max(0, 1 - WRONG_ANSWER_GEM_PENALTY * wrong) + 1e-9);
}

/** Apply the same error penalty, then cap the final payout for each free-play session. */
export function finalizeFreePlayGems(rawGems: number, wrongAnswers: number): number {
  return Math.min(FREE_PLAY_SESSION_GEM_CAP, finalizeGems(rawGems, wrongAnswers));
}
