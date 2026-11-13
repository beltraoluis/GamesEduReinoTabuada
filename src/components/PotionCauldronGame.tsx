import React, { useState, useRef } from 'react';
import { ArrowLeft, Volume2, Sparkles, Wand2, CheckCircle2, RotateCcw } from 'lucide-react';
import { generateQuestion } from '../services/mathEngine';
import { gemsForFreePlayCorrectAnswer, finalizeFreePlayGems } from '../services/rewards';
import { buildFreePlayGemSummary } from '../services/gemSummary';
import { soundManager } from '../services/sound';
import confetti from 'canvas-confetti';

// Reference per-question time limit so answer speed scales gem rewards on alchemy word problems.
const CAULDRON_QUESTION_TIME_LIMIT_SEC = 8;

interface PotionCauldronGameProps {
  onBack: () => void;
  onFinish: (score: number, gems: number) => void;
}

const INGREDIENTS = [
  { name: 'Gotas de Luz Lunar', icon: '💧', color: 'from-blue-400 to-indigo-600' },
  { name: 'Pó de Estrela Cadente', icon: '✨', color: 'from-amber-400 to-yellow-600' },
  { name: 'Folhas de Trevo Encantado', icon: '🍀', color: 'from-emerald-400 to-teal-600' },
  { name: 'Cristais de Fogo Suave', icon: '🔥', color: 'from-rose-400 to-orange-600' },
  { name: 'Pétalas da Flor Risonha', icon: '🌸', color: 'from-pink-400 to-purple-600' },
];

export const PotionCauldronGame: React.FC<PotionCauldronGameProps> = ({ onBack, onFinish }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [question, setQuestion] = useState(() => generateQuestion([2, 3, 4, 5, 6]));
  const [selectedIngredient, setSelectedIngredient] = useState(INGREDIENTS[0]);
  const [score, setScore] = useState<number>(0);
  const [bubbles, setBubbles] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [potionsCompleted, setPotionsCompleted] = useState<number>(0);
  const [rawGems, setRawGems] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const questionStartTimeRef = useRef<number>(performance.now());
  const rawGemsRef = useRef<number>(0);
  const wrongAnswersRef = useRef<number>(0);

  const handleSelectOption = (val: number) => {
    if (bubbles || showSummary) return;
    if (val === question.result) {
      soundManager.playCorrect();
      setBubbles(true);
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.6 },
      });

      const elapsedSec = (performance.now() - questionStartTimeRef.current) / 1000;
      const speedBonus = elapsedSec < 3 ? 50 : elapsedSec < 6 ? 25 : 0;
      const points = 120 + speedBonus;
      const answerGems = gemsForFreePlayCorrectAnswer({
        factorA: question.factorA,
        factorB: question.factorB,
        elapsedSec,
        timeLimitSec: CAULDRON_QUESTION_TIME_LIMIT_SEC,
      });
      const nextRawGems = rawGemsRef.current + answerGems;
      rawGemsRef.current = nextRawGems;
      setRawGems(nextRawGems);

      setScore((prev) => prev + points);
      setPotionsCompleted((prev) => prev + 1);
      setFeedback(
        `✨ Poção Perfeita! ${question.factorA} × ${question.factorB} = ${question.result}! (+${points} pts · +💎${
          speedBonus > 0 ? ` · ⚡ Rapidez +${speedBonus}` : ''
        })`
      );

      setTimeout(() => {
        setBubbles(false);
        setFeedback(null);
        setSelectedIngredient(INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)]);
        setQuestion((prev) =>
          generateQuestion([2, 3, 4, 5, 6, 7, 8], 10, {
            factorA: prev.factorA,
            factorB: prev.factorB,
          })
        );
        questionStartTimeRef.current = performance.now();
        setCurrentLevel((prev) => prev + 1);
      }, 1600);
    } else {
      soundManager.playWrong();
      const nextWrong = wrongAnswersRef.current + 1;
      wrongAnswersRef.current = nextWrong;
      setWrongAnswers(nextWrong);
      setFeedback(`Ops, quase! Tente somar ${question.factorA} vezes o número ${question.factorB}.`);
    }
  };

  const projectedGems = finalizeFreePlayGems(rawGems, wrongAnswers);
  const gemSummary = buildFreePlayGemSummary(rawGems, wrongAnswers);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl border-4 border-purple-400 text-white relative overflow-hidden">
      {/* Decorative stars in background */}
      <div className="absolute top-4 left-6 text-2xl animate-pulse">✨</div>
      <div className="absolute top-10 right-10 text-xl animate-pulse" style={{ animationDelay: '1s' }}>⭐</div>
      <div className="absolute bottom-12 left-10 text-3xl animate-pulse" style={{ animationDelay: '1.5s' }}>🔮</div>

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-purple-700/50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black font-fun text-purple-200 flex items-center justify-center gap-2">
            <span>🧪 O Caldeirão Mágico</span>
          </h2>
          <span className="text-xs font-bold text-purple-300">Poção #{currentLevel}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-purple-800/80 px-3 py-1 rounded-xl border border-purple-500 font-black text-sm">
            <span>⭐ {score} pts</span>
          </div>
          <div
            className="flex items-center gap-1 bg-emerald-900/80 text-emerald-200 px-3 py-1 rounded-xl border border-emerald-400 font-black text-sm tabular-nums"
            data-testid="hud-gems"
            aria-label={`Gemas estimadas na rodada: ${projectedGems}`}
          >
            <span>💎 {projectedGems}</span>
          </div>
        </div>
      </div>

      {/* Recipe Scroll Container */}
      <div className="my-6 max-w-lg mx-auto bg-amber-50 text-amber-950 p-5 rounded-3xl shadow-xl border-4 border-amber-300 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <Wand2 className="w-4 h-4" />
            Receita Mágica de Alquimia
          </span>
          <button
            onClick={() =>
              soundManager.speak(
                `Receita da poção: coloque ${question.factorA} frascos com ${question.factorB} ${selectedIngredient.name} cada. Quanto dá ${question.factorA} vezes ${question.factorB}?`
              )
            }
            className="p-1.5 bg-amber-200 hover:bg-amber-300 rounded-lg text-amber-900"
            title="Ouvir Receita"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <p className="text-base sm:text-lg font-bold leading-relaxed mb-3">
          O mago precisa de <strong>{question.factorA} frascos</strong> contendo <strong>{question.factorB} {selectedIngredient.name}</strong> cada!
        </p>

        <div className="bg-amber-100/70 p-3 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-black text-amber-900">Total necessário:</span>
          <span className="text-2xl sm:text-3xl font-black font-fun text-purple-900 tracking-wider">
            {question.factorA} × {question.factorB} = ?
          </span>
        </div>
      </div>

      {/* Cauldron Centerpiece */}
      <div className="flex flex-col items-center justify-center my-4 relative">
        {/* Bubbles animation */}
        {bubbles && (
          <div className="absolute -top-12 flex gap-4 text-3xl animate-bounce">
            <span>✨</span>
            <span>🌈</span>
            <span>🔮</span>
            <span>⭐</span>
          </div>
        )}

        <div
          className={`w-44 h-40 sm:w-52 sm:h-48 rounded-b-[70px] rounded-t-[30px] border-4 border-slate-700 shadow-2xl relative flex items-center justify-center overflow-hidden transition-all ${
            bubbles
              ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 scale-105'
              : 'bg-gradient-to-b from-purple-800 to-slate-900'
          }`}
        >
          {/* Liquid surface */}
          <div className="absolute top-2 inset-x-3 h-8 bg-purple-400/30 rounded-[50%] blur-xs"></div>

          <span className="text-6xl sm:text-7xl filter drop-shadow select-none">
            {bubbles ? '✨' : '⚗️'}
          </span>
        </div>

        {feedback && (
          <div className="mt-3 text-center text-sm font-black text-yellow-300 animate-pulse bg-purple-950/80 px-4 py-1.5 rounded-full border border-purple-500">
            {feedback}
          </div>
        )}
      </div>

      {/* Ingredient Flasks / Options */}
      <div className="mt-6">
        <span className="block text-center text-xs font-black uppercase tracking-wider text-purple-300 mb-3">
          Selecione o frasco com a quantidade correta para jogar no caldeirão:
        </span>

        <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectOption(option)}
              className="group py-4 px-3 rounded-2xl bg-gradient-to-t from-purple-800 to-purple-600 hover:from-purple-700 hover:to-indigo-500 border-2 border-purple-300 shadow-lg hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center"
            >
              <span className="text-3xl mb-1 group-hover:rotate-12 transition-transform">
                🧪
              </span>
              <span className="text-2xl sm:text-3xl font-black font-fun text-white">
                {option}
              </span>
              <span className="text-[11px] font-bold text-purple-200 mt-1">
                {selectedIngredient.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer / Summary Action */}
      <div className="mt-6 pt-4 border-t border-purple-800 flex justify-between items-center text-xs font-bold text-purple-300">
        <span>Poções preparadas com sucesso: {potionsCompleted}</span>
        <button
          onClick={() => setShowSummary(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold"
        >
          Guardar Poções & Concluir
        </button>
      </div>

      {/* End-of-round Gem Summary Modal */}
      {showSummary && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-purple-400">
            <div className="text-6xl mb-2">🧪</div>
            <h3 className="text-3xl font-black font-fun text-purple-950 mb-1">Poções Guardadas!</h3>
            <p className="text-slate-600 font-bold mb-4">
              Veja o resultado da sua sessão de alquimia:
            </p>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 mb-6">
              <div className="flex justify-around gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Pontuação</span>
                  <span className="text-2xl font-black text-amber-600">{score} pts</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Poções</span>
                  <span className="text-2xl font-black text-purple-700">{potionsCompleted} 🧪</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Gemas Ganhas</span>
                  <span className="text-2xl font-black text-emerald-600">+{gemSummary.finalGems} 💎</span>
                </div>
              </div>
              {gemSummary.penaltyNote && (
                <p className="text-xs font-bold text-rose-600 mt-3">{gemSummary.penaltyNote}</p>
              )}
              {gemSummary.capNote && (
                <p className="text-xs font-bold text-emerald-700 mt-1">{gemSummary.capNote}</p>
              )}
              <p className="text-xs font-semibold text-slate-500 mt-2">{gemSummary.tipText}</p>
              <p className="text-xs font-bold text-purple-800 mt-2">
                Toque em &quot;Salvar &amp; Voltar&quot; para guardar suas gemas! Sair sem salvar descarta as gemas desta rodada.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  questionStartTimeRef.current = performance.now();
                  setShowSummary(false);
                }}
                className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-2xl flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Continuar</span>
              </button>
              <button
                onClick={() => onFinish(score, gemSummary.finalGems)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow"
              >
                Salvar & Voltar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
