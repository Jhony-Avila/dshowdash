/**
 * app/useRipple.ts — microinteração de toque (ripple) em todos os botões do painel.
 * @version 3.1.0
 *
 * O briefing pede ripple. A implementação comum é embrulhar cada botão num componente
 * de ripple — o que significa tocar em 16 componentes e carregar estado em cada um.
 *
 * Aqui é UM listener delegado na raiz do painel. Ele só escreve duas custom properties
 * com as coordenadas do clique e reinicia uma animação CSS; a onda em si é desenhada
 * por `::after` na folha de estilo. Zero re-render do React, zero estado, e qualquer
 * botão novo ganha o efeito de graça — inclusive os que ainda nem existem.
 *
 * `prefers-reduced-motion` desliga tudo pela própria CSS: quem pediu menos movimento
 * não recebe onda nenhuma, e nada aqui precisa saber disso.
 */
'use strict';

import { useEffect, type RefObject } from 'react';

/** Botões que NÃO recebem ripple: alvos minúsculos ou que já têm animação própria. */
const SEM_RIPPLE = '.wcm-fav__grip, .wcm-search__clear, .wcm-marker, .wcm-evpin';

export function useRipple(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onDown = (e: PointerEvent) => {
      const alvo = (e.target as HTMLElement | null)?.closest('button');
      if (!alvo || !root.contains(alvo)) return;
      if (alvo.matches(SEM_RIPPLE) || alvo.closest(SEM_RIPPLE)) return;
      if (alvo.disabled) return;

      const r = alvo.getBoundingClientRect();
      // Coordenada relativa ao botão; o CSS usa como centro da onda.
      alvo.style.setProperty('--wcm-rx', `${e.clientX - r.left}px`);
      alvo.style.setProperty('--wcm-ry', `${e.clientY - r.top}px`);

      // Reiniciar a animação exige remover a classe, forçar reflow e repor —
      // trocar só a classe não reinicia um keyframe já em execução.
      alvo.classList.remove('wcm-rippling');
      void alvo.offsetWidth;
      alvo.classList.add('wcm-rippling');
    };

    const onEnd = (e: AnimationEvent) => {
      if (e.animationName !== 'wcm-ripple') return;
      (e.target as HTMLElement).classList.remove('wcm-rippling');
    };

    // pointerdown (não click): a onda tem que sair no toque, não na soltura.
    root.addEventListener('pointerdown', onDown, true);
    root.addEventListener('animationend', onEnd, true);
    return () => {
      root.removeEventListener('pointerdown', onDown, true);
      root.removeEventListener('animationend', onEnd, true);
    };
  }, [rootRef]);
}
