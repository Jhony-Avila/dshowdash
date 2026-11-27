#!/usr/bin/env bash
# ERP novo — testes PHP do degrau do painel 01 (sem banco real, sem rede). uso: bash scripts/erp-novo/testes/rodar.sh (exit 1 em falha)
# painel01-sql.php só roda com ERP_NOVO_TESTE=1 e um MySQL de TESTE local (senão é PULADO).
set -u; D="$(cd "$(dirname "$0")" && pwd)"; F=0
for t in sql-novo.php chaveamento.php autorizacao-real.php painel01-sql.php; do php -d error_log=/dev/null "$D/$t" || F=1; done
for f in "$D"/../../../api/_helpers/ErpNovo.php "$D"/../../../api/modules/panels/_erp-ponto.php "$D"/../../../api/modules/panels/_erp-compat-novo.php "$D"/../../../api/modules/panels/panel-01/api.php "$D"/../comparar.php; do php -l "$f" >/dev/null 2>&1 || { echo "[ERRO] php -l $f"; F=1; }; done
exit $F
