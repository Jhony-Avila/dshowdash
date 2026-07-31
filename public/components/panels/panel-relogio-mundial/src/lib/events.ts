/**
 * lib/events.ts — agenda mundial: feriados, transições de horário de verão e efemérides.
 * @version 3.0.0
 *
 * Junta três origens muito diferentes numa única linha do tempo ordenada:
 *   • FERIADOS — curadoria em data/holidays.ts (declarativo, validade anual).
 *   • HORÁRIO DE VERÃO — CALCULADO da base IANA do navegador via lib/time.ts.
 *     Não existe tabela de DST neste módulo, e é isso que garante que Brasil (sem
 *     DST desde 2019), Europa (último domingo de março/outubro) e hemisfério sul
 *     apareçam certos sem manutenção.
 *   • EFEMÉRIDES — solstícios e equinócios, datas fixas aproximadas.
 *
 * O `stale` de feriado é propagado até a UI: fora do ano coberto, o painel diz que
 * não tem dado em vez de sugerir que não há feriado nenhum.
 */
'use strict';

import { CITIES, type City, flagOf } from '@/data/cities';
import { GLOBAL_EVENTS, HOLIDAYS_BY_CC, HOLIDAY_DATA_YEAR, type HolidayDef } from '@/data/holidays';
import { dstInfo, monthDayKey, zonedParts, instantFromZoned } from '@/lib/time';

export type WorldEventKind = 'feriado' | 'comemorativa' | 'dst' | 'efemeride';

export interface WorldEvent {
  kind: WorldEventKind;
  /** Instante de referência (meia-noite local para feriados; exato para DST). */
  at: Date;
  title: string;
  /** Cidade/país de contexto, quando aplicável. */
  city?: City;
  cc?: string;
  flag?: string;
  /** Texto auxiliar já formatado. */
  detail?: string;
}

/** O dia civil local da cidade é feriado? */
export function holidayOf(city: City, date: Date): { def: HolidayDef; stale: boolean } | null {
  const list = HOLIDAYS_BY_CC[city.cc];
  const stale = zonedParts(date, city.tz).year !== HOLIDAY_DATA_YEAR;
  if (!list) return null;
  const key = monthDayKey(date, city.tz);
  const def = list.find((hd) => hd.date === key);
  return def ? { def, stale } : null;
}

/** Existe dado de feriado para o país desta cidade? */
export function hasHolidayData(city: City): boolean {
  return Boolean(HOLIDAYS_BY_CC[city.cc]);
}

/** Feriados dos próximos `days` dias para um conjunto de cidades. */
function upcomingHolidays(cities: City[], from: Date, days: number): WorldEvent[] {
  const out: WorldEvent[] = [];
  const seen = new Set<string>();

  for (const city of cities) {
    const list = HOLIDAYS_BY_CC[city.cc];
    if (!list) continue;
    for (let d = 0; d <= days; d++) {
      const probe = new Date(from.getTime() + d * 86400000);
      const key = monthDayKey(probe, city.tz);
      const def = list.find((hd) => hd.date === key);
      if (!def) continue;
      // Um feriado por país por data — não repetir por cada cidade do mesmo país.
      const dedupe = `${city.cc}|${key}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      const p = zonedParts(probe, city.tz);
      out.push({
        kind: def.kind === 'nacional' ? 'feriado' : 'comemorativa',
        at: instantFromZoned(p.year, p.month, p.day, 0, 0, city.tz),
        title: def.name,
        city,
        cc: city.cc,
        flag: flagOf(city.cc),
        detail: city.country,
      });
    }
  }
  return out;
}

/** Próximas mudanças de horário de verão nas zonas das cidades informadas. */
function upcomingDst(cities: City[], from: Date, days: number): WorldEvent[] {
  const out: WorldEvent[] = [];
  const seenTz = new Set<string>();
  const limit = from.getTime() + days * 86400000;

  for (const city of cities) {
    if (seenTz.has(city.tz)) continue;
    seenTz.add(city.tz);
    const info = dstInfo(from, city.tz);
    if (!info.next) continue;
    if (info.next.at.getTime() > limit) continue;
    out.push({
      kind: 'dst',
      at: info.next.at,
      title: info.next.gainsHour ? 'Entra no horário de verão' : 'Sai do horário de verão',
      city,
      cc: city.cc,
      flag: flagOf(city.cc),
      detail: `${city.name} — relógio ${info.next.gainsHour ? 'adianta' : 'atrasa'} 1 h`,
    });
  }
  return out;
}

function upcomingEphemerides(from: Date, days: number): WorldEvent[] {
  const out: WorldEvent[] = [];
  for (let d = 0; d <= days; d++) {
    const probe = new Date(from.getTime() + d * 86400000);
    const key = monthDayKey(probe, 'UTC');
    for (const ev of GLOBAL_EVENTS) {
      if (ev.date !== key) continue;
      out.push({
        kind: 'efemeride',
        at: new Date(Date.UTC(probe.getUTCFullYear(), probe.getUTCMonth(), probe.getUTCDate())),
        title: ev.name,
        detail: 'Evento astronômico',
      });
    }
  }
  return out;
}

/**
 * Linha do tempo unificada dos próximos `days` dias.
 * `cities` limita o escopo (normalmente as cidades visíveis + favoritas); passar
 * CITIES inteiro devolve a agenda mundial completa.
 */
// A agenda cobre 45 dias e varre feriado por feriado, cidade por cidade — é a função
// mais cara do módulo. Como o resultado só muda quando muda o DIA (ou a lista de
// cidades), o cache tem chave de hora: recalcular a cada segundo custaria milhares de
// decomposições de data para devolver exatamente a mesma lista.
let _eventsKey = '';
let _eventsValue: WorldEvent[] = [];

export function upcomingEvents(from: Date, days = 45, cities: City[] = CITIES): WorldEvent[] {
  const key = `${Math.floor(from.getTime() / 3600000)}|${days}|${cities.map((c) => c.id).join(',')}`;
  if (key === _eventsKey) return _eventsValue;

  const out = [
    ...upcomingHolidays(cities, from, days),
    ...upcomingDst(cities, from, days),
    ...upcomingEphemerides(from, days),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  _eventsKey = key;
  _eventsValue = out;
  return out;
}

/** Dados de horário de verão de uma cidade, prontos para o card/tooltip. */
export interface DstBadge {
  observes: boolean;
  active: boolean;
  label: 'DST ON' | 'DST OFF' | 'sem DST';
  /** Dias até a próxima mudança (null se a zona não observa DST). */
  daysToChange: number | null;
  changeAt: Date | null;
  gainsHour: boolean | null;
}

export function dstBadge(city: City, date: Date): DstBadge {
  const info = dstInfo(date, city.tz);
  if (!info.observes) {
    return { observes: false, active: false, label: 'sem DST', daysToChange: null, changeAt: null, gainsHour: null };
  }
  const daysToChange = info.next
    ? Math.ceil((info.next.at.getTime() - date.getTime()) / 86400000)
    : null;
  return {
    observes: true,
    active: info.active,
    label: info.active ? 'DST ON' : 'DST OFF',
    daysToChange,
    changeAt: info.next?.at ?? null,
    gainsHour: info.next?.gainsHour ?? null,
  };
}

export const EVENT_KIND_LABEL: Record<WorldEventKind, string> = {
  feriado: 'Feriado nacional',
  comemorativa: 'Data comemorativa',
  dst: 'Horário de verão',
  efemeride: 'Efeméride',
};
