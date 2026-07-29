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

export type PeriodoId = 'hoje' | 'ontem' | '7d' | '30d' | 'mes_atual';

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

export type CategoriaAtividade = 'vendas' | 'financeiro' | 'marketing' | 'operacoes' | 'sistema';

export interface Atividade {
  id: string;
  descricao: string;
  modulo: string;
  categoria: CategoriaAtividade;
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

// ════════════════════════════════════════════════════════════════════
// v3 — Home Inteligente (briefing 2026-07-29)
// ════════════════════════════════════════════════════════════════════

export type ModoHome = 'operacional' | 'executivo';

export type PeriodoHome = PeriodoId;

// ── Clima (/api/home/weather.php) ───────────────────────────────────

export type GrupoClima = 'limpo' | 'parcial' | 'nublado' | 'neblina' | 'chuva' | 'neve' | 'tempestade';

export interface ClimaAtual {
  temp: number | null;
  sensacao: number | null;
  condicao: string;
  grupo: GrupoClima;
  umidade: number | null;
  vento: number | null;
  chuvaAgora: number | null;
  nuvens: number | null;
  dia: boolean;
  tempMax: number | null;
  tempMin: number | null;
  chanceChuva: number | null;
  uvMax: number | null;
  nascerDoSol: string | null;
  porDoSol: string | null;
}

export interface ClimaDia {
  data: string;
  condicao: string;
  grupo: GrupoClima;
  tempMax: number | null;
  tempMin: number | null;
  sensacaoMax: number | null;
  sensacaoMin: number | null;
  chanceChuva: number | null;
  volumeChuva: number | null;
  ventoMax: number | null;
  uvMax: number | null;
  nascerDoSol: string | null;
  porDoSol: string | null;
}

export interface ClimaHora {
  hora: string;
  temp: number | null;
  condicao: string;
  grupo: GrupoClima;
  chanceChuva: number | null;
  volumeChuva: number | null;
  vento: number | null;
}

export interface ClimaCompleto {
  cidade: string;
  atual: ClimaAtual;
  dias: ClimaDia[];
  horas: ClimaHora[];
  atualizadoEm: string;
  desatualizado: boolean;
}

// ── Agenda / e-mails (simulados marcados até a integração Outlook) ──

export interface AgendaItem {
  id: string;
  hora: string;          // "10:00"
  titulo: string;
  tipo: 'reuniao' | 'tarefa' | 'lembrete';
  atrasado: boolean;
  simulado: boolean;
}

export interface ResumoEmails {
  naoLidos: number;
  importantes: number;
  aguardandoResposta: number;
  recebidosHoje: number;
  simulado: boolean;
}

// ── Insights por regras (briefing §22) ──────────────────────────────

export interface Insight {
  id: string;
  conclusao: string;
  evidencia: string;
  impacto: string;
  recomendacao: string;
  modulo: string;
  rota: string | null;
  tom: 'positivo' | 'atencao' | 'critico' | 'informativo';
  simulado: boolean;
}

// ── Saudação contextual ─────────────────────────────────────────────

export interface Saudacao {
  saudacao: string;        // "Boa noite"
  nome: string | null;
  frases: string[];        // mensagens contextuais curtas
}
