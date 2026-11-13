import type { ChallengeMedal, ChallengeResult } from '../types/game';
import { CHALLENGE_PHASES, CHALLENGE_SPEED_BONUS, CHALLENGE_STREAK_BONUS, CHALLENGE_MAX_STREAK_BONUS, CHALLENGE_TOTAL_QUESTIONS, CHALLENGE_LIVES, CHALLENGE_QUESTIONS_PER_PHASE, CHALLENGE_MASTER_KIND_ORDER } from './challengeConfig';

export interface ChallengeQuestion {
  id: string; phase: 1 | 2 | 3; indexInPhase: number; isBoss: boolean; kind: string;
  prompt: string; answer: number; timeLimitSec: number; explanation: string; speechText: string;
}
export interface ChallengeSummaryArgs {
  correct: number; wrong: number; timeouts: number; score: number; bestStreak: number; durationSec: number;
}
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
const finite = (n: number) => Number.isFinite(n) ? Math.max(0, n) : 0;
export function parseChallengeAnswer(input: string): number | null {
  const value = input.trim();
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}
export function isChallengeAnswerCorrect(q: ChallengeQuestion, input: string): boolean {
  return parseChallengeAnswer(input) === q.answer;
}
export function scoreChallengeAnswer({ phase, elapsedSec, timeLimitSec, streakBefore }: { phase: 1 | 2 | 3; elapsedSec: number; timeLimitSec: number; streakBefore: number }): number {
  const speed = timeLimitSec > 0 ? Math.max(0, 1 - finite(elapsedSec) / timeLimitSec) : 0;
  return Math.round(100 * CHALLENGE_PHASES[phase - 1].multiplier * (1 + CHALLENGE_SPEED_BONUS * speed)
    + Math.min(CHALLENGE_MAX_STREAK_BONUS, Math.floor(finite(streakBefore)) * CHALLENGE_STREAK_BONUS));
}
/** wrong includes timeouts; timeouts is a subset, never a second deduction. */
export function computeChallengeMedal({ completed, wrong }: { completed: boolean; wrong: number }): ChallengeMedal {
  return completed && Number.isInteger(wrong) ? (wrong === 0 ? 'gold' : wrong === 1 ? 'silver' : wrong === 2 ? 'bronze' : 'none') : 'none';
}
/** wrong includes timeouts. Completion is derived from 24 answered and fewer than 3 mistakes. */
export function summarizeChallenge(args: ChallengeSummaryArgs): ChallengeResult {
  const correct = Math.min(CHALLENGE_TOTAL_QUESTIONS, Math.floor(finite(args.correct)));
  const wrong = Math.min(CHALLENGE_TOTAL_QUESTIONS - correct, Math.floor(finite(args.wrong)));
  const completed = correct + wrong === CHALLENGE_TOTAL_QUESTIONS && wrong < CHALLENGE_LIVES;
  return { correct, wrong, timeouts: Math.min(wrong, Math.floor(finite(args.timeouts))), score: Math.round(finite(args.score)),
    bestStreak: Math.min(correct, Math.floor(finite(args.bestStreak))), durationSec: finite(args.durationSec), completed,
    medal: computeChallengeMedal({ completed, wrong }) };
}

/** Valid pairs keep the vocabulary exercise substantial without creating a long calculation. */
const commonPairs = Array.from({ length: 25 }, (_, i) => i + 12).flatMap(a =>
  Array.from({ length: 25 }, (_, i) => i + 12)
    .filter(b => a !== b && gcd(a, b) >= 2 && a * b / gcd(a, b) <= 250)
    .map(b => [a, b] as const));
const multiples = (n: number, until: number) => Array.from({ length: until / n }, (_, i) => n * (i + 1)).join(', ');
const divisors = (n: number) => Array.from({ length: n }, (_, i) => i + 1).filter(d => n % d === 0).join(', ');

export function generateChallengeSession(rng: () => number = Math.random): ChallengeQuestion[] {
  const questions: ChallengeQuestion[] = [];
  const prompts = new Set<string>();
  const answers = new Set<number>();
  const random = () => Math.min(0.999999999, finite(rng()));
  const pool: string[] = [...CHALLENGE_MASTER_KIND_ORDER];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const selectedKinds = pool.slice(0, 6).sort((a, b) =>
    CHALLENGE_MASTER_KIND_ORDER.indexOf(a as typeof CHALLENGE_MASTER_KIND_ORDER[number])
    - CHALLENGE_MASTER_KIND_ORDER.indexOf(b as typeof CHALLENGE_MASTER_KIND_ORDER[number]));
  for (const phase of [1, 2, 3] as const) for (let index = 0; index < CHALLENGE_QUESTIONS_PER_PHASE; index++) {
    let retry = 0;
    let q: ChallengeQuestion;
    do {
      // On retries, enumerate coordinates independently: constant injected RNG still terminates.
      let coordinate = 0;
      const r = (lo: number, hi: number) => {
        const width = hi - lo + 1;
        const offset = Math.floor(retry / Math.max(1, coordinate++ === 0 ? 1 : 17));
        return lo + (Math.floor(random() * width) + offset) % width;
      };
      const boss = index === CHALLENGE_QUESTIONS_PER_PHASE - 1;
      let kind = '', prompt = '', explanation = '', speechText = '', answer = 0;
      if (phase === 1) {
        if (index === 1) {
          const a = r(17, 20), b = r(7, 9);
          kind = 'missing_factor'; answer = a; prompt = `? × ${b} = ${a * b}`;
          speechText = `Quanto vezes ${b} é igual a ${a * b}?`;
          explanation = `Use a operação inversa: ${a * b} ÷ ${b} = ${a}. Confira: ${a} × ${b} = ${a * b}.`;
        } else if (index === 2) {
          const a = r(16, 18), b = r(6, 7);
          kind = 'double_product'; prompt = `Qual é o dobro de ${a} × ${b}?`; answer = 2 * a * b;
          speechText = `Qual é o dobro de ${a} vezes ${b}?`;
          explanation = `Primeiro ${a} × ${b} = ${a * b}; depois dobre: ${a * b} + ${a * b} = ${answer}.`;
        } else if (index === 4) {
          const a = r(21, 25);
          kind = 'square'; prompt = `${a}² = ?`; answer = a * a;
          speechText = `${a} ao quadrado é igual a quanto?`;
          explanation = `Quadrado é o número vezes ele mesmo: ${a} × ${a} = 20 × ${a} + ${a - 20} × ${a} = ${20 * a} + ${(a - 20) * a} = ${answer}.`;
        } else {
          let a: number, b: number;
          if (index === 0) { a = r(11, 14); b = r(6, 9); }
          else if (index === 3) { a = r(25, 29); b = r(12, 14); }
          else if (index === 5) { a = r(106, 119); b = 6; }
          else if (index === 6) { a = r(36, 39); b = r(20, 22); }
          else { a = r(124, 149); b = r(7, 8); }
          kind = index === 0 ? 'product' : index === 3 || index === 6 ? 'product_two_digit' : 'product_three_digit';
          prompt = `${a} × ${b} = ?`; answer = a * b;
          speechText = `${a} vezes ${b} é igual a quanto?`;
          const base = a >= 100 ? 100 : Math.floor(a / 10) * 10;
          explanation = `Decomponha ${a} em ${base} + ${a - base}: ${a} × ${b} = ${base} × ${b} + ${a - base} × ${b} = ${base * b} + ${(a - base) * b} = ${answer}.`;
        }
      } else if (phase === 2) {
        const a = r(index < 4 ? 11 : index === 4 ? 16 : 18, index < 4 ? 14 : index === 4 ? 17 : 20);
        const b = r(index < 4 ? 8 : index === 4 ? 12 : 14, index < 4 ? 11 : index === 4 ? 13 : 16);
        const c = r(index < 4 ? 9 : 15, index < 4 ? 12 : 19);
        const d = r(6, 9), e = r(7, 11), f = r(12, 24);
        if (boss) {
          kind = 'precedence_boss'; answer = (a + b) * c + d * e - f;
          prompt = `(${a} + ${b}) × ${c} + ${d} × ${e} − ${f} = ?`;
          speechText = `Abre parênteses ${a} mais ${b} fecha parênteses, vezes ${c}, mais ${d} vezes ${e}, menos ${f}. É igual a quanto?`;
          explanation = `Parênteses: ${a} + ${b} = ${a + b}. Produtos: ${a + b} × ${c} = ${(a + b) * c} e ${d} × ${e} = ${d * e}. Por fim: ${(a + b) * c} + ${d * e} − ${f} = ${answer}.`;
        } else if (index === 3) {
          kind = 'parentheses_sum'; answer = (a + b) * c - d;
          prompt = `(${a} + ${b}) × ${c} − ${d} = ?`;
          speechText = `Abre parênteses ${a} mais ${b} fecha parênteses, vezes ${c}, menos ${d}. É igual a quanto?`;
          explanation = `Parênteses: ${a} + ${b} = ${a + b}. Depois ${(a + b)} × ${c} = ${(a + b) * c}. Subtraia: ${(a + b) * c} − ${d} = ${answer}.`;
        } else if (index === 1) {
          kind = 'parentheses_difference'; answer = a * b + d;
          prompt = `${a} × (${b + c} − ${c}) + ${d} = ?`;
          speechText = `${a} vezes, abre parênteses ${b + c} menos ${c} fecha parênteses, mais ${d}. É igual a quanto?`;
          explanation = `Parênteses: ${b + c} − ${c} = ${b}. Depois ${a} × ${b} = ${a * b}. Some: ${a * b} + ${d} = ${answer}.`;
        } else if (index === 0) {
          kind = 'precedence_middle'; answer = a + b * c - d;
          prompt = `${a} + ${b} × ${c} − ${d} = ?`;
          speechText = `${a} mais ${b} vezes ${c}, menos ${d}. É igual a quanto?`;
          explanation = `Multiplique primeiro: ${b} × ${c} = ${b * c}. Depois ${a} + ${b * c} − ${d} = ${answer}.`;
        } else if (index === 6) {
          kind = 'precedence_parentheses_products'; answer = (a + b) * c - d * e;
          prompt = `(${a} + ${b}) × ${c} − ${d} × ${e} = ?`;
          speechText = `Abre parênteses ${a} mais ${b} fecha parênteses, vezes ${c}, menos ${d} vezes ${e}. É igual a quanto?`;
          explanation = `Resolva ${a} + ${b} = ${a + b}. Faça os dois produtos: ${(a + b) * c} e ${d * e}. Subtraia: ${(a + b) * c} − ${d * e} = ${answer}.`;
        } else {
          kind = index === 2 ? 'precedence_products' : 'precedence_three_terms';
          const subtract = index === 2 ? 0 : f;
          answer = a * b + c * d - subtract;
          prompt = `${a} × ${b} + ${c} × ${d}${subtract ? ` − ${subtract}` : ''} = ?`;
          speechText = `${a} vezes ${b}, mais ${c} vezes ${d}${subtract ? `, menos ${subtract}` : ''}. É igual a quanto?`;
          explanation = `Faça primeiro os produtos: ${a} × ${b} = ${a * b} e ${c} × ${d} = ${c * d}. Depois ${a * b} + ${c * d}${subtract ? ` − ${subtract}` : ''} = ${answer}.`;
        }
      } else {
        kind = boss ? 'word_shared_cost' : index === 0 ? 'word_boxes' : selectedKinds[index - 1];
        const a = r(60, 90), b = r(12, 24), c = r(8, 18);
        switch (kind) {
          case 'word_shared_cost': {
            const teams = r(12, 24), boxes = r(32, 45), price = r(15, 20), fee = r(8, 16);
            answer = boxes * price + fee;
            prompt = `${teams} times compram ${boxes} caixas cada, a R$ ${price} a caixa. Repartem igualmente o frete de R$ ${teams * fee}. Quanto paga cada time ao todo?`;
            speechText = `${teams} times compram ${boxes} caixas cada, a ${price} reais a caixa. Repartem igualmente o frete de ${teams * fee} reais. Quanto paga cada time ao todo?`;
            explanation = `Cada time paga ${boxes} × ${price} = ${boxes * price} reais pelas caixas. Sua parte do frete é ${teams * fee} ÷ ${teams} = ${fee} reais. Total: ${boxes * price} + ${fee} = ${answer} reais.`; break;
          }
          case 'word_boxes': {
            const boxes = r(30, 40), items = r(22, 30);
            answer = boxes * items + c;
            prompt = `${boxes} caixas têm ${items} cristais cada. Há mais ${c} cristais soltos. Quantos cristais há ao todo?`;
            speechText = prompt;
            explanation = `Multiplique para contar os cristais nas caixas: ${boxes} × ${items} = ${boxes * items}. Some os soltos: ${boxes * items} + ${c} = ${answer}.`; break;
          }
          case 'exact_division': {
            const quotient = r(30, 60), divisor = r(12, 19);
            const tens = Math.floor(quotient / 10) * 10, units = quotient % 10;
            answer = quotient; prompt = `${quotient * divisor} ÷ ${divisor} = ?`;
            speechText = `${quotient * divisor} dividido por ${divisor} é igual a quanto?`;
            explanation = units === 0
              ? `Procure o fator que falta: ${divisor} × ${quotient / 10} = ${divisor * quotient / 10}; multiplicando por 10, ${divisor} × ${quotient} = ${divisor * quotient}. Portanto, ${quotient * divisor} ÷ ${divisor} = ${answer}.`
              : `Use um múltiplo próximo: ${divisor} × ${tens} = ${divisor * tens}. Faltam ${divisor * quotient} − ${divisor * tens} = ${divisor * units}, que são ${units} grupos de ${divisor}. Assim, ${tens} + ${units} = ${answer}.`; break;
          }
          case 'lcm': case 'gcd': {
            const [x, y] = commonPairs[r(0, commonPairs.length - 1)];
            answer = kind === 'lcm' ? x * y / gcd(x, y) : gcd(x, y);
            const words = kind === 'lcm' ? 'menor múltiplo comum' : 'maior divisor comum';
            prompt = `Qual é o ${words} (${kind === 'lcm' ? 'MMC' : 'MDC'}) de ${x} e ${y}?`;
            speechText = `Qual é o ${words} de ${x} e ${y}?`;
            explanation = kind === 'lcm'
              ? `Conte de ${x} em ${x}: ${multiples(x, answer)}. Conte de ${y} em ${y}: ${multiples(y, answer)}. O primeiro número nas duas listas é ${answer}, o menor múltiplo comum.`
              : `Divisores de ${x}: ${divisors(x)}. Divisores de ${y}: ${divisors(y)}. Procure o maior número nas duas listas: ${answer}.`; break;
          }
          case 'pattern_growing': {
            const start = r(100, 180), step = r(40, 65); answer = start + 4 * step + 6;
            prompt = `As diferenças crescem de 1 em 1: ${start}, ${start + step}, ${start + 2 * step + 1}, ${start + 3 * step + 3}, ... Qual é o próximo termo?`;
            speechText = `As diferenças crescem de 1 em 1: ${start}, ${start + step}, ${start + 2 * step + 1}, ${start + 3 * step + 3}. Qual é o próximo termo?`;
            explanation = `As diferenças são ${step}, ${step + 1}, ${step + 2}. A próxima é ${step + 3}: ${start + 3 * step + 3} + ${step + 3} = ${answer}.`; break;
          }
          case 'pattern_squares': {
            const root = r(12, 22); answer = (root + 3) ** 2;
            prompt = `São quadrados de números consecutivos: ${root ** 2}, ${(root + 1) ** 2}, ${(root + 2) ** 2}, ... Qual vem depois?`;
            speechText = `São quadrados de números consecutivos: ${root ** 2}, ${(root + 1) ** 2}, ${(root + 2) ** 2}. Qual vem depois?`;
            explanation = `As bases são ${root}, ${root + 1}, ${root + 2}; a próxima é ${root + 3}. Calcule ${root + 3} × ${root + 3} = ${answer}.`; break;
          }
          case 'pattern_double': answer = 8 * a + 7;
            prompt = `A regra é dobrar e somar 1: ${a}, ${2 * a + 1}, ${4 * a + 3}, ... Qual vem depois?`;
            speechText = `A regra é dobrar e somar 1: ${a}, ${2 * a + 1}, ${4 * a + 3}. Qual vem depois?`;
            explanation = `Dobre o último termo e some 1: 2 × ${4 * a + 3} + 1 = ${answer}.`; break;
          default: { const multiplier = r(12, 16); answer = r(20, 70); prompt = `Multiplique um número por ${multiplier} e some ${c}. O resultado é ${answer * multiplier + c}. Qual é o número?`;
            speechText = prompt;
            explanation = `Desfaça a soma: ${answer * multiplier + c} − ${c} = ${answer * multiplier}. Depois desfaça a multiplicação: ${answer * multiplier} ÷ ${multiplier} = ${answer}.`; }
        }
      }
      q = { id: `challenge-${phase}-${index}`, phase, indexInPhase: index, isBoss: boss, kind, prompt, answer,
        timeLimitSec: CHALLENGE_PHASES[phase - 1].timeLimitSec, explanation, speechText };
      retry++;
    } while (prompts.has(q.prompt) || answers.has(q.answer) || (phase === 2 && (q.answer <= 0 || q.answer > 900)));
    prompts.add(q.prompt); answers.add(q.answer); questions.push(q);
  }
  return questions;
}
