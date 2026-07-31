// panel-bling/src/viz/D3.tsx — visualizações em D3 (§52)
// @version 1.0.0  @created 2026-07-30
//
// D3 é usado onde o ECharts não entrega a leitura certa: fluxo de valor (Sankey),
// quadrantes com corte declarado (matriz) e relação entre entidades (rede).
//
// Regra do §52.1 — toda visualização aqui tem: tooltip, legenda, seleção, reset,
// drill-down, estado vazio, responsividade e suporte a tema. O que não tiver,
// não entra.
//
// Padrão de integração com React: o React é dono do <svg>; o D3 só calcula
// layout (sankey, força, escalas). Nada de d3.select().append() disputando o DOM
// com o React — é a fonte clássica de nó órfão e vazamento.

import React from 'react';
import { sankey as d3Sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink } from 'd3-sankey';
import { scaleLinear } from 'd3-scale';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { EstadoVazio } from '@shared';
import { tokens, fmtValor } from './Echarts';

/* ─────────────────────── Tooltip compartilhado ─────────────────────── */

function useTooltip() {
  const [tip, setTip] = React.useState<{ x: number; y: number; conteudo: React.ReactNode } | null>(null);
  const mostrar = (e: React.MouseEvent, conteudo: React.ReactNode) => {
    const r = (e.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect();
    setTip({ x: e.clientX - (r?.left ?? 0) + 12, y: e.clientY - (r?.top ?? 0) + 12, conteudo });
  };
  const esconder = () => setTip(null);
  const elemento = tip ? (
    <div style={{
      position: 'absolute', left: tip.x, top: tip.y, pointerEvents: 'none', zIndex: 5,
      padding: '7px 10px', fontSize: 11.5, maxWidth: 260,
      background: 'var(--bl-overlay)', color: 'var(--bl-texto)',
      border: '1px solid var(--bl-borda)', borderRadius: 8,
      boxShadow: '0 4px 18px rgba(0,0,0,.3)',
    }}>{tip.conteudo}</div>
  ) : null;
  return { mostrar, esconder, elemento };
}

/** Mede o contêiner para o SVG acompanhar a largura disponível. */
function useLargura(ref: React.RefObject<HTMLElement | null>) {
  const [l, setL] = React.useState(720);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entradas => {
      const w = entradas[0]?.contentRect.width ?? 720;
      if (w > 0) setL(w);
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return l;
}

/* ─────────────────────────── Sankey ─────────────────────────── */

export interface DadosSankey {
  nos: { id: string; nome: string; tipo?: string }[];
  links: { origem: string; destino: string; valor: number; quantidade?: number }[];
  nota?: string;
}

export function SankeyD3({ dados, altura = 320, aoSelecionar, selecionado, formato = 'moeda' }: {
  dados: DadosSankey; altura?: number;
  aoSelecionar?: (idNo: string | null) => void;
  selecionado?: string | null;
  formato?: string;
}) {
  const refBox = React.useRef<HTMLDivElement>(null);
  const largura = useLargura(refBox);
  const tt = useTooltip();
  const t = React.useMemo(() => tokens(refBox.current), [refBox.current]);

  const layout = React.useMemo(() => {
    if (!dados?.nos?.length || !dados?.links?.length) return null;

    const indice = new Map(dados.nos.map((n, i) => [n.id, i]));
    // Link com ponta desconhecida é descartado: o d3-sankey lança se receber
    // índice inválido, e derrubar a tela por um nó a mais não é aceitável.
    const links = dados.links
      .filter(l => indice.has(l.origem) && indice.has(l.destino) && l.valor > 0)
      .map(l => ({ source: indice.get(l.origem)!, target: indice.get(l.destino)!, value: l.valor, meta: l }));

    if (!links.length) return null;

    try {
      const gerador = d3Sankey<any, any>()
        .nodeWidth(13)
        .nodePadding(14)
        .extent([[1, 6], [Math.max(240, largura) - 1, altura - 6]]);
      return gerador({
        nodes: dados.nos.map(n => ({ ...n })),
        links,
      });
    } catch {
      // Ciclo no grafo: o Sankey não representa. Melhor não desenhar do que mentir.
      return null;
    }
  }, [dados, largura, altura]);

  if (!layout) {
    return <EstadoVazio titulo="Sem fluxo para exibir"
      descricao="Não há volume suficiente no recorte selecionado para desenhar o fluxo." />;
  }

  const cor = (i: number) => t.serie[i % t.serie.length];
  const maxValor = Math.max(...layout.links.map((l: any) => l.value));

  return (
    <div ref={refBox} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <svg width="100%" height={altura} viewBox={`0 0 ${Math.max(240, largura)} ${altura}`}
        role="img" aria-label={`Fluxo com ${layout.nodes.length} etapas e ${layout.links.length} ligações`}>
        <g>
          {layout.links.map((l: any, i: number) => {
            const ativo = !selecionado
              || (l.source as any).id === selecionado || (l.target as any).id === selecionado;
            return (
              <path
                key={i}
                d={sankeyLinkHorizontal()(l) ?? ''}
                fill="none"
                stroke={cor((l.source as any).index)}
                strokeOpacity={ativo ? .3 + (l.value / maxValor) * .28 : .06}
                strokeWidth={Math.max(1, l.width ?? 1)}
                style={{ transition: 'stroke-opacity .15s' }}
                onMouseMove={e => tt.mostrar(e, (
                  <>
                    <div style={{ fontWeight: 600 }}>
                      {(l.source as any).nome} → {(l.target as any).nome}
                    </div>
                    <div>{fmtValor(l.value, formato)}</div>
                    {l.meta?.quantidade !== undefined && (
                      <div style={{ color: 'var(--bl-texto-2)' }}>
                        {fmtValor(l.meta.quantidade, 'inteiro')} registro(s)
                      </div>
                    )}
                  </>
                ))}
                onMouseLeave={tt.esconder}
              />
            );
          })}
        </g>
        <g>
          {layout.nodes.map((n: any, i: number) => {
            const ativo = !selecionado || n.id === selecionado;
            const alt = Math.max(2, (n.y1 ?? 0) - (n.y0 ?? 0));
            const esquerda = (n.x0 ?? 0) < largura / 2;
            return (
              <g key={n.id} style={{ cursor: aoSelecionar ? 'pointer' : 'default' }}
                onClick={() => aoSelecionar?.(selecionado === n.id ? null : n.id)}
                onMouseMove={e => tt.mostrar(e, (
                  <>
                    <div style={{ fontWeight: 600 }}>{n.nome}</div>
                    <div>{fmtValor(n.value ?? 0, formato)}</div>
                    {aoSelecionar && <div style={{ color: 'var(--bl-texto-2)' }}>clique para filtrar</div>}
                  </>
                ))}
                onMouseLeave={tt.esconder}>
                <rect x={n.x0} y={n.y0} width={(n.x1 ?? 0) - (n.x0 ?? 0)} height={alt}
                  fill={cor(i)} opacity={ativo ? .92 : .25} rx={2} />
                <text
                  x={esquerda ? (n.x1 ?? 0) + 6 : (n.x0 ?? 0) - 6}
                  y={((n.y0 ?? 0) + (n.y1 ?? 0)) / 2}
                  dy="0.34em"
                  textAnchor={esquerda ? 'start' : 'end'}
                  fill={t.texto2} fontSize={10.5}
                  opacity={ativo ? 1 : .35}
                  style={{ pointerEvents: 'none' }}
                >
                  {n.nome}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {tt.elemento}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        {dados.nota && (
          <span style={{ fontSize: 11, color: 'var(--bl-texto-3)', flex: 1 }}>{dados.nota}</span>
        )}
        {selecionado && aoSelecionar && (
          <button type="button" className="bl-botao" onClick={() => aoSelecionar(null)}
            style={{ height: 24, fontSize: 11 }}>
            Limpar seleção
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Matriz de quadrantes (§24.3) ─────────────────────── */

export interface ItemMatriz {
  id: string; sku: string; produto: string;
  giro: number; margem_pct: number; valor: number; receita: number;
  quadrante: string;
}

export function MatrizQuadrantes({ itens, cortes, quadrantes, altura = 380, aoSelecionar, quadranteSelecionado }: {
  itens: ItemMatriz[];
  cortes: { giro: number; margem_pct: number; metodo: string };
  quadrantes: { id: string; rotulo: string; cor: string; acao: string; itens: number; valor_estoque: number }[];
  altura?: number;
  aoSelecionar?: (quadrante: string | null) => void;
  quadranteSelecionado?: string | null;
}) {
  const refBox = React.useRef<HTMLDivElement>(null);
  const largura = useLargura(refBox);
  const tt = useTooltip();
  const t = React.useMemo(() => tokens(refBox.current), [refBox.current]);

  if (!itens?.length) {
    return <EstadoVazio titulo="Sem itens para posicionar"
      descricao="Não há produtos com estoque e histórico no recorte atual." />;
  }

  const M = { top: 12, right: 14, bottom: 34, left: 46 };
  const L = Math.max(280, largura);
  const iw = L - M.left - M.right;
  const ih = altura - M.top - M.bottom;

  // Percentil 97 no eixo: um outlier de giro comprime todo o resto num canto.
  const ordGiro = [...itens].map(i => i.giro).sort((a, b) => a - b);
  const maxGiro = Math.max(cortes.giro * 2, ordGiro[Math.floor(ordGiro.length * 0.97)] ?? 1);
  const margens = itens.map(i => i.margem_pct);
  const minM = Math.min(0, ...margens);
  const maxM = Math.max(...margens, cortes.margem_pct * 1.4);

  const ex = scaleLinear().domain([0, maxGiro]).range([0, iw]).clamp(true);
  const ey = scaleLinear().domain([minM, maxM]).range([ih, 0]).clamp(true);

  const corQuadrante: Record<string, string> = {
    estrela: t.sucesso, volume: t.serie[1], nicho: t.aviso, revisar: t.erro,
  };

  const xCorte = ex(cortes.giro);
  const yCorte = ey(cortes.margem_pct);

  return (
    <div ref={refBox} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <svg width="100%" height={altura} viewBox={`0 0 ${L} ${altura}`} role="img"
        aria-label={`Matriz giro por margem com ${itens.length} produtos, dividida em quatro quadrantes pela mediana`}>
        <g transform={`translate(${M.left},${M.top})`}>
          {/* fundos dos quadrantes */}
          <rect x={xCorte} y={0} width={iw - xCorte} height={yCorte} fill={t.sucesso} opacity={.05} />
          <rect x={xCorte} y={yCorte} width={iw - xCorte} height={ih - yCorte} fill={t.serie[1]} opacity={.05} />
          <rect x={0} y={0} width={xCorte} height={yCorte} fill={t.aviso} opacity={.05} />
          <rect x={0} y={yCorte} width={xCorte} height={ih - yCorte} fill={t.erro} opacity={.05} />

          {/* linhas de corte */}
          <line x1={xCorte} y1={0} x2={xCorte} y2={ih} stroke={t.borda} strokeDasharray="4 3" />
          <line x1={0} y1={yCorte} x2={iw} y2={yCorte} stroke={t.borda} strokeDasharray="4 3" />

          {/* eixos */}
          <line x1={0} y1={ih} x2={iw} y2={ih} stroke={t.borda} />
          <line x1={0} y1={0} x2={0} y2={ih} stroke={t.borda} />
          {ey.ticks(5).map(v => (
            <g key={v}>
              <text x={-8} y={ey(v)} dy="0.32em" textAnchor="end" fill={t.texto3} fontSize={9.5}>
                {v.toFixed(0)}%
              </text>
            </g>
          ))}
          {ex.ticks(5).map(v => (
            <text key={v} x={ex(v)} y={ih + 14} textAnchor="middle" fill={t.texto3} fontSize={9.5}>
              {v.toFixed(1)}
            </text>
          ))}
          <text x={iw / 2} y={ih + 30} textAnchor="middle" fill={t.texto3} fontSize={10}>
            giro anual (mediana {cortes.giro.toFixed(2)})
          </text>
          <text transform={`rotate(-90)`} x={-ih / 2} y={-34} textAnchor="middle" fill={t.texto3} fontSize={10}>
            margem % (mediana {cortes.margem_pct.toFixed(1)})
          </text>

          {/* pontos */}
          {itens.map(i => {
            const ativo = !quadranteSelecionado || i.quadrante === quadranteSelecionado;
            return (
              <circle
                key={i.id}
                cx={ex(i.giro)} cy={ey(i.margem_pct)}
                r={Math.max(2.5, Math.min(9, Math.sqrt(Math.max(0, i.valor)) / 26))}
                fill={corQuadrante[i.quadrante] ?? t.neutro}
                opacity={ativo ? .62 : .08}
                stroke={corQuadrante[i.quadrante]} strokeOpacity={ativo ? .7 : .06} strokeWidth={.7}
                style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseMove={e => tt.mostrar(e, (
                  <>
                    <div style={{ fontWeight: 600 }}>{i.produto}</div>
                    <div style={{ color: 'var(--bl-texto-2)' }}>{i.sku}</div>
                    <div>giro: {i.giro.toFixed(2)} · margem: {i.margem_pct.toFixed(1)}%</div>
                    <div>estoque: {fmtValor(i.valor, 'moeda')}</div>
                  </>
                ))}
                onMouseLeave={tt.esconder}
              />
            );
          })}
        </g>
      </svg>
      {tt.elemento}

      {/* legenda dos quadrantes = também o controle de filtro */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(196px,1fr))', gap: 8, marginTop: 10 }}>
        {quadrantes.map(q => {
          const sel = quadranteSelecionado === q.id;
          return (
            <button
              key={q.id} type="button"
              onClick={() => aoSelecionar?.(sel ? null : q.id)}
              className="bl-cartao"
              style={{
                padding: '8px 10px', textAlign: 'left', font: 'inherit', color: 'inherit',
                cursor: aoSelecionar ? 'pointer' : 'default',
                borderLeft: `3px solid ${corQuadrante[q.id]}`,
                background: sel ? 'var(--bl-superficie-2)' : undefined,
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 2 }}>{q.rotulo}</div>
              <div style={{ fontSize: 11, color: 'var(--bl-texto-2)' }}>
                {q.itens} item(ns) · {fmtValor(q.valor_estoque, 'moeda')}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', marginTop: 3 }}>{q.acao}</div>
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', marginTop: 6 }}>
        Corte por <strong>{cortes.metodo}</strong> — com média, poucos itens de giro muito alto
        empurrariam quase todo o catálogo para o quadrante de baixo giro.
      </div>
    </div>
  );
}

/* ─────────────────────── Rede de relacionamento (§19) ─────────────────────── */

export interface DadosRede {
  nos: { id: string; rotulo: string; tipo: string; peso: number }[];
  arestas: { origem: string; destino: string; peso: number }[];
  nota?: string;
}

export function RedeD3({ dados, altura = 420 }: { dados: DadosRede; altura?: number }) {
  const refBox = React.useRef<HTMLDivElement>(null);
  const largura = useLargura(refBox);
  const tt = useTooltip();
  const t = React.useMemo(() => tokens(refBox.current), [refBox.current]);
  const [posicoes, setPosicoes] = React.useState<Record<string, { x: number; y: number }>>({});
  const [foco, setFoco] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!dados?.nos?.length) return;

    const nos = dados.nos.map(n => ({ ...n }));
    const idx = new Set(nos.map(n => n.id));
    const arestas = dados.arestas
      .filter(a => idx.has(a.origem) && idx.has(a.destino))
      .map(a => ({ source: a.origem, target: a.destino, peso: a.peso }));

    const L = Math.max(280, largura);
    const sim = forceSimulation(nos as any)
      .force('link', forceLink(arestas as any).id((d: any) => d.id).distance(78).strength(.12))
      .force('carga', forceManyBody().strength(-118))
      .force('centro', forceCenter(L / 2, altura / 2))
      .force('colisao', forceCollide().radius(20))
      .stop();

    // Roda a simulação de forma síncrona e desenha o resultado: animação de
    // força com 100+ nós custa caro e não acrescenta leitura nenhuma.
    for (let i = 0; i < 220; i++) sim.tick();

    const p: Record<string, { x: number; y: number }> = {};
    (nos as any[]).forEach(n => {
      p[n.id] = {
        x: Math.max(16, Math.min(L - 16, n.x)),
        y: Math.max(16, Math.min(altura - 16, n.y)),
      };
    });
    setPosicoes(p);
    sim.stop();
  }, [dados, largura, altura]);

  if (!dados?.nos?.length) {
    return <EstadoVazio titulo="Sem relações para exibir"
      descricao="Não há volume no recorte selecionado para montar o mapa." />;
  }

  const corTipo: Record<string, string> = {
    canal: t.serie[0], cliente: t.serie[1], categoria: t.serie[3],
  };
  const maxPeso = Math.max(1, ...dados.nos.map(n => n.peso));
  const vizinhos = React.useMemo(() => {
    const m: Record<string, Set<string>> = {};
    dados.arestas.forEach(a => {
      (m[a.origem] ??= new Set()).add(a.destino);
      (m[a.destino] ??= new Set()).add(a.origem);
    });
    return m;
  }, [dados]);

  const visivel = (id: string) => !foco || id === foco || vizinhos[foco]?.has(id);

  return (
    <div ref={refBox} style={{ position: 'relative', width: '100%', minWidth: 0 }}>
      <svg width="100%" height={altura} viewBox={`0 0 ${Math.max(280, largura)} ${altura}`} role="img"
        aria-label={`Mapa de relacionamento com ${dados.nos.length} entidades e ${dados.arestas.length} ligações`}>
        <g>
          {dados.arestas.map((a, i) => {
            const o = posicoes[a.origem]; const d = posicoes[a.destino];
            if (!o || !d) return null;
            const ativo = !foco || a.origem === foco || a.destino === foco;
            return (
              <line key={i} x1={o.x} y1={o.y} x2={d.x} y2={d.y}
                stroke={t.borda} strokeOpacity={ativo ? .5 : .07}
                strokeWidth={Math.max(.5, Math.min(3, a.peso / (maxPeso / 3)))} />
            );
          })}
        </g>
        <g>
          {dados.nos.map(n => {
            const p = posicoes[n.id];
            if (!p) return null;
            const r = 4 + (n.peso / maxPeso) * 13;
            const ativo = visivel(n.id);
            return (
              <g key={n.id} style={{ cursor: 'pointer' }}
                onClick={() => setFoco(foco === n.id ? null : n.id)}
                onMouseMove={e => tt.mostrar(e, (
                  <>
                    <div style={{ fontWeight: 600 }}>{n.rotulo}</div>
                    <div style={{ color: 'var(--bl-texto-2)' }}>{n.tipo}</div>
                    <div>{fmtValor(n.peso, 'moeda')}</div>
                  </>
                ))}
                onMouseLeave={tt.esconder}>
                <circle cx={p.x} cy={p.y} r={r}
                  fill={corTipo[n.tipo] ?? t.neutro}
                  opacity={ativo ? .82 : .1}
                  stroke={foco === n.id ? t.texto : 'none'} strokeWidth={1.6} />
                {(r > 9 || foco === n.id) && (
                  <text x={p.x} y={p.y - r - 4} textAnchor="middle" fill={t.texto2} fontSize={9.5}
                    opacity={ativo ? 1 : .12} style={{ pointerEvents: 'none' }}>
                    {n.rotulo.length > 20 ? `${n.rotulo.slice(0, 19)}…` : n.rotulo}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {tt.elemento}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {Object.entries(corTipo).map(([tipo, cor]) => (
          <span key={tipo} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--bl-texto-2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: cor }} />
            {tipo === 'canal' ? 'Canais' : tipo === 'cliente' ? 'Clientes' : 'Categorias'}
          </span>
        ))}
        <span style={{ flex: 1 }} />
        {dados.nota && <span style={{ fontSize: 11, color: 'var(--bl-texto-3)' }}>{dados.nota}</span>}
        {foco && (
          <button type="button" className="bl-botao" onClick={() => setFoco(null)} style={{ height: 24, fontSize: 11 }}>
            Limpar seleção
          </button>
        )}
      </div>
    </div>
  );
}
