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
  AlertaGeral, ModuloId, PeriodoId,
  ResumoAds, ResumoAnuncios, ResumoModulo, ResumoTransito,
  StatusIntegracao,
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
export interface ResumoPipedrive {
  abertos: number; valorAberto: number; atrasadas: number; conversao: number | null; atualizadoEm: string | null;
}
export async function getPipedrive(): Promise<ResumoPipedrive> {
  interface Bruto {
    overview?: { deals?: { abertos?: number; valor_aberto?: number; taxa_conversao?: number | null }; atividades?: { atrasadas?: number } };
    runs?: { status?: string; finished_at?: string | null }[];
  }
  const d = await getJson<Bruto>('/api/pipedrive/overview');
  const ok = (d.runs ?? []).find((r) => r.status === 'completed' && r.finished_at);
  // pipe_sync_runs grava a hora LOCAL do servidor (America/Sao_Paulo, −03:00, sem horário de verão)
  const quando = ok?.finished_at ? new Date(ok.finished_at.replace(' ', 'T') + '-03:00').toISOString() : null;
  return {
    abertos: Number(d.overview?.deals?.abertos ?? 0),
    valorAberto: Number(d.overview?.deals?.valor_aberto ?? 0),
    atrasadas: Number(d.overview?.atividades?.atrasadas ?? 0),
    conversao: d.overview?.deals?.taxa_conversao ?? null,
    atualizadoEm: quando,
  };
}

/** (B) Cartão de módulo SEM fonte real: nenhum número inventado — só o estado "Aguardando conexão". */
function aguardandoConexao(): ResumoModulo {
  return { status: 'indisponivel', statusRotulo: 'Aguardando conexão', metricas: [], alerta: null, atualizadoEm: null, simulado: false };
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
      if (!a.provedorReal) return aguardandoConexao();   // 23/11/2026: provedor mock = sem dado real → nenhum número
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
        return {
          status: p.atrasadas > 0 ? 'atencao' : 'ok',
          statusRotulo: p.atrasadas > 0 ? `${fmtN(p.atrasadas)} atrasada(s)` : 'Em dia',
          metricas: [
            { rotulo: 'Negócios abertos', valor: fmtN(p.abertos) },
            { rotulo: 'Valor do funil', valor: fmtMoeda(p.valorAberto) },
            { rotulo: 'Ativ. atrasadas', valor: fmtN(p.atrasadas), ruim: p.atrasadas > 0 },
            { rotulo: 'Conversão', valor: p.conversao === null ? '—' : `${p.conversao.toLocaleString('pt-BR')}%` },
          ],
          alerta: null,
          atualizadoEm: p.atualizadoEm,
          simulado: false,
        };
      } catch (e) {
        // sem permissão (nível < 50) ou fonte fora: NUNCA número inventado
        const semAcesso = e instanceof Error && /HTTP 40[13]/.test(e.message);
        return { status: 'indisponivel', statusRotulo: semAcesso ? 'Sem acesso' : 'Indisponível', metricas: [], alerta: null, atualizadoEm: null, simulado: false };
      }
    }
    default:
      return resumoSimulado(id, periodo);
  }
}

/** (B) Módulos sem fonte real (23/11/2026): "Aguardando conexão", sem números de demonstração. */
function resumoSimulado(_id: ModuloId, _periodo: PeriodoId): Promise<ResumoModulo> {
  return Promise.resolve(aguardandoConexao());
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

  try {   // Pipedrive REAL: atividades atrasadas (sem permissão ou fonte fora → sem alerta, nunca número inventado)
    const p = await getPipedrive();
    if (p.atrasadas > 0) {
      alertas.push({
        id: 'pd-atividades', severidade: 3, modulo: 'Pipedrive',
        descricao: `${fmtN(p.atrasadas)} atividade(s) comercial(is) atrasada(s)`,
        impacto: 'Negócios podem esfriar sem follow-up.',
        rota: '#/panel-pipedrive', simulado: false,
      });
    }
  } catch { /* fonte fora não bloqueia os demais */ }
  return alertas.sort((a, b) => a.severidade - b.severidade);
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
      nome: 'Google Ads', detalhe: a.provedorReal ? `${a.contas} conta(s) · ${a.campanhasAtivas} campanhas` : 'Aguardando conexão',
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
  );
  try {
    const p = await getPipedrive();
    out.push({ nome: 'Pipedrive', detalhe: `CRM comercial · ${fmtN(p.abertos)} negócios abertos`, estado: 'conectada', ultimaSync: p.atualizadoEm });
  } catch {
    out.push({ nome: 'Pipedrive', detalhe: 'CRM comercial', estado: 'erro', ultimaSync: null });
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
