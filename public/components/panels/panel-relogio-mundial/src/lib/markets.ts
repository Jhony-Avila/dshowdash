/**
 * lib/markets.ts — estado das bolsas calculado, nunca declarado.
 * @version 3.0.0
 *
 * Recebe um instante e devolve o estado de cada praça no fuso dela: fechado,
 * pré-abertura, aberto, pausa de almoço, after-market, feriado ou fim de semana —
 * mais a PRÓXIMA transição com contagem regressiva, que é o que dá a sensação de
 * "operação global viva" que o briefing pede.
 *
 * HONESTIDADE DE DADO: a lista de feriados vale para HOLIDAY_YEAR. Se a data
 * consultada for de outro ano, `holidayDataStale` volta true e a UI mostra o aviso
 * em vez de afirmar que o dia é útil — errar para o lado de "não sei" é melhor que
 * pintar um mercado como aberto num feriado.
 */
'use strict';

import { EXCHANGES, EXCHANGE_BY_ID, HOLIDAY_YEAR, type Exchange, type SessionWindow } from '@/data/exchanges';
import { instantFromZoned, minutesOfDay, monthDayKey, zonedParts } from '@/lib/time';

export type MarketState =
  | 'aberto'
  | 'pausa'
  | 'pre'
  | 'after'
  | 'fechado'
  | 'feriado'
  | 'fim-de-semana';

export interface MarketStatus {
  exchange: Exchange;
  state: MarketState;
  /** true apenas na sessão regular (o que "mercado aberto" significa de fato). */
  isOpen: boolean;
  /** Rótulo pt-BR pronto para a UI. */
  label: string;
  /** Progresso [0,1] dentro da sessão regular do dia — alimenta a barra do card. */
  progress: number;
  /** Próxima transição de estado. */
  next: { at: Date; state: MarketState; label: string } | null;
  /** A data consultada está fora do ano coberto pela lista de feriados. */
  holidayDataStale: boolean;
}

const STATE_LABEL: Record<MarketState, string> = {
  aberto: 'Aberto',
  pausa: 'Pausa de almoço',
  pre: 'Pré-abertura',
  after: 'After-market',
  fechado: 'Fechado',
  feriado: 'Feriado',
  'fim-de-semana': 'Fim de semana',
};

export const MARKET_STATE_LABEL = STATE_LABEL;

function inWindow(min: number, w: SessionWindow): boolean {
  return min >= w[0] && min < w[1];
}

function isHoliday(ex: Exchange, date: Date): boolean {
  return ex.holidays.includes(monthDayKey(date, ex.tz));
}

function isTradingDay(ex: Exchange, date: Date): boolean {
  const p = zonedParts(date, ex.tz);
  return ex.days.includes(p.dow) && !isHoliday(ex, date);
}

/** Estado bruto (sem a próxima transição) — usado também na varredura futura. */
function stateAt(ex: Exchange, date: Date): MarketState {
  const p = zonedParts(date, ex.tz);
  if (!ex.days.includes(p.dow)) return 'fim-de-semana';
  if (isHoliday(ex, date)) return 'feriado';

  const min = minutesOfDay(date, ex.tz);
  for (const w of ex.regular) if (inWindow(min, w)) return 'aberto';

  // Entre dois blocos regulares = pausa de almoço.
  if (ex.regular.length > 1) {
    for (let i = 0; i < ex.regular.length - 1; i++) {
      if (min >= ex.regular[i][1] && min < ex.regular[i + 1][0]) return 'pausa';
    }
  }
  if (ex.pre && inWindow(min, ex.pre)) return 'pre';
  if (ex.after && inWindow(min, ex.after)) return 'after';
  return 'fechado';
}

/**
 * Todos os instantes de mudança de estado do dia local, em ordem (minutos locais).
 * Serve para achar a próxima transição sem varrer minuto a minuto.
 * Não depende da data: a grade é a mesma em todo dia útil da praça.
 */
function dayBoundaries(ex: Exchange): number[] {
  const set = new Set<number>();
  for (const w of ex.regular) { set.add(w[0]); set.add(w[1]); }
  if (ex.pre) { set.add(ex.pre[0]); set.add(ex.pre[1]); }
  if (ex.after) { set.add(ex.after[0]); set.add(ex.after[1]); }
  return [...set].sort((a, b) => a - b);
}

/**
 * Próxima transição de estado, varrendo até 12 dias (cobre feriados encadeados).
 *
 * Dias NÃO ÚTEIS são pulados por inteiro. Avaliar as fronteiras de um sábado
 * produziria a transição sem sentido "entra em fim de semana às 09:30 do sábado" —
 * o estado do sábado já é fim de semana desde a meia-noite. A próxima mudança real
 * só pode acontecer num dia em que a praça abre.
 */
function nextEvent(ex: Exchange, from: Date): { at: Date; state: MarketState; label: string } | null {
  const current = stateAt(ex, from);
  const bounds = dayBoundaries(ex);

  for (let dayOffset = 0; dayOffset <= 12; dayOffset++) {
    const probe = new Date(from.getTime() + dayOffset * 86400000);
    if (!isTradingDay(ex, probe)) continue;
    const p = zonedParts(probe, ex.tz);

    for (const b of bounds) {
      const at = instantFromZoned(p.year, p.month, p.day, Math.floor(b / 60), b % 60, ex.tz);
      if (at.getTime() <= from.getTime()) continue;
      const st = stateAt(ex, at);
      if (st !== current) return { at, state: st, label: STATE_LABEL[st] };
    }
  }
  return null;
}

function progressOf(ex: Exchange, date: Date, state: MarketState): number {
  if (state !== 'aberto' && state !== 'pausa') return state === 'after' ? 1 : 0;
  const min = minutesOfDay(date, ex.tz);
  const first = ex.regular[0][0];
  const last = ex.regular[ex.regular.length - 1][1];
  if (last <= first) return 0;
  return Math.max(0, Math.min(1, (min - first) / (last - first)));
}

/**
 * CACHE POR MINUTO. `nextEvent` varre até 12 dias de fronteiras, e o painel pede o
 * estado das 29 praças a cada segundo, em três lugares diferentes (cabeçalho, painel
 * de mercados, marcadores). Recalcular tudo 60 vezes por minuto para um resultado que
 * só muda na virada do minuto era desperdício puro.
 *
 * O `progress` é a única parte que se move dentro do minuto, e sua resolução visual
 * (uma barra de poucos pixels) não distingue segundos — por isso ele entra no cache
 * junto, sem prejuízo perceptível.
 */
const _statusCache = new Map<string, MarketStatus>();
let _statusMinute = -1;

export function marketStatus(ex: Exchange, date: Date): MarketStatus {
  const minute = Math.floor(date.getTime() / 60000);
  if (minute !== _statusMinute) {
    _statusCache.clear();
    _statusMinute = minute;
  }
  const hit = _statusCache.get(ex.id);
  if (hit) return hit;

  const state = stateAt(ex, date);
  const stale = zonedParts(date, ex.tz).year !== HOLIDAY_YEAR;
  const out: MarketStatus = {
    exchange: ex,
    state,
    isOpen: state === 'aberto',
    label: STATE_LABEL[state],
    progress: progressOf(ex, date, state),
    next: nextEvent(ex, date),
    holidayDataStale: stale,
  };
  _statusCache.set(ex.id, out);
  return out;
}

export function marketStatusById(id: string, date: Date): MarketStatus | null {
  const ex = EXCHANGE_BY_ID[id];
  return ex ? marketStatus(ex, date) : null;
}

/** Estado de todas as praças, ordenado: abertas primeiro, depois por proximidade de abertura. */
export function allMarketStatus(date: Date): MarketStatus[] {
  const list = EXCHANGES.map((ex) => marketStatus(ex, date));
  const rank: Record<MarketState, number> = {
    aberto: 0, pausa: 1, pre: 2, after: 3, fechado: 4, feriado: 5, 'fim-de-semana': 6,
  };
  return list.sort((a, b) => {
    const d = rank[a.state] - rank[b.state];
    if (d !== 0) return d;
    const ta = a.next?.at.getTime() ?? Infinity;
    const tb = b.next?.at.getTime() ?? Infinity;
    return ta - tb;
  });
}

/** Bolsas de uma cidade, com estado. */
export function marketsOfCity(cityId: string, date: Date): MarketStatus[] {
  return EXCHANGES.filter((e) => e.cityId === cityId).map((e) => marketStatus(e, date));
}

export interface MarketsSummary {
  total: number;
  abertos: number;
  fechados: number;
  pre: number;
  after: number;
  pausa: number;
  feriado: number;
  /** Volume relativo de praças ativas [0,1] — usado no mini card. */
  ativos: number;
}

export function marketsSummary(date: Date): MarketsSummary {
  const all = allMarketStatus(date);
  const count = (s: MarketState) => all.filter((m) => m.state === s).length;
  const abertos = count('aberto');
  return {
    total: all.length,
    abertos,
    fechados: count('fechado') + count('fim-de-semana'),
    pre: count('pre'),
    after: count('after'),
    pausa: count('pausa'),
    feriado: count('feriado'),
    ativos: all.length ? abertos / all.length : 0,
  };
}

/**
 * Curva de mercados abertos ao longo de 24 h a partir de um instante, em passos
 * de 15 min. Alimenta o sparkline do painel analítico — mostra as "ondas" de
 * Ásia → Europa → Américas, que é a leitura que um operador global quer.
 */
let _curveKey = '';
let _curveValue: { t: Date; open: number }[] = [];

export function marketsCurve(from: Date, stepMinutes = 15): { t: Date; open: number }[] {
  // 96 passos × 29 praças = 2.784 avaliações de estado. Uma vez por minuto, tudo bem;
  // uma vez por segundo, não — daí o cache com chave de minuto.
  const key = Math.floor(from.getTime() / 60000) + '|' + stepMinutes;
  if (key === _curveKey) return _curveValue;

  const out: { t: Date; open: number }[] = [];
  const steps = Math.floor(1440 / stepMinutes);
  for (let i = 0; i <= steps; i++) {
    const t = new Date(from.getTime() + i * stepMinutes * 60000);
    let open = 0;
    for (const ex of EXCHANGES) if (stateAt(ex, t) === 'aberto') open++;
    out.push({ t, open });
  }
  _curveKey = key;
  _curveValue = out;
  return out;
}

/** Cor semântica por estado — casada com os tokens do CSS. */
export const MARKET_STATE_TOKEN: Record<MarketState, string> = {
  aberto: 'var(--wcm-state-open)',
  pausa: 'var(--wcm-state-pause)',
  pre: 'var(--wcm-state-pre)',
  after: 'var(--wcm-state-after)',
  fechado: 'var(--wcm-state-closed)',
  feriado: 'var(--wcm-state-holiday)',
  'fim-de-semana': 'var(--wcm-state-closed)',
};
