# 03 — Sincronização, Filas e Rate-Limit

> **Divergência-chave vs Pipedrive:** a Google Ads API **não tem webhooks/push**. Toda atualização é por
> **pull** (relatórios GAQL agendados + `change_event`/`change_status`). Isto molda todo este documento.

## 1. Carga inicial — ordem por dependência

Respeitar dependências antes de puxar volume de métrica. Por conta (as 2 iniciais):

1. Conta (`customer` + `ListAccessibleCustomers`) → `ads_accounts`
2. Orçamentos (`campaign_budget`) → `ads_budgets`
3. Campanhas (`campaign`) → `ads_campaigns`
4. Grupos de anúncios (`ad_group`) → `ads_ad_groups`
5. Anúncios (`ad_group_ad`) → `ads_ads`; recursos/extensões (`asset`, `campaign_asset`, `ad_group_asset`) → `ads_assets`
6. Palavras-chave (`ad_group_criterion` type=KEYWORD, positivas e negativas) → `ads_keywords`
7. Ações de conversão (`conversion_action`) → `ads_conversion_actions`
8. Públicos/localizações/dispositivos (critérios/dimensões)
9. **Métricas históricas** por relatório GAQL segmentado por data (`segments.date`) — janela inicial ex.: **últimos 365 dias** → `ads_metrics_daily` (e `ads_metrics_hourly` para horas/dias)
10. Termos de pesquisa (`search_term_view`, alto volume — janela menor, ex.: 90 dias) → `ads_search_terms`
11. Landing pages (`landing_page_view`) → `ads_landing_pages`
12. Recomendações nativas (`recommendation`) → `ads_recommendations`
13. Cálculo de indicadores/classificações/forecast (§7.2 sinal por indicador, §11.2 saúde, §14.2 classe da palavra) → colunas calculadas + `ads_forecasts`

Dimensionar a janela inicial ao **nível do developer token** (Basic tem limite diário de operações — §4). Registrar consumo em `ads_sync_runs`.

## 2. Incremental — pull por data (não há `updated_since` unificado)

**Estratégia dupla** (estrutura vs métrica):

### 2.1. Métricas (relatórios GAQL)
- Rebuscar por **`segments.date`** as datas recentes. Regra prática: rematerializar **os últimos 3–7 dias** a cada rodada (conversões e custo do Google **retroagem/ajustam** por dias — atribuição, ajustes de faturamento). Nunca confiar que "ontem" está final: reprocessar a janela móvel e **sobrescrever apenas as linhas daquela data** (a chave única de `ads_metrics_daily` é por data → é UPSERT idempotente, o histórico das outras datas fica intacto — §43).
- Guardar `last_metric_date` em `ads_sync_cursors`.
- **Frequência:** métricas do dia corrente a cada **1–3 h** (mídia não muda por minuto); janela móvel (últimos 7 dias) **diária** de madrugada; histórico só na carga inicial.

### 2.2. Estrutura (mudanças de campanha/anúncio/palavra)
- **`change_event`**: lista alterações dos **últimos 30 dias** (quem mudou o quê, valores antigo/novo). Filtrar por `change_event.change_date_time` > `last_change_read_at`. É a **fonte primária de "o que mudou"** (§34 "alteração externa detectada").
- **`change_status`**: dá `last_change_date_time` e `resource_status` (ADDED/CHANGED/REMOVED) por recurso — usar para saber **quais recursos re-buscar** sem varrer tudo.
- Fluxo: ler `change_status` → para os recursos marcados, re-buscar o recurso completo por GAQL → UPSERT. Marcar `REMOVED` como `is_removed=1` (**nunca** apagar fisicamente — §43).
- **Frequência:** a cada **15–30 min**.

> ⚠️ **`change_event` só cobre 30 dias.** Uma reconciliação estrutural completa (varredura de todos os recursos) **diária** é a rede de segurança contra perder uma mudança fora dessa janela.

## 3. "Webhooks" — NÃO EXISTEM (documentar o fallback como padrão)

- A Google Ads API **não oferece** callbacks/push. Não há endpoint receptor a criar.
- O que o briefing chama de "alertas em tempo real" (§27) é **calculado por nós** após cada pull incremental: comparar a janela atual com a anterior e disparar `ads_alert_events` conforme `ads_alert_rules`.
- **Consequência de arquitetura:** o SLA de "tempo real" é o **intervalo do incremental** (15–30 min), não segundos. Deixar isso explícito no §40 (mensagens funcionais: "sincronização em andamento").
- (Existe o *Google Ads Ad Hoc/streaming* apenas para relatórios grandes — `SearchStream` —, não para notificação de eventos.)

## 4. Rate-limit e quotas (por OPERAÇÕES, ligado ao developer token)

- **Nível do developer token** define o teto diário:
  - **Test access:** só contas de teste (sem dados reais) — inútil para produção.
  - **Basic access:** limite diário de **operações** (histórico ~**15.000 operations/dia** — **[VALIDAR valor atual]**) e nº de contas.
  - **Standard access:** limites muito maiores (solicitar quando escalar).
- **Contagem:** cada get/mutate conta como operação(ões). Relatórios (`SearchStream`) têm limites próprios de QPS. **[VALIDAR contabilização exata na versão corrente]**.
- **Erros de limite:** `RESOURCE_EXHAUSTED` / `RateExceededError` (com `retryDelay` no detalhe do erro quando presente) → **respeitar o `retryDelay`**; senão backoff exponencial + jitter.
- **Implementação:** o `GoogleAdsClient` conta operações por chamada, reduz concorrência ao se aproximar do teto estimado, e persiste cada chamada em `ads_api_requests` (**sem** tokens/headers). Preferir **relatórios agregados** (menos chamadas) a varreduras recurso-a-recurso.
- **Minimizar operações:** usar `SearchStream` com GAQL que já traz métrica+dimensão numa query só; segmentar por data no próprio relatório em vez de N chamadas.

## 5. Filas (§29 do repo) e retry

- Tabela `ads_sync_jobs` (tipo, conta, entidade, params, prioridade, tentativas, `next_attempt_at`, status).
- **Backoff exponencial + jitter:** imediata → 30s → 2min → 10min → 30min. Após 5 falhas → `status='dead'` + `ads_sync_errors` + alerta técnico interno.
- **Não retentar:** `AUTHENTICATION_ERROR`/`AUTHORIZATION_ERROR` (401/403), `INVALID_ARGUMENT` (query/payload inválido), `NOT_FOUND`. Marcar erro definitivo.
- Coalescer jobs de "re-buscar recurso X" (dedup por conta+entidade+id) para não empilhar duplicados vindos do `change_status`.

## 6. Escrita (`mutate`) — Fase 3, com preview e auditoria

- Toda escrita é `mutate` (operations) no serviço do recurso (`CampaignService`, `AdGroupCriterionService`, `CampaignBudgetService`, …) ou `GoogleAdsService.Mutate` em lote.
- **Preview obrigatório (§32.5):** rodar antes com **`validate_only=true`** → devolve erros de validação **sem aplicar**. O resultado alimenta `ads_approvals.impact_json` e a tela de confirmação.
- **Fluxo (§32.1):** usuário seleciona → mostra dados atuais → informa alteração → `validate_only` (valida + estima impacto) → confirma → aplica `mutate` real → grava resultado em `ads_change_log` (com `old_value`/`new_value`) → atualiza tela.
- **Ações destrutivas (§32.2):** confirmação reforçada + justificativa + auditoria; preferir **PAUSE** a REMOVE; **sem** remoção em lote sem confirmação adicional.
- **Rollback (§34.2):** reaplicar `mutate` com o `old_value` guardado em `ads_change_log` (não há "undo" nativo; é uma nova operação inversa, também auditada).
- Sempre com `job_type='mutate'` pela fila para herdar retry/observabilidade.

## 7. Cron (padrão do repo)

Espelhar `scripts/datatables-monitor.php` / `scripts/pipedrive-sync.php`: um `scripts/ads-sync.php` CLI (bloqueia não-CLI), `getopt --mode=`, **flock** em `storage/locks/ads-{mode}.lock` (dono www-data; **não** `/tmp`), delegando a um `AdsSyncService`.

```cron
# /etc/cron.d/ads   (não versionado hoje — criar)
*/20 * * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/ads-sync.php --mode=changes        # change_status/event
0   */2 * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/ads-sync.php --mode=metrics-today  # dia corrente
30   3 * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/ads-sync.php --mode=metrics-window  # janela móvel 7d
0    4 * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/ads-sync.php --mode=reconcile-full  # estrutura completa
*/5  * * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/ads-sync.php --mode=drain-queue     # fila (mutate/export/report)
15   * * * *  www-data  /usr/bin/php /var/www/dshowdash/scripts/ads-sync.php --mode=metrics-calc    # KPIs/classificações/forecast/alertas
```

**Sem botão "Sincronizar agora" para usuários** — só rotina administrativa protegida (CLI ou endpoint restrito) para diagnóstico/recuperação. O painel exibe apenas mensagens funcionais (§40).

## 8. SLA de atualização

- Aceitável: estrutura ≤ 30 min (incremental de mudanças); métrica do dia ≤ 3h; janela móvel reconciliada diariamente; dashboard ≤ 60s após o banco.
- Desatualizado: > 1h sem incremental de mudanças; > 6h sem métrica; falhas consecutivas acima do limite → indicador âmbar no header (o mesmo `panel-adwords` já existe para isso) + alerta técnico interno.
