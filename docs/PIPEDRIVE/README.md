# Módulo Pipedrive Analytics — Documentação de Planejamento

> **Status:** PLANEJAMENTO (Fase 0 concluída). Nenhuma mudança em produção foi feita.
> **Data:** 2026-07-21 · **Responsável:** Jhony (jhony@dshow.com.br)
> **Escopo desta rodada:** Fase 0 formal + plano técnico. Método de auth escolhido: **token de API inserido pela própria aplicação** (dinâmico, cifrado no backend), com arquitetura já preparada para OAuth 2.0.

Este diretório contém o plano técnico do módulo **Pipedrive Analytics** dentro do Dshow Dash.
É **documentação revisável** — o `.sql` aqui **não foi aplicado** a nenhum banco.

## Índice

| Arquivo | Conteúdo |
|---|---|
| [00-fase0-investigacao.md](00-fase0-investigacao.md) | Retrato real do terreno: o que já existe no repo, o que não existe, divergências do briefing, achados que exigem decisão. |
| [01-arquitetura.md](01-arquitetura.md) | Arquitetura da integração, camadas, client v2/v1, **credencial dinâmica pela app (token cifrado)**, banco, módulo React, flag, RBAC, cache. |
| [02-banco-PIPE_DSHOW.sql](02-banco-PIPE_DSHOW.sql) | DDL **rascunho/revisável** do banco `PIPE_DSHOW` (não aplicar ainda). |
| [03-sincronizacao-e-filas.md](03-sincronizacao-e-filas.md) | Carga inicial, incremental por `updated_since`, webhooks v2, reconciliação, filas, controle de rate-limit por custo, retry/backoff, cron. |
| [04-endpoints-api-v2.md](04-endpoints-api-v2.md) | Mapa de endpoints por entidade (v2 vs v1), auth, paginação por cursor, campos personalizados, custos de token, e a lista do que precisa ser **validado no tenant**. |
| [05-plano-fases.md](05-plano-fases.md) | Plano por fases mapeado ao repo, critérios de aceite, riscos, PNR/backup/flag/rollback e **primeiro entregável construível**. |

## Decisões pendentes do dono (resumo — detalhe em 05)

1. **E-mails (§17) — LIMITAÇÃO REAL:** um único token de API só lê a caixa do **dono do token**, não de todos os usuários. Escolher: (a) e-mails só do dono do token, (b) 1 grant/token por usuário, ou (c) descopar e-mails da v1.
2. **Componentes React:** promover DataGrid/Grafico/PageHeader etc. a um pacote compartilhado, **ou** duplicar de `panel-datatables`.
3. **Reversibilidade de migração (§48):** seguir o padrão idempotente atual do repo, **ou** introduzir scripts up/down pareados (convenção nova).
4. **RBAC:** gate por `level:NN` (padrão atual do repo) **ou** criar chaves `pipedrive.*` em `app_permissions` (convenção mais granular).
5. **Nome/domínio da conexão** e **plano do Pipedrive** (define orçamento diário de tokens: Lite=1× … Ultimate=7×).
