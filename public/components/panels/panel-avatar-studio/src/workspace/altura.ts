// workspace/altura.ts — ALTURA REAL DISPONÍVEL do workspace (onda 1291,
// decisão #133, flag as6.dock_fit).
// @version 1.0.0  @created 2026-08-10
//
// Causa raiz do corte da dock (#112): `.avst5-corpo` era dimensionado por
// `calc(100vh - 150px)` — um chute do chrome ACIMA do shell. Sempre que o
// dashboard (header + cabeçalho do container + paddings) passa de 150px,
// o corpo estoura o viewport e a base da dock some embaixo da janela;
// quando fica abaixo, sobra faixa morta. Aqui o shell MEDE o espaço que
// realmente tem: do seu topo (na posição de scroll zero do scrollport
// ancestral) até a base visível do scrollport, descontando o
// padding-bottom do pai direto (o `__content` do container do dash).
// O valor vira `--avst5-alt` no próprio shell; o CSS (gate
// [data-dock-fit]) usa `height: var(--avst5-alt)` e o corpo passa a
// `flex: 1` — um único dono da altura, zero número mágico.
//
// Reage a: resize da janela/zoom (visualViewport), resize do scrollport
// e do pai (ResizeObserver), e só escreve quando muda ≥1px (nunca entra
// em loop com o próprio layout — o shell NÃO é observado, medidas vêm
// dos ancestrais). Cleanup completo no unmount.
import { useEffect } from 'react';
import type { RefObject } from 'react';

/** scrollport vertical ancestral mais próximo (ou null = viewport). */
function scrollportDe(el: HTMLElement): HTMLElement | null {
  let n = el.parentElement;
  while (n && n !== document.body) {
    const { overflowY } = getComputedStyle(n);
    if (overflowY === 'auto' || overflowY === 'scroll') return n;
    n = n.parentElement;
  }
  return null;
}

export function useAlturaDisponivel(ref: RefObject<HTMLElement | null>, ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return undefined;
    const shell = ref.current;
    if (!shell) return undefined;

    let quadro: number | null = null;
    const medir = () => {
      quadro = null;
      const el = ref.current;
      if (!el) return;
      const porto = scrollportDe(el);
      const r = el.getBoundingClientRect();
      // topo do shell NO CONTEÚDO do scrollport (imune ao scroll atual)
      let topo: number;
      let base: number;
      if (porto) {
        const rp = porto.getBoundingClientRect();
        topo = r.top - rp.top + porto.scrollTop;
        base = porto.clientHeight;
      } else {
        topo = r.top + window.scrollY;
        base = window.visualViewport?.height ?? window.innerHeight;
      }
      // padding/borda INFERIOR de toda a cadeia até o scrollport (o
      // `__content` do dashboard tem padding próprio; o body do harness
      // também) — cada um consome espaço abaixo do shell
      let pb = 0;
      let n: HTMLElement | null = el.parentElement;
      const fim = porto ?? document.body;
      while (n) {
        const cs = getComputedStyle(n);
        pb += (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        if (n === fim) break;
        n = n.parentElement;
      }
      // piso funcional: abaixo disso o workspace degrada com scroll
      // próprio em vez de esmagar preview e dock até o ilegível
      const alt = Math.max(430, Math.round(base - topo - pb));
      const atual = parseFloat(el.style.getPropertyValue('--avst5-alt')) || 0;
      if (Math.abs(atual - alt) >= 1) el.style.setProperty('--avst5-alt', `${alt}px`);
    };
    const agendar = () => { if (quadro === null) quadro = requestAnimationFrame(medir); };

    medir();
    window.addEventListener('resize', agendar);
    window.visualViewport?.addEventListener('resize', agendar);
    const ro = new ResizeObserver(agendar);
    const porto = scrollportDe(shell);
    if (porto) ro.observe(porto);
    if (shell.parentElement) ro.observe(shell.parentElement);
    return () => {
      if (quadro !== null) cancelAnimationFrame(quadro);
      window.removeEventListener('resize', agendar);
      window.visualViewport?.removeEventListener('resize', agendar);
      ro.disconnect();
      shell.style.removeProperty('--avst5-alt');
    };
  }, [ref, ativo]);
}
