#!/usr/bin/env bash
set -u

ROOT="/var/www/dshowdash"
DOMAIN_DIR="$ROOT/public/components/main/domain"
PORTS_DIR="$ROOT/public/components/main/ports"
ADAPTERS_DIR="$ROOT/public/components/main/adapters"
MAIN_INDEX="$ROOT/public/components/main/index.js"

_fail=0

# -------- helpers (sem echo) --------
_hr() { printf "\n================================================================================\n"; }
_ok() { printf "✅ %s\n" "$1"; }
_warn() { printf "⚠️  %s\n" "$1"; }
_bad() { printf "❌ %s\n" "$1"; _fail=$((_fail+1)); }

_run_grep() {
  local label="$1"
  local path="$2"
  local regex="$3"
  local glob="${4:-*.js}"

  local out
  out="$(grep -RIn --include="$glob" -E "$regex" "$path" 2>/dev/null | head -n 200 || true)"

  if [ -n "$out" ]; then
    _bad "$label (encontrado)"
    printf "%s\n" "$out" | sed 's/^/   • /'
  else
    _ok "$label (limpo)"
  fi
}

# P1-HEX: Verificação especial para timers - ignora fallbacks condicionais
_run_grep_timers() {
  local label="$1"
  local path="$2"
  
  # Busca setTimeout/setInterval/fetch MAS exclui:
  # - Linhas que são fallbacks condicionais (return setTimeout)
  # - Linhas que verificam timerPort (if.*timerPort.*setTimeout)
  # - Definições de função helper (_setTimeout)
  local out
  out="$(grep -RIn --include="*.js" -E "(fetch\(|setInterval\(|setTimeout\()" "$path" 2>/dev/null | \
         grep -v "return setTimeout\|return setInterval\|timerPort.*setTimeout\|timerPort.*setInterval\|function _setTimeout\|function _setInterval\|_setTimeout\s*=\s*function\|\.setTimeout\)" | \
         head -n 200 || true)"

  if [ -n "$out" ]; then
    _bad "$label (encontrado)"
    printf "%s\n" "$out" | sed 's/^/   • /'
  else
    _ok "$label (limpo)"
  fi
}

_require_file() {
  local f="$1"
  if [ -f "$f" ]; then
    _ok "Arquivo existe: $(basename "$f")"
  else
    _bad "Arquivo AUSENTE: $f"
  fi
}

_require_dir() {
  local d="$1"
  if [ -d "$d" ]; then
    _ok "Diretório existe: $d"
  else
    _bad "Diretório AUSENTE: $d"
  fi
}

_require_pattern() {
  local label="$1"
  local file="$2"
  local regex="$3"
  if [ ! -f "$file" ]; then
    _bad "$label (arquivo ausente: $file)"
    return
  fi
  if grep -nE "$regex" "$file" >/dev/null 2>&1; then
    _ok "$label (ok)"
  else
    _bad "$label (pattern não encontrado)"
    grep -nE "VERSION|MODULE_ID|class|function|destroy|_emit|ports|events|unsubs" "$file" 2>/dev/null | head -n 60 | sed 's/^/   • /' || true
  fi
}

# P0.1-FIX: Verificação especial para cleanup (aceita cleanupSubscriptions OU _unsubs.forEach)
_check_cleanup_pattern() {
  local label="$1"
  local file="$2"
  if [ ! -f "$file" ]; then
    _bad "$label (arquivo ausente: $file)"
    return
  fi
  if grep -q "destroy()" "$file" && (grep -q "cleanupSubscriptions()" "$file" || grep -q "_unsubs.forEach" "$file"); then
    _ok "$label (ok)"
  else
    _bad "$label (pattern não encontrado)"
    grep -nE "destroy|cleanup|_unsubs" "$file" 2>/dev/null | head -n 20 | sed 's/^/   • /' || true
  fi
}

# P1-HEX: Verificação especial para emissão de eventos (aceita _events?.emit OU emitEvent)
_check_emit_pattern() {
  local label="$1"
  local file="$2"
  if [ ! -f "$file" ]; then
    _bad "$label (arquivo ausente: $file)"
    return
  fi
  # Aceita: _events?.emit, _events.emit, emitEvent(this._events, emitEvent(_events
  if grep -qE "(_events\?\.\s*emit|_events\.emit|emitEvent\(this\._events|emitEvent\(_events)" "$file"; then
    _ok "$label (ok)"
  else
    _bad "$label (pattern não encontrado)"
    grep -nE "_emit|emit|events" "$file" 2>/dev/null | head -n 20 | sed 's/^/   • /' || true
  fi
}

# -------- start --------
_hr
printf "P1 AAA VALIDATOR — MAIN (HEX/DI)\n"
printf "Root: %s\n" "$ROOT"
_hr

# 0) Sanity
_require_dir "$DOMAIN_DIR"
_require_dir "$PORTS_DIR"
_require_dir "$ADAPTERS_DIR"

# 1) Ports obrigatórios (AAA)
_hr
printf "1) PORTS OBRIGATÓRIOS\n\n"
_require_file "$PORTS_DIR/AuthPort.js"
_require_file "$PORTS_DIR/CanvasPort.js"
_require_file "$PORTS_DIR/EventBusPort.js"
_require_file "$PORTS_DIR/NavigationPort.js"
_require_file "$PORTS_DIR/PanelPort.js"
_require_file "$PORTS_DIR/StatePort.js"
_require_file "$PORTS_DIR/TelemetryPort.js"
_require_file "$PORTS_DIR/UIPort.js"
_require_file "$PORTS_DIR/TimerPort.js"
_require_file "$PORTS_DIR/GlobalsPort.js"

# 2) Adapters obrigatórios (AAA)
_hr
printf "2) ADAPTERS OBRIGATÓRIOS\n\n"
_require_file "$ADAPTERS_DIR/AuthAdapter.js"
_require_file "$ADAPTERS_DIR/DOMAdapter.js"
_require_file "$ADAPTERS_DIR/EventBusAdapter.js"
_require_file "$ADAPTERS_DIR/RouterAdapter.js"
_require_file "$ADAPTERS_DIR/StateAdapter.js"
_require_file "$ADAPTERS_DIR/TelemetryAdapter.js"
_require_file "$ADAPTERS_DIR/UIAdapter.js"
_require_file "$ADAPTERS_DIR/TimerAdapter.js"
_require_file "$ADAPTERS_DIR/GlobalsAdapter.js"

# 3) DOMAIN proibido: DOM
_hr
printf "3) DOMAIN — PROIBIDO DOM\n\n"
_run_grep "Domain não pode usar document/window/globalThis" \
  "$DOMAIN_DIR" \
  "(\bdocument\.|\bwindow\.|\bglobalThis\.)"

_run_grep "Domain não pode usar querySelector/getElementById" \
  "$DOMAIN_DIR" \
  "(querySelector|getElementById|getElementsByClassName|getElementsByTagName)"

_run_grep "Domain não pode criar/manipular elementos (createElement/append/remove/classList)" \
  "$DOMAIN_DIR" \
  "(createElement|appendChild|removeChild|classList\.|insertBefore|replaceChild)"

# 4) DOMAIN proibido: EventBus cru
_hr
printf "4) DOMAIN — PROIBIDO eventBus.*\n\n"
_run_grep "Domain não pode usar eventBus.emit/on/off" \
  "$DOMAIN_DIR" \
  "(eventBus\.(emit|on|off))"

# 5) DOMAIN proibido: fetch/timers (P1-HEX: ignora fallbacks condicionais)
_hr
printf "5) DOMAIN — PROIBIDO fetch/timers (exceto fallbacks via TimerPort)\n\n"
_run_grep_timers "Domain não pode usar fetch/setInterval/setTimeout direto" \
  "$DOMAIN_DIR"

# 6) Domain deve usar ports.events (mínimo esperado)
_hr
printf "6) DOMAIN — EXIGE ports.events\n\n"
MAIN_ENGINE="$DOMAIN_DIR/main-engine/index.js"
_require_file "$MAIN_ENGINE"

_require_pattern "MainEngine deve declarar _events = context.ports?.events" \
  "$MAIN_ENGINE" \
  "_events\s*=\s*context\.ports\?\.\s*events"

# P1-HEX: Aceita emitEvent() helper
_check_emit_pattern "MainEngine deve emitir via _events.emit ou emitEvent()" \
  "$MAIN_ENGINE"

# 7) Cleanup obrigatório (unsubs)
_hr
printf "7) CLEANUP — UN SUBS (MainEngine/Timeline)\n\n"
_require_pattern "MainEngine deve ter array _unsubs" \
  "$MAIN_ENGINE" \
  "_unsubs\s*=\s*\[\]"

_check_cleanup_pattern "MainEngine destroy() deve executar unsubs (via cleanupSubscriptions ou forEach)" \
  "$MAIN_ENGINE"

TIMELINE="$DOMAIN_DIR/timeline-controller.js"
_require_file "$TIMELINE"
_require_pattern "Timeline deve ter _unsubs" \
  "$TIMELINE" \
  "_unsubs\s*=\s*\[\]"

_require_pattern "Timeline deve adicionar unsubs ao registrar handlers" \
  "$TIMELINE" \
  "_unsubs\.push"

_require_pattern "Timeline cleanup deve executar unsubs" \
  "$TIMELINE" \
  "_unsubs\.forEach"

# 8) Layout/Canvas regras específicas
_hr
printf "8) REGRAS ESPECÍFICAS — Layout/Canvas\n\n"
LAYOUT="$DOMAIN_DIR/layout-controller.js"
CANVAS="$DOMAIN_DIR/canvas-controller-enterprise.js"

_require_file "$LAYOUT"
_require_file "$CANVAS"

_run_grep "LayoutController não pode tocar body/classList" \
  "$LAYOUT" \
  "(document\.body|classList\.)" \
  "*.js"

_run_grep "CanvasController não pode criar DOM (create/append/remove)" \
  "$CANVAS" \
  "(createElement|appendChild|removeChild)" \
  "*.js"

# 9) Singleton controlado (MainEngine)
_hr
printf "9) SINGLETON CONTROLADO — MainEngine\n\n"
_require_pattern "MainEngine deve ter _globalInstance" \
  "$MAIN_ENGINE" \
  "_globalInstance"

_require_pattern "Deve existir resetMainEngine()" \
  "$MAIN_ENGINE" \
  "export\s+function\s+resetMainEngine"

_require_pattern "Deve existir getMainEngineInstance()" \
  "$MAIN_ENGINE" \
  "export\s+function\s+getMainEngineInstance"

# 10) main/index.js não pode vazar eventBus cru ou DOM (heurística)
_hr
printf "10) MAIN ENTRY — ACOPLAMENTOS PERIGOSOS (heurística)\n\n"
if [ -f "$MAIN_INDEX" ]; then
  _run_grep "main/index.js não deve referenciar eventBus cru" \
    "$MAIN_INDEX" \
    "(eventBus\.(emit|on|off))" \
    "*.js"

  _run_grep "main/index.js não deve fazer DOM direto (preferir adapter/port)" \
    "$MAIN_INDEX" \
    "(\bdocument\.|\bwindow\.|querySelector|getElementById)" \
    "*.js"
else
  _warn "main/index.js não encontrado — pulando checagens de entry"
fi

# -------- summary --------
_hr
if [ "$_fail" -eq 0 ]; then
  printf "RESULTADO: ✅ PASSOU (P1 AAA OK)\n"
  exit 0
else
  printf "RESULTADO: ❌ FALHOU — total de violações: %s\n" "$_fail"
  exit 1
fi
