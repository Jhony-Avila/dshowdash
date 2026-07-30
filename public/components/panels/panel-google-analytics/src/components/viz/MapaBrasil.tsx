// components/viz/MapaBrasil.tsx — coropleto por UF (§40) em D3.
// @version 1.0.0  @created 2026-07-30
//
// Molde: panel-ads/src/components/viz/d3/GeoMapaBrasil.tsx.
//
// ⚠️ O TopoJSON (154 KB) é **self-hosted no próprio painel** (`public/geo/br-uf.topo.json` →
// `dist/geo/`), NÃO puxado de CDN e NÃO referenciado no dist do painel de Ads.
//   · CDN: o §83 proíbe o front depender de host externo, e um mapa que quebra quando a CDN
//     cai é pior que uma tabela;
//   · dist do Ads: `emptyOutDir: true` — um `vite build` daquele painel apagaria o asset e
//     este mapa quebraria por causa de um build alheio. 154 KB duplicados compram
//     independência entre painéis.
//
// ⚠️ O fetch é cacheado em nível de módulo: trocar de tela e voltar não baixa de novo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { usarPaleta } from '../../lib/paleta';
import { fmtInt, fmtPct } from '../../lib/fmt';

const TOPO_URL = '/components/panels/panel-google-analytics/dist/geo/br-uf.topo.json';

interface Feature { type: string; properties: Record<string, unknown>; geometry: unknown }

let _cache: Promise<Feature[]> | null = null;

async function carregarUFs(): Promise<Feature[]> {
  if (!_cache) {
    _cache = (async () => {
      const [resp, topo] = await Promise.all([fetch(TOPO_URL, { credentials: 'same-origin' }), import('topojson-client')]);
      if (!resp.ok) throw new Error(`geometria indisponível (HTTP ${resp.status})`);
      const topology = await resp.json();
      const fc = topo.feature(topology, topology.objects.uf) as unknown as { features: Feature[] };
      return fc.features;
    })().catch((e) => { _cache = null; throw e; });   // erro não pode envenenar o cache
  }
  return _cache;
}

export interface DadoUf { uf: string; regiao: string; usuarios: number; conversoes: number; taxa_conversao: number }

export function MapaBrasil({
  dados, metrica = 'usuarios', altura = 420, onClicarUf, selecionada,
}: {
  dados: DadoUf[];
  metrica?: 'usuarios' | 'conversoes' | 'taxa_conversao';
  altura?: number;
  onClicarUf?: (uf: DadoUf) => void;
  selecionada?: string | null;
}) {
  const pal = usarPaleta();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 640, h: altura });
  const [feats, setFeats] = useState<Feature[] | null>(null);
  const [erroGeo, setErroGeo] = useState<string | null>(null);
  const [dica, setDica] = useState<{ x: number; y: number; uf: DadoUf } | null>(null);

  const porUf = useMemo(() => new Map(dados.map((d) => [d.uf, d])), [dados]);
  const max = useMemo(() => Math.max(0.0001, ...dados.map((d) => d[metrica] as number)), [dados, metrica]);

  useEffect(() => { carregarUFs().then(setFeats).catch((e: Error) => setErroGeo(e.message)); }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((e) => setTam({ w: Math.max(280, e[0].contentRect.width), h: altura }));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    if (!svgRef.current || !feats) return;
    let cancelado = false;

    (async () => {
      const geo = await import('d3-geo');
      if (cancelado || !svgRef.current) return;

      const { w, h } = tam;
      // `fitSize` sobre a coleção inteira: sem isso o Brasil sai fora do viewBox em telas
      // estreitas, e a projeção mercator crua deixa o país minúsculo no canto.
      const proj = geo.geoMercator().fitSize([w, h], { type: 'FeatureCollection', features: feats } as never);
      const path = geo.geoPath(proj);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const g = svg.querySelector('g[data-l="ufs"]')!;
      g.innerHTML = '';
      const NS = 'http://www.w3.org/2000/svg';

      for (const f of feats) {
        // O asset do projeto usa `sigla`; alguns TopoJSON de UF usam `SIGLA`/`UF`.
        const props = f.properties as Record<string, string>;
        const sigla = props.sigla ?? props.SIGLA ?? props.UF ?? '';
        const d = porUf.get(sigla);
        const v = d ? (d[metrica] as number) : 0;
        const t = max > 0 ? Math.max(0, Math.min(1, v / max)) : 0;

        const el = document.createElementNS(NS, 'path');
        el.setAttribute('d', path(f as never) ?? '');
        // Escala de intensidade sobre o laranja da marca. `0.10` de piso para a UF sem dado
        // ainda ser visível como território — pintar de transparente daria a impressão de
        // buraco no mapa.
        el.setAttribute('fill', d ? `color-mix(in srgb, ${pal.laranja} ${Math.round(12 + t * 88)}%, ${pal.bg2})` : pal.bg2);
        el.setAttribute('stroke', selecionada === sigla ? pal.txt : pal.borda);
        el.setAttribute('stroke-width', selecionada === sigla ? '2' : '0.6');
        el.style.cursor = d && onClicarUf ? 'pointer' : 'default';
        el.style.transition = 'fill .16s ease';

        if (d) {
          el.addEventListener('mousemove', (ev) => {
            const r = wrapRef.current!.getBoundingClientRect();
            setDica({ x: ev.clientX - r.left, y: ev.clientY - r.top, uf: d });
          });
          el.addEventListener('mouseleave', () => setDica(null));
          if (onClicarUf) el.addEventListener('click', () => onClicarUf(d));
        }
        g.appendChild(el);
      }
    })();

    return () => { cancelado = true; };
  }, [feats, tam, pal, porUf, metrica, max, onClicarUf, selecionada]);

  if (erroGeo) {
    // A tabela ao lado continua servindo: o mapa é a camada visual, não a fonte.
    return (
      <div className="ga-vazio">
        <div className="ga-vazio__t">Mapa indisponível</div>
        <div className="ga-vazio__d">{erroGeo}. Os dados por estado continuam na tabela.</div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      {!feats && <div className="ga-skel" style={{ position: 'absolute', inset: 0 }} />}
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img"
        aria-label="Mapa do Brasil com intensidade por estado">
        <g data-l="ufs" />
      </svg>
      {dica && (
        <div style={{
          position: 'absolute', left: Math.min(dica.x + 12, Math.max(0, tam.w - 190)), top: dica.y + 12,
          pointerEvents: 'none', zIndex: 5, background: pal.surface, border: `1px solid ${pal.borda}`,
          borderRadius: 8, padding: '6px 9px', fontSize: 12, color: pal.txt, boxShadow: '0 10px 30px rgba(0,0,0,.28)',
        }}>
          <div style={{ fontWeight: 600 }}>{dica.uf.regiao} <span style={{ color: pal.txt3 }}>{dica.uf.uf}</span></div>
          <div style={{ color: pal.txt2 }}>{fmtInt(dica.uf.usuarios)} usuários</div>
          <div style={{ color: pal.txt2 }}>{fmtInt(dica.uf.conversoes)} conversões · {fmtPct(dica.uf.taxa_conversao)}</div>
        </div>
      )}
    </div>
  );
}
