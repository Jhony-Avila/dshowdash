// services/HomeService.ts — fontes específicas da Home Inteligente (v3).
// @version 3.0.0  @created 2026-07-29
//
// Clima: REAL (/api/home/weather.php — Open-Meteo no servidor, cache 10 min).
// Saudação: nome real da sessão (/api/auth/check.php) + frases compostas das
// fontes reais/simuladas. Agenda e e-mails: simulados marcados até a
// integração Outlook/Calendário. Insights: motor de REGRAS sobre os resumos.

import type {
  AgendaItem, ClimaCompleto, Insight, ResumoEmails, Saudacao,
} from '../domain/types';
import { getAds, getAnuncios, getTransito } from './GeralService';

// ── Clima real ──────────────────────────────────────────────────────

export async function getClima(): Promise<ClimaCompleto> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  try {
    const res = await fetch('/api/home/weather.php', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body || body.ok !== true || !body.data) throw new Error('payload inválido');
    return body.data as ClimaCompleto;
  } finally {
    clearTimeout(t);
  }
}

// ── Nome do usuário (sessão) ────────────────────────────────────────

let _nomeCache: string | null | undefined;

async function nomeDoUsuario(): Promise<string | null> {
  if (_nomeCache !== undefined) return _nomeCache;
  try {
    const res = await fetch('/api/auth/check.php', {
      credentials: 'same-origin', headers: { Accept: 'application/json' },
    });
    const body = res.ok ? await res.json() : null;
    const s = body && (body.data || body);
    const bruto = s && (s.user?.name ?? s.user?.nome ?? s.session?.user?.name ?? s.name ?? null);
    _nomeCache = typeof bruto === 'string' && bruto.trim() !== '' ? bruto.trim().split(' ')[0] : null;
  } catch {
    _nomeCache = null;
  }
  return _nomeCache;
}

// ── Saudação contextual (briefing §6) ───────────────────────────────

export async function getSaudacao(totalAlertas: number | null): Promise<Saudacao> {
  const h = new Date().getHours();
  const saudacao = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const nome = await nomeDoUsuario();

  const frases: string[] = [];
  if (totalAlertas !== null) {
    frases.push(totalAlertas === 0
      ? 'A operação está estável, sem alertas em aberto.'
      : `A operação está estável, com ${totalAlertas} alerta${totalAlertas === 1 ? '' : 's'} que exige${totalAlertas === 1 ? '' : 'm'} atenção.`);
  }
  // Frases auxiliares — cada fonte falha sem derrubar a saudação.
  try {
    const t = await getTransito();
    if (t.nivel === 'intense') frases.push('O trânsito está intenso em São Paulo.');
    else if (t.nivel === 'moderate') frases.push('O trânsito está moderado em São Paulo.');
  } catch { /* segue */ }
  try {
    const c = await getClima();
    const chance = c.atual.chanceChuva;
    if (chance !== null && chance >= 60) frases.push(`Há ${chance}% de chance de chuva hoje.`);
  } catch { /* segue */ }

  return { saudacao, nome, frases: frases.slice(0, 2) };
}

// ── Agenda (simulada marcada — integração Calendário/Outlook depois) ─

export function getAgenda(): Promise<AgendaItem[]> {
  const diaSemana = new Date().getDay();
  if (diaSemana === 0 || diaSemana === 6) return Promise.resolve([]); // fim de semana sem compromissos
  const agora = new Date().getHours() + new Date().getMinutes() / 60;
  const itens: AgendaItem[] = [
    { id: 'ag1', hora: '10:00', titulo: 'Reunião comercial', tipo: 'reuniao', atrasado: agora > 10.5, simulado: true },
    { id: 'ag2', hora: '14:30', titulo: 'Follow-up fornecedor LED', tipo: 'tarefa', atrasado: agora > 15, simulado: true },
    { id: 'ag3', hora: '17:00', titulo: 'Revisão de campanhas', tipo: 'reuniao', atrasado: false, simulado: true },
  ];
  return Promise.resolve(itens);
}

// ── E-mails (simulado marcado) ──────────────────────────────────────

export function getEmails(): Promise<ResumoEmails> {
  return Promise.resolve({
    naoLidos: 23, importantes: 4, aguardandoResposta: 7, recebidosHoje: 61, simulado: true,
  });
}

// ── Insights por regras (briefing §22) — nunca afirmar sem dado ─────

export async function getInsights(): Promise<Insight[]> {
  const insights: Insight[] = [];

  // Regra 1 — trânsito real
  try {
    const t = await getTransito();
    if (t.nivel === 'intense' && t.indice !== null) {
      insights.push({
        id: 'in-transito', tom: 'atencao', modulo: 'Trânsito', rota: '#/panel-transito-sp',
        conclusao: 'Trânsito intenso na cidade agora',
        evidencia: `Índice ${t.indice}/100${t.km !== null ? ` com ${t.km} km de lentidão` : ''}.`,
        impacto: 'Entregas e deslocamentos do dia podem atrasar.',
        recomendacao: 'Antecipe despachos e avise clientes com entrega hoje.',
        simulado: false,
      });
    }
  } catch { /* fonte fora */ }

  // Regra 2 — chuva forte real
  try {
    const c = await getClima();
    const hoje = c.dias[0];
    if (hoje && hoje.chanceChuva !== null && hoje.chanceChuva >= 70) {
      insights.push({
        id: 'in-chuva', tom: 'informativo', modulo: 'Clima', rota: null,
        conclusao: 'Alta probabilidade de chuva hoje',
        evidencia: `${hoje.chanceChuva}% de chance, volume estimado ${hoje.volumeChuva ?? 0} mm.`,
        impacto: 'Instalações externas e entregas podem ser afetadas.',
        recomendacao: 'Reagendar serviços externos sensíveis, se houver.',
        simulado: false,
      });
    }
  } catch { /* segue */ }

  // Regra 3 — aprovação do Consultor (real)
  try {
    const a = await getAnuncios();
    const total = a.positivas + a.negativas;
    if (total >= 5) {
      const pct = Math.round((a.positivas / total) * 100);
      insights.push({
        id: 'in-anuncios', tom: pct >= 80 ? 'positivo' : 'atencao', modulo: 'Anuncios', rota: '#/panel-anuncios',
        conclusao: pct >= 80 ? 'Consultor com alta taxa de aprovação' : 'Aprovação do Consultor abaixo do ideal',
        evidencia: `${pct}% de feedback positivo em ${total} avaliações.`,
        impacto: pct >= 80 ? 'A metodologia está respondendo bem às consultas do time.' : 'Respostas podem não estar cobrindo os casos do time.',
        recomendacao: pct >= 80 ? 'Manter o uso e ampliar para a equipe comercial.' : 'Revisar os feedbacks negativos no painel de Aprendizado.',
        simulado: false,
      });
    }
  } catch { /* segue */ }

  // Regra 4 — campanhas Google (real quando conectado)
  try {
    const g = await getAds();
    if (g.campanhasAtivas === 0 && g.contas > 0) {
      insights.push({
        id: 'in-ads-parado', tom: 'atencao', modulo: 'Ads Intelligence', rota: '#/panel-ads',
        conclusao: 'Nenhuma campanha ativa no Google Ads',
        evidencia: `${g.contas} conta(s) conectada(s) sem campanha veiculando.`,
        impacto: 'Sem mídia ativa, a geração de leads pelo Google para.',
        recomendacao: 'Verificar se a pausa é intencional ou problema de veiculação.',
        simulado: false,
      });
    }
  } catch { /* segue */ }

  // Regras sobre módulos em demonstração (marcadas como simuladas)
  insights.push(
    {
      id: 'in-cpl-meta', tom: 'atencao', modulo: 'Meta Ads', rota: '#/panel-metaads',
      conclusao: 'CPL do Meta Ads subiu na última semana',
      evidencia: 'CPL +18% nos últimos 7 dias vs semana anterior.',
      impacto: 'Custo de aquisição pressiona a margem das campanhas de leads.',
      recomendacao: 'Trocar criativos fatigados e revisar públicos saturados.',
      simulado: true,
    },
    {
      id: 'in-vencidos', tom: 'critico', modulo: 'Financeiro', rota: null,
      conclusao: 'Pagamentos vencidos em aberto',
      evidencia: 'R$ 24,6 mil vencidos aguardando cobrança.',
      impacto: 'Fluxo de caixa do mês comprometido se não tratado.',
      recomendacao: 'Priorizar régua de cobrança dos 5 maiores títulos.',
      simulado: true,
    },
    {
      id: 'in-pd-parados', tom: 'atencao', modulo: 'Pipedrive', rota: '#/panel-pipedrive',
      conclusao: 'Negócios parados no funil',
      evidencia: '4 negócios sem atividade há mais de 10 dias.',
      impacto: 'Oportunidades esfriam e a previsão do mês perde confiança.',
      recomendacao: 'Agendar follow-up ou marcar como perdido com motivo.',
      simulado: true,
    },
  );

  return insights.slice(0, 6);
}
