#!/usr/bin/env bash
# scripts/relogio-mundial-smoke.sh — verificação do painel Relógio Mundial v3.
# @version 1.0.0  @created 2026-07-30
#
# Checa o que se pode checar SEM navegador: artefatos publicados, integridade do
# manifest, permissões, contrato do endpoint de clima e sanidade das bases de dados.
# A prova de comportamento (canvas pintando, camadas, projeções, arrasto, unmount) é
# a suíte Playwright:  WCM_OUT=/tmp/wcm node tools/screenshot/cap-relogio-mundial.mjs
#
# Sai 0 se tudo passa; 1 na primeira categoria que falhar.

set -uo pipefail

RAIZ="/var/www/dshowdash"
PANEL="$RAIZ/public/components/panels/panel-relogio-mundial"
BASE_URL="https://dshowdash.com.br"
CURL=(curl -s --resolve dshowdash.com.br:443:127.0.0.1 -k)

OK=0
FALHA=0

verde() { printf '  \033[32mOK\033[0m    │ %s\n' "$1"; OK=$((OK + 1)); }
vermelho() { printf '  \033[31mFALHA\033[0m │ %s\n' "$1"; FALHA=$((FALHA + 1)); }
secao() { printf '\n\033[1m── %s ──\033[0m\n' "$1"; }

checa() { # descrição, comando…
  local desc="$1"; shift
  if "$@" > /dev/null 2>&1; then verde "$desc"; else vermelho "$desc"; fi
}

# ===================== artefatos =====================
secao "artefatos de build"

for f in \
  "$PANEL/index.js" \
  "$PANEL/vite.config.ts" \
  "$PANEL/src/entry.tsx" \
  "$PANEL/dist/.vite/manifest.json" \
  "$PANEL/dist/geo/countries-50m.json" \
  "$PANEL/dist/geo/city-lights.json" \
  "$PANEL/dist/fonts/inter.woff2" \
  "$PANEL/dist/fonts/jetbrains-mono.woff2" \
  "$RAIZ/api/weather/bulk.php" \
; do
  if [ -f "$f" ]; then verde "existe $(basename "$f")"; else vermelho "AUSENTE: $f"; fi
done

# O entry hasheado do manifest precisa existir em disco. Manifest apontando para um
# arquivo que já foi apagado é a falha clássica de rebuild pela metade — o painel
# cai no motor vanilla sem ninguém perceber.
ENTRY=$(node -e "
  const m = require('$PANEL/dist/.vite/manifest.json');
  const k = Object.keys(m).find(k => k.endsWith('entry.tsx'));
  process.stdout.write(k && m[k].file ? m[k].file : '');
" 2>/dev/null)
if [ -n "$ENTRY" ] && [ -f "$PANEL/dist/$ENTRY" ]; then
  verde "manifest aponta para bundle existente ($ENTRY)"
else
  vermelho "manifest quebrado ou bundle ausente (entry='$ENTRY')"
fi

# O bundle precisa ter tamanho de aplicação. Sem preserveEntrySignatures:'strict' o
# Rollup elimina o App inteiro e entrega ~20 KB com build VERDE e painel em branco.
if [ -n "$ENTRY" ]; then
  TAM=$(stat -c%s "$PANEL/dist/$ENTRY" 2>/dev/null || echo 0)
  if [ "$TAM" -gt 80000 ]; then
    verde "bundle com tamanho de aplicação ($((TAM / 1024)) KB)"
  else
    vermelho "bundle pequeno demais ($((TAM / 1024)) KB) — suspeita de dead-code do App"
  fi
fi

if grep -q "preserveEntrySignatures: 'strict'" "$PANEL/vite.config.ts"; then
  verde "preserveEntrySignatures:'strict' presente no vite.config"
else
  vermelho "preserveEntrySignatures:'strict' AUSENTE — o Rollup vai apagar o App"
fi

# ===================== permissões =====================
secao "permissões"

DONO=$(stat -c '%U:%G' "$PANEL/dist" 2>/dev/null)
if [ "$DONO" = "www-data:www-data" ]; then
  verde "dist pertence a www-data ($DONO)"
else
  vermelho "dist com dono errado ($DONO) — rode chown -R www-data:www-data dist"
fi

ALHEIOS=$(find "$PANEL/dist" ! -user www-data 2>/dev/null | wc -l)
if [ "$ALHEIOS" -eq 0 ]; then
  verde "nenhum arquivo do dist com dono alheio"
else
  vermelho "$ALHEIOS arquivo(s) do dist não pertencem a www-data"
fi

# ===================== HTTP =====================
secao "entrega HTTP"

http_code() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$1"; }

for rota in \
  "/components/panels/panel-relogio-mundial/index.js" \
  "/components/panels/panel-relogio-mundial/dist/.vite/manifest.json" \
  "/components/panels/panel-relogio-mundial/dist/geo/countries-50m.json" \
  "/components/panels/panel-relogio-mundial/dist/geo/city-lights.json" \
  "/components/panels/panel-relogio-mundial/dist/fonts/inter.woff2" \
; do
  CODE=$(http_code "$BASE_URL$rota")
  if [ "$CODE" = "200" ]; then verde "200 $rota"; else vermelho "$CODE $rota"; fi
done

if [ -n "$ENTRY" ]; then
  CODE=$(http_code "$BASE_URL/components/panels/panel-relogio-mundial/dist/$ENTRY")
  if [ "$CODE" = "200" ]; then verde "200 bundle hasheado"; else vermelho "$CODE bundle hasheado"; fi
fi

# ===================== API de clima =====================
secao "api/weather/bulk.php"

checa "php -l passa" php -l "$RAIZ/api/weather/bulk.php"

RESP=$("${CURL[@]}" "$BASE_URL/api/weather/bulk.php?points=-23.55,-46.63;51.51,-0.13")
if echo "$RESP" | grep -q '"ok":true'; then
  verde "envelope {ok:true} (contrato oficial, não 'success')"
else
  vermelho "envelope inesperado: $(echo "$RESP" | head -c 120)"
fi

N=$(echo "$RESP" | node -e "
  let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
    try { const j=JSON.parse(s); process.stdout.write(String(Array.isArray(j.data)?j.data.length:0)); }
    catch { process.stdout.write('0'); }
  });
" 2>/dev/null)
if [ "$N" = "2" ]; then verde "2 pontos devolvidos para 2 pedidos"; else vermelho "esperava 2 pontos, veio $N"; fi

CODE=$(http_code "$BASE_URL/api/weather/bulk.php?points=abc,def")
if [ "$CODE" = "400" ]; then verde "coordenada não numérica rejeitada (400)"; else vermelho "validação falhou: $CODE"; fi

CODE=$(http_code "$BASE_URL/api/weather/bulk.php?points=999,999")
if [ "$CODE" = "400" ]; then verde "coordenada fora de faixa rejeitada (400)"; else vermelho "faixa não validada: $CODE"; fi

# Cache: a segunda chamada idêntica tem que sair do Redis.
"${CURL[@]}" -o /dev/null "$BASE_URL/api/weather/bulk.php?points=10.5,20.5"
HIT=$("${CURL[@]}" -D - -o /dev/null "$BASE_URL/api/weather/bulk.php?points=10.5,20.5" | grep -i '^x-cache:' | tr -d '\r')
if echo "$HIT" | grep -qi 'HIT'; then verde "cache Redis ativo ($HIT)"; else vermelho "sem HIT de cache ($HIT)"; fi

# ===================== bases de dados =====================
secao "bases locais"

node -e "
const fs = require('fs');
const src = (p) => fs.readFileSync('$PANEL/src/' + p, 'utf8');
let falhas = 0;
const ok = (c, m) => { console.log((c ? '  \x1b[32mOK\x1b[0m    │ ' : '  \x1b[31mFALHA\x1b[0m │ ') + m); if (!c) falhas++; };

const cidades = src('data/cities.ts');
const nCidades = (cidades.match(/^  \{ id: /gm) || []).length;
ok(nCidades >= 150, nCidades + ' cidades na base');

// Toda zona IANA declarada precisa ser aceita pelo Intl deste runtime. Uma zona
// inventada só falharia no navegador do usuário, em runtime, sem aviso.
const tzs = [...new Set([...cidades.matchAll(/tz: '([^']+)'/g)].map((m) => m[1]))];
let tzRuins = [];
for (const tz of tzs) {
  try { new Intl.DateTimeFormat('pt-BR', { timeZone: tz }).format(new Date()); }
  catch { tzRuins.push(tz); }
}
ok(tzRuins.length === 0, tzs.length + ' zonas IANA distintas, todas válidas' + (tzRuins.length ? ' — inválidas: ' + tzRuins : ''));

// ISO-2 fora do padrão quebraria a bandeira emoji (vira quadrado branco).
const ccs = [...cidades.matchAll(/cc: '([^']*)'/g)].map((m) => m[1]);
ok(ccs.every((c) => /^[A-Z]{2}\$/.test(c)), ccs.length + ' códigos de país no formato ISO-2');

const aeroportos = src('data/airports.ts');
const nAero = (aeroportos.match(/^  \{ iata: /gm) || []).length;
ok(nAero >= 150, nAero + ' aeroportos com ICAO e IATA');
const icaos = [...aeroportos.matchAll(/icao: '([^']*)'/g)].map((m) => m[1]);
ok(icaos.every((c) => /^[A-Z0-9]{4}\$/.test(c)), 'todos os ICAO com 4 caracteres');

const bolsas = src('data/exchanges.ts');
const nBolsas = (bolsas.match(/^    id: '/gm) || []).length;
ok(nBolsas >= 25, nBolsas + ' bolsas com grade de sessão');

// Feriado fora do formato MM-DD nunca casaria, e o mercado apareceria aberto no dia.
const feriados = [...bolsas.matchAll(/'(\d{2}-\d{2})'/g)].map((m) => m[1]);
ok(feriados.length > 150, feriados.length + ' datas de feriado no formato MM-DD');
const foraDeFaixa = feriados.filter((f) => {
  const [mm, dd] = f.split('-').map(Number);
  return mm < 1 || mm > 12 || dd < 1 || dd > 31;
});
ok(foraDeFaixa.length === 0, 'nenhuma data de feriado fora de faixa' + (foraDeFaixa.length ? ': ' + foraDeFaixa : ''));

// A cidade-sede de cada bolsa precisa existir em cities.ts, senão o pino some do mapa.
const idsCidade = new Set([...cidades.matchAll(/^  \{ id: '([^']+)'/gm)].map((m) => m[1]));
const orfas = [...bolsas.matchAll(/cityId: '([^']+)'/g)].map((m) => m[1]).filter((c) => !idsCidade.has(c));
ok(orfas.length === 0, 'toda bolsa aponta para cidade existente' + (orfas.length ? ' — órfãs: ' + orfas : ''));

const luzes = JSON.parse(fs.readFileSync('$PANEL/dist/geo/city-lights.json', 'utf8'));
ok(Array.isArray(luzes) && luzes.length > 4000, luzes.length + ' luzes de cidade');
ok(luzes.every((l) => l.length === 3 && l[0] >= -180 && l[0] <= 180 && l[1] >= -90 && l[1] <= 90),
   'todas as luzes com coordenadas válidas');

process.exit(falhas ? 1 : 0);
"
if [ $? -eq 0 ]; then OK=$((OK + 10)); else FALHA=$((FALHA + 1)); fi

# ===================== cálculos =====================
secao "verificação numérica (astronomia, fusos, mercados)"

# Transpila as libs para node e roda a suíte de números. É a única parte da entrega
# que confere o RESULTADO dos cálculos contra referências externas (efemérides
# publicadas, regras de DST, grades oficiais das bolsas) em vez de contra si mesma.
LIB=$(mktemp -d)
if (cd "$PANEL" && npx esbuild src/lib/astro.ts src/lib/time.ts src/lib/markets.ts src/lib/events.ts src/data/cities.ts src/data/airports.ts \
      --bundle --format=esm --platform=node --outdir="$LIB" --outbase="$PANEL/src" \
      --log-level=error --alias:@="$PANEL/src") > /dev/null 2>&1; then
  if WCM_LIB="$LIB" node "$RAIZ/scripts/relogio-mundial-verifica-calculos.mjs" > "$LIB/saida.txt" 2>&1; then
    N=$(grep -c 'OK' "$LIB/saida.txt")
    verde "$N verificações numéricas passaram (nascer/pôr do sol, DST, sessões de bolsa)"
  else
    vermelho "verificação numérica falhou:"
    grep 'FALHA' "$LIB/saida.txt" | head -8
  fi
else
  vermelho "não foi possível transpilar as libs para verificação (esbuild)"
fi
rm -rf "$LIB"

# ===================== rede de segurança PNR =====================
secao "PNR (fallback vanilla)"

if [ -f "$RAIZ/public/components/world-clock-map/panel.js" ]; then
  verde "motor vanilla legado preservado (fallback do adaptador)"
else
  vermelho "motor vanilla removido — o adaptador perde a rede de segurança"
fi

if grep -q "world-clock-map/panel.js" "$PANEL/index.js"; then
  verde "adaptador referencia o fallback vanilla"
else
  vermelho "adaptador sem fallback vanilla"
fi

# ===================== resultado =====================
printf '\n════════════════════════════════════════\n'
printf 'PASSOU: %d   FALHOU: %d\n' "$OK" "$FALHA"
printf '════════════════════════════════════════\n\n'
[ "$FALHA" -eq 0 ] || exit 1
exit 0
