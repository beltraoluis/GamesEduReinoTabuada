---
name: update-changelog
description: Atualiza a seção [Unreleased] do CHANGELOG.md (em português, formato Keep a Changelog) após qualquer mudança de código feita por IA. Use ao terminar uma alteração em src/, scripts/, .github/, index.html, vite.config.ts ou package.json, ou quando o hook de Stop pedir a atualização do changelog.
---

# Atualizar o CHANGELOG.md

Registre no `CHANGELOG.md` o que mudou **nesta interação**, na seção `## [Unreleased]`.

## Passos

1. Veja o que mudou: `git status --short` e `git diff HEAD -- . ':!CHANGELOG.md' ':!bun.lock'` (inclua arquivos novos não rastreados).
2. Leia a seção `## [Unreleased]` atual do `CHANGELOG.md`.
3. Decida se a mudança é **notável para quem joga ou mantém o projeto**. Se for só refatoração interna, formatação, ajuste de teste sem efeito visível ou mudança no próprio `CHANGELOG.md`, **não adicione nada** e diga isso em uma linha (o hook registra essa revisão e não cobra de novo para o mesmo estado do código).
4. Caso seja notável, edite o `CHANGELOG.md`:
   - Categoria: `### Added` (novidade), `### Changed` (comportamento alterado), `### Fixed` (correção), `### Removed`, `### Security`. Crie a categoria dentro de `[Unreleased]` se não existir, nessa ordem.
   - **Escreva em português**, no passado ou em voz descritiva, igual ao estilo das entradas existentes: uma linha por mudança, focada no efeito para o jogador ou mantenedor, citando arquivo ou função entre crases só quando ajudar.
   - **Agrupe e deduplique**: se já existe uma linha sobre o mesmo assunto, atualize-a em vez de criar outra. Não acumule uma linha por edição.
   - Não cite hashes de commit (ainda não existem) e não mexa em seções datadas (`## [AAAA-MM-DD]`).
5. Não faça commit, a menos que o usuário peça.

## Regras
- Edite apenas `CHANGELOG.md`. Não rode `graphify update .` nem outros comandos por causa disto.
- Seja breve: normalmente 1 a 3 linhas.
- Fechar a seção (`[Unreleased]` → data) só quando o usuário pedir um release.
