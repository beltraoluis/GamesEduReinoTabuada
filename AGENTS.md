# Instruções para agentes de IA

## Changelog

Depois de qualquer mudança notável em `src/`, `scripts/`, `.github/`, `index.html`, `vite.config.ts` ou
`package.json`, registre-a em `## [Unreleased]` do `CHANGELOG.md` seguindo a skill `update-changelog`
(`.agents/skills/update-changelog/SKILL.md`): português, Keep a Changelog, uma linha por mudança,
agrupando e sem duplicar. Não edite seções datadas.

Um hook de fim de turno (`.agents/hooks/changelog-check.sh`) cobra isso automaticamente em Claude Code,
Codex, Gemini CLI e GitHub Copilot (configs em `.claude/`, `.codex/`, `.gemini/` e `.github/hooks/`).
A skill fica em `.agents/skills/` e é exposta por symlink em `.claude/skills/` e `.github/skills/`.
A cada push na `main` (merge de PR), o workflow `changelog-release.yml` fecha `[Unreleased]` numa seção
datada e abre/atualiza o PR `changelog/release`.
