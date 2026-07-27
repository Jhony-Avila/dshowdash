// components/viz/d3/CalendarHeatmap.tsx — calendário de intensidade (D3, Fase 2).
// @version 1.0.0  @created 2026-07-24
//
// Estilo "contribuições do GitHub": colunas = semanas, linhas = dias úteis (Seg→Dom).
// A cor de cada célula ∝ valor (escala de 3 paradas superfície→primária→rosa via
// d3-scale, que interpola cores). Rótulos de mês no topo, de dia à esquerda, tooltip no
// hover e legenda menos→mais. Sem dependência nova. Theme-aware. Renderiza <svg>.
import { useEffect, useRef, useState } from 'react';
import { useTokensAds } from '../../../shell/useShellTheme';

const NS = 'http://www.w3.org/2000/svg';
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export interface DiaCalendario { data: string; valor: number; }   // data = 'YYYY-MM-DD'
export interface CalendarHeatmapProps {
  dias: DiaCalendario[];
  fmt?: (v: number) => string;
  altura?: number;
}
interface Tip { x: number; y: number; data: string; valor: number; }

function parseData(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function CalendarHeatmap({ dias, fmt = (v) => String(v), altura = 200 }: CalendarHeatmapProps) {
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
    if (!svgRef.current || dias.length === 0) return;
    let cancelado = false;
    (async () => {
      const { scaleLinear } = await import('d3-scale');
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;

      const pontos = dias.map((d) => ({ ...d, dt: parseData(d.data) }));
      const primeiro = pontos[0].dt;
      const wdPrim = (primeiro.getDay() + 6) % 7;                 // 0 = Seg
      const segInicial = new Date(primeiro); segInicial.setDate(primeiro.getDate() - wdPrim);
      const semanaDe = (dt: Date) => Math.floor((dt.getTime() - segInicial.getTime()) / (7 * 86400000));
      const nSemanas = semanaDe(pontos[pontos.length - 1].dt) + 1;

      const padL = 30, padT = 16;
      const cell = Math.max(8, Math.min(24, Math.floor((w - padL - 6) / nSemanas), Math.floor((h - padT - 18) / 7)));
      const gap = Math.max(2, Math.round(cell * 0.14));
      const passo = cell + gap;
      const maxV = Math.max(...pontos.map((p) => p.valor), 1);
      const escCor = scaleLinear<string>().domain([0, maxV / 2, maxV]).range([pal.surface2, pal.primary, pal.pink]).clamp(true);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const gCells = svg.querySelector('g[data-l="cells"]')!; gCells.innerHTML = '';
      const gLab = svg.querySelector('g[data-l="lab"]')!; gLab.innerHTML = '';

      // rótulos de dia (Seg/Qua/Sex)
      [0, 2, 4].forEach((r) => {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(padL - 6)); t.setAttribute('y', String(padT + r * passo + cell * 0.75));
        t.setAttribute('text-anchor', 'end'); t.setAttribute('fill', pal.textDim); t.setAttribute('font-size', '10');
        t.textContent = DIAS[r];
        gLab.appendChild(t);
      });

      // rótulos de mês (quando a semana começa um novo mês)
      let mesAnt = -1;
      for (let s = 0; s < nSemanas; s++) {
        const dtSem = new Date(segInicial); dtSem.setDate(segInicial.getDate() + s * 7);
        if (dtSem.getMonth() !== mesAnt) {
          mesAnt = dtSem.getMonth();
          const t = document.createElementNS(NS, 'text');
          t.setAttribute('x', String(padL + s * passo)); t.setAttribute('y', String(padT - 5));
          t.setAttribute('fill', pal.textDim); t.setAttribute('font-size', '10');
          t.textContent = MESES[mesAnt];
          gLab.appendChild(t);
        }
      }

      // células
      pontos.forEach((p) => {
        const col = semanaDe(p.dt);
        const row = (p.dt.getDay() + 6) % 7;
        const x = padL + col * passo, y = padT + row * passo;
        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', String(x)); rect.setAttribute('y', String(y));
        rect.setAttribute('width', String(cell)); rect.setAttribute('height', String(cell));
        rect.setAttribute('rx', '2'); rect.setAttribute('fill', escCor(p.valor) as string);
        rect.setAttribute('stroke', pal.border); rect.setAttribute('stroke-width', '0.5');
        rect.style.transition = 'stroke .12s ease';
        rect.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          const rot = p.dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' });
          setTip({ x: ev.clientX - r.left, y: ev.clientY - r.top, data: rot, valor: p.valor });
          rect.setAttribute('stroke', pal.text);
        });
        rect.addEventListener('mouseleave', () => { setTip(null); rect.setAttribute('stroke', pal.border); });
        gCells.appendChild(rect);
      });

      // legenda menos → mais
      const lx = padL + nSemanas * passo + 6;
      if (lx < w - 90) {
        const yl = padT + 6 * passo;
        const tMenos = document.createElementNS(NS, 'text');
        tMenos.setAttribute('x', String(lx)); tMenos.setAttribute('y', String(yl + cell * 0.75));
        tMenos.setAttribute('fill', pal.textDim); tMenos.setAttribute('font-size', '10'); tMenos.textContent = 'menos';
        gLab.appendChild(tMenos);
        [0, 0.5, 1].forEach((f, i) => {
          const rc = document.createElementNS(NS, 'rect');
          rc.setAttribute('x', String(lx + 34 + i * (cell + 2))); rc.setAttribute('y', String(yl));
          rc.setAttribute('width', String(cell)); rc.setAttribute('height', String(cell));
          rc.setAttribute('rx', '2'); rc.setAttribute('fill', escCor(maxV * f) as string);
          gLab.appendChild(rc);
        });
        const tMais = document.createElementNS(NS, 'text');
        tMais.setAttribute('x', String(lx + 34 + 3 * (cell + 2) + 4)); tMais.setAttribute('y', String(yl + cell * 0.75));
        tMais.setAttribute('fill', pal.textDim); tMais.setAttribute('font-size', '10'); tMais.textContent = 'mais';
        gLab.appendChild(tMais);
      }
    })();
    return () => { cancelado = true; };
  }, [dias, pal, tam, fmt]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Calendário de intensidade (heatmap)">
        <g data-l="cells" /><g data-l="lab" />
      </svg>
      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 150), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '7px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text }}>
          <div style={{ marginBottom: 2, color: pal.textDim }}>{tip.data}</div>
          <div><b>{fmt(tip.valor)}</b></div>
        </div>
      )}
    </div>
  );
}
