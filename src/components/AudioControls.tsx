import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Mic, MicOff, Home } from 'lucide-react';
import { soundManager } from '../services/sound';

interface AudioControlsProps {
  onHomeClick?: () => void;
  showHome?: boolean;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ onHomeClick, showHome = true }) => {
  const [isMuted, setIsMuted] = useState(soundManager.getIsMuted());
  const [isMusicMuted, setIsMusicMuted] = useState(soundManager.getIsMusicMuted());
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(soundManager.getIsSpeechEnabled());

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
    if (!next) soundManager.playBloop(500);
  };

  const handleToggleMusic = () => {
    const next = soundManager.toggleMusic();
    setIsMusicMuted(next);
  };

  const handleToggleSpeech = () => {
    const next = soundManager.toggleSpeech();
    setIsSpeechEnabled(next);
    if (next) soundManager.speak('Voz ativada!');
  };

  return (
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 shadow-sm z-50">
      {showHome && onHomeClick && (
        <button
          onClick={() => {
            soundManager.playBloop(350);
            onHomeClick();
          }}
          title="Voltar ao Início"
          className="p-2 text-slate-700 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
        >
          <Home className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={handleToggleSound}
        title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Efeitos'}
        className={`p-2 rounded-full transition-all ${
          isMuted ? 'text-rose-500 bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'
        }`}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      <button
        onClick={handleToggleMusic}
        title={isMusicMuted ? 'Ligar Músiquinha de Fundo' : 'Desligar Música'}
        className={`p-2 rounded-full transition-all ${
          isMusicMuted ? 'text-slate-400 hover:bg-slate-100' : 'text-violet-600 bg-violet-50 hover:bg-violet-100'
        }`}
      >
        <Music className="w-5 h-5" />
      </button>

      <button
        onClick={handleToggleSpeech}
        title={isSpeechEnabled ? 'Voz com leitura ativada' : 'Ativar leitura em voz alta'}
        className={`p-2 rounded-full transition-all ${
          isSpeechEnabled ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'
        }`}
      >
        {isSpeechEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
    </div>
  );
};
