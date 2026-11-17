import type { ChallengeMedal } from '../types/game';

// Kept separate from challengeEngine.ts so eager code (progress.ts) does not
// pull the generated challenge route table into the initial JS chunk.

/** wrong includes timeouts; timeouts is a subset, never a second deduction. */
export function computeChallengeMedal({ completed, wrong }: { completed: boolean; wrong: number }): ChallengeMedal {
  return completed && Number.isInteger(wrong) ? (wrong === 0 ? 'gold' : wrong === 1 ? 'silver' : wrong === 2 ? 'bronze' : 'none') : 'none';
}
