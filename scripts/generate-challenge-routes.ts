import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { argv } from 'node:process';

type Pair = readonly [number, number];
type Skill =
  | 'R1' | 'R2' | 'A1' | 'R3' | 'R4' | 'R4B' | 'R5' | 'A5'
  | 'R6' | 'R7' | 'R7B' | 'R9' | 'R10' | 'R11' | 'R12' | 'R12B';

const NON_TRIVIAL = new Set([3, 4, 6, 7, 8, 9]);
const HARD_FACTS = new Set([6, 7, 8, 9]);
const SLOT_SKILLS: readonly Skill[] = [
  'R1', 'R1', 'R2', 'A1', 'R3', 'R3', 'R4', 'R4B',
  'R5', 'A5', 'R6', 'R6', 'R7', 'R7', 'R7', 'R7B',
  'R9', 'R10', 'R10', 'R11', 'R11', 'R11', 'R12', 'R12B',
];
const BOSS_SLOTS = new Set([7, 15, 23]);
const ROUTE_COUNT = 128;
const MAX_ROUTE_ATTEMPTS = 100_000;
const MAX_CATALOG_ATTEMPTS = 100_000;
const SEED = 20_261_117;

const unit = (n: number) => n % 10;
const tens = (n: number) => Math.floor(n / 10);
const isTwoDigitFactor = (n: number) => n >= 12 && n <= 49 && unit(n) !== 0;
const isOneDigitFactor = (n: number) => n >= 2 && n <= 9;
const isHardFact = (n: number) => HARD_FACTS.has(n);

function pairs(predicate: (a: number, b: number) => boolean): Pair[] {
  const result: Pair[] = [];
  for (let a = 2; a <= 50; a++) {
    for (let b = a; b <= 50; b++) {
      if (predicate(a, b)) result.push([a, b]);
    }
  }
  return result;
}

const RULES: Record<Skill, Pair[]> = {
  R1: pairs((a, b) => a <= 5 && b <= 5),
  R2: pairs((a, b) => a <= 5 && b <= 9 && b >= 6),
  A1: pairs((a, b) => a >= 3 && a <= 9 && (b === 10 || b === 11)),
  R3: pairs((a, b) => isHardFact(a) && isHardFact(b)),
  R4: pairs((a, b) => isHardFact(a) && (b === 20 || b === 30)),
  R4B: pairs((a, b) => isHardFact(a) && (b === 40 || b === 50)),
  R5: pairs((a, b) =>
    NON_TRIVIAL.has(a) && isTwoDigitFactor(b) && unit(b) !== 5 && a * unit(b) <= 9),
  A5: pairs((a, b) => [4, 6, 8].includes(a) && [15, 25, 35, 45].includes(b)),
  R6: pairs((a, b) =>
    NON_TRIVIAL.has(a)
    && isTwoDigitFactor(b)
    && tens(b) <= 2
    && (NON_TRIVIAL.has(unit(b)) || (unit(b) === 2 && isHardFact(a)))
    && a * unit(b) >= 10),
  R7: pairs((a, b) =>
    isHardFact(a)
    && isTwoDigitFactor(b)
    && tens(b) >= 3
    && NON_TRIVIAL.has(unit(b))
    && a * unit(b) >= 10),
  R7B: pairs((a, b) =>
    [7, 8, 9].includes(a)
    && b >= 41 && b <= 48
    && isHardFact(unit(b))),
  R9: pairs((a, b) =>
    a !== b
    && isTwoDigitFactor(a)
    && b <= 19
    && NON_TRIVIAL.has(unit(a))
    && NON_TRIVIAL.has(unit(b))),
  R10: pairs((a, b) =>
    a !== b
    && isTwoDigitFactor(a)
    && b >= 21 && b <= 29
    && NON_TRIVIAL.has(unit(a))
    && NON_TRIVIAL.has(unit(b))),
  R11: pairs((a, b) =>
    isTwoDigitFactor(a)
    && a <= 29
    && b >= 31 && b <= 49
    && NON_TRIVIAL.has(unit(a))
    && NON_TRIVIAL.has(unit(b))),
  R12: pairs((a, b) =>
    a !== b
    && a >= 31
    && b <= 49
    && NON_TRIVIAL.has(unit(a))
    && NON_TRIVIAL.has(unit(b))),
  R12B: pairs((a, b) =>
    a !== b
    && a >= 33
    && b <= 48
    && [3, 4, 6, 7, 8].includes(unit(a))
    && [3, 4, 6, 7, 8].includes(unit(b))),
};

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

function facts(a: number, b: number): Array<[number, number]> {
  return [...String(a)].flatMap((left) =>
    [...String(b)]
      .filter((right) => right !== '0')
      .map((right) => [Number(left), Number(right)] as [number, number])
  ).filter(([left]) => left !== 0);
}

function carryCount(a: number, b: number): number {
  const top = Math.max(a, b);
  const bottom = Math.min(a, b);
  const topDigits = [...String(top)].reverse().map(Number);
  const bottomDigits = [...String(bottom)].reverse().map(Number);
  let count = 0;
  const rows: number[] = [];

  bottomDigits.forEach((digit, shift) => {
    if (digit === 0) return;
    let carry = 0;
    topDigits.forEach((topDigit, index) => {
      const partial = topDigit * digit + carry;
      if (partial >= 10 && index < topDigits.length - 1) count++;
      carry = Math.floor(partial / 10);
    });
    rows.push(top * digit * 10 ** shift);
  });

  if (rows.length > 1) {
    let carry = 0;
    const digits = Math.max(...rows.map((row) => String(row).length));
    for (let index = 0; index < digits; index++) {
      const sum = rows.reduce((total, row) => total + Math.floor(row / 10 ** index) % 10, carry);
      if (sum >= 10) count++;
      carry = Math.floor(sum / 10);
    }
  }
  return count;
}

function recognizedShortcuts(a: number, b: number): string[] {
  const result: string[] = [];
  if ([a, b].some((n) => n === 10 || n === 11)) result.push('x10/x11');
  if ([a, b].some((n) => n >= 20 && n % 10 === 0)) result.push('round-ten');
  if ([a, b].some((n) => n >= 10 && n % 10 === 5)) result.push('ends-in-five');
  if (a === 2 || b === 2) result.push('double');
  if (a === b) result.push('square');
  if (Math.min(a, b) >= 10
    && facts(a, b).every(([left, right]) => left <= 2 || right <= 2)) {
    result.push('trivial-partials');
  }
  return result;
}

function hasCompensationFactor(a: number, b: number): boolean {
  return [a, b].some((n) => n >= 19 && unit(n) === 9);
}

function hasNonTrivialFact(a: number, b: number): boolean {
  return facts(a, b).some(([left, right]) => NON_TRIVIAL.has(left) && NON_TRIVIAL.has(right));
}

function unitAllowedBySlot(index: number, [a, b]: Pair): boolean {
  const twoDigitFactors = [a, b].filter((n) => n >= 10);
  if (index < 8) return true;
  if (index === 8) {
    return twoDigitFactors.every((n) => [1, 2, 3, 4].includes(unit(n)))
      && Math.min(a, b) * unit(Math.max(a, b)) <= 9;
  }
  if (index === 9) return twoDigitFactors.every((n) => unit(n) === 5);
  if (index === 10 || index === 11) {
    return twoDigitFactors.every((n) =>
      NON_TRIVIAL.has(unit(n)) || (unit(n) === 2 && isHardFact(Math.min(a, b))));
  }
  return twoDigitFactors.every((n) => NON_TRIVIAL.has(unit(n)));
}

function samePair([a1, b1]: Pair, [a2, b2]: Pair): boolean {
  return a1 === a2 && b1 === b2;
}

function isCandidateValid(route: Pair[], pair: Pair, index: number): boolean {
  const product = pair[0] * pair[1];
  if (route.some(([a, b]) => a * b === product)) return false;
  if (index > 0 && SLOT_SKILLS[index] === SLOT_SKILLS[index - 1]) {
    const previous = route[index - 1];
    if (product < previous[0] * previous[1]) return false;
  }
  if (index >= 6) {
    const previous = route[index - 1];
    if (2 * product < previous[0] * previous[1]) return false;
  }
  if (index >= 16) {
    const previous = route[index - 1];
    if (Math.min(...pair) < Math.min(...previous)) return false;
  }
  if (BOSS_SLOTS.has(index)) {
    const phaseStart = index - 7;
    const phaseProducts = route.slice(phaseStart).map(([a, b]) => a * b);
    if (phaseProducts.length && product < Math.max(...phaseProducts)) return false;
    if (hasCompensationFactor(...pair)) return false;
  }
  return true;
}

function routeValidationError(route: Pair[]): string | null {
  if (route.length !== 24) return `expected 24 pairs, got ${route.length}`;
  if (new Set(route.map(([a, b]) => a * b)).size !== 24) return 'products are not unique';

  for (const [index, [a, b]] of route.entries()) {
    if (a < 2 || a > 50 || b < 2 || b > 50 || !RULES[SLOT_SKILLS[index]].some((pair) => samePair(pair, [a, b]))) {
      return `slot ${index + 1} does not match ${SLOT_SKILLS[index]}: ${a}x${b}`;
    }
    if (!unitAllowedBySlot(index, [a, b])) return `slot ${index + 1} has a forbidden unit: ${a}x${b}`;
    if (index >= 10 && recognizedShortcuts(a, b).length) return `slot ${index + 1} has a shortcut: ${a}x${b}`;
    if (index >= 10 && index <= 15 && carryCount(a, b) < 1) return `slot ${index + 1} has no carry: ${a}x${b}`;
    if (index >= 16 && !hasNonTrivialFact(a, b)) return `slot ${index + 1} has no non-trivial fact: ${a}x${b}`;
    if (index > 0 && SLOT_SKILLS[index] === SLOT_SKILLS[index - 1]) {
      const [previousA, previousB] = route[index - 1];
      if (a * b < previousA * previousB) return `slot ${index + 1} falls within ${SLOT_SKILLS[index]}`;
    }
    if (index >= 6) {
      const [previousA, previousB] = route[index - 1];
      if (2 * a * b < previousA * previousB) return `slot ${index + 1} falls below the visual floor`;
    }
    if (index >= 16) {
      const [previousA, previousB] = route[index - 1];
      if (Math.min(a, b) < Math.min(previousA, previousB)) {
        return `slot ${index + 1} lowers the smallest factor in phase 3`;
      }
    }
    if (BOSS_SLOTS.has(index)) {
      const phaseStart = index - 7;
      const phaseProducts = route.slice(phaseStart, index + 1).map(([left, right]) => left * right);
      if (a * b !== Math.max(...phaseProducts) || hasCompensationFactor(a, b)) {
        return `slot ${index + 1} is not a valid boss`;
      }
    }
  }

  const earlyLargeFactors = route.slice(0, 8).filter(([a, b]) => [a, b].some((n) => n === 40 || n === 50));
  if (earlyLargeFactors.length > 1) return 'too many large factors in the opening phase';
  if (route.some(([a, b]) => a === 50 && b === 50)) return '50x50 is excluded';
  return null;
}

function isRouteValid(route: Pair[]): boolean {
  return routeValidationError(route) === null;
}

function makeRoute(random: () => number): Pair[] {
  for (let attempt = 0; attempt < MAX_ROUTE_ATTEMPTS; attempt++) {
    const route: Pair[] = [];
    for (const [index, skill] of SLOT_SKILLS.entries()) {
      const candidates = RULES[skill].filter((pair) => isCandidateValid(route, pair, index));
      if (!candidates.length) break;
      const selected = candidates[Math.floor(random() * candidates.length)];
      route.push(selected);
    }
    if (isRouteValid(route)) return route;
  }
  throw new Error(`Could not create a valid challenge route in ${MAX_ROUTE_ATTEMPTS} attempts`);
}

function pairKey([a, b]: Pair): string {
  return `${a}x${b}`;
}

function createCatalog(): Pair[][] {
  const canonical: Pair[] = [
    [2, 4], [3, 4], [3, 8], [3, 11], [6, 7], [7, 7], [7, 20], [6, 40],
    [4, 32], [6, 35], [7, 22], [8, 28], [8, 33], [7, 44], [8, 43], [9, 46],
    [16, 19], [19, 27], [24, 27], [28, 39], [28, 44], [28, 46], [33, 37], [38, 43],
  ];
  const canonicalError = routeValidationError(canonical);
  if (canonicalError) throw new Error(`The canonical route is invalid: ${canonicalError}`);

  const random = seededRandom(SEED);
  const routes: Pair[][] = [canonical];
  const routeKeys = new Set([canonical.map(pairKey).join(',')]);
  let attempts = 0;

  while (routes.length < ROUTE_COUNT && attempts < MAX_CATALOG_ATTEMPTS) {
    attempts++;
    const route = makeRoute(random);
    const key = route.map(pairKey).join(',');
    if (routeKeys.has(key)) continue;

    const routePairs = new Set(route.map(pairKey));
    const overlapsTooMuch = routes.some((existing) => {
      const overlap = existing.reduce((count, pair) => count + Number(routePairs.has(pairKey(pair))), 0);
      return overlap > 9;
    });
    if (overlapsTooMuch) continue;

    routeKeys.add(key);
    routes.push(route);
  }

  if (routes.length !== ROUTE_COUNT) {
    throw new Error(`Created only ${routes.length} of ${ROUTE_COUNT} routes after ${attempts} attempts`);
  }

  const allFactors = new Set(routes.flatMap((route) => route.flatMap(([a, b]) => [a, b])));
  const missingFactors = Array.from({ length: 49 }, (_, index) => index + 2).filter((n) => !allFactors.has(n));
  if (missingFactors.length) throw new Error(`Challenge catalog omits factors: ${missingFactors.join(', ')}`);

  const distinctPairsBySlot = SLOT_SKILLS.map((_, slot) =>
    new Set(routes.map((route) => pairKey(route[slot]))).size);
  if (distinctPairsBySlot.some((count) => count < 8)) {
    throw new Error(`A challenge slot has fewer than 8 distinct pairs: ${distinctPairsBySlot.join(', ')}`);
  }

  return routes;
}

const outputPath = resolve('src/services/challengeRoutes.ts');
const header = `// Generated by scripts/generate-challenge-routes.ts. Do not edit by hand.\n`;
const generated = `${header}export const CHALLENGE_ROUTES = ${JSON.stringify(createCatalog())} as const;\n`;
const checkOnly = argv.includes('--check');

if (checkOnly) {
  let current: string;
  try {
    current = readFileSync(outputPath, 'utf8');
  } catch {
    throw new Error(`Missing generated challenge catalog: ${outputPath}`);
  }
  if (current !== generated) throw new Error('Challenge route catalog is stale; run bun run gen:challenge');
  console.log('Challenge route catalog is up to date.');
} else {
  writeFileSync(outputPath, generated);
  console.log(`Generated ${ROUTE_COUNT} challenge routes at ${outputPath}`);
}
