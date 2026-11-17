// Fecha a seção [Unreleased] do CHANGELOG.md numa seção datada e deixa um [Unreleased] vazio.
// Uso: bun run changelog:release [AAAA-MM-DD] [--check]
// Códigos de saída: 0 = ok (no --check: há entradas a fechar), 2 = [Unreleased] vazio (só no --check),
// 1 = erro (arquivo ou seção ausente, etc.).
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXIT_EMPTY = 2;
const order = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];

interface Parsed {
  preamble: string[];
  categories: Map<string, string[]>;
}

function trimBlank(lines: string[]): void {
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
}

function parse(body: string): Parsed {
  const preamble: string[] = [];
  const categories = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of body.split('\n')) {
    const heading = line.match(/^###[ \t]+(.+?)[ \t]*$/);
    if (heading) {
      current = categories.get(heading[1]) ?? [];
      categories.set(heading[1], current);
    } else {
      (current ?? preamble).push(line);
    }
  }
  trimBlank(preamble);
  for (const [name, lines] of categories) {
    trimBlank(lines);
    if (lines.length === 0) categories.delete(name);
  }
  return { preamble, categories };
}

function render({ preamble, categories }: Parsed): string {
  const names = [...categories.keys()].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
  });
  const parts: string[] = [];
  if (preamble.length) parts.push(preamble.join('\n'));
  for (const name of names) parts.push(`### ${name}\n${categories.get(name)!.join('\n')}`);
  return parts.join('\n\n');
}

// Separa as linhas de link de referência do rodapé (ex.: "[Unreleased]: https://...").
function splitFooter(text: string): { main: string; footer: string } {
  const lines = text.split('\n');
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === '') end--;
  let start = end;
  while (start > 0 && /^\[[^\]]+\]:[ \t]+\S/.test(lines[start - 1])) start--;
  if (start === end) return { main: text, footer: '' };
  return { main: lines.slice(0, start).join('\n'), footer: lines.slice(start, end).join('\n') };
}

function run(): number {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) ?? new Date().toISOString().slice(0, 10);
  const file = resolve('CHANGELOG.md');
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

  const { main, footer } = splitFooter(text);
  const parts = main.split(/^(?=## \[)/m);
  const header = parts[0].startsWith('## [') ? '' : parts.shift()!;

  const headingOf = (section: string) => section.slice(0, section.includes('\n') ? section.indexOf('\n') : undefined);
  const bodyOf = (section: string) => (section.includes('\n') ? section.slice(section.indexOf('\n') + 1) : '');

  const unreleasedIndex = parts.findIndex((s) => /^## \[Unreleased\][ \t]*$/.test(headingOf(s)));
  if (unreleasedIndex === -1) throw new Error('Seção "## [Unreleased]" não encontrada no CHANGELOG.md');

  const pending = parse(bodyOf(parts[unreleasedIndex]));
  if (pending.preamble.length) {
    // Texto sem "### Categoria": nunca descartar; vai para "Changed".
    console.warn('Aviso: entradas sem categoria em [Unreleased] foram movidas para "Changed".');
    pending.categories.set('Changed', [...pending.preamble, ...(pending.categories.get('Changed') ?? [])]);
    pending.preamble = [];
  }
  if (pending.categories.size === 0) {
    console.log('[Unreleased] está vazio; nada a fechar.');
    return check ? EXIT_EMPTY : 0;
  }
  if (check) {
    console.log('[Unreleased] tem entradas a fechar.');
    return 0;
  }

  const dateRegex = new RegExp(`^## \\[${date}\\](?:[ \\t].*)?$`);
  const dateIndex = parts.findIndex((s) => dateRegex.test(headingOf(s)));

  parts[unreleasedIndex] = '## [Unreleased]\n\n';
  if (dateIndex === -1) {
    parts.splice(unreleasedIndex + 1, 0, `## [${date}]\n\n${render(pending)}\n\n`);
  } else {
    // Já existe a seção da data (vários merges no mesmo dia): junta por categoria, mantendo o título.
    const existing = parse(bodyOf(parts[dateIndex]));
    for (const [name, lines] of pending.categories) {
      existing.categories.set(name, [...lines, ...(existing.categories.get(name) ?? [])]);
    }
    parts[dateIndex] = `${headingOf(parts[dateIndex])}\n\n${render(existing)}\n\n`;
  }

  const output = `${header}${parts.join('')}`.trimEnd() + '\n' + (footer ? `\n${footer}\n` : '');
  writeFileSync(file, output);
  console.log(`[Unreleased] fechado como [${date}].`);
  return 0;
}

try {
  process.exit(run());
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
