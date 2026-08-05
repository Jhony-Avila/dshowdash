# Status do Projeto — Avatar Studio (no repo)

> Atualizado a cada lote. Fonte viva: docs do projeto Claude "Avatar Studio"
> (04-status-do-projeto). Última atualização: **2026-08-05, onda 231–260**.

## Marco atual

- **230 megas EM PRODUÇÃO** (deploy `8c5c847 → 00782ac`, 2026-08-05 17:43).
- **Onda 231–260 PRONTA nesta árvore** (30 megas, 4 commits temáticos):
  231–240 PALCO v2 (§160–§172) · 241–250 PROGRESSÃO v2 (§207–§231) ·
  251–260 CRIAÇÃO AVANÇADA + Photo PRO restante (§102–§119/§349/§361–§369)
  · consolidação (gate #54, baselines, docs).
- Suíte: **51 arquivos** (4 novos: palco-v2, progressao-v2, criacao-v2 +
  os 47 anteriores) + nucleo.test.
- Byte-stability VERIFICADA mecanicamente 2× nesta onda (renderAvatar com
  configs legados; wrapper §102/§118 só entra com campo presente).
- Flags novas (padrão ON, #50): `as5.palco_v2`, `as5.progressao_v2`,
  `as5.criacao_avancada`. Campos `corpo`/`postura`: PHP espelhado.

## Como retomar (sessão nova)

1. Clonar; ler `claude/*.md`. 2. Briefing: `git show 006a394b:docs/BRF_AVATAR_STUDIO.md`.
3. Infra de testes no `claude/contexto-geral.md` (harness da Home exige build
   do panel-dashboard). 4. Rota de push: dry-run; 403 → bloco SSH (comprovado 2×).
5. Próxima onda: mega **261+**; decisões a partir de **#55**; sequência
   sugerida em `claude/mapa-lacunas.md`.

## Pendências (Jhony)

Validação visual 221–230 e 231–260 · investigar webhook do push 73df462
(Recent Deliveries; rotacionar secret) · chave IA · zip UBC · rotação PAT ·
nexatechs.com.br · trilho C.
