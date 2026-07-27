// components/viz/d3/GrafoForca.tsx — grafo de relacionamento por força (D3, Fase 2).
// @version 1.0.0  @created 2026-07-22
//
// Grafo dirigido por força para relações (campanha↔grupo↔palavra, recomendação↔afetados).
// Import parcial (d3-force/selection/zoom/drag). Zoom/pan, arrastar nós, hover realça
// vizinhança, clique dispara callback. Theme-aware (recalcula ao trocar tema).
import { useEffect, useRef } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

export interface NoGrafo { id: string; nome: string; grupo?: number; valor?: number; }
export interface ArestaGrafo { origem: string; destino: string; peso?: number; }

export interface GrafoForcaProps {
  nos: NoGrafo[];
  arestas: ArestaGrafo[];
  altura?: number;
  onSelecionar?: (id: string, nome: string) => void;
}

export function GrafoForca({ nos, arestas, altura = 340, onSelecionar }: GrafoForcaProps) {
  const pal = useTokensAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nos.length === 0) return;
    let cancelado = false;
    let parar: (() => void) | null = null;
    (async () => {
      const [d3f, d3s, d3z, d3d] = await Promise.all([
        import('d3-force'), import('d3-selection'), import('d3-zoom'), import('d3-drag'),
      ]);
      if (cancelado || !svgRef.current) return;
      const w = wrapRef.current?.clientWidth ?? 640;
      const h = altura;
      const seq = pal.seq;

      type N = NoGrafo & import('d3-force').SimulationNodeDatum;
      type L = { source: string | N; target: string | N; peso?: number };
      const dnodes: N[] = nos.map((n) => ({ ...n }));
      const dlinks: L[] = arestas.map((a) => ({ source: a.origem, target: a.destino, peso: a.peso }));

      const svg = d3s.select(svgRef.current);
      svg.attr('viewBox', `0 0 ${w} ${h}`);
      svg.selectAll('*').remove();
      const raiz = svg.append('g');
      const gLinks = raiz.append('g').attr('stroke', pal.border).attr('stroke-opacity', 0.5);
      const gNodes = raiz.append('g');
      const gLabels = raiz.append('g');

      const sim = d3f.forceSimulation<N>(dnodes)
        .force('link', d3f.forceLink<N, L>(dlinks).id((d) => d.id).distance(64).strength(0.6))
        .force('charge', d3f.forceManyBody().strength(-130))
        .force('center', d3f.forceCenter(w / 2, h / 2))
        // mantém os nós agrupados no centro (evita fuga para as bordas)
        .force('x', d3f.forceX(w / 2).strength(0.08))
        .force('y', d3f.forceY(h / 2).strength(0.1))
        .force('collide', d3f.forceCollide(20));

      const link = gLinks.selectAll<SVGLineElement, L>('line').data(dlinks).join('line')
        .attr('stroke-width', (d) => Math.max(1, (d.peso ?? 1)));

      const raio = (d: N) => 6 + Math.sqrt(d.valor ?? 1) * 1.4;
      const no = gNodes.selectAll<SVGCircleElement, N>('circle').data(dnodes).join('circle')
        .attr('r', raio).attr('fill', (d) => seq[(d.grupo ?? 0) % seq.length])
        .attr('stroke', pal.bg).attr('stroke-width', 1.5)
        .style('cursor', 'pointer');

      const rot = gLabels.selectAll<SVGTextElement, N>('text').data(dnodes).join('text')
        .text((d) => d.nome).attr('font-size', 10).attr('fill', pal.textDim)
        .attr('dx', (d) => raio(d) + 3).attr('dy', 3).style('pointer-events', 'none');

      // hover realça vizinhança
      const vizinhos = new Map<string, Set<string>>();
      dlinks.forEach((l) => {
        const s = typeof l.source === 'string' ? l.source : l.source.id;
        const t = typeof l.target === 'string' ? l.target : l.target.id;
        if (!vizinhos.has(s)) vizinhos.set(s, new Set()); vizinhos.get(s)!.add(t);
        if (!vizinhos.has(t)) vizinhos.set(t, new Set()); vizinhos.get(t)!.add(s);
      });
      no.on('mouseover', (_e, d) => {
        const viz = vizinhos.get(d.id) ?? new Set();
        no.attr('opacity', (o) => (o.id === d.id || viz.has(o.id) ? 1 : 0.18));
        rot.attr('opacity', (o) => (o.id === d.id || viz.has(o.id) ? 1 : 0.12));
        link.attr('stroke-opacity', (l) => {
          const s = typeof l.source === 'string' ? l.source : l.source.id;
          const t = typeof l.target === 'string' ? l.target : l.target.id;
          return s === d.id || t === d.id ? 0.9 : 0.06;
        });
      }).on('mouseout', () => {
        no.attr('opacity', 1); rot.attr('opacity', 1); link.attr('stroke-opacity', 0.5);
      });
      if (onSelecionar) no.on('click', (_e, d) => onSelecionar(d.id, d.nome));

      no.call(d3d.drag<SVGCircleElement, N>()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

      const zoom = d3z.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 4])
        .on('zoom', (ev) => raiz.attr('transform', ev.transform.toString()));
      svg.call(zoom);

      sim.on('tick', () => {
        link.attr('x1', (d) => (d.source as N).x!).attr('y1', (d) => (d.source as N).y!)
          .attr('x2', (d) => (d.target as N).x!).attr('y2', (d) => (d.target as N).y!);
        no.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);
        rot.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
      });

      parar = () => { sim.stop(); svg.on('.zoom', null); };
    })();
    return () => { cancelado = true; parar?.(); };
  }, [nos, arestas, pal, altura, onSelecionar]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block', touchAction: 'none' }} role="img" aria-label="Grafo de relacionamento" />
    </div>
  );
}
