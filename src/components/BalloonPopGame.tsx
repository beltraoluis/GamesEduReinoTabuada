import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Volume2, Timer, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { Question } from '../types/game';
import { generateQuestion } from '../services/mathEngine';
import { soundManager } from '../services/sound';
import confetti from 'canvas-confetti';

interface Balloon {
  id: string;
  value: number;
  x: number; // percentage 5% to 85%
  y: number; // percentage from bottom 0% to 100%
  speed: number;
  color: string;
  isBonus?: boolean;
}

const BALLOON_COLORS = [
  'from-rose-400 to-rose-600 border-rose-300',
  'from-sky-400 to-sky-600 border-sky-300',
  'from-amber-400 to-amber-600 border-amber-300',
  'from-emerald-400 to-emerald-600 border-emerald-300',
  'from-purple-400 to-purple-600 border-purple-300',
  'from-pink-400 to-pink-600 border-pink-300',
];

interface BalloonPopGameProps {
  onBack: () => void;
  onFinishGame: (score: number, gems: number) => void;
}

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({ onBack, onFinishGame }) => {
  const [selectedTables, setSelectedTables] = useState<number[]>([2, 3, 4, 5]);
  const [question, setQuestion] = useState<Question>(() => generateQuestion([2, 3, 4, 5]));
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [totalPopped, setTotalPopped] = useState<number>(0);
  const [speedToast, setSpeedToast] = useState<string | null>(null);

  const requestRef = useRef<number | null>(null);
  const questionStartTimeRef = useRef<number>(performance.now());

  // Generate balloons whenever the question changes
  const spawnBalloonsForQuestion = useCallback((q: Question) => {
    // 1 correct answer balloon, 3 distractors
    const values = [...q.options];
    // Add one extra distractor if needed
    if (values.length < 4) {
      values.push(q.result + (Math.random() > 0.5 ? 3 : -3));
    }

    const newBalloons: Balloon[] = values.map((val, idx) => ({
      id: `b_${Date.now()}_${idx}`,
      value: val,
      x: 10 + idx * 22 + (Math.random() * 8 - 4),
      y: -10 - idx * 12,
      // 30% slower rising speed
      speed: (12 + Math.random() * 8) * 0.7,
      color: BALLOON_COLORS[idx % BALLOON_COLORS.length],
    }));

    setBalloons(newBalloons);
  }, []);

  useEffect(() => {
    questionStartTimeRef.current = performance.now();
    spawnBalloonsForQuestion(question);
    soundManager.speak(`Encontre o balão com o resultado de: ${question.speechText}`);
  }, [question, spawnBalloonsForQuestion]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsGameOver(true);
          soundManager.playVictory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGameOver]);

  // Balloons rise animation loop
  useEffect(() => {
    if (isGameOver) return;

    let last = performance.now();
    const updateBalloons = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      setBalloons((prev) => {
        return prev.map((b) => {
          let nextY = b.y + b.speed * dt;
          // Wrap around if it floats above top
          if (nextY > 105) {
            nextY = -15;
          }
          return { ...b, y: nextY };
        });
      });

      requestRef.current = requestAnimationFrame(updateBalloons);
    };

    requestRef.current = requestAnimationFrame(updateBalloons);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isGameOver]);

  // Click / Pop handler
  const handlePopBalloon = (balloon: Balloon) => {
    if (isGameOver) return;
    soundManager.playPop();

    if (balloon.value === question.result) {
      soundManager.playCorrect();
      confetti({
        particleCount: 20,
        spread: 60,
        origin: { x: balloon.x / 100, y: (100 - balloon.y) / 100 },
      });

      const newCombo = combo + 1;
      setCombo(newCombo);
      const elapsedSec = (performance.now() - questionStartTimeRef.current) / 1000;
      const speedBonus = elapsedSec < 2 ? 50 : elapsedSec < 4 ? 30 : elapsedSec < 6 ? 15 : 0;
      const points = 100 + newCombo * 15 + speedBonus;
      setScore((prev) => prev + points);
      setTotalPopped((prev) => prev + 1);

      if (speedBonus > 0) {
        setSpeedToast(`⚡ Rápido! +${points} pts`);
        setTimeout(() => setSpeedToast(null), 900);
      }

      // Next Question
      setQuestion((prev) =>
        generateQuestion(selectedTables, 10, { factorA: prev.factorA, factorB: prev.factorB })
      );
    } else {
      soundManager.playWrong();
      setCombo(0);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setCombo(0);
    setTimeLeft(60);
    setTotalPopped(0);
    setIsGameOver(false);
    const newQ = generateQuestion(selectedTables);
    setQuestion(newQ);
  };

  const handleFinish = () => {
    const gems = Math.floor(score / 50);
    onFinishGame(score, gems);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[620px] rounded-3xl overflow-hidden shadow-2xl border-4 border-sky-300 flex flex-col bg-gradient-to-b from-sky-300 via-sky-200 to-amber-100">
      {/* Top Header */}
      <div className="relative z-20 bg-white/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b-2 border-sky-200">
        <button
          onClick={onBack}
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🎈</span>
          <h3 className="text-lg font-black font-fun text-slate-800">Festa dos Balões</h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-sky-100 text-sky-800 px-3 py-1 rounded-xl font-bold text-sm">
            <Timer className="w-4 h-4 text-sky-600" />
            <span className="tabular-nums font-black">{timeLeft}s</span>
          </div>

          <div className="bg-amber-400 text-yellow-950 px-3 py-1 rounded-xl font-black text-sm tabular-nums shadow-sm">
            ⭐ {score} pts
          </div>
        </div>
      </div>

      {/* Question Cloud Banner */}
      <div className="relative z-20 mt-3 mx-4">
        <div className="bg-white/95 rounded-2xl p-3 shadow-lg border-2 border-sky-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
              Estoure o resultado de:
            </span>
            <span className="text-3xl font-black font-fun text-slate-900 tracking-wider">
              {question.promptText}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => soundManager.speak(question.speechText)}
              className="p-2 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-xl"
              title="Ouvir"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            {combo > 1 && (
              <span className="bg-amber-100 text-amber-800 font-black text-xs px-2.5 py-1 rounded-full animate-bounce">
                🔥 {combo}x Combo!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Balloons Playfield */}
      <div className="relative flex-1 w-full overflow-hidden">
        {speedToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-yellow-300 text-yellow-950 font-black text-lg px-4 py-1 rounded-full shadow-lg border-2 border-white animate-bounce pointer-events-none">
            {speedToast}
          </div>
        )}
        {/* Scenery clouds */}
        <div className="absolute top-10 left-12 text-6xl opacity-30 select-none animate-float pointer-events-none">
          ☁️
        </div>
        <div
          className="absolute top-28 right-16 text-5xl opacity-30 select-none animate-float pointer-events-none"
          style={{ animationDelay: '1.2s' }}
        >
          ☁️
        </div>

        {/* Floating Balloons */}
        {balloons.map((balloon) => (
          <button
            key={balloon.id}
            onClick={() => handlePopBalloon(balloon)}
            style={{
              left: `${balloon.x}%`,
              bottom: `${balloon.y}%`,
            }}
            className={`absolute -translate-x-1/2 flex flex-col items-center group cursor-pointer transition-transform hover:scale-110 active:scale-90`}
          >
            {/* Balloon Body */}
            <div
              className={`w-20 h-24 sm:w-24 sm:h-28 rounded-full bg-gradient-to-t ${balloon.color} shadow-xl border-2 flex items-center justify-center relative overflow-hidden`}
              style={{
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
              }}
            >
              {/* Balloon Glare */}
              <div className="absolute top-3 left-3 w-4 h-6 bg-white/40 rounded-full rotate-[-30deg]"></div>

              {/* Number Label */}
              <span className="text-white font-black text-2xl sm:text-3xl font-fun drop-shadow-md select-none">
                {balloon.value}
              </span>
            </div>

            {/* Balloon Knot & String */}
            <div className="w-3 h-2 bg-rose-500 rounded-sm -mt-0.5"></div>
            <div className="w-0.5 h-10 bg-slate-400/80"></div>
          </button>
        ))}
      </div>

      {/* Game Over Summary Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-300">
            <div className="text-6xl mb-2">🎉</div>
            <h3 className="text-3xl font-black font-fun text-slate-900 mb-1">Tempo Esgotado!</h3>
            <p className="text-slate-600 font-bold mb-4">Você foi super veloz e estourou vários balões!</p>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-6 flex justify-around">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">Pontuação</span>
                <span className="text-2xl font-black text-amber-600">{score} pts</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">Acertos</span>
                <span className="text-2xl font-black text-sky-600">{totalPopped} 🎈</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl shadow flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Jogar de Novo</span>
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow"
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
