// shell/types.ts — tipos compartilhados do painel.
// @version 1.0.0  @created 2026-07-21

export interface ShellFlag {
  key: string;
  enabled: boolean;
  payload?: unknown;
  source?: string;
}

export interface ShellConfig {
  flag?: ShellFlag;
  signal?: AbortSignal;
  [k: string]: unknown;
}

// Envelope oficial do DShowDash: {ok, data, error, meta}.
export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error: string | null;
  meta?: { message?: string; [k: string]: unknown } | null;
}

// Status da integracao (GET /api/pipedrive/status).
export interface PipeStatus {
  configured: boolean;
  status: string;
  crypto_ready?: boolean;
  auth_method?: string;
  company_id?: number | null;
  company_name?: string | null;
  company_domain?: string | null;
  connected_user_id?: number | null;
  connected_user_name?: string | null;
  token_last4?: string | null;
  last_validated_at?: string | null;
  last_error?: string | null;
}

export interface PipeCompany {
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  is_admin: boolean | null;
  company_id: number | null;
  company_name: string | null;
  company_domain: string | null;
  timezone: string | null;
  currency: string | null;
}

// Overview executivo (GET /api/pipedrive/overview) — dados da base local.
export interface PipeFunilEtapa { etapa: string | null; qtd: number; valor: number; }
export interface PipeSyncRun {
  run_type: string; entity: string | null; started_at: string | null; finished_at: string | null;
  processed: number; created: number; updated: number; marked_deleted: number;
  errors: number; api_calls: number; token_cost: number; status: string | null;
}
export interface PipeCursor {
  entity: string; watermark_update_time: string | null; last_full_sync_at: string | null; updated_at: string | null;
}
export interface PipeOverview {
  overview: {
    deals: {
      total: number; abertos: number; ganhos: number; perdidos: number;
      valor_aberto: number; valor_ganho: number; taxa_conversao: number | null;
    };
    funil: PipeFunilEtapa[];
    contagens: {
      pipelines: number; stages: number; users: number;
      persons: number; organizations: number; products: number;
      activities: number; leads: number; notes: number;
    };
    atividades: { pendentes: number; atrasadas: number };
  };
  runs: PipeSyncRun[];
  cursors: PipeCursor[];
}

// Lista de negocios (GET /deals) — DataGrid server-side.
export interface PipeDealRow {
  id: number; title: string | null; value: number | null; currency: string | null;
  status: string | null; stage: string | null; owner: string | null; pipeline: string | null;
  person: string | null; org: string | null; probability: number | null;
  expected_close_date: string | null; add_time: string | null; update_time: string | null;
  /** Só vem preenchido em negócios perdidos (#30). */
  lost_reason: string | null;
}
/** `id` é string na faceta de motivos: a chave do motivo é o próprio texto. */
export interface PipeFacetOption { id: number | string; name: string | null; }
export interface PipeDealsPage {
  rows: PipeDealRow[]; total: number; page: number; per_page: number; pages: number;
  facets: { stages: PipeFacetOption[]; owners: PipeFacetOption[]; lost_reasons?: PipeFacetOption[] };
}

// Webhooks + fila (GET /webhooks, GET /queue) — rotinas administrativas (level 80).
export interface PipeWebhookRow {
  id: number | string | null;
  subscription_url: string | null;
  event_action: string | null;
  event_object: string | null;
  http_auth_user: string | null;
  version: string | number | null;
  is_active: number | boolean | null;
  add_time: string | null;
}
export interface PipeWebhooksData {
  receiver: { url: string; basic_auth_configured: boolean };
  webhooks: PipeWebhookRow[];
}
export interface PipeQueueStats {
  jobs: { pending: number; running: number; done: number; error: number; dead: number };
  due_now: number;
  webhook_events: { received: number; processed: number; error: number; duplicate: number };
  last_event_at: string | null;
}
export interface PipeQueueDeadRow {
  id: number; entity: string | null; external_id: string | null;
  attempts: number; last_error: string | null; processed_at: string | null;
}
export interface PipeQueueData { stats: PipeQueueStats; dead: PipeQueueDeadRow[]; }

// Fila morta em massa (GET /queue/dead, POST /queue/requeue-bulk) — backlog #41.
// "alvos" = pares (entidade, id externo) distintos. E o numero que importa: cada alvo
// custa UMA chamada de API no reprocessamento, independentemente de quantos jobs
// mortos apontem para ele.
export interface PipeDeadStats {
  total: number;
  alvos: number;
  mais_antigo: string | null;
  mais_novo: string | null;
  por_entidade: { entity: string; total: number; alvos: number; mais_novo: string | null }[];
  por_erro: { erro: string; total: number }[];
  teto_lote: number;
}
export interface PipeDeadRow extends PipeQueueDeadRow {
  job_type: string | null;
  created_at: string | null;
}
export interface PipeDeadData {
  stats: PipeDeadStats;
  entidades: string[];
  lista: { itens: PipeDeadRow[]; total: number; page: number; per_page: number; paginas: number };
  filtro: { entity: string | null };
}
export interface PipeRequeueBulkResult {
  reenfileirados: number;
  colapsados: number;   // irmaos do mesmo alvo, absorvidos pelo job que voltou
  alvos: number;
  restantes: number;    // alvos que ficaram de fora do teto — nunca descartados em silencio
  ids: number[];
}
export interface PipeDrainResult {
  ok: boolean; claimed: number; done: number; deleted: number; retry: number; dead: number;
}

// Metricas agregadas (GET /metrics) — base local.
export interface PipeDailyMetric {
  date: string; deals_created: number; deals_won: number; deals_lost: number;
  value_won: number; value_created: number;
}
export interface PipeHourlyMetric { hour: string; api_calls: number; api_errors: number; token_cost: number; }
export interface PipeTopProduct {
  product_id: number | null; name: string; deals: number; qty: number;
  valor_total: number; valor_ganho: number;
}
export interface PipeOwnerRow {
  owner_id: number | null; name: string; ganhos: number; valor_ganho: number; valor_aberto: number;
}
export interface PipeMetrics {
  daily: PipeDailyMetric[]; hourly: PipeHourlyMetric[];
  top_products: PipeTopProduct[]; owners: PipeOwnerRow[];
  coverage: { deals_com_produtos: number; itens: number; deals_ativos: number };
  days: number;
}

// Envelope generico de listagem paginada (persons/organizations/activities).
export interface PipePage<T> {
  rows: T[]; total: number; page: number; per_page: number; pages: number;
  facets?: Record<string, unknown>;
}
export interface PipePersonRow {
  id: number; name: string | null; email: string | null; phone: string | null;
  job_title: string | null; org: string | null; owner: string | null;
  open_deals: number; won_deals: number; add_time: string | null; update_time: string | null;
}
export interface PipeOrgRow {
  id: number; name: string | null; cnpj: string | null; city: string | null;
  state: string | null; owner: string | null;
  people: number; open_deals: number; valor_ganho: number; add_time: string | null; update_time: string | null;
}
export interface PipeActivityRow {
  id: number; subject: string | null; type: string | null; done: number;
  due_date: string | null; due_time: string | null; owner: string | null;
  deal: string | null; overdue: number; update_time: string | null;
}
export interface PipeLeadRow {
  id: string; title: string | null; value: number | null; currency: string | null;
  origin: string | null; archived: number; owner: string | null; org: string | null;
  person: string | null; converted: boolean; add_time: string | null; update_time: string | null;
}
export interface PipeProductRow {
  id: number; name: string | null; code: string | null; category: string | null;
  unit: string | null; price: number | null; currency: string | null;
  tax: number | null; owner: string | null; update_time: string | null;
}
export interface PipeNoteRow {
  id: number; content: string | null; author: string | null; vinculo: string; add_time: string | null;
}
export interface PipeUserRow {
  id: number; name: string | null; email: string | null; active: number;
  timezone: string | null; last_login: string | null;
}
export interface PipeFunilStage {
  id: number; name: string | null; order: number; probability: number | null;
  deals_abertos: number; valor_aberto: number;
}
export interface PipeFunilPipeline {
  id: number; name: string | null; order: number; is_active: number;
  stages: PipeFunilStage[]; total_deals: number; total_valor: number;
}
export interface PipeFunisData { pipelines: PipeFunilPipeline[]; }

// Kanban (GET /kanban?pipeline_id=) — v2, Fase 5.
/** Sinais de atenção do cartão. Mesmas regras de `/alerts` (as telas têm de concordar). */
export type PipeSinalKanban = 'ativ_atrasada' | 'fechamento_vencido' | 'sem_atividade' | 'parado' | 'sem_previsao';
export interface PipeKanbanCard {
  id: number; title: string | null; value: number | null; currency: string | null;
  owner: string | null; org: string | null; person: string | null;
  probability: number | null;
  expected_close_date: string | null;
  add_time: string | null; update_time: string | null;
  dias_na_etapa: number | null;
  /** true = sem marco de entrada na etapa; o tempo está medido DA CRIAÇÃO do negócio. */
  desde_criacao: boolean;
  proxima_atividade: string | null;
  atividades_atrasadas: number;
  /** Ids das etiquetas; os rótulos vêm do dicionário `etiquetas` do quadro. */
  labels: number[];
  alertas: PipeSinalKanban[];
}
export interface PipeKanbanColumn {
  stage_id: number; stage: string | null; order: number; probability: number | null;
  /** Contagem e soma REAIS da etapa — não do que coube na página. */
  count: number; valor: number;
  /** Quantos cartões vieram nesta resposta (≤ `limite_por_etapa`). */
  exibidos: number;
  deals: PipeKanbanCard[];
}
/** Recortes por previsão de fechamento do Kanban (#26). Espelha SyncRepository::KANBAN_PRAZOS. */
export type PipePrazoKanban = 'todos' | 'vencidos' | 'mes' | 'd30' | 'd90' | 'sem_previsao';

export interface PipeKanbanBoard {
  pipeline_id: number | null; pipeline_name: string | null;
  pipelines: { id: number; name: string | null }[];
  columns: PipeKanbanColumn[];
  etiquetas: { id: number; label: string }[];
  limite_por_etapa: number;
  totais: { count: number; valor: number };
  // #26 — donos com negócio aberto neste funil (para o seletor) e eco dos filtros.
  owners: { id: number | null; name: string | null; count: number }[];
  filtros: {
    owner_id: number | null;
    prazo: PipePrazoKanban;
    /** Abertos do funil SEM previsão de fechamento — o que um recorte por data deixa de fora. */
    sem_previsao_no_funil: number;
  };
}

// Alertas comerciais (GET /alerts).
export interface PipeAlertDeal {
  id: number; title: string | null; value: number | null; currency: string | null;
  owner: string | null; org: string | null; expected_close_date: string | null; update_time: string | null;
  // Fase 4 — contexto para agrupar e filtrar sem uma segunda consulta.
  owner_id?: number | null;
  stage?: string | null; stage_id?: number | null;
  pipeline?: string | null; pipeline_id?: number | null;
}
export type PipeSeveridade = 'high' | 'medium' | 'low';
export interface PipeAlert {
  key: string; label: string; description: string; severity: PipeSeveridade;
  count: number; valor: number; deals: PipeAlertDeal[];
}
export interface PipeAlertGrupo { nome: string; count: number; valor: number; }
/** Painel de risco: mede NEGÓCIOS DISTINTOS (somar os `count` dos alertas duplicaria). */
export interface PipeAlertsResumo {
  negocios_afetados: number;
  valor_em_risco: number;
  por_severidade: { severity: PipeSeveridade; regras: number; count: number; valor: number }[];
  por_dono: PipeAlertGrupo[];
  por_funil: PipeAlertGrupo[];
  por_etapa: PipeAlertGrupo[];
}
export interface PipeAlertsData {
  alerts: PipeAlert[]; total_abertos: number; resumo?: PipeAlertsResumo;
}

// Rankings dedicados (GET /rankings) — backlog #28.
export interface PipeSellerRank {
  owner_id: number | null; name: string; ganhos: number; perdidos: number; abertos: number;
  valor_ganho: number; valor_aberto: number; valor_perdido: number;
  taxa_conversao: number | null; ticket_medio: number | null;
}
export interface PipeProductRank {
  product_id: number | null; name: string; deals: number; qty: number;
  valor_total: number; valor_ganho: number; valor_aberto: number;
}
export interface PipeOrgRank {
  org_id: number | null; name: string; deals: number; ganhos: number;
  valor_ganho: number; valor_aberto: number;
}
export interface PipeRankings {
  sellers: PipeSellerRank[]; products: PipeProductRank[]; orgs: PipeOrgRank[]; limit: number;
}

// Previsao de fechamento / forecast (GET /forecast) — backlog #29.
export interface PipeForecastStage {
  stage_id: number | null; stage: string | null; pipeline: string | null;
  count: number; valor_total: number; valor_ponderado: number; prob_efetiva: number;
}
export interface PipeForecastMonth {
  month: string | null; count: number; valor_total: number; valor_ponderado: number;
}
export interface PipeForecast {
  totals: { open_count: number; valor_total: number; valor_ponderado: number };
  by_stage: PipeForecastStage[];
  by_month: PipeForecastMonth[];
  pipelines: { id: number; name: string | null }[];
  pipeline_id: number | null;
}

// Saude da sincronizacao (GET /health) — backlog #39.
export interface PipeHealthEntity {
  entity: string; sparse: boolean;
  last_run_at: string | null; last_run_status: string; last_run_errors: number;
  min_since_run: number | null;
  processed: number; created: number; updated: number; marked_deleted: number;
  watermark: string | null; last_full_sync_at: string | null;
  healthy: boolean; stale: boolean;
}
export interface PipeSyncErrorRow {
  entity: string | null; external_id: string | null; error_code: string | null;
  message: string | null; retryable: number; created_at: string | null;
}
export interface PipeApiUsage { hours: number; calls: number; errors: number; tokens: number; }
export interface PipeHealth {
  entities: PipeHealthEntity[];
  runs: PipeSyncRun[];
  queue: { stats: PipeQueueStats; dead: PipeQueueDeadRow[] };
  errors: PipeSyncErrorRow[];
  api_24h: PipeApiUsage;
  generated_at: string;
}

// Conversao & ciclo de vendas (GET /conversion) — backlog #2 (fatia viavel).
export interface PipeStageAging {
  stage_id: number | null; stage: string | null; pipeline: string | null;
  count: number; valor: number; idade_media_dias: number | null;
}
export interface PipeConversion {
  closed: { won: number; lost: number; open: number };
  win_rate: number | null;
  cycle: {
    count: number; avg_dias: number | null; max_dias: number | null;
    buckets: { ate_7: number; d8_30: number; d31_90: number; mais_90: number };
  };
  stage_aging: PipeStageAging[];
  pipelines: { id: number; name: string | null }[];
  pipeline_id: number | null;
}

// Detalhe de um negocio (GET /deals/{id}).
export interface PipeDealProduct {
  product_id: number | null; name: string; item_price: number; quantity: number;
  discount: number | null; sum: number;
}
export interface PipeTimelineItem {
  kind: 'activity' | 'note'; when: string | null; title: string | null;
  type?: string | null; done?: number; author: string | null;
}
export interface PipeCustomField { name: string; value: string; }
export interface PipeDealDetail {
  deal: {
    id: number; title: string | null; value: number | null; currency: string | null;
    status: string | null; probability: number | null; stage: string | null; pipeline: string | null;
    owner: string | null; origin: string | null; expected_close_date: string | null;
    won_time: string | null; lost_time: string | null; lost_reason: string | null;
    add_time: string | null; update_time: string | null; is_deleted: number;
  };
  person: { id: number; name: string | null; email: string | null; phone: string | null } | null;
  organization: { id: number; name: string | null; cnpj: string | null } | null;
  custom_fields: PipeCustomField[];
  products: PipeDealProduct[];
  timeline: PipeTimelineItem[];
}

// Detalhe de atividade / lead / produto (GET /activities|leads|products/{id}) — #18/#19/#20.
export interface PipeActivityDetail {
  activity: {
    id: number; subject: string | null; type: string | null; done: number; overdue: number;
    due_date: string | null; due_time: string | null; duration: string | null;
    location: string | null; note: string | null; owner: string | null;
    marked_done_time: string | null; add_time: string | null; update_time: string | null;
  };
  deal: { id: number; title: string | null; status: string | null } | null;
  person: { id: number; name: string | null; email: string | null; phone: string | null } | null;
  organization: { id: number; name: string | null } | null;
}
export interface PipeLeadDetail {
  lead: {
    id: string; title: string | null; value: number | null; currency: string | null;
    origin: string | null; archived: number; next_activity_date: string | null; owner: string | null;
    add_time: string | null; update_time: string | null;
  };
  person: { id: number; name: string | null; email: string | null; phone: string | null } | null;
  organization: { id: number; name: string | null } | null;
  converted: { id: number; title: string | null; status: string | null } | null;
}
export interface PipeProductDetail {
  product: {
    id: number; name: string | null; code: string | null; category: string | null;
    description: string | null; unit: string | null; tax: number | null; is_active: number;
    owner: string | null; add_time: string | null; update_time: string | null;
  };
  prices: { price: number | null; currency: string | null; cost: number | null }[];
  summary: { deals: number; valor_total: number };
  deals: { id: number; title: string | null; value: number | null; currency: string | null; status: string | null; quantity: number; sum: number }[];
}

export interface PipeMiniDeal {
  id: number; title: string | null; value: number | null; currency: string | null;
  status: string | null; stage: string | null;
}
export interface PipePersonDetail {
  person: {
    id: number; name: string | null; email: string | null; phone: string | null;
    job_title: string | null; org: string | null; org_id: number | null;
    owner: string | null; add_time: string | null; update_time: string | null;
    custom_fields: PipeCustomField[];
  };
  deals: PipeMiniDeal[];
  activities: PipeMiniAtividade[];
  notes?: PipeMiniNota[];
}
export interface PipeOrgDetail {
  organization: {
    id: number; name: string | null; cnpj: string | null; address: string | null;
    city: string | null; state: string | null; country: string | null;
    owner: string | null; add_time: string | null; update_time: string | null;
    custom_fields: PipeCustomField[];
  };
  summary: { total: number; abertos: number; ganhos: number; valor_ganho: number };
  people: { id: number; name: string | null; email: string | null }[];
  deals: PipeMiniDeal[];
  activities?: PipeMiniAtividade[];
  notes?: PipeMiniNota[];
}

/** Itens curtos usados nas abas dos drawers (pessoa/organizacao). */
export interface PipeMiniAtividade { subject: string | null; type: string | null; done: number; due_date: string | null }
export interface PipeMiniNota { content: string | null; add_time: string | null; author: string | null }

// ── Fase 4 — visuais gerenciais ────────────────────────────────────────

// Resumo executivo (GET /summary?days=): KPIs da janela + MESMA janela anterior.
export type PipeFormatoKpi = 'num' | 'brl' | 'pct' | 'dias';
export interface PipeSummaryKpi {
  chave: string;
  rotulo: string;
  formato: PipeFormatoKpi;
  cor: 'ok' | 'danger' | 'primary' | null;
  /** Em métricas onde crescer é ruim (perdidos, ciclo), o backend marca isto. */
  inverter?: boolean;
  valor: number | null;
  anterior: number | null;
  serie: number[];
  dica?: string;
}
/** Períodos do /summary (#3). `d*` = janela deslizante; os demais, calendário. */
export type PipePeriodoId = 'd7' | 'd30' | 'd90' | 'd180' | 'mes' | 'mes_ant' | 'trim' | 'ano';

export interface PipeSummary {
  periodo: {
    dias: number; de: string; ate: string; de_anterior: string; ate_anterior: string;
    /** #3 — o que a tela mostra para o chip de variação não ser adivinhação. */
    id: PipePeriodoId;
    rotulo: string;
    /** Contra o que se compara, com as datas exatas. */
    comparacao: string;
    /** Quando diferem (mês de 31 dias contra fevereiro), a tela avisa. */
    dias_atual: number;
    dias_anterior: number;
  };
  kpis: PipeSummaryKpi[];
  /** Foto do agora — sem período anterior de propósito (a base não guarda snapshot). */
  estado: {
    abertos: number; valor_aberto: number; sem_previsao: number;
    fechamento_vencido: number; atividades_atrasadas: number;
  };
}

// Funil analítico (GET /funnel): alcance/conversão/gargalo + comparação entre funis.
export interface PipeFunnelStage {
  stage_id: number; stage: string | null; order: number; probability: number | null;
  abertos: number; ganhos: number; perdidos: number; total: number;
  valor_aberto: number; valor_ganho: number; valor_perdido: number;
  idade_media_abertos: number | null;
  win_rate_local: number | null;
  /** Negócios que pararam nesta etapa OU em alguma posterior (estimativa — ver nota). */
  alcance: number;
  alcance_pct: number | null;
  conversao_prox: number | null;
  queda_prox: number | null;
  perdidos_prox: number | null;
}
export interface PipeFunnelTotals {
  total: number; abertos: number; ganhos: number; perdidos: number;
  valor_aberto: number; valor_ganho: number;
  win_rate: number | null; ticket_medio: number | null;
  ciclo_medio_dias: number | null; idade_media_abertos: number | null;
}
export interface PipeFunnelGargalo {
  stage_id: number; stage: string | null; proxima: string | null;
  queda_pct: number; perdidos: number;
}
export interface PipeFunnelPipeline {
  id: number; name: string | null; order: number; is_active: number;
  stages: PipeFunnelStage[]; totals: PipeFunnelTotals; gargalo: PipeFunnelGargalo | null;
  total_deals: number; total_valor: number;
}
export interface PipeFunnelComparacao extends PipeFunnelTotals {
  id: number; name: string | null; is_active: number;
}
export interface PipeFunnelData {
  pipelines: PipeFunnelPipeline[];
  comparison: PipeFunnelComparacao[];
  nota: string;
}

// ── Motivos de perda (GET /lost-reasons) — Backlog 06 #30 ────────────────────
export interface PipeLostMotivo {
  motivo: string;
  n: number;
  valor: number;
  /** Participação sobre TODOS os perdidos, inclusive os sem motivo informado. */
  share_qtd: number | null;
  share_valor: number | null;
  ticket_medio: number | null;
  /** Da criação até a perda — não é tempo por etapa (não há histórico de transições). */
  ciclo_medio_dias: number | null;
  /** Peso do motivo sobre tudo que fechou na janela (ganho + perdido). */
  taxa_perda_pct: number | null;
}
export interface PipeLostGrupo {
  id: number | null;
  nome: string;
  contexto: string;
  n: number;
  valor: number;
  principal_motivo: string | null;
  principal_share: number | null;
}
/** `total` acompanha os itens: o recorte devolve no máximo 25 grupos. */
export interface PipeLostRecorte { total: number; itens: PipeLostGrupo[] }
export interface PipeLostData {
  janela: { meses: number; de: string | null; ate: string };
  totais: {
    perdidos: number; com_motivo: number; sem_motivo: number; cobertura_pct: number | null;
    valor_perdido: number; valor_com_motivo: number;
    ganhos: number; valor_ganho: number; taxa_perda_pct: number | null;
    motivos_distintos: number;
  };
  motivos: PipeLostMotivo[];
  tendencia: { meses: string[]; series: { motivo: string; n: number[]; valor: number[] }[]; top: number };
  por_etapa: PipeLostRecorte;
  por_dono: PipeLostRecorte;
  por_funil: PipeLostRecorte;
  pipelines: { id: number; name: string | null }[];
  pipeline_id: number | null;
  nota: string;
}

// ── Origem de leads (GET /lead-sources) — Backlog 06 #31 e o "por origem" do #7 ──
//
// A origem vem de um campo customizado MULTI-valor: um negócio pode ter duas origens e
// entra nas duas. Por isso `soma(origens.n)` NÃO fecha com `totais.com_origem` — a
// diferença é exatamente `totais.multi_origem`.
export interface PipeOrigem {
  option_id: number;
  origem: string;
  n: number;
  ganhos: number;
  perdas: number;
  abertos: number;
  /** Ganhos + perdas: o denominador da conversão (aberto ainda não é derrota). */
  fechados: number;
  /** null (≠ 0) quando nada fechou ainda: "não dá para dizer" não é "zero por cento". */
  conversao_pct: number | null;
  valor_ganho: number;
  valor_aberto: number;
  ticket_medio: number | null;
  /** Participação sobre os CLASSIFICADOS (não sobre o total de negócios). */
  share_qtd: number | null;
  share_fechados: number | null;
  /** Da criação até o ganho, em dias (média dos ganhos). */
  ciclo_medio_dias: number | null;
}
export interface PipeOrigemGrupo {
  id: number | null;
  nome: string;
  n: number;
  valor: number;
  conversao_pct: number | null;
  principal_origem: string | null;
  principal_share: number | null;
}
export interface PipeOrigemRecorte { total: number; itens: PipeOrigemGrupo[] }
export interface PipeOrigemData {
  janela: { meses: number; de: string | null; ate: string };
  /** `existe:false` quando o campo sumiu do Pipedrive — a tela diz isso em vez de zerar. */
  campo: { existe: boolean; nome: string | null; field_key: string };
  totais: {
    negocios: number; com_origem: number; sem_origem: number; cobertura_pct: number | null;
    /** Quantos negócios têm MAIS DE UMA origem (a causa da soma não fechar). */
    multi_origem: number;
    ganhos: number; perdidos: number; abertos: number; fechados: number;
    conversao_pct: number | null;
    valor_ganho: number;
    origens_distintas: number;
    /** Desfecho da fatia SEM origem — o teste de viés do ranking. */
    sem_origem_fechados: number;
    sem_origem_conversao_pct: number | null;
  } | null;
  origens: PipeOrigem[];
  /** Inclui as séries "Outras" (cauda) e "Sem origem" (cobertura ao longo do tempo). */
  tendencia: { meses: string[]; series: { origem: string; n: number[] }[]; top: number };
  por_dono: PipeOrigemRecorte;
  por_funil: PipeOrigemRecorte;
  pipelines: { id: number; name: string | null }[];
  pipeline_id: number | null;
  nota: string;
}
