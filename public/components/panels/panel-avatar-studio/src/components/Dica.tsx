// components/Dica.tsx — tooltip por PORTAL no Overlay Root (AS4 Fase 0, §22).
// @version 1.0.0  @created 2026-07-30
//
// Correção estrutural do briefing 4.0: tooltips NUNCA podem ser recortados
// por overflow/stacking dos painéis. A caixa é renderizada no Overlay Root
// (filho direto de <body>, nível --z-tooltip da escala oficial §22.5), com:
//   • flip automático (acima ↔ abaixo, conforme o espaço disponível);
//   • clamp horizontal na viewport (respeita zoom do navegador);
//   • fechamento por Esc, scroll, resize e clique;
//   • delay de abertura consistente (250 ms);
//   • aria-describedby no gatilho enquanto aberta (acessível).
import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const ID_OVERLAY = 'avst-overlay-root';
const ATRASO_ABRIR = 250; // §22.4 — delay consistente

/** Overlay Root único do estúdio (App Shell → Overlay Root → Tooltips…). */
export function overlayRoot(): HTMLElement {
  let el = document.getElementById(ID_OVERLAY);
  if (!el) {
    el = document.createElement('div');
    el.id = ID_OVERLAY;
    el.setAttribute('data-avst-overlay-root', '');
    document.body.appendChild(el);
  }
  return el;
}

export function Dica({ alvo, id, cor, children }: {
  /** elemento gatilho (o card, o botão…) — a Dica escuta hover/focus nele */
  alvo: React.RefObject<HTMLElement | null>;
  /** id da caixa (vira aria-describedby do gatilho enquanto aberta) */
  id: string;
  /** cor da borda (raridade do item) */
  cor?: string;
  children: React.ReactNode;
}) {
  const [ancora, setAncora] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const caixaRef = useRef<HTMLDivElement>(null);
  const cronometro = useRef(0);

  // gatilho: abre com atraso no hover/focus, fecha em qualquer interação
  useEffect(() => {
    const el = alvo.current;
    if (!el) return;
    const abrir = () => {
      window.clearTimeout(cronometro.current);
      cronometro.current = window.setTimeout(() => {
        el.setAttribute('aria-describedby', id);
        setAncora(el.getBoundingClientRect());
      }, ATRASO_ABRIR);
    };
    const fechar = () => {
      window.clearTimeout(cronometro.current);
      el.removeAttribute('aria-describedby');
      setAncora(null);
      setPos(null);
    };
    const aoTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar(); };
    el.addEventListener('pointerenter', abrir);
    el.addEventListener('pointerleave', fechar);
    el.addEventListener('pointerdown', fechar);
    el.addEventListener('focus', abrir);
    el.addEventListener('blur', fechar);
    window.addEventListener('keydown', aoTecla);
    window.addEventListener('scroll', fechar, true); // dentro de scroll: fecha (posição nunca fica velha)
    window.addEventListener('resize', fechar);
    return () => {
      window.clearTimeout(cronometro.current);
      el.removeEventListener('pointerenter', abrir);
      el.removeEventListener('pointerleave', fechar);
      el.removeEventListener('pointerdown', fechar);
      el.removeEventListener('focus', abrir);
      el.removeEventListener('blur', fechar);
      window.removeEventListener('keydown', aoTecla);
      window.removeEventListener('scroll', fechar, true);
      window.removeEventListener('resize', fechar);
    };
  }, [alvo, id]);

  // mede a caixa já pintada (fora da tela) e decide acima/abaixo + clamp
  useLayoutEffect(() => {
    if (!ancora) return;
    const caixa = caixaRef.current;
    if (!caixa) return;
    const c = caixa.getBoundingClientRect();
    const cabeAcima = ancora.top - c.height - 10 >= 8; // calcula espaço e inverte quando preciso (§22.4)
    const top = cabeAcima ? ancora.top - c.height - 8 : ancora.bottom + 8;
    const left = Math.max(8, Math.min(
      window.innerWidth - c.width - 8,
      ancora.left + ancora.width / 2 - c.width / 2,
    ));
    setPos({ left, top });
  }, [ancora]);

  if (!ancora) return null;
  return createPortal(
    <div ref={caixaRef} id={id} role="tooltip"
      className={`avst-tip ${pos ? 'avst-tip-visivel' : ''}`}
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        borderColor: cor,
        '--avst-rar': cor,
      } as React.CSSProperties}>
      {children}
    </div>,
    overlayRoot(),
  );
}
