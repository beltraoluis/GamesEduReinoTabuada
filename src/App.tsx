import React, { useState, useEffect } from 'react';
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
import { PlayerProgress, WorldConfig } from './types/game';
import { DEFAULT_PROGRESS, WORLDS } from './services/mathEngine';
import { soundManager } from './services/sound';
import { sanitizeProgress, sanitizeName } from './services/progress';
import confetti from 'canvas-confetti';

type AppView =
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
const GAME_VIEWS: AppView[] = ['runner', 'balloons', 'cauldron'];

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
        ...prev,
        stars: newStars,
        gems: newGems,
        highScoreRunner: newHighScore,
        unlockedAchievements,
      };
    });

    setCurrentView('world_select');
  };

  // Award from Balloon Pop
  const handleFinishBalloons = (score: number, gemsEarned: number) => {
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
  const handleFinishCauldron = (score: number, gemsEarned: number) => {
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

  // Update Student Name
  const handleUpdateName = (newName: string) => {
    setProgress((prev) => ({ ...prev, playerName: sanitizeName(newName) }));
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
      if (cost < 0 || prev.gems < cost || prev.unlockedMascots.includes(mascotId)) return prev;
      return {
        ...prev,
        gems: prev.gems - cost,
        unlockedMascots: [...prev.unlockedMascots, mascotId],
        selectedMascot: mascotId,
      };
    });
  };

  const handleUnlockAccessory = (hatId: string, cost: number) => {
    setProgress((prev) => {
      if (cost < 0 || prev.gems < cost || prev.unlockedAccessories.includes(hatId)) return prev;
      return {
        ...prev,
        gems: prev.gems - cost,
        unlockedAccessories: [...prev.unlockedAccessories, hatId],
        selectedHat: hatId,
      };
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
            onSelectWorld={(world) => {
              setSelectedWorld(world);
              setCurrentView('runner');
            }}
            onBack={() => setCurrentView('title')}
          />
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
            onBack={() => setCurrentView('achievements')}
          />
        )}
      </main>
    </div>
  );
}
