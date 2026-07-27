// components/DataGrid.tsx — grade de dados reutilizável (§29).
// @version 1.0.0  @created 2026-07-21
// Busca instantânea, ordenação, densidade ajustável, cabeçalho fixo, zebra,
// formatação condicional (por coluna) e exportação CSV. Server-side/virtual e
// colunas configuráveis/reordenáveis ficam para a Fase 1 (paridade com panel-datatables).
import { useMemo, useState, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render?: (row: T) => ReactNode;
  /** Valor para ordenação (habilita clique no cabeçalho). */
  sortValue?: (row: T) => number | string;
  /** Valor para o CSV (fallback: sortValue → texto). */
  csv?: (row: T) => string | number;
  /** Classe condicional na célula (formatação §29.2). */
  cellClass?: (row: T) => string;
}

interface DataGridProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  searchText?: (row: T) => string;
  initialSortKey?: string;
  initialSortDir?: 'asc' | 'desc';
  csvName?: string;
  toolbarExtra?: ReactNode;
}

function baixarCsv<T>(rows: T[], cols: Column<T>[], nome: string) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = cols.map((c) => esc(c.header)).join(';');
  const body = rows.map((r) => cols.map((c) => {
    const v = c.csv ? c.csv(r) : (c.sortValue ? c.sortValue(r) : '');
    return esc(v);
  }).join(';')).join('\n');
  const blob = new Blob(['﻿' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${nome}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export function DataGrid<T>({
  rows, columns, rowKey, searchText, initialSortKey, initialSortDir = 'desc', csvName = 'ads', toolbarExtra,
}: DataGridProps<T>) {
  const [busca, setBusca] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(initialSortKey ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [dense, setDense] = useState(false);

  const filtradas = useMemo(() => {
    if (!busca.trim() || !searchText) return rows;
    const n = busca.trim().toLowerCase();
    return rows.filter((r) => searchText(r).toLowerCase().includes(n));
  }, [rows, busca, searchText]);

  const ordenadas = useMemo(() => {
    if (!sortKey) return filtradas;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtradas;
    const arr = [...filtradas];
    arr.sort((a, b) => {
      const va = col.sortValue!(a), vb = col.sortValue!(b);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
      else cmp = String(va).localeCompare(String(vb), 'pt-BR');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtradas, sortKey, sortDir, columns]);

  const clickSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('desc');
    }
  };

  return (
    <div className="ads-grid-wrap">
      <div className="ads-grid-toolbar">
        {searchText && (
          <label className="ads-search">
            <span aria-hidden>🔍</span>
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar…" aria-label="Buscar na tabela" />
          </label>
        )}
        <span className="ads-grid-count">{ordenadas.length} {ordenadas.length === 1 ? 'linha' : 'linhas'}</span>
        {toolbarExtra}
        <div className="ads-grid-tools-right">
          <button className="ads-chip" onClick={() => setDense((d) => !d)} title="Alternar densidade">
            {dense ? '↕ Confortável' : '↕ Compacto'}
          </button>
          <button className="ads-chip" onClick={() => baixarCsv(ordenadas, columns, csvName)} title="Exportar CSV">
            ⬇ CSV
          </button>
        </div>
      </div>
      <div className="ads-tablescroll">
        <table className={`ads-table${dense ? ' dense' : ''}`}>
          <thead>
            <tr>
              {columns.map((c) => {
                const sorted = sortKey === c.key;
                return (
                  <th key={c.key}
                    className={`${c.align === 'left' ? 'col-left' : ''}${sorted ? ' is-sorted' : ''}`}
                    onClick={() => clickSort(c)}
                    title={c.sortValue ? 'Ordenar' : undefined}>
                    {c.header}
                    {c.sortValue && <span className="ads-sort-ind">{sorted ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordenadas.length === 0 ? (
              <tr><td colSpan={columns.length} className="ads-grid-empty">Nenhum registro encontrado.</td></tr>
            ) : ordenadas.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => (
                  <td key={c.key} className={`${c.align === 'left' ? 'col-left' : ''} ${c.cellClass ? c.cellClass(r) : ''}`}>
                    {c.render ? c.render(r) : (c.sortValue ? String(c.sortValue(r)) : '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
