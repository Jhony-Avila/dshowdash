// workspace/altura.ts — ALTURA REAL DISPONÍVEL do workspace (onda 1291,
// decisão #133, flag as6.dock_fit; onda 1292, decisão #135 — medição v2).
// @version 2.0.0  @created 2026-08-10
//
// Causa raiz do corte da dock (#112): `.avst5-corpo` era dimensionado por
// `calc(100vh - 150px)` — um chute do chrome ACIMA do shell. O shell
// passa a MEDIR o espaço real e publicar `--avst5-alt`; o CSS (gate
// [data-dock-fit]) consome via `height: var(--avst5-alt)`.
//
// v2 (#135, screenshot de produção 2026-08-10): a v1 media pelo
// clientHeight do scrollport ancestral e estourava em DOIS cenários do
// dashboard real: (a) painel maximizado com `height: 100vh !important`
// começando ABAIXO da barra superior — o container é mais alto que o
// espaço visível; (b) taskbar/rodapé FIXO por cima da base da janela
// ("Central do sistema") — overlay não é ancestral, nenhum clientHeight
// o revela. A v2 mede em COORDENADAS VIVAS do viewport:
//   base = fundo visível = min( viewport visual,
//            fundo de TODO ancestral que recorta (auto/scroll/hidden/clip),
//            topo de barras FIXAS/STICKY sondadas na base via
//            elementsFromPoint — só faixas baixas, ≤180px )
//   topo = shell.top + scroll acumulado dos ancestrais (estado de
//          scroll zero — evita realimentação: rolar não "cresce" o alvo)
//   alt  = base − topo − padding/borda inferior da cadeia até o clip
// Reage a: resize (janela/zoom/ancestrais/body), SCROLL em captura, e
// re-medições tardias (0/300/1200ms — chrome do dash monta depois).
// Só escreve quando muda ≥1px (nunca entra em loop). Cleanup completo.
import { useEffect } from 'react';
import type { RefObject } from 'react';

const RECORTA = /(auto|scroll|hidden|clip)/;

/** fundo visível considerando viewport, ancestrais que recortam e
 *  barras fixas sondadas na base — coordenadas vivas do viewport. */
function fundoVisivel(el: HTMLElement): number {
  let base = window.visualViewport?.height ?? window.innerHeight;
  for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (RECORTA.test(cs.overflowY)) {
      const r = n.getBoundingClientRect();
      base = Math.min(base, r.top + n.clientTop + n.clientHeight);
    }
  }
  // sonda de OVERLAYS fixos na base (taskbar/rodapé): o que estiver
  // pintado logo acima do fundo, fora da árvore do shell, com position
  // fixed/sticky e altura de BARRA (≤180px), sobe o teto da medida
  const meioX = Math.max(8, Math.min(window.innerWidth - 8,
    el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2));
  for (let tent = 0; tent < 3; tent += 1) {
    const alvo = document.elementsFromPoint(meioX, base - 4).find((c) => {
      if (!(c instanceof HTMLElement)) return false;
      if (c === el || el.contains(c) || c.contains(el)) return false;
      const pos = getComputedStyle(c).position;
      if (pos !== 'fixed' && pos !== 'sticky') return false;
      const rc = c.getBoundingClientRect();
      return rc.top < base - 1 && base - rc.top <= 180 && rc.height <= 180;
    }) as HTMLElement | undefined;
    if (!alvo) break;
    base = alvo.getBoundingClientRect().top;
  }
  return base;
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
      const base = fundoVisivel(el);
      // topo no estado de scroll ZERO: soma o scroll dos ancestrais (e
      // da janela) — rolar para baixo não pode inflar a altura medida
      let topo = el.getBoundingClientRect().top + window.scrollY;
      let pb = 0;
      for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
        topo += n.scrollTop;
        const cs = getComputedStyle(n);
        pb += (parseFloat(cs.paddingBottom) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        if (RECORTA.test(cs.overflowY)) break; // cadeia até o 1º recorte
      }
      // piso funcional: abaixo disso o workspace degrada com scroll
      // próprio em vez de esmagar preview e dock até o ilegível
      const alt = Math.max(430, Math.round(base - topo - pb));
      const atual = parseFloat(el.style.getPropertyValue('--avst5-alt')) || 0;
      if (Math.abs(atual - alt) >= 1) el.style.setProperty('--avst5-alt', `${alt}px`);
    };
    const agendar = () => { if (quadro === null) quadro = requestAnimationFrame(medir); };

    medir();
    // o chrome do dashboard (header/rodapé/janela) pode montar DEPOIS
    // do shell — re-medições tardias pegam o layout assentado
    const tardias = [window.setTimeout(agendar, 300), window.setTimeout(agendar, 1200)];
    window.addEventListener('resize', agendar);
    window.addEventListener('scroll', agendar, { capture: true, passive: true });
    window.visualViewport?.addEventListener('resize', agendar);
    const ro = new ResizeObserver(agendar);
    ro.observe(document.body);
    if (shell.parentElement) ro.observe(shell.parentElement);
    for (let n: HTMLElement | null = shell.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (RECORTA.test(getComputedStyle(n).overflowY)) { ro.observe(n); break; }
    }
    return () => {
      if (quadro !== null) cancelAnimationFrame(quadro);
      tardias.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', agendar);
      window.removeEventListener('scroll', agendar, { capture: true } as EventListenerOptions);
      window.visualViewport?.removeEventListener('resize', agendar);
      ro.disconnect();
      shell.style.removeProperty('--avst5-alt');
    };
  }, [ref, ativo]);
}
