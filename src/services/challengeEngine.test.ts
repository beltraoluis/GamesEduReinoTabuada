import { describe, expect, it } from 'vitest';
import { CHALLENGE_ROUTES } from './challengeRoutes';
import { CHALLENGE_PHASES, CHALLENGE_TIME_LIMIT_SEC } from './challengeConfig';
import {
  computeChallengeMedal,
  formatChallengeTime,
  formatChallengeTimeText,
  generateChallengeSession,
  isChallengeAnswerCorrect,
  parseChallengeAnswer,
  scoreChallengeAnswer,
  summarizeChallenge,
} from './challengeEngine';

const NON_TRIVIAL = new Set([3, 4, 6, 7, 8, 9]);
const HARD_FACTS = new Set([6, 7, 8, 9]);
const R12B_UNITS = new Set([3, 4, 6, 7, 8]);
const SKILLS = [
  'R1', 'R1', 'R2', 'A1', 'R3', 'R3', 'R4', 'R4B',
  'R5', 'A5', 'R6', 'R6', 'R7', 'R7', 'R7', 'R7B',
  'R9', 'R10', 'R10', 'R11', 'R11', 'R11', 'R12', 'R12B',
] as const;

const unit = (n: number) => n % 10;
const isTwoDigitFactor = (n: number) => n >= 12 && n <= 49 && unit(n) !== 0;
const isHardFact = (n: number) => HARD_FACTS.has(n);
const answer = ([a, b]: readonly number[]) => a * b;
const pairKey = ([a, b]: readonly number[]) => `${a}x${b}`;

function matchesSkill(index: number, [a, b]: readonly [number, number]): boolean {
  const skill = SKILLS[index];
  if (skill === 'R1') return a >= 2 && b <= 5;
  if (skill === 'R2') return a <= 5 && b >= 6 && b <= 9;
  if (skill === 'A1') return a >= 3 && a <= 9 && (b === 10 || b === 11);
  if (skill === 'R3') return isHardFact(a) && isHardFact(b);
  if (skill === 'R4') return isHardFact(a) && (b === 20 || b === 30);
  if (skill === 'R4B') return isHardFact(a) && (b === 40 || b === 50);
  if (skill === 'R5') return NON_TRIVIAL.has(a) && isTwoDigitFactor(b) && unit(b) !== 5 && a * unit(b) <= 9;
  if (skill === 'A5') return [4, 6, 8].includes(a) && [15, 25, 35, 45].includes(b);
  if (skill === 'R6') {
    return NON_TRIVIAL.has(a) && isTwoDigitFactor(b) && Math.floor(b / 10) <= 2
      && (NON_TRIVIAL.has(unit(b)) || (unit(b) === 2 && isHardFact(a))) && a * unit(b) >= 10;
  }
  if (skill === 'R7') {
    return isHardFact(a) && isTwoDigitFactor(b) && Math.floor(b / 10) >= 3
      && NON_TRIVIAL.has(unit(b)) && a * unit(b) >= 10;
  }
  if (skill === 'R7B') return [7, 8, 9].includes(a) && b >= 41 && b <= 48 && isHardFact(unit(b));
  if (skill === 'R9') {
    return a !== b && isTwoDigitFactor(a) && b <= 19 && NON_TRIVIAL.has(unit(a)) && NON_TRIVIAL.has(unit(b));
  }
  if (skill === 'R10') {
    return a !== b && isTwoDigitFactor(a) && b >= 21 && b <= 29
      && NON_TRIVIAL.has(unit(a)) && NON_TRIVIAL.has(unit(b));
  }
  if (skill === 'R11') {
    return isTwoDigitFactor(a) && a <= 29 && b >= 31 && b <= 49
      && NON_TRIVIAL.has(unit(a)) && NON_TRIVIAL.has(unit(b));
  }
  if (skill === 'R12') {
    return a !== b && a >= 31 && b <= 49 && NON_TRIVIAL.has(unit(a)) && NON_TRIVIAL.has(unit(b));
  }
  return a !== b && a >= 33 && b <= 48 && R12B_UNITS.has(unit(a)) && R12B_UNITS.has(unit(b));
}

function unitAllowedBySlot(index: number, [a, b]: readonly [number, number]): boolean {
  const units = [a, b].filter((factor) => factor >= 10).map(unit);
  if (index <= 7) return true;
  if (index === 8) return units.every((digit) => digit >= 1 && digit <= 4)
    && Math.min(a, b) * unit(Math.max(a, b)) <= 9;
  if (index === 9) return units.every((digit) => digit === 5);
  if (index === 10 || index === 11) {
    return units.every((digit) => NON_TRIVIAL.has(digit)
      || (digit === 2 && HARD_FACTS.has(Math.min(a, b))));
  }
  return units.every((digit) => NON_TRIVIAL.has(digit));
}

function hasNonTrivialFact(a: number, b: number): boolean {
  const aDigits = [...String(a)].map(Number).filter(Boolean);
  const bDigits = [...String(b)].map(Number).filter(Boolean);
  return aDigits.some((left) => bDigits.some((right) => NON_TRIVIAL.has(left) && NON_TRIVIAL.has(right)));
}

function hasRecognizedShortcut(a: number, b: number): boolean {
  if ([a, b].some((n) => n === 10 || n === 11)) return true;
  if ([a, b].some((n) => n >= 20 && n % 10 === 0)) return true;
  if ([a, b].some((n) => n >= 10 && n % 10 === 5)) return true;
  if (a === 2 || b === 2 || a === b) return true;
  const partials = [...String(a)].map(Number).filter(Boolean)
    .flatMap((left) => [...String(b)].map(Number).filter(Boolean).map((right) => [left, right]));
  return Math.min(a, b) >= 10 && partials.every(([left, right]) => left <= 2 || right <= 2);
}

function seeded(seed: number): () => number {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

describe('challenge route catalog', () => {
  it('contains 128 complete, valid routes with the canonical route first', () => {
    expect(CHALLENGE_ROUTES).toHaveLength(128);
    expect(CHALLENGE_ROUTES[0]).toEqual([
      [2, 4], [3, 4], [3, 8], [3, 11], [6, 7], [7, 7], [7, 20], [6, 40],
      [4, 32], [6, 35], [7, 22], [8, 28], [8, 33], [7, 44], [8, 43], [9, 46],
      [16, 19], [19, 27], [24, 27], [28, 39], [28, 44], [28, 46], [33, 37], [38, 43],
    ]);

    for (const route of CHALLENGE_ROUTES) {
      expect(route).toHaveLength(24);
      expect(new Set(route.map(answer)).size).toBe(24);
      let earlyLargeFactors = 0;

      for (const [index, [a, b]] of route.entries()) {
        expect(a).toBeGreaterThanOrEqual(2);
        expect(a).toBeLessThanOrEqual(50);
        expect(b).toBeGreaterThanOrEqual(2);
        expect(b).toBeLessThanOrEqual(50);
        expect(a).toBeLessThanOrEqual(b);
        expect(matchesSkill(index, [a, b])).toBe(true);
        expect(unitAllowedBySlot(index, [a, b])).toBe(true);

        if (index < 8 && [a, b].some((n) => n === 40 || n === 50)) earlyLargeFactors++;
        if (index >= 10) expect(hasRecognizedShortcut(a, b)).toBe(false);
        if (index >= 10 && index <= 15) expect(a * unit(b)).toBeGreaterThanOrEqual(10);
        if (index >= 16) expect(hasNonTrivialFact(a, b)).toBe(true);

        if (index > 0) {
          const previousAnswer = answer(route[index - 1]);
          if (SKILLS[index] === SKILLS[index - 1]) expect(a * b).toBeGreaterThanOrEqual(previousAnswer);
          if (index >= 6) expect(a * b * 2).toBeGreaterThanOrEqual(previousAnswer);
          if (index >= 16) {
            const previous = route[index - 1];
            expect(Math.min(a, b)).toBeGreaterThanOrEqual(Math.min(previous[0], previous[1]));
          }
        }

        if ([7, 15, 23].includes(index)) {
          const start = index - 7;
          const phaseAnswers = route.slice(start, index + 1).map(answer);
          expect(a * b).toBe(Math.max(...phaseAnswers));
          expect([a, b].some((n) => n >= 19 && unit(n) === 9)).toBe(false);
        }
      }

      expect(earlyLargeFactors).toBeLessThanOrEqual(1);
      expect(route.some(([a, b]) => a * b === 2500)).toBe(false);
    }
  });

  it('covers every factor and preserves variety across routes and slots', () => {
    const factors = new Set(CHALLENGE_ROUTES.flatMap((route) => route.flatMap(([a, b]) => [a, b])));
    expect(factors).toEqual(new Set(Array.from({ length: 49 }, (_, index) => index + 2)));

    const routes = CHALLENGE_ROUTES.map((route) => new Set(route.map(pairKey)));
    let maximumSharedPairs = 0;
    for (let left = 0; left < routes.length; left++) {
      for (let right = left + 1; right < routes.length; right++) {
        const shared = [...routes[left]].filter((pair) => routes[right].has(pair)).length;
        maximumSharedPairs = Math.max(maximumSharedPairs, shared);
      }
    }
    expect(maximumSharedPairs).toBeLessThanOrEqual(9);

    for (let slot = 0; slot < 24; slot++) {
      expect(new Set(CHALLENGE_ROUTES.map((route) => pairKey(route[slot]))).size).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('challenge question generation', () => {
  it('uses the phase-specific response limits', () => {
    expect(CHALLENGE_PHASES.map(({ timeLimitSec }) => timeLimitSec)).toEqual([60, 120, 180]);
  });
  it('selects one deterministic route and creates direct multiplication questions', () => {
    let calls = 0;
    const session = generateChallengeSession(() => {
      calls++;
      return 0;
    });

    expect(calls).toBe(1);
    expect(session).toHaveLength(24);
    expect(session.map((question) => question.prompt)).toEqual(
      CHALLENGE_ROUTES[0].map(([a, b]) => `${a} × ${b} = ?`)
    );
    expect(new Set(session.map((question) => question.answer)).size).toBe(24);

    for (const [index, question] of session.entries()) {
      const [a, b] = CHALLENGE_ROUTES[0][index];
      expect(question).toMatchObject({
        phase: Math.floor(index / 8) + 1,
        indexInPhase: index % 8,
        isBoss: index % 8 === 7,
        kind: 'product',
        answer: a * b,
        timeLimitSec: CHALLENGE_PHASES[question.phase - 1].timeLimitSec,
        speechText: `${a} vezes ${b} é igual a quanto?`,
      });
      expect(question.explanation).toContain(`= ${question.answer}.`);
      expect(question.explanation).not.toMatch(/\+\s*0\b/);
      expect(question.speechText).not.toMatch(/[=×÷²()+−]|R\$|MMC|MDC/i);
      expect(question.speechText.endsWith('?')).toBe(true);
    }

    expect(generateChallengeSession(seeded(123))).toEqual(generateChallengeSession(seeded(123)));
  });

  it('clamps extreme RNG values to valid catalog routes', () => {
    expect(generateChallengeSession(() => 0).map((question) => question.prompt))
      .toEqual(generateChallengeSession(() => Number.NaN).map((question) => question.prompt));
    expect(generateChallengeSession(() => 1).map((question) => question.prompt))
      .toEqual(generateChallengeSession(() => 0.999999999).map((question) => question.prompt));
    expect(generateChallengeSession(() => Number.POSITIVE_INFINITY)).toHaveLength(24);
    expect(generateChallengeSession(() => Number.NEGATIVE_INFINITY)).toHaveLength(24);
  });

  it('creates valid explanations and speech for every catalog route', () => {
    for (let routeIndex = 0; routeIndex < CHALLENGE_ROUTES.length; routeIndex++) {
      const session = generateChallengeSession(() => routeIndex / CHALLENGE_ROUTES.length);
      for (const question of session) {
        expect(question.explanation.length).toBeGreaterThan(10);
        expect(question.explanation).toContain(`= ${question.answer}.`);
        expect(question.explanation).not.toMatch(/\+\s*0\b/);
        expect(question.speechText).toMatch(/^\d+ vezes \d+ é igual a quanto\?$/);
        expect(question.speechText).not.toMatch(/[=×÷²()+−]|R\$|MMC|MDC/i);
      }
    }
  });
});

describe('challenge answer and result helpers', () => {
  it('accepts only safe nonnegative integer digits', () => {
    for (const value of ['', ' ', '-1', '+1', '1.5', '1e2', '0x10', 'Infinity', '9007199254740992']) {
      expect(parseChallengeAnswer(value)).toBeNull();
    }
    expect(parseChallengeAnswer(' 0012 ')).toBe(12);
    const question = generateChallengeSession(seeded(1))[0];
    expect(isChallengeAnswerCorrect(question, String(question.answer))).toBe(true);
    expect(isChallengeAnswerCorrect(question, '')).toBe(false);
  });

  it('formats the per-question timer for visual and assistive interfaces', () => {
    expect(formatChallengeTime(180)).toBe('3:00');
    expect(formatChallengeTime(125)).toBe('2:05');
    expect(formatChallengeTime(0)).toBe('0:00');
    expect(formatChallengeTimeText(180)).toBe('3 minutos restantes');
    expect(formatChallengeTimeText(125)).toBe('2 minutos e 5 segundos restantes');
    expect(formatChallengeTimeText(61)).toBe('1 minuto e 1 segundo restante');
    expect(formatChallengeTimeText(1)).toBe('1 segundo restante');
    expect(formatChallengeTimeText(Number.NaN)).toBe('0 segundos restantes');
  });

  it('scores speed, phase and capped streak bonuses with each phase timer', () => {
    expect(scoreChallengeAnswer({ phase: 1, elapsedSec: 0, timeLimitSec: 60, streakBefore: 0 })).toBe(150);
    expect(scoreChallengeAnswer({ phase: 2, elapsedSec: 120, timeLimitSec: 120, streakBefore: 2 })).toBe(170);
    expect(scoreChallengeAnswer({ phase: 3, elapsedSec: 181, timeLimitSec: 180, streakBefore: 99 })).toBe(300);
  });

  it('derives medals and completion without double counting timeouts', () => {
    for (const [wrong, medal] of [[0, 'gold'], [1, 'silver'], [2, 'bronze'], [3, 'none']] as const) {
      expect(computeChallengeMedal({ completed: true, wrong })).toBe(medal);
      const result = summarizeChallenge({
        correct: 24 - wrong,
        wrong,
        timeouts: wrong,
        score: 4000,
        bestStreak: 8,
        durationSec: 90,
      });
      expect(result.medal).toBe(medal);
      expect(result.completed).toBe(wrong < 3);
    }
    expect(summarizeChallenge({ correct: 4, wrong: 3, timeouts: 1, score: 0, bestStreak: 2, durationSec: 40 }).medal)
      .toBe('none');
  });
});
