// Web Audio API Synthesizer and Web Speech API helper
// Completely self-contained, no external audio assets needed!

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private musicInterval: number | null = null;
  private isSpeechEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const savedMuted = localStorage.getItem('tabuada_sound_muted');
    if (savedMuted) this.isMuted = savedMuted === 'true';
    const savedMusic = localStorage.getItem('tabuada_music_muted');
    if (savedMusic) this.isMusicMuted = savedMusic === 'true';
    const savedSpeech = localStorage.getItem('tabuada_speech_enabled');
    if (savedSpeech) this.isSpeechEnabled = savedSpeech !== 'false';
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('tabuada_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMusic(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    localStorage.setItem('tabuada_music_muted', String(this.isMusicMuted));
    if (this.isMusicMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMusicMuted;
  }

  public getIsMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  public toggleSpeech(): boolean {
    this.isSpeechEnabled = !this.isSpeechEnabled;
    localStorage.setItem('tabuada_speech_enabled', String(this.isSpeechEnabled));
    return this.isSpeechEnabled;
  }

  public getIsSpeechEnabled(): boolean {
    return this.isSpeechEnabled;
  }

  // Play a happy cheerful bloop
  public playBloop(frequency = 440) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio fallback
    }
  }

  // Play victorious major arpeggio when answering correctly!
  public playCorrect() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + i * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.25);
      });
    } catch {
      // Audio fallback
    }
  }

  // Gentle friendly boing for wrong answers (never harsh or punishing)
  public playWrong() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }
  }

  // Pop sound for popping balloons
  public playPop() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.09);

      gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  }

  // Coin / Star collected
  public playCoin() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio fallback
    }
  }

  // Fanfare when clearing a level or stage
  public playVictory() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [
        { f: 523.25, d: 0.12 }, // C
        { f: 523.25, d: 0.12 }, // C
        { f: 523.25, d: 0.12 }, // C
        { f: 659.25, d: 0.35 }, // E
        { f: 587.33, d: 0.15 }, // D
        { f: 783.99, d: 0.6 }   // G
      ];

      let t = this.ctx.currentTime;
      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + n.d);
        t += n.d + 0.03;
      });
    } catch {
      // Audio fallback
    }
  }

  // Procedural soft background ambient tune
  public startMusic() {
    if (this.isMusicMuted || this.musicInterval) return;
    try {
      this.initContext();
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C major pentatonic
      let step = 0;

      this.musicInterval = window.setInterval(() => {
        if (this.isMusicMuted || !this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const freq = scale[step % scale.length];

          // Vary rhythm gently
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start();
          osc.stop(this.ctx.currentTime + 0.35);

          step = (step + 1 + (step % 3 === 0 ? 2 : 1)) % scale.length;
        } catch {
          // ignore
        }
      }, 420);
    } catch {
      // Audio fallback
    }
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // Speak text in Portuguese using Web Speech API
  public speak(text: string) {
    if (!this.isSpeechEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.15; // slightly higher friendly tone for kids
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech errors
    }
  }
}

export const soundManager = new SoundManager();
