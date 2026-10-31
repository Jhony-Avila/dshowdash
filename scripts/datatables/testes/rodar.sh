#!/usr/bin/env bash
# DataTables — testes do módulo (nível de acesso). Uso: bash scripts/datatables/testes/rodar.sh
set -uo pipefail
cd "$(dirname "$0")/../../.."
php scripts/datatables/testes/nivel-acesso.php || exit 1
echo "[OK]   testes do DataTables verdes"
