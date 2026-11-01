#!/usr/bin/env bash
# Anúncios — testes do módulo (isolamento do stats.php por usuário). Uso: bash scripts/anuncios/testes/rodar.sh
set -uo pipefail
cd "$(dirname "$0")/../../.."
php scripts/anuncios/testes/isolamento.php || exit 1
echo "[OK]   testes do Anúncios verdes"
