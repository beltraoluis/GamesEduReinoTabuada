export type GameMode = 
  | 'title' 
  | 'adventure_runner' 
  | 'balloon_pop' 
  | 'potion_cauldron' 
  | 'visual_lab' 
  | 'achievements' 
  | 'customize' 
  | 'certificate';

export interface WorldConfig {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  themeColor: string;
  badge: string;
  tables: number[]; // e.g. [2, 5]
  description: string;
  pedagogicalFocus: string; // e.g. "Ideia do dobro e contagem de 5 em 5"
  requiredStars: number;
  totalLevels: number;
}

export interface Question {
  id: string;
  factorA: number;
  factorB: number;
  result: number;
  options: number[];
  promptText: string;
  speechText: string;
  explanation: string;
  visualItems: {
    icon: string;
    rows: number;
    cols: number;
    name: string;
  };
}

export interface MascotSkin {
  id: string;
  name: string;
  emoji: string;
  image?: string;
  color: string;
  unlocked: boolean;
  cost: number;
}

export interface MascotAccessory {
  id: string;
  name: string;
  type: 'hat' | 'cape' | 'glasses';
  emoji: string;
  image?: string;
  cost: number;
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export interface PlayerProgress {
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
  completedLevels: Record<string, number>; // worldId_levelIndex -> stars (1-3)
  unlockedAchievements: string[];
}
