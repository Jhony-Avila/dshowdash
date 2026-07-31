// screens/FluxoD3.tsx — fluxo de reuniões em Sankey (§40) e rede de
// coparticipação em force layout (§65).
// @version 1.0.0  @created 2026-07-30
//
// O §40 é explícito: esta visualização "deverá ser usada apenas quando houver
// dados suficientes e benefício analítico". O backend decide isso e devolve
// `suficiente:false` + `motivo`; aqui a gente RESPEITA em vez de desenhar três
// fitas que não explicam nada. Sankey ralo é pior que tabela.
//
// D3 modular (d3-sankey, d3-force, d3-scale) já estava instalado — nenhuma
// dependência nova entrou para esta fase.
import { useEffect, useMemo, useRef, useState } from 'react';
import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey';
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum,
} from 'd3-force';
import { EstadoVazio } from './Estados';
import { Icone } from '../shell/Icone';

/* ══════════════════════════════════════════════════════════════════════
   Sankey — origem → tipo → resultado
   ══════════════════════════════════════════════════════════════════════ */

export interface LinkFluxo { de: string; para: string; valor: number }
export interface DadosFluxo {
  links: LinkFluxo[];
  total: number;
  suficiente: boolean;
  motivo: string | null;
}

/**
 * Paleta por ESTÁGIO, não por nó.
 *
 * Colorir 12 nós com 12 hues seria arco-íris — e a regra é que categórica não
 * se cicla nem se gera. Aqui a cor codifica a COLUNA (de onde vem, o que é,
 * como terminou), que é o que a leitura precisa distinguir; dentro de uma
 * coluna a identidade vem do rótulo, que está sempre visível.
 */
const COR_ESTAGIO = ['var(--gc-serie-1)', 'var(--gc-serie-3)', 'var(--gc-serie-2)'];

interface NoSankey {
  name: string;
  x0?: number; x1?: number; y0?: number; y1?: number;
  depth?: number; index?: number;
}
interface LinkSankey {
  source: number | NoSankey; target: number | NoSankey; value: number;
  width?: number; y0?: number; y1?: number;
}

export function FluxoD3({ dados }: { dados: DadosFluxo }) {
  const [destaque, setDestaque] = useState<string | null>(null);

  const grafo = useMemo(() => {
    if (!dados.suficiente || !dados.links.length) return null;

    const nomes: string[] = [];
    const idx = (n: string) => {
      let i = nomes.indexOf(n);
      if (i < 0) { i = nomes.length; nomes.push(n); }
      return i;
    };
    const links: LinkSankey[] = dados.links.map((l) => ({
      source: idx(l.de), target: idx(l.para), value: l.valor,
    }));

    const largura = 620, altura = Math.max(220, nomes.length * 26);
    const layout = sankey<NoSankey, LinkSankey>()
      .nodeWidth(13)
      .nodePadding(14)
      .nodeAlign(sankeyJustify)
      .extent([[4, 8], [largura - 4, altura - 8]]);

    try {
      const g = layout({
        nodes: nomes.map((name) => ({ name })),
        links: links.map((l) => ({ ...l })),
      });
      return { ...g, largura, altura };
    } catch {
      // Ciclo nos dados quebraria o layout; melhor não desenhar do que estourar.
      return null;
    }
  }, [dados]);

  if (!dados.suficiente || !grafo) {
    return (
      <EstadoVazio
        titulo="Fluxo indisponível para este período"
        mensagem={dados.motivo ?? 'Não há reuniões suficientes para que o fluxo diga algo útil.'}
      />
    );
  }

  const caminho = sankeyLinkHorizontal<NoSankey, LinkSankey>();

  return (
    <figure className="gc-figura gc-fluxo">
      <figcaption className="gc-figura-titulo">
        Fluxo das reuniões · origem → formato → desfecho
        <span className="gc-figura-meta">{dados.total} reuniões</span>
      </figcaption>

      <div className="gc-fluxo-wrap">
        <svg viewBox={`0 0 ${grafo.largura} ${grafo.altura}`} className="gc-fluxo-svg"
             role="img" aria-label="Diagrama de fluxo das reuniões. Dados equivalentes na tabela abaixo.">
          <g>
            {grafo.links.map((l, i) => {
              const s = l.source as NoSankey;
              const t = l.target as NoSankey;
              const aceso = destaque === null || destaque === s.name || destaque === t.name;
              return (
                <path
                  key={i}
                  d={caminho(l) ?? undefined}
                  className={`gc-fluxo-fita${aceso ? '' : ' is-apagada'}`}
                  strokeWidth={Math.max(1, l.width ?? 1)}
                  onMouseEnter={() => setDestaque(s.name)}
                  onMouseLeave={() => setDestaque(null)}
                >
                  <title>{`${s.name} → ${t.name}: ${l.value}`}</title>
                </path>
              );
            })}
          </g>

          <g>
            {grafo.nodes.map((n, i) => {
              const x0 = n.x0 ?? 0, x1 = n.x1 ?? 0, y0 = n.y0 ?? 0, y1 = n.y1 ?? 0;
              const cor = COR_ESTAGIO[(n.depth ?? 0) % COR_ESTAGIO.length];
              const aDireita = x0 > grafo.largura / 2;
              return (
                <g key={i}
                   onMouseEnter={() => setDestaque(n.name)}
                   onMouseLeave={() => setDestaque(null)}>
                  <rect x={x0} y={y0} width={Math.max(1, x1 - x0)} height={Math.max(1, y1 - y0)}
                        rx={3} fill={cor} className="gc-fluxo-no">
                    <title>{n.name}</title>
                  </rect>
                  <text
                    x={aDireita ? x0 - 6 : x1 + 6}
                    y={(y0 + y1) / 2 + 3.5}
                    textAnchor={aDireita ? 'end' : 'start'}
                    className="gc-fluxo-rot"
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <details className="gc-tabela-alt">
        <summary>Ver dados em tabela</summary>
        <div className="gc-grid-wrap">
          <table className="gc-grid gc-grid-compacta">
            <thead><tr><th>De</th><th>Para</th><th>Reuniões</th></tr></thead>
            <tbody>
              {dados.links.map((l, i) => (
                <tr key={i}><td>{l.de}</td><td>{l.para}</td><td>{l.valor}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Rede de coparticipação
   ══════════════════════════════════════════════════════════════════════ */

export interface NoRede { id: string; nome: string; peso: number; externo: boolean }
export interface ArestaRede { origem: string; destino: string; peso: number }
export interface DadosRede {
  nos: NoRede[];
  arestas: ArestaRede[];
  total_pessoas: number;
  omitidos: number;
  suficiente: boolean;
  motivo: string | null;
}

interface NoSim extends SimulationNodeDatum, NoRede { }
interface ArestaSim { source: NoSim | string; target: NoSim | string; peso: number }

export function RedeD3({ dados, onSelecionar, selecionado }: {
  dados: DadosRede;
  selecionado: string | null;
  onSelecionar: (email: string | null) => void;
}) {
  const [tick, setTick] = useState(0);
  const simRef = useRef<ReturnType<typeof forceSimulation<NoSim>> | null>(null);
  const nosRef = useRef<NoSim[]>([]);
  const arestasRef = useRef<ArestaSim[]>([]);

  const L = 560, A = 340;

  useEffect(() => {
    if (!dados.suficiente) return;

    const nos: NoSim[] = dados.nos.map((n) => ({ ...n }));
    const porId = new Map(nos.map((n) => [n.id, n]));
    const arestas: ArestaSim[] = dados.arestas
      .filter((a) => porId.has(a.origem) && porId.has(a.destino))
      .map((a) => ({ source: porId.get(a.origem)!, target: porId.get(a.destino)!, peso: a.peso }));

    nosRef.current = nos;
    arestasRef.current = arestas;

    // Simulação com TETO de iterações e parada explícita: force layout que
    // fica rodando indefinidamente cozinha a CPU num painel que o usuário
    // deixa aberto o dia inteiro.
    const sim = forceSimulation<NoSim>(nos)
      .force('link', forceLink<NoSim, ArestaSim>(arestas).id((d) => d.id).distance(70).strength(0.35))
      .force('carga', forceManyBody().strength(-190))
      .force('centro', forceCenter(L / 2, A / 2))
      .force('colisao', forceCollide<NoSim>().radius((d) => 12 + Math.min(10, d.peso)))
      .alphaDecay(0.06)
      .on('tick', () => setTick((t) => t + 1));

    simRef.current = sim;
    const parar = setTimeout(() => sim.stop(), 4000);

    return () => { clearTimeout(parar); sim.stop(); simRef.current = null; };
  }, [dados]);

  if (!dados.suficiente) {
    return (
      <EstadoVazio
        titulo="Rede indisponível para este período"
        mensagem={dados.motivo ?? 'Ainda não há coparticipação suficiente para desenhar a rede.'}
      />
    );
  }

  void tick;   // re-render a cada tick da simulação
  const nos = nosRef.current;
  const arestas = arestasRef.current;
  const maxPeso = Math.max(1, ...nos.map((n) => n.peso));

  return (
    <figure className="gc-figura gc-rede">
      <figcaption className="gc-figura-titulo">
        Rede de coparticipação · quem se reúne com quem
        <span className="gc-figura-meta">
          {nos.length} de {dados.total_pessoas} pessoas
          {dados.omitidos > 0 && ` · ${dados.omitidos} com menos reuniões ficaram de fora`}
        </span>
        {selecionado && (
          <button type="button" className="gc-btn gc-btn-fantasma gc-heat-limpar"
                  onClick={() => onSelecionar(null)}>
            <Icone nome="x" tamanho={12} /> Limpar seleção
          </button>
        )}
      </figcaption>

      <div className="gc-rede-wrap">
        <svg viewBox={`0 0 ${L} ${A}`} className="gc-rede-svg" role="img"
             aria-label="Rede de coparticipação em reuniões. Dados equivalentes na tabela abaixo.">
          <g>
            {arestas.map((a, i) => {
              const s = a.source as NoSim;
              const t = a.target as NoSim;
              if (s.x == null || t.x == null) return null;
              const aceso = !selecionado || s.id === selecionado || t.id === selecionado;
              return (
                <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      className={`gc-rede-aresta${aceso ? '' : ' is-apagada'}`}
                      strokeWidth={Math.min(5, 1 + a.peso * 0.5)}>
                  <title>{`${s.nome} ↔ ${t.nome}: ${a.peso} reunião(ões)`}</title>
                </line>
              );
            })}
          </g>
          <g>
            {nos.map((n) => {
              if (n.x == null) return null;
              const r = 7 + (n.peso / maxPeso) * 9;
              const sel = selecionado === n.id;
              const aceso = !selecionado || sel
                || arestas.some((a) => {
                  const s = a.source as NoSim, t = a.target as NoSim;
                  return (s.id === selecionado && t.id === n.id) || (t.id === selecionado && s.id === n.id);
                });
              return (
                <g key={n.id} className={aceso ? '' : 'is-apagada'}>
                  <circle
                    cx={n.x} cy={n.y} r={r}
                    className={`gc-rede-no${sel ? ' is-sel' : ''}${n.externo ? ' is-externo' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${n.nome}, ${n.peso} reunião(ões)${n.externo ? ', externo' : ''}`}
                    aria-pressed={sel}
                    onClick={() => onSelecionar(sel ? null : n.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); onSelecionar(sel ? null : n.id);
                      }
                    }}
                  >
                    <title>{`${n.nome} · ${n.peso} reunião(ões)`}</title>
                  </circle>
                  <text x={n.x} y={(n.y ?? 0) + r + 10} textAnchor="middle" className="gc-rede-rot">
                    {n.nome.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="gc-rede-legenda">
          <span><i className="gc-rede-leg" /> interno</span>
          <span><i className="gc-rede-leg is-externo" /> externo</span>
          <span className="gc-td-fraco">o tamanho do círculo é o nº de reuniões</span>
        </div>
      </div>

      <details className="gc-tabela-alt">
        <summary>Ver dados em tabela</summary>
        <div className="gc-grid-wrap">
          <table className="gc-grid gc-grid-compacta">
            <thead><tr><th>Pessoa</th><th>Externo</th><th>Reuniões</th></tr></thead>
            <tbody>
              {[...dados.nos].sort((a, b) => b.peso - a.peso).map((n) => (
                <tr key={n.id}>
                  <td>{n.nome}</td>
                  <td>{n.externo ? 'sim' : 'não'}</td>
                  <td>{n.peso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
