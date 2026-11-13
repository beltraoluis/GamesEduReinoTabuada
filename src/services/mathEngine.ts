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

export function generateQuestion(allowedTables: number[], maxFactor: number = 10): Question {
  const table = allowedTables[Math.floor(Math.random() * allowedTables.length)];
  // 3rd graders practice 1 to 10
  const factorB = Math.floor(Math.random() * maxFactor) + 1;
  const result = table * factorB;

  // Plausible distractors:
  // 1. Common addition mistake: a + b
  // 2. Off by one multiplication: a * (b - 1) or a * (b + 1)
  // 3. Close number (+/- 2 or +/- 5)
  const distractors = new Set<number>();

  const candidate1 = table * Math.max(1, factorB + (Math.random() > 0.5 ? 1 : -1));
  if (candidate1 !== result && candidate1 > 0) distractors.add(candidate1);

  const candidate2 = table * Math.max(1, factorB + (Math.random() > 0.5 ? 2 : -2));
  if (candidate2 !== result && candidate2 > 0) distractors.add(candidate2);

  const candidate3 = (table + 1) * factorB;
  if (candidate3 !== result && candidate3 > 0) distractors.add(candidate3);

  // If we still need distractors:
  while (distractors.size < 2) {
    const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const d = result + offset;
    if (d > 0 && d !== result) distractors.add(d);
  }

  const optionsList = Array.from(distractors).slice(0, 2);
  optionsList.push(result);
  // Shuffle options
  const shuffledOptions = optionsList.sort(() => Math.random() - 0.5);

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

export const MASCOT_LIST = [
  { id: 'pip', name: 'Pip, o Esquilo Feiticeiro', emoji: '🐿️', color: 'bg-amber-100 border-amber-400 text-amber-900', unlocked: true, cost: 0 },
  { id: 'lunna', name: 'Lunna, a Raposinha Estelar', emoji: '🦊', color: 'bg-orange-100 border-orange-400 text-orange-900', unlocked: true, cost: 0 },
  { id: 'dino', name: 'Dino, o Dragão Brincalhão', emoji: '🦖', color: 'bg-emerald-100 border-emerald-400 text-emerald-900', unlocked: false, cost: 15 },
  { id: 'sol', name: 'Solzinho, o Ursinho Alquimista', emoji: '🐻', color: 'bg-yellow-100 border-yellow-400 text-yellow-900', unlocked: false, cost: 25 },
  { id: 'estrela', name: 'Gatito, o Mago Cósmico', emoji: '🐱', color: 'bg-indigo-100 border-indigo-400 text-indigo-900', unlocked: false, cost: 40 },
];

export const ACCESSORY_HATS = [
  { id: 'none', name: 'Sem Chapéu', emoji: '✖️', cost: 0, unlocked: true },
  { id: 'wizard', name: 'Chapéu Mágico de Estrelas', emoji: '🧙‍♂️', cost: 10, unlocked: false },
  { id: 'crown', name: 'Coroa Dourada Real', emoji: '👑', cost: 20, unlocked: false },
  { id: 'cap', name: 'Boné Radical', emoji: '🧢', cost: 8, unlocked: false },
  { id: 'headphones', name: 'Fones de Ouvido Gamer', emoji: '🎧', cost: 15, unlocked: false },
  { id: 'flower', name: 'Florzinha Encantada', emoji: '🌸', cost: 5, unlocked: false },
];

export const DEFAULT_PROGRESS: {
  playerName: string;
  stars: number;
  gems: number;
  highScoreRunner: number;
  highScoreBalloons: number;
  highScoreCauldron: number;
  selectedMascot: string;
  selectedHat: string;
  unlockedMascots: string[];
  unlockedAccessories: string[];
  completedLevels: Record<string, number>;
  unlockedAchievements: string[];
} = {
  playerName: 'Aventureiro(a)',
  stars: 0,
  gems: 10,
  highScoreRunner: 0,
  highScoreBalloons: 0,
  highScoreCauldron: 0,
  selectedMascot: 'pip',
  selectedHat: 'none',
  unlockedMascots: ['pip', 'lunna'],
  unlockedAccessories: ['none'],
  completedLevels: {},
  unlockedAchievements: ['welcome'],
};

export const ACHIEVEMENTS_LIST = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Reino!',
    description: 'Iniciou a mágica jornada da tabuada.',
    icon: '🎒',
    maxProgress: 1,
  },
  {
    id: 'first_win',
    title: 'Primeira Vitória!',
    description: 'Completou sua primeira fase com estrelas.',
    icon: '⭐',
    maxProgress: 1,
  },
  {
    id: 'combo_master',
    title: 'Super Concentração!',
    description: 'Alcançou um combo de 5 acertos seguidos sem errar.',
    icon: '⚡',
    maxProgress: 5,
  },
  {
    id: 'balloon_pop_10',
    title: 'Estourador Mágico!',
    description: 'Estourou 15 balões corretos na Festa dos Balões.',
    icon: '🎈',
    maxProgress: 15,
  },
  {
    id: 'lab_explorer',
    title: 'Cientista dos Números',
    description: 'Explorou matrizes visuais no Laboratório.',
    icon: '🔬',
    maxProgress: 1,
  },
  {
    id: 'world1_master',
    title: 'Mestre do Dobro & Cinco',
    description: 'Conquistou 10 estrelas no Vale Verdejante.',
    icon: '🌿',
    maxProgress: 10,
  },
  {
    id: 'cauldron_chef',
    title: 'Alquimista Nota 10',
    description: 'Preparou 5 poções perfeitas no Caldeirão.',
    icon: '🧪',
    maxProgress: 5,
  },
];
