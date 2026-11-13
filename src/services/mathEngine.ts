import { Question, WorldConfig } from '../types/game';

export const WORLDS: WorldConfig[] = [
  {
    id: 'world-1',
    name: 'Vale Verdejante',
    subtitle: 'O Segredo do Dobro & Saltos de 5 em 5',
    icon: '🌱',
    themeColor: 'from-emerald-500 to-teal-600',
    badge: '🌿 Guardião da Floresta',
    tables: [2, 5],
    description: 'Aprenda que multiplicar por 2 é dobrar, e por 5 sempre termina em 0 ou 5!',
    pedagogicalFocus: 'Dobro e regularidades da tabuada do 5',
    requiredStars: 0,
    totalLevels: 4,
  },
  {
    id: 'world-2',
    name: 'Reino das Nuvens',
    subtitle: 'Triplos Mágicos & As 4 Patas',
    icon: '☁️',
    themeColor: 'from-sky-500 to-indigo-600',
    badge: '⚡ Mestre dos Céus',
    tables: [3, 4],
    description: 'Descubra os triplos e como multiplicar por 4 é dobrar duas vezes!',
    pedagogicalFocus: 'Tabuadas do 3 e 4 com agrupamentos visuais',
    requiredStars: 3,
    totalLevels: 4,
  },
  {
    id: 'world-3',
    name: 'Montanha de Cristal',
    subtitle: 'Os Padrões Brilhantes do 6 e 7',
    icon: '💎',
    themeColor: 'from-purple-500 to-pink-600',
    badge: '🔮 Feiticeiro dos Cristais',
    tables: [6, 7],
    description: 'Use a tabuada do 3 para dominar o 6 e descubra os segredos mágicos do 7!',
    pedagogicalFocus: 'Relações entre tabuadas (6 é o dobro de 3)',
    requiredStars: 7,
    totalLevels: 4,
  },
  {
    id: 'world-4',
    name: 'Vulcão Cósmico',
    subtitle: 'O Poder do 8 & O Truque dos 9 Dedos',
    icon: '🚀',
    themeColor: 'from-amber-500 to-orange-600',
    badge: '🌟 Guardião Estelar',
    tables: [8, 9],
    description: 'Oito tentáculos do polvo e a incrível mágica das mãos na tabuada do 9!',
    pedagogicalFocus: 'Estratégias mentais do 8 (dobro do 4) e truque do 9',
    requiredStars: 12,
    totalLevels: 4,
  },
  {
    id: 'world-5',
    name: 'Castelo Dourado',
    subtitle: 'A Tabuada do 10 & A Coroação dos Mestres',
    icon: '👑',
    themeColor: 'from-yellow-500 to-amber-600',
    badge: '🏆 Grande Mestre da Matemática',
    tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    description: 'O desafio final! Acrescente o zero do 10 e mostre que domina tudo!',
    pedagogicalFocus: 'Tabuada do 10 e consolidação geral do 3º ano',
    requiredStars: 18,
    totalLevels: 5,
  },
];

const FRUIT_ICONS = [
  { icon: '⭐', name: 'estrelas' },
  { icon: '🍎', name: 'maçãs' },
  { icon: '🍓', name: 'morangos' },
  { icon: '🥕', name: 'cenouras' },
  { icon: '💎', name: 'diamantes' },
  { icon: '🍬', name: 'balas' },
  { icon: '🪙', name: 'moedas' },
  { icon: '🚀', name: 'foguetes' },
];

export {
  MASCOT_LIST,
  ACCESSORY_HATS,
  DEFAULT_PROGRESS,
  ACHIEVEMENTS_LIST,
} from './gameData';

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickFactorPair(
  allowedTables: number[],
  maxFactor: number,
  previous?: { factorA: number; factorB: number }
): { factorA: number; factorB: number } {
  const safeMaxFactor = Math.max(1, Math.floor(maxFactor));
  const allPairs: Array<{ factorA: number; factorB: number }> = [];

  for (const table of allowedTables) {
    for (let factorB = 1; factorB <= safeMaxFactor; factorB++) {
      allPairs.push({ factorA: table, factorB });
    }
  }

  const candidatePairs = previous
    ? allPairs.filter(
        (pair) => !(pair.factorA === previous.factorA && pair.factorB === previous.factorB)
      )
    : allPairs;

  const pool = candidatePairs.length > 0 ? candidatePairs : allPairs;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function generateQuestion(
  allowedTables: number[],
  maxFactor: number = 10,
  previous?: { factorA: number; factorB: number }
): Question {
  const { factorA: table, factorB } = pickFactorPair(allowedTables, maxFactor, previous);
  const result = table * factorB;

  // Plausible distractors:
  // 1. Off by one multiplication: a * (b - 1) or a * (b + 1)
  // 2. Off by two multiplication: a * (b - 2) or a * (b + 2)
  // 3. Adjacent table: (a + 1) * b
  // 4. Close positive number fallback
  const distractors = new Set<number>();
  const addDistractor = (value: number) => {
    if (Number.isFinite(value) && value > 0 && value !== result) {
      distractors.add(value);
    }
  };

  addDistractor(table * Math.max(1, factorB + (Math.random() > 0.5 ? 1 : -1)));
  addDistractor(table * Math.max(1, factorB + (Math.random() > 0.5 ? 2 : -2)));
  addDistractor((table + 1) * factorB);

  let attempts = 0;
  while (distractors.size < 2 && attempts < 50) {
    const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    addDistractor(result + offset);
    attempts++;
  }

  let fallbackOffset = 1;
  while (distractors.size < 2) {
    addDistractor(result + fallbackOffset);
    fallbackOffset++;
  }

  const optionsList = [...Array.from(distractors).slice(0, 2), result];
  const shuffledOptions = shuffleArray(optionsList);

  const itemTheme = FRUIT_ICONS[Math.floor(Math.random() * FRUIT_ICONS.length)];

  // Formulate clear explanation
  const additionParts = Array(table).fill(factorB).join(' + ');
  const explanation = `${table} × ${factorB} = ${result}. É o mesmo que somar ${table} vezes o número ${factorB} (${additionParts} = ${result})!`;

  return {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    factorA: table,
    factorB: factorB,
    result: result,
    options: shuffledOptions,
    promptText: `${table} × ${factorB} = ?`,
    speechText: `Quanto é ${table} vezes ${factorB}?`,
    explanation,
    visualItems: {
      icon: itemTheme.icon,
      rows: table,
      cols: factorB,
      name: itemTheme.name,
    },
  };
}
