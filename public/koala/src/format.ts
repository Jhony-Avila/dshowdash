// Formatação pt-BR CANÔNICA do Koala (consolidação 2026-07-04, F6/F7).
// Antes havia ~4 formatadores divergentes espalhados (alguns hardcodavam 'R$', ignorando a
// moeda da proposta; datas apareciam como ISO fatiado). Fonte única aqui.

/** Dinheiro na moeda da proposta (BRL default). Ex.: money(1500, 'USD') -> "US$ 1.500,00". */
export function money(v: any, currency: string = 'BRL'): string {
  const n = Number(v ?? 0);
  const cur = currency === 'USD' ? 'USD' : 'BRL';
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(n);
  } catch {
    return (cur === 'USD' ? 'US$ ' : 'R$ ') + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

/** Data dd/mm/aaaa a partir de 'YYYY-MM-DD...' ou ISO. Vazio -> '—'. */
export function dateBr(v: any): string {
  if (!v) return '—';
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

/** Data e hora dd/mm/aaaa hh:mm (quando houver hora). Vazio -> '—'. */
export function dateTimeBr(v: any): string {
  if (!v) return '—';
  const s = String(v);
  const dt = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (dt) return `${dt[3]}/${dt[2]}/${dt[1]} ${dt[4]}:${dt[5]}`;
  return dateBr(s);
}
