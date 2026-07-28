# 03 — Sincronização, Filas e Rate-Limit

## 1. Carga inicial (briefing §27.1) — ordem por dependência

Respeitar dependências de FK lógicas antes de puxar volume:

1. Conta (`/v1/users/me` → `pipe_accounts`)
2. Usuários e equipes (`/v1/users`, `/v1/legacyTeams`)
3. Funis e etapas (`/v2/pipelines`, `/v2/stages`)
4. Campos personalizados (`/v2/dealFields`, `personFields`, `organizationFields`, `productFields`, `activityFields`) → `pipe_custom_fields` + `_options`
5. Organizações → Pessoas → Produtos
6. Negócios → Produtos dos negócios (`/v2/deals/{id}/products`)
7. Leads (`/v1/leads` + `/v1/leads/archived`)
8. Atividades
9. Notas (`/v1/notes`)
10. E-mails (`/v1/mailbox/*`) — **condicionado à decisão de escopo** (§04.7)
11. Históricos disponíveis → `pipe_deal_history`
12. Cálculo de indicadores → `pipe_metrics_*`

Dimensionar ao **orçamento de tokens do plano** (§4). Full-load usa listagem (custo 20/página, `limit=500`); registrar consumo em `pipe_sync_runs`.

## 2. Incremental (§27.2) — delta pull por marca-d'água

- **Estratégia:** para cada entidade, guardar em `pipe_sync_cursors.watermark_update_time` o **maior `update_time`** já visto. Na próxima rodada:
  ```
  GET /api/v2/deals?updated_since={watermark}&sort_by=update_time&sort_direction=asc&limit=500  (+cursor)
  ```
  e avançar a marca-d'água ao final. **Nunca** persistir o `cursor` como marca-d'água — ele é **efêmero** na v2.
- Entidades v1 (Leads/Notes) usam `update_time` + `start/limit`.
- **Frequência (§27.3, ajustada pelo §27.3 do briefing):** incremental a cada **15 min** (não 1h); reconciliação de segurança a cada **1h**; reconciliação completa **diária** em janela de baixo uso; métricas após cada lote relevante.

## 3. Webhooks (§27.4) — v2 (default)

- **Estado:** webhooks têm versionamento próprio; **v2 é o default**. Criar via `POST /v1/webhooks` (a v1 de webhook será descontinuada em 2026).
- **Formato de evento:** notação `action.object` — actions `added|updated|deleted|merged`; objects `deal|person|organization|lead|activity|product|note|stage|pipeline|user|activityType`. Curingas `*.deal`, `updated.*`.
  - ⚠️ O briefing citou `change.deal`/`delete.person` (nomenclatura antiga). O padrão atual é `updated.deal`/`deleted.person`.
- **Autenticação do webhook:** **HTTP Basic Auth** (`http_auth_user`/`http_auth_password`) + **HTTPS obrigatório** (self-signed não é aceito). **Não há HMAC/assinatura** — se quiser reforço, usar segredo na URL + validação de origem.
- **Endpoint receptor:** `POST /api/pipedrive/webhook` — grava em `pipe_webhook_events` com `dedup_key` (idempotência para reentrega/fora de ordem — §49.1), responde **2XX rápido** (< 10s) e processa **assíncrono** por fila. Ordena por `event_time` ao aplicar (webhooks podem chegar fora de ordem).
- **Retry do Pipedrive:** reenvia 3× (3s, 30s, 150s); 10 falhas → ban de 30 min; **3 dias sem entrega bem-sucedida → o webhook é deletado**. Por isso webhooks **não** substituem a reconciliação por polling.
- **Fallback documentado (§51.8):** se webhooks não forem viáveis, incremental a cada 15 min cobre o SLA.

## 4. Registros excluídos (§27.5) — janela de 30 dias

- ⚠️ **As 6 entidades core deletadas somem permanentemente da API após 30 dias.** Se o sync perder essa janela, a deleção é irrecuperável.
- **Mitigação:** capturar eventos `deleted.*` por webhook (fonte primária de deleção) **e** varrer `?status=deleted` no polling. No banco, marcar `is_deleted=1` + data — **nunca** apagar fisicamente (mantém histórico/relatórios/indicadores).

## 5. Filas (§29) e retry (§30)

- Tabela `pipe_sync_jobs` (tipo, entidade, id externo, prioridade, tentativas, `next_attempt_at`, status, erro).
- **Backoff exponencial + jitter** (§30.1): imediata → 30s → 2min → 10min → 30min. Após 5 falhas → `status='dead'` + `pipe_sync_errors` + alerta visual (§34).
- **Não retentar** (§30.2): 401 credencial inválida, 403 permissão, 404 inexistente, 422 payload inválido. Marcar direto como erro definitivo.

## 6. Controle de rate-limit por CUSTO (§28)

O modelo do Pipedrive é **por custo em tokens**, não por nº de requisições:
- **Orçamento diário:** 30.000 × multiplicador do plano (Lite=1 … Ultimate=7) × seats. Reseta à meia-noite (fuso do servidor Pipedrive).
- **Burst:** janela de 2s por usuário (ex.: token Growth = 40 req/2s; Search = 10 req/2s em todos).
- **Custo por operação:** GET lista = **20**, GET single = **2**, update = **10**, delete = **6**, search = **40**.
- **Headers:** `x-ratelimit-remaining`, `x-ratelimit-reset` (janela 2s), `x-daily-requests-left`. **Não há `Retry-After`** — calcular o backoff.
- **Implementação:** o `PipedriveClient` lê os headers, reduz concorrência/lotes ao se aproximar de 0, pausa até `x-ratelimit-reset`, e em **429** aplica backoff+jitter. Preferir sempre **v2** (≈50% menos tokens) e `limit=500` para minimizar listagens. Persistir cada chamada em `pipe_api_requests` (custo, status, latência, correlation_id) — **sem** token/headers de auth.

## 7. Cron (padrão do repo)

Espelhar `scripts/datatables-monitor.php`: um `scripts/pipedrive-sync.php` CLI (bloqueia não-CLI), `getopt --mode=`, **flock** em `storage/locks/pipedrive-{mode}.lock` (dono www-data; **não** `/tmp`), delegando a um `PipedriveSyncService` que espelha `DtDiscoveryService`.

```cron
# /etc/cron.d/pipedrive   (não versionado hoje — criar)
*/15 * * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/pipedrive-sync.php --mode=incremental
*/1  * * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/pipedrive-sync.php --mode=drain-queue
0    * * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/pipedrive-sync.php --mode=reconcile-hourly
30   3 * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/pipedrive-sync.php --mode=reconcile-daily
```

**Sem botão "Sincronizar agora" para usuários** (§27.6) — só rotina administrativa protegida (CLI ou endpoint restrito) para diagnóstico/recuperação.

## 8. SLA de atualização (§52)

- Aceitável: crítico por webhook em minutos; incremental ≤ 15 min; reconciliação ≤ 1h; dashboard ≤ 60s após o banco.
- Desatualizado: > 30 min sem incremental; > 2h sem reconciliação; webhook acumulado sem processar; falhas consecutivas acima do limite → alerta + indicador âmbar/laranja no header (§7.5).
