#!/usr/bin/env bash
# Hook de fim de turno compartilhado por Claude Code, Codex (Stop), Gemini CLI (AfterAgent) e Copilot (agentStop).
# Cobra a atualização do CHANGELOG.md quando o código monitorado mudou desde a última revisão.
# Uso: changelog-check.sh <claude|codex|gemini|copilot>
#
# Como decide: calcula uma impressão digital (hash) do conjunto de arquivos monitorados alterados
# (inclui exclusões e arquivos novos). O estado fica em <git-dir>/changelog-hook.state.
#  - mesma impressão já revisada      -> deixa parar (turnos só de leitura não são bloqueados);
#  - CHANGELOG.md editado desde então -> considera revisado;
#  - senão bloqueia uma vez; na continuação (stop_hook_active) registra a revisão e deixa parar.
# Observação: na primeira execução de um clone com a árvore já suja, bloqueia uma vez.
set -u
agent="${1:-claude}"
input=$(cat)

# Caminhos monitorados (manter igual ao documentado em AGENTS.md e na skill).
watched=(src scripts .github index.html vite.config.ts package.json)

cwd=$(printf '%s' "$input" | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
cd "${cwd:-${CLAUDE_PROJECT_DIR:-${GEMINI_PROJECT_DIR:-.}}}" 2>/dev/null || exit 0
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
cd "$root" || exit 0
state="$(git rev-parse --absolute-git-dir)/changelog-hook.state"

list=$(
  {
    git diff HEAD --name-only --no-renames -z -- "${watched[@]}" 2>/dev/null
    git ls-files -o --exclude-standard -z -- "${watched[@]}" 2>/dev/null
  } | while IFS= read -r -d '' f; do
    if [ -f "$f" ]; then printf '%s %s\n' "$(git hash-object -- "$f")" "$f"; else printf 'DEL %s\n' "$f"; fi
  done
)
[ -n "$list" ] || exit 0 # nada monitorado mudou

fp=$(printf '%s\n' "$list" | git hash-object --stdin)
if [ -f CHANGELOG.md ]; then cl=$(git hash-object CHANGELOG.md); else cl=none; fi

ack_fp=""; ack_cl=""; have_state=0
if [ -f "$state" ]; then
  { read -r ack_fp; read -r ack_cl; } < "$state"
  have_state=1
fi
save() { printf '%s\n%s\n' "$fp" "$cl" > "$state" 2>/dev/null || true; }

# Continuação disparada por este hook: registra a revisão e deixa parar (evita laço).
if printf '%s' "$input" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  save; exit 0
fi
[ "$fp" = "$ack_fp" ] && exit 0
if [ "$have_state" = 1 ] && [ "$cl" != "$ack_cl" ]; then save; exit 0; fi

reason="O código mudou desde a última atualização do CHANGELOG.md. Siga a skill update-changelog (.agents/skills/update-changelog/SKILL.md) e registre a mudança em [Unreleased], ou confirme em uma linha que ela não é notável."
case "$agent" in
  gemini) decision=deny ;;
  *)      decision=block ;;
esac
printf '{"decision":"%s","reason":"%s"}\n' "$decision" "$reason"
exit 0
