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

/**
 * Parse pt-BR de número digitado pelo usuário. Aceita vírgula decimal e ponto de milhar
 * ("1.234,56" -> 1234.56, "12,50" -> 12.5) e também ponto decimal cru ("12.50" -> 12.5).
 * Vazio / inválido -> null (o chamador decide o fallback com ?? , NUNCA com || que engoliria 0).
 * Existe porque os inputs monetários/numéricos são texto e a UI induz vírgula (placeholder "0,00");
 * Number("12,50") daria NaN e gravava 0 silenciosamente, corrompendo os valores da proposta/PDF.
 */
export function parseNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim().replace(/[^\d.,\-]/g, ''); // descarta R$, espaços, letras
  if (s === '' || s === '-') return null;
  if (s.indexOf(',') !== -1) {
    // Vírgula presente = decimal pt-BR; pontos são milhar. "1.234,56" -> "1234.56".
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    // Só pontos, em grupos de 3 ("1.000", "1.234.567") = separador de milhar -> inteiro.
    s = s.replace(/\./g, '');
  }
  // Senão (ex.: "12.50", "12.5"), o ponto é tratado como decimal — compatível com digitação en.
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
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
