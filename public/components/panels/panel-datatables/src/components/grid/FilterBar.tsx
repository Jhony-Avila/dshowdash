// components/grid/FilterBar.tsx — barra de filtros PADRÃO (Elevação visual §5).
// @version 1.0.0  @created 2026-07-20
// Todas as telas de listagem usam exatamente esta barra: busca + filtros
// rápidos (chips) + limpar. Vai no slot `ferramentas` do DataGrid.
import { type JSX } from 'react';
import { Icone } from '../ui/Icone';
import css from './FilterBar.module.css';

export interface ChipFiltro { ativo: boolean; aoClicar: () => void; icone?: string; texto: string }

export function FilterBar({ busca, chips = [], aoLimpar, algumAtivo }: {
  busca?: { valor: string; aoMudar: (v: string) => void; aoSubmeter?: () => void; placeholder?: string };
  chips?: ChipFiltro[];
  aoLimpar?: () => void;
  algumAtivo?: boolean;
}): JSX.Element {
  return (
    <div className={css.raiz}>
      {busca && (
        <form className={css.buscaForm}
              onSubmit={(e) => { e.preventDefault(); busca.aoSubmeter?.(); }}>
          <Icone nome="Search" size={14} className={css.lupa} />
          <input className={css.busca} type="search" value={busca.valor}
            placeholder={busca.placeholder ?? 'Buscar…'} aria-label="Buscar"
            onChange={(e) => busca.aoMudar(e.target.value)} />
        </form>
      )}
      {chips.map((c, i) => (
        <button key={i} type="button" aria-pressed={c.ativo}
          className={c.ativo ? css.chipAtivo : css.chip} onClick={c.aoClicar}>
          {c.icone && <Icone nome={c.icone} size={12} />} {c.texto}
        </button>
      ))}
      {aoLimpar && algumAtivo && (
        <button type="button" className={css.limpar} onClick={aoLimpar}>
          <Icone nome="X" size={12} /> Limpar
        </button>
      )}
    </div>
  );
}
