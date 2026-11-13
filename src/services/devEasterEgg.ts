import type { PlayerProgress } from '../types/game';
import { ACCESSORY_HATS, MASCOT_LIST } from './gameData';

const DEV_UNLOCK_NAME = 'yoda';

/**
 * Teste apenas em desenvolvimento: com o nome "yoda", libera todos os
 * mascotes e acessórios. `import.meta.env.DEV` é substituído por `false` no
 * build de produção, então o corpo da função é removido do bundle.
 */
export function applyDevEasterEgg(progress: PlayerProgress): PlayerProgress {
  if (!import.meta.env.DEV) return progress;
  if (progress.playerName.trim().toLowerCase() !== DEV_UNLOCK_NAME) return progress;
  return {
    ...progress,
    unlockedMascots: MASCOT_LIST.map((m) => m.id),
    unlockedAccessories: ACCESSORY_HATS.map((h) => h.id),
  };
}
