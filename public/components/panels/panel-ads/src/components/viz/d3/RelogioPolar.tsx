// components/viz/d3/RelogioPolar.tsx — barras radiais por hora do dia (D3, Fase 2).
// @version 1.0.0  @created 2026-07-24
//
// As 24 horas mapeiam naturalmente a um relógio: cada hora é uma cunha (arc) cujo
// comprimento ∝ valor. d3-shape.arc já usa 0 = 12h e sentido horário — exatamente a
// semântica de relógio. Theme-aware, hover realça a cunha + tooltip, hora de pico
// destacada e rotulada no centro. Renderiza um <svg> (ChartCard exporta em PNG).
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

const NS = 'http://www.w3.org/2000/svg';

export interface PontoHora { hora: number; valor: number; }
export interface RelogioPolarProps {
  dados: PontoHora[];
  fmt?: (v: number) => string;
  altura?: number;
  rotuloCentro?: string;
}
interface Tip { x: number; y: number; texto: string; valor: number; }

export function RelogioPolar({ dados, fmt = (v) => String(v), altura = 300, rotuloCentro = 'por hora' }: RelogioPolarProps) {
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
    if (!svgRef.current || dados.length === 0) return;
    let cancelado = false;
    (async () => {
      const [{ scaleLinear }, { arc }] = await Promise.all([import('d3-scale'), import('d3-shape')]);
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;
      const cx = w / 2, cy = h / 2;
      const rInt = Math.min(w, h) * 0.17;
      const rExt = Math.min(w, h) * 0.40;
      const n = dados.length;                       // 24
      const passo = (2 * Math.PI) / n;
      const gap = passo * 0.16;
      const maxV = Math.max(...dados.map((d) => d.valor), 1);
      const rEsc = scaleLinear().domain([0, maxV]).range([rInt, rExt]);
      const pico = dados.reduce((a, b) => (b.valor > a.valor ? b : a), dados[0]);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const root = svg.querySelector('g[data-l="root"]')!;
      root.setAttribute('transform', `translate(${cx},${cy})`);
      const gGrid = root.querySelector('g[data-l="grid"]')!; gGrid.innerHTML = '';
      const gBars = root.querySelector('g[data-l="bars"]')!; gBars.innerHTML = '';
      const gLab = root.querySelector('g[data-l="lab"]')!; gLab.innerHTML = '';

      // anéis de grade
      [0.5, 1].forEach((f) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', String(rInt + (rExt - rInt) * f));
        c.setAttribute('fill', 'none'); c.setAttribute('stroke', pal.border);
        c.setAttribute('stroke-dasharray', '3 4'); c.setAttribute('opacity', '0.6');
        gGrid.appendChild(c);
      });

      // cunhas (uma por hora) — arc() usa 0 = topo, sentido horário
      dados.forEach((d) => {
        const a0 = d.hora * passo + gap / 2;
        const a1 = (d.hora + 1) * passo - gap / 2;
        const gerador = arc<unknown>().innerRadius(rInt).outerRadius(rEsc(d.valor)).startAngle(a0).endAngle(a1).cornerRadius(2);
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', gerador(null as never) ?? '');
        const ehPico = d.hora === pico.hora;
        p.setAttribute('fill', ehPico ? pal.pink : pal.primary);
        p.setAttribute('opacity', ehPico ? '0.95' : '0.78');
        p.style.transition = 'opacity .15s ease, fill .15s ease';
        p.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, texto: `${String(d.hora).padStart(2, '0')}h – ${String((d.hora + 1) % 24).padStart(2, '0')}h`, valor: d.valor });
          p.setAttribute('opacity', '1'); p.setAttribute('fill', pal.primaryH);
        });
        p.addEventListener('mouseleave', () => {
          setTip(null); p.setAttribute('opacity', ehPico ? '0.95' : '0.78'); p.setAttribute('fill', ehPico ? pal.pink : pal.primary);
        });
        gBars.appendChild(p);
      });

      // rótulos de hora a cada 3h (0,3,...,21) na borda
      for (let hh = 0; hh < n; hh += 3) {
        const ang = (hh + 0.5) * passo - Math.PI / 2;   // -90° pois texto usa 0 = 3h
        const rr = rExt + Math.min(w, h) * 0.05;
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(Math.cos(ang) * rr));
        t.setAttribute('y', String(Math.sin(ang) * rr));
        t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle');
        t.setAttribute('fill', pal.textDim); t.setAttribute('font-size', '11');
        t.textContent = `${hh}h`;
        gLab.appendChild(t);
      }

      // centro: hora de pico
      const tPico = document.createElementNS(NS, 'text');
      tPico.setAttribute('text-anchor', 'middle'); tPico.setAttribute('y', '-4');
      tPico.setAttribute('fill', pal.textDim); tPico.setAttribute('font-size', '11');
      tPico.textContent = `pico ${String(pico.hora).padStart(2, '0')}h`;
      gLab.appendChild(tPico);
      const tPicoV = document.createElementNS(NS, 'text');
      tPicoV.setAttribute('text-anchor', 'middle'); tPicoV.setAttribute('y', '15');
      tPicoV.setAttribute('fill', pal.text); tPicoV.setAttribute('font-size', '15'); tPicoV.setAttribute('font-weight', '700');
      tPicoV.textContent = fmt(pico.valor);
      gLab.appendChild(tPicoV);
    })();
    return () => { cancelado = true; };
  }, [dados, pal, tam, fmt, rotuloCentro]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Barras radiais por hora do dia">
        <g data-l="root"><g data-l="grid" /><g data-l="bars" /><g data-l="lab" /></g>
      </svg>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 150), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          <div style={{ marginBottom: 2 }}>{tip.texto}</div>
          <div><b>{fmt(tip.valor)}</b></div>
        </div>
      )}
    </div>
  );
}
