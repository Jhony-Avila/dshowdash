// components/MAGrid.tsx — data grid padrão do módulo (TanStack Table).
// @version 1.0.0  @created 2026-07-28
//
// Decisão aprovada pelo Jhony: TanStack Table + paginação incremental no
// lugar do AG Grid (zero dependências novas, padrão da casa, sem licença).
// Recursos: ordenação múltipla (shift+clique), busca global, colunas com
// alinhamento/formatador, zebra, cabeçalho fixo, exportação CSV, clique na
// linha, estados de carregamento/vazio, densidade compacta.
import { useMemo, useState, type ReactNode } from 'react';
import {
  flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel,
  useReactTable, type ColumnDef, type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Search } from 'lucide-react';
import { Carregando, EstadoVazio } from './ui';

const PAGINA = 50;

export interface ColunaMA<T> {
  id: string;
  titulo: string;
  valor: (linha: T) => string | number | null;
  render?: (linha: T) => ReactNode;
  alinhar?: 'esquerda' | 'direita' | 'centro';
  largura?: number;
}

export function MAGrid<T>({ dados, colunas, carregando, vazio, onLinha, exportarNome }: {
  dados: T[];
  colunas: ColunaMA<T>[];
  carregando?: boolean;
  vazio?: { titulo: string; detalhe?: string };
  onLinha?: (linha: T) => void;
  exportarNome?: string;
}) {
  const [ordenacao, setOrdenacao] = useState<SortingState>([]);
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(PAGINA);

  const defs = useMemo<ColumnDef<T>[]>(() => colunas.map((c) => ({
    id: c.id,
    header: c.titulo,
    accessorFn: (linha) => c.valor(linha),
    cell: (ctx) => (c.render ? c.render(ctx.row.original) : String(ctx.getValue() ?? '—')),
    sortingFn: 'basic',
    meta: { alinhar: c.alinhar ?? 'esquerda', largura: c.largura },
  })), [colunas]);

  const table = useReactTable({
    data: dados,
    columns: defs,
    state: { sorting: ordenacao, globalFilter: busca },
    onSortingChange: setOrdenacao,
    onGlobalFilterChange: setBusca,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _col, filtro) => {
      const alvo = String(filtro).toLowerCase();
      return colunas.some((c) => String(c.valor(row.original) ?? '').toLowerCase().includes(alvo));
    },
  });

  const linhas = table.getRowModel().rows;
  const visiveis = linhas.slice(0, limite);

  const exportarCsv = () => {
    const cab = colunas.map((c) => `"${c.titulo}"`).join(';');
    const corpo = linhas.map((r) =>
      colunas.map((c) => `"${String(c.valor(r.original) ?? '').replace(/"/g, '""')}"`).join(';')
    ).join('\n');
    const blob = new Blob(['﻿' + cab + '\n' + corpo], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${exportarNome ?? 'dados'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (carregando) return <Carregando altura={260} />;

  return (
    <div className="mads-grid-bloco">
      <div className="mads-grid-barra">
        <div className="mads-grid-busca">
          <Search size={13} aria-hidden />
          <input value={busca} placeholder="Buscar na tabela…"
            onChange={(e) => { setBusca(e.target.value); setLimite(PAGINA); }} />
        </div>
        <span className="mads-grid-total">{fmt(linhas.length)} registro{linhas.length === 1 ? '' : 's'}</span>
        <button className="mads-btn" onClick={exportarCsv} title="Exportar CSV">
          <Download size={13} aria-hidden /> CSV
        </button>
      </div>

      {linhas.length === 0 ? (
        <EstadoVazio titulo={vazio?.titulo ?? 'Nenhum registro encontrado'}
          detalhe={busca ? 'A busca está restringindo os resultados — tente limpar o filtro.' : vazio?.detalhe} />
      ) : (
        <div className="mads-grid-wrap">
          <table className="mads-grid">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const meta = h.column.columnDef.meta as { alinhar?: string; largura?: number } | undefined;
                    const dir = h.column.getIsSorted();
                    return (
                      <th key={h.id} style={{ width: meta?.largura, textAlign: meta?.alinhar === 'direita' ? 'right' : meta?.alinhar === 'centro' ? 'center' : 'left' }}>
                        <button className="mads-grid-th" onClick={h.column.getToggleSortingHandler()}
                          title="Ordenar (Shift+clique para múltiplas colunas)">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === 'asc' ? <ArrowUp size={11} aria-hidden />
                            : dir === 'desc' ? <ArrowDown size={11} aria-hidden />
                            : <ArrowUpDown size={11} className="mads-grid-sort" aria-hidden />}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {visiveis.map((r) => (
                <tr key={r.id} className={onLinha ? 'is-click' : ''}
                  onClick={() => onLinha?.(r.original)}>
                  {r.getVisibleCells().map((cel) => {
                    const meta = cel.column.columnDef.meta as { alinhar?: string } | undefined;
                    return (
                      <td key={cel.id} style={{ textAlign: meta?.alinhar === 'direita' ? 'right' : meta?.alinhar === 'centro' ? 'center' : 'left' }}>
                        {flexRender(cel.column.columnDef.cell, cel.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {linhas.length > limite && (
        <button className="mads-btn mads-grid-mais" onClick={() => setLimite((l) => l + PAGINA)}>
          Carregar mais ({visiveis.length} de {fmt(linhas.length)})
        </button>
      )}
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString('pt-BR');
