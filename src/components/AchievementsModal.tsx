import React from 'react';
import { ArrowLeft, Award, Star, CheckCircle, Lock, Trophy, Sparkles } from 'lucide-react';
import { ACHIEVEMENTS_LIST, WORLDS } from '../services/mathEngine';
import { PlayerProgress } from '../types/game';
import { soundManager } from '../services/sound';

interface AchievementsModalProps {
  progress: PlayerProgress;
  onOpenCertificate: () => void;
  onBack: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  progress,
  onOpenCertificate,
  onBack,
}) => {
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

        <h2 className="text-2xl font-black font-fun text-slate-900 flex items-center gap-2">
          <span>🏆 Galeria de Conquistas</span>
        </h2>

        <button
          onClick={() => {
            soundManager.playCorrect();
            onOpenCertificate();
          }}
          className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 px-3 py-1.5 rounded-xl font-black text-xs shadow transition-transform active:scale-95"
        >
          <Award className="w-4 h-4" />
          <span>Ver Certificado</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="my-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
          <span className="text-3xl block mb-1">⭐</span>
          <span className="text-2xl font-black text-amber-900">{progress.stars}</span>
          <span className="text-xs font-bold text-amber-700 block uppercase">Estrelas Totais</span>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
          <span className="text-3xl block mb-1">💎</span>
          <span className="text-2xl font-black text-emerald-900">{progress.gems}</span>
          <span className="text-xs font-bold text-emerald-700 block uppercase">Gemas Coletadas</span>
        </div>

        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 text-center">
          <span className="text-3xl block mb-1">🏃‍♂️</span>
          <span className="text-2xl font-black text-sky-900">{progress.highScoreRunner}</span>
          <span className="text-xs font-bold text-sky-700 block uppercase">Recorde Corrida</span>
        </div>

        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-center">
          <span className="text-3xl block mb-1">🎈</span>
          <span className="text-2xl font-black text-purple-900">{progress.highScoreBalloons}</span>
          <span className="text-xs font-bold text-purple-700 block uppercase">Recorde Balões</span>
        </div>
      </div>

      {/* World Badges Showcase */}
      <div className="mb-6">
        <h3 className="text-base font-black font-fun text-slate-800 mb-3 flex items-center gap-2">
          <span>🌿 Medalhas dos 5 Reinos da Tabuada</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {WORLDS.map((world) => {
            const isUnlocked = progress.stars >= world.requiredStars;
            return (
              <div
                key={world.id}
                className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                  isUnlocked
                    ? 'border-amber-300 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="text-3xl p-2 rounded-xl bg-white shadow-xs border border-slate-100">
                  {world.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-xs text-amber-900 font-fun">
                      {world.badge}
                    </span>
                    {isUnlocked && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-xs text-slate-500 font-semibold block">
                    Tabuadas: {world.tables.join(', ')}
                  </span>
                  {!isUnlocked && (
                    <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-0.5">
                      <Lock className="w-3 h-3" /> Precisa de {world.requiredStars} ⭐
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements List */}
      <div>
        <h3 className="text-base font-black font-fun text-slate-800 mb-3 flex items-center gap-2">
          <span>🎖️ Missões & Conquistas Especiais</span>
        </h3>
        <div className="space-y-2.5">
          {ACHIEVEMENTS_LIST.map((ach) => {
            const isUnlocked = progress.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isUnlocked ? 'border-amber-300 bg-amber-50/80' : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <h4 className="font-black text-sm text-slate-800">{ach.title}</h4>
                    <p className="text-xs text-slate-500 font-medium">{ach.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Conquistado!</span>
                    </span>
                  ) : (
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Em progresso
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
