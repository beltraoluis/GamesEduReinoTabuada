export const CHALLENGE_PRICE = 2000;
export const CHALLENGE_QUESTIONS_PER_PHASE = 8;
export const CHALLENGE_LIVES = 3;
export const CHALLENGE_TOTAL_QUESTIONS = 24;
export const CHALLENGE_NAME = 'Torre dos Mestres';
export const CHALLENGE_ICON = '🗼';
export const CHALLENGE_PHASES = [
  { id: 1, name: 'Extensão', icon: '🔢', timeLimitSec: 15, multiplier: 1 },
  { id: 2, name: 'Expressões', icon: '🧮', timeLimitSec: 25, multiplier: 1.5 },
  { id: 3, name: 'Mestres', icon: '👑', timeLimitSec: 35, multiplier: 2 },
] as const;
export const CHALLENGE_SPEED_BONUS = 0.5;
export const CHALLENGE_STREAK_BONUS = 10;
export const CHALLENGE_MAX_STREAK_BONUS = 100;

/** Select six after shuffling, then teach these strategies in increasing complexity. */
export const CHALLENGE_MASTER_KIND_ORDER = [
  'gcd', 'lcm', 'pattern_double', 'pattern_growing', 'pattern_squares', 'exact_division', 'missing_number',
] as const;
