#!/usr/bin/env bash
# =====================================================================================================================================
# scripts/asaas/asaas-chaves.sh — GUARDA das chaves de API do Asaas (uma conta Asaas por empresa, uma chave por conta) · ACIMA_DIREITA 23/11/2026
# Padrão do dash-to-app-secret.sh. Executor: Jhony, root, terminal comum. NENHUM agente gera, recebe ou vê chave.
#
# O que faz (com --executar; sem ele, só mostra o que faria e NÃO pede chave):
#   para cada conta, quantas o Jhony quiser, UMA POR VEZ:
#     1. pede o RÓTULO da empresa (ex.: dshow, display-solutions) — vira o nome do arquivo;
#     2. pede a CHAVE duas vezes com `read -s` (sem eco) e confere se são iguais;
#     3. confere a chave com UMA consulta GET leve ao Asaas (GET /v3/myAccount/commercialInfo) e mostra SÓ o nome da conta;
#     4. o Jhony confirma que é a conta certa; só então grava.
#   Grava em <config compartilhada do Dash>/asaas/<rótulo>.key  (pasta 0700, arquivo 0600, dono = usuário do php-fpm, sem ACL).
#   A config compartilhada (/srv/dshow-shared/dash/config, para onde aponta <release>/config) sobrevive às trocas de release.
#   Chave já existente para o rótulo: só com confirmação; a antiga é MOVIDA para /backup/_restrito/<ts>-asaas-chaves/ (revert-all.sh).
#
# A chave começa com `$`: ela NUNCA passa por argumento de comando, eval, log, histórico ou saída. Fica só numa variável do próprio
# script (nunca exportada), vai ao curl pela entrada padrão (`curl --config -`, escrita com o builtin printf → não aparece em `ps`),
# e ao arquivo pelo builtin printf. `set -x` é desligado à força. A resposta do Asaas fica num arquivo 0600 temporário removido ao sair.
#
# Uso:  sudo bash asaas-chaves.sh                 # simulação: mostra caminhos, dono, rótulos já guardados (só nomes)
#       sudo bash asaas-chaves.sh --executar      # pede rótulo + chave, confere, grava
#       sudo bash asaas-chaves.sh --listar        # só os rótulos guardados, com dono/permissão (nunca o conteúdo)
#       [--dash-config /srv/dshow-shared/dash/config] [--dash-user www-data]
# Chave de homologação ($aact_hmlg_…) é recusada, a menos que se passe --sandbox (aí a conferência vai ao sandbox do Asaas).
# Teste com stubs: teste-asaas-chaves.sh (ASAAS_CHAVES_TESTE=1, só com pasta de teste em /srv/dshow-work — nunca em produção).
# =====================================================================================================================================
set -euo pipefail
set +x
umask 077
unset HISTFILE 2>/dev/null || true
RE_CHAVE='^\$aact_[A-Za-z0-9_$:=+/.-]{20,400}$'

DASH_CONFIG="/srv/dshow-shared/dash/config"; DASH_USER=""; EXEC=0; LISTAR=0; SANDBOX=0
BK_BASE="/backup/_restrito"
CURL="/usr/bin/curl"
URL_PROD="https://api.asaas.com/v3/myAccount/commercialInfo"
URL_SANDBOX="https://api-sandbox.asaas.com/v3/myAccount/commercialInfo"
TESTE="${ASAAS_CHAVES_TESTE:-0}"

while [ $# -gt 0 ]; do case "$1" in
  --dash-config) DASH_CONFIG="${2:?}"; shift 2;; --dash-user) DASH_USER="${2:?}"; shift 2;;
  --executar) EXEC=1; shift;; --dry-run) EXEC=0; shift;; --listar) LISTAR=1; shift;; --sandbox) SANDBOX=1; shift;;
  -h|--help) sed -n '2,27p' "$0"; exit 0;;
  *) case "$1" in *aact*|\$*) echo "[ERRO] parece uma CHAVE na linha de comando — recusada e não exibida. Ela pode ter ficado no histórico do shell: apague-o (history -d) e, por segurança, gere outra chave no Asaas.";;
       *) echo "[ERRO] argumento desconhecido (não exibido). Opções: --executar --listar --sandbox --dash-config --dash-user";; esac; exit 2;; esac; done

# ---- modo de teste: só com pasta de teste criada por mktemp em /srv/dshow-work (o teste confere); nunca em produção ----
if [ "$TESTE" = 1 ]; then
  case "$DASH_CONFIG" in /srv/dshow-work/asaas-teste.??????/config) ;; *) echo "[ERRO] modo de teste só com --dash-config em /srv/dshow-work/asaas-teste.XXXXXX/config"; exit 2;; esac
  BK_BASE="$(dirname "$DASH_CONFIG")/backup"; CURL="curl"   # o curl falso do teste vem pelo PATH
  [ -n "$DASH_USER" ] || DASH_USER="$(id -un)"
  [ -n "${ASAAS_URL_TESTE:-}" ] && URL_PROD="$ASAAS_URL_TESTE" && URL_SANDBOX="$ASAAS_URL_TESTE"
else
  [ "$(id -u)" = "0" ] || { echo "[ERRO] rode como root (sudo)"; exit 2; }
  [ "$DASH_CONFIG" = "/srv/dshow-shared/dash/config" ] || echo "[AVISO] --dash-config fora do padrão: $DASH_CONFIG"
fi

[ -d "$DASH_CONFIG" ] && [ ! -L "$DASH_CONFIG" ] || { echo "[ERRO] pasta de config compartilhada não encontrada (ou é link): $DASH_CONFIG"; exit 2; }
if [ -z "$DASH_USER" ]; then
  DASH_USER="$(ps -o user= -C php-fpm8.3 2>/dev/null | grep -v '^root$' | sort | uniq -c | sort -rn | awk 'NR==1{print $2}')"
  [ -n "$DASH_USER" ] || DASH_USER="www-data"
fi
id "$DASH_USER" >/dev/null 2>&1 || { echo "[ERRO] usuário do php-fpm não existe: $DASH_USER (use --dash-user)"; exit 2; }
DIR="$DASH_CONFIG/asaas"
[ ! -L "$DIR" ] || { echo "[ERRO] $DIR é link simbólico — recusado"; exit 2; }

listar() {
  if [ -d "$DIR" ]; then
    local n=0 f
    for f in "$DIR"/*.key; do [ -e "$f" ] || continue; n=$((n+1))
      printf '       %-28s %s%s\n' "$(basename "$f" .key)" "$(stat -c '%U:%G %a' "$f")" "$([ -f "${f%.key}.id" ] && echo ' · identidade presa' || echo ' · SEM identidade')"; done
    [ "$n" -gt 0 ] || echo "       (nenhuma chave guardada)"
    echo "       pasta: $(stat -c '%U:%G %a' "$DIR")"
  else echo "       (pasta $DIR ainda não existe)"; fi
}

echo "== asaas-chaves · pasta=$DIR · dono=$DASH_USER · executar=$EXEC$([ "$SANDBOX" = 1 ] && echo ' · SANDBOX')"
echo "       rótulos já guardados (só nomes):"; listar
[ "$LISTAR" = 1 ] && exit 0
if [ "$EXEC" = 0 ]; then
  echo "[DRY]  com --executar: pediria rótulo + chave (read -s, 2x), conferiria com 1 GET ao Asaas (só o nome da conta aparece),"
  echo "       pediria sua confirmação e gravaria $DIR/<rótulo>.key (0600, $DASH_USER). Antiga → $BK_BASE/<ts>-asaas-chaves/ + revert-all.sh"
  exit 0
fi
if [ "$TESTE" != 1 ]; then [ -t 0 ] || { echo "[ERRO] rode num terminal interativo (a chave é digitada com read -s)"; exit 2; }; fi

# ---- temporário próprio (resposta do Asaas), removido ao sair ----
TMPD="$(mktemp -d "${TMPDIR:-/tmp}/asaas-chaves.XXXXXX")" || { echo "[ERRO] mktemp falhou"; exit 2; }
case "$TMPD" in */asaas-chaves.??????) ;; *) echo "[ERRO] temporário inesperado"; exit 2;; esac
[ -d "$TMPD" ] || { echo "[ERRO] temporário não criado"; exit 2; }
limpar() { unset CH CH2 2>/dev/null || true; if [ -n "${TMPD:-}" ] && [ -d "$TMPD" ]; then case "$TMPD" in */asaas-chaves.??????) rm -f -- "$TMPD"/resp "$TMPD"/nome; rmdir -- "$TMPD";; esac; fi; }
trap limpar EXIT; trap 'echo; echo "[ERRO] interrompido — o que já tinha [OK] ficou gravado; o resto não"; exit 130' INT TERM

# ---- pasta das chaves: 0700, dono do php-fpm, SEM ACL (a config tem ACL de leitura para agentes) ----
if [ ! -d "$DIR" ]; then
  install -d -m 0700 -o "$DASH_USER" -g "$DASH_USER" "$DIR"; echo "[OK]   pasta criada: $DIR (0700, $DASH_USER)"
fi
command -v setfacl >/dev/null 2>&1 && setfacl -b "$DIR" 2>/dev/null || true
[ "$(stat -c '%U %a' "$DIR")" = "$DASH_USER 700" ] || { echo "[ERRO] $DIR precisa ser $DASH_USER 0700 (está $(stat -c '%U %a' "$DIR"))"; exit 1; }

TS="$(date +%Y%m%d-%H%M%S)"; BK="$BK_BASE/${TS}-asaas-chaves"; BK_CRIADO=0
preparar_backup() {
  [ "$BK_CRIADO" = 1 ] && return 0
  install -d -m 0700 "$BK"
  printf '#!/usr/bin/env bash\n# reverte as chaves do Asaas gravadas em %s: MOVE as novas para cá e devolve as antigas. Nada é apagado.\nset -euo pipefail\n' "$TS" > "$BK/revert-all.sh"
  chmod 0700 "$BK/revert-all.sh"; BK_CRIADO=1
}

# conferência: 1 GET; a chave vai pelo stdin do curl (config), nunca pela linha de comando. Devolve o código HTTP em $HTTP.
conferir() {
  local url="$1"; HTTP="000"
  HTTP="$(printf 'url = "%s"\nheader = "access_token: %s"\nheader = "User-Agent: dshow-asaas-leitura/1"\nheader = "Accept: application/json"\n' "$url" "$CH" \
          | "$CURL" --silent --show-error --max-time 20 --request GET --config - --output "$TMPD/resp" --write-out '%{http_code}' 2>/dev/null)" || true
  [ -n "$HTTP" ] || HTTP="000"
}

FEITOS=" "
while :; do
  echo
  IFS= read -r -p "Rótulo da empresa (minúsculas, números e -; ex.: dshow) [vazio = terminar]: " ROT || ROT=""
  [ -n "$ROT" ] || break
  [[ "$ROT" =~ ^[a-z0-9][a-z0-9-]{1,31}$ ]] || { echo "[ERRO] rótulo inválido: use 2 a 32 caracteres a-z, 0-9 e -, começando por letra ou número"; continue; }
  case "$FEITOS" in *" $ROT "*) echo "[ERRO] o rótulo $ROT já foi tratado nesta execução"; continue;; esac
  ALVO="$DIR/$ROT.key"
  if [ -e "$ALVO" ]; then
    IFS= read -r -p "Já existe chave para '$ROT'. Substituir? (a antiga vai para o backup) [s/N]: " R || R=""
    [ "$R" = s ] || [ "$R" = S ] || { echo "       mantida a chave existente de $ROT"; continue; }
  fi

  IFS= read -r -s -p "Chave do Asaas de '$ROT' (não aparece na tela): " CH || CH=""; echo
  IFS= read -r -s -p "Digite de novo para conferir: " CH2 || CH2=""; echo
  if [ "$CH" != "$CH2" ]; then unset CH CH2; echo "[ERRO] os dois valores diferem — nada foi gravado para $ROT"; continue; fi
  unset CH2
  # formato: começa com $aact_; sem espaço, aspas ou barra invertida (não quebra a conferência nem o arquivo)
  if ! [[ "$CH" =~ $RE_CHAVE ]]; then unset CH; echo "[ERRO] isso não parece uma chave do Asaas (deve começar com \$aact_) — nada foi gravado"; continue; fi
  URL="$URL_PROD"; AMB="produção"
  if [[ "$CH" == '$aact_hmlg_'* ]]; then
    if [ "$SANDBOX" = 1 ]; then URL="$URL_SANDBOX"; AMB="sandbox"
    else unset CH; echo "[ERRO] chave de HOMOLOGAÇÃO (sandbox) — recusada sem --sandbox; nada foi gravado"; continue; fi
  elif [ "$SANDBOX" = 1 ]; then unset CH; echo "[ERRO] --sandbox ligado mas a chave é de produção — nada foi gravado"; continue
  fi
  # a mesma chave não pode servir a dois rótulos
  DUP=""
  for f in "$DIR"/*.key; do [ -e "$f" ] || continue; [ "$f" = "$ALVO" ] && continue
    if [ "$(tr -d '\n' < "$f")" = "$CH" ]; then DUP="$(basename "$f" .key)"; break; fi; done
  if [ -n "$DUP" ]; then unset CH; echo "[ERRO] esta chave já está guardada no rótulo '$DUP' — nada foi gravado"; continue; fi

  echo "       conferindo no Asaas ($AMB), 1 consulta GET…"
  rm -f -- "$TMPD/resp"; conferir "$URL"
  case "$HTTP" in
    200) ;;
    401) unset CH; echo "[ERRO] o Asaas recusou a chave (401) — confira se copiou a chave inteira; nada foi gravado"; continue;;
    403) unset CH; echo "[ERRO] o Asaas negou o acesso (403; lista de IPs ligada na conta?) — nada foi gravado"; continue;;
    429) unset CH; echo "[ERRO] limite de consultas do Asaas (429) — espere alguns minutos e tente de novo; nada foi gravado"; continue;;
    000) unset CH; echo "[ERRO] sem resposta do Asaas (rede/tempo esgotado) — nada foi gravado"; continue;;
    *)   unset CH; echo "[ERRO] o Asaas respondeu $HTTP — nada foi gravado"; continue;;
  esac
  # só o nome da conta é exibido. Codex DSHOW-111 (B2): a identidade estável da conta = sha256 dos dígitos do cpfCnpj, calculada em memória
  # (o número NUNCA é exibido nem gravado); o rótulo fica PRESO a ela.
  SAIDA="$(python3 -I -c 'import json,sys,hashlib,re
try:
  d=json.load(open(sys.argv[1],encoding="utf-8"))
  n=(d.get("companyName") or d.get("name") or "").strip()
  doc=re.sub(r"\D","",str(d.get("cpfCnpj") or ""))
  h=hashlib.sha256(doc.encode()).hexdigest() if len(doc) in (11,14) else ""
  print("".join(c for c in n if c.isprintable())[:120]); print(h)
except Exception: print(""); print("")' "$TMPD/resp" 2>/dev/null || true)"
  rm -f -- "$TMPD/resp"
  NOME="$(printf '%s\n' "$SAIDA" | sed -n 1p)"; IDENT="$(printf '%s\n' "$SAIDA" | sed -n 2p)"; unset SAIDA
  if [ -z "$NOME" ]; then unset CH; echo "[ERRO] o Asaas respondeu 200 mas sem nome de conta — nada foi gravado"; continue; fi
  if ! [[ "$IDENT" =~ ^[0-9a-f]{64}$ ]]; then unset CH; echo "[ERRO] o Asaas não devolveu o CPF/CNPJ da conta (identidade) — nada foi gravado"; continue; fi
  if [ -e "$ALVO" ]; then
    ANTIGA="$( [ -f "$DIR/$ROT.id" ] && tr -d '\n' < "$DIR/$ROT.id" || true)"
    if [ "$ANTIGA" != "$IDENT" ]; then unset CH; echo "[ERRO] esta chave é de OUTRA conta/empresa (identidade diferente da presa a '$ROT') — recusada; nada foi gravado"; continue; fi
  fi
  OUTRO=""
  for f in "$DIR"/*.id; do [ -e "$f" ] || continue; [ "$f" = "$DIR/$ROT.id" ] && continue
    if [ "$(tr -d '\n' < "$f")" = "$IDENT" ]; then OUTRO="$(basename "$f" .id)"; break; fi; done
  if [ -n "$OUTRO" ]; then unset CH; echo "[ERRO] esta conta já está presa ao rótulo '$OUTRO' (uma conta por empresa) — nada foi gravado"; continue; fi
  echo "       conta no Asaas: $NOME"
  IFS= read -r -p "É a conta da empresa '$ROT'? [s/N]: " R || R=""
  if ! { [ "$R" = s ] || [ "$R" = S ]; }; then unset CH; echo "       nada foi gravado para $ROT"; continue; fi

  # gravação: backup da antiga (MOVIDA) → arquivo novo atômico (temporário na mesma pasta + mv)
  preparar_backup
  for ext in key id; do
    A="$DIR/$ROT.$ext"
    if [ -e "$A" ]; then
      mv -- "$A" "$BK/$ROT.$ext.antiga"
      printf "mv -- '%s' '%s'\nmv -- '%s' '%s'\n" "$A" "$BK/$ROT.$ext.novo-revertido" "$BK/$ROT.$ext.antiga" "$A" >> "$BK/revert-all.sh"
    else
      printf "[ -e '%s' ] && mv -- '%s' '%s' || true\n" "$A" "$A" "$BK/$ROT.$ext.novo-revertido" >> "$BK/revert-all.sh"
    fi
  done
  [ -e "$BK/$ROT.key.antiga" ] && echo "[OK]   chave antiga de $ROT movida para $BK/"
  NID="$(mktemp "$DIR/.novo.XXXXXX")"; printf '%s\n' "$IDENT" > "$NID"; chown "$DASH_USER:$DASH_USER" "$NID"; chmod 0600 "$NID"; mv -- "$NID" "$DIR/$ROT.id"
  NOVO="$(mktemp "$DIR/.novo.XXXXXX")"
  printf '%s\n' "$CH" > "$NOVO"; unset CH
  chown "$DASH_USER:$DASH_USER" "$NOVO"; chmod 0600 "$NOVO"
  mv -- "$NOVO" "$ALVO"
  command -v setfacl >/dev/null 2>&1 && setfacl -b "$ALVO" 2>/dev/null || true
  [ "$(stat -c '%U %a' "$ALVO")" = "$DASH_USER 600" ] || { echo "[ERRO] permissão inesperada em $ALVO — rode $BK/revert-all.sh"; exit 1; }
  echo "[OK]   chave de '$ROT' ($NOME, $AMB) guardada em $ALVO (0600, $DASH_USER) — valor NÃO exibido"
  FEITOS="$FEITOS$ROT "
  IFS= read -r -p "Guardar outra conta? [s/N]: " R || R=""
  [ "$R" = s ] || [ "$R" = S ] || break
done

echo
echo "== resultado"; listar
if [ "$BK_CRIADO" = 1 ]; then echo "       reversão desta execução: sudo bash $BK/revert-all.sh"; else echo "       nada foi gravado nesta execução"; fi
