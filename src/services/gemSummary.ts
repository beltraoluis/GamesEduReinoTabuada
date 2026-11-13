import {
  FREE_PLAY_SESSION_GEM_CAP,
  WRONG_ANSWER_GEM_PENALTY,
  finalizeFreePlayGems,
  finalizeGems,
} from './rewards';

export const GEM_REWARD_TIP = 'Respostas rápidas e perguntas difíceis rendem mais gemas!';

export interface GemSummary {
  rawGems: number;
  wrongAnswers: number;
  penaltyPercent: number;
  finalGems: number;
  wasCapped: boolean;
  penaltyNote: string | null;
  capNote: string | null;
  tipText: string;
}

export interface BuildGemSummaryOptions {
  sessionCap?: number;
  finalizer?: (rawGems: number, wrongAnswers: number) => number;
}

/** Format a single-answer gem reward cleanly for kids (integer or 1 decimal place). */
export function formatAnswerGems(gems: number): string {
  const safe = Number.isFinite(gems) ? Math.max(0, gems) : 0;
  const rounded = Math.round(safe * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/** Build the end-of-round gem summary from accumulated raw gems and error/timeout count. */
export function buildGemSummary(
  rawGems: number,
  wrongAnswers: number,
  options?: BuildGemSummaryOptions
): GemSummary {
  const raw = Number.isFinite(rawGems) ? Math.max(0, rawGems) : 0;
  const wrong = Number.isFinite(wrongAnswers) ? Math.max(0, Math.trunc(wrongAnswers)) : 0;
  const penaltyPercent = Math.min(100, Math.round(wrong * WRONG_ANSWER_GEM_PENALTY * 100));
  const uncappedFinal = finalizeGems(raw, wrong);
  const sessionCap = options?.sessionCap;
  const finalGems = options?.finalizer
    ? options.finalizer(raw, wrong)
    : sessionCap !== undefined
    ? Math.min(sessionCap, uncappedFinal)
    : uncappedFinal;
  const wasCapped = sessionCap !== undefined && uncappedFinal > finalGems;
  const penaltyNote =
    wrong > 0
      ? `Você errou ${wrong} ${wrong === 1 ? 'vez' : 'vezes'}: −${penaltyPercent}% 💎`
      : null;
  const capNote = wasCapped ? `Limite de ${sessionCap} 💎 por partida` : null;

  return {
    rawGems: raw,
    wrongAnswers: wrong,
    penaltyPercent,
    finalGems,
    wasCapped,
    penaltyNote,
    capNote,
    tipText: GEM_REWARD_TIP,
  };
}

/** Build the end-of-round gem summary for free-play modes using the 60-gem session cap. */
export function buildFreePlayGemSummary(rawGems: number, wrongAnswers: number): GemSummary {
  return buildGemSummary(rawGems, wrongAnswers, {
    sessionCap: FREE_PLAY_SESSION_GEM_CAP,
    finalizer: finalizeFreePlayGems,
  });
}
