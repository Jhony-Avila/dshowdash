# Elevação Basal — 05 · Log de Decisões

> Decisões do programa Elevação Basal, numeradas EB-#. ADRs formais em `adr/`.
> Decisões do fluxo Avatar Studio continuam em `claude/decisoes.md` (fluxos separados).

| # | Data | Decisão | Base |
|---|---|---|---|
| EB-001 | 2026-08-10 | Programa Elevação Basal iniciado a partir do briefing `Revisao_Dshowdash_01.md` (19 partes). Execução por mega ondas de lotes, seguindo o caminho crítico M0→M15 da Parte 18 | Briefing Partes 1 e 18 |
| EB-002 | 2026-08-10 | Baseline do programa fixado no commit `86467a1a` (tag `basal-baseline-2026-08-10`) | Parte 1 §26.3/§27 |
| EB-003 | 2026-08-10 | **M0 em vigor** — congelamento da dívida nova (política no doc 07). Vale para todos os fluxos, inclusive Avatar Studio | Parte 18 §1594 |
| EB-004 | 2026-08-10 | Docs do programa em `docs/ELEVACAO-BASAL/` (nomes adaptados ao padrão do projeto, conteúdo conforme §28); scripts em `scripts/basal/` | Parte 1 §28 |
| EB-005 | 2026-08-10 | Evidências do servidor coletadas por script read-only versionado, com saída commitada em `evidencias/`; proibido incluir segredos | Parte 1 §27/§33 |
| EB-006 | 2026-08-10 | Interpretação provisória das fontes da verdade adotada (doc 01 §3); não autoriza exclusões | Parte 1 §16 |
| EB-007 | 2026-08-10 | Dez ADRs pendentes abertos (adr/ADR-001..010) com decisão provisória explícita — nenhum finge decisão tomada | Parte 1 §29 |
| EB-008 | 2026-08-10 | **Módulo Pipedrive + Google Analytics permanecem no `main`** (merge `e7b54fb7`, 429 arquivos). O merge foi concluído acidentalmente pelo commit de evidências da Onda 1 (worktree de produção estava em `feat/pipedrive-modulo-completo` com MERGE_HEAD pendente), mas ficou decidido mantê-lo: a produção já rodava esse conteúdo (o deploy faz merge de origin/main NA branch), o trabalho é autocontido (zero migrations SQL, segredos via getenv), e desfazer recriaria a divergência fonte≠runtime. Confirmado pelo sponsor | Análise do diff 867cc151..e7b54fb7 |
| EB-009 | 2026-08-10 | O modelo "produção acompanha branch de longa duração (`feat/pipedrive-modulo-completo`), não o main" vira questão formal do programa (questão aberta 16) — candidato a consolidação no M3 | Evidência EB-008 |
| EB-010 | 2026-08-10 | **Bloqueio HTTP de `.ts/.tsx` fica atrelado ao build canônico (M5/M6)**, não ao M1: a sondagem M1b provou que `bootstrap-v2/` e `core/runtime/` importam fontes `.ts` por ESM em runtime. Bloquear agora quebraria o boot | Evidência m1b (P1) |
| EB-011 | 2026-08-10 | **Todo smoke do programa passa a testar a ORIGEM diretamente** (`curl --resolve …:127.0.0.1`) e a purgar o Cloudflare após mudanças: o smoke da Onda 3 recebeu 200 de cache do CF e disparou rollback desnecessário. Purge fonteia `/root/.cloudflare.env` (segredo nunca impresso) | Recorrência conhecida de cache CF + smoke Onda 3 |
| EB-012 | 2026-08-10 | `.patch` resíduo já quarentenado para `/backup` na Onda 3 (o move persistiu apesar do rollback do vhost — resultado desejado). Falta apenas a regra Nginx permanente + purge, na Onda 4 | Saída Onda 3 |
| EB-013 | 2026-08-10 | **Status HTTP não é oráculo válido de smoke neste vhost**: o SPA faz `try_files … /index.html`, então qualquer caminho inexistente retorna 200 (shell). Verificação passa a usar **content-type/corpo** (HTML do shell × arquivo servido cru). O `patch=200` da Onda 4 era o shell, não o arquivo — a exposição já estava fechada desde a Onda 3 | Smoke Onda 4 (origem) |
| EB-014 | 2026-08-10 | Rollback da Onda 4 (disparado pelo oráculo errado) também desfez a desativação — correta — do vhost órfão :8080. Refeito na Onda 5 com oráculo por content-type | Saída Onda 4 |
| EB-015 | 2026-08-10 | **M1d aplicado (Onda 5, rc=0)**: `.patch` (BASAL-004b) e vhost órfão :8080 (BASAL-011) FECHADOS sem regressão. Restam no M1 dois P0 bloqueados pela decisão do sponsor: MySQL `0.0.0.0:3306` (BASAL-005) e phpMyAdmin público (BASAL-016). Consolidados na lista "precisa do Jhony" | Smoke m1d verde |
| EB-016 | 2026-08-10 | **phpMyAdmin FECHADO ao público (Onda 6)**: restrito a `127.0.0.1` + `187.15.86.187`. UFW não está instalado no servidor; o firewall efetivo é iptables/nft ou do provedor | Recon m1e |
| EB-017 | 2026-08-10 | **BASAL-005 rebaixado a P2 MITIGADO com prova**: teste externo (sandbox→72.60.8.101) mostra 3306/8080/22 com DROP (timeout 8s) e 443 aberto — firewall com allowlist de IPs ativo. **Bind do MySQL mantido `0.0.0.0` de propósito** (acesso do Jhony é allowlisted; mudar bind quebraria) | Probe externo |
| EB-018 | 2026-08-10 | **M1 (Contenção P0) ENCERRADO**: todos os P0 fechados, mitigados-com-prova, ou adiados com plano (`.ts` → M5/M6). Novo item P2 BASAL-018 (origin 443 sem restrição a IPs do Cloudflare) para M12. Próximo: M2 (baseline funcional + characterization tests) | Síntese Ondas 2–6 |

## Formato de entrega de cada lote (obrigatório — briefing §34)

Escopo realizado · Evidências anteriores · Implementação · Artefatos gerados ·
Validação · Riscos residuais · Rollback · Próximo gate.
"Implementado/corrigido/feito" sem evidência não conta.

## Mudanças emergenciais no servidor (registro obrigatório até o pipeline existir)

| Data | Arquivo | Diff preservado em | Correção na fonte | Status |
|---|---|---|---|---|
| 2026-08-10 | Merge de `feat/pipedrive-modulo-completo` concluído sem intenção pelo commit de evidências (`e7b54fb7`) | Histórico Git (merge preservado) | Decisão EB-008 ratificou o estado | RECONCILIADO |
