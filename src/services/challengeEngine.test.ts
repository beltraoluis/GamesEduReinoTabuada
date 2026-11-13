import { describe, expect, it } from 'vitest';
import { generateChallengeSession, parseChallengeAnswer, isChallengeAnswerCorrect, scoreChallengeAnswer, computeChallengeMedal, summarizeChallenge } from './challengeEngine';

const seeded = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
const independentGcd = (a: number, b: number) => { for (let n = Math.min(a, b); n > 0; n--) if (a % n === 0 && b % n === 0) return n; return 1; };
const independentLcm = (a: number, b: number) => { let n = Math.max(a, b); while (n % a || n % b) n++; return n; };

// Independent parser: same tokens, either conventional precedence or naive left-to-right,
// honoring explicit parentheses in both cases.
function expressionValue(prompt: string, naive = false): number {
  const tokens = prompt.split('=')[0].match(/\d+|[×+−()]/g)!;
  let pos = 0;
  function value(): number {
    if (tokens[pos] === '(') { pos++; const n = expression(); pos++; return n; }
    return Number(tokens[pos++]);
  }
  function expression(min = 0): number {
    let left = value();
    while (pos < tokens.length && tokens[pos] !== ')') {
      const op = tokens[pos], prec = !naive && op === '×' ? 2 : 1;
      if (prec < min) break;
      pos++;
      const right = expression(prec + 1);
      left = op === '×' ? left * right : op === '+' ? left + right : left - right;
    }
    return left;
  }
  return expression();
}

// Strategy rank is primary, log2(answer + 1) is a small magnitude adjustment.
// Reverse-factor questions rank above direct products even though their answers are smaller.
// Phase-1 bands distinguish 2-digit products and 3-digit products by their actual operands,
// never by their slot. Phase 3 follows the requested conceptual order (division/inverse last).
function difficultyScore(q: ReturnType<typeof generateChallengeSession>[number]): number {
  const operands = q.prompt.match(/\d+/g)!.map(Number);
  let rank: number;
  if (q.phase === 1) {
    rank = ({ product: 1, missing_factor: 2, double_product: 3, square: 5 })[q.kind] ?? NaN;
    if (q.kind === 'product_two_digit') rank = operands[0] >= 30 ? 7 : 4;
    if (q.kind === 'product_three_digit') rank = operands[0] >= 124 ? 8 : 6;
  } else if (q.phase === 2) {
    rank = ({ precedence_middle: 1, parentheses_difference: 2, precedence_products: 3,
      parentheses_sum: 4, precedence_three_terms: 5, precedence_parentheses_products: 6, precedence_boss: 7 })[q.kind] ?? NaN;
  } else {
    rank = ({ word_boxes: 1, gcd: 2, lcm: 3, pattern_double: 4, pattern_growing: 5,
      pattern_squares: 6, exact_division: 7, missing_number: 8, word_shared_cost: 9 })[q.kind] ?? NaN;
  }
  return rank * 100 + Math.log2(q.answer + 1);
}

describe('challenge generation', () => {
  it('verifies 2000 fresh sessions with independent arithmetic, traps, ramps and phase invariants', () => {
    const orders = new Set<string>();
    const slotDifficultyTotals = Array.from({ length: 3 }, () => Array(8).fill(0));
    const operationCounts = [0, 0];
    for (let seed = 1; seed <= 2000; seed++) {
      const session = generateChallengeSession(seeded(seed));
      orders.add(session.slice(17, 23).map(q => q.kind).join(','));
      expect(session).toHaveLength(24);
      expect(new Set(session.map(q => q.prompt)).size).toBe(24);
      expect(new Set(session.map(q => q.answer)).size).toBe(24);
      for (const [i, q] of session.entries()) {
        expect(q.phase).toBe(Math.floor(i / 8) + 1);
        expect(q.indexInPhase).toBe(i % 8);
        expect(q.isBoss).toBe(i % 8 === 7);
        expect(q.timeLimitSec).toBe([15, 25, 35][q.phase - 1]);
        expect(Number.isSafeInteger(q.answer) && q.answer >= 0).toBe(true);
        expect(q.prompt.length > 0 && q.explanation.length > 20 && q.speechText.length > 0).toBe(true);
        slotDifficultyTotals[q.phase - 1][q.indexInPhase] += difficultyScore(q);
        expect(q.explanation).not.toMatch(/\+\s*0\b/);
        const n = q.prompt.match(/\d+/g)!.map(Number);
        if (q.phase <= 2) operationCounts[q.phase - 1] += (q.prompt.match(/[×+−²]/g) ?? []).length;
        if (q.kind.startsWith('product')) expect(q.answer).toBe(n[0] * n[1]);
        if (q.kind === 'square') { expect(q.answer).toBe(n[0] ** 2); expect(n[0]).toBeLessThanOrEqual(25); expect(q.explanation).toContain(`= ${q.answer}.`); }
        if (q.kind === 'missing_factor') expect(q.answer * n[0]).toBe(n[1]);
        if (q.kind === 'double_product') expect(q.answer).toBe(2 * n[0] * n[1]);
        if (q.phase === 2) {
          expect(q.answer).toBe(expressionValue(q.prompt));
          if (!['parentheses_sum', 'parentheses_difference'].includes(q.kind)) expect(q.answer).not.toBe(expressionValue(q.prompt, true));
          expect(q.answer).toBeGreaterThan(0); expect(q.answer).toBeLessThanOrEqual(900);
          expect(Math.max(...n)).toBeLessThanOrEqual(38); // includes the explicit b+c inside parentheses
        }
        if (q.kind === 'exact_division') {
          expect(n[0] % n[1]).toBe(0); expect(q.answer).toBe(n[0] / n[1]);
          expect(q.answer).toBeGreaterThanOrEqual(30); expect(q.answer).toBeLessThanOrEqual(60);
          expect(n[1]).toBeGreaterThanOrEqual(12); expect(n[1]).toBeLessThanOrEqual(19);
          expect(n[0]).toBeLessThanOrEqual(1140);
          if (q.answer % 10 === 0) expect(q.explanation).toContain('multiplicando por 10');
        }
        if (q.kind === 'lcm' || q.kind === 'gcd') {
          expect(q.prompt).toContain(q.kind === 'lcm' ? 'menor múltiplo comum (MMC)' : 'maior divisor comum (MDC)');
          expect(n[0]).not.toBe(n[1]); expect(Math.max(...n)).toBeLessThanOrEqual(36);
          expect(independentGcd(n[0], n[1])).toBeGreaterThanOrEqual(2);
          expect(q.answer).toBe(q.kind === 'lcm' ? independentLcm(n[0], n[1]) : independentGcd(n[0], n[1]));
          if (q.kind === 'lcm') expect(q.answer).toBeLessThanOrEqual(250);
        }
        if (q.kind === 'word_shared_cost') { expect(n[3] % n[0]).toBe(0); expect(q.answer).toBe(n[1] * n[2] + n[3] / n[0]); expect(q.prompt.length).toBeLessThanOrEqual(130); expect(q.prompt).toContain('caixas cada, a R$ '); expect(q.prompt).toContain('Repartem igualmente o frete'); expect(q.prompt.endsWith('Quanto paga cada time ao todo?')).toBe(true); }
        if (q.kind.startsWith('word_')) expect(q.prompt.length).toBeLessThanOrEqual(130);
        if (q.kind === 'word_boxes') expect(q.answer).toBe(n[0] * n[1] + n[2]);
        if (q.kind === 'missing_number') {
          expect(q.answer * n[0] + n[1]).toBe(n[2]);
          expect(q.answer).toBeGreaterThanOrEqual(20); expect(q.answer).toBeLessThanOrEqual(70);
          expect(n[0]).toBeGreaterThanOrEqual(12); expect(n[0]).toBeLessThanOrEqual(16);
          expect(n[2]).toBeLessThanOrEqual(1200);
        }
        if (q.kind === 'pattern_squares') { expect(q.answer).toBe((Math.sqrt(n[2]) + 1) ** 2); expect(Math.sqrt(n[0])).toBeGreaterThanOrEqual(12); expect(Math.sqrt(q.answer)).toBeLessThanOrEqual(25); }
        if (q.kind === 'pattern_double') expect(q.answer).toBe(n[3] * 2 + 1);
        if (q.kind === 'pattern_growing') expect(q.answer).toBe(n[5] + (n[5] - n[4]) + 1);
      }
      for (let i = 17; i < 24; i++) expect(difficultyScore(session[i])).toBeGreaterThan(difficultyScore(session[i - 1]));
      const boss = session[7];
      expect(boss.kind).toBe('product_three_digit');
      expect(boss.answer).toBeLessThanOrEqual(1250);
      expect(boss.answer).toBeGreaterThan(Math.max(...session.slice(0, 7).map(q => q.answer)));
      const late = session[6].prompt.match(/\d+/g)!.map(Number);
      const middle = session[3].prompt.match(/\d+/g)!.map(Number);
      expect(late[0]).toBeGreaterThanOrEqual(middle[0]);
      expect(late[1]).toBeGreaterThanOrEqual(middle[1]);
      for (let index = 3; index < 8; index++) expect(session[index].answer).toBeGreaterThan(session[index - 1].answer);
      expect(session[15].kind).toBe('precedence_boss');
      expect((session[15].prompt.match(/[×+−]/g) ?? []).length).toBeGreaterThan(Math.max(...session.slice(8, 15).map(q => (q.prompt.match(/[×+−]/g) ?? []).length)));
    }
    expect(orders.size).toBe(7);
    expect(operationCounts[1]).toBeGreaterThan(operationCounts[0]);
    for (const phase of slotDifficultyTotals) for (let i = 1; i < 8; i++) {
      // 0.1 score point allows tiny sampling variation for adjacent equal-rank kinds.
      expect(phase[i] / 2000 + 0.1).toBeGreaterThanOrEqual(phase[i - 1] / 2000);
    }
  });
  it('produces clean per-kind speech for 5000 sessions without name or mathematical symbols', () => {
    for (let seed = 1; seed <= 5000; seed++) for (const q of generateChallengeSession(seeded(seed))) {
      expect(q.speechText).not.toMatch(/[=×÷²()+−]|R\$|MMC|MDC|\d\s*qual|[a-záéíóúãõç]\?[a-záéíóúãõç]|Aventureiro|\bAna\b|yoda/i);
      expect(q.speechText.endsWith('?')).toBe(true);
      expect(q.speechText).not.toMatch(/\dqual é o número/i);
    }
  });
  it('is deterministic and terminates with constant random input', () => {
    expect(generateChallengeSession(seeded(3))).toEqual(generateChallengeSession(seeded(3)));
    expect(generateChallengeSession(() => 0)).toHaveLength(24);
    expect(generateChallengeSession(() => 0.999999)).toHaveLength(24);
  });
});
it('accepts only safe nonnegative integer digits', () => {
  for (const value of ['', ' ', '-1', '+1', '1.5', '1e2', '0x10', 'Infinity', '9007199254740992']) expect(parseChallengeAnswer(value)).toBeNull();
  expect(parseChallengeAnswer(' 0012 ')).toBe(12);
  const q = generateChallengeSession(seeded(1))[0];
  expect(isChallengeAnswerCorrect(q, String(q.answer))).toBe(true);
  expect(isChallengeAnswerCorrect(q, '')).toBe(false);
});
it('scores speed, phase and capped streak bonuses', () => {
  expect(scoreChallengeAnswer({ phase: 1, elapsedSec: 0, timeLimitSec: 15, streakBefore: 0 })).toBe(150);
  expect(scoreChallengeAnswer({ phase: 2, elapsedSec: 25, timeLimitSec: 25, streakBefore: 2 })).toBe(170);
  expect(scoreChallengeAnswer({ phase: 3, elapsedSec: 99, timeLimitSec: 35, streakBefore: 99 })).toBe(300);
});
it('derives medals and completion without double counting timeouts', () => {
  for (const [wrong, medal] of [[0, 'gold'], [1, 'silver'], [2, 'bronze'], [3, 'none']] as const) {
    expect(computeChallengeMedal({ completed: true, wrong })).toBe(medal);
    const result = summarizeChallenge({ correct: 24 - wrong, wrong, timeouts: wrong, score: 4000, bestStreak: 8, durationSec: 90 });
    expect(result.medal).toBe(medal);
    expect(result.completed).toBe(wrong < 3);
  }
  expect(summarizeChallenge({ correct: 4, wrong: 3, timeouts: 1, score: 0, bestStreak: 2, durationSec: 40 }).medal).toBe('none');
});
