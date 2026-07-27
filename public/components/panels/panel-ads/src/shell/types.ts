// shell/types.ts — tipos do painel Ads Intelligence.
// @version 1.0.0  @created 2026-07-21

export interface ShellConfig {
  flag?: { key: string; enabled: boolean; payload?: unknown; source?: string };
  signal?: AbortSignal;
  [k: string]: unknown;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  error?: string;
  meta?: { message?: string; [k: string]: unknown };
}

/** Unidade de um valor numérico — governa a formatação (§7.2). */
export type Unit = 'currency' | 'int' | 'decimal' | 'pct' | 'ratio';

export interface AdsAccount {
  id: number;
  customer_id: string;
  customer_id_raw?: string;
  descriptive_name: string;
  currency_code: string;
  time_zone: string;
  status: string;
  is_default: boolean;
  is_favorite: boolean;
  last_synced_at: string | null;
  active_campaigns: number;
  cost: number;
  conversions: number;
}

export interface AdsStatus {
  provider: 'mock' | 'google';
  phase: number;
  db_ready: boolean;
  oauth_configured: boolean;
  developer_token_ready: boolean;
  accounts_total: number;
  accounts_active: number;
  accounts: AdsAccount[];
  currency: string | null;
  message?: string;
}

export type HealthClass =
  | 'excellent' | 'healthy' | 'attention' | 'critical' | 'no_data'
  | 'budget_limited' | 'wasting' | 'scale_opportunity';

export interface Campaign {
  account_id: number;
  campaign_id: number;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  channel: string;
  budget: number;
  bidding_strategy: string;
  optimization_score: number;
  health_class: HealthClass;
  impressions: number;
  clicks: number;
  ctr: number;
  avg_cpc: number;
  cost: number;
  conversions: number;
  conv_rate: number;
  cpa: number;
  conv_value: number;
  roas: number;
  search_impression_share: number;
  start_date: string;
}

export interface AdGroup {
  account_id: number;
  ad_group_id: number;
  campaign_id: number;
  campaign_name: string;
  name: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avg_cpc: number;
  cost: number;
  conversions: number;
  cpa: number;
  conv_value: number;
  roas: number;
  ads_count: number;
  keywords_count: number;
  quality_score: number;
  cannibalization_flag: boolean;
  split_opportunity: boolean;
}

export interface AdItem {
  account_id: number;
  ad_id: number;
  ad_group_id: number;
  ad_group_name: string;
  campaign_name: string;
  status: string;
  ad_type: string;
  ad_strength: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  headlines: string[];
  descriptions: string[];
  final_url: string;
  approval_status: 'APPROVED' | 'DISAPPROVED';
  policy_topics: string[];
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  conversions: number;
  cpa: number;
}

export interface Keyword {
  account_id: number;
  criterion_id: number;
  ad_group_id: number;
  ad_group_name: string;
  campaign_name: string;
  keyword_text: string;
  match_type: 'EXACT' | 'PHRASE' | 'BROAD';
  status: string;
  quality_score: number;
  impressions: number;
  clicks: number;
  ctr: number;
  avg_cpc: number;
  cost: number;
  conversions: number;
  cpa: number;
  kw_class: string;
}

export interface SearchTerm {
  account_id: number;
  search_term: string;
  campaign_name: string;
  matched_keyword: string;
  term_class: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cost: number;
  conversions: number;
  cpa: number;
}

export interface BigNumber {
  key: string;
  label: string;
  value: number;
  prev: number;
  unit: Unit;
  delta_pct: number;
  dir: 'up' | 'down' | 'flat';
  sign: 'positive' | 'negative' | 'neutral';
  spark: number[];
}

export interface MiniCampaign {
  name: string;
  cost: number;
  conversions: number;
  roas: number;
  cpa: number;
  health_class: HealthClass;
}

export interface DashboardData {
  available: boolean;
  provider: string;
  period: string;
  big: BigNumber[];
  series: {
    dates: string[];
    cost: number[];
    clicks: number[];
    conversions: number[];
    impressions: number[];
  };
  /** Mesma janela imediatamente anterior (comparação de períodos). */
  series_prev?: {
    cost: number[];
    clicks: number[];
    conversions: number[];
    impressions: number[];
  };
  /** Composição do custo por canal ao longo do tempo (streamgraph). */
  series_by_channel?: { dates: string[]; channels: { channel: string; values: number[] }[] };
  distribution: { name: string; value: number }[];
  top_campaigns: MiniCampaign[];
  bottom_campaigns: MiniCampaign[];
}

export interface BoardKpi { key: string; label: string; value: number; unit: Unit; }
export interface FunnelStage { stage: string; label: string; value: number; unit: Unit; }
export interface ChannelRow { channel: string; cost: number; conversions: number; conv_value: number; roas: number; }

export interface BoardData {
  available: boolean;
  provider: string;
  period: string;
  note: string;
  kpis: BoardKpi[];
  funnel: FunnelStage[];
  by_channel: ChannelRow[];
}

export interface Recommendation {
  id: number;
  source: 'google' | 'ai';
  priority: string;
  confidence: number;
  title: string;
  problem: string;
  impact: Record<string, number>;
  recommended_action: string;
  risks: string;
  affected: string[];
  needs_approval: boolean;
  state: string;
}

export type Period = 'today' | '7d' | '30d' | '90d';

/** Filtro de drill-down carregado entre telas via hash (#/panel-ads/{area}/{tipo}/{valor}). */
export interface DrillFiltro { tipo: 'campanha' | 'grupo'; valor: string; }

// ── Áreas adicionais (Fase mock, 2ª rodada) ──────────────────────────────
export interface Device { device: string; label: string; impressions: number; clicks: number; ctr: number; cost: number; conversions: number; conv_rate: number; cpa: number; conv_value: number; roas: number; }
export interface Location { uf: string; name: string; impressions: number; clicks: number; ctr: number; cost: number; conversions: number; cpa: number; conv_value: number; roas: number; }
export interface HourCell { hour: number; cost: number; conversions: number; }
export interface HoursData {
  matrix: { dow: number; cells: HourCell[] }[];
  by_hour: HourCell[];
  by_dow: { dow: number; cost: number; conversions: number }[];
  best: { dow: number; hour: number; cpa: number } | null;
  worst: { dow: number; hour: number; cpa: number } | null;
}
export interface ConversionAction { name: string; category: string; origin: string; status: string; primary: boolean; count: number; value: number; value_per: number; attribution: string; window_days: number; tracking_quality: string; }
export interface Audience { name: string; type: string; stage: string; size: number; impressions: number; clicks: number; ctr: number; cost: number; conversions: number; cpa: number; conv_value: number; roas: number; }
export interface LandingPage { url: string; sessions: number; conversions: number; conv_rate: number; cost: number; cpa: number; speed_score: number; cwv_lcp: number; cwv_cls: number; mobile_score: number; match_intent: boolean; }
export interface Budget { campaign: string; daily_budget: number; spent_today: number; spent_month: number; month_budget: number; projection: number; pacing: number; status: string; conversions: number; cpa: number; }
export interface QualityData {
  ads_total: number; strength: Record<string, number>; disapproved: number;
  kw_total: number; qs_avg: number; qs_buckets: { baixo: number; medio: number; alto: number };
  radar: { eixos: string[]; atual: number[]; meta: number[] };
  weak_ads: { label: string; group: string; strength: string; cost: number }[];
  weak_keywords: { keyword: string; group: string; qs: number; cost: number }[];
  slow_pages: { url: string; speed: number; mobile: number; match: boolean }[];
}
export interface FunnelFull { steps: { label: string; value: number; unit: Unit }[]; note: string; }
export interface AlertEvent { id: number; severity: 'info' | 'warning' | 'critical'; title: string; message: string; when: string; state: string; }
export interface AlertRule { key: string; name: string; metric: string; condition: string; window: string; severity: string; enabled: boolean; channel: string; }
export interface AlertsData { events: AlertEvent[]; rules: AlertRule[]; }
export interface ReportModel { key: string; name: string; description: string; formats: string[]; }
export interface HistoryEntry { id: number; when: string; user: string; object: string; object_type: string; action: string; old_value: string; new_value: string; origin: string; exec_status: string; }
