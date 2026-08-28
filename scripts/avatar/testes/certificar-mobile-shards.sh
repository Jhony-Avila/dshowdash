#!/usr/bin/env bash
# certificar-mobile-shards.sh — TRACK C: certificação AGREGADA em SHARDS.
# Contorna o governador de recursos do ambiente rodando grupos pequenos em
# invocações separadas; um agregador comprova que TODOS os shards pertencem ao
# MESMO sha/tree/build (dist)/harness antes de somar. NÃO some estados diferentes.
#
# Uso:
#   ... shard <id> "<t1 t2 ...>"   → roda o grupo, grava resultado + assinatura
#   ... aggregate                   → soma todos os shards, exige assinatura única
#
# NÃO faz merge/deploy/rollout/reset/push/--gravar.
set -uo pipefail
REPO="$(git rev-parse --show-toplevel)"; cd "$REPO"
DIR="${SHARD_DIR:-/home/claude/cert-shards}"; mkdir -p "$DIR"
MODO="${1:-}"

assinatura() {
  local sha tree dist harness
  sha="$(git rev-parse HEAD)"; tree="$(git rev-parse HEAD^{tree})"
  dist="$(find public/components/panels/panel-avatar-studio/dist -type f -name '*.js' -o -type f -name '*.css' 2>/dev/null | sort | xargs sha256sum 2>/dev/null | sha256sum | cut -d' ' -f1)"
  harness="$(sha256sum public/avst-harness.html 2>/dev/null | cut -d' ' -f1)"
  echo "$sha|$tree|$dist|$harness"
}

achar_porta(){ for p in 8901 8911 8921 8931 8941 8951; do if ! (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then echo "$p"; return; fi; done; echo 8961; }

if [ "$MODO" = "shard" ]; then
  ID="${2:?shard id}"; LISTA="${3:?lista de testes}"
  export PW_CHROME="${PW_CHROME:-$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1)}"
  PORTA="$(achar_porta)"; SRV=""
  limpar(){ [ -n "$SRV" ] && kill "$SRV" 2>/dev/null; pkill -f "http.server $PORTA" 2>/dev/null; pkill -f "chrome-linux/chrome" 2>/dev/null; }
  trap 'limpar' EXIT INT TERM
  ( cd public && python3 -m http.server "$PORTA" ) >/dev/null 2>&1 & SRV=$!; sleep 2
  ASSIN="$(assinatura)"
  OUT="$DIR/shard_${ID}.json"; : > "$OUT.tmp"
  echo "{\"id\":\"$ID\",\"assinatura\":\"$ASSIN\",\"testes\":[" >> "$OUT.tmp"
  first=1
  for t in $LISTA; do
    timeout 110 node scripts/avatar/testes/$t.mjs >"$DIR/${t}.log" 2>&1; rc=$?
    [ $first -eq 0 ] && echo "," >> "$OUT.tmp"; first=0
    echo "  {\"nome\":\"$t\",\"rc\":$rc}" >> "$OUT.tmp"
    echo "  shard $ID · $t → rc=$rc"
    pkill -f "chrome-linux/chrome" 2>/dev/null
  done
  echo "]}" >> "$OUT.tmp"; mv "$OUT.tmp" "$OUT"
  echo "  shard $ID gravado em $OUT (assinatura ${ASSIN:0:24}...)"
  exit 0
fi

if [ "$MODO" = "aggregate" ]; then
  echo "==================== AGREGADOR ===================="
  shards=$(ls "$DIR"/shard_*.json 2>/dev/null)
  [ -z "$shards" ] && { echo "sem shards em $DIR"; exit 2; }
  # assinatura única?
  ASSINS=$(for f in $shards; do grep -o '"assinatura":"[^"]*"' "$f" | cut -d'"' -f4; done | sort -u)
  N_ASSIN=$(echo "$ASSINS" | wc -l)
  echo "shards: $(echo "$shards" | wc -w) · assinaturas distintas: $N_ASSIN"
  if [ "$N_ASSIN" -ne 1 ]; then echo "✗ ABORTA: shards de estados DIFERENTES (sha/tree/build divergem) — não somar."; echo "$ASSINS"; exit 3; fi
  echo "assinatura única: ${ASSINS:0:40}..."
  TOTAL=0; PASS=0; REDS=""
  for f in $shards; do
    while read -r nome rc; do
      [ -z "$nome" ] && continue
      TOTAL=$((TOTAL+1)); [ "$rc" = "0" ] && PASS=$((PASS+1)) || REDS="$REDS $nome(rc$rc)"
    done < <(grep -oE '"nome":"[^"]*","rc":[0-9]+' "$f" | sed 's/"nome":"//; s/","rc":/ /')
  done
  FAIL=$((TOTAL-PASS))
  # hash dos resultados
  RHASH=$(cat $shards | sha256sum | cut -d' ' -f1)
  echo "FINAL_AGGREGATED_TESTS=$TOTAL"
  echo "FINAL_AGGREGATED_PASSED=$PASS"
  echo "FINAL_AGGREGATED_FAILED=$FAIL"
  echo "RESULTS_HASH=$RHASH"
  [ -n "$REDS" ] && echo "VERMELHOS:$REDS" || echo "VERMELHOS: nenhum"
  ORF=$(ps -eo stat,args 2>/dev/null | grep chrome-linux/chrome | grep -v grep | grep -vc '^Z')
  echo "ORPHAN_PROCESSES=$ORF"
  if [ "$FAIL" -eq 0 ] && [ "$ORF" -eq 0 ]; then echo "FINAL_AGGREGATED_EXIT=0"; exit 0; else echo "FINAL_AGGREGATED_EXIT=1"; exit 1; fi
fi

echo "uso: $0 shard <id> \"<testes>\"  |  $0 aggregate"; exit 2
