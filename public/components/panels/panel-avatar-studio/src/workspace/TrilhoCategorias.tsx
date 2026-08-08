// workspace/TrilhoCategorias.tsx — SIDEBAR de categorias do workspace
// (AS6 L2 §39, lote 771–780 — decisão #79, fase 1 da componentização).
// @version 1.0.0  @created 2026-08-08
//
// Extração VERBATIM do <nav> do ShellStudio: DOM byte a byte o mesmo.
import { CATEGORIAS } from '../services/AvatarCatalog';
import type { CategoriaId } from '../domain/types';

export interface PropsTrilhoCategorias {
  categoria: CategoriaId;
  /** ≤84px: só a inicial (o pai calcula a partir da largura arrastável) */
  compacta: boolean;
  aoEscolher: (id: CategoriaId) => void;
}

export function TrilhoCategorias({ categoria, compacta, aoEscolher }: PropsTrilhoCategorias) {
  return (
    <nav className={`avst5-sidebar${compacta ? ' avst5-sidebar-compacta' : ''}`} aria-label="Categorias">
      {CATEGORIAS.map((c) => (
        <button key={c.id} type="button"
          className={`avst5-cat${categoria === c.id ? ' avst5-cat-on' : ''}`}
          title={c.nome} onClick={() => aoEscolher(c.id)}>
          <span className="avst5-cat-inicial" aria-hidden>{c.nome.slice(0, 1)}</span>
          {!compacta && <span>{c.nome}</span>}
        </button>
      ))}
    </nav>
  );
}
