# ADR-005 · Estratégia de workspaces

**Status**: PENDENTE · **Prazo**: M4

## Contexto
Builds distribuídos por múltiplas configurações: root Vite 7, áreas internas Vite 5
(ex.: `public/components/panels/panel-avatar-studio` builda com cwd próprio), plugins
React divergentes, versões patch diferentes de React, Sharp divergente. `package.json`
raiz sem script de teste; sem workspaces declarados.

## Opções
1. **npm workspaces no monorepo** (root orquestra; cada painel/módulo é workspace).
   Vantagens: instalação única, versões alinháveis, scripts canônicos (§1616). Riscos: migração de builds existentes; hoisting pode quebrar builds que dependem de layout atual de node_modules.
2. **Manter builds independentes + alinhamento manual de versões** com verificação no CI.
   Vantagens: menor mudança imediata. Riscos: divergência volta a crescer; instalação não reproduzível como um todo.
3. **pnpm workspaces**.
   Vantagens: isolamento rigoroso, velocidade. Riscos: troca de package manager no meio do programa (contra "menor movimento" antes da reprodutibilidade).

## Decisão provisória
Opção 1 como alvo (npm já é o gerenciador do projeto), executada no M4 depois que o M2
inventariar todos os builds existentes. Até lá: nenhuma dependência nova com versão
divergente (M0, item 7).

## Evidência necessária
Inventário de todos os package.json/vite.config do repo e servidor; matriz de versões;
build de cada área verde antes e depois da adoção de workspaces.
