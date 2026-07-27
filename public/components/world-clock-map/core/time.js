/**
 * World Clock Map — formatação de horários por fuso IANA (pt-BR).
 * @version 0.2.0
 *
 * TUDO via Intl.DateTimeFormat com timeZone IANA — lida com horário de verão
 * e fusos de meia-hora (ex.: Asia/Kolkata +5:30) automaticamente. SEM offsets
 * fixos, SEM API externa. Os formatters são memoizados por (tz+tipo).
 */
'use strict';

const _cache = new Map();
function _fmt(tz, opts, tag) {
  const key = tz + '|' + tag;
  let f = _cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat('pt-BR', Object.assign({ timeZone: tz, hour12: false }, opts));
    _cache.set(key, f);
  }
  return f;
}

/** "HH:MM" no fuso informado. */
export function fmtHM(date, tz) {
  return _fmt(tz, { hour: '2-digit', minute: '2-digit' }, 'hm').format(date);
}

/** "HH:MM:SS" no fuso informado. */
export function fmtHMS(date, tz) {
  return _fmt(tz, { hour: '2-digit', minute: '2-digit', second: '2-digit' }, 'hms').format(date);
}

/** Rótulo de offset curto, ex.: "GMT-3", "GMT+5:30". */
export function fmtOffset(date, tz) {
  try {
    const parts = _fmt(tz, { hour: '2-digit', timeZoneName: 'shortOffset' }, 'off').formatToParts(date);
    const p = parts.find((x) => x.type === 'timeZoneName');
    return p ? p.value.replace('GMT', 'GMT') : '';
  } catch (_e) {
    return '';
  }
}

/**
 * Dados completos para o relógio em destaque (pt-BR):
 *   { time:"HH:MM:SS", weekday:"quinta-feira", dateLong:"9 de julho de 2026", offset:"GMT-3" }
 */
export function fmtSpotlight(date, tz) {
  const weekday = _fmt(tz, { weekday: 'long' }, 'wd').format(date);
  const dateLong = _fmt(tz, { day: 'numeric', month: 'long', year: 'numeric' }, 'dl').format(date);
  return {
    time: fmtHMS(date, tz),
    weekday,
    dateLong,
    offset: fmtOffset(date, tz)
  };
}
