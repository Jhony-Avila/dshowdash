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
  AlertaGeral, FaltaConexao, ModuloId, PeriodoId,
  ResumoAds, ResumoAnuncios, ResumoModulo, ResumoTransito,
  SaudeTransito, StatusIntegracao,
} from '../domain/types';

// ── util ────────────────────────────────────────────────────────────

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtN = (v: number) => v.toLocaleString('pt-BR');


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
  // resumo e saúde em paralelo: a saúde (health.php) nunca derruba o resumo
  const [d, saude] = await Promise.all([getJson<Bruto>('/api/traffic/summary.php'), getSaudeTransito()]);
  const atualizadoEm = d.updatedAt ?? null;
  const velho = atualizadoEm ? Date.now() - new Date(atualizadoEm).getTime() > 15 * 60000 : false;
  return {
    nivel: (d.level as ResumoTransito['nivel']) || 'unavailable',
    indice: d.trafficIndex ?? null,
    km: d.estimatedCongestionKm ?? null,
    ocorrencias: d.activeIncidents ?? null,
    interdicoes: d.closures ?? null,   // sem dado = null (antes virava 0)
    atualizadoEm,
    desatualizado: !!d.stale || velho,
    saude,
  };
}

/** Saúde do FLUXO do trânsito (health.php). Contrato novo (f9dc7e8d): status up|parcial|down + motivo. Servidor antigo (sem `status`)
 *  ou falha da consulta = null — a tela decide só pelo resumo. */
export async function getSaudeTransito(): Promise<SaudeTransito | null> {
  try {
    const d = await getJson<{ status?: string; motivo?: string | null }>('/api/traffic/health.php', 6000);
    return d.status === 'up' || d.status === 'parcial' || d.status === 'down' ? { status: d.status, motivo: d.motivo ?? null } : null;
  } catch { return null; }
}

/** Motivo da saúde do trânsito em uma linha, sem jargão do provedor. */
export function motivoTransito(t: ResumoTransito): string {
  const m = t.saude?.motivo ?? '';
  if (t.saude?.status === 'down') {
    if (/cota/.test(m)) return 'O fornecedor do trânsito recusou a consulta por limite de uso.';
    if (/chave/.test(m)) return 'O fornecedor do trânsito recusou a chave de acesso.';
    if (/servidor/.test(m)) return 'O fornecedor do trânsito está com erro no servidor dele.';
    return 'O fornecedor do trânsito não respondeu.';
  }
  const parcial = /fluxo_parcial_(\d+)_de_(\d+)/.exec(m);
  if (parcial) return `Só ${parcial[1]} de ${parcial[2]} vias foram lidas.`;
  if (/fluxo_vazio/.test(m) || (t.indice === null && t.nivel === 'unavailable')) return 'O fornecedor não devolveu o fluxo das vias; sem índice de trânsito.';
  if (/ocorrencias_indisponiveis/.test(m)) return 'As ocorrências estão indisponíveis no fornecedor.';
  if (/retrato_velho/.test(m) || t.desatualizado) return 'A última leitura válida é antiga.';
  return 'A leitura do trânsito veio incompleta.';
}

/** Trânsito com problema? (sem índice, saúde parcial/down, ou retrato desatualizado) */
export const transitoComProblema = (t: ResumoTransito) =>
  t.nivel === 'unavailable' || t.indice === null || t.saude?.status === 'parcial' || t.saude?.status === 'down' || t.desatualizado;

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

export interface ResumoAgenda {
  hoje: number;
  proximaTitulo: string | null;
  proximaHora: string | null;
  convitesPendentes: number;
  conflitos: number;
  livreMin: number;
  estado: string;
  simulado: boolean;
}

/**
 * Resumo da agenda para o widget da home.
 *
 * Usa `/header/summary`, o mesmo endpoint enxuto do ícone do header — a home
 * não precisa (nem deve) arrastar a agenda inteira para mostrar quatro números.
 */
export async function getAgenda(): Promise<ResumoAgenda> {
  interface Prox { summary?: string; start?: string }
  interface Bruto {
    estado?: string; hoje?: number; proxima?: Prox | null;
    convites_pendentes?: number; conflitos?: number; livre_min?: number; mock?: boolean;
  }
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  const d = await getJson<Bruto>('/api/google-calendar/header/summary?tz=' + encodeURIComponent(tz));
  const hora = d.proxima?.start
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
        .format(new Date(d.proxima.start))
    : null;
  return {
    hoje: d.hoje ?? 0,
    proximaTitulo: d.proxima?.summary ?? null,
    proximaHora: hora,
    convitesPendentes: d.convites_pendentes ?? 0,
    conflitos: d.conflitos ?? 0,
    livreMin: d.livre_min ?? 0,
    estado: d.estado ?? 'connected',
    simulado: !!d.mock,
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

// ── Pipedrive (REAL, 23/11/2026): /api/pipedrive/overview — base local sincronizada (PIPE_DSHOW), nível ≥ 50 no servidor ──
// Geral 1.1: campo ausente ou não numérico = null (SEM DADO) — nunca 0. Zero só quando o servidor disse zero.
export interface ResumoPipedrive {
  abertos: number | null; valorAberto: number | null; negociosVencidos: number | null; conversao: number | null; atualizadoEm: string | null;
}
const numOuNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
export async function getPipedrive(): Promise<ResumoPipedrive> {
  interface Bruto {
    overview?: { deals?: { abertos?: unknown; valor_aberto?: unknown; taxa_conversao?: unknown }; atividades?: { negocios_abertos_com_vencida?: unknown } };
    runs?: { status?: string; finished_at?: string | null }[];
  }
  const d = await getJson<Bruto>('/api/pipedrive/overview');
  const ok = (d.runs ?? []).find((r) => r.status === 'completed' && r.finished_at);
  // pipe_sync_runs grava a hora LOCAL do servidor (America/Sao_Paulo, −03:00, sem horário de verão)
  const quando = ok?.finished_at ? new Date(ok.finished_at.replace(' ', 'T') + '-03:00').toISOString() : null;
  return {
    abertos: numOuNull(d.overview?.deals?.abertos),
    valorAberto: numOuNull(d.overview?.deals?.valor_aberto),
    // NEGÓCIOS abertos distintos com atividade vencida (não atividades): campo novo do overview; servidor antigo sem ele = sem dado
    negociosVencidos: numOuNull(d.overview?.atividades?.negocios_abertos_com_vencida),
    conversao: numOuNull(d.overview?.deals?.taxa_conversao),
    atualizadoEm: quando,
  };
}

/** O QUE FALTA para cada módulo sem fonte real — só textos confirmados pelo Jhony (23/11/2026). Nada de número. */
export const FALTA: Partial<Record<ModuloId, FaltaConexao>> = {
  mercadolivre: { texto: 'Aplicativo em criação.', com: 'Walter', rota: '#/panel-mercadolivre', rotuloLink: 'Abrir Mercado Livre' },
  metaads: { texto: 'Falta o usuário de leitura.', com: 'Diogo', rota: '#/panel-metaads', rotuloLink: 'Abrir Meta Ads' },
  ads: { texto: 'Falta o acesso no Google Cloud (Walter) e a leitura nas contas (Diogo).', com: null, rota: '#/panel-ads', rotuloLink: 'Abrir Ads Intelligence' },
  financeiro: { texto: 'Asaas em auditoria; faltam as chaves.', com: null, rota: null },
  ecommerce: { texto: 'Loja Integrada: falta definir o dono da conta.', com: null, rota: null },
  compras: { texto: 'O módulo de compras ainda não existe; depende da integração Bling (central de compras).', com: null, rota: null },
  datatables: { texto: 'O painel DataTables já existe; falta o resumo dele nesta página.', com: null, rota: '#/panel-datatables', rotuloLink: 'Abrir DataTables' },
};
/** Módulos que HOJE não têm fonte (sem pedido nenhum): vão direto para a faixa "Aguardando conexão", sem caixa vazia na grade. */
export const SEM_FONTE: ReadonlySet<ModuloId> = new Set<ModuloId>(['metaads', 'mercadolivre', 'ecommerce', 'financeiro', 'compras', 'datatables']);

/** (B) Cartão de módulo SEM fonte real: nenhum número inventado — só o estado "Aguardando conexão" com o que falta. */
function aguardandoConexao(id: ModuloId): ResumoModulo {
  return { status: 'indisponivel', statusRotulo: 'Aguardando conexão', metricas: [], alerta: null, atualizadoEm: null, simulado: false, estado: 'aguardando', falta: FALTA[id] };
}

// ── Resumos por módulo (§24) — reais adaptados + simulados marcados ─

export async function getResumoModulo(id: ModuloId, periodo: PeriodoId): Promise<ResumoModulo> {
  switch (id) {
    case 'transito': {
      const t = await getTransito();
      const rot = { normal: 'Normal', moderate: 'Moderado', intense: 'Intenso', unavailable: 'Indisponível' }[t.nivel];
      if (transitoComProblema(t)) {
        // COM PROBLEMA: o que falhou + último sucesso; com índice válido (retrato antigo), os números ficam marcados como desatualizados
        const temValor = t.indice !== null;
        return {
          status: 'critico', statusRotulo: 'Com problema', estado: 'problema', desatualizado: temValor,
          problema: { motivo: motivoTransito(t), ultimoSucesso: temValor ? t.atualizadoEm : null },
          metricas: temValor ? [
            { rotulo: 'Índice', valor: `${t.indice}/100` },
            { rotulo: 'Lentidão', valor: t.km === null ? '—' : `${t.km} km` },
            { rotulo: 'Ocorrências', valor: t.ocorrencias === null ? '—' : fmtN(t.ocorrencias) },
          ] : [],
          alerta: null, atualizadoEm: temValor ? t.atualizadoEm : null, simulado: false,
        };
      }
      return {
        status: t.nivel === 'normal' ? 'ok' : t.nivel === 'moderate' ? 'atencao' : t.nivel === 'intense' ? 'critico' : 'indisponivel',
        statusRotulo: rot,
        metricas: [
          { rotulo: 'Índice', valor: t.indice === null ? '—' : `${t.indice}/100` },
          { rotulo: 'Lentidão', valor: t.km === null ? '—' : `${t.km} km` },
          { rotulo: 'Ocorrências', valor: t.ocorrencias === null ? '—' : fmtN(t.ocorrencias) },
          { rotulo: 'Interdições', valor: t.interdicoes === null ? '—' : fmtN(t.interdicoes) },
        ],
        alerta: t.nivel === 'intense' ? 'Trânsito intenso na cidade — considere os prazos de entrega.' : null,
        atualizadoEm: t.atualizadoEm,
        simulado: false,
      };
    }
    case 'ads': {
      const a = await getAds();
      if (!a.provedorReal) return aguardandoConexao('ads');   // 23/11/2026: provedor mock = sem dado real → nenhum número
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
    case 'google-calendar': {
      const g = await getAgenda();
      const h = Math.floor(g.livreMin / 60);
      const m = g.livreMin % 60;
      return {
        status: g.estado === 'error' || g.estado === 'not_connected' ? 'critico'
              : g.conflitos > 0 || g.convitesPendentes > 0 ? 'atencao' : 'ok',
        statusRotulo: g.estado === 'not_connected' ? 'Sem conta'
                    : g.simulado ? 'Modo de testes' : 'Conectado',
        metricas: [
          { rotulo: 'Hoje', valor: fmtN(g.hoje) },
          { rotulo: 'Próxima', valor: g.proximaHora ?? '—' },
          { rotulo: 'Convites', valor: fmtN(g.convitesPendentes) },
          { rotulo: 'Livre', valor: g.livreMin > 0 ? (h > 0 ? `${h}h${m ? String(m).padStart(2, '0') : ''}` : `${m}min`) : '—' },
        ],
        alerta: g.conflitos > 0
          ? `${g.conflitos} conflito(s) na agenda de hoje.`
          : (g.proximaTitulo ? `Próxima: ${g.proximaTitulo}` : null),
        atualizadoEm: new Date().toISOString(),
        simulado: g.simulado,
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
    case 'pipedrive': {
      try {
        const p = await getPipedrive();
        const nv = p.negociosVencidos;
        if (p.abertos === null && p.valorAberto === null && nv === null) {
          // resposta sem nenhum dado utilizável: o ESTADO, nunca zeros
          return { status: 'indisponivel', statusRotulo: 'Sem dados', metricas: [], alerta: null, atualizadoEm: null, simulado: false };
        }
        return {
          status: nv === null ? 'indisponivel' : nv > 0 ? 'atencao' : 'ok',
          statusRotulo: nv === null ? 'Sem dado de atividades' : nv > 0 ? `${fmtN(nv)} negócio(s) com atividade vencida` : 'Em dia',
          metricas: [
            { rotulo: 'Negócios abertos', valor: p.abertos === null ? '—' : fmtN(p.abertos) },
            { rotulo: 'Valor do funil', valor: p.valorAberto === null ? '—' : fmtMoeda(p.valorAberto) },
            { rotulo: 'Negócios c/ ativ. vencida', valor: nv === null ? '—' : fmtN(nv), ruim: nv !== null && nv > 0 },
            { rotulo: 'Conversão', valor: p.conversao === null ? '—' : `${p.conversao.toLocaleString('pt-BR')}%` },
          ],
          alerta: null,
          atualizadoEm: p.atualizadoEm,
          simulado: false,
        };
      } catch (e) {
        // sem permissão (nível < 50) ou fonte fora: NUNCA número inventado
        const semAcesso = e instanceof Error && /HTTP 40[13]/.test(e.message);
        if (semAcesso) return { status: 'indisponivel', statusRotulo: 'Sem acesso', metricas: [], alerta: 'Seu nível de acesso não inclui o resumo do Pipedrive.', atualizadoEm: null, simulado: false };
        throw e;   // fonte fora = COM PROBLEMA na tela (o último valor válido, se houver, fica marcado como desatualizado)
      }
    }
    default:
      return resumoSimulado(id, periodo);
  }
}

/** (B) Módulos sem fonte real (23/11/2026): "Aguardando conexão", sem números de demonstração. */
function resumoSimulado(id: ModuloId, _periodo: PeriodoId): Promise<ResumoModulo> {
  return Promise.resolve(aguardandoConexao(id));
}

// ── Alertas consolidados (§28) ──────────────────────────────────────

export async function getAlertas(): Promise<AlertaGeral[]> {
  if (cenarioAtual() === 'vazio') return []; // §45: testa o estado vazio
  const alertas: AlertaGeral[] = [];
  // as duas fontes em paralelo (antes em fila)
  const [rt, rp] = await Promise.allSettled([getTransito(), getPipedrive()]);
  // Trânsito real vira alerta quando intenso/desatualizado.
  try {
    if (rt.status === 'rejected') throw rt.reason;
    const t = rt.value;
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

  try {   // Pipedrive REAL: NEGÓCIOS abertos com atividade vencida (sem permissão, fonte fora ou sem dado → sem alerta, nunca número inventado)
    if (rp.status === 'rejected') throw rp.reason;
    const p = rp.value;
    if (p.negociosVencidos !== null && p.negociosVencidos > 0) {
      alertas.push({
        id: 'pd-atividades', severidade: 3, modulo: 'Pipedrive',
        descricao: `${fmtN(p.negociosVencidos)} negócio(s) aberto(s) com atividade vencida`,
        impacto: 'Negócios podem esfriar sem follow-up.',
        rota: '#/panel-pipedrive', simulado: false,
      });
    }
  } catch { /* fonte fora não bloqueia os demais */ }
  return alertas.sort((a, b) => a.severidade - b.severidade);
}

// ── Integrações (§26.3) ─────────────────────────────────────────────

export async function getIntegracoes(): Promise<StatusIntegracao[]> {
  const agora = new Date().toISOString();
  // as fontes em PARALELO (antes, em fila: a lista esperava a soma de todas — o trânsito sozinho leva 5–6 s)
  const [rt, ra, rn, rp] = await Promise.allSettled([getTransito(), getAds(), getAnuncios(), getPipedrive()]);
  const out: StatusIntegracao[] = [];

  if (rt.status === 'fulfilled') {
    const t = rt.value; const prob = transitoComProblema(t);
    out.push({
      nome: 'Trânsito SP', detalhe: prob ? motivoTransito(t) : 'Fonte pública de mobilidade',
      estado: prob ? 'erro' : 'conectada',   // coerente com o cartão: sem fluxo = COM PROBLEMA, nunca "saudável"
      ultimaSync: t.indice !== null ? t.atualizadoEm : null,
    });
  } else out.push({ nome: 'Trânsito SP', detalhe: 'Não foi possível consultar o trânsito.', estado: 'erro', ultimaSync: null });

  if (ra.status === 'fulfilled') {
    const a = ra.value;
    out.push({
      nome: 'Google Ads', detalhe: a.provedorReal ? `${a.contas} conta(s) · ${a.campanhasAtivas} campanhas` : FALTA.ads!.texto,
      estado: a.provedorReal ? 'conectada' : 'demonstracao', ultimaSync: a.provedorReal ? agora : null,
    });
  } else out.push({ nome: 'Google Ads', detalhe: 'Não foi possível consultar o Ads Intelligence.', estado: 'erro', ultimaSync: null });

  out.push(rn.status === 'fulfilled'
    ? { nome: 'Decision Engine', detalhe: 'Consultor de Google Ads (metodologia Dshow)', estado: 'conectada', ultimaSync: agora }
    : { nome: 'Decision Engine', detalhe: 'Não foi possível consultar o Consultor de Google Ads.', estado: 'erro', ultimaSync: null });

  out.push(
    { nome: 'Meta Ads', detalhe: `${FALTA.metaads!.texto} Com ${FALTA.metaads!.com}.`, estado: 'demonstracao', ultimaSync: null },
    { nome: 'Mercado Livre', detalhe: `${FALTA.mercadolivre!.texto} Com ${FALTA.mercadolivre!.com}.`, estado: 'demonstracao', ultimaSync: null },
    // a mesma lista da grade: todo cartão "Aguardando conexão" aparece aqui (o topo conta igual)
    { nome: 'E-commerce', detalhe: FALTA.ecommerce!.texto, estado: 'demonstracao', ultimaSync: null },
    { nome: 'Financeiro', detalhe: FALTA.financeiro!.texto, estado: 'demonstracao', ultimaSync: null },
    { nome: 'Compras', detalhe: FALTA.compras!.texto, estado: 'demonstracao', ultimaSync: null },
    { nome: 'DataTables', detalhe: FALTA.datatables!.texto, estado: 'demonstracao', ultimaSync: null },
  );

  if (rp.status === 'fulfilled') {
    const p = rp.value;
    out.push({ nome: 'Pipedrive', detalhe: p.abertos === null ? 'CRM comercial' : `CRM comercial · ${fmtN(p.abertos)} negócios abertos`, estado: 'conectada', ultimaSync: p.atualizadoEm });
  } else {
    const semAcesso = rp.reason instanceof Error && /HTTP 40[13]/.test(rp.reason.message);
    // sem acesso não é falha da fonte: fica fora da contagem de problemas
    out.push(semAcesso ? { nome: 'Pipedrive', detalhe: 'Seu nível de acesso não inclui o Pipedrive.', estado: 'demonstracao', ultimaSync: null }
      : { nome: 'Pipedrive', detalhe: 'Não foi possível consultar o Pipedrive.', estado: 'erro', ultimaSync: null });
  }
  return out;
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
