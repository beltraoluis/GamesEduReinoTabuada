#!/usr/bin/env bash
set -euo pipefail

# Execute a partir da pasta do projeto, mesmo que o script seja chamado de outro local.
cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

if ! command -v bun >/dev/null 2>&1; then
  echo "Erro: Bun não encontrado. Instale em https://bun.sh/ e tente novamente." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Instalando dependências..."
  bun install
fi

echo "Iniciando o projeto em http://localhost:3000/GamesEduReinoTabuada/"
exec bun run dev "$@"
