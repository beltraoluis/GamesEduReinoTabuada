import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Volume2, Sparkles, Heart, Zap, RefreshCw, Trophy, ArrowRight, Star, Timer } from 'lucide-react';
import { Question, WorldConfig } from '../types/game';
import { generateQuestion, MASCOT_LIST } from '../services/mathEngine';
import { gemsForCorrectAnswer, finalizeGems, WORLD_GEM_MULTIPLIERS } from '../services/rewards';
import { buildGemSummary, formatAnswerGems } from '../services/gemSummary';
import { soundManager } from '../services/sound';
import { MascotBadge } from './MascotBadge';
import confetti from 'canvas-confetti';

interface GameRunnerProps {
  world: WorldConfig;
  mascotId: string;
  hatId: string;
  onFinishRun: (starsEarned: number, gemsEarned: number, score: number) => void;
  onBack: () => void;
}

export const GameRunner: React.FC<GameRunnerProps> = ({
  world,
  mascotId,
  hatId,
  onFinishRun,
  onBack,
}) => {
  const TOTAL_QUESTIONS_PER_STAGE = 7;
  const ROUND_TIMER_SECONDS = 5;
  const LANE_KEYS = ['A', 'S', 'D'] as const;

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question>(() => generateQuestion(world.tables));
  // playerLane starts as null so no option is pre-selected!
  const [playerLane, setPlayerLane] = useState<number | null>(null);
  const [roundPhase, setRoundPhase] = useState<'choosing' | 'returning'>('choosing');
  const [roundTimer, setRoundTimer] = useState<number>(ROUND_TIMER_SECONDS);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [rawGems, setRawGems] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [showHelperFeedback, setShowHelperFeedback] = useState<string | null>(null);
  const [distanceToGate, setDistanceToGate] = useState<number>(100); // 100% down to 0%
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Screen shake and feedback animations
  const [shake, setShake] = useState<boolean>(false);
  const [praiseText, setPraiseText] = useState<string | null>(null);

  // 30% slower speed: 1.2 * 0.70 = 0.84
  const speedRef = useRef<number>(0.84);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const lastSelectTimeRef = useRef<number>(0);
  const returnTimeoutRef = useRef<number | null>(null);
  const roundTimerRef = useRef<number>(ROUND_TIMER_SECONDS);
  const distanceToGateRef = useRef<number>(100);
  const timeoutTriggeredRef = useRef<boolean>(false);
  const questionStartTimeRef = useRef<number>(performance.now());
  const answerElapsedSecRef = useRef<number>(ROUND_TIMER_SECONDS);
  // Retrying a missed question: the answer was just shown in the helper modal, so no speed bonus.
  const isRetryRoundRef = useRef<boolean>(false);
  const speedBonusRef = useRef<number>(0);
  const rawGemsRef = useRef<number>(0);
  const wrongAnswersRef = useRef<number>(0);

  // Clean up return timeout on unmount
  useEffect(() => {
    return () => {
      if (returnTimeoutRef.current !== null) {
        clearTimeout(returnTimeoutRef.current);
      }
    };
  }, []);

  // Read question with speech synthesis when question changes and ensure clean selection state
  useEffect(() => {
    soundManager.speak(currentQuestion.speechText);
    distanceToGateRef.current = 100;
    setDistanceToGate(100);
    setPlayerLane(null); // Always clear previous selection on new question!
    roundTimerRef.current = ROUND_TIMER_SECONDS;
    timeoutTriggeredRef.current = false;
    questionStartTimeRef.current = performance.now();
    answerElapsedSecRef.current = ROUND_TIMER_SECONDS;
    speedBonusRef.current = 0;
    isRetryRoundRef.current = false;
    setRoundTimer(ROUND_TIMER_SECONDS);
  }, [currentQuestion]);

  // Smoothly return mascot to right corner, then advance to the next question or retry the current one
  const returnMascotThenAdvance = useCallback(
    (advanceQuestion = true) => {
      setRoundPhase('returning');
      setPlayerLane(null); // Mascot glides back to the right corner!

      if (returnTimeoutRef.current !== null) {
        clearTimeout(returnTimeoutRef.current);
      }

      returnTimeoutRef.current = window.setTimeout(() => {
        distanceToGateRef.current = 100;
        setDistanceToGate(100);
        roundTimerRef.current = ROUND_TIMER_SECONDS;
        timeoutTriggeredRef.current = false;
        questionStartTimeRef.current = performance.now();
        answerElapsedSecRef.current = ROUND_TIMER_SECONDS;
        speedBonusRef.current = 0;
        setRoundTimer(ROUND_TIMER_SECONDS);
        isRetryRoundRef.current = !advanceQuestion;
        if (advanceQuestion) {
          setQuestionIndex((prev) => prev + 1);
          setCurrentQuestion((prev) =>
            generateQuestion(world.tables, 10, { factorA: prev.factorA, factorB: prev.factorB })
          );
        }
        setRoundPhase('choosing');
        returnTimeoutRef.current = null;
      }, 650);
    },
    [world.tables]
  );

  // Capture speed bonus at the moment the player picks a lane
  const captureSpeedBonus = useCallback(() => {
    const elapsedSec = Math.max(0, (performance.now() - questionStartTimeRef.current) / 1000);
    answerElapsedSecRef.current = elapsedSec;
    if (isRetryRoundRef.current) {
      answerElapsedSecRef.current = ROUND_TIMER_SECONDS;
      speedBonusRef.current = 0;
      return;
    }
    if (distanceToGateRef.current > 14) {
      // Answered before the portals even reached the bottom!
      speedBonusRef.current = elapsedSec <= 2.5 ? 60 : 50;
    } else {
      // Proportional bonus based on remaining seconds in the 5s countdown
      speedBonusRef.current = Math.round((roundTimerRef.current / ROUND_TIMER_SECONDS) * 40);
    }
  }, []);

  // Handle Lane navigation
  const moveLeft = useCallback(() => {
    if (roundPhase !== 'choosing') return;
    soundManager.playBloop(400);
    lastSelectTimeRef.current = performance.now();
    captureSpeedBonus();
    setPlayerLane((prev) => {
      if (prev === null) return 0;
      return Math.max(0, prev - 1);
    });
  }, [captureSpeedBonus, roundPhase]);

  const moveRight = useCallback(() => {
    if (roundPhase !== 'choosing') return;
    soundManager.playBloop(480);
    lastSelectTimeRef.current = performance.now();
    captureSpeedBonus();
    setPlayerLane((prev) => {
      if (prev === null) return 2;
      return Math.min(2, prev + 1);
    });
  }, [captureSpeedBonus, roundPhase]);

  const chooseLane = useCallback(
    (laneIndex: number) => {
      if (roundPhase !== 'choosing') return;
      soundManager.playBloop(420 + laneIndex * 40);
      lastSelectTimeRef.current = performance.now();
      captureSpeedBonus();
      setPlayerLane(laneIndex);
    },
    [captureSpeedBonus, roundPhase]
  );

  // Keyboard navigation: A, S, D directly select lanes; ArrowLeft/ArrowRight move step-by-step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || isVictory || showHelperFeedback || roundPhase !== 'choosing') return;
      const key = e.key.toLowerCase();
      if (key === 'a' || e.key === '1') {
        chooseLane(0);
      } else if (key === 's' || e.key === '2') {
        chooseLane(1);
      } else if (key === 'd' || e.key === '3') {
        chooseLane(2);
      } else if (e.key === 'ArrowLeft') {
        moveLeft();
      } else if (e.key === 'ArrowRight') {
        moveRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, chooseLane, isGameOver, isVictory, showHelperFeedback, roundPhase]);

  // Handle 5s timeout when no lane was chosen in time
  const handleTimeUp = useCallback(() => {
    soundManager.playWrong();
    setShake(true);
    setTimeout(() => setShake(false), 400);
    setStreak(0);
    const nextWrong = wrongAnswersRef.current + 1;
    wrongAnswersRef.current = nextWrong;
    setWrongAnswers(nextWrong);

    const newLives = lives - 1;
    setLives(newLives);
    setShowHelperFeedback(
      `⏰ O tempo de 5s acabou! ${currentQuestion.explanation}`
    );

    if (newLives <= 0) {
      setIsGameOver(true);
    }
  }, [currentQuestion.explanation, lives]);

  // Trigger evaluation when gate reaches player (distance <= 5)
  const evaluateAnswer = useCallback(
    (chosenLane: number) => {
      const chosenValue = currentQuestion.options[chosenLane];
      const isCorrect = chosenValue === currentQuestion.result;

      if (isCorrect) {
        soundManager.playCorrect();
        soundManager.playCoin();

        const newStreak = streak + 1;
        setStreak(newStreak);
        const streakBonus = Math.min(newStreak * 10, 50);
        const speedBonus = speedBonusRef.current;
        const points = 100 + streakBonus + speedBonus;
        const answerGems = gemsForCorrectAnswer({
          factorA: currentQuestion.factorA,
          factorB: currentQuestion.factorB,
          worldMultiplier: WORLD_GEM_MULTIPLIERS[world.id] ?? 1,
          elapsedSec: answerElapsedSecRef.current,
          timeLimitSec: ROUND_TIMER_SECONDS,
        });
        const nextRawGems = rawGemsRef.current + answerGems;
        rawGemsRef.current = nextRawGems;
        setScore((prev) => prev + points);
        setRawGems(nextRawGems);

        // Praise messages showing speed bonus when earned
        const praises = ['Incrível! ⭐', 'Muito Bem! 🚀', 'Genial! ⚡', 'Fantástico! 🌈', 'Mente Brilhante! 💎'];
        const basePraise = praises[Math.min(praises.length - 1, newStreak - 1)];
        const gemLabel = `+${formatAnswerGems(answerGems)} 💎`;
        const fullPraise =
          speedBonus >= 50
            ? `⚡ Super Rápido! +${points} pts · ${gemLabel}`
            : speedBonus > 0
            ? `${basePraise} +${points} pts ⚡ · ${gemLabel}`
            : `${basePraise} +${points} pts · ${gemLabel}`;
        setPraiseText(fullPraise);
        setTimeout(() => setPraiseText(null), 1200);

        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.65 },
        });

        // Next Question or Victory
        if (questionIndex + 1 >= TOTAL_QUESTIONS_PER_STAGE) {
          setPlayerLane(null);
          setRoundPhase('returning');
          setIsVictory(true);
          soundManager.playVictory();
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.5 },
          });
        } else {
          // Return mascot to the right corner before showing next 3 numbers
          returnMascotThenAdvance();
        }
      } else {
        // Wrong answer
        soundManager.playWrong();
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setStreak(0);
        const nextWrong = wrongAnswersRef.current + 1;
        wrongAnswersRef.current = nextWrong;
        setWrongAnswers(nextWrong);

        const newLives = lives - 1;
        setLives(newLives);

        // Friendly educational modal: show explanation
        setShowHelperFeedback(
          `Ops! Você escolheu ${chosenValue}. ${currentQuestion.explanation}`
        );

        if (newLives <= 0) {
          setIsGameOver(true);
        }
      }
    },
    [currentQuestion, lives, questionIndex, returnMascotThenAdvance, streak, world.id]
  );

  // Game Loop for continuous smooth approach of the gates (30% slower) & 5s round timer
  useEffect(() => {
    if (isGameOver || isVictory || showHelperFeedback || isPaused || roundPhase !== 'choosing') return;

    const animateLoop = (time: number) => {
      if (lastTimeRef.current != null) {
        const delta = Math.min((time - lastTimeRef.current) / 1000, 0.05);

        const prevDistance = distanceToGateRef.current;

        if (playerLane === null && prevDistance <= 14) {
          // Portals reached the end of the track — keep them there and start/continue the 5s timer!
          distanceToGateRef.current = 14;
          setDistanceToGate(14);

          if (!timeoutTriggeredRef.current) {
            roundTimerRef.current = Math.max(0, roundTimerRef.current - delta);
            setRoundTimer(roundTimerRef.current);
            if (roundTimerRef.current <= 0) {
              timeoutTriggeredRef.current = true;
              handleTimeUp();
              return;
            }
          }
        } else {
          let nextDistance = prevDistance - delta * (speedRef.current * 18);

          if (playerLane === null && nextDistance <= 14) {
            nextDistance = 14;
          } else if (playerLane !== null && nextDistance <= 5) {
            // Ensure mascot has finished sliding to the lane (~480ms) before evaluating
            const elapsedSinceSelect = performance.now() - lastSelectTimeRef.current;
            if (elapsedSinceSelect < 480) {
              nextDistance = 6;
            } else {
              distanceToGateRef.current = 5;
              setDistanceToGate(5);
              evaluateAnswer(playerLane);
              return;
            }
          }

          distanceToGateRef.current = nextDistance;
          setDistanceToGate(nextDistance);
        }
      }
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animateLoop);
    };

    requestRef.current = requestAnimationFrame(animateLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    };
  }, [evaluateAnswer, handleTimeUp, isGameOver, isPaused, isVictory, playerLane, roundPhase, showHelperFeedback]);

  // Finish handlers
  const handleRestart = () => {
    if (returnTimeoutRef.current !== null) {
      clearTimeout(returnTimeoutRef.current);
      returnTimeoutRef.current = null;
    }
    setQuestionIndex(0);
    setCurrentQuestion(generateQuestion(world.tables));
    setPlayerLane(null); // Clear selection on restart!
    setRoundPhase('choosing');
    roundTimerRef.current = ROUND_TIMER_SECONDS;
    timeoutTriggeredRef.current = false;
    setRoundTimer(ROUND_TIMER_SECONDS);
    setScore(0);
    setStreak(0);
    setLives(3);
    rawGemsRef.current = 0;
    wrongAnswersRef.current = 0;
    answerElapsedSecRef.current = ROUND_TIMER_SECONDS;
    isRetryRoundRef.current = false;
    setRawGems(0);
    setWrongAnswers(0);
    setIsGameOver(false);
    setIsVictory(false);
    setShowHelperFeedback(null);
    distanceToGateRef.current = 100;
    setDistanceToGate(100);
  };

  const projectedGems = finalizeGems(rawGems, wrongAnswers);
  const gemSummary = buildGemSummary(rawGems, wrongAnswers);

  const handleClaimVictory = () => {
    let earnedStars = 1;
    if (lives === 3) earnedStars = 3;
    else if (lives === 2) earnedStars = 2;

    onFinishRun(earnedStars, gemSummary.finalGems, score);
  };

  return (
    <div
      className={`relative w-full max-w-4xl mx-auto h-[620px] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-300 flex flex-col bg-gradient-to-b ${world.themeColor} ${
        shake ? 'animate-wiggle' : ''
      }`}
    >
      {/* Top HUD Cluster */}
      <div className="relative z-20 bg-white/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b-2 border-amber-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            title="Sair da Corrida"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg">{world.icon}</span>
              <span className="font-black text-slate-800 text-sm font-fun">{world.name}</span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Desafio {questionIndex + 1} de {TOTAL_QUESTIONS_PER_STAGE}
            </span>
          </div>
        </div>

        {/* Lives & Streak */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-6 h-6 transition-all ${
                  i < lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-300 fill-slate-200 scale-90'
                }`}
              />
            ))}
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-black text-xs animate-bounce">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Combo {streak}x!</span>
            </div>
          )}

          <div className="bg-amber-400 text-yellow-950 px-3 py-1 rounded-xl font-black text-sm tabular-nums shadow-sm flex items-center gap-1">
            <span>⭐</span>
            <span>{score} pts</span>
          </div>

          <div
            className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-xl font-black text-sm tabular-nums shadow-sm border border-emerald-300 flex items-center gap-1"
            data-testid="hud-gems"
            aria-label={`Gemas estimadas na rodada: ${projectedGems}`}
          >
            <span>💎</span>
            <span>{projectedGems}</span>
          </div>
        </div>
      </div>

      {/* Floating Big Question Banner */}
      <div className="relative z-20 mt-3 mx-4">
        <div className="bg-white/95 rounded-2xl p-3 shadow-lg border-2 border-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
              Pergunta:
            </span>
            <span className="text-2xl sm:text-3xl font-black font-fun text-slate-900 tracking-wider">
              {currentQuestion.promptText}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => soundManager.speak(currentQuestion.speechText)}
              className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl transition-all"
              title="Ouvir Pergunta"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-500 font-bold hidden sm:block">
              Vá para a pista com a resposta certa!
            </div>
          </div>
        </div>
      </div>

      {/* Praise Floating text */}
      {praiseText && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-yellow-300 text-yellow-950 font-black text-2xl px-6 py-2 rounded-2xl shadow-xl animate-bounce border-2 border-white">
          {praiseText}
        </div>
      )}

      {/* The 3D Perspective Road Track */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-end">
        {/* Animated Background clouds and scenery */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-6 left-10 text-4xl animate-float">☁️</div>
          <div className="absolute top-14 right-16 text-3xl animate-float" style={{ animationDelay: '1.5s' }}>
            ☁️
          </div>
          <div className="absolute top-24 left-1/3 text-2xl animate-float" style={{ animationDelay: '0.8s' }}>
            ⭐
          </div>
        </div>

        {/* The 3 Lanes Road */}
        <div className="relative w-full h-[380px] flex justify-center items-end px-4 sm:px-24">
          <div className="w-full max-w-2xl h-full flex relative">
            {/* Road Surface & Portals (overflow-hidden keeps gates clipped to road) */}
            <div className="w-full h-full flex relative rounded-t-3xl overflow-hidden bg-gradient-to-b from-emerald-700/80 via-emerald-600 to-emerald-800 border-x-4 border-t-4 border-amber-200/50 shadow-inner">
              {/* Lane Dividers */}
              <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                <div className="border-r-2 border-dashed border-white/40 h-full"></div>
                <div className="border-r-2 border-dashed border-white/40 h-full"></div>
                <div></div>
              </div>

              {/* Centered Yellow Counter Button/Pill in the middle of the screen — appears only when portals reach the bottom */}
              {roundPhase === 'choosing' && playerLane === null && distanceToGate <= 14 && (
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-xl border-2 font-black text-sm whitespace-nowrap transition-colors ${
                      roundTimer <= 2
                        ? 'bg-rose-500 border-white text-white animate-pulse'
                        : 'bg-yellow-300 border-white text-yellow-950 animate-bounce'
                    }`}
                  >
                    <span className="flex items-center gap-1 bg-white/80 text-slate-900 px-2 py-0.5 rounded-full tabular-nums">
                      <Timer className="w-4 h-4" />
                      <span>{Math.ceil(roundTimer)}s</span>
                    </span>
                    <span>👇 Toque em um dos 3 portais!</span>
                  </div>
                </div>
              )}

              {/* Approaching Gates (Portais Mágicos) — each descending cleanly in its own lane */}
              {roundPhase === 'choosing' && (
                <div
                  className="absolute inset-x-0 z-10 pointer-events-auto grid grid-cols-3 text-center"
                  style={{
                    bottom: `${Math.max(12, ((distanceToGate - 5) / 95) * 255)}px`,
                  }}
                >
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = playerLane === idx;
                    const gateScale = 0.65 + Math.min(1, Math.max(0, (100 - distanceToGate) / 86)) * 0.35;
                    return (
                      <div key={idx} className="flex justify-center items-center px-1">
                        <button
                          onClick={() => chooseLane(idx)}
                          style={{ transform: `scale(${gateScale})` }}
                          className={`w-full p-3 rounded-2xl font-black text-2xl sm:text-3xl font-fun shadow-2xl border-4 transition-colors cursor-pointer origin-center ${
                            isSelected
                              ? 'bg-amber-400 border-white text-slate-900 ring-4 ring-yellow-300 shadow-amber-500/50'
                              : 'bg-white/95 border-amber-300 hover:border-amber-500 text-slate-800 hover:bg-amber-50'
                          }`}
                        >
                          <div className="text-xs font-bold text-slate-500 uppercase flex items-center justify-center gap-1">
                            <span>Portal {LANE_KEYS[idx]}</span>
                            {isSelected && <span className="text-amber-700">✓</span>}
                          </div>
                          <div className="mt-1">{option}</div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Single Mascot that smoothly glides from the right corner to the chosen lane and back */}
            <div
              className={`absolute bottom-3 z-30 pointer-events-none -translate-x-1/2 transition-all duration-500 ease-out flex flex-col items-center ${
                playerLane === 0
                  ? 'left-[16.667%]'
                  : playerLane === 1
                  ? 'left-[50%]'
                  : playerLane === 2
                  ? 'left-[83.333%]'
                  : 'left-[88%] sm:left-[calc(100%+48px)]'
              }`}
            >
              {roundPhase === 'choosing' && playerLane === null && (
                <span className="text-[11px] font-black bg-white/95 text-amber-900 px-2.5 py-0.5 rounded-full shadow-md border border-amber-300 mb-1 whitespace-nowrap animate-bounce">
                  Qual portal? 🤔
                </span>
              )}
              <div className="animate-bounce">
                <MascotBadge mascotId={mascotId} hatId={hatId} size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quick Lane Navigation Controls aligned directly under the 3 lanes */}
        <div className="relative z-20 bg-white/95 py-2.5 px-4 sm:px-24 flex flex-col items-center border-t-2 border-amber-200">
          {/* 3 Explicit Lane Buttons matching the road's max-w-2xl & 3-column geometry */}
          <div className="w-full max-w-2xl border-x-4 border-transparent px-2 grid grid-cols-3 gap-2">
            {[0, 1, 2].map((laneIdx) => {
              const isSelected = playerLane === laneIdx;
              const optionVal = currentQuestion.options[laneIdx];
              return (
                <button
                  key={laneIdx}
                  disabled={roundPhase !== 'choosing'}
                  onClick={() => chooseLane(laneIdx)}
                  className={`py-1.5 px-1 rounded-2xl font-black text-sm sm:text-base border-2 transition-all flex flex-col items-center justify-center disabled:opacity-50 ${
                    isSelected
                      ? 'bg-amber-500 border-amber-600 text-white shadow-md scale-102 ring-2 ring-amber-300'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold opacity-80 uppercase">Pista {LANE_KEYS[laneIdx]}</span>
                  <span className="text-lg font-black font-fun leading-tight">
                    {roundPhase === 'choosing' ? optionVal : '...'} {isSelected ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center mt-1.5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
            <span className="font-black text-slate-600">
              {roundPhase === 'returning'
                ? 'Preparando próximos números...'
                : playerLane === null
                ? 'Escolha uma pista ou portal!'
                : 'Pista selecionada!'}
            </span>
            <span className="hidden sm:inline">· Teclas A, S, D ou Setas ← →</span>
          </div>
        </div>
      </div>

      {/* Educational Helper Feedback Modal on wrong answer */}
      {showHelperFeedback && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-amber-400 text-center animate-bounce-short">
            <div className="text-5xl mb-2">🧚‍♀️</div>
            <h3 className="text-2xl font-black font-fun text-amber-900 mb-2">Quase lá, amiguinho!</h3>
            <p className="text-slate-700 font-semibold text-base mb-6 leading-relaxed bg-amber-50 p-4 rounded-2xl border border-amber-200">
              {showHelperFeedback}
            </p>
            <button
              onClick={() => {
                soundManager.playBloop(500);
                setShowHelperFeedback(null);
                if (!isGameOver) {
                  returnMascotThenAdvance(questionIndex + 1 < TOTAL_QUESTIONS_PER_STAGE);
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg rounded-2xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-transform active:scale-95"
            >
              Entendi! Vamos Continuar 🚀
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-rose-400">
            <div className="text-6xl mb-3">💪</div>
            <h3 className="text-3xl font-black font-fun text-slate-900 mb-2">Bom Treino!</h3>
            <p className="text-slate-600 font-bold mb-2">
              Você marcou <strong className="text-amber-600">{score} pontos</strong>! Praticar é o segredo dos verdadeiros mestres da tabuada.
            </p>
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 mb-4">
              Conclua o reino para ganhar gemas! 💎
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Tentar de Novo</span>
              </button>
              <button
                onClick={onBack}
                className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-2xl"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory / Stage Clear Modal */}
      {isVictory && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border-4 border-yellow-400 relative overflow-hidden">
            <div className="text-6xl mb-3 animate-bounce">🏆</div>
            <h3 className="text-3xl font-black font-fun text-yellow-950 mb-1">Vitória Espetacular!</h3>
            <p className="text-slate-600 font-bold mb-4">
              Você conquistou os desafios do <strong>{world.name}</strong>!
            </p>

            {/* Stars awarded */}
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-12 h-12 transition-all ${
                    i < (lives === 3 ? 3 : lives === 2 ? 2 : 1)
                      ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-6">
              <div className="flex justify-around">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Pontos</span>
                  <span className="text-2xl font-black text-amber-600">{score}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Gemas Ganhas</span>
                  <span className="text-2xl font-black text-emerald-600">+{gemSummary.finalGems} 💎</span>
                </div>
              </div>
              {gemSummary.penaltyNote && (
                <p className="text-xs font-bold text-rose-600 mt-3">{gemSummary.penaltyNote}</p>
              )}
              <p className="text-xs font-semibold text-slate-500 mt-2">{gemSummary.tipText}</p>
            </div>

            <button
              onClick={handleClaimVictory}
              className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white font-black text-xl rounded-2xl shadow-xl hover:scale-102 transition-transform"
            >
              Coletar Recompensas! ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
