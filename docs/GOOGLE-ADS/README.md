# Módulo Ads Intelligence (Google Ads) — Documentação de Planejamento

> **Status:** PLANEJAMENTO (Fase 0 concluída). **Nenhuma mudança em produção foi feita.**
> **Data:** 2026-07-21 · **Responsável:** Jhony (jhony@dshow.com.br)
> **Escopo desta rodada:** Fase 0 formal + plano técnico. Estratégia de construção: **mock-first**
> (`ADS_PROVIDER=mock`) — toda a UI/lógica é construível e validável **sem** developer token do Google,
> sem OAuth e sem banco, exatamente como Outlook e Pipedrive começaram.
> **Briefing de origem:** `docs/BRF_ADS.md` ("Briefing completo — Módulo Google Ads no Dshow Dash", 48 seções, 6 fases).

Este diretório contém o plano técnico do módulo **Ads Intelligence** dentro do Dshow Dash.
É **documentação revisável** — o `.sql` aqui **não foi aplicado** a nenhum banco.

## Índice

| Arquivo | Conteúdo |
|---|---|
| [00-fase0-investigacao.md](00-fase0-investigacao.md) | Retrato real do terreno: andaime `adwords` existente, o que **não** existe, divergências do briefing vs realidade da Google Ads API, achados que exigem decisão. |
| [01-arquitetura.md](01-arquitetura.md) | 5 camadas (integração/dados/analítica/IA/apresentação), abstração de provider (`mock`/`google`), `GoogleAdsClient` (OAuth2 + developer token + GAQL), banco `ADS_DSHOW`, painel React `panel-ads`, flag, RBAC, cache. |
| [02-banco-ADS_DSHOW.sql](02-banco-ADS_DSHOW.sql) | DDL **rascunho/revisável** do banco `ADS_DSHOW` (não aplicar ainda). Métricas com **dimensão de data preservada** (§43), custo em **micros**. |
| [03-sincronizacao-e-filas.md](03-sincronizacao-e-filas.md) | Carga inicial, incremental por relatórios GAQL, **rastreio de mudanças por `change_event`/`change_status` (sem webhooks)**, filas, rate-limit por operações, escrita com `validate_only`, cron. |
| [04-endpoints-api.md](04-endpoints-api.md) | Referência da Google Ads API (versão, GAQL, recursos/métricas/segmentos, mutate, recommendations, GA4) + mapa de endpoints internos `/api/ads/*` mapeando o §46 do briefing. Itens **[VALIDAR NO TENANT]** marcados. |
| [05-plano-fases.md](05-plano-fases.md) | As 6 fases do briefing (§45) mapeadas ao repo, primeiro entregável construível, critérios de aceite (§46), riscos, PNR/backup/flag/rollback, e as decisões pendentes do dono. |

## Nomenclatura (decisão desta rodada)

O andaime antecipado no repo usa o nome legado **`adwords`** (marca antiga do Google). O módulo novo padroniza o slug **`ads`**:

| Peça | Slug/nome |
|---|---|
| Banco | `ADS_DSHOW` |
| Backend | `api/ads/` |
| Painel React | `public/components/panels/panel-ads/` (rota `#/panel-ads`) |
| Cripto | `AdsCrypto` + chave `ADS_CRYPTO_KEY` |
| Flag de provider | `ADS_PROVIDER=mock|google` |
| Feature flag | `panel_ads_enabled` |

O andaime legado `adwords` (header + `api/status/adwords.php` + ícone) **permanece intocado** e será **repontado** para o novo painel na fase de integração de shell (ver 00 §1.1) — sem quebrar contrato (PNR).

## Decisões pendentes do dono (resumo — detalhe em 05)

1. **Acesso à API (destrava tudo):** o **developer token** do Google Ads exige uma **conta MCC (manager)** e passa por **aprovação do Google** (Test → Basic → Standard). É provisionamento-dono e pode levar dias. Por isso o módulo nasce **mock-first**. Decidir: solicitar já o developer token? Em qual MCC?
2. **MCC vs contas avulsas:** o briefing (§6) diz que MCC **não** é obrigatório no início. Confirmar se as **2 contas** iniciais serão acessadas via um MCC (recomendado — simplifica auth e `login-customer-id`) ou por OAuth individual por conta.
3. **Escopo da IA (§26):** usar as **recomendações nativas** do Google (`recommendation` resource) como base + camada de IA própria (LLM Claude) para diagnósticos/explicações, **ou** só uma das duas? A IA **nunca** publica sem aprovação (§26.4).
4. **GA4 (§17):** qual propriedade GA4 e qual método (Google Analytics Data API) — escopos OAuth adicionais. Fase 2.
5. **Cruzamento comercial (§18):** o CRM já existe no projeto (**módulo Pipedrive / banco `PIPE_DSHOW`**). Confirmar que a atribuição campanha→lead→venda usará `GCLID`/UTM contra `PIPE_DSHOW` (encurta a Fase 5).
6. **Componentes React:** promover `DataGrid`/`Grafico`/`PageHeader` etc. a um pacote `_shared`, **ou** duplicar de `panel-datatables` (mesma decisão pendente do Pipedrive/Outlook).
7. **Operação/escrita (Fase 3):** liberar `mutate` real (pausar/orçamento/negativas) **só** após aceite, sempre com `validate_only` no preview + confirmação (§32) e auditoria (§34).

## Como este módulo se conecta ao que já existe

- **CRM/vendas** = módulo **Pipedrive** (`PIPE_DSHOW`, já validado) → fonte de leads/oportunidades/vendas para o cruzamento §18/§10 (diretoria) e ROAS real.
- **Infra** = `config/db_connection.php` (adicionar 6º banco), `AdsCrypto` (molde `DtCrypto`), provider-mock (molde Outlook), roteador de módulo (molde `api/pipedrive/index.php`), painel React (molde `panel-datatables`), `ui_nav_items` para a sidebar, SW por bump de `CACHE_NAME`.
