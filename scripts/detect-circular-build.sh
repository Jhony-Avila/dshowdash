#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# detect-circular-build.sh — TRAVA de cadeia de build circular
# ═══════════════════════════════════════════════════════════════
# PORQUÊ ESTE DETECTOR EXISTE
#   Em 2026-07-28 descobriu-se que a correção de CSRF do telemetry-core
#   estava CERTA na fonte e mesmo assim não chegava ao browser. Causa:
#
#       _entry.ts  →  index.js  →  export * from './dist/<x>.bundle.js'
#
#   O entry do vite se alimentava do PRÓPRIO artefato. Rebuildar o alvo
#   re-empacotava o bundle antigo e DESCARTAVA as fontes .ts — e o build
#   saía VERDE, sem aviso nenhum. O sintoma para quem edita é o pior que
#   existe: "corrigi, rebuildei, e o bug continua".
#
#   Em 2026-07-30 mediu-se o resto: 17 dos 21 alvos core seguem assim.
#
# O QUE ELE PROVA (READ-ONLY — não altera nada)
#   Para cada alvo de public/vite.lote3bc.config.js E de
#   public/components/vite.components.config.js:
#     segue a cadeia a partir do `entry` e acusa quando ela alcança um
#     `dist/*.bundle.js` — direto ou via index.js.
#
#   O baseline registra os alvos JÁ circulares hoje. O detector só falha
#   quando aparece um alvo NOVO circular ou quando um alvo consertado
#   regride. Consertar um alvo é uma melhoria e exige `--update`.
#
# EXIT CODES (compatível com run_strict do check-all.sh)
#   0 = OK (nenhum alvo circular além do baseline)
#   1 = ACHADO (alvo novo circular, ou regressão de alvo consertado)
#   2 = ERRO (config ilegível, node ausente)
#
# USO
#   bash scripts/detect-circular-build.sh            # checa (default)
#   bash scripts/detect-circular-build.sh --list     # mostra todos, sem julgar
#   bash scripts/detect-circular-build.sh --update   # regrava o baseline
#                                                    # (após consertar um alvo)
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="/var/www/dshowdash"
PUBLIC="$ROOT/public"
CONFIG="$PUBLIC/vite.lote3bc.config.js"
BASELINE="$ROOT/scripts/.circular-build-baseline.txt"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

MODO="${1:---check}"

[ -f "$CONFIG" ] || echo -e "${YELLOW}AVISO: $CONFIG ausente (lote3bc obsoleto: 16/17 alvos daquele config nao existem mais desde a migracao de 2026-07-30); seguindo so com components/vite.components.config.js${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}ERRO: node nao encontrado${NC}"; exit 2; }

# ── Análise em node: seguir a cadeia de imports do entry ──────────
ATUAL="$(node - "$PUBLIC" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const PUB = process.argv[2];

/*
 * DUAS configs de build, nao uma.
 *
 * Ate 2026-07-30 este detector so lia a vite.lote3bc.config.js e dava
 * "sem alvo circular novo" — enquanto 16 dos 20 alvos da
 * components/vite.components.config.js (app-shell, footer, nav-rail,
 * login-modal, session-manager, toast...) eram circulares e nunca tinham sido
 * olhados. Nao era erro de logica: era o universo medido ser parcial, o que e
 * pior, porque o verde parecia cobertura.
 *
 * Descoberto ao tentar corrigir o footer: a fonte mudava, o bundle nao.
 */
const CONFIGS = [
  { arquivo: 'vite.lote3bc.config.js',            variavel: 'TARGETS' },
  { arquivo: 'components/vite.components.config.js', variavel: 'COMPONENTS' },
];

const alvos = [];
for (const c of CONFIGS) {
  let cfg;
  try { cfg = fs.readFileSync(path.join(PUB, c.arquivo), 'utf8'); }
  catch { console.error('config ausente (ignorada): ' + c.arquivo); continue; }
  const bloco = (cfg.match(new RegExp('var ' + c.variavel + ' = \\{([\\s\\S]*?)\\n\\};')) || [])[1];
  if (!bloco) { console.error(c.variavel + ' nao encontrado em ' + c.arquivo); process.exit(2); }
  const re = /^ {2}'?([a-zA-Z0-9_-]+)'?:\s*\{([\s\S]*?)\n {2}\},?$/gm;
  let m;
  while ((m = re.exec(bloco)) !== null) {
    const entry = (m[2].match(/entry:\s*'([^']+)'/) || [])[1];
    // Nomes nao colidem entre as duas configs (conferido); por isso a baseline
    // segue por nome simples e as 11 linhas antigas continuam validas.
    if (entry) alvos.push({ nome: m[1], entry, config: c.arquivo });
  }
}

const ehArtefato = (s) => /\/dist\/|\.bundle\.js$/.test(s);

/**
 * Remove comentarios antes de procurar imports.
 *
 * Sem isto o detector se engana com a propria documentacao: um `_entry.ts` que
 * EXPLICA o anti-padrao escrevendo `export * from './dist/x.bundle.js'` dentro
 * de um comentario era acusado de circular. Aconteceu de verdade ao consertar o
 * kernel-ui — o alvo estava correto e o detector apontava o comentario.
 * Comentario nao e codigo; um detector que nao distingue os dois ensina a nao
 * documentar.
 */
const semComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/.*$/gm, '');

/** Segue os imports em profundidade; para no primeiro artefato alcançado. */
function alcancaDist(arquivo, visto = new Set(), prof = 0) {
  if (prof > 4 || visto.has(arquivo)) return null;
  visto.add(arquivo);
  let src;
  try { src = fs.readFileSync(arquivo, 'utf8'); } catch { return null; }
  src = semComentarios(src);
  // Aspas simples E duplas: o .ts usa simples, o .js transpilado pelo esbuild
  // usa duplas. Olhar so um dos dois deixa metade da cadeia invisivel.
  const imports = [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((x) => x[1]);
  for (const imp of imports) {
    if (ehArtefato(imp)) return imp;
    if (!imp.startsWith('.')) continue;               // pacote externo: ignora
    const base = path.resolve(path.dirname(arquivo), imp);
    for (const cand of [base, base.replace(/\.js$/, '.ts')]) {
      if (!fs.existsSync(cand) || fs.statSync(cand).isDirectory()) continue;
      const r = alcancaDist(cand, visto, prof + 1);
      if (r) return `${imp} → ${r}`;
    }
  }
  return null;
}

for (const a of alvos) {
  const p = path.resolve(PUB, a.entry);
  if (!fs.existsSync(p)) { console.log(`${a.nome}\tSEM_ENTRY\t${a.entry}`); continue; }
  const via = alcancaDist(p);
  console.log(`${a.nome}\t${via ? 'CIRCULAR' : 'OK'}\t${via || a.entry}`);
}
NODE
)" || { echo -e "${RED}ERRO: falha ao analisar a config${NC}"; exit 2; }

CIRC_ATUAL="$(echo "$ATUAL" | awk -F'\t' '$2=="CIRCULAR"{print $1}' | sort)"
TOTAL=$(echo "$ATUAL" | grep -c . || true)
N_CIRC=$(echo "$CIRC_ATUAL" | grep -c . || true)

echo -e "\n${BOLD}▸ CADEIA DE BUILD — ${TOTAL} alvo(s) em 2 configs (lote3bc + components)${NC}"
echo "─────────────────────────────────────────────────────────────────"

if [ "$MODO" = "--list" ]; then
  echo "$ATUAL" | while IFS=$'\t' read -r nome estado via; do
    case "$estado" in
      CIRCULAR) printf "  ${RED}%-10s${NC} %-22s %s\n" "CIRCULAR" "$nome" "$via" ;;
      OK)       printf "  ${GREEN}%-10s${NC} %-22s\n"     "ok"       "$nome" ;;
      *)        printf "  ${YELLOW}%-10s${NC} %-22s %s\n" "$estado"  "$nome" "$via" ;;
    esac
  done
  echo "─────────────────────────────────────────────────────────────────"
  echo -e "  circulares: ${N_CIRC}/${TOTAL}"
  exit 0
fi

if [ "$MODO" = "--update" ]; then
  { echo "# Alvos com cadeia de build circular — baseline aceito."
    echo "# Gerado por detect-circular-build.sh --update em $(date -u '+%Y-%m-%d %H:%M UTC')"
    echo "# Consertar um alvo = removê-lo desta lista via --update."
    echo "$CIRC_ATUAL"
  } > "$BASELINE"
  echo -e "  ${GREEN}baseline regravado${NC}: ${N_CIRC} alvo(s) circular(es) em $BASELINE"
  exit 0
fi

# ── Comparação com o baseline ─────────────────────────────────────
if [ ! -f "$BASELINE" ]; then
  echo -e "  ${YELLOW}baseline ausente${NC} — gere com: bash scripts/detect-circular-build.sh --update"
  echo -e "  circulares agora: ${N_CIRC}/${TOTAL}"
  exit 2
fi

CIRC_BASE="$(grep -v '^#' "$BASELINE" | grep . | sort || true)"

NOVOS="$(comm -23 <(echo "$CIRC_ATUAL") <(echo "$CIRC_BASE") | grep . || true)"
CONSERTADOS="$(comm -13 <(echo "$CIRC_ATUAL") <(echo "$CIRC_BASE") | grep . || true)"

printf "  circulares: %s   (baseline: %s)\n" "$N_CIRC" "$(echo "$CIRC_BASE" | grep -c . || true)"

if [ -n "$CONSERTADOS" ]; then
  echo -e "\n  ${GREEN}${BOLD}▸ CONSERTADOS desde o baseline${NC} (rode --update para aceitar):"
  echo "$CONSERTADOS" | sed 's/^/    ✔ /'
fi

if [ -n "$NOVOS" ]; then
  echo -e "\n  ${RED}${BOLD}▸ REGRESSÃO — alvo(s) circular(es) FORA do baseline${NC}"
  echo -e "  ${RED}Correção na fonte destes alvos NÃO chega ao browser.${NC}"
  echo "$NOVOS" | while read -r n; do
    printf "    ${RED}✖ %-22s${NC} %s\n" "$n" "$(echo "$ATUAL" | awk -F'\t' -v k="$n" '$1==k{print $3}')"
  done
  echo -e "\n  ${YELLOW}ANTES de seguir a receita: confira se ela se aplica a este alvo.${NC}"
  echo "    node scripts/analisa-raiz-perdida.mjs <alvo>"
  echo "    Em 20 dos 28 circulares parte da API publica so existe DENTRO do"
  echo "    bundle minificado (a raiz de composicao se perdeu). Nesses, quebrar a"
  echo "    circularidade e REESCREVER a API, nao reexportar — outro custo e risco."
  echo ""
  echo -e "  Receita (aplicada com sucesso no telemetry-core), quando ha o que reexportar:"
  echo "    1. criar _entry.ts que reexporta as FONTES, nao o index.js"
  echo "    2. apontar 'entry' do alvo para esse _entry.ts"
  echo "    3. TARGET=<alvo> npx vite build --config <a config QUE DEFINE o alvo>"
  echo "       (lote3bc.config.js ou components/vite.components.config.js)"
  echo "    4. conferir: nº de modulos transformados sobe (3 -> 13 no telemetry-core)"
  echo ""
  exit 1
fi

echo -e "\n  ${GREEN}Sem alvo circular novo.${NC}\n"
exit 0
