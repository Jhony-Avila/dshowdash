// domain/types.ts — modelo de domínio do painel Visão Geral.
// @version 2.0.0  @created 2026-07-29
//
// O painel Geral é um AGREGADOR: cada widget tem sua própria fonte (API real
// quando existe; resumo simulado marcado quando a integração ainda não chegou).
// Nenhum tipo aqui expõe detalhe técnico ao usuário (briefing §32).

export interface ShellConfig {
  signal?: AbortSignal;
  flag?: { key: string; enabled: boolean; payload: unknown; source: string };
  [k: string]: unknown;
}

export type PeriodoId = 'hoje' | '7d' | '30d';

export type NivelSaude = 'ok' | 'atencao' | 'critico' | 'indisponivel';

// ── Fontes reais ────────────────────────────────────────────────────

export interface ResumoTransito {
  nivel: 'normal' | 'moderate' | 'intense' | 'unavailable';
  indice: number | null;
  km: number | null;
  ocorrencias: number | null;
  interdicoes: number;
  atualizadoEm: string | null;
  desatualizado: boolean;
}

export interface ResumoAds {
  contas: number;
  campanhasAtivas: number;
  investimento: number;
  provedorReal: boolean;   // false = módulo em modo de testes
}

export interface ResumoAnuncios {
  conversas: number;
  perguntas: number;
  positivas: number;
  negativas: number;
  atividade: { dia: string; n: number }[];
}

// ── Widgets de módulo (§23–§24) ─────────────────────────────────────

export type ModuloId =
  | 'transito' | 'ads' | 'anuncios' | 'metaads' | 'mercadolivre'
  | 'pipedrive' | 'outlook' | 'ecommerce' | 'compras' | 'financeiro' | 'datatables';

export interface MetricaWidget {
  rotulo: string;
  valor: string;
  ruim?: boolean;      // pinta em vermelho (ex.: vencidos, reclamações)
  bom?: boolean;       // pinta em verde
}

export interface ResumoModulo {
  status: NivelSaude;
  statusRotulo: string;             // "Moderado", "Operacional", "3 pendências"…
  metricas: MetricaWidget[];        // 3–4 métricas principais
  sparkline?: number[];             // tendência compacta
  alerta?: string | null;           // linha de atenção do módulo
  atualizadoEm: string | null;      // ISO ou null
  simulado: boolean;                // true = dados de demonstração
}

// ── Saúde consolidada (§22) ─────────────────────────────────────────

export interface CartaoSaude {
  id: string;
  rotulo: string;
  valor: string;
  detalhe: string;
  nivel: NivelSaude;
  rota: string | null;   // drill-down
}

// ── Alertas, atividades, integrações (§26–§28) ─────────────────────

export interface AlertaGeral {
  id: string;
  severidade: 1 | 2 | 3;   // 1 crítico, 2 atenção, 3 informativo
  modulo: string;
  descricao: string;
  impacto: string;
  rota: string;
  simulado: boolean;
}

export interface Atividade {
  id: string;
  descricao: string;
  modulo: string;
  quando: string;          // ISO
  rota: string | null;
  simulado: boolean;
}

export interface StatusIntegracao {
  nome: string;
  estado: 'conectada' | 'sincronizando' | 'desatualizada' | 'erro' | 'demonstracao';
  ultimaSync: string | null;
  detalhe: string;
}

// ── Gráficos consolidados (§26) ─────────────────────────────────────

export interface PontoConsolidado {
  dia: string;
  [metrica: string]: number | string;
}

export interface DistribuicaoModulo {
  rotulo: string;
  valor: number;
}
