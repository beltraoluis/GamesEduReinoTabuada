#!/usr/bin/env python3
"""Executa o projeto localmente usando npx (Node.js)."""
import shutil
import subprocess
import sys
from pathlib import Path

URL = "http://localhost:3000/GamesEduReinoTabuada/"


def main() -> int:
    # Executa a partir da pasta do projeto, mesmo que o script seja chamado de outro local.
    root = Path(__file__).resolve().parent

    npx = shutil.which("npx")
    npm = shutil.which("npm")
    if not npx or not npm:
        print("Erro: Node.js (npm/npx) não encontrado. Instale em https://nodejs.org/ e tente novamente.", file=sys.stderr)
        return 1

    if not (root / "node_modules").is_dir():
        print("Instalando dependências...")
        subprocess.run([npm, "install", "--legacy-peer-deps", "--no-package-lock"], cwd=root, check=True)

    print(f"Iniciando o projeto em {URL}")
    try:
        return subprocess.run([npx, "vite", "--port=3000", *sys.argv[1:]], cwd=root).returncode
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
