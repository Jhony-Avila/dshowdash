// _shared-react/lib/formato.ts — formatacao pt-BR compartilhada
// @version 1.0.0  @created 2026-07-30
//
// PONTO UNICO de formatacao. Se cada painel formatar por conta propria, a mesma
// moeda aparece de dois jeitos em telas vizinhas.
//
// ATENCAO (licao ja registrada no projeto): NUNCA usar Number() em entrada
// monetaria pt-BR — Number("12,50") e NaN e grava zero silenciosamente.
// Para LER numero digitado pelo usuario, use parseNum() aqui debaixo.

export type TipoFormato =
  | 'texto' | 'inteiro' | 'numero' | 'moeda' | 'percentual'
  | 'data' | 'datahora' | 'booleano' | 'badge' | 'medidor'
  | 'imagem' | 'link';

const fMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const fMoedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1,
});
const fInteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const fNumero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const fData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function moeda(v: number | null | undefined, compacta = false): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return compacta && Math.abs(v) >= 10000 ? fMoedaCompacta.format(v) : fMoeda.format(v);
}

export function inteiro(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return fInteiro.format(v);
}

export function numero(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return fNumero.format(v);
}

export function percentual(v: number | null | undefined, casas = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${v.toFixed(casas).replace('.', ',')}%`;
}

/** Aceita 'YYYY-MM-DD' e ISO. Trata a data pura como local, nao como UTC. */
export function data(v: string | null | undefined): string {
  if (!v) return '—';
  const puro = /^\d{4}-\d{2}-\d{2}$/.test(v);
  const d = puro ? new Date(`${v}T12:00:00`) : new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : fData.format(d);
}

export function dataHora(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : fDataHora.format(d);
}

/** "há 6 minutos" — usado no indicador de última sincronização. */
export function haQuantoTempo(v: string | null | undefined): string {
  if (!v) return 'nunca';
  const d = new Date(v).getTime();
  if (Number.isNaN(d)) return String(v);
  const seg = Math.floor((Date.now() - d) / 1000);
  if (seg < 0) return 'agora';
  if (seg < 60) return 'há instantes';
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(h / 24);
  return `há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

export function booleano(v: unknown): string {
  return v === true ? 'Sim' : v === false ? 'Não' : '—';
}

/** Formata pelo tipo declarado na coluna — a mesma funcao serve grid e KPI. */
export function porTipo(v: unknown, tipo: TipoFormato, compacta = false): string {
  if (v === null || v === undefined || v === '') return '—';
  switch (tipo) {
    case 'moeda':      return moeda(Number(v), compacta);
    case 'inteiro':    return inteiro(Number(v));
    case 'numero':     return numero(Number(v));
    case 'percentual': return percentual(Number(v));
    case 'data':       return data(String(v));
    case 'datahora':   return dataHora(String(v));
    case 'booleano':   return booleano(v);
    default:           return String(v);
  }
}

/**
 * Le numero digitado em pt-BR. "1.234,56" -> 1234.56
 * Devolve null (nunca 0, nunca NaN) quando nao da para interpretar — assim quem
 * chama decide o padrao com ?? em vez de gravar zero por acidente.
 */
export function parseNum(entrada: string | number | null | undefined): number | null {
  if (typeof entrada === 'number') return Number.isFinite(entrada) ? entrada : null;
  if (entrada === null || entrada === undefined) return null;
  const s = String(entrada).trim();
  if (s === '') return null;
  const limpo = s.replace(/[R$\s ]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

/** Trunca preservando palavra inteira. */
export function truncar(s: string, max: number): string {
  if (s.length <= max) return s;
  const corte = s.slice(0, max);
  const esp = corte.lastIndexOf(' ');
  return `${esp > max * 0.6 ? corte.slice(0, esp) : corte}…`;
}
