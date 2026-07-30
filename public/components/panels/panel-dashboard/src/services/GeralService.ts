// services/GeralService.ts — fontes de dados do painel Visão Geral.
// @version 2.0.0  @created 2026-07-29
//
// Cada função é INDEPENDENTE: um erro em uma fonte nunca derruba o painel
// inteiro (briefing §31.3) — as telas chamam cada uma com estado próprio.
//
// Fontes reais hoje: Trânsito (/api/traffic/summary.php), Ads Intelligence
// (/api/ads/status) e Anuncios/Decision Engine (/api/anuncios/stats.php).
// Demais módulos: resumo determinístico SIMULADO e marcado (decisão do Jhony
// 2026-07-29 — "simulados marcados") até cada integração real chegar.

import type {
  AlertaGeral, Atividade, DistribuicaoModulo, ModuloId, PeriodoId,
  PontoConsolidado, ResumoAds, ResumoAnuncios, ResumoModulo, ResumoTransito,
  StatusIntegracao,
} from '../domain/types';

// ── util ────────────────────────────────────────────────────────────

function mulberry32(sem: number) {
  let a = sem >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtN = (v: number) => v.toLocaleString('pt-BR');

const FATOR_PERIODO: Record<PeriodoId, number> = { hoje: 1 / 22, ontem: 1 / 22, '7d': 7 / 30, '30d': 1, mes_atual: Math.max(1, new Date().getDate()) / 30 };
const DIAS_PERIODO: Record<PeriodoId, number> = { hoje: 1, ontem: 1, '7d': 7, '30d': 30, mes_atual: Math.max(1, new Date().getDate()) };

async function getJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body || body.ok !== true) throw new Error('payload inválido');
    return body.data as T;
  } finally {
    clearTimeout(t);
  }
}

// ── Fontes reais ────────────────────────────────────────────────────

export async function getTransito(): Promise<ResumoTransito> {
  interface Bruto {
    level?: string; trafficIndex?: number | null; estimatedCongestionKm?: number | null;
    activeIncidents?: number | null; closures?: number; updatedAt?: string | null; stale?: boolean;
  }
  const d = await getJson<Bruto>('/api/traffic/summary.php');
  const atualizadoEm = d.updatedAt ?? null;
  const velho = atualizadoEm ? Date.now() - new Date(atualizadoEm).getTime() > 15 * 60000 : false;
  return {
    nivel: (d.level as ResumoTransito['nivel']) || 'unavailable',
    indice: d.trafficIndex ?? null,
    km: d.estimatedCongestionKm ?? null,
    ocorrencias: d.activeIncidents ?? null,
    interdicoes: d.closures ?? 0,
    atualizadoEm,
    desatualizado: !!d.stale || velho,
  };
}

export async function getAds(): Promise<ResumoAds> {
  interface Conta { active_campaigns?: number; cost?: number; }
  interface Bruto { provider?: string; accounts?: Conta[]; }
  const d = await getJson<Bruto>('/api/ads/status');
  const contas = d.accounts ?? [];
  return {
    contas: contas.length,
    campanhasAtivas: contas.reduce((s, c) => s + (c.active_campaigns ?? 0), 0),
    investimento: contas.reduce((s, c) => s + (c.cost ?? 0), 0),
    provedorReal: d.provider !== 'mock',
  };
}

export async function getAnuncios(): Promise<ResumoAnuncios> {
  interface Bruto {
    totais?: { conversas?: number; perguntas?: number; positivas?: number; negativas?: number };
    atividade?: { dia: string; n: number }[];
  }
  const d = await getJson<Bruto>('/api/anuncios/stats.php');
  return {
    conversas: d.totais?.conversas ?? 0,
    perguntas: d.totais?.perguntas ?? 0,
    positivas: d.totais?.positivas ?? 0,
    negativas: d.totais?.negativas ?? 0,
    atividade: d.atividade ?? [],
  };
}

// ── Resumos por módulo (§24) — reais adaptados + simulados marcados ─

export async function getResumoModulo(id: ModuloId, periodo: PeriodoId): Promise<ResumoModulo> {
  switch (id) {
    case 'transito': {
      const t = await getTransito();
      const rot = { normal: 'Normal', moderate: 'Moderado', intense: 'Intenso', unavailable: 'Indisponível' }[t.nivel];
      return {
        status: t.nivel === 'normal' ? 'ok' : t.nivel === 'moderate' ? 'atencao' : t.nivel === 'intense' ? 'critico' : 'indisponivel',
        statusRotulo: rot,
        metricas: [
          { rotulo: 'Índice', valor: t.indice === null ? '—' : `${t.indice}/100` },
          { rotulo: 'Lentidão', valor: t.km === null ? '—' : `${t.km} km` },
          { rotulo: 'Ocorrências', valor: t.ocorrencias === null ? '—' : fmtN(t.ocorrencias) },
          { rotulo: 'Interdições', valor: fmtN(t.interdicoes) },
        ],
        alerta: t.nivel === 'intense' ? 'Trânsito intenso na cidade — considere os prazos de entrega.' : null,
        atualizadoEm: t.atualizadoEm,
        simulado: false,
      };
    }
    case 'ads': {
      const a = await getAds();
      return {
        status: a.campanhasAtivas > 0 ? 'ok' : 'atencao',
        statusRotulo: a.provedorReal ? 'Conectado' : 'Modo de testes',
        metricas: [
          { rotulo: 'Contas', valor: fmtN(a.contas) },
          { rotulo: 'Campanhas ativas', valor: fmtN(a.campanhasAtivas) },
          { rotulo: 'Investimento', valor: fmtMoeda(a.investimento) },
        ],
        alerta: null,
        atualizadoEm: new Date().toISOString(),
        simulado: !a.provedorReal,
      };
    }
    case 'anuncios': {
      const a = await getAnuncios();
      const aprovacao = a.positivas + a.negativas > 0
        ? Math.round((a.positivas / (a.positivas + a.negativas)) * 100) : null;
      return {
        status: 'ok',
        statusRotulo: 'Operacional',
        metricas: [
          { rotulo: 'Conversas', valor: fmtN(a.conversas) },
          { rotulo: 'Perguntas', valor: fmtN(a.perguntas) },
          { rotulo: 'Aprovação', valor: aprovacao === null ? '—' : `${aprovacao}%`, bom: (aprovacao ?? 0) >= 80 },
        ],
        sparkline: a.atividade.slice(-14).map((p) => p.n),
        alerta: null,
        atualizadoEm: new Date().toISOString(),
        simulado: false,
      };
    }
    default:
      return resumoSimulado(id, periodo);
  }
}

/** Gerador determinístico dos módulos ainda sem integração real. */
function resumoSimulado(id: ModuloId, periodo: PeriodoId): Promise<ResumoModulo> {
  const rnd = mulberry32(20260729 + id.length * 7919);
  const f = FATOR_PERIODO[periodo];
  const spark = Array.from({ length: 14 }, () => Math.round(20 + rnd() * 80));
  const esc = (base: number) => Math.max(1, Math.round(base * f * (0.85 + rnd() * 0.3)));

  const mapa: Record<string, ResumoModulo> = {
    metaads: {
      status: 'ok', statusRotulo: 'Saudável',
      metricas: [
        { rotulo: 'Investimento', valor: fmtMoeda(esc(14800)) },
        { rotulo: 'Leads', valor: fmtN(esc(310)) },
        { rotulo: 'CPL', valor: fmtMoeda(16 + Math.round(rnd() * 8)) },
        { rotulo: 'Campanhas ativas', valor: fmtN(6) },
      ],
      sparkline: spark, alerta: null, atualizadoEm: new Date().toISOString(), simulado: true,
    },
    mercadolivre: {
      status: 'atencao', statusRotulo: 'Atenção',
      metricas: [
        { rotulo: 'Pedidos', valor: fmtN(esc(184)) },
        { rotulo: 'Faturamento', valor: fmtMoeda(esc(96200)) },
        { rotulo: 'Perguntas', valor: fmtN(Math.max(1, Math.round(9 * (periodo === 'hoje' ? 1 : 1)))) , ruim: true },
        { rotulo: 'Reclamações', valor: fmtN(3), ruim: true },
      ],
      sparkline: spark, alerta: '9 perguntas aguardando resposta há mais de 2h.',
      atualizadoEm: new Date().toISOString(), simulado: true,
    },
    pipedrive: {
      status: 'ok', statusRotulo: 'Operacional',
      metricas: [
        { rotulo: 'Negócios abertos', valor: fmtN(47) },
        { rotulo: 'Valor do funil', valor: fmtMoeda(842000) },
        { rotulo: 'Ativ. atrasadas', valor: fmtN(6), ruim: true },
        { rotulo: 'Conversão', valor: '18%' },
      ],
      sparkline: spark, alerta: null, atualizadoEm: new Date().toISOString(), simulado: true,
    },
    outlook: {
      status: 'ok', statusRotulo: 'Sincronizado',
      metricas: [
        { rotulo: 'Não lidos', valor: fmtN(23) },
        { rotulo: 'Recebidos', valor: fmtN(esc(240)) },
        { rotulo: 'Aguardando resposta', valor: fmtN(7) },
      ],
      sparkline: spark, alerta: null, atualizadoEm: new Date().toISOString(), simulado: true,
    },
    ecommerce: {
      status: 'ok', statusRotulo: 'Saudável',
      metricas: [
        { rotulo: 'Pedidos', valor: fmtN(esc(92)) },
        { rotulo: 'Faturamento', valor: fmtMoeda(esc(58400)) },
        { rotulo: 'Ticket médio', valor: fmtMoeda(635) },
        { rotulo: 'Estoque crítico', valor: fmtN(4), ruim: true },
      ],
      sparkline: spark, alerta: null, atualizadoEm: new Date().toISOString(), simulado: true,
    },
    compras: {
      status: 'atencao', statusRotulo: '3 pendências',
      metricas: [
        { rotulo: 'Solicitações', valor: fmtN(esc(31)) },
        { rotulo: 'Pedidos pendentes', valor: fmtN(8) },
        { rotulo: 'Valor em aberto', valor: fmtMoeda(127000) },
        { rotulo: 'Itens atrasados', valor: fmtN(3), ruim: true },
      ],
      sparkline: spark, alerta: '3 itens com prazo de entrega estourado.',
      atualizadoEm: new Date().toISOString(), simulado: true,
    },
    financeiro: {
      status: 'atencao', statusRotulo: 'Atenção',
      metricas: [
        { rotulo: 'Recebíveis', valor: fmtMoeda(318000) },
        { rotulo: 'Vencidos', valor: fmtMoeda(24600), ruim: true },
        { rotulo: 'Saldo previsto 30d', valor: fmtMoeda(196000), bom: true },
      ],
      sparkline: spark, alerta: null, atualizadoEm: new Date().toISOString(), simulado: true,
    },
    datatables: {
      status: 'ok', statusRotulo: 'Operacional',
      metricas: [
        { rotulo: 'Tabelas ativas', valor: fmtN(38) },
        { rotulo: 'Registros', valor: `${(2.4).toLocaleString('pt-BR')} mi` },
        { rotulo: 'Jobs com erro', valor: fmtN(0), bom: true },
      ],
      sparkline: spark, alerta: null, atualizadoEm: new Date().toISOString(), simulado: true,
    },
  };
  return Promise.resolve(mapa[id]);
}

// ── Alertas consolidados (§28) ──────────────────────────────────────

export async function getAlertas(): Promise<AlertaGeral[]> {
  if (cenarioAtual() === 'vazio') return []; // §45: testa o estado vazio
  const alertas: AlertaGeral[] = [];
  // Trânsito real vira alerta quando intenso/desatualizado.
  try {
    const t = await getTransito();
    if (t.nivel === 'intense') {
      alertas.push({
        id: 'transito-intenso', severidade: 2, modulo: 'Trânsito',
        descricao: `Trânsito intenso em São Paulo (índice ${t.indice}/100)`,
        impacto: 'Entregas e deslocamentos podem atrasar hoje.',
        rota: '#/panel-transito-sp', simulado: false,
      });
    } else if (t.desatualizado) {
      alertas.push({
        id: 'transito-desatualizado', severidade: 3, modulo: 'Trânsito',
        descricao: 'Dados de trânsito desatualizados',
        impacto: 'A última atualização tem mais de 15 minutos.',
        rota: '#/panel-transito-sp', simulado: false,
      });
    }
  } catch { /* fonte fora não bloqueia os demais */ }

  // Consolidação dos módulos em demonstração (marcados).
  alertas.push(
    {
      id: 'ml-perguntas', severidade: 2, modulo: 'Mercado Livre',
      descricao: '9 perguntas sem resposta há mais de 2 horas',
      impacto: 'Tempo de resposta afeta reputação e conversão.',
      rota: '#/panel-mercadolivre/perguntas', simulado: true,
    },
    {
      id: 'compras-atraso', severidade: 2, modulo: 'Compras',
      descricao: '3 itens de compra com prazo estourado',
      impacto: 'Risco de ruptura de estoque nos itens afetados.',
      rota: '#/panel-05', simulado: true,
    },
    {
      id: 'fin-vencidos', severidade: 1, modulo: 'Financeiro',
      descricao: 'R$ 24,6 mil em recebimentos vencidos',
      impacto: 'Fluxo de caixa do mês comprometido se não cobrado.',
      rota: '#/panel-05', simulado: true,
    },
    {
      id: 'pd-atividades', severidade: 3, modulo: 'Pipedrive',
      descricao: '6 atividades comerciais atrasadas',
      impacto: 'Negócios podem esfriar sem follow-up.',
      rota: '#/panel-pipedrive', simulado: true,
    },
  );
  if (cenarioAtual() === 'critico') { // §45: testa a hierarquia sob estresse
    alertas.push(
      {
        id: 'qa-estoque', severidade: 1, modulo: 'E-commerce',
        descricao: 'Estoque zerado em 4 produtos campeões de venda',
        impacto: 'Vendas sendo recusadas agora (cenário de QA).',
        rota: '#/panel-05', simulado: true,
      },
      {
        id: 'qa-gasto', severidade: 1, modulo: 'Meta Ads',
        descricao: 'Gasto 3× acima do teto diário nas campanhas ativas',
        impacto: 'Orçamento do mês em risco (cenário de QA).',
        rota: '#/panel-metaads', simulado: true,
      },
    );
  }
  return alertas.sort((a, b) => a.severidade - b.severidade);
}

// ── Atividades recentes (§27) — simuladas até o feed real ──────────

export function getAtividades(): Promise<Atividade[]> {
  if (cenarioAtual() === 'vazio') return Promise.resolve([]); // §45
  const agora = Date.now();
  const min = (m: number) => new Date(agora - m * 60000).toISOString();
  const itens: Atividade[] = [
    { id: 'a1', descricao: 'Sincronização do Ads Intelligence concluída', modulo: 'Ads', categoria: 'sistema' as const, quando: min(4), rota: '#/panel-ads', simulado: false },
    { id: 'a2', descricao: 'Pedido #34120 aprovado', modulo: 'Mercado Livre', categoria: 'vendas' as const, quando: min(12), rota: '#/panel-mercadolivre/pedidos', simulado: true },
    { id: 'a3', descricao: 'Nova consulta respondida pelo Consultor', modulo: 'Anuncios', categoria: 'marketing' as const, quando: min(26), rota: '#/panel-anuncios', simulado: false },
    { id: 'a4', descricao: 'Lead recebido — Painel LED Igrejas', modulo: 'Meta Ads', categoria: 'marketing' as const, quando: min(41), rota: '#/panel-metaads/leads', simulado: true },
    { id: 'a5', descricao: 'Negócio "Telão Colégio Saber" movido para Proposta', modulo: 'Pipedrive', categoria: 'vendas' as const, quando: min(58), rota: '#/panel-pipedrive', simulado: true },
    { id: 'a6', descricao: 'Pagamento de R$ 8.400 conciliado', modulo: 'Financeiro', categoria: 'financeiro' as const, quando: min(75), rota: null, simulado: true },
    { id: 'a7', descricao: 'Alerta de estoque crítico: Painel Outdoor P5', modulo: 'E-commerce', categoria: 'operacoes' as const, quando: min(96), rota: null, simulado: true },
    { id: 'a8', descricao: 'Relatório semanal de mídia gerado', modulo: 'Ads', categoria: 'marketing' as const, quando: min(140), rota: '#/panel-ads/relatorios', simulado: true },
  ];
  return Promise.resolve(itens);
}

// ── Integrações (§26.3) ─────────────────────────────────────────────

export async function getIntegracoes(): Promise<StatusIntegracao[]> {
  const out: StatusIntegracao[] = [];
  const agora = new Date().toISOString();

  try {
    const t = await getTransito();
    out.push({
      nome: 'Trânsito SP', detalhe: 'Fonte pública de mobilidade',
      estado: t.desatualizado ? 'desatualizada' : 'conectada',
      ultimaSync: t.atualizadoEm,
    });
  } catch {
    out.push({ nome: 'Trânsito SP', detalhe: 'Fonte pública de mobilidade', estado: 'erro', ultimaSync: null });
  }

  try {
    const a = await getAds();
    out.push({
      nome: 'Google Ads', detalhe: `${a.contas} conta(s) · ${a.campanhasAtivas} campanhas`,
      estado: a.provedorReal ? 'conectada' : 'demonstracao', ultimaSync: agora,
    });
  } catch {
    out.push({ nome: 'Google Ads', detalhe: 'Ads Intelligence', estado: 'erro', ultimaSync: null });
  }

  try {
    await getAnuncios();
    out.push({ nome: 'Decision Engine', detalhe: 'Consultor de Google Ads (metodologia Dshow)', estado: 'conectada', ultimaSync: agora });
  } catch {
    out.push({ nome: 'Decision Engine', detalhe: 'Consultor de Google Ads', estado: 'erro', ultimaSync: null });
  }

  out.push(
    { nome: 'Meta Ads', detalhe: 'Aguardando conexão OAuth', estado: 'demonstracao', ultimaSync: null },
    { nome: 'Mercado Livre', detalhe: 'Aguardando conexão OAuth', estado: 'demonstracao', ultimaSync: null },
    { nome: 'Pipedrive', detalhe: 'CRM comercial', estado: 'demonstracao', ultimaSync: null },
    { nome: 'Outlook / 365', detalhe: 'E-mails e agenda', estado: 'demonstracao', ultimaSync: null },
  );
  if (cenarioAtual() === 'critico') { // §45: 2 fontes caem no cenário de QA
    for (const nome of ['Meta Ads', 'Mercado Livre']) {
      const i = out.findIndex((o) => o.nome === nome);
      if (i >= 0) out[i] = { ...out[i], estado: 'erro', detalhe: 'Falha simulada (cenário de QA)', ultimaSync: null };
    }
  }
  return out;
}

// ── Série consolidada + distribuição (§26) — demonstração ──────────

export function getSerieConsolidada(periodo: PeriodoId): Promise<PontoConsolidado[]> {
  const rnd = mulberry32(20260729);
  const dias = Math.max(7, DIAS_PERIODO[periodo]); // "hoje" mostra a semana p/ contexto
  const pontos: PontoConsolidado[] = [];
  for (let d = dias - 1; d >= 0; d--) {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    const fds = dt.getDay() === 0 ? 0.55 : dt.getDay() === 6 ? 0.75 : 1;
    pontos.push({
      dia: dt.toISOString().slice(0, 10),
      pedidos: Math.round((9 + rnd() * 7) * fds),
      faturamento: Math.round((5200 + rnd() * 3800) * fds),
      investimento: Math.round((640 + rnd() * 260) * fds),
      leads: Math.round((11 + rnd() * 9) * fds),
      recebimentos: Math.round((4300 + rnd() * 5200) * fds),
    });
  }
  return Promise.resolve(pontos);
}

export function getDistribuicao(): Promise<DistribuicaoModulo[]> {
  return Promise.resolve([
    { rotulo: 'Mercado Livre', valor: 34 },
    { rotulo: 'Ads Intelligence', valor: 22 },
    { rotulo: 'Meta Ads', valor: 16 },
    { rotulo: 'Pipedrive', valor: 11 },
    { rotulo: 'E-commerce', valor: 9 },
    { rotulo: 'Financeiro', valor: 5 },
    { rotulo: 'Outros', valor: 3 },
  ]);
}

// ── Cenários de demonstração (§45 — seletor OCULTO de QA) ───────────
// 'vazio' mostra a Home sem eventos (testa estados vazios); 'critico'
// força alertas graves e integrações em erro (testa a hierarquia visual).
// Ativação escondida: 5 cliques rápidos no título "Principal".

export type CenarioMock = 'padrao' | 'vazio' | 'critico';
const K_CENARIO = 'dshow.home.cenario';

export function cenarioAtual(): CenarioMock {
  try {
    const c = window.localStorage.getItem(K_CENARIO);
    return c === 'vazio' || c === 'critico' ? c : 'padrao';
  } catch { return 'padrao'; }
}

export function alternarCenario(): CenarioMock {
  const ordem: CenarioMock[] = ['padrao', 'vazio', 'critico'];
  const prox = ordem[(ordem.indexOf(cenarioAtual()) + 1) % ordem.length];
  try {
    if (prox === 'padrao') window.localStorage.removeItem(K_CENARIO);
    else window.localStorage.setItem(K_CENARIO, prox);
  } catch { /* sem storage */ }
  return prox;
}

// ── Preferências de widgets (§30 — fase 1: mostrar/ocultar) ─────────

const PREF_KEY = 'dshow.geral.widgets.ocultos';

export function lerOcultos(): Set<ModuloId> {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr as ModuloId[]);
  } catch {
    return new Set();
  }
}

export function salvarOcultos(ocultos: Set<ModuloId>): void {
  try {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(Array.from(ocultos)));
  } catch { /* sem storage */ }
}

export function restaurarPadrao(): void {
  try { window.localStorage.removeItem(PREF_KEY); } catch { /* sem storage */ }
}
