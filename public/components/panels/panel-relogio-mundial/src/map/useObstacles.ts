/**
 * map/useObstacles.ts — retângulos da interface que cobrem o mapa.
 * @version 3.0.0
 *
 * PROBLEMA QUE ISTO RESOLVE: o mapa é full-bleed e os painéis de vidro flutuam por
 * cima. Um cartão de cidade que cai atrás de um painel não some — ele vaza pelo vidro
 * translúcido e vira ruído ilegível, sobreposto ao conteúdo do painel. Foi exatamente
 * o que apareceu na primeira prova visual: Los Angeles e Cidade do México brigando
 * com a lista de Favoritos, e Tóquio e Sydney atravessando o painel de Mercados.
 *
 * A saída é a mesma do Google Maps e do Apple Maps: rótulo que cairia sob a interface
 * simplesmente não é desenhado. Ele estaria oculto e inclicável de qualquer forma —
 * desenhar só custa poluição visual.
 *
 * As medidas são LIDAS DO DOM, não codificadas: os painéis mudam de tamanho ao
 * recolher, ao abrir o comparador e a cada breakpoint de container. Qualquer tabela
 * de posições fixas estaria errada na segunda interação.
 */
'use strict';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export interface Rect { x: number; y: number; w: number; h: number }

/** Está o ponto dentro de algum retângulo, com folga? */
export function isOccluded(x: number, y: number, rects: Rect[], margin = 6): boolean {
  for (const r of rects) {
    if (x >= r.x - margin && x <= r.x + r.w + margin
      && y >= r.y - margin && y <= r.y + r.h + margin) return true;
  }
  return false;
}

/**
 * Uma caixa centrada em (x,y) invade algum retângulo?
 *
 * A diferença entre isto e `isOccluded` decide entre SUMIR e ENCOLHER: se o ponto da
 * cidade está sob um painel, o marcador não tem o que fazer ali e é descartado; se só
 * o cartão grande esbarraria na borda do painel, o marcador vira compacto (ponto +
 * hora, ~46×16px) e a cidade continua no mapa. Sem essa distinção, com os painéis
 * abertos o mapa perdia 9 das 15 cidades.
 */
export function boxIntersects(
  x: number, y: number, w: number, h: number, rects: Rect[], margin = 4,
): boolean {
  const left = x - w / 2 - margin;
  const right = x + w / 2 + margin;
  const top = y - h / 2 - margin;
  const bottom = y + h / 2 + margin;
  for (const r of rects) {
    if (right > r.x && left < r.x + r.w && bottom > r.y && top < r.y + r.h) return true;
  }
  return false;
}

/**
 * Converte os retângulos da interface em margens de enquadramento do mapa.
 *
 * Só conta o que está ANCORADO numa borda: um painel colado à esquerda vira margem
 * esquerda; algo solto no meio da tela não vira margem nenhuma (empurrar o mapa por
 * causa de um elemento central deixaria o mapa torto sem ganho algum).
 */
export function insetsFromRects(rects: Rect[], width: number, height: number) {
  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;

  for (const r of rects) {
    const centroX = r.x + r.w / 2;
    const centroY = r.y + r.h / 2;
    const alturaRelevante = r.h > height * 0.18;
    const larguraRelevante = r.w > width * 0.35;

    if (alturaRelevante && centroX < width * 0.34) left = Math.max(left, r.x + r.w);
    else if (alturaRelevante && centroX > width * 0.66) right = Math.max(right, width - r.x);

    if (larguraRelevante && centroY < height * 0.24) top = Math.max(top, r.y + r.h);
    else if (larguraRelevante && centroY > height * 0.76) bottom = Math.max(bottom, height - r.y);
  }

  return {
    left: Math.round(left),
    right: Math.round(right),
    top: Math.round(top),
    bottom: Math.round(bottom),
  };
}

function sameRects(a: Rect[], b: Rect[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = b[i];
    // Tolerância de 1px: o subpixel do layout não deve disparar re-render.
    if (Math.abs(p.x - q.x) > 1 || Math.abs(p.y - q.y) > 1
      || Math.abs(p.w - q.w) > 1 || Math.abs(p.h - q.h) > 1) return false;
  }
  return true;
}

/**
 * Observa os elementos de interface dentro do palco e devolve os retângulos deles em
 * COORDENADAS DO PALCO (as mesmas que a projeção produz para os marcadores).
 *
 * Reage a redimensionamento (ResizeObserver) e a painel que abre/fecha
 * (MutationObserver na subárvore). O MutationObserver é filtrado para atributos e
 * lista de filhos e agenda a medição num rAF — observar uma árvore que a própria
 * medição altera é receita de laço infinito, e a guarda de igualdade de retângulos
 * fecha o ciclo.
 */
export function useObstacles(
  stageRef: RefObject<HTMLElement | null>,
  selector: string,
): Rect[] {
  const [rects, setRects] = useState<Rect[]>([]);
  const raf = useRef<number | null>(null);
  const atual = useRef<Rect[]>([]);

  const medir = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const base = stage.getBoundingClientRect();
    const novos: Rect[] = [];
    stage.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      novos.push({
        x: Math.round(r.left - base.left),
        y: Math.round(r.top - base.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    });
    if (!sameRects(atual.current, novos)) {
      atual.current = novos;
      setRects(novos);
    }
  }, [stageRef, selector]);

  const agendar = useCallback(() => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      medir();
    });
  }, [medir]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    medir();

    const ro = new ResizeObserver(agendar);
    ro.observe(stage);
    stage.querySelectorAll(selector).forEach((el) => ro.observe(el));

    const mo = new MutationObserver(agendar);
    mo.observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });

    return () => {
      ro.disconnect();
      mo.disconnect();
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [stageRef, selector, medir, agendar]);

  return rects;
}
