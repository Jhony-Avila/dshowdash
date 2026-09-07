#!/usr/bin/env bash
# scripts/golden/preflight-git.sh — GUARDA DE SEGURANCA GIT (Golden, decisao A+ §30/§31)
#
# POR QUE: nesta fase o trabalho Golden vive SO em golden/art-wip (candidata).
# main = PRODUCAO e e IMUTAVEL. Ja houve um incidente em que um "reset --hard"
# foi disparado com HEAD em main. Este preflight torna esse erro impossivel de
# passar silenciosamente: qualquer operacao destrutiva (reset/rebase/cherry-pick/
# am/push/branch -f/checkout -B) DEVE chamar este guarda ANTES e abortar se o
# contexto nao for exatamente o esperado.
#
# CONTRATO (§30):
#   - branch corrente TEM de ser golden/art-wip (salvo GOLDEN_ALLOW_BRANCH explicito)
#   - main NUNCA pode ser o alvo/branch corrente de uma operacao destrutiva
#   - opcionalmente, o SHA de HEAD tem de bater com o esperado (arg 2 / GOLDEN_EXPECT_SHA)
#
# USO:
#   scripts/golden/preflight-git.sh <op> [expected_sha_prefix]
#     <op>            rotulo da operacao (ex.: push, reset, am) — so p/ log
#     expected_sha    (opcional) prefixo do SHA que HEAD deve ter agora
#
#   Retorno 0 = seguro prosseguir; !=0 = ABORTAR (nao execute a operacao).
#
# EXEMPLO (bloco de servidor, && estrito):
#   scripts/golden/preflight-git.sh push 06ef6239 \
#     && git push -f origin HEAD:refs/heads/golden/art-wip
#
# ENV:
#   GOLDEN_ALLOW_BRANCH   sobrepoe a branch exigida (default: golden/art-wip)
#   GOLDEN_EXPECT_SHA     alternativa ao arg 2
#   GOLDEN_PROTECT        branches que NUNCA podem ser alvo (default: "main master")

set -euo pipefail

OP="${1:-<sem-op>}"
EXPECT_SHA="${2:-${GOLDEN_EXPECT_SHA:-}}"
WANT_BRANCH="${GOLDEN_ALLOW_BRANCH:-golden/art-wip}"
PROTECT="${GOLDEN_PROTECT:-main master}"

die() { echo "PREFLIGHT_ABORT op=$OP :: $*" >&2; exit 3; }

# 1) tem de ser um repo git
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "nao e um repositorio git"

# 2) branch corrente
CUR="$(git branch --show-current 2>/dev/null || true)"
[ -n "$CUR" ] || die "HEAD destacado (detached) — recuse-se a operar sem branch nomeada"

# 3) branch corrente nunca pode ser protegida
for p in $PROTECT; do
  [ "$CUR" = "$p" ] && die "branch corrente e PROTEGIDA ($p) — jamais operar destrutivo aqui"
done

# 4) branch corrente tem de ser a permitida
[ "$CUR" = "$WANT_BRANCH" ] || die "branch corrente=$CUR mas o exigido e $WANT_BRANCH"

# 5) SHA esperado (se fornecido)
if [ -n "$EXPECT_SHA" ]; then
  HEAD_SHA="$(git rev-parse HEAD)"
  case "$HEAD_SHA" in
    "$EXPECT_SHA"*) : ;;
    *) die "HEAD=$HEAD_SHA nao comeca com o esperado $EXPECT_SHA" ;;
  esac
fi

# 6) prova extra: main local NAO pode ter sido movido a frente de origin/main
#    (defende contra o incidente exato: main puxado p/ o tip da golden).
if git show-ref --verify --quiet refs/heads/main && git show-ref --verify --quiet refs/remotes/origin/main; then
  AHEAD="$(git rev-list --count origin/main..main 2>/dev/null || echo 0)"
  [ "$AHEAD" = "0" ] || die "main local esta $AHEAD commit(s) A FRENTE de origin/main — main deve permanecer IMUTAVEL (=origin/main). Conserte antes: git branch -f main origin/main"
fi

echo "PREFLIGHT_OK op=$OP branch=$CUR head=$(git rev-parse --short HEAD)${EXPECT_SHA:+ (== $EXPECT_SHA)}"
exit 0
