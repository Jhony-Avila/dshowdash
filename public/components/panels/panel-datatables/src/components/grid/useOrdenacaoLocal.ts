// components/grid/useOrdenacaoLocal.ts — ordenação CLIENTE p/ o DataGrid.
// @version 1.0.0  @created 2026-07-21
//
// O DataGrid só reporta a intenção de ordenar (contrato server-side). Nas telas
// cujos dados já vêm inteiros do backend (listas pequenas/médias), este hook faz
// a ordenação no cliente usando o acessor `valor` de cada coluna, e devolve o que
// o grid espera: { linhas ordenadas, ordenacao, aoOrdenar }. Nulos/vazios por último.
import { useMemo, useState } from 'react';
import type { ColunaDef, OrdenacaoEstado } from './tipos';

export function useOrdenacaoLocal<T>(
  linhas: T[],
  colunas: ColunaDef<T>[],
  inicial: OrdenacaoEstado | null = null,
): { linhas: T[]; ordenacao: OrdenacaoEstado | null; aoOrdenar: (o: OrdenacaoEstado) => void } {
  const [ordenacao, setOrdenacao] = useState<OrdenacaoEstado | null>(inicial);

  const ordenadas = useMemo(() => {
    if (!ordenacao) return linhas;
    const col = colunas.find((c) => c.id === ordenacao.coluna);
    if (!col || !col.valor) return linhas;
    const acessor = col.valor;
    const dir = ordenacao.direcao === 'asc' ? 1 : -1;
    const vazio = (v: string | number | null): boolean => v === null || v === undefined || v === '';
    return [...linhas].sort((a, b) => {
      const va = acessor(a);
      const vb = acessor(b);
      // nulos/vazios sempre por último, independente da direção.
      if (vazio(va) && vazio(vb)) return 0;
      if (vazio(va)) return 1;
      if (vazio(vb)) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'pt-BR', { numeric: true, sensitivity: 'base' }) * dir;
    });
  }, [linhas, colunas, ordenacao]);

  return { linhas: ordenadas, ordenacao, aoOrdenar: setOrdenacao };
}
