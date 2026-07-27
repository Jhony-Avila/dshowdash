// components/viz/d3/Streamgraph.tsx — streamgraph (fluxo empilhado) temporal (D3, Fase 2).
// @version 1.0.0  @created 2026-07-24
//
// Composição de várias séries ao longo do tempo com offset "wiggle" (streamgraph):
// d3-shape.stack + stackOffsetWiggle + stackOrderInsideOut, áreas suavizadas (curveBasis).
// d3-scale posiciona X (tempo) e Y (fluxo). Legenda, guia vertical + tooltip unificado no
// hover e rótulos de data esparsos. Theme-aware. Renderiza <svg> (ChartCard exporta PNG).
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

const NS = 'http://www.w3.org/2000/svg';

export interface SerieStream { rotulo: string; valores: number[]; cor?: string; }
export interface StreamgraphProps {
  series: SerieStream[];
  labelsX?: string[];
  fmt?: (v: number) => string;
  altura?: number;
}
interface Tip { x: number; y: number; rotuloX: string; itens: { rotulo: string; valor: number; cor: string }[]; }

export function Streamgraph({ series, labelsX, fmt = (v) => String(v), altura = 260 }: StreamgraphProps) {
  const pal = useTokensAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 640, h: altura });
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(320, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current || series.length === 0 || (series[0]?.valores.length ?? 0) === 0) return;
    let cancelado = false;
    (async () => {
      const [{ scaleLinear }, { stack, stackOffsetWiggle, stackOrderInsideOut, area, curveBasis }] =
        await Promise.all([import('d3-scale'), import('d3-shape')]);
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;
      const n = series[0].valores.length;
      const cor = (i: number) => series[i].cor ?? pal.seq[i % pal.seq.length];
      const padT = 10, padB = 20, padL = 6, padR = 6;

      const chaves = series.map((_, i) => String(i));
      const linhas = Array.from({ length: n }, (_, t) => {
        const o: Record<string, number> = {};
        series.forEach((s, i) => { o[String(i)] = s.valores[t] ?? 0; });
        return o;
      });
      const empilhador = stack<Record<string, number>>().keys(chaves).offset(stackOffsetWiggle).order(stackOrderInsideOut);
      const camadas = empilhador(linhas);

      let yMin = Infinity, yMax = -Infinity;
      camadas.forEach((c) => c.forEach((p) => { if (p[0] < yMin) yMin = p[0]; if (p[1] > yMax) yMax = p[1]; }));
      const xEsc = scaleLinear().domain([0, n - 1]).range([padL, w - padR]);
      const yEsc = scaleLinear().domain([yMin, yMax]).range([h - padB, padT]);
      const areaGen = area<[number, number]>().x((_, i) => xEsc(i)).y0((d) => yEsc(d[0])).y1((d) => yEsc(d[1])).curve(curveBasis);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const gAreas = svg.querySelector('g[data-l="areas"]')!; gAreas.innerHTML = '';
      const gEixo = svg.querySelector('g[data-l="eixo"]')!; gEixo.innerHTML = '';
      const gGuia = svg.querySelector('g[data-l="guia"]')!; gGuia.innerHTML = '';

      camadas.forEach((c, i) => {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', areaGen(c as unknown as [number, number][]) ?? '');
        path.setAttribute('fill', cor(i)); path.setAttribute('fill-opacity', '0.85');
        path.setAttribute('stroke', pal.surface); path.setAttribute('stroke-width', '0.5');
        path.setAttribute('pointer-events', 'none');
        gAreas.appendChild(path);
      });

      // rótulos de data esparsos
      if (labelsX && labelsX.length === n) {
        const passo = Math.max(1, Math.ceil(n / 6));
        for (let i = 0; i < n; i += passo) {
          const t = document.createElementNS(NS, 'text');
          t.setAttribute('x', String(xEsc(i))); t.setAttribute('y', String(h - 6));
          t.setAttribute('text-anchor', i === 0 ? 'start' : 'middle');
          t.setAttribute('fill', pal.textDim); t.setAttribute('font-size', '10.5');
          t.textContent = labelsX[i];
          gEixo.appendChild(t);
        }
      }

      // guia vertical (oculta até o hover)
      const guia = document.createElementNS(NS, 'line');
      guia.setAttribute('y1', String(padT)); guia.setAttribute('y2', String(h - padB));
      guia.setAttribute('stroke', pal.text); guia.setAttribute('stroke-opacity', '0.45');
      guia.setAttribute('stroke-dasharray', '3 3'); guia.setAttribute('opacity', '0');
      gGuia.appendChild(guia);

      // overlay de captura (por cima de tudo)
      const hit = document.createElementNS(NS, 'rect');
      hit.setAttribute('x', '0'); hit.setAttribute('y', '0'); hit.setAttribute('width', String(w)); hit.setAttribute('height', String(h));
      hit.setAttribute('fill', 'transparent');
      hit.addEventListener('mousemove', (ev) => {
        const r = wrapRef.current!.getBoundingClientRect();
        const mx = ev.clientX - r.left;
        const i = Math.max(0, Math.min(n - 1, Math.round(xEsc.invert(mx))));
        guia.setAttribute('x1', String(xEsc(i))); guia.setAttribute('x2', String(xEsc(i))); guia.setAttribute('opacity', '1');
        setTip({
          x: ev.clientX - r.left, y: ev.clientY - r.top,
          rotuloX: labelsX?.[i] ?? String(i),
          itens: series.map((s, si) => ({ rotulo: s.rotulo, valor: s.valores[i] ?? 0, cor: cor(si) })),
        });
      });
      hit.addEventListener('mouseleave', () => { guia.setAttribute('opacity', '0'); setTip(null); });
      gGuia.appendChild(hit);
    })();
    return () => { cancelado = true; };
  }, [series, labelsX, pal, tam]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Streamgraph de composição ao longo do tempo">
        <g data-l="areas" /><g data-l="eixo" /><g data-l="guia" />
      </svg>
      <div style={{ position: 'absolute', left: 10, top: 6, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: pal.textDim, pointerEvents: 'none' }}>
        {series.map((s, i) => (
          <span key={s.rotulo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.cor ?? pal.seq[i % pal.seq.length], display: 'inline-block' }} />
            {s.rotulo}
          </span>
        ))}
      </div>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 190), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          <div style={{ marginBottom: 4, color: pal.textDim }}>{tip.rotuloX}</div>
          {tip.itens.map((it) => (
            <div key={it.rotulo} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: it.cor, display: 'inline-block' }} />
              {it.rotulo}: <b>{fmt(it.valor)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
