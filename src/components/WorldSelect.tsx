import React from 'react';
import { ArrowLeft, Lock, Play, BookOpen, Flame, Trophy, Sparkles } from 'lucide-react';
import { WORLDS } from '../services/mathEngine';
import { WorldConfig, PlayerProgress, ChallengeMedal } from '../types/game';
import { soundManager } from '../services/sound';
import { CHALLENGE_ICON, CHALLENGE_NAME, CHALLENGE_PRICE } from '../services/challengeConfig';
import { isChallengeAvailable, canBuyChallenge, challengeTitleForMedal } from '../services/progress';

interface WorldSelectProps {
  progress: PlayerProgress;
  onSelectWorld: (world: WorldConfig) => void;
  onBuyChallenge: () => void;
  onEnterChallenge: () => void;
  onBack: () => void;
}

const MEDAL_ICONS: Record<ChallengeMedal, string> = {
  none: '—',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

export const WorldSelect: React.FC<WorldSelectProps> = ({
  progress,
  onSelectWorld,
  onBuyChallenge,
  onEnterChallenge,
  onBack,
}) => {
  const completedWorldsCount = WORLDS.filter(
    ({ id }) =>
      Object.hasOwn(progress.completedLevels, id) &&
      Number.isFinite(progress.completedLevels[id]) &&
      progress.completedLevels[id] >= 1
  ).length;
  const challengeAvailable = isChallengeAvailable(progress);
  const canBuy = canBuyChallenge(progress);
  const challengeUnlocked = progress.challenge?.unlocked ?? false;
  const bestMedal: ChallengeMedal = progress.challenge?.bestMedal ?? 'none';
  const bestTitle = challengeTitleForMedal(bestMedal);
  const missingGems = Math.max(0, CHALLENGE_PRICE - progress.gems);
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white/95 rounded-3xl shadow-2xl border-4 border-amber-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-amber-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Menu</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-black font-fun text-slate-900 flex items-center justify-center gap-2">
            <span>🗺️ Mapa dos 5 Reinos da Tabuada</span>
          </h2>
          <span className="text-xs font-bold text-amber-700">Escolha o desafio para iniciar sua corrida!</span>
        </div>

        <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-950 px-3 py-1 rounded-xl font-black text-sm border border-yellow-300">
          <span>⭐ {progress.stars} Estrelas</span>
        </div>
      </div>

      {/* Worlds Grid */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WORLDS.map((world, idx) => {
          const isUnlocked = progress.stars >= world.requiredStars;

          return (
            <div
              key={world.id}
              className={`rounded-3xl p-5 border-2 flex flex-col justify-between transition-all ${
                isUnlocked
                  ? 'border-amber-300 bg-gradient-to-b from-white to-amber-50/50 shadow-md hover:shadow-xl hover:scale-102'
                  : 'border-slate-200 bg-slate-50/80 opacity-70'
              }`}
            >
              <div>
                {/* World Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl p-2 bg-amber-100/60 rounded-2xl">{world.icon}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                      Reino #{idx + 1}
                    </span>
                  </div>
                </div>

                <h3 className="font-black text-xl font-fun text-slate-900 mb-1">{world.name}</h3>
                <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                  {world.subtitle}
                </h4>

                <p className="text-xs text-slate-600 font-semibold mb-4 leading-relaxed">
                  {world.description}
                </p>

                {/* Focus Badge */}
                <div className="bg-amber-100/50 rounded-xl p-2 text-xs font-bold text-amber-900 mb-4 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Tabuadas: {world.tables.map((t) => `×${t}`).join(', ')}</span>
                </div>
              </div>

              {/* Action Button */}
              {isUnlocked ? (
                <button
                  onClick={() => {
                    soundManager.playCorrect();
                    onSelectWorld(world);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base rounded-2xl shadow flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Entrar no Reino</span>
                </button>
              ) : (
                <div className="w-full py-3 bg-slate-200 text-slate-500 font-black text-xs rounded-2xl flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Precisa de {world.requiredStars} Estrelas</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Special Challenge Realm: Torre dos Mestres */}
      <div className="mt-6 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/70 bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="text-4xl sm:text-5xl p-3 rounded-2xl bg-purple-900/80 border border-amber-400/40 shadow-inner shrink-0">
              {CHALLENGE_ICON}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Reino Desafio
                </span>
                {bestTitle && (
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-purple-800/90 border border-amber-300/50 text-amber-200">
                    {MEDAL_ICONS[bestMedal]} {bestTitle}
                  </span>
                )}
              </div>
              <h3 className="font-black text-xl sm:text-2xl font-fun text-amber-200">
                {CHALLENGE_NAME}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200 font-semibold mt-1 leading-relaxed max-w-xl">
                24 desafios em 3 fases de cálculo avançado, expressões e enigmas — sem múltipla escolha!
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0 md:min-w-[260px]">
            {!challengeUnlocked && !challengeAvailable && (
              <div className="rounded-2xl bg-slate-900/80 border border-purple-400/30 px-4 py-3 text-center md:text-right">
                <p className="text-xs sm:text-sm font-black text-amber-200">
                  🔒 Conclua os 5 reinos para chegar à Torre
                </p>
                <p className="text-xs font-bold text-purple-300 mt-1 tabular-nums">
                  {completedWorldsCount}/{WORLDS.length} reinos
                </p>
              </div>
            )}

            {!challengeUnlocked && challengeAvailable && (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between text-xs font-bold text-purple-200 px-1">
                  <span>Preço: <strong className="text-amber-300 tabular-nums">{CHALLENGE_PRICE} 💎</strong></span>
                  <span>Suas gemas: <strong className="text-cyan-300 tabular-nums">{progress.gems} 💎</strong></span>
                </div>
                {canBuy ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playCorrect();
                      onBuyChallenge();
                    }}
                    className="w-full min-h-[44px] px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Desbloquear por {CHALLENGE_PRICE} 💎</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full min-h-[44px] px-4 py-3 bg-slate-700/80 text-slate-300 border border-slate-500/50 font-black text-sm rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="tabular-nums">Faltam {missingGems} 💎</span>
                  </button>
                )}
              </div>
            )}

            {challengeUnlocked && (
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCorrect();
                    onEnterChallenge();
                  }}
                  className="w-full min-h-[44px] px-5 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Play className="w-5 h-5 fill-slate-950 shrink-0" aria-hidden="true" />
                  <span>Entrar na Torre</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {challengeUnlocked && (
          <div className="mt-4 pt-4 border-t border-purple-400/25 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-purple-900/50 border border-purple-400/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-purple-200 font-bold">Medalha</span>
              <span className="font-black text-base" title={bestTitle ?? 'Sem medalha'}>
                {MEDAL_ICONS[bestMedal]}
              </span>
            </div>
            <div className="bg-purple-900/50 border border-purple-400/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-purple-200 font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" /> Recorde
              </span>
              <span className="font-black text-amber-200 tabular-nums">
                {progress.challenge?.bestScore ?? 0}
              </span>
            </div>
            <div className="bg-purple-900/50 border border-purple-400/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-purple-200 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" aria-hidden="true" /> Sequência
              </span>
              <span className="font-black text-amber-200 tabular-nums">
                {progress.challenge?.bestStreak ?? 0}
              </span>
            </div>
            <div className="bg-purple-900/50 border border-purple-400/20 rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-purple-200 font-bold">Tentativas</span>
              <span className="font-black text-purple-100 tabular-nums">
                {progress.challenge?.attempts ?? 0}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
