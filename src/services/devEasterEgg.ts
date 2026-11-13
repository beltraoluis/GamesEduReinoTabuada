import type { PlayerProgress } from '../types/game';
import { ACCESSORY_HATS, DEFAULT_PROGRESS, MASCOT_LIST } from './gameData';

const DEV_UNLOCK_NAME = 'yoda';
const DEV_RESET_NAME = 'reset';

/**
 * Atalhos apenas para testes em desenvolvimento, acionados pelo nome do aluno:
 * - "yoda": libera todos os mascotes, acessórios e a Torre;
 * - "reset": volta o jogo ao estado original, inclusive o nome padrão.
 *
 * `import.meta.env.DEV` é substituído por `false` no build de produção, então
 * o corpo da função é removido do bundle.
 */
export function applyDevEasterEgg(progress: PlayerProgress): PlayerProgress {
  if (!import.meta.env.DEV) return progress;
  const name = progress.playerName.trim().toLowerCase();
  if (name === DEV_RESET_NAME) return structuredClone(DEFAULT_PROGRESS);
  if (name !== DEV_UNLOCK_NAME) return progress;
  return {
    ...progress,
    challenge: { ...progress.challenge, unlocked: true },
    unlockedMascots: MASCOT_LIST.map((m) => m.id),
    unlockedAccessories: ACCESSORY_HATS.map((h) => h.id),
  };
}
