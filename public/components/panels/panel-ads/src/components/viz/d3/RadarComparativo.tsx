// components/viz/d3/RadarComparativo.tsx — radar/spider multi-série (D3, Fase 2).
// @version 1.0.0  @created 2026-07-24
//
// Compara N séries ao longo de vários eixos normalizados (0..max). d3-shape.lineRadial
// (com curveLinearClosed) desenha o polígono de cada série; d3-scale escala o raio.
// Grade poligonal, eixos rotulados, legenda e tooltip nos vértices. Theme-aware.
// Renderiza um <svg> (ChartCard exporta em PNG).
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

const NS = 'http://www.w3.org/2000/svg';

export interface SerieRadar { nome: string; valores: number[]; cor?: string; tracejada?: boolean; }
export interface RadarComparativoProps {
  eixos: string[];
  series: SerieRadar[];
  max?: number;
  fmt?: (v: number) => string;
  altura?: number;
}
interface Tip { x: number; y: number; eixo: string; itens: { nome: string; valor: number; cor: string }[]; }

export function RadarComparativo({ eixos, series, max = 100, fmt = (v) => String(v), altura = 300 }: RadarComparativoProps) {
  const pal = useTokensAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 420, h: altura });
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(300, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current || eixos.length < 3 || series.length === 0) return;
    let cancelado = false;
    (async () => {
      const [{ scaleLinear }, { lineRadial, curveLinearClosed }] = await Promise.all([import('d3-scale'), import('d3-shape')]);
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;
      const cx = w / 2, cy = h / 2;
      const raio = Math.min(w, h) * 0.40;
      const n = eixos.length;
      const rEsc = scaleLinear().domain([0, max]).range([0, raio]);
      const ang = (i: number) => (i / n) * 2 * Math.PI;   // 0 = topo (lineRadial usa 0=topo, horário)
      const cor = (s: SerieRadar, i: number) => s.cor ?? pal.seq[i % pal.seq.length];

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const root = svg.querySelector('g[data-l="root"]')!;
      root.setAttribute('transform', `translate(${cx},${cy})`);
      const gGrid = root.querySelector('g[data-l="grid"]')!; gGrid.innerHTML = '';
      const gAxes = root.querySelector('g[data-l="axes"]')!; gAxes.innerHTML = '';
      const gArea = root.querySelector('g[data-l="area"]')!; gArea.innerHTML = '';
      const gDots = root.querySelector('g[data-l="dots"]')!; gDots.innerHTML = '';
      const gLab = root.querySelector('g[data-l="lab"]')!; gLab.innerHTML = '';

      // grade poligonal (níveis)
      const niveis = [0.25, 0.5, 0.75, 1];
      niveis.forEach((f) => {
        const pts = eixos.map((_, i) => { const a = ang(i) - Math.PI / 2; const r = raio * f; return `${Math.cos(a) * r},${Math.sin(a) * r}`; }).join(' ');
        const poly = document.createElementNS(NS, 'polygon');
        poly.setAttribute('points', pts);
        poly.setAttribute('fill', 'none'); poly.setAttribute('stroke', pal.border);
        poly.setAttribute('opacity', f === 1 ? '0.85' : '0.45');
        gGrid.appendChild(poly);
      });

      // eixos + rótulos
      eixos.forEach((eixo, i) => {
        const a = ang(i) - Math.PI / 2;
        const x = Math.cos(a) * raio, y = Math.sin(a) * raio;
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', '0'); ln.setAttribute('y1', '0'); ln.setAttribute('x2', String(x)); ln.setAttribute('y2', String(y));
        ln.setAttribute('stroke', pal.border); ln.setAttribute('opacity', '0.6');
        gAxes.appendChild(ln);

        const lx = Math.cos(a) * (raio + Math.min(w, h) * 0.04);
        const ly = Math.sin(a) * (raio + Math.min(w, h) * 0.04);
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(lx)); t.setAttribute('y', String(ly));
        const anchor = Math.abs(lx) < 6 ? 'middle' : (lx > 0 ? 'start' : 'end');
        t.setAttribute('text-anchor', anchor); t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('fill', pal.textDim); t.setAttribute('font-size', '11');
        t.textContent = eixo;
        gLab.appendChild(t);
      });

      // polígono por série
      const linha = lineRadial<number>().angle((_, i) => ang(i)).radius((v) => rEsc(v)).curve(curveLinearClosed);
      series.forEach((s, si) => {
        const c = cor(s, si);
        const d = linha(s.valores) ?? '';
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d); path.setAttribute('fill', c);
        path.setAttribute('fill-opacity', s.tracejada ? '0.04' : '0.16');
        path.setAttribute('stroke', c); path.setAttribute('stroke-width', '2');
        if (s.tracejada) path.setAttribute('stroke-dasharray', '5 4');
        gArea.appendChild(path);

        // vértices
        s.valores.forEach((v, i) => {
          const a = ang(i) - Math.PI / 2; const r = rEsc(v);
          const dot = document.createElementNS(NS, 'circle');
          dot.setAttribute('cx', String(Math.cos(a) * r)); dot.setAttribute('cy', String(Math.sin(a) * r));
          dot.setAttribute('r', '3'); dot.setAttribute('fill', c);
          gDots.appendChild(dot);
        });
      });

      // zonas de hover: 1 vértice-alvo grande por eixo (mostra todas as séries naquele eixo)
      eixos.forEach((eixo, i) => {
        const a = ang(i) - Math.PI / 2;
        const alvo = document.createElementNS(NS, 'circle');
        alvo.setAttribute('cx', String(Math.cos(a) * raio)); alvo.setAttribute('cy', String(Math.sin(a) * raio));
        alvo.setAttribute('r', String(Math.max(10, raio * 0.14))); alvo.setAttribute('fill', 'transparent');
        alvo.style.cursor = 'default';
        alvo.addEventListener('mousemove', (ev) => {
          const rect = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - rect.left, y: ev.clientY - rect.top, eixo,
            itens: series.map((s, si) => ({ nome: s.nome, valor: s.valores[i], cor: cor(s, si) })) });
        });
        alvo.addEventListener('mouseleave', () => setTip(null));
        gDots.appendChild(alvo);
      });
    })();
    return () => { cancelado = true; };
  }, [eixos, series, max, pal, tam]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Gráfico de radar comparativo">
        <g data-l="root"><g data-l="grid" /><g data-l="axes" /><g data-l="area" /><g data-l="dots" /><g data-l="lab" /></g>
      </svg>
      {/* legenda */}
      <div style={{ position: 'absolute', left: 10, bottom: 8, display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: pal.textDim }}>
        {series.map((s, i) => (
          <span key={s.nome} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.cor ?? pal.seq[i % pal.seq.length], display: 'inline-block', opacity: s.tracejada ? 0.6 : 1 }} />
            {s.nome}
          </span>
        ))}
      </div>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 170), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          <div style={{ marginBottom: 4, color: pal.textDim }}>{tip.eixo}</div>
          {tip.itens.map((it) => (
            <div key={it.nome} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: it.cor, display: 'inline-block' }} />
              {it.nome}: <b>{fmt(it.valor)}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
