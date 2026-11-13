import React, { useEffect } from 'react';
import { Play, Sparkles, BookOpen, Award, User, Volume2, HelpCircle } from 'lucide-react';
import { MascotBadge } from './MascotBadge';
import { soundManager } from '../services/sound';
import { PlayerProgress, WorldConfig } from '../types/game';
import { WORLDS } from '../services/mathEngine';

interface TitleScreenProps {
  progress: PlayerProgress;
  onStartAdventure: (world: WorldConfig) => void;
  onStartBalloons: () => void;
  onStartCauldron: () => void;
  onOpenLab: () => void;
  onOpenWardrobe: () => void;
  onOpenAchievements: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  progress,
  onStartAdventure,
  onStartBalloons,
  onStartCauldron,
  onOpenLab,
  onOpenWardrobe,
  onOpenAchievements,
}) => {
  // Listen for Space or Enter to quickly start the main adventure
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        soundManager.playCorrect();
        onStartAdventure(WORLDS[0]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartAdventure]);

  return (
    <div className="relative w-full min-h-[620px] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300 flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-sky-400 via-indigo-500 to-purple-800 text-white select-none">
      {/* Live World Atmosphere: Floating Animated Clouds, Numbers and Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 left-8 text-5xl animate-float">☁️</div>
        <div className="absolute top-20 right-12 text-6xl animate-float" style={{ animationDelay: '1.2s' }}>
          ☁️
        </div>
        <div className="absolute top-1/3 left-1/4 text-3xl animate-float" style={{ animationDelay: '2s' }}>
          ✨
        </div>
        <div className="absolute bottom-1/4 right-1/5 text-4xl animate-float" style={{ animationDelay: '0.6s' }}>
          ⭐
        </div>
        <div className="absolute top-1/2 left-10 text-2xl font-black font-fun text-yellow-200 animate-pulse">
          3 × 4 = 12
        </div>
        <div className="absolute top-1/3 right-10 text-2xl font-black font-fun text-yellow-200 animate-pulse" style={{ animationDelay: '1.5s' }}>
          5 × 5 = 25
        </div>
        <div className="absolute bottom-20 left-1/3 text-2xl font-black font-fun text-yellow-200 animate-pulse" style={{ animationDelay: '0.8s' }}>
          7 × 2 = 14
        </div>
      </div>

      {/* Top Bar with Player Status & Shortcuts */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        {/* Player Profile pill */}
        <button
          onClick={() => {
            soundManager.playBloop(450);
            onOpenWardrobe();
          }}
          className="flex items-center gap-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-sm transition-all"
        >
          <MascotBadge mascotId={progress.selectedMascot} hatId={progress.selectedHat} size="sm" />
          <div className="text-left">
            <span className="text-xs font-bold text-amber-200 block uppercase leading-none">Aluno(a)</span>
            <span className="text-base font-black font-fun text-white leading-none mt-1">
              {progress.playerName}
            </span>
          </div>
        </button>

        {/* Currency & Stars Cluster */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playBloop(450);
              onOpenAchievements();
            }}
            className="flex items-center gap-1.5 bg-yellow-400/90 hover:bg-yellow-400 text-yellow-950 font-black text-sm px-3.5 py-1.5 rounded-2xl shadow-sm transition-transform active:scale-95"
          >
            <span>⭐</span>
            <span className="tabular-nums">{progress.stars} Estrelas</span>
          </button>

          <button
            onClick={() => {
              soundManager.playBloop(450);
              onOpenWardrobe();
            }}
            className="flex items-center gap-1.5 bg-emerald-400/90 hover:bg-emerald-400 text-emerald-950 font-black text-sm px-3.5 py-1.5 rounded-2xl shadow-sm transition-transform active:scale-95"
          >
            <span>💎</span>
            <span className="tabular-nums">{progress.gems} Gemas</span>
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke inline SVG Title Lockup */}
      <div className="relative z-10 flex flex-col items-center justify-center my-4 sm:my-6 text-center">
        {/* Bespoke inline SVG Title Lockup */}
        <div className="w-full max-w-lg mb-2">
          <svg viewBox="0 0 540 130" className="w-full filter drop-shadow-xl overflow-visible">
            <defs>
              <linearGradient id="goldTitle" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFF275" />
                <stop offset="50%" stopColor="#FFAA00" />
                <stop offset="100%" stopColor="#E67E00" />
              </linearGradient>
              <linearGradient id="subTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#67E8F9" />
                <stop offset="100%" stopColor="#A5B4FC" />
              </linearGradient>
              <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* Sparkle Icons in title */}
            <text x="25" y="45" fontSize="24" fill="#FFDF00">✨</text>
            <text x="500" y="45" fontSize="24" fill="#FFDF00">✨</text>
            <text x="270" y="24" fontSize="26" textAnchor="middle" fill="#FFD700">👑</text>

            {/* Main Title Text with 3D Effect */}
            <text
              x="270"
              y="68"
              textAnchor="middle"
              fontFamily="'Fredoka', cursive, sans-serif"
              fontSize="44"
              fontWeight="900"
              fill="#5B2100"
              stroke="#5B2100"
              strokeWidth="10"
              strokeLinejoin="round"
            >
              REINO DA TABUADA
            </text>
            <text
              x="270"
              y="68"
              textAnchor="middle"
              fontFamily="'Fredoka', cursive, sans-serif"
              fontSize="44"
              fontWeight="900"
              fill="url(#goldTitle)"
              stroke="#FFF"
              strokeWidth="2"
            >
              REINO DA TABUADA
            </text>

            {/* Subtitle Badge */}
            <rect x="80" y="84" width="380" height="36" rx="18" fill="#1E1B4B" opacity="0.85" />
            <rect x="83" y="87" width="374" height="30" rx="15" fill="none" stroke="#FDE047" strokeWidth="2" strokeDasharray="4 3" />
            <text
              x="270"
              y="102"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="'Nunito', sans-serif"
              fontSize="15"
              fontWeight="900"
              letterSpacing="1.5"
              fill="#FDE047"
            >
              AVENTURA MÁGICA · 3º ANO
            </text>
          </svg>
        </div>

        {/* Mascot Centerpiece */}
        <div
          onClick={() => {
            soundManager.playBloop(600);
            soundManager.speak(`Olá ${progress.playerName}! Vamos jogar a tabuada juntos?`);
          }}
          className="cursor-pointer group flex flex-col items-center my-1"
          title="Clique para ouvir o mascote!"
        >
          <div className="transform group-hover:scale-115 transition-transform duration-300">
            <MascotBadge mascotId={progress.selectedMascot} hatId={progress.selectedHat} size="lg" />
          </div>
          <span className="text-xs font-bold text-indigo-200 mt-1 group-hover:text-yellow-300 transition-colors">
            Toque no amiguinho para ouvir! 💬
          </span>
        </div>

        {/* Big Start CTA Button */}
        <button
          onClick={() => {
            soundManager.playCorrect();
            onStartAdventure(WORLDS[0]);
          }}
          className="mt-4 px-8 py-4 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-yellow-950 font-black text-xl sm:text-2xl rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-4 border-white/80 game-btn"
        >
          <Play className="w-7 h-7 fill-yellow-950" />
          <span>JOGAR AGORA!</span>
          <span className="text-xs bg-yellow-950/20 px-2 py-1 rounded-xl text-yellow-950 font-extrabold uppercase hidden sm:inline">
            Espaço
          </span>
        </button>
      </div>

      {/* Mode Navigation Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
        {/* Adventure / Worlds Mode */}
        <button
          onClick={() => {
            soundManager.playBloop(450);
            onStartAdventure(WORLDS[0]);
          }}
          className="p-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/30 text-left transition-all hover:scale-102 flex flex-col justify-between group"
        >
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">🏃‍♂️</div>
          <div>
            <h4 className="font-black text-sm font-fun text-yellow-300">Corrida dos Reinos</h4>
            <p className="text-[11px] text-indigo-100 font-semibold line-clamp-2">
              Desvie e passe pelos portais com a tabuada certa!
            </p>
          </div>
        </button>

        {/* Balloon Pop Mode */}
        <button
          onClick={() => {
            soundManager.playBloop(450);
            onStartBalloons();
          }}
          className="p-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/30 text-left transition-all hover:scale-102 flex flex-col justify-between group"
        >
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">🎈</div>
          <div>
            <h4 className="font-black text-sm font-fun text-yellow-300">Festa dos Balões</h4>
            <p className="text-[11px] text-indigo-100 font-semibold line-clamp-2">
              Estoure balões coloridos contra o relógio!
            </p>
          </div>
        </button>

        {/* Potion Cauldron Mode */}
        <button
          onClick={() => {
            soundManager.playBloop(450);
            onStartCauldron();
          }}
          className="p-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/30 text-left transition-all hover:scale-102 flex flex-col justify-between group"
        >
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">🧪</div>
          <div>
            <h4 className="font-black text-sm font-fun text-yellow-300">Caldeirão Mágico</h4>
            <p className="text-[11px] text-indigo-100 font-semibold line-clamp-2">
              Prepare poções somando ingredientes mágicos!
            </p>
          </div>
        </button>

        {/* Visual Laboratory */}
        <button
          onClick={() => {
            soundManager.playBloop(450);
            onOpenLab();
          }}
          className="p-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl border border-white/30 text-left transition-all hover:scale-102 flex flex-col justify-between group"
        >
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">🔬</div>
          <div>
            <h4 className="font-black text-sm font-fun text-yellow-300">Laboratório Visual</h4>
            <p className="text-[11px] text-indigo-100 font-semibold line-clamp-2">
              Aprenda com matrizes, desenhos e segredos!
            </p>
          </div>
        </button>
      </div>

      {/* Flat Control-Hint Line as required by Game Craft */}
      <div className="relative z-10 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between text-[11px] font-black text-indigo-200 uppercase tracking-wider">
        <span>Controles: A S D: Pistas · ← →: Mover · Espaço: Jogar</span>
        <span className="text-yellow-300 font-bold">Currículo BNCC Ensino Fundamental 1 · 3º Ano</span>
      </div>
    </div>
  );
};
