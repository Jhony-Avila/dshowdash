// components/viz/d3/Treemap.tsx — treemap hierárquico agrupado (D3, Fase 2).
// @version 1.0.0  @created 2026-07-24
//
// Estrutura de 2 níveis (grupo → item): a área de cada retângulo ∝ valor. d3-hierarchy
// calcula o layout (treemap com faixa superior p/ o rótulo do grupo). Cor por grupo,
// opacidade ∝ valor relativo, rótulos que só aparecem quando cabem, tooltip no hover.
// Theme-aware. Renderiza um <svg> (ChartCard exporta em PNG).
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

const NS = 'http://www.w3.org/2000/svg';

export interface ItemTreemap { nome: string; valor: number; }
export interface GrupoTreemap { nome: string; cor?: string; itens: ItemTreemap[]; }
export interface TreemapProps {
  grupos: GrupoTreemap[];
  fmt?: (v: number) => string;
  altura?: number;
}
interface Tip { x: number; y: number; grupo: string; nome: string; valor: number; }

interface NoLayout { x0: number; x1: number; y0: number; y1: number; value?: number; data: { nome: string; cor?: string; valor?: number }; parent?: { data: { nome: string; cor?: string } } | null; }

export function Treemap({ grupos, fmt = (v) => String(v), altura = 320 }: TreemapProps) {
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
    if (!svgRef.current || grupos.length === 0) return;
    let cancelado = false;
    (async () => {
      const { hierarchy, treemap } = await import('d3-hierarchy');
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;

      const raiz = {
        nome: 'raiz',
        children: grupos.map((g, i) => ({
          nome: g.nome, cor: g.cor ?? pal.seq[i % pal.seq.length],
          children: g.itens.map((it) => ({ nome: it.nome, valor: it.valor })),
        })),
      };
      const root = hierarchy(raiz as never).sum((d) => (d as { valor?: number }).valor ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      treemap<never>().size([w, h]).paddingTop(17).paddingInner(2).round(true)(root);

      const maxV = Math.max(...root.leaves().map((l) => l.value ?? 0), 1);
      const truncar = (s: string, larg: number) => {
        const max = Math.floor((larg - 8) / 6.3);
        return s.length > max ? s.slice(0, Math.max(1, max - 1)) + '…' : s;
      };

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const gGrp = svg.querySelector('g[data-l="grp"]')!; gGrp.innerHTML = '';
      const gCells = svg.querySelector('g[data-l="cells"]')!; gCells.innerHTML = '';

      // faixas dos grupos (depth 1) + rótulo do grupo (só quando há largura útil)
      (root.children ?? []).forEach((grp) => {
        const n = grp as unknown as NoLayout;
        const larg = n.x1 - n.x0;
        if (larg < 54) return;   // coluna estreita: sem header (as folhas já se rotulam)
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(n.x0 + 5)); t.setAttribute('y', String(n.y0 + 12));
        t.setAttribute('fill', pal.text); t.setAttribute('font-size', '11.5'); t.setAttribute('font-weight', '700');
        t.setAttribute('pointer-events', 'none');
        t.textContent = truncar(`${n.data.nome} · ${fmt(n.value ?? 0)}`, larg);
        gGrp.appendChild(t);
      });

      // folhas (depth 2)
      root.leaves().forEach((leaf) => {
        const n = leaf as unknown as NoLayout;
        const larg = n.x1 - n.x0, alt = n.y1 - n.y0;
        if (larg <= 0 || alt <= 0) return;
        const cor = n.parent?.data.cor ?? pal.primary;
        const val = n.value ?? 0;
        const op = 0.5 + 0.42 * (val / maxV);

        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', String(n.x0)); rect.setAttribute('y', String(n.y0));
        rect.setAttribute('width', String(larg)); rect.setAttribute('height', String(alt));
        rect.setAttribute('rx', '2'); rect.setAttribute('fill', cor); rect.setAttribute('fill-opacity', String(op));
        rect.setAttribute('stroke', pal.surface); rect.setAttribute('stroke-width', '1');
        rect.style.transition = 'fill-opacity .15s ease';
        rect.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, grupo: n.parent?.data.nome ?? '', nome: n.data.nome, valor: val });
          rect.setAttribute('fill-opacity', '1');
        });
        rect.addEventListener('mouseleave', () => { setTip(null); rect.setAttribute('fill-opacity', String(op)); });
        gCells.appendChild(rect);

        // rótulos só quando cabem
        if (larg > 46 && alt > 20) {
          const nome = document.createElementNS(NS, 'text');
          nome.setAttribute('x', String(n.x0 + 5)); nome.setAttribute('y', String(n.y0 + 14));
          nome.setAttribute('fill', pal.text); nome.setAttribute('font-size', '11'); nome.setAttribute('pointer-events', 'none');
          nome.textContent = truncar(n.data.nome, larg);
          gCells.appendChild(nome);
          if (alt > 32) {
            const v = document.createElementNS(NS, 'text');
            v.setAttribute('x', String(n.x0 + 5)); v.setAttribute('y', String(n.y0 + 28));
            v.setAttribute('fill', pal.text); v.setAttribute('font-size', '10.5'); v.setAttribute('opacity', '0.85'); v.setAttribute('pointer-events', 'none');
            v.textContent = fmt(val);
            gCells.appendChild(v);
          }
        }
      });
    })();
    return () => { cancelado = true; };
  }, [grupos, pal, tam, fmt]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Treemap de estrutura por valor">
        <g data-l="cells" /><g data-l="grp" />
      </svg>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 180), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          {tip.grupo && <div style={{ color: pal.textDim, marginBottom: 2 }}>{tip.grupo}</div>}
          <div style={{ marginBottom: 2 }}>{tip.nome}</div>
          <div><b>{fmt(tip.valor)}</b></div>
        </div>
      )}
    </div>
  );
}
