// domain/types.ts — modelo de domínio do módulo Mercado Livre.
// @version 1.0.0  @created 2026-07-28
//
// Estes tipos são o CONTRATO entre as telas e a camada de serviço.
// As telas nunca conhecem a origem dos dados (mock ou API real) — briefing §1.

export interface ShellConfig {
  signal?: AbortSignal;
  flag?: { key: string; enabled: boolean; payload: unknown; source: string };
  [k: string]: unknown;
}

// ── Períodos e filtros globais ──────────────────────────────────────

export type PeriodoId =
  | 'hoje' | 'ontem' | '7d' | '15d' | '30d'
  | 'mes_atual' | 'mes_anterior' | 'trimestre' | 'ano' | '12m';

export type ComparacaoId = 'anterior' | 'mes_anterior' | 'ano_anterior' | 'nenhuma';

export interface FiltrosGlobais {
  contaId: string | 'todas';
  periodo: PeriodoId;
  comparacao: ComparacaoId;
}

// ── Conta ───────────────────────────────────────────────────────────

export type NivelReputacao = 'verde_escuro' | 'verde' | 'amarelo' | 'laranja' | 'vermelho';

export interface Conta {
  id: string;
  nome: string;
  nickname: string;
  site: string;              // MLB (Brasil)
  status: 'ativa' | 'atencao' | 'suspensa';
  reputacao: NivelReputacao;
  ultimaSincronizacao: string; // ISO
}

// ── KPIs / visão geral ──────────────────────────────────────────────

export type Tendencia = 'positiva' | 'negativa' | 'neutra';

export interface Kpi {
  id: string;
  rotulo: string;
  valor: number;
  formato: 'moeda' | 'numero' | 'percentual';
  variacaoPct: number | null;   // vs comparação
  variacaoAbs: number | null;
  tendencia: Tendencia;         // semântica CONTEXTUAL (↑ reclamação = negativa)
  sparkline: number[];
  dica?: string;
  drill?: SecaoId;              // para onde o clique leva
}

export interface PontoSerie { dia: string; [metrica: string]: number | string; }

export interface FunilEtapa { rotulo: string; valor: number; }

export interface DistribuicaoItem { rotulo: string; valor: number; extra?: string; }

export interface AtencaoItem {
  id: string;
  titulo: string;
  detalhe: string;
  prioridade: 1 | 2 | 3;        // 1 = crítico
  secao: SecaoId;
  prazo?: string;
  acao: string;
}

export interface Overview {
  kpis: Kpi[];
  serie: PontoSerie[];          // faturamento/pedidos/ticket por dia
  funil: FunilEtapa[];
  porCategoria: DistribuicaoItem[];
  porEstado: DistribuicaoItem[]; // rotulo = UF
  atencao: AtencaoItem[];
}

// ── Pedidos ─────────────────────────────────────────────────────────

export type StatusPedido =
  | 'novo' | 'pago' | 'faturado' | 'separacao' | 'enviado'
  | 'entregue' | 'cancelado' | 'devolvido';

export interface Pedido {
  id: string;
  data: string;                 // ISO
  comprador: string;
  uf: string;
  cidade: string;
  produto: string;
  sku: string;
  anuncioId: string;
  quantidade: number;
  valorBruto: number;
  tarifa: number;
  frete: number;
  valorLiquido: number;
  status: StatusPedido;
  envio: 'full' | 'flex' | 'correios' | 'coleta';
  prazoEnvio: string | null;    // ISO
  atrasado: boolean;
  notaFiscal: string | null;
  temReclamacao: boolean;
  contaId: string;
}

export interface EventoPedido { data: string; titulo: string; detalhe?: string; }

export interface PedidoDetalhe extends Pedido {
  timeline: EventoPedido[];
  pagamento: { metodo: string; parcelas: number; status: string };
  endereco: string;
  mensagens: number;
  observacoes: string[];
}

// ── Anúncios / produtos / estoque ───────────────────────────────────

export type StatusAnuncio = 'ativo' | 'pausado' | 'encerrado' | 'em_revisao' | 'erro';

export interface Anuncio {
  id: string;
  titulo: string;
  sku: string;
  categoria: string;
  tipo: 'classico' | 'premium';
  preco: number;
  precoPromocional: number | null;
  estoque: number;
  visitas: number;
  vendas: number;
  conversaoPct: number;
  faturamento: number;
  tarifaPct: number;
  margemPct: number;
  status: StatusAnuncio;
  qualidade: number;            // 0-100
  fatoresQualidade: { fator: string; impacto: number }[]; // impacto ±
  contaId: string;
}

export interface Produto {
  sku: string;
  nome: string;
  categoria: string;
  anunciosVinculados: number;
  estoqueTotal: number;
  estoqueDisponivel: number;
  estoqueReservado: number;
  custo: number;
  precoMedio: number;
  faturamento: number;
  unidadesVendidas: number;
  margemPct: number;
  coberturaDias: number;        // estoque / venda média diária
  giro: 'alto' | 'baixo';
  margem: 'alta' | 'baixa';
  status: 'ok' | 'critico' | 'zerado' | 'excesso' | 'parado';
}

// ── Perguntas / atendimento / ocorrências ───────────────────────────

export interface Pergunta {
  id: string;
  data: string;
  anuncioId: string;
  produto: string;
  comprador: string;
  texto: string;
  status: 'pendente' | 'respondida';
  resposta: string | null;
  horasAguardando: number;
  assunto: string;              // frete, prazo, especificação, garantia...
  contaId: string;
}

export type TipoOcorrencia = 'reclamacao' | 'mediacao' | 'cancelamento' | 'devolucao';

export interface Ocorrencia {
  id: string;
  tipo: TipoOcorrencia;
  pedidoId: string;
  cliente: string;
  produto: string;
  motivo: string;
  status: 'aberta' | 'em_andamento' | 'resolvida';
  abertura: string;
  prazo: string | null;
  valor: number;
  contaId: string;
}

// ── Envios ──────────────────────────────────────────────────────────

export interface Envio {
  id: string;
  pedidoId: string;
  modalidade: 'full' | 'flex' | 'correios' | 'coleta';
  status: 'preparando' | 'em_transito' | 'entregue' | 'atrasado' | 'devolvido';
  uf: string;
  cidade: string;
  postado: string | null;
  previsao: string;
  entregue: string | null;
  diasTransito: number | null;
  rastreio: string;
  contaId: string;
}

// ── Financeiro / rentabilidade ──────────────────────────────────────

export interface ResumoFinanceiro {
  vendasBrutas: number;
  descontos: number;
  tarifas: number;
  fretes: number;
  impostosEstimados: number;
  cancelamentos: number;
  devolucoes: number;
  custoProdutos: number;
  valorLiquido: number;
  lucroBruto: number;
  margemPct: number;
  aReceber: number;
  recebido: number;
}

export interface LancamentoFinanceiro {
  pedidoId: string;
  dataVenda: string;
  dataPrevista: string;
  dataRecebimento: string | null;
  valorBruto: number;
  tarifa: number;
  frete: number;
  valorLiquido: number;
  status: 'recebido' | 'pendente' | 'divergente';
  contaId: string;
}

export interface RentabilidadeItem {
  sku: string;
  nome: string;
  categoria: string;
  receita: number;
  custo: number;
  tarifa: number;
  frete: number;
  lucro: number;
  margemPct: number;
  unidades: number;
}

// ── Reputação / alertas / sync ──────────────────────────────────────

export interface ReputacaoSnapshot {
  nivel: NivelReputacao;
  vendasConcluidas: number;
  reclamacoesPct: number;
  cancelamentosPct: number;
  atrasosPct: number;
  serie: { dia: string; score: number; reclamacoes: number; atrasos: number }[];
  fatoresRisco: string[];
}

export interface Alerta {
  id: string;
  tipo: string;
  mensagem: string;
  prioridade: 1 | 2 | 3;
  data: string;
  secao: SecaoId;
  tratado: boolean;
}

export interface SyncJob {
  recurso: string;
  status: 'ok' | 'executando' | 'erro';
  ultima: string;
  proxima: string;
  processados: number;
  novos: number;
  erros: number;
}

// ── Navegação interna ───────────────────────────────────────────────

export type SecaoId =
  | 'visao-geral' | 'central' | 'pedidos' | 'vendas' | 'anuncios'
  | 'produtos' | 'estoque' | 'precos' | 'perguntas' | 'mensagens'
  | 'reclamacoes' | 'devolucoes' | 'envios' | 'reputacao' | 'financeiro'
  | 'rentabilidade' | 'clientes' | 'concorrencia' | 'relatorios'
  | 'alertas' | 'automacoes' | 'sincronizacao' | 'config';

// ── Cenários de demonstração (briefing §35.3) ───────────────────────

export type CenarioId =
  | 'saudavel' | 'pico_vendas' | 'crise_logistica'
  | 'queda_reputacao' | 'estoque_critico' | 'falha_sync' | 'sem_dados';
