#!/usr/bin/env bash
set -u

ROOT="/var/www/dshowdash"
OUT_DEFAULT="/tmp/validate_P3_AAA_delivery_$(date +%Y%m%d_%H%M%S).log"
OUT="${OUT:-$OUT_DEFAULT}"

FAIL=0
hr(){ printf "\n================================================================================\n"; }
sec(){ printf "\n-------------------- %s --------------------\n" "$1"; }
ok(){ printf "✅ %s\n" "$1"; }
warn(){ printf "⚠️  %s\n" "$1"; }
bad(){ printf "❌ %s\n" "$1"; FAIL=$((FAIL+1)); }

have_file(){ [ -f "$1" ]; }
have_dir(){ [ -d "$1" ]; }

# STRICT=1 faz P3 virar "hard fail" se não encontrar os marcadores
STRICT="${STRICT:-0}"

main(){
  hr
  printf "VALIDAÇÃO DE ENTREGA — P3 AAA (CLAUDE)\n"
  printf "Root: %s\n" "$ROOT"
  printf "Log:  %s\n" "$OUT"
  hr

  # 0) Sanity
  if ! have_dir "$ROOT/public/components/main"; then
    bad "Diretório ausente: $ROOT/public/components/main"
    return "$FAIL"
  fi

  # 1) Base AAA (NÃO regredir)
  sec "[1] VALIDADORES AAA (BASE)"
  if have_file "$ROOT/tools/validate_p1_aaa.sh"; then
    "$ROOT/tools/validate_p1_aaa.sh" >/dev/null 2>&1 && ok "validate_p1_aaa.sh PASSOU" || { bad "validate_p1_aaa.sh FALHOU"; }
  else
    bad "Faltando tools/validate_p1_aaa.sh"
  fi

  if have_file "$ROOT/tools/validate_container_p1_aaa.sh"; then
    "$ROOT/tools/validate_container_p1_aaa.sh" >/dev/null 2>&1 && ok "validate_container_p1_aaa.sh PASSOU" || { bad "validate_container_p1_aaa.sh FALHOU"; }
  else
    bad "Faltando tools/validate_container_p1_aaa.sh"
  fi

  if have_file "$ROOT/tools/validate_P2_AAA_delivery.sh"; then
    "$ROOT/tools/validate_P2_AAA_delivery.sh" >/dev/null 2>&1 && ok "validate_P2_AAA_delivery.sh PASSOU" || { bad "validate_P2_AAA_delivery.sh FALHOU"; }
  else
    warn "tools/validate_P2_AAA_delivery.sh não encontrado (ok, mas recomendado)"
  fi

  # 2) P3 — Orquestração “viva”: precisa existir um ponto central consumindo triggers (heurística)
  # A ideia aqui é validar que existe (ou foi criado) um “hub” que consome events/triggers e aciona Main.navigate/ContainerPort.
  sec "[2] P3 — HUB/ORQUESTRADOR DE AÇÕES (HEURÍSTICA)"

  P3_HINTS=(
    "action-hub"
    "action-dispatch"
    "actions-registry"
    "navigation-actions"
    "trigger-registry"
    "ui-actions"
    "orchestrator.*actions"
    "app:action"
    "actions:dispatch"
    "trigger:clicked"
    "sidebar:item:click"
    "navrail:item:click"
  )

  # procura em locais prováveis sem floodar
  HITS="$(grep -RIn --include="*.js" -E "$(IFS='|'; printf "%s" "${P3_HINTS[*]}")" \
    "$ROOT/public/components" 2>/dev/null | head -n 120 || true)"

  if [ -n "$HITS" ]; then
    ok "Encontrei indícios de HUB/ORQUESTRADOR (amostra abaixo)"
    printf "%s\n" "$HITS" | sed 's/^/   • /'
  else
    if [ "$STRICT" = "1" ]; then
      bad "Nenhum indício de HUB/ORQUESTRADOR encontrado (STRICT=1)"
    else
      warn "Nenhum indício de HUB/ORQUESTRADOR encontrado (STRICT=0). Se P3 ainda não implementou esse hub, ignore."
    fi
  fi

  # 3) P3 — Integração prática: triggers devem resultar em navegação (ao menos via RouterGlobal)
  sec "[3] P3 — TRIGGERS GERANDO NAVEGAÇÃO (SIDEBAR/NAVRAIL/HEADER) (HEURÍSTICA)"
  SB="$(grep -RIn --include="*.js" -E "RouterGlobal\.navigate\(|location\.hash" \
    "$ROOT/public/components/sidebar" 2>/dev/null | head -n 60 || true)"
  NR="$(grep -RIn --include="*.js" -E "navrail:open-panel|RouterGlobal\.navigate\(" \
    "$ROOT/public/components/nav-rail" 2>/dev/null | head -n 60 || true)"

  [ -n "$SB" ] && ok "Sidebar gera rota (amostra)" && printf "%s\n" "$SB" | sed 's/^/   • /' || bad "Sidebar não mostra geração de rota"
  [ -n "$NR" ] && ok "NavRail gera rota (amostra)" && printf "%s\n" "$NR" | sed 's/^/   • /' || warn "NavRail não mostra geração de rota (pode estar desativado)"

  # 4) P3 — Anti-regressão: MAIN listener deve resolver rota via manifest (obrigatório)
  sec "[4] P3 — MAIN resolve rota via manifest (OBRIGATÓRIO)"
  ME="$ROOT/public/components/main/domain/main-engine.js"
  MC="$ROOT/public/components/main/domain/manifest-controller.js"

  if have_file "$ME"; then
    if grep -nE "_setupRouterListener\(" "$ME" >/dev/null 2>&1; then ok "main-engine.js tem _setupRouterListener()"; else bad "main-engine.js sem _setupRouterListener()"; fi
    if grep -nE "resolveRoute\(" "$ME" >/dev/null 2>&1; then ok "main-engine.js usa resolveRoute(...)"; else bad "main-engine.js NÃO usa resolveRoute(...)"; fi
  else
    bad "Arquivo ausente: $ME"
  fi

  if have_file "$MC"; then
    if grep -nE "ROUTE_TO_PANEL|DEFAULT_PANEL|async resolveRoute" "$MC" >/dev/null 2>&1; then
      ok "manifest-controller.js contém ROUTE_TO_PANEL/DEFAULT_PANEL/resolveRoute"
    else
      bad "manifest-controller.js não contém mapping/resolveRoute esperado"
    fi
  else
    bad "Arquivo ausente: $MC"
  fi

  # 5) Anti-regressão hard: imports hardcoded de rota como painel
  sec "[5] ANTI-REGRESSÃO — imports hardcoded /components/panels/<rota>/index.js"
  BAD_IMPORTS="$(grep -RIn --include="*.js" -E "/components/panels/(geral|automacoes|clientes|admin/usuarios|admin/permissoes|preferencias)/index\.js" \
    "$ROOT/public/components/main" "$ROOT/public/components/sidebar" "$ROOT/public/components/nav-rail" 2>/dev/null | head -n 80 || true)"
  if [ -n "$BAD_IMPORTS" ]; then
    bad "Encontrado import hardcoded inválido"
    printf "%s\n" "$BAD_IMPORTS" | sed 's/^/   • /'
  else
    ok "Sem imports hardcoded inválidos"
  fi

  # 6) Resumo
  hr
  if [ "$FAIL" -eq 0 ]; then
    printf "✅ RESULTADO FINAL: PASSOU — P3 AAA validado (base OK; heurísticas conforme modo).\n"
  else
    printf "❌ RESULTADO FINAL: FALHOU — violações=%s\n" "$FAIL"
  fi
  hr

  return "$FAIL"
}

# Run com log (sem floodar SSH)
( main; printf "EXIT_CODE=%s\n" "$?"; ) >"$OUT" 2>&1 || true
tail -n 260 "$OUT"
printf "LOG: %s\n" "$OUT"

# Propaga o exit code real do main (capturado no log)
grep -qE "^EXIT_CODE=0$" "$OUT" && exit 0 || exit 1
