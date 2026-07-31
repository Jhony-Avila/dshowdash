// panel-bling/src/screens/custom/Logistica.tsx — Transportadoras (§39)
// @version 1.0.0  @created 2026-07-30
//
// Fase 3. A tela de catálogo mostrava a tabela; o §39 pede a LEITURA:
// prazo prometido × realizado, custo por região e distribuição do prazo.

import React from 'react';
import {
  DataGrid, EstadoGrid, ColunaGrid, GradeKpis, Kpi, Secao, BarraFiltros,
  EstadoErro, BlocoCarregando, moeda, inteiro, numero, percentual,
} from '@shared';
import { api, RespostaRecurso } from '../../services/api';
import { useCarga } from '../../app/estado';
import { PropsTela } from '../generic/TelaCatalogo';
import { useSelecao } from '../../app/selecao';
import {
  Grafico, tokens, opcaoPrometidoRealizado, opcaoDistribuicao, opcaoBarras,
} from '../../viz/Echarts';

const GRID_INICIAL: EstadoGrid = { ordenar: '', direcao: 'desc', pagina: 1, limite: 50, busca: '' };

function kpi(id: string, rotulo: string, valor: number, formato: string,
  semantica: 'ok' | 'atencao' | 'critico' = 'ok', tooltip: string | null = null): Kpi {
  return {
    id, rotulo, valor, formato: formato as any, variacao: null, tendencia: 'estavel',
    sparkline: null, drilldown: null, semantica, tooltip,
  };
}

export function Transportadoras({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [grid, setGrid] = React.useState(GRID_INICIAL);
  const selecao = useSelecao();

  const params = React.useMemo(() => ({
    periodo: filtros.periodo, ordenar: grid.ordenar, direcao: grid.direcao,
    pagina: grid.pagina, limite: grid.limite, q: grid.busca,
  }), [filtros.periodo, grid]);

  const carga = useCarga<RespostaRecurso>(s => api.recurso('carriers', params, s), [JSON.stringify(params)]);
  const analise = useCarga<any>(s => api.analiseLogistica({ periodo: filtros.periodo }, s), [filtros.periodo]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }

  const r = analise.dados?.resumo ?? {};
  const transportadoras: any[] = analise.dados?.transportadoras ?? [];
  const ufs: any[] = analise.dados?.ufs ?? [];
  const duas = larguraPainel >= 1080;

  // Quem mais desvia do prometido — a leitura que decide renegociação.
  const piorDesvio = [...transportadoras]
    .filter(x => x.desvio !== null)
    .sort((a, b) => (b.desvio ?? 0) - (a.desvio ?? 0))[0];

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => { aoMudarFiltros({ periodo: '30d' }); selecao.limpar(); }} />

      <GradeKpis kpis={[
        kpi('envios', 'Envios', r.envios ?? 0, 'inteiro'),
        kpi('entregues', 'Entregues', r.entregues ?? 0, 'inteiro'),
        kpi('atrasados', 'Atrasados', r.atrasados ?? 0, 'inteiro',
          (r.atrasados ?? 0) > 0 ? 'atencao' : 'ok'),
        kpi('custo', 'Custo de frete', r.custo ?? 0, 'moeda'),
        kpi('desvio', 'Maior desvio de prazo', piorDesvio?.desvio ?? 0, 'numero',
          (piorDesvio?.desvio ?? 0) > 2 ? 'critico' : (piorDesvio?.desvio ?? 0) > 0 ? 'atencao' : 'ok',
          piorDesvio ? `${piorDesvio.transportadora}: ${piorDesvio.realizado} dias contra ${piorDesvio.prometido} prometidos.` : null),
      ]} />

      <Secao titulo="Prazo prometido × realizado"
        descricao="A diferença entre as duas barras é o que a transportadora deve explicar.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          {analise.dados ? (
            transportadoras.some(x => x.realizado !== null) ? (
              <Grafico altura={larguraPainel < 980 ? 230 : 270}
                opcao={opcaoPrometidoRealizado(t, transportadoras)}
                descricao="Comparação entre o prazo prometido e o realizado por transportadora." />
            ) : (
              <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 12.5, color: 'var(--bl-texto-2)' }}>
                Nenhuma entrega concluída no período — sem entrega, não há prazo realizado a comparar.
              </div>
            )
          ) : <BlocoCarregando linhas={4} />}
        </div>
      </Secao>

      <div style={{ display: 'grid', gridTemplateColumns: duas ? '1fr 1fr' : '1fr', gap: 14, marginTop: 18 }}>
        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Distribuição do prazo de entrega</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            {analise.dados ? (
              <>
                <Grafico altura={220}
                  opcao={opcaoDistribuicao(t, analise.dados.distribuicao)}
                  descricao="Quantidade de envios por faixa de prazo de entrega." />
                <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '6px 0 0' }}>
                  Cauda longa à direita significa entrega imprevisível — o problema não é a
                  média, é a variação.
                </p>
              </>
            ) : <BlocoCarregando linhas={4} />}
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Custo por região</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            {analise.dados ? (
              <Grafico altura={Math.max(200, Math.min(300, ufs.length * 24 + 40))}
                opcao={opcaoBarras(t, ufs.slice(0, 12).map(u => ({
                  rotulo: u.uf, valor: u.custo,
                })), 'moeda')}
                aoClicar={(p: any) => selecao.alternar({
                  campo: 'uf', valor: String(p.name), rotulo: String(p.name), origem: 'Transportadoras',
                })}
                descricao="Custo total de frete por unidade federativa de destino." />
            ) : <BlocoCarregando linhas={4} />}
          </div>
        </section>
      </div>

      {ufs.length > 0 && (
        <Secao titulo="Desempenho por região">
          <div className="bl-cartao bl-rola-x">
            <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['UF', 'Envios', 'Entregues', 'Prazo médio', 'Atrasados',
                    'Atraso %', 'Custo total', 'Custo médio'].map((h, i) => (
                    <th key={h} style={{
                      padding: '8px 10px', fontSize: 10.5, fontWeight: 600,
                      textAlign: i === 0 ? 'left' : 'right',
                      color: 'var(--bl-texto-2)', background: 'var(--bl-bg-elevado)',
                      borderBottom: '1px solid var(--bl-borda)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ufs.map((u, i) => (
                  <tr key={u.uf} style={{ background: i % 2 ? 'var(--bl-superficie-2)' : undefined }}>
                    <td style={td('esquerda')}>{u.uf}</td>
                    <td style={td()}>{inteiro(u.envios)}</td>
                    <td style={td()}>{inteiro(u.entregues)}</td>
                    <td style={td()}>{u.prazo_medio === null ? '—' : `${numero(u.prazo_medio)} d`}</td>
                    <td style={td()}>{inteiro(u.atrasados)}</td>
                    <td style={{ ...td(), color: u.atraso_pct > 15 ? 'var(--bl-erro)' : undefined }}>
                      {percentual(u.atraso_pct)}
                    </td>
                    <td style={td()}>{moeda(u.custo, true)}</td>
                    <td style={td()}>{moeda(u.custo_medio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      <Secao titulo="Transportadoras">
        <DataGrid
          colunas={(carga.dados?.colunas ?? []) as ColunaGrid[]}
          linhas={carga.dados?.itens ?? []}
          total={carga.meta?.total ?? 0}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          carregando={carga.carregando}
          totais={carga.dados?.totais}
          chavePreferencias="transportadoras"
          alturaMax={360}
        />
      </Secao>
    </div>
  );
}

function td(alinhamento: 'esquerda' | 'direita' = 'direita'): React.CSSProperties {
  return {
    padding: '6px 10px', fontSize: 12,
    textAlign: alinhamento === 'direita' ? 'right' : 'left',
    borderBottom: '1px solid var(--bl-borda)',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  };
}
