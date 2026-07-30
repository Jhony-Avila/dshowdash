// components/viz/Sankey.tsx — Sankey de aquisição (§21) em D3.
// @version 1.0.0  @created 2026-07-30
//
// Molde: panel-ads/src/components/viz/d3/SankeyFluxo.tsx (mesmo padrão: `d3-sankey` calcula o
// layout, o desenho é SVG montado à mão, sem `d3-selection`). Diferenças deliberadas:
//   · nós têm `id` estável e `camada` → cor por ETAPA, não por índice (a mesma etapa tem a
//     mesma cor em qualquer tela, e reordenar o backend não muda o desenho);
//   · clique num nó emite cross-filter (§63);
//   · hover realça o CAMINHO conectado (a montante e a jusante), não só a ligação sob o mouse.
//
// ⚠️ `import('d3-sankey')` é DINÂMICO: quem abre a Visão Geral não paga por este código.
import { useEffect, useMemo, useRef, useState } from 'react';
import { usarPaleta, corDaCamada } from '../../lib/paleta';
import { fmtInt } from '../../lib/fmt';

export interface NoSankey { id: string; nome: string; camada: string; valor: number }
export interface LinkSankey { origem: string; destino: string; valor: number }

interface Dica { x: number; y: number; titulo: string; valor: number; sub?: string }

export function Sankey({
  nos, links, altura = 420, onClicarNo, selecionado,
}: {
  nos: NoSankey[];
  links: LinkSankey[];
  altura?: number;
  onClicarNo?: (no: NoSankey) => void;
  selecionado?: string | null;
}) {
  const pal = usarPaleta();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 900, h: altura });
  const [dica, setDica] = useState<Dica | null>(null);
  const [foco, setFoco] = useState<string | null>(null);

  // Vizinhança pré-calculada: o realce de caminho precisa saber, para um nó, todos os nós e
  // ligações alcançáveis. Fazer isso no mousemove daria travamento perceptível.
  const vizinhanca = useMemo(() => {
    const frente = new Map<string, string[]>();
    const tras = new Map<string, string[]>();
    for (const l of links) {
      (frente.get(l.origem) ?? frente.set(l.origem, []).get(l.origem)!).push(l.destino);
      (tras.get(l.destino) ?? tras.set(l.destino, []).get(l.destino)!).push(l.origem);
    }
    const alcancaveis = (id: string): Set<string> => {
      const vistos = new Set<string>([id]);
      const anda = (atual: string, mapa: Map<string, string[]>) => {
        for (const p of mapa.get(atual) ?? []) {
          if (!vistos.has(p)) { vistos.add(p); anda(p, mapa); }
        }
      };
      anda(id, frente);
      anda(id, tras);
      return vistos;
    };
    return { alcancaveis };
  }, [links]);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(320, e[0].contentRect.width), h: altura }));
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
      const posPorId = new Map(nos.map((n, i) => [n.id, i]));
      const entrada = {
        nodes: nos.map((n) => ({ ...n })),
        links: links
          .filter((l) => posPorId.has(l.origem) && posPorId.has(l.destino))
          .map((l) => ({ source: posPorId.get(l.origem)!, target: posPorId.get(l.destino)!, value: Math.max(0.0001, l.valor) })),
      };

      const gerador = d3s.sankey<NoSankey, object>()
        .nodeWidth(13)
        .nodePadding(12)
        // ⚠️ Margem direita generosa: o rótulo do último nível é desenhado FORA do nó e sem
        // isso ele é cortado pela borda do SVG.
        .extent([[4, 10], [w - 150, h - 10]]);

      let grafo;
      try {
        grafo = gerador(entrada as never);
      } catch {
        // d3-sankey lança em grafo com ciclo. Não deve acontecer com o contrato atual (as
        // camadas são estritamente ordenadas), mas travar a tela por isso seria pior.
        return;
      }

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const gL = svg.querySelector('g[data-l="links"]')!; gL.innerHTML = '';
      const gN = svg.querySelector('g[data-l="nos"]')!; gN.innerHTML = '';
      const gT = svg.querySelector('g[data-l="rotulos"]')!; gT.innerHTML = '';

      const caminho = d3s.sankeyLinkHorizontal();
      const emFoco = foco ? vizinhanca.alcancaveis(foco) : null;
      const NS = 'http://www.w3.org/2000/svg';

      // ── ligações ───────────────────────────────────────────────────────
      grafo.links.forEach((lk) => {
        const src = lk.source as unknown as NoSankey;
        const tgt = lk.target as unknown as NoSankey;
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', caminho(lk as never) ?? '');
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', corDaCamada(pal, src.camada));
        el.setAttribute('stroke-width', String(Math.max(1, lk.width ?? 1)));
        const dentro = !emFoco || (emFoco.has(src.id) && emFoco.has(tgt.id));
        el.setAttribute('stroke-opacity', dentro ? (emFoco ? '0.68' : '0.32') : '0.06');
        el.style.transition = 'stroke-opacity .14s ease';
        el.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setDica({ x: ev.clientX - r.left, y: ev.clientY - r.top, titulo: `${src.nome} → ${tgt.nome}`, valor: lk.value ?? 0, sub: 'sessões' });
        });
        el.addEventListener('mouseleave', () => setDica(null));
        gL.appendChild(el);
      });

      // ── nós ────────────────────────────────────────────────────────────
      grafo.nodes.forEach((nd) => {
        const n = nd as unknown as NoSankey & { x0: number; x1: number; y0: number; y1: number; value: number };
        const dentro = !emFoco || emFoco.has(n.id);
        const sel = selecionado === n.id;

        const rect = document.createElementNS(NS, 'rect');
        rect.setAttribute('x', String(n.x0));
        rect.setAttribute('y', String(n.y0));
        rect.setAttribute('width', String(n.x1 - n.x0));
        rect.setAttribute('height', String(Math.max(1.5, n.y1 - n.y0)));
        rect.setAttribute('rx', '2.5');
        rect.setAttribute('fill', corDaCamada(pal, n.camada));
        rect.setAttribute('opacity', dentro ? '1' : '0.18');
        if (sel) { rect.setAttribute('stroke', pal.txt); rect.setAttribute('stroke-width', '2'); }
        rect.style.cursor = onClicarNo ? 'pointer' : 'default';
        rect.style.transition = 'opacity .14s ease';
        rect.addEventListener('mousemove', (ev) => {
          const r = wrapRef.current!.getBoundingClientRect();
          setDica({ x: ev.clientX - r.left, y: ev.clientY - r.top, titulo: n.nome, valor: n.value ?? n.valor, sub: n.camada });
        });
        rect.addEventListener('mouseenter', () => setFoco(n.id));
        rect.addEventListener('mouseleave', () => { setDica(null); setFoco(null); });
        if (onClicarNo) {
          rect.addEventListener('click', () => onClicarNo({ id: n.id, nome: n.nome, camada: n.camada, valor: n.value ?? n.valor }));
        }
        gN.appendChild(rect);

        // ── rótulo ───────────────────────────────────────────────────────
        // Nós finos não recebem texto: empilhar rótulo em barra de 2px produz sopa ilegível.
        if ((n.y1 - n.y0) < 9) return;
        const t = document.createElementNS(NS, 'text');
        const paraDireita = n.x0 < w * 0.62;
        t.setAttribute('x', String(paraDireita ? n.x1 + 6 : n.x0 - 6));
        t.setAttribute('y', String((n.y0 + n.y1) / 2));
        t.setAttribute('dy', '0.34em');
        t.setAttribute('text-anchor', paraDireita ? 'start' : 'end');
        t.setAttribute('fill', dentro ? pal.txt : pal.txt3);
        t.setAttribute('font-size', '11');
        t.style.pointerEvents = 'none';
        const nome = n.nome.length > 26 ? `${n.nome.slice(0, 25)}…` : n.nome;
        t.textContent = nome;
        gT.appendChild(t);
      });
    })();

    return () => { cancelado = true; };
  }, [nos, links, pal, tam, foco, selecionado, onClicarNo, vizinhanca]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      <svg
        ref={svgRef} width="100%" height={altura} style={{ display: 'block' }}
        role="img"
        aria-label={`Diagrama de fluxo da aquisição com ${nos.length} etapas e ${links.length} ligações`}
      >
        <g data-l="links" /><g data-l="nos" /><g data-l="rotulos" />
      </svg>
      {dica && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(dica.x + 12, Math.max(0, tam.w - 220)),
            top: dica.y + 12,
            pointerEvents: 'none', zIndex: 5,
            background: pal.surface, border: `1px solid ${pal.borda}`,
            borderRadius: 8, padding: '6px 9px', fontSize: 12, color: pal.txt,
            boxShadow: '0 10px 30px rgba(0,0,0,.28)', maxWidth: 240,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2, wordBreak: 'break-word' }}>{dica.titulo}</div>
          <div style={{ color: pal.txt2 }}>{fmtInt(dica.valor)} {dica.sub}</div>
        </div>
      )}
    </div>
  );
}
