import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, sanitizeName, sanitizeProgress } from './progress';
import { DEFAULT_PROGRESS } from './gameData';

describe('sanitizeProgress', () => {
  it('returns defaults for non-objects', () => {
    expect(sanitizeProgress(null)).toEqual(DEFAULT_PROGRESS);
    expect(sanitizeProgress([])).toEqual(DEFAULT_PROGRESS);
  });

  it('clamps and filters hostile data', () => {
    const p = sanitizeProgress({
      playerName: '  ' + 'x'.repeat(50),
      stars: 1e12,
      gems: -5,
      highScoreRunner: 3.7,
      unlockedMascots: ['dino', 'evil', 'dino'],
      selectedMascot: 'sol',
      selectedHat: 'crown',
      unlockedAccessories: ['crown'],
      completedLevels: { a: 99, b: -1 },
      unlockedAchievements: ['nope'],
    });
    expect(p.playerName).toHaveLength(20);
    expect(p.stars).toBe(1_000_000);
    expect(p.gems).toBe(0);
    expect(p.highScoreRunner).toBe(3);
    expect(p.unlockedMascots).toEqual(['pip', 'lunna', 'dino']);
    expect(p.selectedMascot).toBe('pip');
    expect(p.selectedHat).toBe('crown');
    expect(p.completedLevels).toEqual({ a: 3, b: 0 });
    expect(p.unlockedAchievements).toEqual(['welcome']);
  });

  it('falls back on empty name', () => {
    expect(sanitizeProgress({ playerName: '   ' }).playerName).toBe(DEFAULT_PROGRESS.playerName);
  });
});

const FIELDS = [
  'playerName', 'stars', 'gems', 'highScoreRunner', 'highScoreBalloons', 'highScoreCauldron',
  'selectedMascot', 'selectedHat', 'unlockedMascots', 'unlockedAccessories',
  'completedLevels', 'unlockedAchievements',
] as const;

const VALID = {
  challenge: structuredClone(DEFAULT_PROGRESS.challenge),
  playerName: 'Maria',
  stars: 42,
  gems: 7,
  highScoreRunner: 120,
  highScoreBalloons: 55,
  highScoreCauldron: 9,
  selectedMascot: 'dino',
  selectedHat: 'wizard',
  unlockedMascots: ['pip', 'lunna', 'dino', 'sol'],
  unlockedAccessories: ['none', 'wizard', 'crown'],
  completedLevels: { 'w1-l1': 3, 'w1-l2': 2, 'w2-l1': 1 },
  unlockedAchievements: ['welcome', 'first_win', 'combo_master'],
};

describe('sanitizeProgress round-trip', () => {
  it('keeps a legitimate saved progress unchanged', () => {
    expect(sanitizeProgress(VALID)).toEqual(VALID);
  });

  it('keeps it unchanged through JSON.stringify/parse', () => {
    expect(sanitizeProgress(JSON.parse(JSON.stringify(VALID)))).toEqual(VALID);
  });

  it('is idempotent', () => {
    const once = sanitizeProgress(VALID);
    expect(sanitizeProgress(once)).toEqual(once);
  });

  it('always includes every field', () => {
    for (const input of [{}, { gems: 'x' }, VALID, null, 5, 'str']) {
      const p = sanitizeProgress(input);
      for (const f of FIELDS) expect(p).toHaveProperty(f);
    }
  });

  it('always keeps default unlocks even if absent from saved data', () => {
    const p = sanitizeProgress({ unlockedMascots: ['dino'], unlockedAccessories: [], unlockedAchievements: [] });
    expect(p.unlockedMascots).toEqual(expect.arrayContaining(['pip', 'lunna', 'dino']));
    expect(p.unlockedAccessories).toContain('none');
    expect(p.unlockedAchievements).toContain('welcome');
  });
});

describe('sanitizeProgress prototype pollution', () => {
  it('does not pollute Object.prototype via top-level __proto__ and keeps valid fields', () => {
    const p = sanitizeProgress(JSON.parse('{"__proto__":{"polluted":1},"gems":5}'));
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect((p as unknown as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(p)).toBe(Object.prototype);
    expect(p.gems).toBe(5);
  });

  it('ignores hostile keys in completedLevels', () => {
    const p = sanitizeProgress(
      JSON.parse('{"completedLevels":{"__proto__":3,"constructor":2,"polluted":1,"ok":1}}'),
    );
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(p.completedLevels)).toBe(Object.prototype);
    expect(p.completedLevels.ok).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(p.completedLevels, '__proto__')).toBe(false);
  });
});

describe('sanitizeProgress numbers', () => {
  const numFields = ['stars', 'gems', 'highScoreRunner', 'highScoreBalloons', 'highScoreCauldron'] as const;

  it('falls back to default for NaN/Infinity', () => {
    for (const f of numFields) {
      const d = sanitizeProgress({});
      for (const bad of [NaN, Infinity, -Infinity]) {
        expect(sanitizeProgress({ [f]: bad })[f]).toBe(d[f]);
      }
    }
  });

  it('clamps negatives to 0, truncates fractions, caps huge values', () => {
    for (const f of numFields) {
      expect(sanitizeProgress({ [f]: -1 })[f]).toBe(0);
      expect(sanitizeProgress({ [f]: -0.5 })[f]).toBe(0);
      expect(sanitizeProgress({ [f]: 2.99 })[f]).toBe(2);
      expect(sanitizeProgress({ [f]: Number.MAX_VALUE })[f]).toBe(1_000_000);
      expect(sanitizeProgress({ [f]: Number.MAX_SAFE_INTEGER })[f]).toBe(1_000_000);
      expect(sanitizeProgress({ [f]: 1_000_000 })[f]).toBe(1_000_000);
    }
  });

  it('does not produce NaN or negative zero issues', () => {
    const p = sanitizeProgress({ gems: -0.2 });
    expect(Object.is(p.gems, -0)).toBe(false);
  });

  it('rejects numeric strings and other wrong types for numbers', () => {
    const d = sanitizeProgress({});
    for (const f of numFields) {
      for (const bad of ['5', true, null, [], {}, undefined]) {
        expect(sanitizeProgress({ [f]: bad })[f]).toBe(d[f]);
      }
    }
  });
});

describe('sanitizeProgress wrong types for every field', () => {
  const d = sanitizeProgress({});
  const wrongValues: unknown[] = [123, 'text', true, null, {}, [], () => 1];

  it('never throws and falls back to defaults for every field', () => {
    for (const f of FIELDS) {
      for (const bad of wrongValues) {
        if (f === 'playerName' && bad === 'text') continue; // valid string
        if (bad === 123 && ['stars', 'gems', 'highScoreRunner', 'highScoreBalloons', 'highScoreCauldron'].includes(f)) continue; // valid number
        if ((f === 'selectedMascot' || f === 'selectedHat') && typeof bad === 'string') {
          expect(sanitizeProgress({ [f]: bad })[f]).toBe(d[f]); // unknown id
          continue;
        }
        const p = sanitizeProgress({ [f]: bad });
        // arrays are a legal shape for id lists; objects for completedLevels
        if (f === 'unlockedMascots' || f === 'unlockedAccessories' || f === 'unlockedAchievements') {
          expect(p[f]).toEqual(d[f]);
        } else if (f === 'completedLevels') {
          expect(p[f]).toEqual({});
        } else {
          expect(p[f]).toEqual(d[f]);
        }
      }
    }
  });

  it('ignores non-string and unknown entries in id lists', () => {
    const p = sanitizeProgress({
      unlockedMascots: [1, null, {}, [], 'dino', 'toString', '__proto__', 'constructor'],
      unlockedAccessories: ['wizard', 7, 'hasOwnProperty'],
      unlockedAchievements: ['first_win', false, 'x'],
    });
    expect(p.unlockedMascots).toEqual(['pip', 'lunna', 'dino']);
    expect(p.unlockedAccessories).toEqual(['none', 'wizard']);
    expect(p.unlockedAchievements).toEqual(['welcome', 'first_win']);
  });

  it('returns defaults for primitives and arrays at the top level', () => {
    for (const bad of [undefined, 0, 'x', true, [VALID]]) {
      expect(sanitizeProgress(bad)).toEqual(DEFAULT_PROGRESS);
    }
  });

  it('does not mutate DEFAULT_PROGRESS when result is modified', () => {
    const before = JSON.stringify(DEFAULT_PROGRESS);
    const p = sanitizeProgress({ unlockedMascots: ['dino'] });
    p.unlockedMascots.push('x');
    p.completedLevels.z = 1;
    expect(JSON.stringify(DEFAULT_PROGRESS)).toBe(before);
  });
});

describe('sanitizeProgress selection fallbacks', () => {
  it('falls back when selected mascot is known but not unlocked', () => {
    expect(sanitizeProgress({ selectedMascot: 'estrela' }).selectedMascot).toBe('pip');
  });

  it('falls back when selected hat is known but not unlocked', () => {
    expect(sanitizeProgress({ selectedHat: 'crown' }).selectedHat).toBe('none');
  });

  it('falls back when selected ids are unknown or wrong type', () => {
    for (const bad of ['evil', '', 42, null, ['pip']]) {
      const p = sanitizeProgress({ selectedMascot: bad, selectedHat: bad });
      expect(p.selectedMascot).toBe('pip');
      expect(p.selectedHat).toBe('none');
    }
  });

  it('honours selection when unlocked', () => {
    const p = sanitizeProgress({
      unlockedMascots: ['sol'], selectedMascot: 'sol',
      unlockedAccessories: ['cap'], selectedHat: 'cap',
    });
    expect(p.selectedMascot).toBe('sol');
    expect(p.selectedHat).toBe('cap');
  });

  it('falls back when the unlock list that contained the selection is dropped', () => {
    expect(sanitizeProgress({ unlockedMascots: ['bogus'], selectedMascot: 'bogus' }).selectedMascot).toBe('pip');
  });

  it('migrates legacy headphones accessory id to sunglasses while keeping unlocks', () => {
    const p = sanitizeProgress({
      unlockedAccessories: ['none', 'crown', 'headphones'],
      selectedHat: 'headphones',
    });
    expect(p.unlockedAccessories).toEqual(['none', 'crown', 'sunglasses']);
    expect(p.selectedHat).toBe('sunglasses');
  });

  it('does not equip sunglasses when legacy headphones was not unlocked', () => {
    const p = sanitizeProgress({
      unlockedAccessories: ['none', 'crown'],
      selectedHat: 'headphones',
    });
    expect(p.unlockedAccessories).toEqual(['none', 'crown']);
    expect(p.selectedHat).toBe('none');
  });
});

describe('sanitizeProgress completedLevels', () => {
  it('clamps values to 0..3 and truncates', () => {
    const p = sanitizeProgress({ completedLevels: { a: 2.9, b: 100, c: -100, d: 0 } });
    expect(p.completedLevels).toEqual({ a: 2, b: 3, c: 0, d: 0 });
  });

  it('drops non-number and non-finite values', () => {
    const p = sanitizeProgress({
      completedLevels: { a: '3', b: null, c: NaN, d: Infinity, e: {}, f: [1], g: true, ok: 1 },
    });
    expect(p.completedLevels).toEqual({ ok: 1 });
  });

  it('drops over-long keys', () => {
    const p = sanitizeProgress({ completedLevels: { ['k'.repeat(65)]: 1, ['k'.repeat(64)]: 2 } });
    expect(Object.keys(p.completedLevels)).toEqual(['k'.repeat(64)]);
  });

  it('caps number of entries', () => {
    const big: Record<string, number> = {};
    for (let i = 0; i < 2000; i++) big['l' + i] = 1;
    expect(Object.keys(sanitizeProgress({ completedLevels: big }).completedLevels).length).toBeLessThanOrEqual(500);
  });

  it('treats arrays and primitives as empty', () => {
    for (const bad of [[1, 2, 3], 'abc', 5, null]) {
      expect(sanitizeProgress({ completedLevels: bad }).completedLevels).toEqual({});
    }
  });
});

describe('sanitizeProgress player name', () => {
  it('strips control characters', () => {
    expect(sanitizeProgress({ playerName: 'Ma\u0000ri\na\t\u007f' }).playerName).toBe('Maria');
  });

  it('truncates to the max length', () => {
    const p = sanitizeProgress({ playerName: 'a'.repeat(100) });
    expect(p.playerName).toBe('a'.repeat(MAX_NAME_LENGTH));
  });

  it('uses default for whitespace-only or control-only names', () => {
    for (const n of ['   ', '\n\t', '\u0000\u0001', '']) {
      expect(sanitizeProgress({ playerName: n }).playerName).toBe(DEFAULT_PROGRESS.playerName);
    }
  });
});

describe('sanitizeName', () => {
  it('returns default for non-strings', () => {
    for (const bad of [undefined, null, 5, {}, [], ['a'], true]) {
      expect(sanitizeName(bad)).toBe(DEFAULT_PROGRESS.playerName);
    }
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeName('  Ana  ')).toBe('Ana');
  });

  it('keeps inner spaces and accented/emoji characters', () => {
    expect(sanitizeName('João Pé')).toBe('João Pé');
    expect(sanitizeName('Lu 🦊')).toBe('Lu 🦊');
  });

  it('does not leave trailing whitespace after truncation', () => {
    const name = 'a'.repeat(MAX_NAME_LENGTH - 1) + '   b';
    const out = sanitizeName(name);
    expect(out).toBe('a'.repeat(MAX_NAME_LENGTH - 1));
    expect(out.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
  });

  it('is exactly max length at the boundary and truncates one over', () => {
    expect(sanitizeName('b'.repeat(MAX_NAME_LENGTH))).toHaveLength(MAX_NAME_LENGTH);
    expect(sanitizeName('b'.repeat(MAX_NAME_LENGTH + 1))).toHaveLength(MAX_NAME_LENGTH);
  });

  it('is idempotent', () => {
    for (const n of ['  x\u0001y  ', 'a'.repeat(30), '   ']) {
      expect(sanitizeName(sanitizeName(n))).toBe(sanitizeName(n));
    }
  });
});

describe('player name profanity protection', () => {
  it.each(['puta', 'p.u.t.a', 'p u t a', 'c@r@lh0', 'puuuta', 'mérda', 'p\u0000uta', 'Lucasputa', 'ｐｕｔａ', 'рutа', 'p1u1t1a', 'Maria Cu', 'Ana Pau', 'Lucas_cu', 'Lucas p u t a', 'p😀u😀t😀a', 'Lucasfdp', 'Lucascu', 'cuLucas', 'f d p', 'c u', 'Hansscheisse', 'Lucascazzo', 'Lucasfuck', 'Ro La', 'Ana L A', 'Cu Lo', 'Fu Ck', 'f1d1p', 'c2u', 'f*ck', '8itch', 'ca22o', 'f|ck', 'Dick', 'Fick', 'finocchio', 'deficiente', 'handicappato', 'behindert', 'negro', 'sl8t', 'cuLucas', 'Lucaspau'])('replaces offensive saved name %s', (name) => {
    expect(sanitizeName(name)).toBe(DEFAULT_PROGRESS.playerName);
    expect(sanitizeProgress({ playerName: name }).playerName).toBe(DEFAULT_PROGRESS.playerName);
  });

  it.each(['Lucas', 'Cauã', 'Cássia', 'Assis', 'Analu', 'João Pedro', 'Computador', 'Ana L.', 'Ana 1', 'A 55', 'Computador123', 'Deputada1', 'Jürgen', 'Müller', 'Annalisa', 'Analena', 'Dickens', 'Cockburn', 'Pussycat', 'Ana Lu', 'Ana Lu Maria', 'Ro L', 'Paulinho', 'Paul2', 'Cunha', 'Assunção', 'Hitchcock', 'Cazzola', 'Cálculo', 'Cueca', 'Carvalho', 'Carvalhal', 'Paulino', 'Assunta', 'Cazzolato', 'Rolla', 'Ana1'])('preserves innocent saved name %s', (name) => {
    expect(sanitizeName(name)).toBe(name);
    expect(sanitizeProgress({ playerName: name }).playerName).toBe(name);
  });

  it('checks the final cleaned name after truncating', () => {
    expect(sanitizeName(' '.repeat(3) + 'a'.repeat(15) + ' putaZ')).toBe(DEFAULT_PROGRESS.playerName);
  });
});

// These same pure handlers are called by App's runner/wardrobe state updaters.
import { allWorldsCompleted, meetsUnlockRequirement, recordWorldCompletion, unlockMascot, unlockAccessory } from './progress';
import { ACCESSORY_HATS, MASCOT_LIST } from './gameData';
import { WORLDS } from './mathEngine';

describe('runner completion and gated mascot purchases', () => {
  const top = MASCOT_LIST.find(item => item.id === 'estrela')!;
  const rich = { ...DEFAULT_PROGRESS, gems: 10000 };
  const completed = { ...rich, completedLevels: Object.fromEntries(WORLDS.map(w => [w.id, 1])) };

  it('blocks the top mascot even with enough gems until every canonical realm is won', () => {
    expect(unlockMascot(rich, top.id, top.cost)).toBe(rich);
    for (const world of WORLDS) {
      const partial = { ...completed, completedLevels: { ...completed.completedLevels, [world.id]: 0 } };
      expect(allWorldsCompleted(partial)).toBe(false);
      expect(unlockMascot(partial, top.id, top.cost)).toBe(partial);
    }
    expect(allWorldsCompleted(completed)).toBe(true);
    expect(meetsUnlockRequirement(top, completed)).toBe(true);
    const bought = unlockMascot(completed, top.id, top.cost);
    expect(bought.gems).toBe(completed.gems - top.cost);
    expect(bought.selectedMascot).toBe(top.id);
    expect(bought.unlockedMascots).toContain(top.id);
    expect(unlockMascot(bought, top.id, top.cost)).toBe(bought);
  });

  it('refuses forged prices, unknown ids and insufficient funds', () => {
    expect(unlockMascot(completed, top.id, 0)).toBe(completed);
    expect(unlockMascot(completed, 'unknown', 0)).toBe(completed);
    const poor = { ...completed, gems: top.cost - 1 };
    expect(unlockMascot(poor, top.id, top.cost)).toBe(poor);
    const dino = MASCOT_LIST.find(item => item.id === 'dino')!;
    expect(meetsUnlockRequirement(dino, rich)).toBe(true);
    expect(unlockMascot(rich, dino.id, dino.cost).unlockedMascots).toContain(dino.id);
  });

  it('records the selected realm, preserves best stars and ignores failed/invalid runs', () => {
    let result = recordWorldCompletion(rich, 'world-3', 2);
    expect(result.completedLevels).toEqual({ 'world-3': 2 });
    result = recordWorldCompletion(result, 'world-3', 1);
    expect(result.completedLevels['world-3']).toBe(2);
    result = recordWorldCompletion(result, 'world-3', 3);
    expect(result.completedLevels['world-3']).toBe(3);
    expect(recordWorldCompletion(result, 'world-4', 0)).toBe(result);
    expect(recordWorldCompletion(result, '__proto__', 3)).toBe(result);
    expect(recordWorldCompletion(result, 'world-4', NaN)).toBe(result);
    expect(rich.completedLevels).toEqual({});
  });

  it('keeps canonical world ids and their gate through sanitize/save/load', () => {
    const loaded = sanitizeProgress(JSON.parse(JSON.stringify(completed)));
    expect(loaded.completedLevels).toEqual(completed.completedLevels);
    expect(allWorldsCompleted(loaded)).toBe(true);
    const legacy = { ...rich, completedLevels: Object.fromEntries(WORLDS.map(w => [`${w.id}_0`, 3])) };
    expect(allWorldsCompleted(legacy)).toBe(false);
    expect(allWorldsCompleted({ completedLevels: { 'world-1': NaN } })).toBe(false);
  });
});


describe('accessory purchases', () => {
  const crown = ACCESSORY_HATS.find(item => item.id === 'crown')!;
  const rich = { ...DEFAULT_PROGRESS, gems: 10000 };
  const completed = { ...rich, gems: 1000, completedLevels: Object.fromEntries(WORLDS.map(w => [w.id, 1])) };

  it('requires every canonical realm even when gems suffice', () => {
    expect(unlockAccessory(rich, crown.id, crown.cost)).toBe(rich);
    for (const world of WORLDS) {
      const partial = { ...completed, completedLevels: { ...completed.completedLevels, [world.id]: 0 } };
      expect(unlockAccessory(partial, crown.id, crown.cost)).toBe(partial);
    }
    const legacy = { ...rich, completedLevels: Object.fromEntries(WORLDS.map(w => [`${w.id}_0`, 3])) };
    expect(unlockAccessory(legacy, crown.id, crown.cost)).toBe(legacy);
  });

  it('spends the exact balance and unlocks and selects the crown exactly once', () => {
    const bought = unlockAccessory(completed, crown.id, crown.cost);
    expect(bought.gems).toBe(0);
    expect(bought.selectedHat).toBe(crown.id);
    expect(bought.unlockedAccessories).toEqual([...completed.unlockedAccessories, crown.id]);
    expect(completed.unlockedAccessories).not.toContain(crown.id);
    const richDuplicate = { ...bought, gems: 10000 };
    expect(unlockAccessory(richDuplicate, crown.id, crown.cost)).toBe(richDuplicate);
  });

  it('rejects insufficient gems, forged prices, unknown and legacy accessory ids', () => {
    const poor = { ...completed, gems: crown.cost - 1 };
    expect(unlockAccessory(poor, crown.id, crown.cost)).toBe(poor);
    for (const cost of [0, 390, 999, 1001, -1, NaN, Infinity]) {
      expect(unlockAccessory(completed, crown.id, cost)).toBe(completed);
    }
    expect(unlockAccessory(rich, 'unknown', 0)).toBe(rich);
    expect(unlockAccessory(rich, 'headphones', 290)).toBe(rich);
  });

  it('keeps ordinary hats available without realm completion at canonical prices', () => {
    for (const [id, cost] of Object.entries({ cap: 80, flower: 80, wizard: 190, sunglasses: 290 })) {
      const bought = unlockAccessory({ ...rich, gems: cost }, id, cost);
      expect(bought.gems).toBe(0);
      expect(bought.selectedHat).toBe(id);
      expect(bought.unlockedAccessories).toContain(id);
      expect(unlockAccessory(rich, id, 0)).toBe(rich);
    }
  });

  it('preserves previously unlocked crowns and migrates legacy accessories on load', () => {
    const loaded = sanitizeProgress({ ...rich, selectedHat: 'crown', unlockedAccessories: ['none', 'crown', 'headphones'] });
    expect(loaded.selectedHat).toBe('crown');
    expect(loaded.unlockedAccessories).toEqual(['none', 'crown', 'sunglasses']);
    expect(allWorldsCompleted(loaded)).toBe(false);
    expect(unlockAccessory(loaded, crown.id, crown.cost)).toBe(loaded);
  });
});

import { canBuyChallenge, purchaseChallenge, recordChallengeResult, bestChallengeTitle, isChallengeAvailable } from './progress';

import { summarizeChallenge } from './challengeEngine';

describe('isolated challenge progress', () => {
  const ready = () => ({ ...structuredClone(DEFAULT_PROGRESS), stars: 45, gems: 2500,
    completedLevels: Object.fromEntries(WORLDS.map(w => [w.id, 3])) });
  it('requires all five canonical realms and 2000 gems, spends once', () => {
    const input = ready();
    expect(isChallengeAvailable(input)).toBe(true);
    expect(canBuyChallenge(input)).toBe(true);
    const bought = purchaseChallenge(input);
    expect(bought.gems).toBe(500);
    expect(bought.challenge.unlocked).toBe(true);
    expect(bought.stars).toBe(input.stars);
    expect(bought.completedLevels).toBe(input.completedLevels);
    expect(bought.unlockedAchievements).toBe(input.unlockedAchievements);
    expect(purchaseChallenge(bought)).toBe(bought);
    for (const locked of [{ ...input, gems: 1999 }, { ...input, completedLevels: {} },
      { ...input, completedLevels: { ...input.completedLevels, 'world-5': 0 } }]) {
      expect(purchaseChallenge(locked)).toBe(locked);
    }
  });
  it('records attempts, score, streak and only upgrades medals without any economy mutation', () => {
    const input = purchaseChallenge(ready());
    const gold = summarizeChallenge({ correct: 24, wrong: 0, timeouts: 0, score: 5000, bestStreak: 24, durationSec: 50 });
    const result = recordChallengeResult(input, gold);
    for (const key of ['stars', 'gems', 'completedLevels', 'unlockedAchievements'] as const) expect(result[key]).toBe(input[key]);
    expect(input.challenge.attempts).toBe(0);
    expect(result.challenge).toEqual({ ...input.challenge, attempts: 1, bestScore: 5000, bestStreak: 24, bestMedal: 'gold' });
    const replay = recordChallengeResult(result, { ...gold, score: 10, bestStreak: 1, correct: 22, wrong: 2, medal: 'bronze' });
    expect(replay.challenge.bestMedal).toBe('gold');
    expect(replay.challenge.bestScore).toBe(5000);
    expect(replay.challenge.bestStreak).toBe(24);
    expect(replay.challenge.attempts).toBe(2);
    expect(bestChallengeTitle(replay)).toBe('Mestre da Torre');
    expect(bestChallengeTitle(input)).toBeNull();
  });
  it('migrates missing fields and clamps hostile fields while retaining an actual saved boolean', () => {
    expect(sanitizeProgress({}).challenge).toEqual(DEFAULT_PROGRESS.challenge);
    for (const challenge of [null, [], true, 'gold', 9]) expect(sanitizeProgress({ challenge }).challenge).toEqual(DEFAULT_PROGRESS.challenge);
    expect(sanitizeProgress({ challenge: { unlocked: 'true', attempts: -2, bestScore: Infinity, bestStreak: 999, bestMedal: '__proto__' } }).challenge)
      .toEqual({ unlocked: false, attempts: 0, bestScore: 0, bestStreak: 24, bestMedal: 'none' });
    expect(sanitizeProgress({ challenge: { unlocked: true, attempts: 2.9, bestScore: 1e12, bestStreak: '4', bestMedal: 'silver' } }).challenge)
      .toEqual({ unlocked: true, attempts: 2, bestScore: 1000000, bestStreak: 0, bestMedal: 'silver' });
  });
});

it('refuses to record a challenge before its permanent unlock', () => {
  const locked = structuredClone(DEFAULT_PROGRESS);
  const result = summarizeChallenge({ correct: 24, wrong: 0, timeouts: 0, score: 5000, bestStreak: 24, durationSec: 90 });
  expect(recordChallengeResult(locked, result)).toBe(locked);
});
