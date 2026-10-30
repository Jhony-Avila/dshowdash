#!/usr/bin/env bash
# Google Analytics — testes PHP do módulo (sem banco, sem rede). uso: bash scripts/google-analytics/testes/rodar.sh (exit 1 em falha)
set -u; D="$(cd "$(dirname "$0")" && pwd)"; F=0
for t in "$D"/*.php; do case "$(basename "$t")" in _*) continue;; esac; if php -d error_log=/dev/null "$t"; then :; else F=1; fi; done
for f in "$D"/../../../api/google-analytics/*.php "$D"/../../../api/google-analytics/lib/*.php "$D"/../../../api/google-analytics/controllers/*.php; do php -l "$f" >/dev/null 2>&1 || { echo "[ERRO] php -l $f"; F=1; }; done
exit $F
