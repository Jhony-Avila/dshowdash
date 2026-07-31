// lib/tz.ts — formatação e fuso, SEMPRE na borda.
// @version 1.0.0  @created 2026-07-29
//
// Contraparte de api/google-calendar/lib/Tz.php. A regra do módulo:
// o banco guarda UTC, a API trafega ISO-8601 com offset, e a conversão para o
// fuso de exibição acontece aqui — nunca em SQL (ver §4.1 do relatório da
// Fase 0: CONVERT_TZ por nome devolve NULL neste MySQL, e NULL some da grade
// sem erro nenhum no log).
//
// Usa `Intl` nativo em vez de date-fns/Luxon: o projeto não tem lib de data
// instalada e o package.json é COMPARTILHADO por todos os painéis React —
// engordar a raiz por causa de formatação que o browser já faz não se paga.

/** Fuso do usuário, com o do calendário como fallback declarado. */
export function fusoDoUsuario(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'America/Sao_Paulo';
  }
}

const cacheFmt = new Map<string, Intl.DateTimeFormat>();
function fmt(tz: string, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const chave = tz + JSON.stringify(opts);
  let f = cacheFmt.get(chave);
  if (!f) {
    f = new Intl.DateTimeFormat('pt-BR', { timeZone: tz, ...opts });
    cacheFmt.set(chave, f);
  }
  return f;
}

/** "09:30" no fuso pedido. */
export function hora(iso: string, tz: string): string {
  return fmt(tz, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}

/** "qua, 30 de jul" no fuso pedido. */
export function diaCurto(iso: string, tz: string): string {
  return fmt(tz, { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(iso));
}

/** "30/07/2026 09:30". */
export function dataHora(iso: string, tz: string): string {
  return fmt(tz, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(iso));
}

/** yyyy-mm-dd de um Date, no fuso pedido (para montar a janela da API). */
export function ymd(d: Date, tz: string): string {
  const p = fmt(tz, { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')}`;
}

/** Hoje em yyyy-mm-dd no fuso pedido. */
export function hojeYmd(tz: string): string {
  return ymd(new Date(), tz);
}

export function somaDias(ymdStr: string, dias: number): string {
  const [a, m, d] = ymdStr.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

/** "1h30" / "45min" — duração legível. */
export function duracao(min: number): string {
  if (min <= 0) return '0min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

/** Contagem regressiva curta: "em 12 min", "em 2 h", "agora". */
export function faltam(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'agora';
  const min = Math.round(ms / 60000);
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `em ${h} h`;
  return `em ${Math.floor(h / 24)} d`;
}

/** "há 2 min" — para "última sincronização". */
export function desde(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'agora';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

/**
 * Exibição dupla do §47.2: só aparece quando a diferença é relevante.
 * Mostrar "10:00 São Paulo · 10:00 São Paulo" seria ruído; a função devolve
 * null nesse caso e a UI simplesmente não renderiza o segundo horário.
 */
export function horaSecundaria(iso: string, tzPrincipal: string, tzOutro: string): string | null {
  if (!tzOutro || tzOutro === tzPrincipal) return null;
  const a = hora(iso, tzPrincipal);
  const b = hora(iso, tzOutro);
  return a === b ? null : b;
}

/** Nome curto do fuso para rótulo ("São Paulo", "Shanghai"). */
export function rotuloFuso(tz: string): string {
  const p = tz.split('/');
  return (p[p.length - 1] || tz).replace(/_/g, ' ');
}

/** Converte "yyyy-mm-dd" + "HH:mm" no fuso informado para ISO com offset. */
export function paraIsoComOffset(data: string, horaStr: string, tz: string): string {
  // Constrói o instante testando o offset do próprio fuso na data alvo: é o
  // jeito de acertar horário de verão sem lib externa.
  const tentativa = new Date(`${data}T${horaStr}:00Z`);
  const off = offsetMinutos(tentativa, tz);
  const real = new Date(tentativa.getTime() - off * 60000);
  // Reavalia: perto da virada de DST o offset pode mudar entre as duas leituras.
  const off2 = offsetMinutos(real, tz);
  const final = off2 === off ? real : new Date(tentativa.getTime() - off2 * 60000);
  return comOffset(final, tz);
}

/** Offset do fuso, em minutos, no instante dado (positivo a leste de UTC). */
export function offsetMinutos(d: Date, tz: string): number {
  const dtf = fmt(tz, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const p = dtf.formatToParts(d);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? '0');
  const comoUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return Math.round((comoUtc - d.getTime()) / 60000);
}

/** Formata um Date como ISO-8601 com o offset do fuso (não com "Z"). */
export function comOffset(d: Date, tz: string): string {
  const off = offsetMinutos(d, tz);
  const sinal = off >= 0 ? '+' : '-';
  const abs = Math.abs(off);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  const local = new Date(d.getTime() + off * 60000).toISOString().slice(0, 19);
  return `${local}${sinal}${hh}:${mm}`;
}
