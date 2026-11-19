import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { collectRuntimePackages, renderServiceWorker, resolveSourceUrl, selectPrecacheFiles, toWebUrl } from './vite-plugins';

describe('resolveSourceUrl', () => {
  it('points at the exact commit in GitHub Actions', () => {
    expect(
      resolveSourceUrl({
        GITHUB_SERVER_URL: 'https://github.com',
        GITHUB_REPOSITORY: 'someone/fork',
        GITHUB_SHA: 'abc123',
      }),
    ).toBe('https://github.com/someone/fork/tree/abc123');
  });

  it('lets VITE_SOURCE_URL override everything', () => {
    expect(resolveSourceUrl({ VITE_SOURCE_URL: 'https://example.org/src', GITHUB_SHA: 'x' })).toBe('https://example.org/src');
  });

  it('falls back to the public repository without CI variables', () => {
    expect(resolveSourceUrl({})).toBe('https://github.com/beltraoluis/GamesEduReinoTabuada');
  });

  it('converts git remotes to web URLs', () => {
    expect(toWebUrl('git@github.com:someone/fork.git')).toBe('https://github.com/someone/fork');
    expect(toWebUrl('https://github.com/beltraoluis/GamesEduReinoTabuada.git')).toBe('https://github.com/beltraoluis/GamesEduReinoTabuada');
    expect(toWebUrl('https://token@gitlab.com/group/app')).toBe('https://gitlab.com/group/app');
    expect(toWebUrl('ssh://git@github.com:22/owner/repo.git')).toBe('https://github.com/owner/repo');
    expect(toWebUrl('/local/path')).toBeUndefined();
  });

  it.skipIf(!existsSync('.git'))('names the local commit when building from a git checkout', () => {
    const saved = { ...process.env };
    for (const key of ['VITE_SOURCE_URL', 'GITHUB_SERVER_URL', 'GITHUB_REPOSITORY', 'GITHUB_SHA']) delete process.env[key];
    try {
      expect(resolveSourceUrl()).toMatch(/^https:\/\/[^/]+\/.+\/tree\/[0-9a-f]{40}$/);
    } finally {
      Object.assign(process.env, saved);
    }
  });
});

describe('selectPrecacheFiles', () => {
  it('keeps the app shell, Latin fonts and icons, and drops the rest', () => {
    expect(
      selectPrecacheFiles([
        'index.html',
        'sw.js',
        'manifest.webmanifest',
        'LICENSE.txt',
        'icons/icon-192.png',
        'assets/index-abc.js',
        'assets/index-abc.css',
        'assets/nunito-latin-wght-normal-x.woff2',
        'assets/nunito-latin-ext-wght-normal-x.woff2',
        'assets/nunito-cyrillic-wght-normal-x.woff2',
        'assets/fredoka-latin-700-normal-x.woff',
      ]),
    ).toEqual([
      'LICENSE.txt',
      'assets/index-abc.css',
      'assets/index-abc.js',
      'assets/nunito-latin-wght-normal-x.woff2',
      'icons/icon-192.png',
      'index.html',
      'manifest.webmanifest',
    ]);
  });
});

describe('renderServiceWorker', () => {
  it('embeds the versioned cache and file list as valid JavaScript', () => {
    const source = renderServiceWorker(['index.html', 'assets/a.js'], 'v1');
    expect(source).toContain('CACHE_PREFIX + "v1"');
    expect(source).toContain('["index.html","assets/a.js"]');
    expect(() => new Function(source)).not.toThrow();
  });
});

describe('collectRuntimePackages', () => {
  it('includes transitive runtime dependencies such as scheduler', () => {
    const names = collectRuntimePackages(process.cwd()).map((pkg) => pkg.name);
    expect(names).toEqual(expect.arrayContaining(['react', 'react-dom', 'scheduler', 'canvas-confetti', 'tailwindcss', 'vite']));
    expect(names).not.toContain('vitest');
  });
});
