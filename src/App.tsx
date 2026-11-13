import React, { useState, useEffect } from 'react';
import { ChallengeRealm } from './components/ChallengeRealm';
import { TitleScreen } from './components/TitleScreen';
import { GameRunner } from './components/GameRunner';
import { BalloonPopGame } from './components/BalloonPopGame';
import { PotionCauldronGame } from './components/PotionCauldronGame';
import { VisualLab } from './components/VisualLab';
import { MascotWardrobe } from './components/MascotWardrobe';
import { AchievementsModal } from './components/AchievementsModal';
import { CertificateModal } from './components/CertificateModal';
import { WorldSelect } from './components/WorldSelect';
import { AudioControls } from './components/AudioControls';
import { ChallengeResult, PlayerProgress, WorldConfig } from './types/game';
import { DEFAULT_PROGRESS, WORLDS } from './services/mathEngine';
import { soundManager } from './services/sound';
import { sanitizeProgress, sanitizeName, recordWorldCompletion, unlockMascot, unlockAccessory, purchaseChallenge, recordChallengeResult, bestChallengeTitle } from './services/progress';
import { applyDevEasterEgg } from './services/devEasterEgg';
import confetti from 'canvas-confetti';

type AppView =
  | 'challenge'
  | 'title'
  | 'world_select'
  | 'runner'
  | 'balloons'
  | 'cauldron'
  | 'lab'
  | 'wardrobe'
  | 'achievements'
  | 'certificate';

const STORAGE_KEY = 'tabuada_magica_progress';

// Views with a running game: ESC must not silently discard progress there.
const GAME_VIEWS: AppView[] = ['runner', 'balloons', 'cauldron', 'challenge'];

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('title');
  const [selectedWorld, setSelectedWorld] = useState<WorldConfig>(WORLDS[0]);

  // Load progress from localStorage or default
  const [progress, setProgress] = useState<PlayerProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return sanitizeProgress(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    return DEFAULT_PROGRESS;
  });

  // Save progress changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  // Global ESC key to return to title
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentView !== 'title' && !GAME_VIEWS.includes(currentView)) {
        soundManager.playBloop(350);
        setCurrentView('title');
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [currentView]);

  // Award stars and gems from Runner
  const handleFinishRunner = (starsEarned: number, gemsEarned: number, score: number) => {
    const completedWorldId = selectedWorld.id;
    setProgress((prev) => {
      const newStars = prev.stars + starsEarned;
      const newGems = prev.gems + gemsEarned;
      const newHighScore = Math.max(prev.highScoreRunner, score);

      const unlockedAchievements = [...prev.unlockedAchievements];
      if (!unlockedAchievements.includes('first_win')) {
        unlockedAchievements.push('first_win');
      }
      if (newStars >= 10 && !unlockedAchievements.includes('world1_master')) {
        unlockedAchievements.push('world1_master');
      }

      return {
        ...recordWorldCompletion(prev, completedWorldId, starsEarned),
        stars: newStars,
        gems: newGems,
        highScoreRunner: newHighScore,
        unlockedAchievements,
      };
    });

    setCurrentView('world_select');
  };

  // Accept both legacy (score, gems) and shared (stars, gems, score) callbacks.
  // Award from Balloon Pop
  const handleFinishBalloons = (starsEarned: number, gemsEarned: number, finalScore?: number) => {
    const score = finalScore ?? starsEarned;
    setProgress((prev) => {
      const newGems = prev.gems + gemsEarned;
      const newHigh = Math.max(prev.highScoreBalloons, score);
      const unlockedAchievements = [...prev.unlockedAchievements];

      if (score >= 300 && !unlockedAchievements.includes('balloon_pop_10')) {
        unlockedAchievements.push('balloon_pop_10');
      }

      return {
        ...prev,
        gems: newGems,
        highScoreBalloons: newHigh,
        unlockedAchievements,
      };
    });

    setCurrentView('title');
  };

  // Award from Potion Cauldron
  const handleFinishCauldron = (starsEarned: number, gemsEarned: number, finalScore?: number) => {
    const score = finalScore ?? starsEarned;
    setProgress((prev) => {
      const newGems = prev.gems + gemsEarned;
      const newHigh = Math.max(prev.highScoreCauldron, score);
      const unlockedAchievements = [...prev.unlockedAchievements];

      if (score >= 200 && !unlockedAchievements.includes('cauldron_chef')) {
        unlockedAchievements.push('cauldron_chef');
      }

      return {
        ...prev,
        gems: newGems,
        highScoreCauldron: newHigh,
        unlockedAchievements,
      };
    });

    setCurrentView('title');
  };

  const handleBuyChallenge = () => setProgress((prev) => purchaseChallenge(prev));
  const handleFinishChallenge = (result: ChallengeResult) => {
    setProgress((prev) => recordChallengeResult(prev, result));
  };

  // Update Student Name
  const handleUpdateName = (newName: string) => {
    setProgress((prev) =>
      applyDevEasterEgg({ ...prev, playerName: sanitizeName(newName) })
    );
  };

  // Wardrobe unlocks
  const handleSelectMascot = (mascotId: string) => {
    setProgress((prev) => ({ ...prev, selectedMascot: mascotId }));
  };

  const handleSelectHat = (hatId: string) => {
    setProgress((prev) => ({ ...prev, selectedHat: hatId }));
  };

  const handleUnlockMascot = (mascotId: string, cost: number) => {
    setProgress((prev) => {
      return unlockMascot(prev, mascotId, cost);
    });
  };

  const handleUnlockAccessory = (hatId: string, cost: number) => {
    setProgress((prev) => {
      return unlockAccessory(prev, hatId, cost);
    });
  };

  const handleLabAchievement = () => {
    setProgress((prev) => {
      if (!prev.unlockedAchievements.includes('lab_explorer')) {
        return {
          ...prev,
          unlockedAchievements: [...prev.unlockedAchievements, 'lab_explorer'],
        };
      }
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-2 sm:p-4 selection:bg-amber-400 selection:text-amber-950">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌟</span>
          <span className="font-fun font-bold text-amber-300 text-sm tracking-wide hidden sm:inline">
            Reino da Tabuada Mágica · 3º Ano
          </span>
        </div>

        <AudioControls
          showHome={currentView !== 'title'}
          onHomeClick={() => {
            soundManager.playBloop(350);
            setCurrentView('title');
          }}
        />
      </div>

      {/* Main Viewport Container */}
      <main className="w-full max-w-4xl flex-1 flex flex-col justify-center items-center">
        {currentView === 'title' && (
          <TitleScreen
            progress={progress}
            onStartAdventure={(world) => {
              setSelectedWorld(world);
              setCurrentView('world_select');
            }}
            onStartBalloons={() => setCurrentView('balloons')}
            onStartCauldron={() => setCurrentView('cauldron')}
            onOpenLab={() => setCurrentView('lab')}
            onOpenWardrobe={() => setCurrentView('wardrobe')}
            onOpenAchievements={() => setCurrentView('achievements')}
          />
        )}

        {currentView === 'world_select' && (
          <WorldSelect
            progress={progress}
            onBuyChallenge={handleBuyChallenge}
            onEnterChallenge={() => { if (progress.challenge.unlocked) setCurrentView('challenge'); }}
            onSelectWorld={(world) => {
              setSelectedWorld(world);
              setCurrentView('runner');
            }}
            onBack={() => setCurrentView('title')}
          />
        )}

        {currentView === 'challenge' && progress.challenge.unlocked && (
          <ChallengeRealm playerName={progress.playerName} mascotId={progress.selectedMascot} hatId={progress.selectedHat}
            onFinish={handleFinishChallenge} onBack={() => setCurrentView('world_select')} />
        )}

        {currentView === 'runner' && (
          <GameRunner
            world={selectedWorld}
            mascotId={progress.selectedMascot}
            hatId={progress.selectedHat}
            onFinishRun={handleFinishRunner}
            onBack={() => setCurrentView('world_select')}
          />
        )}

        {currentView === 'balloons' && (
          <BalloonPopGame
            onFinishGame={handleFinishBalloons}
            onBack={() => setCurrentView('title')}
          />
        )}

        {currentView === 'cauldron' && (
          <PotionCauldronGame
            onFinish={handleFinishCauldron}
            onBack={() => setCurrentView('title')}
          />
        )}

        {currentView === 'lab' && (
          <VisualLab
            onBack={() => setCurrentView('title')}
            onExploreAchievement={handleLabAchievement}
          />
        )}

        {currentView === 'wardrobe' && (
          <MascotWardrobe
            playerName={progress.playerName}
            selectedMascot={progress.selectedMascot}
            selectedHat={progress.selectedHat}
            gems={progress.gems}
            unlockedMascots={progress.unlockedMascots}
            unlockedAccessories={progress.unlockedAccessories}
            completedLevels={progress.completedLevels}
            onUpdateName={handleUpdateName}
            onSelectMascot={handleSelectMascot}
            onSelectHat={handleSelectHat}
            onUnlockMascot={handleUnlockMascot}
            onUnlockAccessory={handleUnlockAccessory}
            onBack={() => setCurrentView('title')}
          />
        )}

        {currentView === 'achievements' && (
          <AchievementsModal
            progress={progress}
            onOpenCertificate={() => setCurrentView('certificate')}
            onBack={() => setCurrentView('title')}
          />
        )}

        {currentView === 'certificate' && (
          <CertificateModal
            playerName={progress.playerName}
            selectedMascot={progress.selectedMascot}
            selectedHat={progress.selectedHat}
            totalStars={progress.stars}
            challengeTitle={bestChallengeTitle(progress)}
            onBack={() => setCurrentView('achievements')}
          />
        )}
      </main>
    </div>
  );
}
