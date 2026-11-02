#!/usr/bin/env bash
set -u
ROOT="${ROOT:-/var/www/dshowdash}"
OUT="${OUT:-/tmp/validate_P10_2_AAA_$(date +%Y%m%d_%H%M%S).log}"
PERS_DIR="$ROOT/public/components/main/domain/persistence"
FAIL=0

ok(){ printf "✅ %s\n" "$1"; }
bad(){ FAIL=$((FAIL+1)); printf "❌ %s\n" "$1"; }
sec(){ printf "\n--- %s ---\n" "$1"; }
hr(){ printf "\n================================================================================\n"; }

main() {
  hr
  printf "VALIDAÇÃO P10.2 AAA — Persistência Avançada\n"
  hr

  sec "Arquivos obrigatórios"
  [ -f "$PERS_DIR/export-controller.js" ] && ok "export-controller.js existe" || bad "export-controller.js AUSENTE"
  [ -f "$PERS_DIR/import-controller.js" ] && ok "import-controller.js existe" || bad "import-controller.js AUSENTE"
  [ -f "$PERS_DIR/versioning.js" ] && ok "versioning.js existe" || bad "versioning.js AUSENTE"

  sec "Sintaxe"
  node --check "$PERS_DIR/export-controller.js" 2>/dev/null && ok "export-controller.js sintaxe OK" || bad "export-controller.js ERRO"
  node --check "$PERS_DIR/import-controller.js" 2>/dev/null && ok "import-controller.js sintaxe OK" || bad "import-controller.js ERRO"
  node --check "$PERS_DIR/versioning.js" 2>/dev/null && ok "versioning.js sintaxe OK" || bad "versioning.js ERRO"
  node --check "$PERS_DIR/index.js" 2>/dev/null && ok "index.js sintaxe OK" || bad "index.js ERRO"

  sec "Export Controller"
  grep -q "exportSnapshot" "$PERS_DIR/export-controller.js" && ok "exportSnapshot() existe" || bad "exportSnapshot() ausente"
  grep -q "export:completed" "$PERS_DIR/export-controller.js" && ok "Emite export:completed" || bad "Não emite export:completed"

  sec "Import Controller"
  grep -q "validateImport" "$PERS_DIR/import-controller.js" && ok "validateImport() existe" || bad "validateImport() ausente"
  grep -q "importSnapshot" "$PERS_DIR/import-controller.js" && ok "importSnapshot() existe" || bad "importSnapshot() ausente"
  grep -q "dryRun" "$PERS_DIR/import-controller.js" && ok "dryRun suportado" || bad "dryRun ausente"
  grep -q "import:rejected" "$PERS_DIR/import-controller.js" && ok "Emite import:rejected" || bad "Não emite import:rejected"

  sec "Versioning"
  grep -q "checkCompatibility" "$PERS_DIR/versioning.js" && ok "checkCompatibility() existe" || bad "checkCompatibility() ausente"
  grep -q "migrate" "$PERS_DIR/versioning.js" && ok "migrate() existe" || bad "migrate() ausente"
  grep -q "SUPPORTED_VERSIONS" "$PERS_DIR/versioning.js" && ok "SUPPORTED_VERSIONS definido" || bad "SUPPORTED_VERSIONS ausente"

  sec "Domain sem DOM"
  if grep -qE "document\.|window\.|globalThis\.|RouterGlobal|location\.hash|querySelector|createElement|innerHTML" "$PERS_DIR"/*.js 2>/dev/null; then
    bad "Domain toca DOM (PROIBIDO)"
  else
    ok "Domain limpo"
  fi

  sec "Versão P10.2"
  grep -q "P10.2-AAA" "$PERS_DIR/index.js" && ok "Versão P10.2-AAA" || bad "Versão P10.2-AAA ausente"

  hr
  if [ "$FAIL" -eq 0 ]; then printf "✅ P10.2 AAA PASSOU\n"; else printf "❌ P10.2 AAA FALHOU (erros: %s)\n" "$FAIL"; fi
  hr
}

main >"$OUT" 2>&1 || true
tail -n 100 "$OUT"
printf "LOG: %s\n" "$OUT"
return 0 2>/dev/null || true
true
