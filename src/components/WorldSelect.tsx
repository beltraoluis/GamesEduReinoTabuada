import React from 'react';
import { ArrowLeft, Star, Lock, Play, Sparkles, BookOpen } from 'lucide-react';
import { WORLDS } from '../services/mathEngine';
import { WorldConfig, PlayerProgress } from '../types/game';
import { soundManager } from '../services/sound';

interface WorldSelectProps {
  progress: PlayerProgress;
  onSelectWorld: (world: WorldConfig) => void;
  onBack: () => void;
}

export const WorldSelect: React.FC<WorldSelectProps> = ({ progress, onSelectWorld, onBack }) => {
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
    </div>
  );
};
