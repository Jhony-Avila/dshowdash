// components/viz/d3/SankeyFluxo.tsx — diagrama de fluxo/atribuição (D3, Fase 2).
// @version 1.0.0  @created 2026-07-22
//
// Sankey genérico para fluxos entre entidades (canal→ação, campanha→anúncio→lead→venda,
// atribuição). D3-sankey calcula o layout; desenhamos em SVG. Theme-aware, hover realça
// o caminho (nó + ligações), tooltip com valor. Nós referenciados por `id`.
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

export interface NoFluxo { id: string; nome: string; cor?: string; }
export interface LigacaoFluxo { origem: string; destino: string; valor: number; }

export interface SankeyFluxoProps {
  nos: NoFluxo[];
  ligacoes: LigacaoFluxo[];
  fmt?: (v: number) => string;
  altura?: number;
}

interface Tip { x: number; y: number; texto: string; valor: number; }

export function SankeyFluxo({ nos, ligacoes, fmt = (v) => String(v), altura = 320 }: SankeyFluxoProps) {
  const pal = useTokensAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 640, h: altura });
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(300, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current || nos.length === 0) return;
    let cancelado = false;
    (async () => {
      const d3s = await import('d3-sankey');
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;
      const idx = new Map(nos.map((n, i) => [n.id, i]));
      const nodes = nos.map((n) => ({ nome: n.nome, cor: n.cor }));
      const links = ligacoes
        .filter((l) => idx.has(l.origem) && idx.has(l.destino))
        .map((l) => ({ source: idx.get(l.origem)!, target: idx.get(l.destino)!, value: Math.max(0.0001, l.valor) }));

      const gerador = d3s.sankey<{ nome: string; cor?: string }, object>()
        .nodeWidth(14).nodePadding(14).extent([[6, 8], [w - 6, h - 8]]);
      const grafo = gerador({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) });

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const gLinks = svg.querySelector('g[data-l="links"]')!; gLinks.innerHTML = '';
      const gNodes = svg.querySelector('g[data-l="nodes"]')!; gNodes.innerHTML = '';
      const gLabels = svg.querySelector('g[data-l="labels"]')!; gLabels.innerHTML = '';

      const corNo = (i: number, c?: string) => c ?? pal.seq[i % pal.seq.length];
      const linkPath = d3s.sankeyLinkHorizontal();

      // ligações
      grafo.links.forEach((lk) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', linkPath(lk as never) ?? '');
        const src = lk.source as unknown as { index: number; cor?: string };
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', corNo(src.index, src.cor));
        el.setAttribute('stroke-width', String(Math.max(1, lk.width ?? 1)));
        el.setAttribute('stroke-opacity', '0.34');
        el.style.transition = 'stroke-opacity .15s ease';
        const tgtNome = (lk.target as unknown as { nome: string }).nome;
        const srcNome = (lk.source as unknown as { nome: string }).nome;
        el.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, texto: `${srcNome} → ${tgtNome}`, valor: lk.value });
          el.setAttribute('stroke-opacity', '0.7');
        });
        el.addEventListener('mouseleave', () => { setTip(null); el.setAttribute('stroke-opacity', '0.34'); });
        gLinks.appendChild(el);
      });

      // nós + rótulos
      grafo.nodes.forEach((nd) => {
        const n = nd as unknown as { index: number; nome: string; cor?: string; x0: number; x1: number; y0: number; y1: number; value: number };
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(n.x0)); rect.setAttribute('y', String(n.y0));
        rect.setAttribute('width', String(n.x1 - n.x0)); rect.setAttribute('height', String(Math.max(1, n.y1 - n.y0)));
        rect.setAttribute('rx', '3'); rect.setAttribute('fill', corNo(n.index, n.cor));
        rect.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, texto: n.nome, valor: n.value });
        });
        rect.addEventListener('mouseleave', () => setTip(null));
        gNodes.appendChild(rect);

        const meio = (n.y0 + n.y1) / 2;
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const dir = n.x0 < w / 2;
        t.setAttribute('x', String(dir ? n.x1 + 6 : n.x0 - 6));
        t.setAttribute('y', String(meio));
        t.setAttribute('dy', '0.34em');
        t.setAttribute('text-anchor', dir ? 'start' : 'end');
        t.setAttribute('fill', pal.text);
        t.setAttribute('font-size', '11.5');
        t.textContent = n.nome;
        gLabels.appendChild(t);
      });
    })();
    return () => { cancelado = true; };
  }, [nos, ligacoes, pal, tam]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Diagrama de fluxo" >
        <g data-l="links" /><g data-l="nodes" /><g data-l="labels" />
      </svg>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 160), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          <div style={{ marginBottom: 2 }}>{tip.texto}</div>
          <div><b>{fmt(tip.valor)}</b></div>
        </div>
      )}
    </div>
  );
}
