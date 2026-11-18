// panel-atributos/src/lib/formatar.ts — formatação pt-BR dos valores (mesma regra do app: decimal exato, sem float).
import type { Valor } from './tipos';
import { FAMILIAS_PRECIFICA } from './rotulos';

/** "1000.000000" → "1.000"; "2.500000" → "2,5"; casas definidas fixam o número de casas (sem arredondar por float). */
export function decimal(raw: string, casas: number | null = null): string {
  const neg = raw.startsWith('-');
  const [int0 = '0', frac0 = ''] = raw.replace(/^-/, '').split('.');
  let frac = frac0.replace(/0+$/, '');
  if (casas !== null && casas >= 0) frac = (frac0 + '0'.repeat(casas)).slice(0, casas).replace(/0+$/, '');
  const int = int0.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}${int}${frac ? ',' + frac : ''}`;
}

export function valor(v: Valor, unidade: string | null): string {
  if (v.estado === 'nao_se_aplica') return 'Não se aplica';
  if (v.estado === 'desconhecido') return 'Desconhecido';
  if (v.opcoes.length) return v.opcoes.join(', ');
  if (v.numero !== null) return decimal(v.numero) + (unidade ? ` ${unidade}` : '');
  if (v.booleano !== null) return v.booleano ? 'Sim' : 'Não';
  if (v.data) return dataCurta(v.data);
  return v.texto ?? '—';
}

/** Texto do usuário (vírgula decimal) → texto canônico para a API ("1.234,5" → "1234.5"; "2,5" → "2.5"). */
export function numeroParaApi(t: string): string {
  const s = t.trim().replace(/\s/g, '');
  // milhar nunca começa com 0: "0.001" e "0.250" são decimais, não 1 e 250
  if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(s)) return s.replace(/\./g, '').replace(',', '.');
  return s.replace(',', '.');
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : dataCurta(iso);
}

export const pctDe = (c: { feitos: number; total: number }) => (c.total > 0 ? Math.round((c.feitos / c.total) * 100) : null);

export function precifica(chave: string, bruto: unknown): string {
  const [familia, campo] = chave.split('.');
  const def = FAMILIAS_PRECIFICA[familia]?.campos[campo];
  return campoPrecifica(bruto, def?.unidade, def?.enumeracao);
}

export function campoPrecifica(bruto: unknown, unidade?: string, enumeracao?: Record<string, string>): string {
  if (bruto === null || bruto === undefined || bruto === '') return '—';
  if (typeof bruto === 'boolean') return bruto ? 'Sim' : 'Não';
  const s = String(bruto);
  if (enumeracao) return enumeracao[s] ?? s;
  if (/^-?\d+(\.\d+)?$/.test(s)) return decimal(s) + (unidade ? ` ${unidade}` : '');
  return s;
}

export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

/** Busca por nome ou ID (sem zero à esquerda: "0154" = 154). */
export function casaBusca(q: string, id: number, nome: string): boolean {
  const t = q.trim();
  if (!t) return true;
  if (/^\d+$/.test(t)) return String(id) === t.replace(/^0+(?=\d)/, '') || String(id).startsWith(t.replace(/^0+(?=\d)/, ''));
  const n = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return n(t).split(/\s+/).every((p) => n(nome).includes(p));
}
