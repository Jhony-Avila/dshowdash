#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# detect-schema-drift.sh — DETECTOR 6/6: codigo PHP x schema real
# ═══════════════════════════════════════════════════════════════
# READ-ONLY. Casca fina: a logica vive em detect-schema-drift.php
# (mesma divisao usada pelos outros detectores — casca estavel,
# motor evolui). NAO reimplementa nada.
#
# O QUE PEGA: SQL em api/**.php citando TABELA ou COLUNA que nao
# existe em nenhum banco legivel. Assinatura do defeito recorrente
# registrado em 2026-07-20 (feature-flags consultando `flag_value`
# quando a coluna real era `payload_json` — a flag nunca ligava).
#
# EXIT: 0 = sem drift novo · 1 = ACHADO · 2 = ERRO
# (o check-all chama com --strict; o motor ja usa essa semantica)
#
# Passivo conhecido fica em scripts/.schema-drift-baseline.txt.
# Congelar o passivo atual:
#   php scripts/detect-schema-drift.php --gerar-baseline > scripts/.schema-drift-baseline.txt
#
# Uso: bash scripts/detect-schema-drift.sh [--strict] [--full] [--json]
# ═══════════════════════════════════════════════════════════════
set -uo pipefail

MOTOR="/var/www/dshowdash/scripts/detect-schema-drift.php"

if [ ! -f "$MOTOR" ]; then
  echo "  ERRO: motor nao encontrado: $MOTOR" >&2
  exit 2
fi
if ! command -v php >/dev/null 2>&1; then
  echo "  ERRO: php nao esta no PATH" >&2
  exit 2
fi

php "$MOTOR" "$@"
exit $?
