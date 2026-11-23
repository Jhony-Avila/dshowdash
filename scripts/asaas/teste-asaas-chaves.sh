#!/usr/bin/env bash
# Teste do asaas-chaves.sh com curl FALSO (nenhuma rede, nenhuma chave real). Cria UM temporário próprio por mktemp em /srv/dshow-work,
# confere o caminho e remove só ele no fim. Uso: bash scripts/asaas/teste-asaas-chaves.sh [caminho/do/asaas-chaves.sh]
set -euo pipefail
SCRIPT="$(readlink -f "${1:-$(dirname "$(readlink -f "$0")")/asaas-chaves.sh}")"
[ -f "$SCRIPT" ] || { echo "script não encontrado: $SCRIPT"; exit 2; }
W="$(mktemp -d /srv/dshow-work/asaas-teste.XXXXXX)" || { echo "mktemp falhou"; exit 2; }
case "$W" in /srv/dshow-work/asaas-teste.??????) ;; *) echo "temporário inesperado: $W"; exit 2;; esac
[ -d "$W" ] || exit 2
limpar() { case "$W" in /srv/dshow-work/asaas-teste.??????) [ -d "$W" ] && rm -rf -- "$W";; esac; }
trap limpar EXIT
mkdir -p "$W/config" "$W/bin" "$W/tmp"

# chaves INVENTADAS
K1='$aact_prod_000TesteUmAAAAAAAAAAAAAAAAAAAAAAAA::$aach_um'
K2='$aact_prod_000TesteDoisBBBBBBBBBBBBBBBBBBBBBBB::$aach_dois'
K3='$aact_prod_000TesteTresCCCCCCCCCCCCCCCCCCCCCCC::$aach_tres'
K401='$aact_prod_000Recusada401DDDDDDDDDDDDDDDDDDDD'
K429='$aact_prod_000Limite429EEEEEEEEEEEEEEEEEEEEEE'
KH='$aact_hmlg_000SandboxFFFFFFFFFFFFFFFFFFFFFFFFFF'
K4='$aact_prod_000OutraEmpresaGGGGGGGGGGGGGGGGGGGG::$aach_quatro'
K5='$aact_prod_000SemDocumentoHHHHHHHHHHHHHHHHHHHH::$aach_cinco'
export K1 K2 K3 K401 K429 KH K4 K5

# curl falso: lê a config pelo stdin, registra argv e URL (NUNCA a chave), escreve a resposta em --output e o código em --write-out
cat > "$W/bin/curl" <<'FAKE'
#!/usr/bin/env bash
set -euo pipefail
D="$(dirname "$(dirname "$(readlink -f "$0")")")"
printf '%s\n' "$*" >> "$D/argv.log"
out=""; while [ $# -gt 0 ]; do case "$1" in --output) out="$2"; shift 2;; *) shift;; esac; done
cfg="$(cat)"
url="$(printf '%s\n' "$cfg" | sed -n 's/^url = "\(.*\)"$/\1/p')"; echo "$url" >> "$D/urls.log"
key="$(printf '%s\n' "$cfg" | sed -n 's/^header = "access_token: \(.*\)"$/\1/p')"
code=401; body='{"errors":[{"code":"invalid_access_token"}]}'
[ "$key" = "$K1" ] && code=200 && body='{"companyName":"Empresa Teste Um","cpfCnpj":"12345678000199","email":"financeiro@exemplo.invalid"}'
[ "$key" = "$K2" ] && code=200 && body='{"name":"Pessoa Teste Dois","cpfCnpj":"11122233344"}'
[ "$key" = "$K3" ] && code=200 && body='{"companyName":"Empresa Teste Um","cpfCnpj":"12345678000199"}'
[ "$key" = "$K429" ] && code=429 && body='{}'
[ "$key" = "$KH" ] && code=200 && body='{"companyName":"Sandbox Teste"}'
[ "$key" = "$K4" ] && code=200 && body='{"companyName":"Outra Empresa Teste","cpfCnpj":"98765432000111"}'
[ "$key" = "$K5" ] && code=200 && body='{"companyName":"Sem Documento Teste"}'
printf '%s' "$body" > "$out"; printf '%s' "$code"
FAKE
chmod 700 "$W/bin/curl"

export PATH="$W/bin:$PATH" TMPDIR="$W/tmp" ASAAS_CHAVES_TESTE=1
CFG="$W/config"; DIRK="$CFG/asaas"
ok=0; falha=0
check() { if eval "$2"; then ok=$((ok+1)); else falha=$((falha+1)); echo "FALHOU: $1"; fi; }
rodar() { local entrada="$1" rc=0; shift; printf '%s' "$entrada" | bash "$SCRIPT" --dash-config "$CFG" "$@" > "$W/saida.txt" 2>&1 || rc=$?; echo "$rc" > "$W/rc"; cat "$W/saida.txt" >> "$W/todas-saidas.txt"; }
ncurl() { [ -f "$W/urls.log" ] && wc -l < "$W/urls.log" || echo 0; }

# 1 simulação: não pede nada, não cria nada, não chama o Asaas
rodar ""
check "simulação sai 0" '[ "$(cat $W/rc)" = 0 ]'
check "simulação não cria a pasta" '[ ! -e "$DIRK" ]'
check "simulação não chama o Asaas" '[ "$(ncurl)" = 0 ]'
check "simulação explica o --executar" 'grep -q "\[DRY\]" $W/saida.txt'

# 2 duas contas numa execução
rodar "dshow
$K1
$K1
s
s
display-solutions
$K2
$K2
s
n
" --executar
check "2 contas: sai 0" '[ "$(cat $W/rc)" = 0 ]'
check "pasta 0700" '[ "$(stat -c %a $DIRK)" = 700 ]'
check "arquivo dshow 0600 com a chave" '[ "$(stat -c %a $DIRK/dshow.key)" = 600 ] && [ "$(cat $DIRK/dshow.key)" = "$K1" ]'
check "arquivo display-solutions com a chave 2" '[ "$(cat $DIRK/display-solutions.key)" = "$K2" ]'
check "mostra o nome da conta 1" 'grep -q "conta no Asaas: Empresa Teste Um" $W/saida.txt'
check "mostra o nome da conta 2 (name)" 'grep -q "conta no Asaas: Pessoa Teste Dois" $W/saida.txt'
check "não mostra CNPJ/CPF nem e-mail" '! grep -qE "12345678000199|11122233344|exemplo.invalid" $W/saida.txt'
check "1 GET por chave conferida" '[ "$(ncurl)" = 2 ]'
check "conferência na URL de produção" '! grep -qv "^https://api.asaas.com/v3/myAccount/commercialInfo$" $W/urls.log'
check "nenhum temporário sobra" '[ -z "$(ls -A $W/tmp)" ]'

# 3 valores diferentes
rodar "outra
$K3
${K3}x
" --executar
check "diferentes: nada gravado" '[ ! -e $DIRK/outra.key ] && grep -q "diferem" $W/saida.txt'
# 4 recusada 401
rodar "outra
$K401
$K401
" --executar
check "401: nada gravado" '[ ! -e $DIRK/outra.key ] && grep -q "recusou a chave (401)" $W/saida.txt'
# 5 limite 429
rodar "outra
$K429
$K429
" --executar
check "429: nada gravado" '[ ! -e $DIRK/outra.key ] && grep -q "(429)" $W/saida.txt'
# 6 formato inválido e barra invertida
n0="$(ncurl)"
rodar 'outra
semdolar123456789012345678901234
semdolar123456789012345678901234
' --executar
check "sem \$aact_: recusada" 'grep -q "não parece uma chave" $W/saida.txt && [ ! -e $DIRK/outra.key ]'
rodar 'outra
$aact_prod_000Barra\InvertidaGGGGGGGGGGGGGGGGG
$aact_prod_000Barra\InvertidaGGGGGGGGGGGGGGGGG
' --executar
check "barra invertida: recusada" 'grep -q "não parece uma chave" $W/saida.txt && [ ! -e $DIRK/outra.key ]'
# 7 homologação sem --sandbox (não chama o Asaas)
rodar "outra
$KH
$KH
" --executar
check "hmlg sem --sandbox: recusada" 'grep -q "HOMOLOGAÇÃO" $W/saida.txt && [ ! -e $DIRK/outra.key ]'
check "recusas de formato não chamam o Asaas" '[ "$(ncurl)" = "$n0" ]'
# 8 mesma chave em outro rótulo
rodar "copia
$K1
$K1
" --executar
check "chave repetida em outro rótulo: recusada" 'grep -q "já está guardada no rótulo .dshow." $W/saida.txt && [ ! -e $DIRK/copia.key ]'
# 9 confirmação negada
rodar "outra
$K4
$K4
n
" --executar
check "confirmação N: nada gravado (nem a identidade)" '[ ! -e $DIRK/outra.key ] && [ ! -e $DIRK/outra.id ] && grep -q "Outra Empresa Teste" $W/saida.txt'
# 10 rótulo inválido
rodar "../etc
" --executar
check "rótulo com barra: recusado" 'grep -q "rótulo inválido" $W/saida.txt'
# 11 substituir a chave de dshow; a antiga vai para o backup; o revert devolve
rodar "dshow
s
$K3
$K3
s
n
" --executar
check "substituição: chave nova" '[ "$(cat $DIRK/dshow.key)" = "$K3" ]'
BKD="$(ls -d $W/backup/*-asaas-chaves 2>/dev/null | tail -1)"
check "substituição: antiga no backup" '[ -n "$BKD" ] && [ "$(cat $BKD/dshow.key.antiga)" = "$K1" ]'
bash "$BKD/revert-all.sh" > /dev/null
check "revert-all devolve a antiga (chave e identidade)" '[ "$(cat $DIRK/dshow.key)" = "$K1" ] && [ "$(cat $BKD/dshow.key.novo-revertido)" = "$K3" ] && [ -f $DIRK/dshow.id ]'
# 12 a chave nunca vai por argumento; argumento desconhecido é recusado
rodar "" --executar "$K1"
check "chave como argumento: recusada e não exibida" '[ "$(cat $W/rc)" = 2 ] && grep -q "parece uma CHAVE" $W/saida.txt'
# 13 modo de teste fora da pasta de teste
printf '' | bash "$SCRIPT" --dash-config /srv/dshow-shared/dash/config > "$W/saida.txt" 2>&1 && rc=0 || rc=$?
check "modo de teste recusa a config real" '[ "$rc" = 2 ] && grep -q "modo de teste só" $W/saida.txt'
# 14 --listar mostra só rótulos
rodar "" --listar
check "--listar mostra os rótulos" 'grep -q "dshow " $W/saida.txt && grep -q "display-solutions" $W/saida.txt'
# 16 B2 (Codex DSHOW-111): identidade presa ao rótulo; troca cruzada recusada
check "identidade gravada (sha256, 0600) e sem o CNPJ em claro" '[ "$(stat -c %a $DIRK/dshow.id)" = 600 ] && grep -qE "^[0-9a-f]{64}$" $DIRK/dshow.id && ! grep -rq 12345678000199 $DIRK'
check "identidade = sha256 dos dígitos do CNPJ" '[ "$(cat $DIRK/dshow.id)" = "$(printf %s 12345678000199 | sha256sum | cut -c1-64)" ]'
rodar "dshow
s
$K4
$K4
" --executar
check "TROCA CRUZADA: chave válida de outra empresa no rótulo dshow → recusada" 'grep -q "OUTRA conta/empresa" $W/saida.txt && [ "$(cat $DIRK/dshow.key)" = "$K1" ] && [ "$(cat $DIRK/dshow.id)" = "$(printf %s 12345678000199 | sha256sum | cut -c1-64)" ]'
check "troca cruzada: nem o nome da outra empresa é confirmado" '! grep -q "É a conta da empresa" $W/saida.txt'
rodar "copia-da-dshow
$K3
$K3
" --executar
check "mesma conta em OUTRO rótulo → recusada (uma conta por empresa)" 'grep -q "já está presa ao rótulo .dshow." $W/saida.txt && [ ! -e $DIRK/copia-da-dshow.key ]'
rodar "sem-doc
$K5
$K5
" --executar
check "conta sem CPF/CNPJ na resposta → recusada" 'grep -q "identidade" $W/saida.txt && [ ! -e $DIRK/sem-doc.key ]'
rodar "outra-empresa
$K4
$K4
s
n
" --executar
check "a outra empresa entra no SEU rótulo, com a sua identidade" '[ "$(cat $DIRK/outra-empresa.id)" = "$(printf %s 98765432000111 | sha256sum | cut -c1-64)" ]'
check "nenhum CPF/CNPJ em nenhuma saída" '! grep -qE "12345678000199|11122233344|98765432000111" $W/todas-saidas.txt'
# 15 GLOBAL: nenhuma chave em nenhuma saída nem em argv do curl
vazou=0
for k in "$K1" "$K2" "$K3" "$K401" "$K429" "$KH" "$K4" "$K5"; do
  grep -qF -- "$k" "$W/todas-saidas.txt" && vazou=1
  grep -qF -- "${k#\$}" "$W/argv.log" && vazou=1
done
check "nenhuma chave em saída ou argv" '[ "$vazou" = 0 ]'
check "argv do curl nunca tem access_token" '! grep -q "access_token" $W/argv.log'

echo "teste-asaas-chaves: $ok ok, $falha falha(s)"
[ "$falha" = 0 ]
