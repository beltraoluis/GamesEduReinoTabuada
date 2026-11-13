import React, { useState } from 'react';
import { Sparkles, RotateCw, Volume2, HelpCircle, ArrowLeft, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { soundManager } from '../services/sound';
import confetti from 'canvas-confetti';

interface VisualLabProps {
  onBack: () => void;
  onExploreAchievement?: () => void;
}

const ITEMS = [
  { icon: '🍎', name: 'Maçãs' },
  { icon: '⭐', name: 'Estrelas' },
  { icon: '🍓', name: 'Morangos' },
  { icon: '🚀', name: 'Foguetes' },
  { icon: '🍬', name: 'Docinhos' },
  { icon: '🥕', name: 'Cenouras' },
];

const SECRETS: Record<number, { title: string; hint: string; icon: string }> = {
  1: {
    title: 'O Espelho Mágico',
    hint: 'Qualquer número vezes 1 é ele mesmo! É como se olhar no espelho!',
    icon: '🪞',
  },
  2: {
    title: 'O Poder do Dobro',
    hint: 'Multiplicar por 2 é somar o número com ele mesmo (o DOBRO). Todos os resultados são números PARES!',
    icon: '✌️',
  },
  3: {
    title: 'O Triplo Saltitante',
    hint: 'É o TRIPLO! Imagine um triângulo com 3 lados ou um coelhinho dando 3 saltos iguais.',
    icon: '🔺',
  },
  4: {
    title: 'O Dobro do Dobro',
    hint: 'Truque Ninja: Para multiplicar por 4, faça o dobro e depois dobre de novo! Exemplo: 4 × 6 = dobro de 6 é 12, dobro de 12 é 24!',
    icon: '🐾',
  },
  5: {
    title: 'O Toque de Cinco',
    hint: 'Regra de Ouro: Todo resultado da tabuada do 5 termina SEMPRE em 0 ou em 5! É como contar com os dedos das mãos!',
    icon: '🖐️',
  },
  6: {
    title: 'Irmão Mais Velho do 3',
    hint: 'O 6 é o dobro do 3! Se souber quanto é 3 × algo, basta dobrar a resposta!',
    icon: '🎲',
  },
  7: {
    title: 'As 7 Cores do Arco-Íris',
    hint: 'Uma semana tem 7 dias e o arco-íris tem 7 cores. 7 × 3 são 3 semanas completas = 21 dias!',
    icon: '🌈',
  },
  8: {
    title: 'O Polvo dos 8 Braços',
    hint: 'O 8 é o dobro do 4! Ou seja: dobre 3 vezes seguidas! (ex: 8 × 3 = 3 → 6 → 12 → 24!)',
    icon: '🐙',
  },
  9: {
    title: 'O Incrível Truque das Mãos',
    hint: 'Mágica pura: na tabuada do 9, se você somar os dois dígitos do resultado sempre dá 9! Exemplo: 9 × 2 = 18 (1+8=9), 9 × 5 = 45 (4+5=9)!',
    icon: '✨',
  },
  10: {
    title: 'O Zero Encantado',
    hint: 'A mais fácil de todas! Basta pegar o número e colar um zero (0) na frente dele! Exemplo: 7 × 10 = 70!',
    icon: '🎈',
  },
};

export const VisualLab: React.FC<VisualLabProps> = ({ onBack, onExploreAchievement }) => {
  const [table, setTable] = useState<number>(3);
  const [multiplier, setMultiplier] = useState<number>(4);
  const [selectedItemIdx, setSelectedItemIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [activePracticeTab, setActivePracticeTab] = useState<'matrix' | 'flashcards'>('matrix');

  // Flashcards state
  const [flashFactor, setFlashFactor] = useState<number>(1);
  const [showFlashAnswer, setShowFlashAnswer] = useState<boolean>(false);

  const currentItem = ITEMS[selectedItemIdx];
  const rows = isFlipped ? multiplier : table;
  const cols = isFlipped ? table : multiplier;
  const total = rows * cols;
  const secret = SECRETS[table] || SECRETS[2];

  const handleSpeech = () => {
    soundManager.speak(`${rows} vezes ${cols} é igual a ${total}.`);
  };

  const handleFlip = () => {
    soundManager.playBloop(600);
    setIsFlipped(!isFlipped);
  };

  const handleNextFlashcard = () => {
    soundManager.playBloop(500);
    setShowFlashAnswer(false);
    setFlashFactor((prev) => (prev % 10) + 1);
  };

  const handleRevealFlash = () => {
    soundManager.playCorrect();
    setShowFlashAnswer(true);
    confetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.7 },
    });
    if (onExploreAchievement) onExploreAchievement();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white/95 rounded-3xl shadow-2xl border-4 border-amber-300 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-amber-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Voltar ao Menu</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-900 font-fun flex items-center justify-center gap-2">
            <span>🔬 Laboratório da Tabuada</span>
          </h2>
          <p className="text-sm font-semibold text-amber-700">Veja a multiplicação acontecer na prática!</p>
        </div>

        {/* View Switcher */}
        <div className="flex rounded-2xl bg-amber-100 p-1">
          <button
            onClick={() => setActivePracticeTab('matrix')}
            className={`px-3 py-1.5 rounded-xl font-bold text-sm transition-all ${
              activePracticeTab === 'matrix' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800'
            }`}
          >
            <Layers className="w-4 h-4 inline mr-1" />
            Matriz Visual
          </button>
          <button
            onClick={() => setActivePracticeTab('flashcards')}
            className={`px-3 py-1.5 rounded-xl font-bold text-sm transition-all ${
              activePracticeTab === 'flashcards' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-800'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Cartas Mágicas
          </button>
        </div>
      </div>

      {/* Select Table Bar */}
      <div className="my-5">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
          Escolha a Tabuada para Explorar:
        </label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => {
                soundManager.playBloop(300 + num * 30);
                setTable(num);
                setIsFlipped(false);
              }}
              className={`py-2 text-center rounded-xl font-black text-lg transition-all ${
                table === num
                  ? 'bg-amber-500 text-white scale-105 shadow-md ring-2 ring-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900'
              }`}
            >
              × {num}
            </button>
          ))}
        </div>
      </div>

      {activePracticeTab === 'matrix' ? (
        <div className="space-y-6">
          {/* Controls: Multiplier & Item Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-700">Multiplicar por:</span>
                <span className="text-xl font-black text-amber-600 bg-white px-3 py-0.5 rounded-lg border border-amber-200">
                  {multiplier}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={multiplier}
                onChange={(e) => {
                  setMultiplier(parseInt(e.target.value));
                  soundManager.playBloop(450);
                }}
                className="w-full accent-amber-500 cursor-pointer h-3 bg-amber-200 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500 font-bold mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <span className="text-sm font-bold text-slate-700 block mb-2">Tema das Figurinhas:</span>
              <div className="flex flex-wrap gap-2">
                {ITEMS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundManager.playBloop(500);
                      setSelectedItemIdx(idx);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-sm font-bold flex items-center gap-1 border transition-all ${
                      selectedItemIdx === idx
                        ? 'bg-white border-amber-500 text-amber-900 shadow-sm scale-105'
                        : 'bg-white/50 border-transparent hover:bg-white text-slate-600'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Big Equation Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl sm:text-5xl font-black font-fun tracking-wide">
                {rows} × {cols} = {total}
              </div>
              <button
                onClick={handleSpeech}
                title="Ouvir em voz alta"
                className="p-2.5 bg-white/20 hover:bg-white/30 rounded-2xl transition-all"
              >
                <Volume2 className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Commutative Property (Propriedade Comutativa) */}
            <button
              onClick={handleFlip}
              className="flex items-center gap-2 bg-white text-orange-600 font-black px-4 py-2 rounded-2xl shadow hover:bg-orange-50 transition-all text-sm"
              title="A ordem dos fatores não altera o produto!"
            >
              <RotateCw className={`w-4 h-4 transition-transform ${isFlipped ? 'rotate-180' : ''}`} />
              <span>Girar: {cols} × {rows} = {total}</span>
            </button>
          </div>

          {/* Repeated Addition Explanation */}
          <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 text-sky-900 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-1">
              Multiplicação como Soma de Parcelas Iguais (BNCC):
            </span>
            <div className="text-lg font-black font-fun flex flex-wrap items-center justify-center gap-2">
              <span>{Array(rows).fill(cols).join(' + ')}</span>
              <span>=</span>
              <span className="text-sky-600 font-extrabold text-xl">{total}</span>
            </div>
            <p className="text-xs text-sky-700 mt-1">
              São <strong>{rows} linhas</strong> com <strong>{cols} {currentItem.name.toLowerCase()}</strong> em cada uma!
            </p>
          </div>

          {/* The Concrete Visual Array Grid */}
          <div className="bg-gradient-to-b from-slate-50 to-amber-50/50 p-6 rounded-3xl border-2 border-dashed border-amber-300 min-h-[220px] flex flex-col items-center justify-center">
            <div className="space-y-2 w-full max-w-lg">
              {Array.from({ length: rows }).map((_, rIdx) => (
                <div
                  key={rIdx}
                  className="flex items-center justify-center gap-2 bg-white/80 p-2 rounded-2xl border border-amber-200/60 shadow-xs hover:bg-white hover:scale-102 transition-all"
                >
                  <span className="text-xs font-black text-amber-600 w-8 text-right">
                    #{rIdx + 1}:
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                    {Array.from({ length: cols }).map((_, cIdx) => (
                      <span
                        key={cIdx}
                        className="text-2xl sm:text-3xl filter drop-shadow hover:scale-125 transition-transform cursor-pointer"
                        title={`${currentItem.name} (${rIdx * cols + cIdx + 1})`}
                      >
                        {currentItem.icon}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-400 w-8 text-left">
                    (+{cols})
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs font-bold text-slate-500">
              Contagem Total: {total} {currentItem.name.toLowerCase()} no total!
            </div>
          </div>

          {/* Secret / Pedagogical Tip Box */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-3xl p-2 bg-white rounded-2xl shadow-sm border border-purple-100">
              {secret.icon}
            </div>
            <div>
              <h4 className="font-extrabold text-purple-900 font-fun text-base flex items-center gap-2">
                <span>{secret.title}</span>
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                  Segredo da Tabuada do {table}
                </span>
              </h4>
              <p className="text-sm font-semibold text-purple-800 mt-1 leading-relaxed">
                {secret.hint}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Flashcards Mode */
        <div className="py-6 flex flex-col items-center">
          <div className="w-full max-w-md bg-gradient-to-b from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl text-center relative overflow-hidden">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
              Carta Mágica · Tabuada do {table}
            </div>

            <div className="text-5xl font-black font-fun my-8 tracking-wider">
              {table} × {flashFactor} = ?
            </div>

            {showFlashAnswer ? (
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 animate-bounce">
                <div className="text-4xl font-extrabold text-yellow-300 font-fun">
                  {table * flashFactor}
                </div>
                <div className="text-xs text-indigo-100 font-bold mt-1">
                  {table} vezes {flashFactor} = {table * flashFactor}!
                </div>
              </div>
            ) : (
              <button
                onClick={handleRevealFlash}
                className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black text-lg rounded-2xl shadow-lg transition-transform active:scale-95"
              >
                🪄 Revelar Resposta
              </button>
            )}

            <div className="mt-6 flex justify-between items-center pt-4 border-t border-indigo-400/40">
              <span className="text-xs text-indigo-200 font-bold">Carta {flashFactor} de 10</span>
              <button
                onClick={handleNextFlashcard}
                className="flex items-center gap-1 text-sm font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-all"
              >
                <span>Próxima Carta</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
