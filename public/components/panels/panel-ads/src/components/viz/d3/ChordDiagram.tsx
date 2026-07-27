// components/viz/d3/ChordDiagram.tsx — diagrama de cordas (sobreposição) (D3, Fase 2).
// @version 1.0.0  @created 2026-07-24
//
// Visualiza uma matriz simétrica de relações (ex.: usuários compartilhados entre públicos).
// d3-chord calcula o layout (arcos por grupo no anel externo + cordas entre grupos);
// d3-shape.arc desenha os arcos e d3-chord.ribbon as cordas. Cor por grupo, hover realça a
// corda/arco + tooltip, rótulos ao redor. Theme-aware. Renderiza <svg> (ChartCard exporta PNG).
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

const NS = 'http://www.w3.org/2000/svg';

export interface ChordDiagramProps {
  labels: string[];
  matrix: number[][];
  cores?: string[];
  fmt?: (v: number) => string;
  altura?: number;
}
interface Tip { x: number; y: number; texto: string; valor: number; }

export function ChordDiagram({ labels, matrix, cores, fmt = (v) => String(v), altura = 340 }: ChordDiagramProps) {
  const pal = useTokensAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 480, h: altura });
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(320, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current || matrix.length < 2) return;
    let cancelado = false;
    (async () => {
      const [{ chord, ribbon }, { arc }] = await Promise.all([import('d3-chord'), import('d3-shape')]);
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;
      const cx = w / 2, cy = h / 2;
      const outer = Math.min(w, h) * 0.5 - 46;
      const inner = outer - 12;
      const cor = (i: number) => cores?.[i] ?? pal.seq[i % pal.seq.length];

      const layout = chord().padAngle(0.06).sortSubgroups((a, b) => b - a);
      const cordas = layout(matrix);
      const arcGen = arc<{ startAngle: number; endAngle: number }>().innerRadius(inner).outerRadius(outer);
      const fitaGen = ribbon<unknown, unknown>().radius(inner);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const root = svg.querySelector('g[data-l="root"]')!;
      root.setAttribute('transform', `translate(${cx},${cy})`);
      const gFitas = root.querySelector('g[data-l="fitas"]')!; gFitas.innerHTML = '';
      const gArcos = root.querySelector('g[data-l="arcos"]')!; gArcos.innerHTML = '';
      const gLab = root.querySelector('g[data-l="lab"]')!; gLab.innerHTML = '';

      // cordas (relações)
      cordas.forEach((c) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', (fitaGen(c as never) as unknown as string) ?? '');
        p.setAttribute('fill', cor(c.source.index)); p.setAttribute('fill-opacity', '0.5');
        p.setAttribute('stroke', pal.surface); p.setAttribute('stroke-width', '0.4');
        p.style.transition = 'fill-opacity .15s ease';
        p.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, texto: `${labels[c.source.index]} ↔ ${labels[c.target.index]}`, valor: c.source.value });
          p.setAttribute('fill-opacity', '0.9');
        });
        p.addEventListener('mouseleave', () => { setTip(null); p.setAttribute('fill-opacity', '0.5'); });
        gFitas.appendChild(p);
      });

      // arcos dos grupos + rótulos
      cordas.groups.forEach((g) => {
        const a = document.createElementNS(NS, 'path');
        a.setAttribute('d', arcGen(g) ?? '');
        a.setAttribute('fill', cor(g.index)); a.setAttribute('stroke', pal.surface); a.setAttribute('stroke-width', '1');
        a.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, texto: `${labels[g.index]} — total compartilhado`, valor: g.value });
        });
        a.addEventListener('mouseleave', () => setTip(null));
        gArcos.appendChild(a);

        // rótulo radial (rotacionado ao longo do raio) — espalha rótulos de arcos pequenos
        const meio = (g.startAngle + g.endAngle) / 2;
        const virado = meio > Math.PI;
        const gt = document.createElementNS(NS, 'g');
        gt.setAttribute('transform', `rotate(${(meio * 180) / Math.PI - 90}) translate(${outer + 8},0)${virado ? ' rotate(180)' : ''}`);
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('dy', '0.35em');
        t.setAttribute('text-anchor', virado ? 'end' : 'start');
        t.setAttribute('fill', pal.textDim); t.setAttribute('font-size', '10.5');
        t.textContent = labels[g.index].length > 22 ? labels[g.index].slice(0, 21) + '…' : labels[g.index];
        gt.appendChild(t);
        gLab.appendChild(gt);
      });
    })();
    return () => { cancelado = true; };
  }, [labels, matrix, cores, pal, tam]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Diagrama de cordas (sobreposição)">
        <g data-l="root"><g data-l="fitas" /><g data-l="arcos" /><g data-l="lab" /></g>
      </svg>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 200), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          <div style={{ marginBottom: 2 }}>{tip.texto}</div>
          <div><b>{fmt(tip.valor)}</b> usuários</div>
        </div>
      )}
    </div>
  );
}
