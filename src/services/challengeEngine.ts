import type { ChallengeResult } from '../types/game';
import {
  CHALLENGE_MAX_STREAK_BONUS,
  CHALLENGE_PHASES,
  CHALLENGE_SLOT_SKILL,
  CHALLENGE_SPEED_BONUS,
  CHALLENGE_STREAK_BONUS,
  CHALLENGE_TIME_LIMIT_SEC,
  CHALLENGE_TOTAL_QUESTIONS,
  CHALLENGE_LIVES,
  CHALLENGE_QUESTIONS_PER_PHASE,
} from './challengeConfig';
import { CHALLENGE_ROUTES } from './challengeRoutes';
import { computeChallengeMedal } from './challengeMedal';

export { computeChallengeMedal };

export interface ChallengeQuestion {
  id: string;
  phase: 1 | 2 | 3;
  indexInPhase: number;
  isBoss: boolean;
  kind: string;
  prompt: string;
  answer: number;
  timeLimitSec: number;
  explanation: string;
  speechText: string;
}

export interface ChallengeSummaryArgs {
  correct: number;
  wrong: number;
  timeouts: number;
  score: number;
  bestStreak: number;
  durationSec: number;
}

const finite = (n: number) => Number.isFinite(n) ? Math.max(0, n) : 0;

function totalSeconds(seconds: number): number {
  return Math.max(0, Math.ceil(Number.isFinite(seconds) ? seconds : 0));
}

export function formatChallengeTime(seconds: number): string {
  const roundedSeconds = totalSeconds(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = String(roundedSeconds % 60).padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export function formatChallengeTimeText(seconds: number): string {
  const roundedSeconds = totalSeconds(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;
  if (minutes === 0) {
    return `${remainder} ${remainder === 1 ? 'segundo restante' : 'segundos restantes'}`;
  }
  const minuteText = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  if (remainder === 0) return `${minuteText} ${minutes === 1 ? 'restante' : 'restantes'}`;
  const secondText = `${remainder} ${remainder === 1 ? 'segundo' : 'segundos'}`;
  return `${minuteText} e ${secondText} ${remainder === 1 ? 'restante' : 'restantes'}`;
}

export function parseChallengeAnswer(input: string): number | null {
  const value = input.trim();
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

export function isChallengeAnswerCorrect(q: ChallengeQuestion, input: string): boolean {
  return parseChallengeAnswer(input) === q.answer;
}

export function scoreChallengeAnswer({
  phase,
  elapsedSec,
  timeLimitSec,
  streakBefore,
}: {
  phase: 1 | 2 | 3;
  elapsedSec: number;
  timeLimitSec: number;
  streakBefore: number;
}): number {
  const speed = timeLimitSec > 0 ? Math.max(0, 1 - finite(elapsedSec) / timeLimitSec) : 0;
  return Math.round(100 * CHALLENGE_PHASES[phase - 1].multiplier * (1 + CHALLENGE_SPEED_BONUS * speed)
    + Math.min(CHALLENGE_MAX_STREAK_BONUS, Math.floor(finite(streakBefore)) * CHALLENGE_STREAK_BONUS));
}

/** wrong includes timeouts. Completion is derived from 24 answered and fewer than 3 mistakes. */
export function summarizeChallenge(args: ChallengeSummaryArgs): ChallengeResult {
  const correct = Math.min(CHALLENGE_TOTAL_QUESTIONS, Math.floor(finite(args.correct)));
  const wrong = Math.min(CHALLENGE_TOTAL_QUESTIONS - correct, Math.floor(finite(args.wrong)));
  const completed = correct + wrong === CHALLENGE_TOTAL_QUESTIONS && wrong < CHALLENGE_LIVES;
  return {
    correct,
    wrong,
    timeouts: Math.min(wrong, Math.floor(finite(args.timeouts))),
    score: Math.round(finite(args.score)),
    bestStreak: Math.min(correct, Math.floor(finite(args.bestStreak))),
    durationSec: finite(args.durationSec),
    completed,
    medal: computeChallengeMedal({ completed, wrong }),
  };
}

function explainProduct(a: number, b: number, skill: typeof CHALLENGE_SLOT_SKILL[number]): string {
  const answer = a * b;
  if (skill === 'R1' || skill === 'R2') {
    const repeatedAddition = Array.from({ length: a }, () => String(b)).join(' + ');
    return `${a} × ${b} = ${repeatedAddition} = ${answer}.`;
  }
  if (skill === 'R3') {
    const remainder = a - 5;
    return `${a} × ${b} = 5 × ${b} + ${remainder} × ${b} = ${5 * b} + ${remainder * b} = ${answer}.`;
  }
  if (skill === 'A1' && b === 10) {
    return `Multiplicar ${a} por 10 acrescenta um zero: ${a} × 10 = ${answer}.`;
  }
  if (skill === 'A1' && b === 11) {
    return `${a} × 11 = ${a} × 10 + ${a} = ${a * 10} + ${a} = ${answer}.`;
  }
  if (skill === 'A5') {
    return `Como ${a} é par, divida-o por 2 e dobre ${b}: ${a} × ${b} = ${a / 2} × ${b * 2} = ${answer}.`;
  }
  if (skill === 'R4' || skill === 'R4B') {
    const reducedFactor = b / 10;
    return `${a} × ${b} = ${a} × ${reducedFactor} × 10 = ${a * reducedFactor} × 10 = ${answer}.`;
  }

  const tens = Math.floor(b / 10) * 10;
  const units = b % 10;
  if (tens === 0) return `${a} × ${b} = ${a} × ${units} = ${answer}.`;
  if (units === 0) return `${a} × ${b} = ${a} × ${tens} = ${answer}.`;
  return `${a} × ${b} = ${a} × ${tens} + ${a} × ${units} = ${a * tens} + ${a * units} = ${answer}.`;
}

export function generateChallengeSession(rng: () => number = Math.random): ChallengeQuestion[] {
  const sample = rng();
  const normalized = Number.isFinite(sample) ? Math.min(0.999999999, Math.max(0, sample)) : 0;
  const routeIndex = Math.min(CHALLENGE_ROUTES.length - 1, Math.floor(normalized * CHALLENGE_ROUTES.length));
  const route = CHALLENGE_ROUTES[routeIndex];

  return route.map(([a, b], index) => {
    const phase = (Math.floor(index / CHALLENGE_QUESTIONS_PER_PHASE) + 1) as 1 | 2 | 3;
    const indexInPhase = index % CHALLENGE_QUESTIONS_PER_PHASE;
    const skill = CHALLENGE_SLOT_SKILL[index];
    return {
      id: `challenge-${phase}-${indexInPhase}`,
      phase,
      indexInPhase,
      isBoss: indexInPhase === CHALLENGE_QUESTIONS_PER_PHASE - 1,
      kind: 'product',
      prompt: `${a} × ${b} = ?`,
      answer: a * b,
      timeLimitSec: CHALLENGE_PHASES[phase - 1].timeLimitSec,
      explanation: explainProduct(a, b, skill),
      speechText: `${a} vezes ${b} é igual a quanto?`,
    };
  });
}
