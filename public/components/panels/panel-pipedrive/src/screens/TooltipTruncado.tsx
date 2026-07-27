// screens/TooltipTruncado.tsx — tooltip que aparece SÓ quando o conteúdo está truncado.
// @version 1.0.0  @created 2026-07-24  (Elevação visual — Fase 2 do grid)
//
// Uma única instância por grid (delegação de eventos na tabela) em vez de um hook por célula:
// com 200 linhas × 9 colunas seriam ~1.800 instâncias de Floating UI. Aqui é 1.
// Estratégia 'fixed' para não ser cortada pelo overflow do cartão do grid.
import { useCallback, useState } from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';

/** Acha, na célula, o elemento cujo texto está cortado por ellipsis. */
function acharTruncado(celula: HTMLElement): HTMLElement | null {
  const candidatos: HTMLElement[] = [celula, ...Array.from(celula.querySelectorAll<HTMLElement>('*'))];
  for (const el of candidatos) {
    if (el.scrollWidth > el.clientWidth + 1 && (el.textContent ?? '').trim() !== '') return el;
  }
  return null;
}

export function useTooltipTruncado() {
  const [conteudo, setConteudo] = useState<string | null>(null);
  const { refs, floatingStyles } = useFloating({
    placement: 'top',
    strategy: 'fixed',
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const onMouseOver = useCallback((e: React.MouseEvent) => {
    const alvo = (e.target as HTMLElement | null)?.closest?.('td, th') as HTMLElement | null;
    if (!alvo) { setConteudo(null); return; }
    const el = acharTruncado(alvo);
    if (!el) { setConteudo(null); return; }
    refs.setReference(el);
    setConteudo((el.textContent ?? '').trim());
  }, [refs]);

  const onMouseLeave = useCallback(() => setConteudo(null), []);

  const tooltip = conteudo
    ? <div ref={refs.setFloating} style={floatingStyles} className="pp-tip" role="tooltip">{conteudo}</div>
    : null;

  return { handlers: { onMouseOver, onMouseLeave }, tooltip };
}
