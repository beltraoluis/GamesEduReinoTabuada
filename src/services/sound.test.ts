import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Voice = { lang: string; localService: boolean; name: string };

class FakeUtterance {
  text: string;
  lang = '';
  voice: Voice | null = null;
  rate = 0;
  pitch = 0;
  constructor(text: string) {
    this.text = text;
  }
}

function makeSynth(voices: Voice[] | (() => Voice[])) {
  const spoken: FakeUtterance[] = [];
  return {
    spoken,
    cancel: vi.fn(),
    getVoices: vi.fn(() => (typeof voices === 'function' ? voices() : voices)),
    speak: vi.fn((u: FakeUtterance) => {
      spoken.push(u);
    }),
  };
}

function makeStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

function stubWindow(synth?: ReturnType<typeof makeSynth>) {
  const win: Record<string, unknown> = {
    setInterval: (...a: Parameters<typeof setInterval>) => setInterval(...a),
  };
  if (synth) win.speechSynthesis = synth;
  vi.stubGlobal('window', win);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
}

async function load() {
  vi.resetModules();
  return (await import('./sound')).soundManager;
}

const ptLocal: Voice = { lang: 'pt-BR', localService: true, name: 'Luciana' };
const ptNetwork: Voice = { lang: 'pt-BR', localService: false, name: 'Google pt' };
const enLocal: Voice = { lang: 'en-US', localService: true, name: 'Samantha' };

beforeEach(() => {
  vi.stubGlobal('localStorage', makeStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('SoundManager persistence', () => {
  it('imports and toggles without throwing when localStorage throws', async () => {
    const boom = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom });
    stubWindow();
    const sm = await load();
    expect(sm.getIsMuted()).toBe(false);
    expect(sm.getIsMusicMuted()).toBe(false);
    expect(sm.getIsSpeechEnabled()).toBe(true);
    expect(() => sm.toggleMute()).not.toThrow();
    expect(() => sm.toggleSpeech()).not.toThrow();
    expect(sm.getIsMuted()).toBe(true);
    expect(sm.getIsSpeechEnabled()).toBe(false);
    // music toggled to muted: stopMusic only, no audio context needed
    expect(() => sm.toggleMusic()).not.toThrow();
    expect(sm.getIsMusicMuted()).toBe(true);
  });

  it('imports when localStorage is entirely missing', async () => {
    vi.stubGlobal('localStorage', undefined);
    stubWindow();
    const sm = await load();
    expect(() => sm.toggleMute()).not.toThrow();
  });

  it('restores saved flags', async () => {
    vi.stubGlobal(
      'localStorage',
      makeStorage({
        tabuada_sound_muted: 'true',
        tabuada_music_muted: 'true',
        tabuada_speech_enabled: 'false',
      }),
    );
    stubWindow();
    const sm = await load();
    expect(sm.getIsMuted()).toBe(true);
    expect(sm.getIsMusicMuted()).toBe(true);
    expect(sm.getIsSpeechEnabled()).toBe(false);
  });

  it('restores explicit "false"/"true" opposite values', async () => {
    vi.stubGlobal(
      'localStorage',
      makeStorage({
        tabuada_sound_muted: 'false',
        tabuada_music_muted: 'false',
        tabuada_speech_enabled: 'true',
      }),
    );
    stubWindow();
    const sm = await load();
    expect(sm.getIsMuted()).toBe(false);
    expect(sm.getIsMusicMuted()).toBe(false);
    expect(sm.getIsSpeechEnabled()).toBe(true);
  });

  it('persists toggles so a fresh instance restores them', async () => {
    const storage = makeStorage();
    vi.stubGlobal('localStorage', storage);
    stubWindow();
    const sm = await load();
    expect(sm.toggleMute()).toBe(true);
    expect(sm.toggleSpeech()).toBe(false);
    expect(sm.toggleMusic()).toBe(true);
    const sm2 = await load();
    expect(sm2.getIsMuted()).toBe(true);
    expect(sm2.getIsSpeechEnabled()).toBe(false);
    expect(sm2.getIsMusicMuted()).toBe(true);
    expect(sm2.toggleMute()).toBe(false);
  });
});

describe('SoundManager.speak', () => {
  it('speaks genericText (not the name) when no voices are available', async () => {
    const synth = makeSynth([]);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Olá, Maria!', 'Olá!');
    expect(synth.spoken).toHaveLength(1);
    expect(synth.spoken[0].text).toBe('Olá!');
    expect(synth.spoken[0].voice).toBeNull();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('speaks generic text when only network pt voices exist', async () => {
    const synth = makeSynth([ptNetwork, enLocal]);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Olá, Maria!', 'Olá!');
    expect(synth.spoken[0].text).toBe('Olá!');
    expect(synth.spoken[0].voice).toBeNull();
  });

  it('speaks personalized text with the local pt voice', async () => {
    const synth = makeSynth([enLocal, ptNetwork, ptLocal]);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Olá, Maria!', 'Olá!');
    expect(synth.spoken[0].text).toBe('Olá, Maria!');
    expect(synth.spoken[0].voice).toBe(ptLocal);
    expect(synth.spoken[0].lang).toBe('pt-BR');
  });

  it('matches pt voices case-insensitively and other pt variants', async () => {
    const v: Voice = { lang: 'PT_PT'.replace('_', '-'), localService: true, name: 'Joana' };
    const synth = makeSynth([v]);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Maria', 'x');
    expect(synth.spoken[0].text).toBe('Maria');
    expect(synth.spoken[0].voice).toBe(v);
  });

  it('uses a voice that becomes available later on the next call', async () => {
    let voices: Voice[] = [];
    const synth = makeSynth(() => voices);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Olá, Maria!', 'Olá!');
    voices = [ptLocal];
    sm.speak('Olá, Maria!', 'Olá!');
    expect(synth.spoken.map((u) => u.text)).toEqual(['Olá!', 'Olá, Maria!']);
    expect(synth.spoken[1].voice).toBe(ptLocal);
  });

  it('does not speak when speech is disabled', async () => {
    const synth = makeSynth([ptLocal]);
    stubWindow(synth);
    const sm = await load();
    sm.toggleSpeech();
    sm.speak('Olá, Maria!', 'Olá!');
    expect(synth.speak).not.toHaveBeenCalled();
    sm.toggleSpeech();
    sm.speak('Olá, Maria!', 'Olá!');
    expect(synth.speak).toHaveBeenCalledTimes(1);
  });

  it('does not speak when saved setting disables speech', async () => {
    vi.stubGlobal('localStorage', makeStorage({ tabuada_speech_enabled: 'false' }));
    const synth = makeSynth([ptLocal]);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Oi');
    expect(synth.speak).not.toHaveBeenCalled();
  });

  it('does not throw when speechSynthesis is unavailable', async () => {
    stubWindow();
    const sm = await load();
    expect(() => sm.speak('Olá', 'Oi')).not.toThrow();
  });

  it('does not throw when speechSynthesis methods throw', async () => {
    const synth = makeSynth([ptLocal]);
    synth.speak.mockImplementation(() => {
      throw new Error('fail');
    });
    stubWindow(synth);
    const sm = await load();
    expect(() => sm.speak('Olá', 'Oi')).not.toThrow();
  });

  it('speaks the given text when no genericText is provided', async () => {
    for (const voices of [[], [ptNetwork], [ptLocal]]) {
      const synth = makeSynth(voices);
      stubWindow(synth);
      const sm = await load();
      sm.speak('Vamos lá!');
      expect(synth.spoken[0].text).toBe('Vamos lá!');
    }
  });

  it('speaks an empty-string genericText instead of falling back to the name', async () => {
    const synth = makeSynth([]);
    stubWindow(synth);
    const sm = await load();
    sm.speak('Olá, Maria!', '');
    expect(synth.spoken[0].text).toBe('');
  });
});
