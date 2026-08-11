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
//
// lote 941–950 (AS6 §104–§105, flag as6.dock_mag — decisão #96):
//   • MAGNIFICAÇÃO estilo dock do macOS: cards perto do cursor crescem
//     com queda gaussiana (via CSS `scale:` — não briga com o transform
//     de hover dos tokens); §297 desliga com prefers-reduced-motion.
//   • MOMENTUM no drag: soltar com velocidade continua rolando com
//     atrito (rAF); §297 idem.
//   • SNAP: parado o momentum (ou wheel/seta), a rolagem assenta no
//     início do card mais próximo — scroll com cara de vitrine, não de
//     lista (§104).
// Off = interações do lote 831–840 byte a byte.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { flag } from '../nucleo/flags';

const reduzMovimento = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export function DockAssets({ children, ativa }: { children: ReactNode; ativa?: boolean }) {
  // decisão #112 (dock inferior do shell): o MESMO componente serve os
  // dois modos — `ativa` explícito (shell, gate as6.dock_inferior) ou o
  // gate clássico de sempre quando o prop não vem (byte a byte)
  const ligada = ativa ?? flag('as6.dock_classico');
  // §3398: dock_mag depende de dock_classico (flag() já resolve a árvore)
  const mag = ligada && flag('as6.dock_mag');
  const ref = useRef<HTMLDivElement>(null);
  const [pontas, setPontas] = useState({ esq: false, dir: false });
  const arrasto = useRef<{ x0: number; s0: number; moveu: boolean; vx: number; t0: number } | null>(null);
  const inercia = useRef<number | null>(null);

  const scroller = () => ref.current?.querySelector<HTMLElement>('.avst-grade') ?? null;

  // §104: passo de um card (largura + gap) medido do DOM real —
  // offsetWidth é largura de LAYOUT (imune ao `scale` da magnificação)
  const passoCard = useCallback(() => {
    const el = scroller();
    const card = el?.querySelector<HTMLElement>('.avst-card');
    if (!el || !card) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
    return card.offsetWidth + gap;
  }, []);

  // A grade JÁ tem scroll-snap CSS (x proximity, do trilho AAA): cada
  // set programático re-assenta no snap point e mataria a inércia.
  // Durante o voo o snap é SUSPENSO; devolvê-lo é o próprio assentamento
  // §104 (o proximity CSS pousa no card mais próximo sozinho).
  const restaurarSnap = useCallback(() => {
    scroller()?.style.removeProperty('scroll-snap-type');
  }, []);

  const pararInercia = useCallback(() => {
    if (inercia.current !== null) cancelAnimationFrame(inercia.current);
    inercia.current = null;
    restaurarSnap();
  }, [restaurarSnap]);

  const assentar = useCallback(() => { // snap suave §104
    const el = scroller();
    const passo = passoCard();
    if (!el || passo <= 0) { restaurarSnap(); return; }
    // snap points reais = offset do 1º card (padding) + k·passo
    const base = el.querySelector<HTMLElement>('.avst-card')?.offsetLeft ?? 0;
    const alvo = base + Math.round((el.scrollLeft - base) / passo) * passo;
    if (Math.abs(alvo - el.scrollLeft) > 1) el.scrollTo({ left: alvo, behavior: 'smooth' });
    // o CSS volta a mandar depois do pouso (scrollend; fallback por tempo)
    const devolver = () => { restaurarSnap(); el.removeEventListener('scrollend', devolver); };
    el.addEventListener('scrollend', devolver, { once: true });
    setTimeout(devolver, 600);
  }, [passoCard, restaurarSnap]);

  const lancarInercia = useCallback((vx0: number) => { // momentum §104
    const el = scroller();
    if (!el || reduzMovimento()) { assentar(); return; }
    el.style.scrollSnapType = 'none'; // suspende o snap durante o voo
    let vx = vx0; // px/frame (~60fps)
    const passo = () => {
      const fim = el.scrollWidth - el.clientWidth;
      el.scrollLeft = Math.max(0, Math.min(fim, el.scrollLeft - vx));
      vx *= 0.94; // atrito
      if (Math.abs(vx) > 0.6 && el.scrollLeft > 0 && el.scrollLeft < fim) {
        inercia.current = requestAnimationFrame(passo);
      } else {
        inercia.current = null;
        assentar();
      }
    };
    inercia.current = requestAnimationFrame(passo);
  }, [assentar]);

  // §105: magnificação — queda gaussiana em torno do cursor
  const magnificar = useCallback((clientX: number | null) => {
    const el = scroller();
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('.avst-card');
    cards.forEach((c) => {
      if (clientX === null) { c.style.removeProperty('--avst6-mag'); return; }
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - clientX);
      const s = 1 + 0.16 * Math.exp(-((d / 130) ** 2));
      if (s > 1.005) c.style.setProperty('--avst6-mag', s.toFixed(3));
      else c.style.removeProperty('--avst6-mag');
    });
  }, []);

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

  // lote 941–950: rAF do momentum morre SÓ no unmount — o efeito acima
  // re-roda a cada mudança de children (hover preview re-renderiza a
  // grade) e cancelaria a inércia no meio do voo
  useEffect(() => () => pararInercia(), [pararInercia]);

  if (!ligada) return <>{children}</>;

  const pular = (direcao: 1 | -1) => {
    const el = scroller();
    if (!el) return;
    pararInercia();
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div ref={ref} className="avst6-dock" data-teste="dock-v3"
      data-dock-mag={mag ? '' : undefined}
      onDragStart={(e) => {
        // QA 1101-1110: as6.touch marcou os cards draggable e o drag
        // NATIVO cancela os pointer events do pan (pointercancel) —
        // matava momentum/snap §104. No trilho clássico não existe alvo
        // de drop (o palco-drop é do shell novo), então aqui o pan vence
        // e o drag nativo é suprimido SÓ dentro da dock.
        e.preventDefault();
      }}
      onPointerDown={(e) => {
        // drag só com botão principal e FORA de controles interativos
        if (e.button !== 0) return;
        const alvo = e.target as HTMLElement;
        if (alvo.closest('button, input, select, label, a')) return;
        const el = scroller();
        if (!el) return;
        pararInercia();
        arrasto.current = { x0: e.clientX, s0: el.scrollLeft, moveu: false, vx: 0, t0: e.timeStamp };
      }}
      onPointerMove={(e) => {
        if (mag && !arrasto.current && !reduzMovimento()) magnificar(e.clientX); // §105
        const a = arrasto.current;
        const el = scroller();
        if (!a || !el) return;
        const dx = e.clientX - a.x0;
        if (!a.moveu && Math.abs(dx) < 6) return; // threshold: clique sobrevive
        a.moveu = true;
        const anterior = el.scrollLeft;
        el.scrollLeft = a.s0 - dx;
        // velocidade instantânea suavizada (px/frame) p/ o momentum §104
        const dt = Math.max(1, e.timeStamp - a.t0);
        a.vx = a.vx * 0.6 + (((anterior - el.scrollLeft) / dt) * 16) * 0.4;
        a.t0 = e.timeStamp;
      }}
      onPointerUp={() => {
        const a = arrasto.current;
        arrasto.current = null;
        if (mag && a?.moveu) lancarInercia(a.vx); // §104: momentum + snap
      }}
      onPointerLeave={() => {
        arrasto.current = null;
        if (mag) magnificar(null); // §105: sair = tudo volta ao natural
      }}>
      {/* onda 1295 (#138, briefing §26): na DOCK do shell novo (ativa
          explícito + as6.dock_fit) as setas ficam SEMPRE presentes e
          DESABILITAM no limite — affordance estável, sem "pop" ao rolar.
          No trilho clássico, comportamento anterior byte a byte. */}
      {(ativa !== undefined && flag('as6.dock_fit') ? true : pontas.esq) && (
        <button type="button" className="avst6-dock-seta avst6-dock-seta-esq"
          aria-label="Assets anteriores" data-teste="dock-seta-esq"
          disabled={ativa !== undefined && flag('as6.dock_fit') && !pontas.esq}
          onClick={() => pular(-1)}><ChevronLeft size={18} aria-hidden /></button>
      )}
      {children}
      {(ativa !== undefined && flag('as6.dock_fit') ? true : pontas.dir) && (
        <button type="button" className="avst6-dock-seta avst6-dock-seta-dir"
          aria-label="Mais assets" data-teste="dock-seta-dir"
          disabled={ativa !== undefined && flag('as6.dock_fit') && !pontas.dir}
          onClick={() => pular(1)}><ChevronRight size={18} aria-hidden /></button>
      )}
    </div>
  );
}
