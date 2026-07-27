// components/ui/GrafoDependencias.tsx — grafo force-directed de dependências (D3).
// @version 1.0.0  @created 2026-07-21
//
// O diagrama gráfico que faltava (§23). Nós = tabelas com FK; arestas = chaves
// estrangeiras (resolvidas por nome no mesmo banco). D3 é LAZY (dynamic import →
// chunk assíncrono, fora do bundle inicial) e só os módulos usados (force/
// selection/zoom/drag) — não o d3 inteiro. Zoom/pan, arrastar nós, realce de
// vizinhos ao passar o mouse e clique abre o drawer da tabela. Theme-aware: lê
// os tokens --dt-* do root do módulo no momento do desenho.
import { useEffect, useRef, useState, type JSX } from 'react';
import { Icone } from './Icone';
import css from './GrafoDependencias.module.css';

export interface NoGrafo { id: number; name: string; fk_out: number; is_orphan: boolean; size_bytes: number | null; field_count: number }
export interface ArestaGrafo { source: number; target: number | null; ref_table: string; broken: boolean }

interface Props {
  nodes: NoGrafo[];
  edges: ArestaGrafo[];
  aoClicarTabela?: (id: number, nome: string) => void;
  altura?: number;
}

function token(nome: string, fallback: string): string {
  try {
    const root = document.querySelector('[data-dt-react-root]') ?? document.documentElement;
    const v = getComputedStyle(root as Element).getPropertyValue(nome).trim();
    return v || fallback;
  } catch { return fallback; }
}

export function GrafoDependencias({ nodes, edges, aoClicarTabela, altura = 520 }: Props): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // arestas resolvidas (com alvo) + contagem das externas/quebradas
  const externas = edges.filter((e) => e.target === null || e.broken).length;

  useEffect(() => {
    let cancelado = false;
    let sim: { stop: () => void } | null = null;
    let limparZoom: (() => void) | null = null;

    (async () => {
      setCarregando(true); setErro(false);
      try {
        const [d3f, d3s, d3z, d3d] = await Promise.all([
          import('d3-force'), import('d3-selection'), import('d3-zoom'), import('d3-drag'),
        ]);
        if (cancelado || !svgRef.current || !wrapRef.current) return;

        const largura = wrapRef.current.clientWidth || 800;
        const alt = altura;

        // ── dados: dedup de arestas (FKs compostas viram 1 aresta com peso) ──
        const validos = new Set(nodes.map((n) => n.id));
        const pares = new Map<string, { source: number; target: number; peso: number }>();
        for (const e of edges) {
          if (e.target === null || e.source === e.target) continue;   // externas e auto-loops fora do desenho
          if (!validos.has(e.source) || !validos.has(e.target)) continue;
          const k = `${e.source}-${e.target}`;
          const p = pares.get(k);
          if (p) p.peso++; else pares.set(k, { source: e.source, target: e.target, peso: 1 });
        }
        const links = [...pares.values()].map((p) => ({ ...p }));

        // grau (entrada+saída) por nó → tamanho
        const grau = new Map<number, number>();
        for (const l of links) { grau.set(l.source, (grau.get(l.source) ?? 0) + 1); grau.set(l.target, (grau.get(l.target) ?? 0) + 1); }
        const nos = nodes.map((n) => ({ ...n, grau: grau.get(n.id) ?? 0 }));

        // ── cores dos tokens do tema ──
        const cPrim = token('--dt-primary', '#7c3aed');
        const cInfo = token('--dt-info', '#3b82f6');
        const cNeutral = token('--dt-neutral', '#6b7280');
        const cBorda = token('--dt-border-strong', 'rgba(255,255,255,.18)');
        const cTexto = token('--dt-text-secondary', 'rgba(255,255,255,.68)');
        const cLink = token('--dt-border-strong', 'rgba(255,255,255,.18)');
        const raio = (n: { grau: number }): number => Math.max(5, Math.min(26, 5 + Math.sqrt(n.grau) * 3.2));
        const corNo = (n: { is_orphan: boolean; grau: number }): string =>
          n.is_orphan ? cNeutral : n.grau >= 6 ? cPrim : cInfo;

        // ── SVG limpo ──
        const svg = d3s.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.attr('viewBox', `0 0 ${largura} ${alt}`).attr('width', '100%').attr('height', alt);
        const raizG = svg.append('g');

        const gLinks = raizG.append('g').attr('stroke', cLink).attr('stroke-opacity', 0.5);
        const gNos = raizG.append('g');
        const gRotulos = raizG.append('g');

        type NoSim = typeof nos[number] & { x?: number; y?: number; fx?: number | null; fy?: number | null };
        const linkSel = gLinks.selectAll('line').data(links).join('line')
          .attr('stroke-width', (d) => Math.min(4, 1 + Math.log2(d.peso + 1)));

        const noSel = gNos.selectAll<SVGCircleElement, NoSim>('circle').data(nos as NoSim[]).join('circle')
          .attr('r', (d) => raio(d))
          .attr('fill', (d) => corNo(d))
          .attr('stroke', cBorda).attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('click', (_e: unknown, d: NoSim) => aoClicarTabela?.(d.id, d.name));
        noSel.append('title').text((d) => `${d.name} — ${d.grau} conexão(ões)${d.is_orphan ? ' · órfã' : ''}`);

        const rotSel = gRotulos.selectAll<SVGTextElement, NoSim>('text').data(nos as NoSim[]).join('text')
          .text((d) => d.name)
          .attr('font-size', 10).attr('fill', cTexto).attr('dx', (d) => raio(d) + 3).attr('dy', 3)
          .style('pointer-events', 'none').style('opacity', (d) => (d.grau >= 4 ? 0.9 : 0));   // rótulo só nos mais conectados p/ não poluir

        // ── realce de vizinhos ao passar o mouse ──
        const vizinhos = new Map<number, Set<number>>();
        for (const l of links) {
          if (!vizinhos.has(l.source)) vizinhos.set(l.source, new Set());
          if (!vizinhos.has(l.target)) vizinhos.set(l.target, new Set());
          vizinhos.get(l.source)!.add(l.target); vizinhos.get(l.target)!.add(l.source);
        }
        noSel.on('mouseenter', (_e: unknown, d: NoSim) => {
          const viz = vizinhos.get(d.id) ?? new Set();
          noSel.style('opacity', (o) => (o.id === d.id || viz.has(o.id) ? 1 : 0.12));
          rotSel.style('opacity', (o) => (o.id === d.id || viz.has(o.id) ? 1 : 0.05));
          linkSel.attr('stroke-opacity', (l) => (l.source === d.id || l.target === d.id ? 0.95 : 0.05))
            .attr('stroke', (l) => (l.source === d.id || l.target === d.id ? cPrim : cLink));
        }).on('mouseleave', () => {
          noSel.style('opacity', 1);
          rotSel.style('opacity', (o) => (o.grau >= 4 ? 0.9 : 0));
          linkSel.attr('stroke-opacity', 0.5).attr('stroke', cLink);
        });

        // ── simulação de forças ──
        const simulacao = d3f.forceSimulation(nos as NoSim[])
          .force('link', d3f.forceLink(links).id((d) => (d as NoSim).id).distance(70).strength(0.35))
          .force('charge', d3f.forceManyBody().strength(-160))
          .force('center', d3f.forceCenter(largura / 2, alt / 2))
          .force('collide', d3f.forceCollide().radius((d) => raio(d as NoSim) + 3))
          .on('tick', () => {
            linkSel
              .attr('x1', (d) => ((d.source as unknown) as NoSim).x ?? 0).attr('y1', (d) => ((d.source as unknown) as NoSim).y ?? 0)
              .attr('x2', (d) => ((d.target as unknown) as NoSim).x ?? 0).attr('y2', (d) => ((d.target as unknown) as NoSim).y ?? 0);
            noSel.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);
            rotSel.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
          });
        sim = simulacao;

        // ── arrastar nós ──
        noSel.call(
          d3d.drag<SVGCircleElement, NoSim>()
            .on('start', (ev, d) => { if (!ev.active) simulacao.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
            .on('end', (ev, d) => { if (!ev.active) simulacao.alphaTarget(0); d.fx = null; d.fy = null; })
        );

        // ── zoom/pan ──
        const zoomB = d3z.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 4])
          .on('zoom', (ev) => raizG.attr('transform', ev.transform.toString()));
        svg.call(zoomB);
        limparZoom = () => svg.on('.zoom', null);

        setCarregando(false);
      } catch (e) {
        if (!cancelado) { setErro(true); setCarregando(false); }
      }
    })();

    return () => { cancelado = true; sim?.stop(); limparZoom?.(); };
  }, [nodes, edges, altura, aoClicarTabela]);

  return (
    <div className={css.wrap} ref={wrapRef}>
      {carregando && <div className={css.overlay}><Icone nome="RefreshCw" size={16} className={css.girando} /> montando o grafo…</div>}
      {erro && <div className={css.overlay}><Icone nome="TriangleAlert" size={16} /> não foi possível carregar o grafo.</div>}
      <svg ref={svgRef} className={css.svg} role="img" aria-label="Grafo de dependências entre tabelas" />
      <div className={css.legenda}>
        <span><i className={css.dotPrim} /> hub (≥6 conexões)</span>
        <span><i className={css.dotInfo} /> tabela</span>
        <span><i className={css.dotNeutral} /> órfã</span>
        {externas > 0 && <span className={css.externas}><Icone nome="Unplug" size={11} /> {externas} FK(s) externa(s)/quebrada(s) não desenhadas</span>}
        <span className={css.dica}><Icone nome="Info" size={11} /> arraste · roda = zoom · hover destaca vizinhos</span>
      </div>
    </div>
  );
}
