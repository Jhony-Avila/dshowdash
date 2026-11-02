#!/usr/bin/env bash
# scripts/bling-fase4-rotas.sh — prova HTTP das rotas de OAuth e webhook
# @version 1.0.0  @created 2026-07-30
#
#     bash scripts/bling-fase4-rotas.sh
#
# POR QUE ESTE TESTE EXISTE SEPARADO DO PHP
# `bling-fase4-golive.php` prova a MECÂNICA (cifra, token, fila, sync). Não
# prova o ROTEAMENTO: se o webhook está antes do gate de sessão, se o callback
# redireciona em vez de responder JSON, se o resto continua exigindo sessão.
# Esse tipo de erro só aparece atravessando o nginx + PHP-FPM de verdade.
#
# ⚠️ --resolve aponta para 127.0.0.1: o teste tem que bater na ORIGEM.
# Passando pela borda do Cloudflare, uma resposta poderia vir de cache e o
# teste validaria o que estava lá ontem.
#
# ⚠️ Shell é zsh neste servidor, mas este script é bash de propósito:
# `curl $VAR` com espaços quebra em zsh por word-splitting.
set -uo pipefail

ALVO="https://dshowdash.com.br"
CURL=(curl -sk --resolve dshowdash.com.br:443:127.0.0.1)

passou=0; falhou=0; erros=()

ok() {
  local nome="$1" cond="$2" det="${3:-}"
  if [[ "$cond" == "1" ]]; then
    passou=$((passou+1)); printf "  \033[32m✔\033[0m %s%s\n" "$nome" "${det:+  ($det)}"
  else
    falhou=$((falhou+1)); erros+=("$nome${det:+ — $det}")
    printf "  \033[31m✘\033[0m %s%s\n" "$nome" "${det:+  ($det)}"
  fi
}
secao() { printf "\n\033[1m%s\033[0m\n" "$1"; }

codigo() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$@"; }

# ══════════════════════════════════════════════════════════════
secao "1. Webhook — sem sessão, sem CSRF (é o Bling que chama)"

# O ponto central: o Bling não tem cookie. Se esta rota exigisse sessão,
# NENHUM webhook seria entregue — e a falha seria silenciosa, porque o Bling
# simplesmente pararia de reenviar depois de algumas tentativas.
c=$(codigo -X POST -H 'Content-Type: application/json' \
     -d '{"event":"teste","data":{"id":"1"}}' "$ALVO/api/bling/webhooks")
[[ "$c" != "401" && "$c" != "403" ]] && r=1 || r=0
ok "webhook NÃO exige sessão" "$r" "HTTP $c"

# Sem assinatura válida tem que RECUSAR. Aceitar seria deixar qualquer um
# injetar evento e disparar sincronização à vontade.
[[ "$c" == "400" || "$c" == "401" ]] && r=1 || r=0
ok "webhook recusa entrega sem assinatura válida" "$r" "HTTP $c"

c=$(codigo -X GET "$ALVO/api/bling/webhooks")
[[ "$c" == "405" ]] && r=1 || r=0
ok "webhook só aceita POST" "$r" "GET -> HTTP $c"

# Corpo enorme não pode ser lido inteiro na memória antes de recusar.
# Via ARQUIVO: 2 MB como argumento estoura o limite do execve.
tmp=$(mktemp); head -c 2000000 /dev/zero | tr '\0' 'x' > "$tmp"
c=$(codigo -X POST -H 'Content-Type: application/json' \
     --data-binary "@$tmp" "$ALVO/api/bling/webhooks")
rm -f "$tmp"
[[ "$c" == "413" || "$c" == "400" ]] && r=1 || r=0
ok "corpo grande demais é recusado" "$r" "2 MB -> HTTP $c"

# Resposta não pode vazar detalhe interno.
corpo=$("${CURL[@]}" -X POST -H 'Content-Type: application/json' \
        -d '{"event":"teste"}' "$ALVO/api/bling/webhooks")
if echo "$corpo" | grep -qiE '/var/www|BlingWebhook|stack|\.php:[0-9]'; then r=0; else r=1; fi
ok "resposta não vaza caminho nem stack" "$r" "$(echo "$corpo" | head -c 60)"

# ══════════════════════════════════════════════════════════════
secao "2. OAuth — o resto continua protegido"

c=$(codigo -X POST -H 'Content-Type: application/json' -d '{}' "$ALVO/api/bling/oauth/connect")
[[ "$c" == "401" || "$c" == "403" ]] && r=1 || r=0
ok "/oauth/connect EXIGE sessão" "$r" "HTTP $c"

c=$(codigo -X POST -H 'Content-Type: application/json' \
     -d '{"account_id":1}' "$ALVO/api/bling/oauth/disconnect")
[[ "$c" == "401" || "$c" == "403" ]] && r=1 || r=0
ok "/oauth/disconnect EXIGE sessão" "$r" "HTTP $c"

# O callback NÃO pode responder 401 em JSON: quem chega é uma janela de
# navegador vinda do bling.com.br. Sem state válido ele redireciona com erro.
resp=$("${CURL[@]}" -o /dev/null -w '%{http_code} %{redirect_url}' \
       "$ALVO/api/bling/oauth/callback?code=x&state=forjado")
c="${resp%% *}"; destino="${resp#* }"
[[ "$c" == "302" ]] && r=1 || r=0
ok "/oauth/callback REDIRECIONA, não responde JSON" "$r" "HTTP $c"

# E o redirect tem que ser interno. Redirect aberto aqui seria phishing pronto.
if [[ "$destino" == /* || "$destino" == "$ALVO"* || -z "$destino" ]]; then r=1; else r=0; fi
ok "redirect do callback é interno" "$r" "${destino:-(vazio)}"

# State forjado não pode conectar coisa nenhuma.
if [[ "$destino" == *"bling_resultado=erro"* || "$destino" == *"bling_resultado=negado"* ]]; then r=1; else r=0; fi
ok "state forjado resulta em erro, não em conexão" "$r"

# ══════════════════════════════════════════════════════════════
secao "3. Nada mais afrouxou"

for rota in "" "status" "settings" "accounts" "header/summary" "sync"; do
  c=$(codigo "$ALVO/api/bling/$rota")
  [[ "$c" == "401" || "$c" == "403" ]] && r=1 || r=0
  ok "GET /${rota:-(raiz)} segue exigindo sessão" "$r" "HTTP $c"
done

c=$(codigo -X POST "$ALVO/api/bling/sync/run")
[[ "$c" == "401" || "$c" == "403" ]] && r=1 || r=0
ok "POST /sync/run segue exigindo sessão" "$r" "HTTP $c"

c=$(codigo -X DELETE "$ALVO/api/bling/status")
[[ "$c" == "401" || "$c" == "403" || "$c" == "405" ]] && r=1 || r=0
ok "método não previsto é recusado" "$r" "DELETE -> HTTP $c"

# ══════════════════════════════════════════════════════════════
secao "4. Internals não são executáveis por HTTP"

# `public/api` é symlink para a árvore de fonte: cada arquivo do módulo é
# alcançável. O guarda BLING_ENTRADA é o que impede executá-los fora do
# roteador — onde moram o gate, o CSRF e o envelope.
for arq in "lib/BlingCrypto.php" "lib/BlingOAuth.php" "_init.php" \
           "repositories/BlingRepository.php" "services/BlingSyncService.php" \
           "controllers/OAuthController.php"; do
  corpo=$("${CURL[@]}" "$ALVO/api/bling/$arq")
  c=$(codigo "$ALVO/api/bling/$arq")
  # Não pode devolver 200 com conteúdo útil, nem vazar erro de PHP.
  if [[ "$c" == "200" ]] || echo "$corpo" | grep -qiE 'Fatal error|class Bling|<\?php'; then
    r=0
  else
    r=1
  fi
  ok "$arq não executa fora do roteador" "$r" "HTTP $c"
done

# ══════════════════════════════════════════════════════════════
# As entregas recusadas ficam registradas de propósito — em produção são a
# trilha de tentativas não autenticadas. Mas as DESTE teste são lixo, e sem
# limpeza a tabela ganha duas linhas a cada execução.
#
# ⚠️ heredoc, não `php -r`: dentro de `php -r` o `__DIR__` é o diretório ATUAL,
# não o do script, e o .env não era encontrado — a limpeza falhava em silêncio
# porque o catch engolia tudo.
php <<'LIMPEZA' 2>/dev/null
<?php
$env = [];
foreach (file('/var/www/dshowdash/.env') as $l) {
    $l = trim($l);
    if ($l === '' || $l[0] === '#' || !str_contains($l, '=')) continue;
    [$k, $v] = explode('=', $l, 2);
    $env[trim($k)] = trim($v, " \t\"'");
}
try {
    $pdo = new PDO(
        "mysql:host={$env['DB_BLING_HOST']};port={$env['DB_BLING_PORT']};dbname={$env['DB_BLING_NAME']};charset=utf8mb4",
        $env['DB_BLING_USER'], $env['DB_BLING_PASS'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    // Só o evento literal "teste", só sem conta, só da última hora:
    // nunca toca entrega real.
    $pdo->exec("DELETE FROM bling_webhook_events
                 WHERE evento = 'teste' AND account_id IS NULL
                   AND recebido_em >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR)");
} catch (Throwable $e) {
    fwrite(STDERR, "aviso: nao consegui limpar os eventos de teste: " . $e->getMessage() . "\n");
}
LIMPEZA

printf "\n%s\n" "────────────────────────────────────────────────────────────────"
if [[ $falhou -eq 0 ]]; then
  printf "  \033[1m%d passaram\033[0m · \033[32m0 falharam\033[0m\n\n" "$passou"
  exit 0
fi
printf "  \033[1m%d passaram\033[0m · \033[31m%d falharam\033[0m\n\n  Falhas:\n" "$passou" "$falhou"
for e in "${erros[@]}"; do printf "   • %s\n" "$e"; done
printf "\n"
exit 1
