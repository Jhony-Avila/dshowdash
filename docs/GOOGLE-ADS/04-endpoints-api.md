# 04 — Google Ads API (referência, estado jul/2026) + endpoints internos

> Onde a doc é sensível à versão ou depende da conta, está marcado **[VALIDAR NO TENANT]**.
> Fontes oficiais no fim.

## 1. Versão e transporte

- **Google Ads API** — versionada por trimestre (ex.: `v17`/`v18`/`v19` na virada 2025/2026), sunset ~12 meses após lançamento. **[VALIDAR versão corrente]** — usar a **mais recente estável** no momento da implementação; encapsular a versão numa constante (`GoogleAdsClient::API_VERSION`) para troca fácil.
- **Transporte:** gRPC (nativo) **ou** REST/JSON. Recomendação para este projeto: **REST/JSON** via cURL (evita dependência gRPC/protobuf pesada no PHP 8.3 do servidor). Base:
  `https://googleads.googleapis.com/<version>/customers/{customer_id}/googleAds:searchStream` (leitura)
  e `.../customers/{customer_id}/<resource>:mutate` (escrita). **[VALIDAR paths REST na versão]**.

## 2. Autenticação (3 credenciais)

Toda chamada REAL precisa de:
1. **`Authorization: Bearer <access_token>`** — OAuth 2.0. Escopo `https://www.googleapis.com/auth/adwords`. Access token dura ~1h → renovar com **refresh token** (obtido no consentimento com `access_type=offline&prompt=consent`).
2. **`developer-token: <token>`** — da conta **MCC/manager**, aprovado pelo Google. **Provisionamento-dono.**
3. **`login-customer-id: <MCC id sem hífen>`** — quando acessa contas-cliente via manager.

- **Descobrir contas:** `CustomerService.ListAccessibleCustomers` → lista de `customers/{id}` que o grant OAuth alcança. Detalhe de cada uma por GAQL no recurso `customer`.
- **OAuth:** fluxo Web server + PKCE recomendado; `state` único consumido 1x (anti-CSRF/replay), `return_to` só interno (anti open-redirect) — molde do Outlook.

## 3. Leitura por GAQL (Google Ads Query Language)

Uma linguagem SQL-like sobre **recursos**. Ex. de query de campanhas com métrica por dia:
```sql
SELECT campaign.id, campaign.name, campaign.status,
       metrics.impressions, metrics.clicks, metrics.cost_micros,
       metrics.conversions, metrics.conversions_value,
       segments.date
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
ORDER BY segments.date
```
- **Paginação:** `Search` devolve `next_page_token`; `SearchStream` faz streaming (melhor para volume). `page_size` até ~10.000 **[VALIDAR]**.
- **Sem JOIN livre:** cada `FROM <resource>` traz os campos daquele recurso + `metrics`/`segments` compatíveis. Relacionar campanhas↔anúncios etc. é feito **no nosso banco**, não na query.
- **Recursos-chave por tela do briefing:**

| Tela (briefing) | Recurso GAQL | Observação |
|---|---|---|
| Campanhas (§11) | `campaign` | + `metrics.*`, `campaign.optimization_score` |
| Grupos (§12) | `ad_group` | |
| Anúncios (§13) | `ad_group_ad` | `ad_group_ad.ad.*` (headlines/descriptions em arrays), `ad_strength`, `policy_summary` |
| Palavras-chave (§14) | `keyword_view` / `ad_group_criterion` | Quality Score em `ad_group_criterion.quality_info.*` |
| Termos de pesquisa (§15) | `search_term_view` | alto volume; segmentar por data |
| Landing Pages (§16) | `landing_page_view` / `expanded_landing_page_view` | métrica de página; CWV vem do GA4/PageSpeed |
| Conversões (§23) | `conversion_action` + `segments.conversion_action` | contagem/valor por ação |
| Públicos (§22) | `campaign_audience_view` / `ad_group_audience_view` | |
| Localizações (§20) | `geographic_view` / `user_location_view` | `segments.geo_target_*` |
| Dispositivos (§19) | qualquer recurso + `segments.device` | MOBILE/DESKTOP/TABLET |
| Horários/dias (§21) | recurso + `segments.hour`, `segments.day_of_week` | matriz dia×hora |
| Orçamentos (§24) | `campaign_budget` | recurso separado |
| Qualidade (§25) | `ad_group_criterion.quality_info`, `ad_group_ad.ad_strength` | |
| Diretoria (§10) | agregação nossa + `ads_entity_links` (CRM) | ROAS real cruza `PIPE_DSHOW` |
| Histórico (§34) | `change_event`, `change_status` | últimos 30 dias |
| IA (§26) | `recommendation` | recomendações nativas |

- **Micros:** `metrics.cost_micros`, `*_bid_micros`, `campaign_budget.amount_micros` vêm em **micros** (÷1.000.000). Moeda em `customer.currency_code`.

## 4. Rate-limit / quotas

Ver [03 §4](03-sincronizacao-e-filas.md#4-rate-limit-e-quotas-por-operacoes-ligado-ao-developer-token). Resumo: teto **diário de operações** ligado ao nível do developer token (Basic ~15k/dia **[VALIDAR]**); `RESOURCE_EXHAUSTED`/`RateExceededError` → respeitar `retryDelay` ou backoff+jitter; preferir relatórios agregados.

## 5. Escrita (mutate) + validate_only

- Cada recurso tem seu `*:mutate` (operations create/update/remove) ou `GoogleAdsService:mutate` em lote (atômico opcional).
- **`validate_only=true`** → valida e retorna erros **sem** aplicar. É o motor do preview de impacto (§32.5) e do fluxo de aprovação.
- `partial_failure=true` permite aplicar o que passou e reportar o que falhou (útil em lote de negativas §15).
- Campos monetários em **micros**. `update_mask` obrigatório em updates (só os campos citados mudam).

## 6. Rastreio de mudanças (substitui webhooks)

- **`change_event`**: `SELECT change_event.* FROM change_event WHERE change_event.change_date_time DURING LAST_14_DAYS` — traz `old_resource`/`new_resource`, `user_email`, `client_type`, `change_resource_type`. **Máx. 30 dias de retenção**; `LIMIT` obrigatório.
- **`change_status`**: `resource_status` (ADDED/CHANGED/REMOVED) + `last_change_date_time` por recurso — usar para decidir **o que re-buscar**.
- Não há push; a periodicidade é a do cron (03 §2/§7).

## 7. GA4 (§17) — API separada

- **Google Analytics Data API** (`properties/{id}:runReport`) — escopo OAuth `https://www.googleapis.com/auth/analytics.readonly` (grant adicional). Métricas/dimensões próprias (`sessions`, `engagedSessions`, `conversions`, `landingPage`, `sessionSource`/`sessionMedium`, device, geo…).
- **Cruzamento com Ads:** por `campaign`/`sessionSource=google`/`sessionMedium=cpc` e por landing page (URL). Funis (§17.2) montados no nosso banco.
- Fase 2. **[VALIDAR propriedade GA4 e escopos com o dono]**.

## 8. Pegadinhas para réplica local

1. **Custo em micros** — normalizar sempre; nunca exibir micros ao usuário.
2. **Conversões retroagem** — reprocessar janela móvel de dias (03 §2.1); "hoje" nunca é final (§44.15).
3. **`change_event` só 30 dias** — reconciliação estrutural completa diária é obrigatória.
4. **Sem JOIN** no GAQL — relacionamentos montados no banco.
5. **`optimization_score`** 0..1 (índice de otimização §11.1).
6. **Developer token gating** — Basic limita operações/dia e contas; dimensionar carga (§4).
7. **PMax/Performance Max** limita visibilidade de termos/keywords — algumas telas terão dados parciais para esse tipo de campanha. **[VALIDAR]**.
8. **Fuso e moeda por conta** (§44.5) — nunca misturar contas de moedas diferentes numa soma sem conversão explícita (§18.2 separa valor de conversão de receita comercial).

## APIs internas (§46) — mapeadas ao molde do repo

Todas em `api/ads/index.php` (roteador PATH_INFO), envelope `{ok,data,error}`, cache Redis, auth+permissão do módulo, CSRF nos writes. Nenhuma rota de consulta recebe ou devolve credencial externa. No modo mock, `AdsMockController` responde todas com fixtures.

| Método | Rota | Observação |
|---|---|---|
| GET | `/api/ads/status` | provider (mock/google), contas, estado da credencial, indicador do header |
| GET | `/api/ads/summary` | tooltip do ícone do header, API leve |
| GET | `/api/ads/accounts` | seletor de contas (§6): lista, moeda, fuso, última sync, favorita/padrão |
| POST | `/api/ads/auth/connect` · GET `/auth/callback` · POST `/accounts/select` `/accounts/{id}/reconnect` · DELETE `/accounts/{id}` | **OAuth** — admin+CSRF (callback precede CSRF); tokens nunca devolvidos |
| GET | `/api/ads/dashboard` | Big Numbers + gráficos (§7/§9), cache 60s; params: contas[], período, comparativo |
| GET | `/api/ads/board` | Dashboard da diretoria (§10): investimento→leads→oportunidades→vendas (cruza CRM) |
| GET | `/api/ads/campaigns` `/campaigns/{id}` | DataGrid server-side (§11) + abas contextuais (§5.2) |
| GET | `/ad-groups` `/ads` `/keywords` `/search-terms` `/landing-pages` `/conversions` `/audiences` `/locations` `/devices` `/hours` `/budgets` `/quality` | consultas por tela |
| GET | `/api/ads/funnel` | funil comercial (§16.3/§18): termo→kw→anúncio→LP→lead→venda |
| GET | `/api/ads/recommendations` · POST `/recommendations/{id}/apply` `/dismiss` | §26 (apply passa por aprovação) |
| GET | `/api/ads/alerts` · GET/PUT `/alert-rules` | §27 |
| GET | `/api/ads/forecast` | §39 (estimativas) |
| POST | `/api/ads/simulate` | §24.1 simulador de orçamento (estimativa, não aplica) |
| GET | `/api/ads/history` | §34 histórico/auditoria (lê `ads_change_log`) |
| POST | `/api/ads/mutate/preview` | roda `validate_only`, devolve impacto estimado (§32.5) — **não aplica** |
| POST | `/api/ads/mutate/apply` | aplica `mutate` real (perfil≥Gestor + CSRF + confirmação); grava `ads_change_log` |
| POST | `/api/ads/mutate/rollback` | reaplica valor anterior (§34.2) |
| POST | `/exports` · GET `/exports/{id}` | §28 (fila) |
| GET/POST | `/views` `/dashboards` `/preferences` | §29/§30.4 (views/dashboards/filtros salvos por usuário) |
| POST | `/api/ads/mock/reset` | zera o estado do mock (só no modo mock) |

---

### Fontes (validar versão/URLs no momento da implementação)
- Google Ads API overview / versioning / release notes: developers.google.com/google-ads/api
- GAQL (grammar + fields): developers.google.com/google-ads/api/docs/query/overview · fields reference (Google Ads Query Builder)
- OAuth + developer token (Test/Basic/Standard): developers.google.com/google-ads/api/docs/oauth · .../docs/access-levels
- ListAccessibleCustomers / login-customer-id: developers.google.com/google-ads/api/docs/concepts/call-structure
- Reporting (SearchStream) + rate limits: developers.google.com/google-ads/api/docs/reporting · .../docs/best-practices/quotas
- Mutates + validate_only + partial_failure: developers.google.com/google-ads/api/docs/mutating/overview
- change_event / change_status: developers.google.com/google-ads/api/docs/change-status
- Recommendations: developers.google.com/google-ads/api/docs/recommendations
- Google Analytics Data API (GA4): developers.google.com/analytics/devguides/reporting/data/v1

### A validar no tenant antes de fechar arquitetura
1. **Nível do developer token do dono** (Test/Basic/Standard) — decide o teto de operações e se dá para usar dados reais já.
2. **MCC** que hospeda as 2 contas (define `login-customer-id`).
3. **Versão corrente** da API e paths REST.
4. **Contabilização de operações** de relatórios vs mutates na versão corrente.
5. **Visibilidade em Performance Max** (termos/keywords parciais).
6. **Propriedade GA4** e escopos (Fase 2).
