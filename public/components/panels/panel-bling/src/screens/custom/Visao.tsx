// panel-bling/src/screens/custom/Visao.tsx — Visão Geral, Operacional, Diretoria, Indicadores
// @version 1.0.0  @created 2026-07-30

import React from 'react';
import {
  GradeKpis, Kpi, Secao, BarraFiltros, EstadoErro, BlocoCarregando,
  Badge, EstadoVazio, moeda, inteiro, porTipo, TipoFormato,
} from '@shared';
import { api, RespostaOverview, Ocorrencia, IndicadorSaude } from '../../services/api';
import { useCarga } from '../../app/estado';
import { PropsTela } from '../generic/TelaCatalogo';
import { SankeyD3, RedeD3 } from '../../viz/D3';
import { Grafico, tokens, opcaoLinhaTempo, opcaoFunil, opcaoBarras } from '../../viz/Echarts';
import { Icone } from '../../shell/Icone';
import { useSelecao, DESTINO_KPI, DESTINO_ATENCAO } from '../../app/selecao';

/* ═══════════════════════ Visão Geral (§14–§19) ═══════════════════════ */

export function VisaoGeral({ filtros, aoMudarFiltros, aoNavegar, larguraPainel }: PropsTela) {
  const [noSelecionado, setNoSelecionado] = React.useState<string | null>(null);
  const [acumulado, setAcumulado] = React.useState(false);
  const [intervalo, setIntervalo] = React.useState<{ de: string; ate: string } | null>(null);
  const selecao = useSelecao();

  // O brush recorta o período: o intervalo selecionado no gráfico vira o `de/ate`
  // da consulta, e TODA a tela reage — é o §17 encontrando o §54.
  const params = React.useMemo(() => ({
    periodo: filtros.periodo,
    ...(intervalo ? { de: intervalo.de, ate: intervalo.ate } : {}),
    ...selecao.comoParametros(),
  }), [filtros.periodo, intervalo, JSON.stringify(selecao.selecoes)]);

  const carga = useCarga<RespostaOverview>(s => api.overview(params, s), [JSON.stringify(params)]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);
  const rede = useCarga<any>(s => api.rede(params, s), [JSON.stringify(params)]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      quando={new Date().toLocaleString('pt-BR')} aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={9} rotulo="Carregando visão geral" />;

  const d = carga.dados;
  const duasColunas = larguraPainel >= 1180;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />

      {intervalo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 10px',
          padding: '7px 11px', fontSize: 12, borderRadius: 'var(--bl-raio-sm)',
          background: 'var(--bl-verde-suave)', border: '1px solid var(--bl-verde-borda)',
        }}>
          <span>
            Período recortado no gráfico: <strong>{intervalo.de}</strong> a <strong>{intervalo.ate}</strong>.
          </span>
          <button type="button" className="bl-botao" onClick={() => setIntervalo(null)}
            style={{ height: 24, fontSize: 11 }}>Voltar ao período completo</button>
        </div>
      )}

      <Secao titulo="Indicadores do período"
        descricao={`${d.periodo.de} a ${d.periodo.ate} — clique num indicador para abrir os registros já filtrados.`}>
        {/* Drill-down (§55): o KPI leva a tela E o recorte que o explica. Sem o
            recorte, clicar em "notas com erro: 5" abre uma lista de 85. */}
        <GradeKpis
          kpis={d.kpis as unknown as Kpi[]}
          aoAbrir={(id, drilldown) => aoNavegar(DESTINO_KPI[id] ?? drilldown ?? id)}
        />
      </Secao>

      <Secao titulo="Saúde operacional">
        <LinhaSaude itens={d.saude} />
      </Secao>

      {d.atencao.length > 0 && (
        <Secao titulo="Exige atenção"
          descricao="Ordenado por severidade e volume. Cada item abre a tela onde a ação acontece.">
          <PainelAtencao itens={d.atencao}
            aoNavegar={id => aoNavegar(DESTINO_ATENCAO[id] ?? id)} />
        </Secao>
      )}

      <Secao
        titulo="Evolução consolidada"
        descricao="Arraste sobre o gráfico para recortar o período."
        acoes={
          <button type="button" className="bl-botao" onClick={() => setAcumulado(v => !v)}
            aria-pressed={acumulado} style={{ height: 24, fontSize: 11 }}>
            {acumulado ? 'Ver por dia' : 'Ver acumulado'}
          </button>
        }
      >
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          <Grafico
            altura={280}
            categorias={d.evolucao.series[0]?.pontos.map(p => p.data) ?? []}
            aoSelecionarIntervalo={setIntervalo}
            opcao={opcaoLinhaTempo(
              t,
              d.evolucao.series.filter(s => ['faturamento', 'pedidos', 'margem'].includes(s.id)),
              acumulado ? undefined : d.evolucao.media_movel?.faturamento,
              { acumulado },
            )}
            descricao={acumulado
              ? 'Faturamento, pedidos e margem acumulados ao longo do período.'
              : 'Faturamento, número de pedidos e margem por dia, com média móvel de 7 dias.'}
          />
        </div>
      </Secao>

      <div style={{
        display: 'grid',
        gridTemplateColumns: duasColunas ? '1.15fr 1fr' : '1fr',
        gap: 14, marginTop: 18, minWidth: 0,
      }}>
        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Fluxo empresarial</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            <SankeyD3
              dados={d.fluxo}
              altura={300}
              selecionado={noSelecionado}
              aoSelecionar={id => {
                setNoSelecionado(id);
                // Nó de canal vira recorte GLOBAL (§54: "selecionar um nó do
                // Sankey filtra o grid"). Nó de etapa é só destaque visual —
                // "Faturamento" não é um valor de filtro que a API entenda.
                const canal = id ? (d.fluxo.nos.find(n => n.id === id && n.tipo === 'canal')) : null;
                if (canal) {
                  selecao.alternar({ campo: 'canal', valor: canal.nome,
                                     rotulo: canal.nome, origem: 'Visão Geral' });
                }
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--bl-texto-3)', margin: '8px 0 0' }}>
              Do canal ao recebimento. A espessura é o valor; a queda entre etapas é a perda.
              Clicar num canal recorta todas as telas.
            </p>
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Mapa de relacionamento</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            {rede.dados
              ? <RedeD3 dados={rede.dados} altura={300} />
              : <BlocoCarregando linhas={4} />}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Linha de saúde (§15) ─────────────────────────────────── */

function LinhaSaude({ itens }: { itens: IndicadorSaude[] }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 8,
    }}>
      {itens.map(i => (
        <div key={i.id} className="bl-cartao" title={i.detalhe}
          style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span aria-hidden style={{
            width: 7, height: 7, borderRadius: 999, flex: '0 0 auto',
            background: i.cor === 'sucesso' ? 'var(--bl-sucesso)'
              : i.cor === 'aviso' ? 'var(--bl-aviso)'
              : i.cor === 'erro' ? 'var(--bl-erro)' : 'var(--bl-neutro)',
          }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 11.5, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{i.rotulo}</div>
            <div style={{
              fontSize: 10.5, color: 'var(--bl-texto-3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{i.detalhe}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Painel "Exige atenção" (§16) ─────────────────────────── */

function PainelAtencao({ itens, aoNavegar }: { itens: Ocorrencia[]; aoNavegar: (idOcorrencia: string) => void }) {
  const cor = (s: string) =>
    s === 'critica' ? 'var(--bl-erro)' : s === 'alta' ? 'var(--bl-aviso)'
    : s === 'media' ? 'var(--bl-info)' : 'var(--bl-neutro)';

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {itens.map(o => (
        <div key={o.id} className="bl-cartao" style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          padding: '9px 12px', borderLeft: `3px solid ${cor(o.severidade)}`, minWidth: 0,
        }}>
          <Badge info={{
            chave: o.severidade,
            rotulo: o.severidade.charAt(0).toUpperCase() + o.severidade.slice(1),
            cor: o.severidade === 'critica' ? 'erro' : o.severidade === 'alta' ? 'aviso'
              : o.severidade === 'media' ? 'info' : 'neutro',
          }} />
          <span style={{ fontSize: 11, color: 'var(--bl-texto-3)', minWidth: 74 }}>{o.modulo}</span>
          <span style={{ flex: 1, fontSize: 12.5, minWidth: 190 }}>{o.descricao}</span>
          <span style={{ fontSize: 13, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
            {inteiro(o.quantidade)}
          </span>
          {o.valor_impactado !== null && o.valor_impactado > 0 && (
            <span style={{ fontSize: 12, color: 'var(--bl-texto-2)', fontVariantNumeric: 'tabular-nums' }}>
              {moeda(o.valor_impactado, true)}
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--bl-texto-3)', flex: '1 1 190px', minWidth: 150 }}>
            {o.acao_recomendada}
          </span>
          <button type="button" className="bl-botao" onClick={() => aoNavegar(o.id)}>
            Abrir
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════ Central Operacional ═══════════════════════ */

export function CentralOperacional({ filtros, aoMudarFiltros, aoNavegar }: PropsTela) {
  const params = React.useMemo(() => ({ periodo: filtros.periodo }), [filtros.periodo]);
  const carga = useCarga<any>(s => api.operacional(params, s), [JSON.stringify(params)]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={8} rotulo="Carregando filas de trabalho" />;

  const filas: any[] = carga.dados.filas ?? [];
  const totalPendente = filas.reduce((s, f) => s + f.quantidade, 0);

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />

      <div style={{
        margin: '4px 0 14px', padding: '10px 13px', borderRadius: 'var(--bl-raio)',
        background: 'var(--bl-superficie)', border: '1px solid var(--bl-borda)',
        fontSize: 12.5,
      }}>
        <strong>{inteiro(totalPendente)}</strong> item(ns) aguardando ação em {filas.filter(f => f.quantidade > 0).length} fila(s).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 12 }}>
        {filas.map(f => (
          <div key={f.id} className="bl-cartao" style={{ padding: 0, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderBottom: '1px solid var(--bl-borda)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{f.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--bl-texto-3)' }}>{f.area} · {f.acao}</div>
              </div>
              <span style={{
                fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                color: f.quantidade > 0 ? 'var(--bl-texto)' : 'var(--bl-texto-3)',
              }}>
                {inteiro(f.quantidade)}
              </span>
            </div>

            {f.quantidade === 0 ? (
              <div style={{ padding: '18px 12px', textAlign: 'center', fontSize: 12, color: 'var(--bl-texto-3)' }}>
                Nada pendente nesta fila.
              </div>
            ) : (
              <>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 250, overflowY: 'auto' }}>
                  {f.itens.map((i: any, k: number) => (
                    <li key={i.id ?? k} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px', fontSize: 12,
                      borderBottom: '1px solid var(--bl-borda)',
                    }}>
                      <span style={{ fontWeight: 600, minWidth: 54 }}>
                        {i.numero ?? i.titulo ?? '—'}
                      </span>
                      <span style={{
                        flex: 1, minWidth: 0, color: 'var(--bl-texto-2)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {i.cliente ?? i.erro ?? '—'}
                      </span>
                      {i.valor !== undefined && (
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{moeda(i.valor, true)}</span>
                      )}
                      {i.saldo !== undefined && (
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{moeda(i.saldo, true)}</span>
                      )}
                      {(i.dias_parado ?? i.atraso_dias) !== undefined && (
                        <span style={{
                          fontSize: 11, color: (i.dias_parado ?? i.atraso_dias) > 7 ? 'var(--bl-erro)' : 'var(--bl-texto-3)',
                          minWidth: 44, textAlign: 'right',
                        }}>
                          {i.dias_parado ?? i.atraso_dias}d
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {f.truncado && (
                  <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--bl-texto-3)' }}>
                    Exibindo os 20 mais antigos de {inteiro(f.quantidade)}.
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ Diretoria ═══════════════════════ */

export function Diretoria({ filtros, aoMudarFiltros, aoNavegar, larguraPainel }: PropsTela) {
  const params = React.useMemo(() => ({ periodo: filtros.periodo }), [filtros.periodo]);
  const carga = useCarga<any>(s => api.diretoria(params, s), [JSON.stringify(params)]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={7} rotulo="Carregando visão de diretoria" />;

  const d = carga.dados;
  const duas = larguraPainel >= 1100;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />

      <Secao titulo="Resultado do período">
        <GradeKpis kpis={d.kpis}
          aoAbrir={(id, drilldown) => aoNavegar(DESTINO_KPI[id] ?? drilldown ?? id)}
          colunasMin={200} />
      </Secao>

      <Secao titulo="Evolução">
        <div className="bl-cartao" style={{ padding: '12px 14px' }}>
          <Grafico altura={250}
            opcao={opcaoLinhaTempo(t, d.evolucao.series.filter((s: any) =>
              ['faturamento', 'margem'].includes(s.id)), d.evolucao.media_movel?.faturamento)}
            descricao="Faturamento e margem ao longo do período." />
        </div>
      </Secao>

      <div style={{ display: 'grid', gridTemplateColumns: duas ? '1fr 1fr' : '1fr', gap: 14, marginTop: 18 }}>
        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Concentração por canal</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px' }}>
            <Grafico altura={230}
              opcao={opcaoBarras(t, (d.canais?.itens ?? []).slice(0, 10)
                .map((i: any) => ({ rotulo: i.rotulo, valor: i.valor })), 'moeda')}
              descricao="Faturamento por canal de venda." />
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Funil fiscal</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px' }}>
            <Grafico altura={230} opcao={opcaoFunil(t, d.funil ?? [])}
              descricao="Do pedido aprovado à nota enviada, com a perda em cada etapa." />
          </div>
        </section>
      </div>

      {d.insights?.length > 0 && (
        <Secao titulo="Pontos de atenção"
          descricao="Detectados por regra sobre os dados do período.">
          <div style={{ display: 'grid', gap: 6 }}>
            {d.insights.slice(0, 6).map((i: any) => (
              <div key={i.id} className="bl-cartao" style={{
                padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap',
              }}>
                <Badge info={{
                  chave: i.severidade, rotulo: i.severidade === 'critica' ? 'Crítico' : i.severidade === 'alta' ? 'Alto' : 'Médio',
                  cor: i.severidade === 'critica' ? 'erro' : i.severidade === 'alta' ? 'aviso' : 'info',
                }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{i.titulo}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--bl-texto-2)', marginTop: 2 }}>{i.evidencia}</div>
                </div>
                <button type="button" className="bl-botao" onClick={() => aoNavegar(i.tela)}>Analisar</button>
              </div>
            ))}
          </div>
        </Secao>
      )}
    </div>
  );
}

/* ═══════════════════════ Indicadores ═══════════════════════ */

export function Indicadores({ filtros, aoMudarFiltros, aoNavegar }: PropsTela) {
  const params = React.useMemo(() => ({ periodo: filtros.periodo }), [filtros.periodo]);
  const carga = useCarga<{ kpis: any[] }>(s => api.indicadores(params, s), [JSON.stringify(params)]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={8} rotulo="Carregando indicadores" />;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />

      <Secao titulo="Todos os indicadores"
        descricao="Cada indicador vem acompanhado da regra usada para calculá-lo.">
        <div className="bl-cartao bl-rola-x">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
            <thead>
              <tr>
                {['Indicador', 'Valor', 'Variação', 'Como é calculado', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 12px', fontSize: 11, fontWeight: 600, textAlign: i === 1 || i === 2 ? 'right' : 'left',
                    color: 'var(--bl-texto-2)', borderBottom: '1px solid var(--bl-borda)',
                    background: 'var(--bl-bg-elevado)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {carga.dados.kpis.map((k, i) => (
                <tr key={k.id} style={{ background: i % 2 ? 'var(--bl-superficie-2)' : undefined }}>
                  <td style={{ padding: '8px 12px', fontSize: 12.5, borderBottom: '1px solid var(--bl-borda)' }}>
                    {k.rotulo}
                  </td>
                  <td style={{
                    padding: '8px 12px', fontSize: 12.5, fontWeight: 650, textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid var(--bl-borda)',
                  }}>
                    {porTipo(k.valor, k.formato as TipoFormato, true)}
                  </td>
                  <td style={{
                    padding: '8px 12px', fontSize: 12, textAlign: 'right',
                    borderBottom: '1px solid var(--bl-borda)',
                    color: k.variacao === null ? 'var(--bl-texto-3)'
                      : k.variacao > 0 ? 'var(--bl-sucesso)' : k.variacao < 0 ? 'var(--bl-erro)' : 'var(--bl-texto-3)',
                  }}>
                    {k.variacao === null ? '—' : `${k.variacao > 0 ? '+' : ''}${k.variacao.toFixed(1).replace('.', ',')}%`}
                  </td>
                  <td style={{
                    padding: '8px 12px', fontSize: 11.5, color: 'var(--bl-texto-2)',
                    borderBottom: '1px solid var(--bl-borda)',
                  }}>
                    {k.definicao}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--bl-borda)' }}>
                    {k.drilldown && (
                      <button type="button" className="bl-botao" style={{ height: 24, fontSize: 11 }}
                        onClick={() => aoNavegar(DESTINO_KPI[k.id] ?? k.drilldown)}>Abrir</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>
    </div>
  );
}
