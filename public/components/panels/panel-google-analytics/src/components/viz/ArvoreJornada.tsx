// components/viz/ArvoreJornada.tsx — árvore de navegação (§25, §26) em D3.
// @version 1.0.0  @created 2026-07-30
//
// `d3-hierarchy` (layout `tree`) posiciona; o desenho é SVG à mão. Não há equivalente no
// painel de Ads — este componente é novo.
//
// A decisão de leitura mais importante aqui: **o abandono é um nó, com cor própria**. Uma
// árvore de navegação que só desenha quem seguiu adiante esconde exatamente o que se quer
// descobrir (§25 pede abandono e loops explícitos). O backend já devolve `tipo: 'saida'`.
//
// ⚠️ A espessura da ligação é proporcional ao volume: sem isso um caminho de 12 usuários
// parece tão importante quanto um de 4.000, e a árvore engana mais do que informa.
import { useEffect, useRef, useState } from 'react';
import { usarPaleta } from '../../lib/paleta';
import { fmtInt } from '../../lib/fmt';

export interface NoJornada {
  id: string;
  nome: string;
  titulo: string;
  tipo: string;
  usuarios: number;
  converteu: number;
  filhos: NoJornada[];
}

export function ArvoreJornada({
  raiz, altura = 460, onClicarNo,
}: {
  raiz: NoJornada;
  altura?: number;
  onClicarNo?: (n: NoJornada) => void;
}) {
  const pal = usarPaleta();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 900, h: altura });
  const [dica, setDica] = useState<{ x: number; y: number; n: NoJornada } | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(320, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current) return;
    let cancelado = false;

    (async () => {
      const h3 = await import('d3-hierarchy');
      if (cancelado || !svgRef.current) return;

      const { w, h } = tam;
      const hier = h3.hierarchy<NoJornada>(raiz, (d) => d.filhos);
      const maxVol = Math.max(1, ...hier.descendants().map((d) => d.data.usuarios));

      // ⚠️ Margem direita larga (188px): o rótulo do último nível é desenhado à direita do nó
      // e sem folga ele é cortado. O layout é horizontal (x = profundidade).
      h3.tree<NoJornada>().size([h - 24, w - 210])(hier as never);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const gL = svg.querySelector('g[data-l="ligacoes"]')!; gL.innerHTML = '';
      const gN = svg.querySelector('g[data-l="nos"]')!; gN.innerHTML = '';
      const NS = 'http://www.w3.org/2000/svg';

      const cor = (tipo: string) => {
        if (tipo === 'saida') return pal.erro;
        if (tipo === 'obrigado' || tipo === 'conversao') return pal.ok;
        if (tipo === 'erro') return pal.erro;
        if (tipo === 'home') return pal.laranja;
        return pal.roxo;
      };

      // ── ligações ───────────────────────────────────────────────────────
      for (const d of hier.descendants()) {
        const no = d as unknown as { x: number; y: number; parent: { x: number; y: number } | null };
        if (!no.parent) continue;
        const x1 = no.parent.y + 8, y1 = no.parent.x + 12;
        const x2 = no.y + 8, y2 = no.x + 12;
        const meio = (x1 + x2) / 2;
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', `M${x1},${y1} C${meio},${y1} ${meio},${y2} ${x2},${y2}`);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', cor(d.data.tipo));
        el.setAttribute('stroke-width', String(Math.max(1, (d.data.usuarios / maxVol) * 11)));
        el.setAttribute('stroke-opacity', '0.34');
        el.setAttribute('stroke-linecap', 'round');
        gL.appendChild(el);
      }

      // ── nós ────────────────────────────────────────────────────────────
      for (const d of hier.descendants()) {
        const no = d as unknown as { x: number; y: number };
        const c = cor(d.data.tipo);

        const circ = document.createElementNS(NS, 'circle');
        circ.setAttribute('cx', String(no.y + 8));
        circ.setAttribute('cy', String(no.x + 12));
        circ.setAttribute('r', String(Math.max(3.5, Math.min(11, 3.5 + (d.data.usuarios / maxVol) * 8))));
        circ.setAttribute('fill', c);
        circ.setAttribute('stroke', pal.bg2);
        circ.setAttribute('stroke-width', '1.4');
        circ.style.cursor = onClicarNo ? 'pointer' : 'default';
        circ.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setDica({ x: ev.clientX - r.left, y: ev.clientY - r.top, n: d.data });
        });
        circ.addEventListener('mouseleave', () => setDica(null));
        if (onClicarNo) circ.addEventListener('click', () => onClicarNo(d.data));
        gN.appendChild(circ);

        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(no.y + 22));
        t.setAttribute('y', String(no.x + 12));
        t.setAttribute('dy', '0.34em');
        t.setAttribute('fill', d.data.tipo === 'saida' ? pal.erro : pal.txt);
        t.setAttribute('font-size', '10.8');
        t.style.pointerEvents = 'none';
        const nome = d.data.nome.length > 22 ? `${d.data.nome.slice(0, 21)}…` : d.data.nome;
        t.textContent = `${nome}  ${fmtInt(d.data.usuarios)}`;
        gN.appendChild(t);
      }
    })();

    return () => { cancelado = true; };
  }, [raiz, tam, pal, onClicarNo]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img"
        aria-label="Árvore de navegação a partir da página inicial, com abandono destacado">
        <g data-l="ligacoes" /><g data-l="nos" />
      </svg>
      {dica && (
        <div style={{
          position: 'absolute', left: Math.min(dica.x + 12, Math.max(0, tam.w - 210)), top: dica.y + 12,
          pointerEvents: 'none', zIndex: 5, background: pal.surface, border: `1px solid ${pal.borda}`,
          borderRadius: 8, padding: '6px 9px', fontSize: 12, color: pal.txt, boxShadow: '0 10px 30px rgba(0,0,0,.28)',
          maxWidth: 230,
        }}>
          <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{dica.n.titulo}</div>
          <div style={{ color: pal.txt3, fontSize: 11 }}>{dica.n.nome}</div>
          <div style={{ color: pal.txt2, marginTop: 3 }}>{fmtInt(dica.n.usuarios)} usuários</div>
          {dica.n.converteu > 0 && <div style={{ color: pal.ok }}>{fmtInt(dica.n.converteu)} converteram</div>}
          {dica.n.tipo === 'saida' && <div style={{ color: pal.erro }}>saíram do site nesta etapa</div>}
        </div>
      )}
    </div>
  );
}
