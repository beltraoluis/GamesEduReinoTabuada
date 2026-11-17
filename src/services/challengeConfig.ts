export const CHALLENGE_PRICE = 5000;
export const CHALLENGE_TIME_LIMIT_SEC = 180;
export const CHALLENGE_QUESTIONS_PER_PHASE = 8;
export const CHALLENGE_LIVES = 3;
export const CHALLENGE_TOTAL_QUESTIONS = 24;
export const CHALLENGE_NAME = 'Torre dos Mestres';
export const CHALLENGE_ICON = '🗼';
export const CHALLENGE_PHASES = [
  { id: 1, name: 'Fatos Mágicos', icon: '🔢', timeLimitSec: 60, multiplier: 1 },
  { id: 2, name: 'Vezes um Algarismo', icon: '✖️', timeLimitSec: 120, multiplier: 1.5 },
  { id: 3, name: 'Mestres', icon: '👑', timeLimitSec: CHALLENGE_TIME_LIMIT_SEC, multiplier: 2 },
] as const;
export const CHALLENGE_SPEED_BONUS = 0.5;
export const CHALLENGE_STREAK_BONUS = 10;
export const CHALLENGE_MAX_STREAK_BONUS = 100;

export const CHALLENGE_SLOT_SKILL = [
  'R1', 'R1', 'R2', 'A1', 'R3', 'R3', 'R4', 'R4B',
  'R5', 'A5', 'R6', 'R6', 'R7', 'R7', 'R7', 'R7B',
  'R9', 'R10', 'R10', 'R11', 'R11', 'R11', 'R12', 'R12B',
] as const;
