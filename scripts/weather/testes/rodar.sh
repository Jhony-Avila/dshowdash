#!/usr/bin/env bash
# scripts/weather/testes/rodar.sh — php -l em api/weather/*.php + testes do ForecastNormalizer (puros; sem rede, sem Redis).
# Uso: bash scripts/weather/testes/rodar.sh [raiz-do-dash]   (padrão: a raiz do repositório onde este script está)
set -uo pipefail
RAIZ="${1:-$(cd "$(dirname "$0")/../../.." && pwd)}"
ERR=0
for f in "$RAIZ"/api/weather/*.php "$RAIZ"/scripts/weather/testes/*.php; do
  php -l "$f" >/dev/null 2>&1 && echo "[OK]   php -l $(realpath --relative-to="$RAIZ" "$f")" || { echo "[FALHA] php -l $f"; ERR=1; }
done
php "$RAIZ/scripts/weather/testes/forecast-normalizer.php" || ERR=1
[ "$ERR" = 0 ] && echo "[OK]   WEATHER_TESTES_OK" || { echo "[FALHA] weather: testes com falha"; exit 1; }
