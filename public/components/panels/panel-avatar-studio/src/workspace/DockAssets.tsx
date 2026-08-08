// workspace/DockAssets.tsx — INTERAÇÕES da Asset Dock horizontal do
// Modo Clássico (AS6 §103–§105, lote 831–840, flag as6.dock_classico —
// decisão #86; briefing complementar do Jhony 2026-08-08).
// @version 1.0.0  @created 2026-08-08
//
// Envolve a grade do trilho e adiciona: wheel vertical → rolagem
// HORIZONTAL (trackpad com deltaX natural passa direto), drag
// horizontal com threshold (não mata o clique nos cards), e SETAS nas
// extremidades que aparecem só quando há conteúdo escondido daquele
// lado. Flag off = children direto (DOM byte a byte). O scroller real
// é a .avst-grade interna (grid-auto-flow: column do trilho).
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { flag } from '../nucleo/flags';

export function DockAssets({ children }: { children: ReactNode }) {
  const ligada = flag('as6.dock_classico');
  const ref = useRef<HTMLDivElement>(null);
  const [pontas, setPontas] = useState({ esq: false, dir: false });
  const arrasto = useRef<{ x0: number; s0: number; moveu: boolean } | null>(null);

  const scroller = () => ref.current?.querySelector<HTMLElement>('.avst-grade') ?? null;

  const medir = useCallback(() => {
    const el = scroller();
    if (!el) return;
    const fim = el.scrollWidth - el.clientWidth;
    setPontas((p) => {
      const esq = el.scrollLeft > 8;
      const dir = el.scrollLeft < fim - 8;
      return p.esq === esq && p.dir === dir ? p : { esq, dir };
    });
  }, []);

  useEffect(() => {
    if (!ligada) return undefined;
    const el = scroller();
    if (!el) return undefined;
    medir();
    // wheel VERTICAL vira horizontal; deltaX real (trackpad) passa direto
    const aoRolarRoda = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // trackpad nativo
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    const aoRolar = () => medir();
    const ro = new ResizeObserver(medir);
    el.addEventListener('wheel', aoRolarRoda, { passive: false });
    el.addEventListener('scroll', aoRolar, { passive: true });
    ro.observe(el);
    return () => {
      el.removeEventListener('wheel', aoRolarRoda);
      el.removeEventListener('scroll', aoRolar);
      ro.disconnect();
    };
  }, [ligada, medir, children]);

  if (!ligada) return <>{children}</>;

  const pular = (direcao: 1 | -1) => {
    const el = scroller();
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div ref={ref} className="avst6-dock" data-teste="dock-v3"
      onPointerDown={(e) => {
        // drag só com botão principal e FORA de controles interativos
        if (e.button !== 0) return;
        const alvo = e.target as HTMLElement;
        if (alvo.closest('button, input, select, label, a')) return;
        const el = scroller();
        if (!el) return;
        arrasto.current = { x0: e.clientX, s0: el.scrollLeft, moveu: false };
      }}
      onPointerMove={(e) => {
        const a = arrasto.current;
        const el = scroller();
        if (!a || !el) return;
        const dx = e.clientX - a.x0;
        if (!a.moveu && Math.abs(dx) < 6) return; // threshold: clique sobrevive
        a.moveu = true;
        el.scrollLeft = a.s0 - dx;
      }}
      onPointerUp={() => { arrasto.current = null; }}
      onPointerLeave={() => { arrasto.current = null; }}>
      {pontas.esq && (
        <button type="button" className="avst6-dock-seta avst6-dock-seta-esq"
          aria-label="Assets anteriores" data-teste="dock-seta-esq"
          onClick={() => pular(-1)}><ChevronLeft size={18} aria-hidden /></button>
      )}
      {children}
      {pontas.dir && (
        <button type="button" className="avst6-dock-seta avst6-dock-seta-dir"
          aria-label="Mais assets" data-teste="dock-seta-dir"
          onClick={() => pular(1)}><ChevronRight size={18} aria-hidden /></button>
      )}
    </div>
  );
}
