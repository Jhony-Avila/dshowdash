// components/viz/d3/GeoMapaBrasil.tsx — coroplético do Brasil por UF (D3, Fase 2).
// @version 1.0.0  @created 2026-07-22
//
// Por que D3 e não ECharts: mapa é o caso onde D3 dá liberdade total de projeção,
// escala de cor e interação. Usa d3-geo (projeção/desenho), d3-scale (escala de cor),
// topojson-client (decodifica o asset 154KB self-hosted em dist/geo/). Theme-aware,
// tooltip no hover, clique seleciona a UF (filtro cruzado), legenda e resize.
import { useEffect, useRef, useState } from 'react';
import { useTokensAds, type PaletaAds } from '../../../shell/useShellTheme';

const TOPO_URL = '/components/panels/panel-ads/dist/geo/br-uf.topo.json';

type GeoObj = import('d3-geo').GeoPermissibleObjects;

// cache module-level do geojson decodificado (fetch único por sessão)
let _featuresCache: Promise<GeoFeature[]> | null = null;
interface GeoFeature { type: 'Feature'; properties: { sigla: string; name: string }; geometry: unknown; }

async function carregarUFs(): Promise<GeoFeature[]> {
  if (!_featuresCache) {
    _featuresCache = (async () => {
      const [resp, topo] = await Promise.all([fetch(TOPO_URL), import('topojson-client')]);
      const topology = await resp.json();
      const fc = topo.feature(topology, topology.objects.uf) as unknown as { features: GeoFeature[] };
      return fc.features;
    })();
  }
  return _featuresCache;
}

export interface DadoUF { uf: string; valor: number; [k: string]: unknown; }

export interface GeoMapaBrasilProps {
  dados: DadoUF[];
  fmt?: (v: number) => string;
  /** Rótulos extras no tooltip: [label, (dado)=>valor]. */
  detalhes?: [string, (d: DadoUF) => string][];
  selecionado?: string | null;
  onSelecionar?: (uf: string | null) => void;
  altura?: number;
}

interface TipState { x: number; y: number; sigla: string; nome: string; valor: number; d: DadoUF | null; }

export function GeoMapaBrasil({ dados, fmt = (v) => String(v), detalhes = [], selecionado = null, onSelecionar, altura = 340 }: GeoMapaBrasilProps) {
  const pal = useTokensAds();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [feats, setFeats] = useState<GeoFeature[] | null>(null);
  const [erro, setErro] = useState(false);
  const [tip, setTip] = useState<TipState | null>(null);
  const [tam, setTam] = useState({ w: 600, h: altura });

  // carrega geometria uma vez
  useEffect(() => {
    let vivo = true;
    carregarUFs().then((f) => { if (vivo) setFeats(f); }).catch(() => { if (vivo) setErro(true); });
    return () => { vivo = false; };
  }, []);

  // observa tamanho do container
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((ents) => {
      const cr = ents[0].contentRect;
      setTam({ w: Math.max(240, cr.width), h: altura });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [altura]);

  // desenha/atualiza (d3-geo + escala de cor) — reage a dados, tema e tamanho
  useEffect(() => {
    if (!feats || !svgRef.current) return;
    let cancelado = false;
    (async () => {
      const [d3geo, d3scale] = await Promise.all([import('d3-geo'), import('d3-scale')]);
      if (cancelado || !svgRef.current) return;
      const { w, h } = tam;
      const porUF = new Map(dados.map((d) => [d.uf, d]));
      const valores = dados.map((d) => d.valor);
      const min = Math.min(...valores, 0);
      const max = Math.max(...valores, 1);
      const escala = escalaCor(d3scale, pal, min, max);

      const fc = { type: 'FeatureCollection', features: feats } as unknown as GeoObj;
      const proj = d3geo.geoMercator().fitSize([w, h], fc);
      const path = d3geo.geoPath(proj);

      const svg = svgRef.current;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      // pinta cada UF
      const gPaths = svg.querySelector('g[data-layer="ufs"]')!;
      gPaths.innerHTML = '';
      for (const f of feats) {
        const sigla = f.properties.sigla;
        const d = porUF.get(sigla) ?? null;
        const dstr = path(f as unknown as GeoObj) ?? '';
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', dstr);
        el.setAttribute('fill', d ? escala(d.valor) : pal.surface2);
        el.setAttribute('stroke', selecionado === sigla ? pal.text : pal.bg);
        el.setAttribute('stroke-width', selecionado === sigla ? '2' : '0.7');
        el.style.cursor = onSelecionar ? 'pointer' : 'default';
        el.style.transition = 'fill .3s ease, stroke .15s ease';
        el.addEventListener('mousemove', (ev) => {
          const rect = wrapRef.current!.getBoundingClientRect();
          setTip({ x: ev.clientX - rect.left, y: ev.clientY - rect.top, sigla, nome: f.properties.name, valor: d?.valor ?? 0, d });
          el.setAttribute('stroke', pal.text); el.setAttribute('stroke-width', '1.6');
        });
        el.addEventListener('mouseleave', () => {
          setTip(null);
          el.setAttribute('stroke', selecionado === sigla ? pal.text : pal.bg);
          el.setAttribute('stroke-width', selecionado === sigla ? '2' : '0.7');
        });
        if (onSelecionar) el.addEventListener('click', () => onSelecionar(selecionado === sigla ? null : sigla));
        gPaths.appendChild(el);
      }
    })();
    return () => { cancelado = true; };
  }, [feats, dados, pal, tam, selecionado, onSelecionar]);

  if (erro) return <div className="ads-grid-empty" style={{ height: altura, display: 'grid', placeItems: 'center' }}>Não foi possível carregar o mapa.</div>;

  const min = Math.min(...dados.map((d) => d.valor), 0);
  const max = Math.max(...dados.map((d) => d.valor), 1);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: altura }}>
      {!feats && <div className="ads-overlay-load" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span className="ads-spinner" /></div>}
      <svg ref={svgRef} width="100%" height={altura} style={{ display: 'block' }} role="img" aria-label="Mapa do Brasil por UF">
        <g data-layer="ufs" />
      </svg>

      {/* legenda gradiente */}
      <div style={{ position: 'absolute', left: 12, bottom: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: pal.textDim }}>
        <span>{fmt(min)}</span>
        <span style={{ width: 96, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${pal.surface2}, ${pal.primary}, ${pal.pink})` }} />
        <span>{fmt(max)}</span>
      </div>

      {tip && (
        <div style={{ position: 'absolute', left: Math.min(tip.x + 12, tam.w - 150), top: tip.y + 12, pointerEvents: 'none', zIndex: 5,
          background: pal.surface, border: `1px solid ${pal.border}`, borderRadius: 10, padding: '8px 10px', boxShadow: '0 10px 30px rgba(0,0,0,.28)', fontSize: 12, color: pal.text, minWidth: 120 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{tip.nome} <span style={{ color: pal.textDim }}>({tip.sigla})</span></div>
          <div><b>{fmt(tip.valor)}</b></div>
          {tip.d && detalhes.map(([lbl, get]) => (
            <div key={lbl} style={{ color: pal.textDim, fontSize: 11 }}>{lbl}: <span style={{ color: pal.text }}>{get(tip.d!)}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}

function escalaCor(d3scale: typeof import('d3-scale'), pal: PaletaAds, min: number, max: number): (v: number) => string {
  // escala linear em 3 paradas (surface2 → primary → pink), coerente com o heatmap ECharts
  const s = d3scale.scaleLinear<string>().domain([min, (min + max) / 2, max]).range([pal.surface2, pal.primary, pal.pink]).clamp(true);
  return (v: number) => s(v);
}
