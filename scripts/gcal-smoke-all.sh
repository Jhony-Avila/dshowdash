#!/bin/bash
# scripts/gcal-smoke-all.sh — RUNNER DE REGRESSAO oficial do Google Calendar.
# @version 1.0.0  @created 2026-07-29
#
# Roda:
#   (1) suite PHP deterministica + homologacao (seguranca, privacidade, fusos)
#   (2) smoke HTTP no ORIGIN (bypassa Cloudflare) — todas as rotas exigem sessao
#   (3) sintaxe dos arquivos do modulo (php -l + node --check + tsc)
#   (4) prova de UI no navegador (opcional; PULA se nao houver browser/sessao)
#
# Exit 0 = tudo PASS.  Uso: bash scripts/gcal-smoke-all.sh
set -uo pipefail
ROOT=/var/www/dshowdash
FAIL=0

echo "═══════════════════════════════════════════════════════"
echo "  GOOGLE CALENDAR SMOKE ALL — regressao completa"
echo "═══════════════════════════════════════════════════════"

# ── (1) Suite deterministica ────────────────────────────────────
php "$ROOT/scripts/gcal-smoke-all.php" || FAIL=1

# ── (1b) Homologacao: seguranca, privacidade, fusos, recorrencia ─
php "$ROOT/scripts/gcal-homologacao.php" || FAIL=1

# ── (1c) Fase 4: persistencia, cliente da API e sincronizacao ───
# Rodam contra o banco GCAL_DSHOW real e um transporte falso — nao dependem de
# credencial do Google nem tocam a producao (GCAL_PROVIDER segue mock).
for t in gcal-fase4-repositorio gcal-fase4-cliente gcal-fase4-sync; do
  if php "$ROOT/scripts/$t.php" >/dev/null 2>&1; then
    echo "  [PASS] $t"
  else
    echo "  [FAIL] $t"; php "$ROOT/scripts/$t.php" 2>&1 | grep FALHA | head -4 | sed 's/^/    /'
    FAIL=1
  fi
done

# ── (2) Smoke HTTP no origin ────────────────────────────────────
# --resolve aponta direto ao 127.0.0.1: sessao forjada cai pela borda CF.
echo
echo "── Smoke HTTP (origin, bypassa Cloudflare) ─────────────────"
ROTAS="status header header/next overview accounts calendars calendars/resources events freebusy invitations conflicts alerts sync reports links links/search"
for r in $ROTAS; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --resolve dshowdash.com.br:443:127.0.0.1 \
    "https://dshowdash.com.br/api/google-calendar/$r" -k 2>/dev/null)
  # 401 e o esperado SEM sessao: prova que o gate esta ativo e a rota existe.
  if [ "$CODE" = "401" ]; then
    printf "  [PASS] /%-22s exige sessao (401)\n" "$r"
  else
    printf "  [FAIL] /%-22s devolveu %s (esperado 401)\n" "$r" "$CODE"
    FAIL=1
  fi
done

# ── (3) Sintaxe ─────────────────────────────────────────────────
echo
echo "── Sintaxe ─────────────────────────────────────────────────"
ERR=0
while IFS= read -r f; do
  php -l "$f" >/dev/null 2>&1 || { echo "  [FAIL] php -l $f"; ERR=1; }
done < <(find "$ROOT/api/google-calendar" -name '*.php')
[ $ERR -eq 0 ] && echo "  [PASS] php -l  em todos os arquivos de api/google-calendar" || FAIL=1

if node --check "$ROOT/public/components/panels/panel-google-calendar/index.js" >/dev/null 2>&1; then
  echo "  [PASS] node --check panel-google-calendar/index.js"
else
  echo "  [FAIL] node --check panel-google-calendar/index.js"; FAIL=1
fi

if (cd "$ROOT" && npx tsc --noEmit -p public/components/panels/panel-google-calendar/tsconfig.json >/dev/null 2>&1); then
  echo "  [PASS] tsc --noEmit do painel (0 erros)"
else
  echo "  [FAIL] tsc --noEmit do painel"; FAIL=1
fi

# O dist precisa pertencer a www-data, senao o painel nao monta (armadilha
# conhecida: vite build roda como root e deixa o dist inacessivel ao php-fpm).
DIST="$ROOT/public/components/panels/panel-google-calendar/dist"
if [ -d "$DIST" ]; then
  DONO=$(stat -c '%U' "$DIST")
  if [ "$DONO" = "www-data" ]; then
    echo "  [PASS] dist/ pertence a www-data"
  else
    echo "  [FAIL] dist/ pertence a $DONO — rode: chown -R www-data:www-data $DIST"; FAIL=1
  fi
else
  echo "  [FAIL] dist/ ausente — rode o vite build"; FAIL=1
fi

# ── (4) Prova de UI (opcional) ──────────────────────────────────
echo
echo "── Prova de UI no navegador (opcional) ─────────────────────"
if [ -d /opt/ms-playwright ] && [ -f "$ROOT/tools/screenshot/proof-gcal-entradas.mjs" ]; then
  OUT=$(cd "$ROOT/tools/screenshot" && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
        timeout 300 node proof-gcal-entradas.mjs 2>&1)
  echo "$OUT" | grep -E '^\s+[✓✗]|telasOk|controleOutlook' | sed 's/^/  /'
  if echo "$OUT" | grep -q '"telasFalhando": \[\]' && echo "$OUT" | grep -q '"controleOutlook": true'; then
    echo "  [PASS] entradas + 15 telas montam (controle Outlook intacto)"
  else
    echo "  [FAIL] prova de UI nao passou"; FAIL=1
  fi

  # Homologacao de cliente: contraste WCAG nos 2 temas + a11y.
  OUTH=$(cd "$ROOT/tools/screenshot" && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
         timeout 560 node proof-gcal-homologacao.mjs 2>&1)
  if echo "$OUTH" | grep -q 'CLIENTE HOMOLOGADO'; then
    echo "  [PASS] homologacao de cliente: contraste WCAG e a11y nos 2 temas"
  else
    echo "  [FAIL] homologacao de cliente nao passou"
    echo "$OUTH" | grep -E 'FALHA' | head -6 | sed 's/^/    /'
    FAIL=1
  fi

  # Fase 6: vinculos com Pipedrive/Koala REAIS.
  OUT6=$(cd "$ROOT/tools/screenshot" && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
         timeout 400 node proof-gcal-fase6.mjs 2>&1)
  if echo "$OUT6" | grep -q 'TODOS OS CHECKS PASSARAM'; then
    echo "  [PASS] Fase 6: busca no CRM real, vincular, ficha lateral e remover"
  else
    echo "  [FAIL] prova da Fase 6 nao passou"
    echo "$OUT6" | grep -E 'FALHAS|✗' | sed 's/^/    /'
    FAIL=1
  fi

  # Fase 7: relatorios, exportacao e visualizacoes D3.
  OUT7=$(cd "$ROOT/tools/screenshot" && PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright \
         timeout 500 node proof-gcal-fase7.mjs 2>&1)
  if echo "$OUT7" | grep -q 'TODOS OS CHECKS PASSARAM'; then
    echo "  [PASS] Fase 7: 11 relatorios, CSV, impressao, Sankey e rede"
  else
    echo "  [FAIL] prova da Fase 7 nao passou"
    echo "$OUT7" | grep -E 'FALHAS|✗' | sed 's/^/    /'
    FAIL=1
  fi
else
  echo "  [SKIP] Playwright ausente"
fi

echo
if [ $FAIL -eq 0 ]; then
  echo "═══ TUDO PASS ═══"
else
  echo "═══ HOUVE FALHA ═══"
fi
exit $FAIL
