#!/usr/bin/env bash
# Ponte v2 — roda os testes PHP puros (sem banco, sem HTTP). uso: bash scripts/ponte/testes/rodar.sh  (exit 1 em falha)
set -u; D="$(cd "$(dirname "$0")" && pwd)"; F=0
for t in ponte-v2-core.php libs-equivalencia.php analytics-leitura.php; do if php -d error_log=/dev/null "$D/$t"; then echo "[OK]   $t"; else echo "[ERRO] $t"; F=1; fi; done
for f in "$D"/../../../api/ponte/*.php "$D"/../../../api/ponte/libs/*.php; do php -l "$f" >/dev/null 2>&1 || { echo "[ERRO] php -l $f"; F=1; }; done
exit $F
