import { useMemo, useState } from 'react';

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

// ── Grid DECLARATIVO (config-driven) ──────────────────────────────────────────
// Uma coluna é UMA entrada de ColumnDef. Adicionar coluna futura = acrescentar aqui,
// sem tocar na mecânica do grid (aceite: config declarativa). A célula é descrita por
// CellSpec (dado puro, sem JSX) e o grid a renderiza — mantém este módulo domain-free.
export type CellSpec = {
  text: string;              // conteúdo textual (já formatado pt-BR pelo formatter da coluna)
  title?: string;            // tooltip nativo (texto completo p/ células truncadas)
  badge?: string;            // se presente, renderiza <span class="k-badge {badge}"> (status)
};
export type ColFilter = 'text' | 'select' | 'daterange' | 'budget';
export type ColumnDef<T = any> = {
  key: string;               // id estável (ordenação, persistência de visíveis/ordem/larguras)
  label: string;
  width: string;             // trilha CSS grid (ex.: '96px', 'minmax(150px,1.4fr)')
  defaultVisible: boolean;   // entra ligada por padrão? (extras = false, ligáveis no seletor)
  num?: boolean;             // alinha à direita (numérico/monetário)
  sticky?: 'left' | 'right'; // fixa no scroll horizontal (Número à esq., Ações à dir.)
  filter?: ColFilter;        // tipo de filtro por coluna no header
  fixed?: boolean;           // não removível do seletor (ex.: Número)
  cmp?: (a: T, b: T) => number;      // comparador ASCENDENTE (dir aplicada por sortRows); ausente = não ordenável
  accessor?: (row: T) => any;        // valor BRUTO da coluna (usado por filtros; ausente = cai no render().text)
  render: (row: T) => CellSpec;      // descritor da célula
};

// Deriva o mapa de comparadores (consumido por sortRows) a partir das defs de coluna.
export function comparatorsOf<T>(cols: ColumnDef<T>[]): Record<string, (a: T, b: T) => number> {
  const m: Record<string, (a: T, b: T) => number> = {};
  for (const c of cols) if (c.cmp) m[c.key] = c.cmp;
  return m;
}

// GridCol[] (p/ DataGridHeader) a partir das defs visíveis — reusa o header ordenável existente.
export function toGridCols<T>(cols: ColumnDef<T>[]): GridCol[] {
  return cols.map((c) => (c.cmp ? { key: c.key, label: c.label, num: c.num } : { label: c.label, num: c.num }));
}

// Trilha `grid-template-columns` a partir das larguras das colunas visíveis (aplicada inline em --cols).
export function trackTemplate<T>(cols: ColumnDef<T>[]): string {
  return cols.map((c) => c.width).join(' ');
}

// Idem, mas respeitando larguras redimensionadas pelo usuário (widths[key] sobrepõe c.width).
export function trackTemplateW<T>(cols: ColumnDef<T>[], widths: Record<string, string>): string {
  return cols.map((c) => widths[c.key] || c.width).join(' ');
}

// ── Estado de COLUNAS (visibilidade, ordem, larguras) — persistido por usuário ────────────────
export type ColumnState = { order: string[]; hidden: string[]; widths: Record<string, string> };

function loadColState<T>(storageKey: string, cols: ColumnDef<T>[]): ColumnState {
  const keys = cols.map((c) => c.key);
  const def: ColumnState = { order: keys.slice(), hidden: cols.filter((c) => !c.defaultVisible).map((c) => c.key), widths: {} };
  try {
    const v = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (v && Array.isArray(v.order)) {
      const known = new Set(keys);
      const order = v.order.filter((k: string) => known.has(k));
      for (const k of keys) if (!order.includes(k)) order.push(k);            // colunas NOVAS entram no fim
      const hidden = (Array.isArray(v.hidden) ? v.hidden : def.hidden).filter((k: string) => known.has(k));
      const widths = v.widths && typeof v.widths === 'object' ? v.widths : {};
      return { order, hidden, widths };
    }
  } catch { /* default */ }
  return def;
}

export function useColumnState<T>(storageKey: string, cols: ColumnDef<T>[]) {
  const [st, setSt] = useState<ColumnState>(() => loadColState(storageKey, cols));
  const persist = (n: ColumnState): ColumnState => { try { localStorage.setItem(storageKey, JSON.stringify(n)); } catch { /* noop */ } return n; };
  const colByKey = useMemo(() => Object.fromEntries(cols.map((c) => [c.key, c])) as Record<string, ColumnDef<T>>, [cols]);

  function setHidden(key: string, hide: boolean) {
    const col = colByKey[key];
    if (col?.fixed && hide) return;                                          // coluna fixa não some
    setSt((s) => { const h = new Set(s.hidden); hide ? h.add(key) : h.delete(key); return persist({ ...s, hidden: [...h] }); });
  }
  // Move `key` para a posição de `beforeKey` (ou fim se null).
  function move(key: string, beforeKey: string | null) {
    if (key === beforeKey) return;
    setSt((s) => {
      const order = s.order.filter((k) => k !== key);
      const at = beforeKey ? order.indexOf(beforeKey) : order.length;
      order.splice(at < 0 ? order.length : at, 0, key);
      return persist({ ...s, order });
    });
  }
  function setWidth(key: string, px: string) { setSt((s) => persist({ ...s, widths: { ...s.widths, [key]: px } })); }
  function reset() {
    const keys = cols.map((c) => c.key);
    setSt(persist({ order: keys.slice(), hidden: cols.filter((c) => !c.defaultVisible).map((c) => c.key), widths: {} }));
  }

  const ordered = useMemo(() => st.order.map((k) => colByKey[k]).filter(Boolean) as ColumnDef<T>[], [st.order, colByKey]);
  const visible = useMemo(() => ordered.filter((c) => !st.hidden.includes(c.key)), [ordered, st.hidden]);
  return { st, ordered, visible, setHidden, move, setWidth, reset };
}

// ── Ordenação MÚLTIPLA (shift+clique) ─────────────────────────────────────────
// Mantém uma lista ordenada de critérios; o 1º é primário, os demais desempatam.
export type GridSortItem = { key: string; dir: 'asc' | 'desc' };

export function useGridMultiSort(storageKey: string, def: GridSortItem[]) {
  const [sorts, setSorts] = useState<GridSortItem[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (Array.isArray(v) && v.length && v.every((x: any) => x && x.key && (x.dir === 'asc' || x.dir === 'desc'))) return v;
    } catch { /* default */ }
    return def;
  });
  const persist = (next: GridSortItem[]): GridSortItem[] => {
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* noop */ }
    return next;
  };
  // Clique simples = ordenação única (alterna asc/desc se já for a única ativa).
  // Shift+clique = adiciona/alterna critério secundário (asc → desc → remove).
  function toggle(key: string, additive: boolean) {
    setSorts((s) => {
      const idx = s.findIndex((x) => x.key === key);
      if (additive) {
        if (idx === -1) return persist([...s, { key, dir: 'asc' }]);
        if (s[idx].dir === 'asc') { const n = s.slice(); n[idx] = { key, dir: 'desc' }; return persist(n); }
        return persist(s.filter((x) => x.key !== key)); // asc → desc → remove
      }
      if (idx !== -1 && s.length === 1) return persist([{ key, dir: s[idx].dir === 'asc' ? 'desc' : 'asc' }]);
      return persist([{ key, dir: 'asc' }]);
    });
  }
  function remove(key: string) { setSorts((s) => persist(s.length > 1 ? s.filter((x) => x.key !== key) : def)); }
  function reset() { setSorts(persist(def)); }
  return { sorts, toggle, remove, reset };
}

// Ordena aplicando os critérios em ordem (estável: Array.prototype.sort é estável).
export function sortRowsMulti<T>(rows: T[], sorts: GridSortItem[], comparators: Record<string, (a: T, b: T) => number>): T[] {
  const active = sorts.filter((s) => comparators[s.key]);
  if (!active.length) return rows;
  return [...rows].sort((a, b) => {
    for (const s of active) { const c = comparators[s.key](a, b); if (c) return s.dir === 'asc' ? c : -c; }
    return 0;
  });
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
