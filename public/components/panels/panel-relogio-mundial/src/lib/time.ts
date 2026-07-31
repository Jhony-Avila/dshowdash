/**
 * lib/time.ts — aritmética de fuso horário sobre Intl (sem Luxon, sem date-fns-tz).
 * @version 3.0.0
 *
 * POR QUE Intl E NÃO LUXON: tudo que o briefing pede (offset real, horário de verão,
 * fusos de meia/quarto de hora, semana ISO, dia juliano) sai de Intl.DateTimeFormat,
 * que já carrega a base IANA do próprio navegador — sempre atualizada, zero KB de
 * bundle e zero risco de tzdata defasada embarcada. Luxon custaria ~70KB para
 * reembrulhar a mesma API.
 *
 * REGRA DE OURO deste arquivo: nada de offset fixo em tabela. Todo offset é derivado
 * do instante + zona IANA, então mudança de regra de DST em qualquer país é absorvida
 * sem tocar em código.
 */

const _fmtCache = new Map<string, Intl.DateTimeFormat>();

function fmt(tz: string, opts: Intl.DateTimeFormatOptions, tag: string, locale = 'pt-BR'): Intl.DateTimeFormat {
  const key = locale + '|' + tz + '|' + tag;
  let f = _fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { timeZone: tz, ...opts });
    _fmtCache.set(key, f);
  }
  return f;
}

export interface ZonedParts {
  year: number;
  month: number;   // 1-12
  day: number;     // 1-31
  hour: number;    // 0-23
  minute: number;  // 0-59
  second: number;  // 0-59
  /** 0 = domingo … 6 = sábado */
  dow: number;
}

const _PARTS_FMT: Intl.DateTimeFormatOptions = {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  weekday: 'short', hour12: false,
};

const _DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/**
 * MEMÓRIA DE DECOMPOSIÇÃO — o otimizador mais importante do módulo.
 *
 * `formatToParts` custa alguns microssegundos, o que é irrelevante isolado e fatal em
 * volume: a varredura de próxima transição das 29 bolsas chama zonedParts milhares de
 * vezes, e o painel repinta a cada segundo. Sem este cache o quadro passava de 100 ms
 * e a interface engasgava ao arrastar o mapa.
 *
 * Chave = zona + segundo (a menor granularidade que alguém enxerga). O teto de 6.000
 * entradas com descarte total ao estourar é proposital: é um cache de recência de
 * curtíssimo prazo, e uma política LRU de verdade custaria mais do que economiza.
 */
const _partsCache = new Map<string, ZonedParts>();
const PARTS_CACHE_MAX = 6000;

/** Decompõe um instante nos componentes de calendário DA ZONA informada. */
export function zonedParts(date: Date, tz: string): ZonedParts {
  const key = tz + '|' + Math.floor(date.getTime() / 1000);
  const hit = _partsCache.get(key);
  if (hit) return hit;

  const parts = fmt(tz, _PARTS_FMT, 'parts', 'en-US').formatToParts(date);
  const g: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') g[p.type] = p.value;
  // hourCycle h23 pode devolver "24" para meia-noite em alguns motores.
  const hour = Number(g.hour) % 24;
  const out: ZonedParts = {
    year: Number(g.year),
    month: Number(g.month),
    day: Number(g.day),
    hour,
    minute: Number(g.minute),
    second: Number(g.second),
    dow: _DOW[g.weekday] ?? 0,
  };

  if (_partsCache.size >= PARTS_CACHE_MAX) _partsCache.clear();
  _partsCache.set(key, out);
  return out;
}

/**
 * Offset da zona em MINUTOS em relação ao UTC, no instante dado (positivo a leste).
 * Derivado por diferença de calendário — funciona para fusos de :30 e :45.
 */
export function offsetMinutes(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // Zera os milissegundos do instante original: os parts não os carregam.
  const base = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((asUTC - base) / 60000);
}

/** Rótulo curto de offset: "UTC−03:00", "UTC+05:30", "UTC+00:00". */
export function offsetLabel(date: Date, tz: string, prefix = 'UTC'): string {
  const m = offsetMinutes(date, tz);
  const sign = m < 0 ? '−' : '+'; // U+2212 (menos tipográfico), não hífen
  const a = Math.abs(m);
  return `${prefix}${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

/** Rótulo compacto para chips: "−3", "+5:30". */
export function offsetShort(date: Date, tz: string): string {
  const m = offsetMinutes(date, tz);
  const sign = m < 0 ? '−' : '+';
  const a = Math.abs(m);
  const h = Math.floor(a / 60);
  const mm = a % 60;
  return sign + h + (mm ? ':' + String(mm).padStart(2, '0') : '');
}

/** Nome abreviado do fuso conforme o navegador: "BRT", "GMT+8", "JST"… */
export function tzAbbrev(date: Date, tz: string): string {
  try {
    const parts = fmt(tz, { hour: '2-digit', timeZoneName: 'short', hour12: false }, 'abbr', 'en-US').formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

// ===================== Horário de verão (DST) =====================

export interface DstInfo {
  /** A zona observa DST em algum momento do ano? */
  observes: boolean;
  /** Está em DST NESTE instante? */
  active: boolean;
  /** Offset padrão (fora do DST), em minutos. */
  standardOffset: number;
  /** Próxima transição de offset, se houver nos próximos 400 dias. */
  next: { at: Date; toOffset: number; gainsHour: boolean } | null;
}

const _dstCache = new Map<string, DstInfo>();

/**
 * Detecta DST sem tabela: compara o offset atual com o MENOR offset do ano.
 * O horário de verão sempre ADIANTA o relógio, então o offset padrão é o mínimo
 * entre janeiro e julho — o que vale para os dois hemisférios.
 */
export function dstInfo(date: Date, tz: string): DstInfo {
  const y = date.getUTCFullYear();
  const key = tz + '|' + y + '|' + Math.floor(date.getTime() / 3600000);
  const hit = _dstCache.get(key);
  if (hit) return hit;

  const jan = offsetMinutes(new Date(Date.UTC(y, 0, 15)), tz);
  const jul = offsetMinutes(new Date(Date.UTC(y, 6, 15)), tz);
  const standardOffset = Math.min(jan, jul);
  const observes = jan !== jul;
  const now = offsetMinutes(date, tz);
  const info: DstInfo = {
    observes,
    active: observes && now > standardOffset,
    standardOffset,
    next: observes ? nextTransition(date, tz) : null,
  };
  _dstCache.set(key, info);
  return info;
}

/**
 * Próxima mudança de offset da zona, por varredura diária + refino binário até o minuto.
 * Retorna null se nada mudar nos próximos 400 dias (zonas sem DST).
 */
export function nextTransition(from: Date, tz: string): { at: Date; toOffset: number; gainsHour: boolean } | null {
  const DAY = 86400000;
  const start = from.getTime();
  let prevT = start;
  let prevOff = offsetMinutes(from, tz);

  for (let i = 1; i <= 400; i++) {
    const t = start + i * DAY;
    const off = offsetMinutes(new Date(t), tz);
    if (off !== prevOff) {
      // Refino binário no intervalo de 1 dia até a precisão de 1 minuto.
      let lo = prevT;
      let hi = t;
      while (hi - lo > 60000) {
        const mid = lo + Math.floor((hi - lo) / 2);
        if (offsetMinutes(new Date(mid), tz) === prevOff) lo = mid;
        else hi = mid;
      }
      return { at: new Date(hi), toOffset: off, gainsHour: off > prevOff };
    }
    prevT = t;
    prevOff = off;
  }
  return null;
}

// ===================== Calendário =====================

/** Dia juliano (JD) do instante — padrão astronômico, época -4712. */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Dia juliano MODIFICADO (MJD = JD − 2400000.5). */
export function modifiedJulianDay(date: Date): number {
  return julianDay(date) - 2400000.5;
}

/** Dia do ano (1-366) na zona informada. */
export function dayOfYear(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const start = Date.UTC(p.year, 0, 1);
  const cur = Date.UTC(p.year, p.month - 1, p.day);
  return Math.round((cur - start) / 86400000) + 1;
}

/** Semana ISO-8601 (1-53) na zona informada. */
export function isoWeek(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  // Quinta-feira da mesma semana define o ano ISO.
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const fDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - fDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
}

/** Fração decorrida do dia local [0,1) — 0 à meia-noite, 0.5 ao meio-dia. */
export function dayFraction(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  return (p.hour * 3600 + p.minute * 60 + p.second) / 86400;
}

/** Minutos desde a meia-noite local. */
export function minutesOfDay(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  return p.hour * 60 + p.minute;
}

/** Milissegundos até a próxima meia-noite local. */
export function msToMidnight(date: Date, tz: string): number {
  const p = zonedParts(date, tz);
  const elapsed = (p.hour * 3600 + p.minute * 60 + p.second) * 1000 + (date.getTime() % 1000);
  return 86400000 - elapsed;
}

/** "HH:MM:SS" a partir de uma duração em ms (para contadores regressivos). */
export function durationHMS(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Duração humanizada curta em pt-BR: "3 d 4 h", "12 min". */
export function durationHuman(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h${min % 60 ? ' ' + (min % 60) + ' min' : ''}`;
  const d = Math.floor(h / 24);
  return `${d} d${h % 24 ? ' ' + (h % 24) + ' h' : ''}`;
}

// ===================== Formatação =====================

export function fmtHM(date: Date, tz: string): string {
  return fmt(tz, { hour: '2-digit', minute: '2-digit', hour12: false }, 'hm').format(date);
}

export function fmtHMS(date: Date, tz: string): string {
  return fmt(tz, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }, 'hms').format(date);
}

export function fmtWeekday(date: Date, tz: string, style: 'long' | 'short' = 'long'): string {
  const s = fmt(tz, { weekday: style }, 'wd' + style).format(date);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtDateLong(date: Date, tz: string): string {
  return fmt(tz, { day: 'numeric', month: 'long', year: 'numeric' }, 'dl').format(date);
}

export function fmtDateShort(date: Date, tz: string): string {
  return fmt(tz, { day: '2-digit', month: '2-digit', year: 'numeric' }, 'ds').format(date);
}

/** ISO-8601 completo NA ZONA, com offset: "2026-07-30T04:12:07−03:00". */
export function fmtIsoZoned(date: Date, tz: string): string {
  const p = zonedParts(date, tz);
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const off = offsetMinutes(date, tz);
  const sign = off < 0 ? '-' : '+';
  const a = Math.abs(off);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`
    + `${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

/**
 * Diferença de fuso entre duas zonas, em minutos, no instante dado.
 * Positivo = `b` está À FRENTE de `a`.
 */
export function tzDiffMinutes(date: Date, a: string, b: string): number {
  return offsetMinutes(date, b) - offsetMinutes(date, a);
}

/** Rótulo pt-BR da diferença: "+4 h", "−3 h 30", "mesmo fuso". */
export function tzDiffLabel(minutes: number): string {
  if (minutes === 0) return 'mesmo fuso';
  const sign = minutes < 0 ? '−' : '+';
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  if (!h) return `${sign}${m} min`;
  return `${sign}${h} h${m ? ' ' + m : ''}`;
}

/**
 * Diferença de DATA CIVIL entre duas zonas no mesmo instante: -1, 0 ou +1.
 * É o que faz o comparador dizer "amanhã em Tóquio".
 */
export function dayShift(date: Date, base: string, other: string): number {
  const a = zonedParts(date, base);
  const b = zonedParts(date, other);
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / 86400000);
}

/**
 * Operação INVERSA de zonedParts: dado um horário de parede numa zona, devolve o
 * instante UTC correspondente. Usada para navegar a grade de mercados/expediente
 * ("quando abre a próxima sessão?") sem cair em erro de meia hora.
 *
 * Duas passadas porque o offset depende do próprio instante: a primeira estimativa
 * usa o offset do palpite, a segunda corrige quando o palpite caiu do outro lado de
 * uma transição de DST. Convergir em duas iterações é suficiente para qualquer zona
 * real (nenhuma tem transição maior que 1 h nem duas transições no mesmo dia).
 */
export function instantFromZoned(
  year: number, month: number, day: number,
  hour: number, minute: number, tz: string,
): Date {
  const guessUTC = Date.UTC(year, month - 1, day, hour, minute, 0);
  let off = offsetMinutes(new Date(guessUTC), tz);
  let t = guessUTC - off * 60000;
  const off2 = offsetMinutes(new Date(t), tz);
  if (off2 !== off) {
    off = off2;
    t = guessUTC - off * 60000;
  }
  return new Date(t);
}

/** Meia-noite local (na zona) do dia que contém `date`, como instante. */
export function startOfLocalDay(date: Date, tz: string): Date {
  const p = zonedParts(date, tz);
  return instantFromZoned(p.year, p.month, p.day, 0, 0, tz);
}

/** Chave "MM-DD" do dia civil local — casa com as listas de feriados. */
export function monthDayKey(date: Date, tz: string): string {
  const p = zonedParts(date, tz);
  return `${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Lista de zonas IANA distintas dentro de um conjunto de cidades. */
export function uniqueOffsets(date: Date, zones: string[]): number {
  const s = new Set<number>();
  for (const z of zones) s.add(offsetMinutes(date, z));
  return s.size;
}
