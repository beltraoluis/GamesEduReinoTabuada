import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Clock,
  LogOut,
  Volume2,
  Flame,
  RotateCcw,
  Map,
  Crown,
  Trophy,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { ChallengeMedal, ChallengeResult } from '../types/game';
import {
  CHALLENGE_ICON,
  CHALLENGE_LIVES,
  CHALLENGE_NAME,
  CHALLENGE_PHASES,
  CHALLENGE_QUESTIONS_PER_PHASE,
} from '../services/challengeConfig';
import {
  ChallengeQuestion,
  generateChallengeSession,
  isChallengeAnswerCorrect,
  scoreChallengeAnswer,
  summarizeChallenge,
} from '../services/challengeEngine';
import { challengeTitleForMedal } from '../services/progress';
import { soundManager } from '../services/sound';
import { MascotBadge } from './MascotBadge';
import { ChallengeKeypad } from './ChallengeKeypad';

interface ChallengeRealmProps {
  playerName: string;
  mascotId: string;
  hatId: string;
  onFinish: (result: ChallengeResult) => void;
  onBack: () => void;
}

interface FeedbackModalState {
  type: 'wrong' | 'timeout';
  question: ChallengeQuestion;
  userInput: string;
  nextLives: number;
  snapshotCorrect: number;
  snapshotWrong: number;
  snapshotTimeouts: number;
  snapshotScore: number;
  snapshotBestStreak: number;
}

const MAX_INPUT_DIGITS = 6;

const MEDAL_DISPLAY: Record<ChallengeMedal, { icon: string; label: string }> = {
  gold: { icon: '🥇', label: 'Medalha de Ouro' },
  silver: { icon: '🥈', label: 'Medalha de Prata' },
  bronze: { icon: '🥉', label: 'Medalha de Bronze' },
  none: { icon: '🗼', label: 'Sem medalha, tente de novo' },
};

export const ChallengeRealm: React.FC<ChallengeRealmProps> = ({
  playerName: _playerName,
  mascotId,
  hatId,
  onFinish,
  onBack,
}) => {
  const [sessionId, setSessionId] = useState(0);
  const questions = useMemo(() => generateChallengeSession(), [sessionId]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lives, setLives] = useState(CHALLENGE_LIVES);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [timeoutsCount, setTimeoutsCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState<number>(questions[0]?.timeLimitSec ?? 12);

  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [correctFeedback, setCorrectFeedback] = useState<{ points: number; streak: number } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mascotReaction, setMascotReaction] = useState<'idle' | 'happy' | 'oops'>('idle');
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const sessionStartRef = useRef<number>(Date.now());
  const finishedRef = useRef<boolean>(false);
  const questionResolvedRef = useRef<boolean>(false);
  const transitionTimerRef = useRef<number | null>(null);
  const continueBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelExitBtnRef = useRef<HTMLButtonElement | null>(null);
  const activeModalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const speakerBtnRef = useRef<HTMLButtonElement | null>(null);
  const wasModalOpenRef = useRef<boolean>(false);

  const currentQuestion = questions[currentIndex];
  const currentPhase = CHALLENGE_PHASES.find((p) => p.id === currentQuestion?.phase) ?? CHALLENGE_PHASES[0];

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  const finalizeSession = useCallback(
    (stats: {
      correct: number;
      wrong: number;
      timeouts: number;
      score: number;
      bestStreak: number;
    }) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const durationSec = Math.max(1, Math.round((Date.now() - sessionStartRef.current) / 1000));
      const summary = summarizeChallenge({
        correct: stats.correct,
        wrong: stats.wrong,
        timeouts: stats.timeouts,
        score: stats.score,
        bestStreak: stats.bestStreak,
        durationSec,
      });
      setResult(summary);
      if (summary.completed) {
        soundManager.playVictory();
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.55 },
        });
      }
      onFinish(summary);
    },
    [onFinish]
  );

  // Speak question when a new question starts (never includes playerName)
  useEffect(() => {
    if (result || !currentQuestion) return;
    questionResolvedRef.current = false;
    soundManager.speak(currentQuestion.speechText);
  }, [currentIndex, sessionId, result, currentQuestion]);

  // Focus management, focus trap, and focus restoration for modals
  const isModalOpen = Boolean(feedbackModal || showExitConfirm);

  useEffect(() => {
    if (isModalOpen && !wasModalOpenRef.current) {
      const active = document.activeElement;
      previousFocusRef.current = active instanceof HTMLElement ? active : null;
    } else if (!isModalOpen && wasModalOpenRef.current && !result) {
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      window.requestAnimationFrame(() => {
        if (prev && prev.isConnected && !prev.hasAttribute('disabled')) {
          prev.focus();
        } else {
          speakerBtnRef.current?.focus();
        }
      });
    }
    wasModalOpenRef.current = isModalOpen;
  }, [isModalOpen, result]);

  useEffect(() => {
    if (feedbackModal) {
      continueBtnRef.current?.focus();
    }
  }, [feedbackModal]);

  useEffect(() => {
    if (showExitConfirm) {
      cancelExitBtnRef.current?.focus();
    }
  }, [showExitConfirm]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExitConfirm) {
          e.preventDefault();
          e.stopPropagation();
          soundManager.playBloop(420);
          setShowExitConfirm(false);
        }
        return;
      }

      if (e.key !== 'Tab') return;
      const modalEl = activeModalRef.current;
      if (!modalEl) return;

      const focusables = Array.from(
        modalEl.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === first || !modalEl.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (current === last || !modalEl.contains(current)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleModalKeyDown, true);
    return () => window.removeEventListener('keydown', handleModalKeyDown, true);
  }, [isModalOpen, showExitConfirm]);

  // Per-question countdown timer (paused behind any modal, transition, or end screen)
  useEffect(() => {
    if (result || feedbackModal || showExitConfirm || isTransitioning || !currentQuestion) {
      return;
    }

    let lastTick = Date.now();
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      setTimeLeft((prev) => {
        const next = Math.max(0, prev - deltaSec);
        if (next <= 0 && !questionResolvedRef.current) {
          questionResolvedRef.current = true;
          soundManager.playWrong();
          const nextLives = lives - 1;
          const nextWrong = wrongCount + 1;
          const nextTimeouts = timeoutsCount + 1;
          setLives(nextLives);
          setWrongCount(nextWrong);
          setTimeoutsCount(nextTimeouts);
          setStreak(0);
          setMascotReaction('oops');
          setFeedbackModal({
            type: 'timeout',
            question: currentQuestion,
            userInput: '',
            nextLives,
            snapshotCorrect: correctCount,
            snapshotWrong: nextWrong,
            snapshotTimeouts: nextTimeouts,
            snapshotScore: score,
            snapshotBestStreak: bestStreak,
          });
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [
    result,
    feedbackModal,
    showExitConfirm,
    isTransitioning,
    currentQuestion,
    lives,
    correctCount,
    wrongCount,
    timeoutsCount,
    score,
    bestStreak,
  ]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (result || feedbackModal || showExitConfirm || isTransitioning) return;
      soundManager.playBloop(460);
      setInput((prev) => (prev.length < MAX_INPUT_DIGITS ? prev + digit : prev));
    },
    [result, feedbackModal, showExitConfirm, isTransitioning]
  );

  const handleBackspace = useCallback(() => {
    if (result || feedbackModal || showExitConfirm || isTransitioning) return;
    soundManager.playBloop(340);
    setInput((prev) => prev.slice(0, -1));
  }, [result, feedbackModal, showExitConfirm, isTransitioning]);

  const handleSubmit = useCallback(() => {
    if (
      result ||
      feedbackModal ||
      showExitConfirm ||
      isTransitioning ||
      questionResolvedRef.current ||
      !currentQuestion ||
      input.trim() === ''
    ) {
      return;
    }

    questionResolvedRef.current = true;
    const elapsedSec = Math.max(0, currentQuestion.timeLimitSec - timeLeft);

    if (isChallengeAnswerCorrect(currentQuestion, input)) {
      soundManager.playCorrect();
      const points = scoreChallengeAnswer({
        phase: currentQuestion.phase,
        elapsedSec,
        timeLimitSec: currentQuestion.timeLimitSec,
        streakBefore: streak,
      });
      const nextScore = score + points;
      const nextCorrect = correctCount + 1;
      const nextStreak = streak + 1;
      const nextBestStreak = Math.max(bestStreak, nextStreak);

      setScore(nextScore);
      setCorrectCount(nextCorrect);
      setStreak(nextStreak);
      setBestStreak(nextBestStreak);
      setMascotReaction('happy');
      setCorrectFeedback({ points, streak: nextStreak });
      setIsTransitioning(true);

      const isPhaseEnd = currentQuestion.indexInPhase === CHALLENGE_QUESTIONS_PER_PHASE - 1;
      const isFinalQuestion = currentIndex + 1 >= questions.length;

      if (isPhaseEnd && !isFinalQuestion) {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.6 },
        });
      }

      clearTransitionTimer();
      transitionTimerRef.current = window.setTimeout(() => {
        setCorrectFeedback(null);
        setIsTransitioning(false);
        setMascotReaction('idle');
        setInput('');

        if (isFinalQuestion) {
          finalizeSession({
            correct: nextCorrect,
            wrong: wrongCount,
            timeouts: timeoutsCount,
            score: nextScore,
            bestStreak: nextBestStreak,
          });
        } else {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          setTimeLeft(questions[nextIdx].timeLimitSec);
        }
      }, 650);
    } else {
      soundManager.playWrong();
      const nextLives = lives - 1;
      const nextWrong = wrongCount + 1;
      setLives(nextLives);
      setWrongCount(nextWrong);
      setStreak(0);
      setMascotReaction('oops');
      setFeedbackModal({
        type: 'wrong',
        question: currentQuestion,
        userInput: input,
        nextLives,
        snapshotCorrect: correctCount,
        snapshotWrong: nextWrong,
        snapshotTimeouts: timeoutsCount,
        snapshotScore: score,
        snapshotBestStreak: bestStreak,
      });
    }
  }, [
    result,
    feedbackModal,
    showExitConfirm,
    isTransitioning,
    currentQuestion,
    input,
    timeLeft,
    streak,
    score,
    correctCount,
    bestStreak,
    currentIndex,
    questions,
    clearTransitionTimer,
    finalizeSession,
    wrongCount,
    timeoutsCount,
    lives,
  ]);

  const handleContinueFromModal = useCallback(() => {
    if (!feedbackModal) return;
    soundManager.playBloop(420);
    const modal = feedbackModal;
    setFeedbackModal(null);
    setMascotReaction('idle');
    setInput('');

    if (modal.nextLives <= 0 || currentIndex + 1 >= questions.length) {
      finalizeSession({
        correct: modal.snapshotCorrect,
        wrong: modal.snapshotWrong,
        timeouts: modal.snapshotTimeouts,
        score: modal.snapshotScore,
        bestStreak: modal.snapshotBestStreak,
      });
    } else {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setTimeLeft(questions[nextIdx].timeLimitSec);
      questionResolvedRef.current = false;
    }
  }, [feedbackModal, currentIndex, questions, finalizeSession]);

  const handleRetry = useCallback(() => {
    soundManager.playBloop(500);
    clearTransitionTimer();
    const nextSessionId = sessionId + 1;
    finishedRef.current = false;
    questionResolvedRef.current = false;
    sessionStartRef.current = Date.now();
    setSessionId(nextSessionId);
    setCurrentIndex(0);
    setLives(CHALLENGE_LIVES);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setTimeoutsCount(0);
    setStreak(0);
    setBestStreak(0);
    setInput('');
    setFeedbackModal(null);
    setShowExitConfirm(false);
    setCorrectFeedback(null);
    setIsTransitioning(false);
    setMascotReaction('idle');
    setResult(null);
    setTimeLeft(CHALLENGE_PHASES[0].timeLimitSec);
  }, [clearTransitionTimer, sessionId]);

  // Physical keyboard support (digits, Backspace, Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (result || feedbackModal || showExitConfirm || isTransitioning) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [result, feedbackModal, showExitConfirm, isTransitioning, handleDigit, handleBackspace, handleSubmit]);

  // End screen
  if (result) {
    const medalInfo = MEDAL_DISPLAY[result.medal];
    const earnedTitle = challengeTitleForMedal(result.medal);

    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/70 bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-950 text-white p-4 sm:p-8">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/80 border border-amber-400/40 text-amber-200 text-xs font-black uppercase tracking-wider mb-3">
            <span>{CHALLENGE_ICON}</span>
            <span>{CHALLENGE_NAME}</span>
          </div>

          <div className="text-6xl sm:text-7xl my-2" aria-hidden="true">
            {medalInfo.icon}
          </div>

          <h2 className="text-2xl sm:text-4xl font-black font-fun text-amber-200 mt-1">
            {result.completed ? 'Torre Conquistada!' : 'Fim da Tentativa'}
          </h2>

          <p className="text-base sm:text-lg font-extrabold text-purple-100 mt-1">
            {medalInfo.label}
          </p>

          {earnedTitle && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-sm shadow-md">
              <Crown className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Título: {earnedTitle}</span>
            </div>
          )}

          <div className="mt-5 flex justify-center">
            <MascotBadge mascotId={mascotId} hatId={hatId} size="lg" />
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-purple-900/60 border border-purple-400/30 rounded-2xl p-3">
              <span className="text-xs font-bold text-purple-300 block">Pontuação</span>
              <span className="text-xl font-black text-amber-300 tabular-nums">{result.score}</span>
            </div>
            <div className="bg-purple-900/60 border border-purple-400/30 rounded-2xl p-3">
              <span className="text-xs font-bold text-purple-300 block">Acertos</span>
              <span className="text-xl font-black text-emerald-300 tabular-nums">{result.correct}</span>
            </div>
            <div className="bg-purple-900/60 border border-purple-400/30 rounded-2xl p-3">
              <span className="text-xs font-bold text-purple-300 block">Erros</span>
              <span className="text-xl font-black text-rose-300 tabular-nums">{result.wrong}</span>
            </div>
            <div className="bg-purple-900/60 border border-purple-400/30 rounded-2xl p-3">
              <span className="text-xs font-bold text-purple-300 block">Tempo esgotado</span>
              <span className="text-xl font-black text-orange-300 tabular-nums">{result.timeouts}</span>
            </div>
            <div className="bg-purple-900/60 border border-purple-400/30 rounded-2xl p-3">
              <span className="text-xs font-bold text-purple-300 block">Melhor sequência</span>
              <span className="text-xl font-black text-amber-200 tabular-nums">{result.bestStreak}</span>
            </div>
            <div className="bg-purple-900/60 border border-purple-400/30 rounded-2xl p-3">
              <span className="text-xs font-bold text-purple-300 block">Duração</span>
              <span className="text-xl font-black text-purple-100 tabular-nums">{result.durationSec}s</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleRetry}
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Tentar de novo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.playBloop(350);
                onBack();
              }}
              className="min-h-[48px] px-6 py-3 rounded-2xl bg-purple-800/80 hover:bg-purple-700 text-white border border-purple-400/40 font-black text-base shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <Map className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Voltar ao mapa</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeLimit = currentQuestion?.timeLimitSec ?? 12;
  const timePercent = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const isTimeCritical = timePercent <= 25 || timeLeft <= 4;
  const isTimeLow = !isTimeCritical && timePercent <= 50;
  const timerBarColor = isTimeCritical
    ? 'bg-rose-500 animate-pulse'
    : isTimeLow
      ? 'bg-amber-400'
      : 'bg-emerald-400';

  return (
    <div className="relative w-full max-w-4xl mx-auto min-h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400/70 flex flex-col bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-950 text-white">
      <div className="flex-1 flex flex-col" inert={isModalOpen} aria-hidden={isModalOpen}>
      {/* Top Header */}
      <header className="px-3 sm:px-5 py-3 bg-slate-950/70 border-b border-purple-400/25 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              soundManager.playBloop(350);
              setShowExitConfirm(true);
            }}
            aria-label="Sair do desafio"
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 border border-purple-400/30 text-purple-100 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Sair</span>
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0" aria-hidden="true">
              {CHALLENGE_ICON}
            </span>
            <h2 className="font-black font-fun text-sm sm:text-lg text-amber-200 truncate">
              {CHALLENGE_NAME}
            </h2>
          </div>
        </div>

        {/* Lives & Score */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="flex items-center gap-1 bg-purple-900/70 px-2.5 py-1 rounded-xl border border-purple-400/25"
            aria-label={`${lives} de ${CHALLENGE_LIVES} vidas restantes`}
          >
            {Array.from({ length: CHALLENGE_LIVES }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
                  idx < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/40 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black text-amber-200 tabular-nums">
            <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" aria-hidden="true" />
            <span>{score}</span>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-400/40 px-2 py-1 rounded-xl text-xs font-black text-orange-200 tabular-nums">
              <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-hidden="true" />
              <span>{streak}</span>
            </div>
          )}
        </div>
      </header>

      {/* Phase Banner & Progress */}
      <div className="px-3 sm:px-5 py-2.5 bg-purple-900/40 border-b border-purple-400/20 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800/90 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-black">
            <span aria-hidden="true">{currentPhase.icon}</span>
            <span>
              Fase {currentPhase.id} — {currentPhase.name}
            </span>
          </span>

          {currentQuestion?.isBoss && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-black uppercase tracking-wide shadow">
              <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Chefão</span>
            </span>
          )}
        </div>

        <span className="text-xs sm:text-sm font-black text-purple-200 tabular-nums">
          Desafio {currentIndex + 1} de {questions.length}
        </span>
      </div>

      {/* Countdown Bar */}
      <div className="px-3 sm:px-5 pt-3">
        <div className="flex items-center justify-between text-xs font-black mb-1">
          <span className="flex items-center gap-1 text-purple-200">
            <Clock className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>Tempo</span>
          </span>
          <span
            className={`tabular-nums ${
              isTimeCritical ? 'text-rose-400' : isTimeLow ? 'text-amber-300' : 'text-emerald-300'
            }`}
          >
            {Math.ceil(timeLeft)}s
          </span>
        </div>
        <div
          className="w-full h-3 rounded-full bg-slate-900/90 border border-purple-400/25 overflow-hidden"
          role="progressbar"
          aria-label="Tempo restante"
          aria-valuenow={Math.ceil(timeLeft)}
          aria-valuemin={0}
          aria-valuemax={timeLimit}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ${timerBarColor}`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      {/* Main Arena: Prompt + Mascot + Input + Keypad */}
      <div className="flex-1 px-3 sm:px-6 py-4 flex flex-col justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Prompt Card */}
          <div className="flex-1 w-full bg-purple-900/50 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-6 shadow-inner">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xl sm:text-2xl md:text-3xl font-black font-fun text-white leading-snug break-words">
                {currentQuestion?.prompt}
              </p>
              <button
                ref={speakerBtnRef}
                type="button"
                onClick={() => currentQuestion && soundManager.speak(currentQuestion.speechText)}
                aria-label="Ouvir pergunta"
                title="Ouvir pergunta"
                className="p-2.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-200 shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Volume2 className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Typed Answer Display */}
            <div className="mt-4 flex items-center justify-center">
              <div
                aria-live="polite"
                aria-label={input ? `Resposta digitada: ${input}` : 'Nenhuma resposta digitada'}
                className="min-w-[160px] sm:min-w-[200px] px-5 py-3 rounded-2xl bg-slate-950/85 border-2 border-amber-300/70 text-center shadow-inner"
              >
                <span
                  className={`text-3xl sm:text-4xl font-black font-fun tracking-widest tabular-nums ${
                    input ? 'text-amber-300' : 'text-purple-400/60'
                  }`}
                >
                  {input || '?'}
                </span>
              </div>
            </div>
          </div>

          {/* Mascot Side Badge */}
          <div className="flex md:flex-col items-center gap-2 shrink-0">
            <div
              className={`transition-transform duration-300 ${
                mascotReaction === 'happy'
                  ? 'scale-110 -translate-y-1'
                  : mascotReaction === 'oops'
                    ? 'animate-wiggle'
                    : ''
              }`}
            >
              <MascotBadge mascotId={mascotId} hatId={hatId} size="lg" animate={false} />
            </div>
            <span className="text-xs font-bold text-purple-200 text-center">
              {mascotReaction === 'happy'
                ? '✨ Mandou bem!'
                : mascotReaction === 'oops'
                  ? '💪 Quase lá!'
                  : '🗼 Você consegue!'}
            </span>
          </div>
        </div>

        {/* Live Feedback Banner */}
        <div className="min-h-[28px] flex items-center justify-center" aria-live="polite">
          {correctFeedback && (
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500 text-white font-black text-sm shadow-lg animate-bounce">
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Correto! +{correctFeedback.points} pts</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <ChallengeKeypad
          onDigit={handleDigit}
          onBackspace={handleBackspace}
          onSubmit={handleSubmit}
          disabled={Boolean(feedbackModal || showExitConfirm || isTransitioning)}
          canSubmit={input.trim().length > 0}
        />
      </div>
      </div>

      {/* Wrong / Timeout Explanation Modal */}
      {feedbackModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-feedback-title"
        >
          <div
            ref={activeModalRef}
            className="w-full max-w-md rounded-3xl bg-gradient-to-b from-purple-950 to-slate-950 border-2 border-amber-400/70 p-5 sm:p-6 shadow-2xl text-white"
          >
            <h3
              id="challenge-feedback-title"
              className="text-xl sm:text-2xl font-black font-fun text-amber-200"
            >
              {feedbackModal.type === 'timeout' ? '⏰ Tempo esgotado!' : '💡 Quase lá!'}
            </h3>

            {feedbackModal.type === 'wrong' && feedbackModal.userInput && (
              <p className="text-sm text-rose-300 font-bold mt-1">
                Você digitou: <span className="tabular-nums">{feedbackModal.userInput}</span>
              </p>
            )}

            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-400/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                Resposta correta
              </span>
              <span className="text-2xl sm:text-3xl font-black font-fun text-emerald-200 tabular-nums">
                {feedbackModal.question.answer}
              </span>
            </div>

            <div className="mt-3 p-3.5 rounded-2xl bg-purple-900/50 border border-purple-400/30">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block mb-1">
                Estratégia
              </span>
              <p className="text-sm text-purple-100 font-semibold leading-relaxed">
                {feedbackModal.question.explanation}
              </p>
            </div>

            <p className="mt-3 text-xs font-bold text-purple-200">
              {feedbackModal.nextLives > 0
                ? `Vidas restantes: ${feedbackModal.nextLives} ❤️`
                : 'Você perdeu sua última vida nesta tentativa.'}
            </p>

            <button
              ref={continueBtnRef}
              type="button"
              onClick={handleContinueFromModal}
              className="mt-5 w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base shadow-lg active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-exit-title"
        >
          <div
            ref={activeModalRef}
            className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-purple-950 to-slate-950 border-2 border-amber-400/70 p-5 sm:p-6 shadow-2xl text-white"
          >
            <div className="flex items-center gap-2 text-amber-300 mb-2">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h3 id="challenge-exit-title" className="text-xl font-black font-fun">
                Sair e perder esta tentativa?
              </h3>
            </div>
            <p className="text-sm text-purple-200 font-semibold leading-relaxed">
              Seu progresso atual na Torre dos Mestres será perdido.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              <button
                ref={cancelExitBtnRef}
                type="button"
                onClick={() => {
                  soundManager.playBloop(420);
                  setShowExitConfirm(false);
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Continuar jogando
              </button>
              <button
                type="button"
                onClick={() => {
                  soundManager.playBloop(300);
                  clearTransitionTimer();
                  onBack();
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
