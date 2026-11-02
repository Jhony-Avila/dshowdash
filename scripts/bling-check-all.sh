#!/usr/bin/env bash
# scripts/bling-check-all.sh — roda TODAS as provas do módulo Bling
# @version 1.0.0  @created 2026-07-30
#
#     bash scripts/bling-check-all.sh
#
# Só ORQUESTRA. Não reimplementa verificação nenhuma — se uma suíte mudar, este
# arquivo não muda. Mesmo padrão do scripts/check-all.sh do projeto.
#
# As cinco cobrem camadas diferentes DE PROPÓSITO. Cada uma já pegou defeito que
# as outras não pegariam:
#
#   1 dados/contratos (PHP)     divergência entre telas, coerência dos números
#   2 bundle (node)             entry sem App — `vite build` não avisa
#   3 mecânica Fase 4 (PHP)     UNIQUE com NULL duplicando produto a cada sync
#   4 rotas (curl, anônimo)     webhook aceitando entrega sem assinatura
#   5 navegador (playwright)    checklist hardcoded dizendo "não" com 38 tabelas
#   6 homologação com VOLUME    título quitado virando vencido; canal nunca gravado
#
# A 6 é a mais lenta (~40s): carrega o grafo inteiro pelo pipeline real e compara
# as 52 telas nos dois provedores. É ela que pega o que só aparece com volume.
#
# ⚠️ bash, não zsh: `curl $VAR` com espaços quebra por word-splitting no zsh.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
export PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright

falhas=0
resumo=()

rodar() {
  local nome="$1"; shift
  printf "\n\033[1m══ %s\033[0m\n" "$nome"
  local saida rc
  saida=$("$@" 2>&1); rc=$?
  # Só a última linha útil no resumo; a saída completa fica visível acima.
  echo "$saida" | tail -30
  if [[ $rc -eq 0 ]]; then
    resumo+=("  \033[32m✔\033[0m $nome")
  else
    resumo+=("  \033[31m✘\033[0m $nome (exit $rc)")
    falhas=$((falhas+1))
  fi
}

rodar "1/6 dados e contratos"      php scripts/bling-smoke-all.php
rodar "2/6 bundle do painel"       node scripts/bling-smoke-bundle.mjs
rodar "3/6 mecânica de go-live"    php scripts/bling-fase4-golive.php
rodar "4/6 rotas HTTP (anônimo)"   bash scripts/bling-fase4-rotas.sh
rodar "5/6 navegador autenticado"  node tools/screenshot/valida-bling-fase4.mjs
rodar "6/6 homologação (volume)"  php scripts/bling-fase5-homologacao.php

printf "\n%s\n" "════════════════════════════════════════════════════════════════"
for l in "${resumo[@]}"; do printf "%b\n" "$l"; done
printf "\n"
if [[ $falhas -eq 0 ]]; then
  printf "  \033[32mtodas as 6 suítes passaram\033[0m\n\n"
  exit 0
fi
printf "  \033[31m%d suíte(s) falharam\033[0m\n\n" "$falhas"
exit 1
