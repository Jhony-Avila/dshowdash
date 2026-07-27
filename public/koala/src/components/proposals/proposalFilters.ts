// Estado + lógica de FILTROS de Propostas — genérico e dirigido pela config de colunas
// (cada coluna declara `filter`; aqui só interpretamos). Sem duplicar lógica na UI.
import { dateBr } from '../../format';
import type { ColumnDef } from '../dataGrid';

export type DateRange = { from?: string; to?: string };
export type Filters = { q: string; byCol: Record<string, any> };

export const emptyFilters = (): Filters => ({ q: '', byCol: {} });

const norm = (s: any) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Um valor de filtro de coluna está "ativo" (aplicável)?
export function isColActive(col: ColumnDef, v: any): boolean {
  if (v == null || v === '') return false;
  if (col.filter === 'daterange') return !!(v.from || v.to);
  return true;
}

export function hasAnyFilter(cols: ColumnDef[], f: Filters): boolean {
  if (f.q.trim()) return true;
  return cols.some((c) => c.filter && isColActive(c, f.byCol[c.key]));
}

// Valor bruto da coluna para filtragem (accessor declarado; senão o texto renderizado).
function rawOf(col: ColumnDef, row: any): any {
  return col.accessor ? col.accessor(row) : col.render(row).text;
}

// A linha passa por TODOS os filtros de coluna ativos + a busca global?
export function rowPasses(row: any, cols: ColumnDef[], f: Filters): boolean {
  for (const c of cols) {
    if (!c.filter) continue;
    const v = f.byCol[c.key];
    if (!isColActive(c, v)) continue;
    const raw = rawOf(c, row);
    if (c.filter === 'text') {
      if (!norm(raw).includes(norm(v))) return false;
    } else if (c.filter === 'select') {
      if (String(raw) !== String(v)) return false;
    } else if (c.filter === 'budget') {
      const has = raw != null && String(raw) !== '';
      if (v === 'with' && !has) return false;
      if (v === 'without' && has) return false;
    } else if (c.filter === 'daterange') {
      const d = String(raw || '').slice(0, 10);
      if (v.from && (!d || d < v.from)) return false;
      if (v.to && (!d || d > v.to)) return false;
    }
  }
  const q = f.q.trim();
  if (q) {
    const n = norm(q);
    const hay = norm(row.proposal_number) + ' ' + norm(row.title) + ' ' + norm(row.client_display);
    if (!hay.includes(n)) return false;
  }
  return true;
}

export type Chip = { id: string; label: string };

// Chips de filtros ativos (com id p/ remoção individual). statusLabels rotula o select de Status.
export function activeChips(cols: ColumnDef[], f: Filters, statusLabels: Record<string, string>): Chip[] {
  const chips: Chip[] = [];
  if (f.q.trim()) chips.push({ id: '__q', label: `Busca: "${f.q.trim()}"` });
  for (const c of cols) {
    if (!c.filter) continue;
    const v = f.byCol[c.key];
    if (!isColActive(c, v)) continue;
    let val = '';
    if (c.filter === 'select') val = statusLabels[v] || String(v);
    else if (c.filter === 'budget') val = v === 'with' ? 'com vínculo' : 'sem vínculo';
    else if (c.filter === 'daterange') val = [v.from ? 'de ' + dateBr(v.from) : '', v.to ? 'até ' + dateBr(v.to) : ''].filter(Boolean).join(' ');
    else val = String(v);
    chips.push({ id: c.key, label: `${c.label}: ${val}` });
  }
  return chips;
}
