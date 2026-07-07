import { useState } from 'react';

// Mecânica de ordenação REUSÁVEL de mini-datagrid (Seções, Propostas, …).
// Colunas alinham via CSS `grid-template-columns: var(--cols)` no wrapper de cada grid.
export type GridSort = { key: string; dir: 'asc' | 'desc' };
export type GridCol = { key?: string; label?: string; num?: boolean }; // sem key = célula-espaçador (chevron/ações)

// Estado + ciclo (1º asc, 2º desc, 3º volta ao default); persiste em localStorage.
// Funciona com default asc (Seções: #↑) ou desc (Propostas: número↓): clicar a coluna default
// alterna asc/desc; clicar outra coluna faz asc→desc→default.
export function useGridSort(storageKey: string, def: GridSort) {
  const [sort, setSort] = useState<GridSort>(() => {
    try { const v = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (v && v.key && (v.dir === 'asc' || v.dir === 'desc')) return v; } catch { /* default */ }
    return def;
  });
  function cycle(key: string) {
    setSort((s) => {
      let next: GridSort;
      if (key === def.key) next = { key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' };
      else if (s.key !== key) next = { key, dir: 'asc' };
      else if (s.dir === 'asc') next = { key, dir: 'desc' };
      else next = def; // 3º clique numa coluna não-default → volta ao default
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }
  return { sort, cycle };
}

// Ordena por comparators[key] (que retornam ordem ASCENDENTE); aplica a direção.
export function sortRows<T>(rows: T[], sort: GridSort, comparators: Record<string, (a: T, b: T) => number>): T[] {
  const cmp = comparators[sort.key];
  if (!cmp) return rows;
  const dir = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => cmp(a, b) * dir);
}

// Cabeçalho de colunas clicável (aria-sort, seta ↑/↓). Estilo em .k-dg-head/.k-dg-th (styles.css).
export function DataGridHeader({ cols, sort, onSort }: { cols: GridCol[]; sort: GridSort; onSort: (k: string) => void }) {
  const arrow = (k: string) => (sort.key === k ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '');
  const ariaSort = (k: string): 'ascending' | 'descending' | 'none' =>
    (sort.key === k ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  return (
    <div className="k-dg-head" role="row">
      {cols.map((c, i) => (
        c.key
          ? <button key={i} type="button" aria-sort={ariaSort(c.key)} onClick={() => onSort(c.key!)}
              className={'k-dg-th' + (c.num ? ' k-dg-num' : '') + (sort.key === c.key ? ' is-sorted' : '')}>{c.label}{arrow(c.key)}</button>
          : <span key={i} className="k-dg-c" aria-hidden="true" />
      ))}
    </div>
  );
}
