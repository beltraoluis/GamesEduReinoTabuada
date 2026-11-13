import wizardHatImg from '../assets/hats/wizard-hat.svg';
import sunglassesImg from '../assets/accessories/sunglasses.svg';
import pipImg from '../assets/mascots/pip.svg';
import dinoImg from '../assets/mascots/dino.svg';
import type { MascotAccessory, MascotSkin, ChallengeProgress } from '../types/game';

export const MASCOT_LIST: MascotSkin[] = [
  { id: 'pip', name: 'Pip, o Esquilo Feiticeiro', emoji: '🐿️', image: pipImg, color: 'bg-amber-100 border-amber-400 text-amber-900', unlocked: true, cost: 0 },
  { id: 'lunna', name: 'Lunna, a Raposinha Estelar', emoji: '🦊', color: 'bg-orange-100 border-orange-400 text-orange-900', unlocked: true, cost: 0 },
  { id: 'dino', name: 'Dino, o Dragão Brincalhão', emoji: '🦖', image: dinoImg, color: 'bg-emerald-100 border-emerald-400 text-emerald-900', unlocked: false, cost: 580 },
  { id: 'sol', name: 'Solzinho, o Ursinho Alquimista', emoji: '🐻', color: 'bg-yellow-100 border-yellow-400 text-yellow-900', unlocked: false, cost: 970 },
  { id: 'estrela', name: 'Gatito, o Mago Cósmico', emoji: '🐱', color: 'bg-indigo-100 border-indigo-400 text-indigo-900', unlocked: false, cost: 1550, requiresAllWorlds: true },
];

export const ACCESSORY_HATS: MascotAccessory[] = [
  { id: 'none', name: 'Sem Chapéu', type: 'hat', emoji: '✖️', cost: 0, unlocked: true },
  { id: 'wizard', name: 'Chapéu Mágico de Estrelas', type: 'hat', emoji: '🧙‍♂️', image: wizardHatImg, cost: 190, unlocked: false },
  { id: 'crown', name: 'Coroa Dourada Real', type: 'hat', emoji: '👑', cost: 1000, unlocked: false, requiresAllWorlds: true },
  { id: 'cap', name: 'Boné Radical', type: 'hat', emoji: '🧢', cost: 80, unlocked: false },
  { id: 'sunglasses', name: 'Óculos Escuros Maneiros', type: 'glasses', emoji: '🕶️', image: sunglassesImg, cost: 290, unlocked: false },
  { id: 'flower', name: 'Florzinha Encantada', type: 'hat', emoji: '🌸', cost: 80, unlocked: false },
];

export const DEFAULT_PROGRESS: {
  challenge: ChallengeProgress;
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
  challenge: { unlocked: false, attempts: 0, bestScore: 0, bestStreak: 0, bestMedal: 'none' },
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
