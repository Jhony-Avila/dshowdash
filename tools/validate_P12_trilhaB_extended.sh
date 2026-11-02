#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P12_trilhaB_ext_$(date +%Y%m%d_%H%M%S).log}"
BINDINGS="$ROOT/public/components/main/domain/action-hub/action-bindings.js"
MANIFEST="$ROOT/public/components/main/domain/manifest-controller.js"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
warn(){ printf "⚠️  %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P12 TRILHA B ESTENDIDA — Cobertura 100%% Ações/Botões\n"
  hr

  sec "ActionIds no Footer vs Bindings"
  
  # Extrair actionIds do Footer
  FOOTER_IDS=$(grep -rhoE "actionId:\s*['\"][^'\"]+['\"]" "$ROOT/public/components/footer" --include="*.js" 2>/dev/null | sed "s/actionId:\s*['\"]//g" | sed "s/['\"]//g" | sort -u)
  FOOTER_COUNT=$(echo "$FOOTER_IDS" | wc -w)
  
  MISSING=0
  for id in $FOOTER_IDS; do
    if ! grep -q "'$id'" "$BINDINGS" 2>/dev/null; then
      bad "Footer actionId sem binding: $id"
      MISSING=$((MISSING+1))
    fi
  done
  
  if [ "$MISSING" -eq 0 ]; then
    ok "Todos os $FOOTER_COUNT actionIds do Footer têm binding"
  else
    bad "$MISSING actionIds do Footer sem binding"
  fi

  sec "ActionIds do Header (Integrations) vs Bindings"
  
  HEADER_LINKS="header:adwords-link header:alfinete-link header:asaas-link header:bling-link header:calendar-link header:chatgpt-link header:google-drive-link header:loja-integrada-link header:mercado-livre-link header:pipedrive-link"
  
  MISSING_HEADER=0
  for id in $HEADER_LINKS; do
    if grep -q "'$id'.*NAVIGATE" "$BINDINGS" 2>/dev/null; then
      ok "$id → NAVIGATE"
    else
      bad "$id não é NAVIGATE"
      MISSING_HEADER=$((MISSING_HEADER+1))
    fi
  done

  sec "ActionIds do Header (Status) vs Bindings"
  
  HEADER_STATUS="header:currency-btc header:currency-usd-brl header:currency-usd-cny header:email-integration header:instagram-messenger-integration header:weather-sp header:wechat-integration header:whatsapp-integration"
  
  for id in $HEADER_STATUS; do
    if grep -q "'$id'.*NAVIGATE" "$BINDINGS" 2>/dev/null; then
      ok "$id → NAVIGATE"
    else
      bad "$id não é NAVIGATE"
    fi
  done

  sec "Rotas NAVIGATE têm resolução no ROUTE_TO_PANEL"
  
  # Extrair rotas dos bindings
  ROUTES=$(grep -oE "route: '#/[^']+'" "$BINDINGS" | sed "s/route: '#\///g" | sed "s/'//g" | sort -u)
  
  MISSING_ROUTES=0
  for route in $ROUTES; do
    if grep -q "'$route'" "$MANIFEST" 2>/dev/null; then
      : # ok silencioso
    else
      bad "Rota sem resolução: $route"
      MISSING_ROUTES=$((MISSING_ROUTES+1))
    fi
  done
  
  if [ "$MISSING_ROUTES" -eq 0 ]; then
    ok "Todas as rotas NAVIGATE têm resolução"
  fi

  sec "Painéis Enterprise existem"
  
  PANEL_CATEGORIES="integration status footer"
  for cat in $PANEL_CATEGORIES; do
    COUNT=$(ls -d "$ROOT/public/components/panels/panel-$cat-"* 2>/dev/null | wc -l)
    if [ "$COUNT" -gt 0 ]; then
      ok "Painéis $cat: $COUNT"
    else
      warn "Nenhum painel $cat encontrado"
    fi
  done

  sec "Painéis de navegação"
  for panel in analytics charts datahub files location; do
    if [ -d "$ROOT/public/components/panels/panel-$panel" ]; then
      ok "panel-$panel existe"
    else
      bad "panel-$panel NÃO existe"
    fi
  done

  sec "Resumo de Contagens"
  printf "   Bindings totais: %s\n" "$(grep -c "effect:" "$BINDINGS" 2>/dev/null || echo 0)"
  printf "   Rotas no ROUTE_TO_PANEL: %s\n" "$(grep -cE "^\s*'" "$MANIFEST" 2>/dev/null || echo 0)"
  printf "   Painéis enterprise: %s\n" "$(ls -d $ROOT/public/components/panels/panel-* 2>/dev/null | wc -l)"

  hr
  if [ "$FAIL" -eq 0 ]; then 
    printf "✅ P12 TRILHA B ESTENDIDA COMPLETA\n"
    printf "   100%% cobertura de ações/botões - Zero cliques mortos\n"
  else 
    printf "❌ P12 TRILHA B ESTENDIDA INCOMPLETA (erros: %s)\n" "$FAIL"
  fi
  hr
}

main >"$OUT" 2>&1
tail -n 100 "$OUT"
printf "LOG: %s\n" "$OUT"

if [ "${AAA_STRICT:-0}" = "1" ] && [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
