# 04 — API do Pipedrive (referência, estado jul/2026)

> Fontes oficiais citadas no fim. Onde a doc não confirma, está marcado **[VALIDAR NO TENANT]**.

## 1. Versão por entidade (v2 prioritária; v1 residual)

**v1 descontinuada em 01/01/2026** — só o subconjunto com equivalente v2. "This does not affect the entire API v1 platform."

| Entidade | Versão | Endpoint |
|---|---|---|
| Deals | **v2** | `/api/v2/deals` |
| Persons | **v2** | `/api/v2/persons` |
| Organizations | **v2** | `/api/v2/organizations` |
| Products | **v2** | `/api/v2/products` (+ `/products/{id}/variations`) |
| Deal Products | **v2** | `/api/v2/deals/{id}/products` |
| Pipelines | **v2** | `/api/v2/pipelines` |
| Stages | **v2** | `/api/v2/stages` |
| Activities | **v2** | `/api/v2/activities` |
| Custom Fields | **v2** | `/api/v2/dealFields`, `personFields`, `organizationFields`, `productFields`, `activityFields` |
| Search | **v2** | `/api/v2/*/search` |
| Users | **v1** | `/api/v1/users`, `/api/v1/users/me` |
| Leads (CRUD) | **v1** | `/api/v1/leads`, `/api/v1/leads/archived` (v2 só `search`/`convert`) |
| Notes | **v1** | `/api/v1/notes` |
| Mail/Emails | **v1** | `/api/v1/mailbox/*` |
| Teams | **v1** | `/api/v1/legacyTeams` |
| Activity Types | **v1** | `/api/v1/activityTypes` |
| Webhooks | própria (v2 default) | `POST /api/v1/webhooks` (param `version`) |

**Mudanças v1→v2 que quebram silenciosamente:** prefixo só `/api/v2/`; `PUT`→**`PATCH`**; booleanos só `true/false`; custom fields em objeto aninhado `custom_fields`; **related objects removidos** (só IDs, não objetos — mais chamadas); `user_id`→`owner_id`; `active_flag/deleted`→`is_deleted`; timestamps RFC 3339.

## 2. Autenticação

- **Token de API** (escolhido): header **`x-api-token: <token>`** em toda chamada. v2 **NÃO** aceita `?api_token=` na URL.
- **Validar token / who-am-i:** `GET /api/v1/users/me` → retorna usuário + `company_id`, `company_name`, `company_domain`. Identificador único garantido = `user_id + company_id`.
- **Base URL:** token funciona com `https://api.pipedrive.com/...` ou `https://{company}.pipedrive.com/...`.
- **OAuth (futuro):** usar **`api_domain`** retornado na troca do token como base. Escopos de leitura: `base deals:read contacts:read leads:read activities:read products:read users:read mail:read` (notas cobertas por `deals:read`/`contacts:read`; não há escopo de notas separado). **[VALIDAR]** proibição literal de `api.pipedrive.com` em OAuth.

## 3. Paginação

- **v2 (cursor):** `?limit=500&cursor=<opaco>`; fim quando `additional_data.next_cursor == null`. `limit` máx 500 (default 100).
- **v1 (offset):** `?start=0&limit=500`; `additional_data.pagination.more_items_in_collection` + `next_start`.

## 4. Rate-limit (por CUSTO de token)

- Diário: 30.000 × mult. do plano (Lite 1 / Growth 2 / Premium 5 / Ultimate 7) × seats.
- Burst: janela 2s por usuário (Growth token 40/2s; Search 10/2s).
- Custo: **lista 20 · single 2 · update 10 · delete 6 · search 40**. POST/create **não listado** (≈10 provável) **[VALIDAR]**.
- Headers: `x-ratelimit-remaining`, `x-ratelimit-reset`, `x-daily-requests-left`. **Sem `Retry-After`**. Estouro = HTTP 429.
- v2 custa ~50% menos que v1 → mais um motivo para priorizar v2.

## 5. Sincronização incremental

- v2 `GET /deals` aceita `updated_since` / `updated_until` (RFC 3339), `sort_by=id|update_time|add_time`, `sort_direction`, `filter_id`, `fields` (até 15 custom fields). Persons v2 idem. Leads v1 tem filtro por `update_time`.
- **Cursor efêmero** → guardar o maior `update_time` como marca-d'água (não o cursor).
- Sem endpoint `/recents` unificado em v2 → combinar **webhooks + reconciliação por `updated_since`**.

## 6. Webhooks

Ver [03 §3](03-sincronizacao-e-filas.md). Resumo: v2 default; `action.object`; Basic Auth + HTTPS (sem HMAC); retry 3s/30s/150s; ban 30min após 10 falhas; deleção após 3 dias sem sucesso. Payload v2 difere do v1 **[VALIDAR — consultar guia de webhooks v2]**.

## 7. ⚠️ Mail/Emails — LIMITAÇÃO ESTRUTURAL (decisão do dono)

- Só **v1 Mailbox**: `/api/v1/mailbox/mailThreads?folder=...`, `/mailThreads/{id}/mailMessages`, `/mailMessages/{id}`. Escopo `mail:read`.
- **A Mailbox API retorna apenas os e-mails do usuário DONO do token.** Não há acesso admin cross-user por um único token. **[VALIDAR NO TENANT]** — fortemente indicado pela comunidade, não afirmado na letra da doc oficial.
- **Consequência:** o §17 ("todos os e-mails, não só de negócios") **não é atingível** com um token único. Opções para o dono:
  1. **E-mails só do dono do token** (o token que você inserir) — simples, cobertura parcial.
  2. **1 grant/token por usuário** cuja caixa esteja sincronizada — cobertura total, muito mais setup (provavelmente OAuth por usuário).
  3. **Descopar e-mails** da v1 do módulo.
- HTML de e-mail deve ser **sanitizado/isolado** antes de exibir (§17.3/§45.3). Sem enviar/responder/baixar anexos (§17.4).

## 8. Leads

- CRUD v1; `search`/`convert` v2. Leads **não têm custom fields próprios — herdam os de Deals** (usar `dealFields`). `title` + `person_id`/`org_id` obrigatórios. Arquivados em endpoint separado. Convertido → vira deal e o lead é marcado como deletado (conversão assíncrona, consultar `conversion_id`).

## 9. Campos personalizados

- Chave = **hash de 40 chars**, imutável, difere por conta. Em v2 os valores vêm em `custom_fields` (aninhado).
- `enum`/`set` guardam **IDs de opção** → mapear com `options[]` (`{id,label}`) do endpoint de fields da entidade. Sufixos: `{hash}_currency` (monetary), `_until`/`_timezone`/`_formatted_address`/`_lat`/`_lng`. Recomendação oficial: buscar um registro real e **inspecionar as chaves**. **Nunca** exibir hash como rótulo ao usuário (§12.3).

## 10. Pegadinhas para réplica local

1. Deletados core somem em **30 dias** → capturar `deleted.*` por webhook.
2. Mail single-user (§7).
3. Timestamps em **UTC** (v2 com `Z`; v1 sem sufixo mas UTC) — normalizar.
4. v2 removeu related objects → mais chamadas → mais custo de token.
5. Custo assimétrico (search 40) pode estourar burst de Search antes do diário.
6. Campos visíveis na UI e ausentes na API: **[VALIDAR por amostragem]**.

## APIs internas (§46) — mapeadas ao molde do repo

Todas em `api/pipedrive/index.php` (roteador PATH_INFO), envelope `{ok,data,error}`, cache Redis, auth+permissão do módulo, CSRF nos writes.

| Método | Rota | Observação |
|---|---|---|
| GET | `/api/pipedrive/status` | header §7.5; empresa/usuário/estado da credencial |
| GET | `/api/pipedrive/summary` | tooltip do ícone (§7.4), API leve |
| GET | `/api/pipedrive/dashboard` | Big Numbers + gráficos (§10/§11), cache 60s |
| GET | `/api/pipedrive/deals` `/deals/{id}` | DataGrid paginado no servidor (§23.3) |
| GET | `/persons` `/organizations` `/leads` `/activities` `/notes` `/products` `/users` `/teams` `/pipelines` `/stages` `/custom-fields` `/emails` | consultas |
| GET | `/api/pipedrive/alerts` · PUT `/alert-settings` | §35 |
| GET | `/api/pipedrive/sync` · `/logs` | monitoramento §33 |
| POST | `/auth/validate` `/auth/connect` `/auth/reconnect` | **credencial dinâmica** — admin+CSRF, token só no corpo, nunca devolvido |
| POST | `/api/pipedrive/webhook` | receptor Basic Auth (§03.3) |
| POST | `/exports` · GET `/exports/{id}` | §37.4 (fila) |

Nenhuma rota de consulta recebe ou devolve credencial externa (§46).

---

### Fontes
- Deprecation v1 (01/01/2026): developers.pipedrive.com/changelog/post/deprecation-of-selected-api-v1-endpoints
- Migration v1→v2: pipedrive.readme.io/docs/pipedrive-api-v2-migration-guide
- Overview v2: pipedrive.readme.io/docs/pipedrive-api-v2
- Auth: pipedrive.readme.io/docs/core-api-concepts-authentication · users/me: pipedrive.readme.io/docs/marketplace-getting-user-data
- Escopos OAuth: pipedrive.readme.io/docs/marketplace-scopes-and-permissions-explanations
- Paginação: pipedrive.readme.io/docs/core-api-concepts-pagination
- Rate limiting: pipedrive.readme.io/docs/core-api-concepts-rate-limiting
- Webhooks: pipedrive.readme.io/docs/guide-for-webhooks · v2 default: developers.pipedrive.com/changelog/post/breaking-change-webhooks-v2-will-become-the-new-default-version
- Mailbox v1: developers.pipedrive.com/docs/api/v1/Mailbox · Leads: developers.pipedrive.com/docs/api/v1/Leads
- Custom fields: pipedrive.readme.io/docs/core-api-concepts-custom-fields
- Deleção 30 dias: developers.pipedrive.com/changelog/post/permanent-deletion-logic-for-6-core-entities
- api_domain (OAuth): pipedrive.readme.io/docs/how-to-get-the-company-domain

### A validar no tenant antes de fechar arquitetura
1. Bloqueio real (vs "sem garantia") de endpoints v1 após 01/01/2026.
2. Custo de token do POST/create.
3. **Mail single-user** (o de maior impacto — decide o §17).
4. Campos visíveis na UI ausentes na API.
