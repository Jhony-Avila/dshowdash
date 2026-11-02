#!/usr/bin/env bash
# ============================================================================
# VALIDAÇÃO CONSOLIDADA — P7 + P8 AAA (SSH-SAFE)
# Persistência + Reidratação + Governança
# NUNCA ENCERRA A SESSÃO SSH
# ============================================================================

ROOT="/var/www/dshowdash"
BASE="$ROOT/public/components/main/domain/persistence"
OUT="/tmp/validate_P7_P8_AAA_$(date +%Y%m%d_%H%M%S).log"

FAIL=0

ok()  { echo "✅ $1"; }
bad() { echo "❌ $1"; FAIL=$((FAIL+1)); }
sec() { echo; echo "-------------------- $1 --------------------"; }

main() {
  echo "=== VALIDAÇÃO P7 + P8 AAA (CONSOLIDADA) ==="
  echo "Root: $ROOT"
  echo "Base: $BASE"
  echo

  sec "[1] Diretório base"
  [ -d "$BASE" ] && ok "Diretório persistence/ existe" || bad "Diretório persistence/ NÃO existe"

  sec "[2] Arquivos esperados"
  FILES=(
    "$BASE/persistence-port.js"
    "$BASE/persistence-adapter.js"
    "$BASE/snapshot-manager.js"
    "$BASE/rehydration-controller.js"
    "$BASE/index.js"
  )
  for f in "${FILES[@]}"; do
    [ -f "$f" ] && ok "$(basename "$f") existe" || bad "$(basename "$f") NÃO encontrado"
  done

  sec "[3] Sintaxe JavaScript"
  for f in "${FILES[@]}"; do
    [ -f "$f" ] && node --check "$f" >/dev/null 2>&1 \
      && ok "$(basename "$f") sintaxe OK" \
      || bad "$(basename "$f") erro de sintaxe"
  done

  sec "[4] Port (P7)"
  grep -q "save(" "$BASE/persistence-port.js" && ok "save()" || bad "save() ausente"
  grep -q "load(" "$BASE/persistence-port.js" && ok "load()" || bad "load() ausente"
  grep -q "clear(" "$BASE/persistence-port.js" && ok "clear()" || bad "clear() ausente"
  grep -q "healthCheck(" "$BASE/persistence-port.js" && ok "healthCheck()" || bad "healthCheck() ausente"

  sec "[5] Governança (P8)"
  grep -q "SCHEMA_VERSION" "$BASE/persistence-port.js" && ok "SCHEMA_VERSION definido" || bad "SCHEMA_VERSION ausente"
  grep -q "ttlMs" "$BASE/persistence-adapter.js" && ok "TTL definido" || bad "TTL ausente"
  grep -q "isExpired" "$BASE/persistence-adapter.js" && ok "Expiração implementada" || bad "Expiração ausente"

  sec "[6] Integridade"
  grep -q "generateChecksum" "$BASE/persistence-port.js" && ok "generateChecksum()" || bad "generateChecksum ausente"
  grep -q "validateChecksum" "$BASE/persistence-port.js" && ok "validateChecksum()" || bad "validateChecksum ausente"

  sec "[7] Eventos"
  grep -q "persistence:saved" "$BASE/persistence-adapter.js" && ok "persistence:saved" || bad "persistence:saved ausente"
  grep -q "rehydration:completed" "$BASE/rehydration-controller.js" && ok "rehydration:completed" || bad "rehydration:completed ausente"

  sec "[8] Anti-DOM / Router"
  grep -RIn --include="*.js" -E "document\.|window\.|RouterGlobal|location\.hash" "$BASE" >/dev/null 2>&1 \
    && bad "Uso proibido de DOM/Router" || ok "Domain limpo"

  echo
  echo "=== RESULTADO FINAL ==="
  [ "$FAIL" -eq 0 ] && echo "✅ P7 + P8 AAA PASSARAM" || echo "❌ FALHOU ($FAIL violações)"
  echo "INFO: Script informativo — NÃO encerra SSH."
}

main >"$OUT" 2>&1
tail -n 120 "$OUT"
echo "LOG: $OUT"
