// components/viz/Treemap.tsx — participação por canal (§20) em D3.
// @version 1.0.0  @created 2026-07-30
//
// Molde: panel-ads/src/components/viz/d3/Treemap.tsx. `d3-hierarchy` calcula o layout.
//
// A leitura que este gráfico entrega e a tabela não: **área = volume, cor = qualidade**. Um
// retângulo grande e apagado é o achado que o §20 procura — canal que traz muita sessão e
// converte mal. Numa tabela isso exige o usuário cruzar duas colunas mentalmente.
import { useEffect, useMemo, useRef, useState } from 'react';
import { usarPaleta } from '../../lib/paleta';
import { fmtInt } from '../../lib/fmt';

export interface FatiaTreemap {
  nome: string;
  valor: number;
  /** 0..1 — governa a intensidade da cor. */
  qualidade: number;
  detalhe?: string;
}

export function Treemap({
  fatias, altura = 320, onClicar, selecionada,
}: {
  fatias: FatiaTreemap[];
  altura?: number;
  onClicar?: (f: FatiaTreemap) => void;
  selecionada?: string | null;
}) {
  const pal = usarPaleta();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 640, h: altura });
  const [dica, setDica] = useState<{ x: number; y: number; f: FatiaTreemap } | null>(null);

  const visiveis = useMemo(() => fatias.filter((f) => f.valor > 0), [fatias]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(280, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current || visiveis.length === 0) return;
    let cancelado = false;

    (async () => {
      const h3 = await import('d3-hierarchy');
      if (cancelado || !svgRef.current) return;

      const { w, h } = tam;
      const raiz = h3.hierarchy<{ children?: unknown[]; f?: FatiaTreemap }>({ children: visiveis.map((f) => ({ f })) } as never)
        .sum((d) => ((d as { f?: FatiaTreemap }).f?.valor ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      h3.treemap<{ children?: unknown[]; f?: FatiaTreemap }>()
        .size([w, h])
        .paddingInner(2)
        .round(true)(raiz as never);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const g = svg.querySelector('g[data-l="fatias"]')!;
      g.innerHTML = '';
      const NS = 'http://www.w3.org/2000/svg';

      for (const no of raiz.leaves()) {
        const d = (no.data as { f?: FatiaTreemap }).f;
        if (!d) continue;
        const n = no as unknown as { x0: number; x1: number; y0: number; y1: number };
        const lw = n.x1 - n.x0;
        const lh = n.y1 - n.y0;
        const sel = selecionada === d.nome;

        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', String(n.x0)); rect.setAttribute('y', String(n.y0));
        rect.setAttribute('width', String(Math.max(0, lw))); rect.setAttribute('height', String(Math.max(0, lh)));
        rect.setAttribute('rx', '4');
        const t = Math.max(0, Math.min(1, d.qualidade));
        rect.setAttribute('fill', `color-mix(in srgb, ${pal.laranja} ${Math.round(16 + t * 84)}%, ${pal.bg2})`);
        rect.setAttribute('stroke', sel ? pal.txt : pal.borda);
        rect.setAttribute('stroke-width', sel ? '2' : '0.8');
        rect.style.cursor = onClicar ? 'pointer' : 'default';
        rect.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setDica({ x: ev.clientX - r.left, y: ev.clientY - r.top, f: d });
        });
        rect.addEventListener('mouseleave', () => setDica(null));
        if (onClicar) rect.addEventListener('click', () => onClicar(d));
        g.appendChild(rect);

        // ⚠️ Rótulo só quando CABE. Texto transbordando de retângulo pequeno é o defeito
        // clássico de treemap: some com a leitura do vizinho e não informa nada.
        if (lw > 66 && lh > 30) {
          const txt = document.createElementNS(NS, 'text');
          txt.setAttribute('x', String(n.x0 + 7));
          txt.setAttribute('y', String(n.y0 + 17));
          txt.setAttribute('fill', pal.txt);
          txt.setAttribute('font-size', '11.5');
          txt.setAttribute('font-weight', '600');
          txt.style.pointerEvents = 'none';
          const cortar = Math.floor(lw / 6.6);
          txt.textContent = d.nome.length > cortar ? `${d.nome.slice(0, Math.max(3, cortar - 1))}…` : d.nome;
          g.appendChild(txt);

          if (lh > 46) {
            const sub = document.createElementNS(NS, 'text');
            sub.setAttribute('x', String(n.x0 + 7));
            sub.setAttribute('y', String(n.y0 + 32));
            sub.setAttribute('fill', pal.txt2);
            sub.setAttribute('font-size', '10.5');
            sub.style.pointerEvents = 'none';
            sub.textContent = fmtInt(d.valor);
            g.appendChild(sub);
          }
        }
      }
    })();

    return () => { cancelado = true; };
  }, [visiveis, tam, pal, onClicar, selecionada]);

  if (visiveis.length === 0) {
    return <div className="ga-vazio"><div className="ga-vazio__t">Sem volume no período</div></div>;
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img"
        aria-label="Participação por canal: área é volume, cor é qualidade">
        <g data-l="fatias" />
      </svg>
      {dica && (
        <div style={{
          position: 'absolute', left: Math.min(dica.x + 12, Math.max(0, tam.w - 200)), top: dica.y + 12,
          pointerEvents: 'none', zIndex: 5, background: pal.surface, border: `1px solid ${pal.borda}`,
          borderRadius: 8, padding: '6px 9px', fontSize: 12, color: pal.txt, boxShadow: '0 10px 30px rgba(0,0,0,.28)',
        }}>
          <div style={{ fontWeight: 600 }}>{dica.f.nome}</div>
          <div style={{ color: pal.txt2 }}>{fmtInt(dica.f.valor)} sessões</div>
          {dica.f.detalhe && <div style={{ color: pal.txt2 }}>{dica.f.detalhe}</div>}
        </div>
      )}
    </div>
  );
}
