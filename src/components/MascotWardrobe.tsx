import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Sparkles, Check, Lock, Edit3 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { MASCOT_LIST, ACCESSORY_HATS } from '../services/mathEngine';
import { MascotBadge } from './MascotBadge';
import { soundManager } from '../services/sound';
import { containsProfanity, PROFANITY_MESSAGE } from '../services/profanity';
import confetti from 'canvas-confetti';

interface MascotWardrobeProps {
  playerName: string;
  selectedMascot: string;
  selectedHat: string;
  gems: number;
  unlockedMascots: string[];
  unlockedAccessories: string[];
  onUpdateName: (newName: string) => void;
  onSelectMascot: (mascotId: string) => void;
  onSelectHat: (hatId: string) => void;
  onUnlockMascot: (mascotId: string, cost: number) => void;
  onUnlockAccessory: (hatId: string, cost: number) => void;
  onBack: () => void;
}

export const MascotWardrobe: React.FC<MascotWardrobeProps> = ({
  playerName,
  selectedMascot,
  selectedHat,
  gems,
  unlockedMascots,
  unlockedAccessories,
  onUpdateName,
  onSelectMascot,
  onSelectHat,
  onUnlockMascot,
  onUnlockAccessory,
  onBack,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [shakeCount, setShakeCount] = useState(0);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);

  useEffect(() => {
    if (!editingName && shouldRestoreFocusRef.current) {
      shouldRestoreFocusRef.current = false;
      editButtonRef.current?.focus();
    }
  }, [editingName]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (containsProfanity(tempName)) {
      setNameError(PROFANITY_MESSAGE);
      setShakeCount((prev) => prev + 1);
      soundManager.playWrong();
      inputRef.current?.focus();
      return;
    }
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
      soundManager.playBloop(550);
    }
    setNameError(null);
    shouldRestoreFocusRef.current = true;
    setEditingName(false);
  };

  const handleCancelName = () => {
    setTempName(playerName);
    setNameError(null);
    shouldRestoreFocusRef.current = true;
    setEditingName(false);
  };

  const handleUnlockMascot = (id: string, cost: number) => {
    if (gems >= cost) {
      soundManager.playCorrect();
      confetti({ particleCount: 40, spread: 60 });
      onUnlockMascot(id, cost);
    } else {
      soundManager.playWrong();
    }
  };

  const handleUnlockHat = (id: string, cost: number) => {
    if (gems >= cost) {
      soundManager.playCorrect();
      confetti({ particleCount: 40, spread: 60 });
      onUnlockAccessory(id, cost);
    } else {
      soundManager.playWrong();
    }
  };

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
          <span>👑 Camarim do Mascote</span>
        </h2>

        <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl font-black text-sm border border-emerald-300">
          <span>💎 {gems} Gemas</span>
        </div>
      </div>

      {/* Profile & Current Preview Hero */}
      <div className="my-6 p-6 bg-gradient-to-r from-amber-100 via-orange-50 to-yellow-100 rounded-3xl border-2 border-amber-200 flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="flex flex-col items-center">
          <MascotBadge mascotId={selectedMascot} hatId={selectedHat} size="xl" />
          <span className="text-xs font-black uppercase text-amber-700 mt-2 bg-amber-200/60 px-3 py-1 rounded-full">
            Seu Mascote Atual
          </span>
        </div>

        <div className="flex flex-col items-center sm:items-start">
          {editingName ? (
            <label htmlFor="player-name-input" className="text-xs font-black uppercase text-slate-500">
              Nome do Aluno(a):
            </label>
          ) : (
            <span className="text-xs font-black uppercase text-slate-500">
              Nome do Aluno(a):
            </span>
          )}
          {editingName ? (
            <form onSubmit={handleSaveName} className="flex flex-col gap-2 mt-1 w-full max-w-sm">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={inputRef}
                  id="player-name-input"
                  type="text"
                  maxLength={20}
                  value={tempName}
                  onChange={(e) => {
                    setTempName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCancelName();
                    }
                  }}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'name-profanity-error' : undefined}
                  className={`flex-1 min-w-[160px] min-h-[44px] bg-white border-2 ${
                    nameError ? 'border-rose-400' : 'border-amber-400'
                  } rounded-xl px-3.5 py-2 font-bold text-slate-800 focus:outline-none`}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 active:scale-95 transition-transform"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelName}
                    className="min-h-[44px] px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 active:scale-95 transition-transform"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {nameError && (
                  <motion.div
                    id="name-profanity-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      key={shakeCount}
                      animate={{ x: [0, -6, 6, -4, 4, 0] }}
                      transition={{ duration: 0.35 }}
                      className="flex items-start gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-bold text-rose-800 shadow-sm"
                    >
                      <span aria-hidden="true" className="text-base leading-snug shrink-0">💛</span>
                      <span>{nameError}</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black font-fun text-slate-900">{playerName}</span>
              <button
                ref={editButtonRef}
                onClick={() => {
                  setTempName(playerName);
                  setNameError(null);
                  setEditingName(true);
                }}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-100"
                title="Mudar meu nome"
                aria-label="Mudar meu nome"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
          <p className="text-xs text-slate-600 font-bold mt-2 max-w-xs">
            Acumule gemas completando os desafios de tabuada para desbloquear novos mascotes e chapéus incríveis!
          </p>
        </div>
      </div>

      {/* Select Mascot Grid */}
      <div className="mb-6">
        <h3 className="text-base font-black font-fun text-slate-800 mb-3 flex items-center gap-2">
          <span>🐾 Escolha seu Amiguinho</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {MASCOT_LIST.map((m) => {
            const isUnlocked = unlockedMascots.includes(m.id);
            const isSelected = selectedMascot === m.id;

            return (
              <div
                key={m.id}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/80 shadow-md ring-2 ring-amber-300'
                    : 'border-slate-200 bg-white hover:border-amber-200'
                }`}
              >
                <span className="text-4xl mb-1">{m.emoji}</span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{m.name.split(',')[0]}</span>

                {isUnlocked ? (
                  <button
                    onClick={() => {
                      soundManager.playBloop(450);
                      onSelectMascot(m.id);
                    }}
                    className={`mt-2 w-full py-1 text-xs font-black rounded-lg transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'Escolhido' : 'Escolher'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnlockMascot(m.id, m.cost)}
                    className="mt-2 w-full py-1 text-xs font-black rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{m.cost} 💎</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Select Hat / Accessories Grid */}
      <div>
        <h3 className="text-base font-black font-fun text-slate-800 mb-3 flex items-center gap-2">
          <span>🎩 Chapéus & Acessórios</span>
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACCESSORY_HATS.map((hat) => {
            const isUnlocked = unlockedAccessories.includes(hat.id);
            const isSelected = selectedHat === hat.id;

            return (
              <div
                key={hat.id}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/80 shadow-md ring-2 ring-indigo-300'
                    : 'border-slate-200 bg-white hover:border-indigo-200'
                }`}
              >
                {hat.image ? (
                  <img
                    src={hat.image}
                    alt={hat.name}
                    draggable={false}
                    className="w-9 h-9 object-contain mb-1 select-none"
                  />
                ) : (
                  <span className="text-3xl mb-1">{hat.emoji}</span>
                )}
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{hat.name}</span>

                {isUnlocked ? (
                  <button
                    onClick={() => {
                      soundManager.playBloop(450);
                      onSelectHat(hat.id);
                    }}
                    className={`mt-2 w-full py-1 text-xs font-black rounded-lg transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'Usando' : 'Equipar'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnlockHat(hat.id, hat.cost)}
                    className="mt-2 w-full py-1 text-xs font-black rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    <span>{hat.cost} 💎</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
