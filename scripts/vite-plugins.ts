import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

const DEFAULT_SOURCE_URL = 'https://github.com/beltraoluis/GamesEduReinoTabuada';

/**
 * Public URL of the exact source code of this build (AGPL-3.0 §13).
 * In GitHub Actions it points at the commit being built, so forks link to
 * their own repository automatically. VITE_SOURCE_URL overrides it.
 */
export function resolveSourceUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.VITE_SOURCE_URL) return env.VITE_SOURCE_URL;
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_SHA } = env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_SHA) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/tree/${GITHUB_SHA}`;
  }
  if (env !== process.env) return DEFAULT_SOURCE_URL;
  localSourceUrl ??= resolveLocalSourceUrl();
  return localSourceUrl;
}

let localSourceUrl: string | undefined;

function resolveLocalSourceUrl(): string {
  // Local build: link the checkout's own remote (works for forks) at HEAD.
  const sha = git('rev-parse', 'HEAD');
  if (!sha || !/^[0-9a-f]{40}$/.test(sha)) return DEFAULT_SOURCE_URL;
  const repoUrl = toWebUrl(git('remote', 'get-url', 'origin')) ?? DEFAULT_SOURCE_URL;
  if (git('status', '--porcelain')) {
    console.warn(
      '[source-url] Uncommitted changes: the "Código-fonte desta versão" link points at HEAD, ' +
        'which differs from this build. Commit and push first, or set VITE_SOURCE_URL before publishing.',
    );
  }
  return `${repoUrl}/tree/${sha}`;
}

function git(...args: string[]): string | undefined {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

/** git@host:owner/repo.git or https://host/owner/repo.git → https://host/owner/repo */
export function toWebUrl(remote: string | undefined): string | undefined {
  if (!remote) return undefined;
  const sshUrl = remote.match(/^ssh:\/\/(?:[^@/]+@)?([^:/]+)(?::\d+)?\/(.+?)(?:\.git)?\/?$/);
  if (sshUrl) return `https://${sshUrl[1]}/${sshUrl[2]}`;
  const scp = remote.match(/^(?:[^@/]+@)?([^:/]+):(?!\/)(.+?)(?:\.git)?\/?$/);
  if (scp) return `https://${scp[1]}/${scp[2]}`;
  const https = remote.match(/^https:\/\/(?:[^@/]+@)?([^/]+)\/(.+?)(?:\.git)?\/?$/);
  return https ? `https://${https[1]}/${https[2]}` : undefined;
}

interface PackageJson {
  name: string;
  version: string;
  license?: string;
  homepage?: string;
  dependencies?: Record<string, string>;
}

function readPackage(root: string, name: string): { dir: string; pkg: PackageJson } | undefined {
  const dir = join(root, 'node_modules', name);
  const file = join(dir, 'package.json');
  if (!existsSync(file)) return undefined;
  return { dir, pkg: JSON.parse(readFileSync(file, 'utf8')) as PackageJson };
}

function readLicenseText(dir: string): string | undefined {
  const file = readdirSync(dir).find((entry) => /^licen[cs]e(\.(md|txt))?$/i.test(entry));
  return file ? readFileSync(join(dir, file), 'utf8').trim() : undefined;
}

// Build-time packages whose code is copied into the output (Tailwind's
// Preflight reset ships inside the generated CSS; Vite injects its
// modulepreload polyfill and preload helper into the entry chunk).
const BUNDLED_DEV_PACKAGES = ['tailwindcss', 'vite'];

/** Runtime dependencies (transitively) that end up in the published bundle. */
export function collectRuntimePackages(root: string): PackageJson[] {
  const own = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJson;
  const queue = [...Object.keys(own.dependencies ?? {}), ...BUNDLED_DEV_PACKAGES];
  const seen = new Map<string, PackageJson>();
  while (queue.length > 0) {
    const name = queue.shift()!;
    if (seen.has(name)) continue;
    const found = readPackage(root, name);
    if (!found) continue;
    seen.set(name, found.pkg);
    queue.push(...Object.keys(found.pkg.dependencies ?? {}));
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Emits LICENSE.txt (this project's AGPL-3.0 text) and THIRD-PARTY-NOTICES.txt
 * (licenses of every bundled runtime dependency) next to index.html.
 */
export function licenseFilesPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: 'license-files',
    apply: 'build',
    configResolved(config) {
      root = config.root;
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'LICENSE.txt', source: readFileSync(join(root, 'LICENSE'), 'utf8') });

      const sections = collectRuntimePackages(root).map((pkg) => {
        const text = readLicenseText(join(root, 'node_modules', pkg.name)) ?? `License: ${pkg.license ?? 'unknown'}`;
        return [`${pkg.name}@${pkg.version} (${pkg.license ?? 'unknown'})`, pkg.homepage ?? '', '', text]
          .filter((line, index) => index !== 1 || line)
          .join('\n');
      });
      const header = [
        'Reino da Tabuada Mágica',
        'Copyright (C) 2026 Luis Henrique Coutinho Beltrao',
        'Licensed under the GNU Affero General Public License v3.0 only (AGPL-3.0-only). See LICENSE.txt.',
        `Source code: ${resolveSourceUrl()}`,
        '',
        'This build bundles the following third-party software under their own licenses:',
      ].join('\n');
      const divider = `\n\n${'='.repeat(78)}\n\n`;
      this.emitFile({
        type: 'asset',
        fileName: 'THIRD-PARTY-NOTICES.txt',
        // BOM: GitHub Pages serves .txt without a charset, and the text has accents.
        source: `\uFEFF${header}${divider}${sections.join(divider)}\n`,
      });
    },
  };
}

const PRECACHE_PATTERN = /\.(html|js|css|png|svg|webmanifest|txt)$/;
// Only the Latin subsets are needed for Portuguese; other subsets stay on-demand.
export const FONT_PATTERN = /-latin-(?!ext)[^/]*\.woff2$/;

export function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

/** Files the service worker downloads at install time so the game works offline. */
export function selectPrecacheFiles(files: string[]): string[] {
  return files
    .filter((file) => file !== 'sw.js' && (PRECACHE_PATTERN.test(file) || FONT_PATTERN.test(file)))
    .sort();
}

export function renderServiceWorker(files: string[], version: string): string {
  return `// Generated at build time by scripts/vite-plugins.ts. Do not edit.
const SCOPE = self.registration.scope;
// Several apps (or copies of this one) can share a GitHub Pages origin, so the
// cache name is tied to this worker's scope and cleanup never touches others.
const CACHE_PREFIX = 'tabuada-offline:' + SCOPE + ':';
const CACHE = CACHE_PREFIX + ${JSON.stringify(version)};
const FILES = ${JSON.stringify(files)};
const NAVIGATION_TIMEOUT_MS = 4000;
const scopeUrl = (path) => new URL(path, SCOPE).href;
const INDEX_URL = scopeUrl('index.html');
const SHELL_URLS = new Set([SCOPE, INDEX_URL]);
// Precache entries are matched by URL only: dev/preview servers add headers such
// as "Vary: Origin" that would otherwise make cached responses never match.
const MATCH_OPTIONS = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(FILES.map((file) => new Request(scopeUrl(file), { cache: 'reload' }))),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Look in this version's cache first, then in other versions of this app.
// After a deploy, an open tab can load the new index.html while the old worker
// is still in control; the new chunks are then in the waiting worker's cache.
function fromCache(url) {
  return caches.open(CACHE).then((cache) => cache.match(url, MATCH_OPTIONS)).then((hit) => {
    if (hit) return hit;
    return caches.keys().then((keys) =>
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .reduce(
          (found, key) => found.then((response) => response || caches.open(key).then((cache) => cache.match(url, MATCH_OPTIONS))),
          Promise.resolve(undefined),
        ),
    );
  });
}

function networkWithTimeout(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), NAVIGATION_TIMEOUT_MS);
    fetch(request).then(
      (response) => { clearTimeout(timer); resolve(response); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(SCOPE)) return;
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  const cleanUrl = url.href;

  if (request.mode === 'navigate') {
    const isShell = SHELL_URLS.has(cleanUrl);
    const offlineCopy = () => fromCache(isShell ? INDEX_URL : cleanUrl);
    // Network first so a new deploy is picked up when online. HTTP errors such
    // as 404 (including an unpublished site) are passed through; the game shell
    // falls back to the cached copy only when offline, on timeout or on a 5xx,
    // and other precached pages are served by exact URL.
    event.respondWith(
      networkWithTimeout(request)
        .then((response) => (isShell && response.status >= 500 ? offlineCopy().then((cached) => cached || response) : response))
        .catch(() => offlineCopy().then((cached) => cached || Response.error())),
    );
    return;
  }

  // Hashed assets never change: cache first, network as fallback.
  event.respondWith(fromCache(request.url).then((cached) => cached || fetch(request)));
});
`;
}

/**
 * Generates dist/sw.js with a precache list of the final build output, so the
 * game (all mini-games, fonts and icons) keeps working without a connection.
 */
export function offlinePlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'offline-service-worker',
    apply: 'build',
    configResolved(resolved) {
      config = resolved;
    },
    closeBundle() {
      const outDir = resolve(config.root, config.build.outDir);
      const files = selectPrecacheFiles(
        listFiles(outDir).map((file) => relative(outDir, file).split(sep).join('/')),
      );
      const hash = createHash('sha256');
      for (const file of files) hash.update(file).update(readFileSync(join(outDir, file)));
      const version = hash.digest('hex').slice(0, 16);
      writeFileSync(join(outDir, 'sw.js'), renderServiceWorker(files, version));
    },
  };
}
