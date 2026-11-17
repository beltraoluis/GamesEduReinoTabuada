import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';

const outputDirectory = resolve(process.argv[2] ?? 'dist');
const assetsDirectory = resolve(outputDirectory, 'assets');
const initialGzipBudgetBytes = 105 * 1024;
const totalGzipBudgetBytes = 150 * 1024;

function getAttribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2];
}

function resolveAssetPath(url: string): string {
  const pathname = new URL(url, 'https://bundle-check.invalid').pathname;
  const match = pathname.match(/(?:^|\/)assets\/(.+\.js)$/);
  if (!match) throw new Error(`Unexpected JavaScript asset URL in index.html: ${url}`);

  const assetPath = resolve(assetsDirectory, decodeURIComponent(match[1]));
  if (!assetPath.startsWith(`${assetsDirectory}${sep}`)) {
    throw new Error(`JavaScript asset escapes the assets directory: ${url}`);
  }
  if (!statSync(assetPath).isFile()) throw new Error(`JavaScript asset is not a file: ${url}`);
  return assetPath;
}

function findJavaScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) return findJavaScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

function measure(files: string[]) {
  return files.reduce(
    (totals, file) => {
      const contents = readFileSync(file);
      return {
        rawBytes: totals.rawBytes + contents.byteLength,
        gzipBytes: totals.gzipBytes + gzipSync(contents, { level: 9 }).byteLength,
      };
    },
    { rawBytes: 0, gzipBytes: 0 },
  );
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(2)} kB (${bytes.toLocaleString('en-US')} bytes)`;
}

const htmlPath = join(outputDirectory, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const initialUrls = new Set<string>();

for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
  const tag = match[0];
  if (getAttribute(tag, 'type') !== 'module') continue;
  const src = getAttribute(tag, 'src');
  if (src) initialUrls.add(src);
}

for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
  const tag = match[0];
  const rel = getAttribute(tag, 'rel')?.split(/\s+/) ?? [];
  if (!rel.includes('modulepreload')) continue;
  const href = getAttribute(tag, 'href');
  if (href?.endsWith('.js')) initialUrls.add(href);
}

if (initialUrls.size === 0) throw new Error('No initial JavaScript entry was found in dist/index.html');

const initialFiles = [...initialUrls].map(resolveAssetPath);
const totalFiles = findJavaScriptFiles(assetsDirectory);
const initial = measure(initialFiles);
const total = measure(totalFiles);

console.log(`Initial JavaScript (${initialFiles.length} files):`);
console.log(`  minified: ${formatBytes(initial.rawBytes)}`);
console.log(`  gzip:     ${formatBytes(initial.gzipBytes)}`);
console.log('Total emitted JavaScript:');
console.log(`  minified: ${formatBytes(total.rawBytes)}`);
console.log(`  gzip:     ${formatBytes(total.gzipBytes)}`);
console.log(`Initial files: ${initialFiles.map((file) => relative(outputDirectory, file)).join(', ')}`);
console.log(`All chunks:   ${totalFiles.map((file) => basename(file)).join(', ')}`);

if (initial.gzipBytes > initialGzipBudgetBytes) {
  throw new Error(
    `Initial JavaScript gzip size ${initial.gzipBytes} exceeds budget ${initialGzipBudgetBytes} bytes`,
  );
}
if (total.gzipBytes > totalGzipBudgetBytes) {
  throw new Error(
    `Total JavaScript gzip size ${total.gzipBytes} exceeds budget ${totalGzipBudgetBytes} bytes`,
  );
}
