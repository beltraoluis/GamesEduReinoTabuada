import { describe, expect, it } from 'vitest';
import {
  buildFreePlayGemSummary,
  buildGemSummary,
  formatAnswerGems,
  GEM_REWARD_TIP,
} from './gemSummary';
import { FREE_PLAY_SESSION_GEM_CAP } from './rewards';

describe('formatAnswerGems', () => {
  it('formats whole numbers without decimals and fractional values with 1 decimal', () => {
    expect(formatAnswerGems(12)).toBe('12');
    expect(formatAnswerGems(12.04)).toBe('12');
    expect(formatAnswerGems(12.34)).toBe('12.3');
    expect(formatAnswerGems(12.36)).toBe('12.4');
  });

  it('clamps invalid or negative inputs to 0', () => {
    expect(formatAnswerGems(-5)).toBe('0');
    expect(formatAnswerGems(Number.NaN)).toBe('0');
  });
});

describe('buildGemSummary', () => {
  it('returns full floored gems and no penalty/cap note when wrongAnswers is 0', () => {
    const summary = buildGemSummary(45.8, 0);
    expect(summary).toEqual({
      rawGems: 45.8,
      wrongAnswers: 0,
      penaltyPercent: 0,
      finalGems: 45,
      wasCapped: false,
      penaltyNote: null,
      capNote: null,
      tipText: GEM_REWARD_TIP,
    });
  });

  it('applies 10% penalty for 1 wrong answer with singular wording', () => {
    const summary = buildGemSummary(100, 1);
    expect(summary.penaltyPercent).toBe(10);
    expect(summary.finalGems).toBe(90);
    expect(summary.wasCapped).toBe(false);
    expect(summary.capNote).toBeNull();
    expect(summary.penaltyNote).toBe('Você errou 1 vez: −10% 💎');
  });

  it('applies 30% penalty for 3 wrong answers with plural wording', () => {
    const summary = buildGemSummary(100, 3);
    expect(summary.penaltyPercent).toBe(30);
    expect(summary.finalGems).toBe(70);
    expect(summary.penaltyNote).toBe('Você errou 3 vezes: −30% 💎');
  });

  it('caps penalty at 100% and floors final gems to 0 when wrongAnswers >= 10', () => {
    const summary = buildGemSummary(80, 12);
    expect(summary.penaltyPercent).toBe(100);
    expect(summary.finalGems).toBe(0);
    expect(summary.penaltyNote).toBe('Você errou 12 vezes: −100% 💎');
  });
});

describe('buildFreePlayGemSummary', () => {
  it('does not show capNote when under or equal to the 60-gem cap', () => {
    const under = buildFreePlayGemSummary(35.9, 0);
    expect(under.finalGems).toBe(35);
    expect(under.wasCapped).toBe(false);
    expect(under.capNote).toBeNull();

    const exact = buildFreePlayGemSummary(60, 0);
    expect(exact.finalGems).toBe(FREE_PLAY_SESSION_GEM_CAP);
    expect(exact.wasCapped).toBe(false);
    expect(exact.capNote).toBeNull();
  });

  it('caps finalGems at 60 and includes friendly capNote when uncapped gems exceed 60', () => {
    const capped = buildFreePlayGemSummary(100, 1); // 90 > 60
    expect(capped.finalGems).toBe(FREE_PLAY_SESSION_GEM_CAP);
    expect(capped.wasCapped).toBe(true);
    expect(capped.capNote).toBe(`Limite de ${FREE_PLAY_SESSION_GEM_CAP} 💎 por partida`);
    expect(capped.penaltyNote).toBe('Você errou 1 vez: −10% 💎');
  });
});
