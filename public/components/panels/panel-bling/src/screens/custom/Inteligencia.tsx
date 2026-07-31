// panel-bling/src/screens/custom/Inteligencia.tsx — Rentabilidade, ABC, Previsões, Anomalias, Relatórios
// @version 1.0.0  @created 2026-07-30

import React from 'react';
import {
  DataGrid, EstadoGrid, ColunaGrid, GradeKpis, Kpi, Secao, BarraFiltros,
  EstadoErro, BlocoCarregando, Badge, EstadoVazio, moeda, percentual, inteiro,
} from '@shared';
import { api, Insight } from '../../services/api';
import { useCarga } from '../../app/estado';
import { PropsTela } from '../generic/TelaCatalogo';
import { Grafico, tokens, opcaoWaterfall, opcaoPareto, opcaoBarras } from '../../viz/Echarts';
import { MatrizQuadrantes } from '../../viz/D3';
import { useSelecao } from '../../app/selecao';

const GRID_INICIAL: EstadoGrid = { ordenar: '', direcao: 'desc', pagina: 1, limite: 50, busca: '' };

function kpi(id: string, rotulo: string, valor: number, formato: string,
  semantica: 'ok' | 'atencao' | 'critico' = 'ok', tooltip: string | null = null): Kpi {
  return {
    id, rotulo, valor, formato: formato as any, variacao: null, tendencia: 'estavel',
    sparkline: null, drilldown: null, semantica, tooltip,
  };
}

/* ═══════════════════════ Rentabilidade (§40) ═══════════════════════ */

const DIMENSOES_RENT = [
  { id: 'canal', rotulo: 'Canal' }, { id: 'produto', rotulo: 'Produto' },
  { id: 'sku', rotulo: 'SKU' }, { id: 'cliente', rotulo: 'Cliente' },
  { id: 'vendedor', rotulo: 'Vendedor' }, { id: 'categoria', rotulo: 'Categoria' },
  { id: 'periodo', rotulo: 'Período' }, { id: 'pedido', rotulo: 'Pedido' },
];

export function Rentabilidade({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [dimensao, setDimensao] = React.useState('canal');
  const [grid, setGrid] = React.useState(GRID_INICIAL);

  const [quadrante, setQuadrante] = React.useState<string | null>(null);
  const params = React.useMemo(() => ({ periodo: filtros.periodo, dimensao }), [filtros.periodo, dimensao]);
  const carga = useCarga<any>(s => api.rentabilidade(params, s), [JSON.stringify(params)]);
  // A matriz aceita menos dimensões que o waterfall (pedido individual não
  // produz leitura de quadrante), então cai em 'produto' quando não bate.
  const dimMatriz = ['produto', 'cliente', 'canal', 'categoria', 'vendedor'].includes(dimensao)
    ? dimensao : 'produto';
  const matriz = useCarga<any>(
    s => api.margemVolume({ periodo: filtros.periodo, dimensao: dimMatriz }, s),
    [filtros.periodo, dimMatriz]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  const itens: any[] = carga.dados?.itens ?? [];
  const wf: any[] = carga.dados?.waterfall ?? [];
  const prejuizo: any[] = carga.dados?.prejuizo ?? [];

  const soma = (c: string) => itens.reduce((s, i) => s + (Number(i[c]) || 0), 0);
  const receita = soma('receita');
  const lucro = soma('lucro');

  const colunas: ColunaGrid[] = [
    { id: 'rotulo', rotulo: DIMENSOES_RENT.find(d => d.id === dimensao)?.rotulo ?? 'Item', tipo: 'texto', largura: 250 },
    { id: 'receita', rotulo: 'Receita', tipo: 'moeda', alinhamento: 'direita', destaque: true },
    { id: 'desconto', rotulo: 'Desconto', tipo: 'moeda', alinhamento: 'direita' },
    { id: 'custo', rotulo: 'Custo', tipo: 'moeda', alinhamento: 'direita' },
    { id: 'comissao', rotulo: 'Comissão', tipo: 'moeda', alinhamento: 'direita' },
    { id: 'taxas', rotulo: 'Taxas', tipo: 'moeda', alinhamento: 'direita' },
    { id: 'impostos', rotulo: 'Impostos (est.)', tipo: 'moeda', alinhamento: 'direita' },
    { id: 'frete', rotulo: 'Frete', tipo: 'moeda', alinhamento: 'direita' },
    { id: 'lucro', rotulo: 'Lucro', tipo: 'moeda', alinhamento: 'direita', semaforo: true, destaque: true },
    { id: 'margem_pct', rotulo: 'Margem', tipo: 'percentual', alinhamento: 'direita' },
    { id: 'unidades', rotulo: 'Unidades', tipo: 'inteiro', alinhamento: 'direita' },
  ];

  const ordenadas = React.useMemo(() => {
    const arr = [...itens];
    if (grid.ordenar) {
      arr.sort((a, b) => {
        const va = a[grid.ordenar]; const vb = b[grid.ordenar];
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb : String(va).localeCompare(String(vb));
        return grid.direcao === 'asc' ? cmp : -cmp;
      });
    }
    const q = grid.busca.trim().toLowerCase();
    return q ? arr.filter(i => String(i.rotulo).toLowerCase().includes(q)) : arr;
  }, [itens, grid.ordenar, grid.direcao, grid.busca]);

  const pagina = ordenadas.slice((grid.pagina - 1) * grid.limite, grid.pagina * grid.limite);

  // ⚠️ Os returns condicionais vêm DEPOIS de todos os hooks — ver nota em
  // FiscalFinanceiro.tsx (React error #310).
  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={8} rotulo="Calculando rentabilidade" />;

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
          aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--bl-texto-2)' }}>
          Analisar por
          <select value={dimensao} onChange={e => { setDimensao(e.target.value); setGrid(GRID_INICIAL); }}
            style={{
              height: 28, padding: '0 8px', font: 'inherit', fontSize: 12,
              color: 'var(--bl-texto)', background: 'var(--bl-superficie-2)',
              border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
            }}>
            {DIMENSOES_RENT.map(d => <option key={d.id} value={d.id}>{d.rotulo}</option>)}
          </select>
        </label>
      </div>

      <GradeKpis kpis={[
        kpi('receita', 'Receita líquida', receita, 'moeda'),
        kpi('custo', 'Custo', soma('custo'), 'moeda'),
        kpi('deducoes', 'Deduções', soma('comissao') + soma('taxas') + soma('impostos') + soma('frete'), 'moeda',
          'ok', 'Comissões, taxas, impostos estimados e frete.'),
        kpi('lucro', 'Lucro', lucro, 'moeda', lucro < 0 ? 'critico' : 'ok'),
        kpi('margem', 'Margem', receita > 0 ? (lucro / receita) * 100 : 0, 'percentual',
          lucro < 0 ? 'critico' : 'ok'),
        kpi('prejuizo', 'Itens com prejuízo', prejuizo.length, 'inteiro',
          prejuizo.length > 0 ? 'atencao' : 'ok'),
      ]} />

      <Secao titulo="Da receita ao lucro"
        descricao="Cada barra vermelha é uma dedução. O que sobra é a margem.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          <Grafico altura={larguraPainel < 980 ? 250 : 290} opcao={opcaoWaterfall(t, wf)}
            descricao="Waterfall da receita bruta até o lucro, passando por descontos, custo, comissões, taxas, impostos e frete." />
          <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '8px 0 0' }}>
            {carga.dados.nota}
          </p>
        </div>
      </Secao>

      <Secao titulo="Matriz margem × volume"
        descricao="Onde está o resultado e onde está o esforço sem retorno. Corte pela mediana.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          {matriz.dados ? (
            <MatrizQuadrantes
              itens={(quadrante
                ? matriz.dados.itens.filter((i: any) => i.quadrante === quadrante)
                : matriz.dados.itens
              ).map((i: any) => ({
                id: i.id, sku: i.rotulo, produto: i.rotulo,
                // A matriz é genérica: eixo X = giro, eixo Y = margem. Aqui o
                // eixo X passa a ser RECEITA — o componente é o mesmo, os
                // rótulos vêm dos cortes.
                giro: i.receita, margem_pct: i.margem_pct,
                valor: Math.abs(i.receita), receita: i.receita,
                quadrante: mapaQuadrante(i.quadrante),
              }))}
              cortes={{ giro: matriz.dados.cortes.receita,
                        margem_pct: matriz.dados.cortes.margem_pct,
                        metodo: matriz.dados.cortes.metodo }}
              quadrantes={matriz.dados.quadrantes.map((q: any) => ({
                ...q, id: mapaQuadrante(q.id), valor_estoque: q.receita,
              }))}
              altura={larguraPainel < 980 ? 320 : 380}
              aoSelecionar={q => setQuadrante(q === null ? null : mapaReverso(q))}
              quadranteSelecionado={quadrante ? mapaQuadrante(quadrante) : null}
            />
          ) : <BlocoCarregando linhas={5} />}
        </div>
      </Secao>

      {prejuizo.length > 0 && (
        <Secao titulo="Itens com prejuízo"
          descricao="Onde a venda custa mais do que traz. Prioridade de revisão de preço ou custo.">
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            <Grafico altura={Math.max(160, Math.min(300, prejuizo.length * 26 + 40))}
              opcao={opcaoBarras(t, prejuizo.slice(0, 12).map((p: any) =>
                ({ rotulo: p.rotulo, valor: p.lucro })), 'moeda')}
              descricao={`${prejuizo.length} itens com resultado negativo.`} />
          </div>
        </Secao>
      )}

      <Secao titulo="Detalhamento">
        <DataGrid
          colunas={colunas}
          linhas={pagina}
          total={ordenadas.length}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          chaveLinha={l => String(l.id)}
          chavePreferencias={`rentabilidade-${dimensao}`}
          totais={{
            receita: soma('receita'), desconto: soma('desconto'), custo: soma('custo'),
            comissao: soma('comissao'), taxas: soma('taxas'), impostos: soma('impostos'),
            frete: soma('frete'), lucro: soma('lucro'), unidades: soma('unidades'),
          }}
          alturaMax={larguraPainel < 980 ? 400 : 500}
        />
      </Secao>
    </div>
  );
}

/**
 * A matriz D3 foi escrita para giro × margem e usa quatro ids fixos.
 * Aqui a leitura é volume × margem, com nomes próprios. O mapa traduz nos dois
 * sentidos em vez de duplicar o componente — a geometria é a mesma.
 */
const QUADRANTES_RENT: Record<string, string> = {
  motor: 'estrela', giro: 'volume', joia: 'nicho', peso: 'revisar',
};
const mapaQuadrante = (q: string) => QUADRANTES_RENT[q] ?? q;
const mapaReverso = (q: string) =>
  Object.keys(QUADRANTES_RENT).find(k => QUADRANTES_RENT[k] === q) ?? q;

/* ═══════════════════════ Curva ABC (§41) ═══════════════════════ */

export function CurvaAbc({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [dimensao, setDimensao] = React.useState('produtos');
  const [metrica, setMetrica] = React.useState('faturamento');
  const [grid, setGrid] = React.useState(GRID_INICIAL);
  const [classe, setClasse] = React.useState<string | null>(null);

  const params = React.useMemo(() => ({ periodo: filtros.periodo, dimensao, metrica }),
    [filtros.periodo, dimensao, metrica]);
  const carga = useCarga<any>(s => api.abc(params, s), [JSON.stringify(params)]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={8} rotulo="Calculando curva ABC" />;

  const itens: any[] = carga.dados.itens ?? [];
  const classes: any[] = carga.dados.classes ?? [];
  const formato = metrica === 'unidades' || metrica === 'frequencia' ? 'inteiro' : 'moeda';

  const filtrados = classe ? itens.filter(i => i.classe === classe) : itens;
  const q = grid.busca.trim().toLowerCase();
  const buscados = q ? filtrados.filter(i => String(i.rotulo).toLowerCase().includes(q)) : filtrados;
  const pagina = buscados.slice((grid.pagina - 1) * grid.limite, grid.pagina * grid.limite);

  const colunas: ColunaGrid[] = [
    { id: 'classe', rotulo: 'Classe', tipo: 'badge', largura: 80 },
    { id: 'rotulo', rotulo: 'Item', tipo: 'texto', largura: 280 },
    { id: 'valor', rotulo: metrica === 'unidades' ? 'Unidades' : 'Valor',
      tipo: formato as any, alinhamento: 'direita', destaque: true },
    { id: 'participacao', rotulo: 'Participação', tipo: 'percentual', alinhamento: 'direita' },
    { id: 'acumulado_pct', rotulo: 'Acumulado', tipo: 'percentual', alinhamento: 'direita' },
  ];

  const linhasComBadge = pagina.map(i => ({
    ...i,
    classe_info: {
      chave: i.classe, rotulo: `Classe ${i.classe}`,
      cor: i.classe === 'A' ? 'sucesso' : i.classe === 'B' ? 'aviso' : 'neutro',
    },
  }));

  const sel = (id: string) => ({
    height: 28, padding: '0 8px', font: 'inherit', fontSize: 12,
    color: 'var(--bl-texto)', background: 'var(--bl-superficie-2)',
    border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
  } as React.CSSProperties);

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
          aoLimpar={() => { aoMudarFiltros({ periodo: '30d' }); setClasse(null); }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--bl-texto-2)' }}>
          Dimensão
          <select value={dimensao} onChange={e => { setDimensao(e.target.value); setGrid(GRID_INICIAL); }} style={sel('d')}>
            {(carga.dados.dimensoes_disponiveis ?? []).map((d: string) =>
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--bl-texto-2)' }}>
          Métrica
          <select value={metrica} onChange={e => { setMetrica(e.target.value); setGrid(GRID_INICIAL); }} style={sel('m')}>
            {(carga.dados.metricas_disponiveis ?? []).map((m: string) =>
              <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>
        </label>
      </div>

      <Secao titulo="Distribuição por classe"
        descricao="Classe A: até 80% do acumulado. B: até 95%. C: o restante. Clique para filtrar.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          {classes.map(c => {
            const ativa = classe === c.classe;
            const cor = c.classe === 'A' ? 'var(--bl-sucesso)' : c.classe === 'B' ? 'var(--bl-aviso)' : 'var(--bl-neutro)';
            return (
              <button key={c.classe} type="button" className="bl-cartao"
                onClick={() => setClasse(ativa ? null : c.classe)}
                style={{
                  padding: '10px 12px', textAlign: 'left', font: 'inherit', color: 'inherit',
                  cursor: 'pointer', borderLeft: `3px solid ${cor}`,
                  background: ativa ? 'var(--bl-superficie-2)' : undefined,
                }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: cor }}>Classe {c.classe}</div>
                <div style={{ fontSize: 17, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                  {formato === 'moeda' ? moeda(c.valor, true) : inteiro(c.valor)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--bl-texto-2)' }}>
                  {inteiro(c.itens)} item(ns) · {percentual(c.participacao)}
                </div>
              </button>
            );
          })}
        </div>
      </Secao>

      <Secao titulo="Curva de concentração">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          {itens.length === 0 ? (
            <EstadoVazio titulo="Sem itens no recorte" descricao="Ajuste o período ou a dimensão." />
          ) : (
            <Grafico altura={larguraPainel < 980 ? 250 : 300}
              opcao={opcaoPareto(t, itens.slice(0, 30).map(i => ({ rotulo: i.rotulo, valor: i.valor })), formato)}
              descricao={`Curva de Pareto dos 30 maiores itens por ${metrica}, com linha de corte em 80%.`} />
          )}
        </div>
      </Secao>

      <Secao titulo={classe ? `Itens da classe ${classe}` : 'Todos os itens'}
        acoes={classe ? (
          <button type="button" className="bl-botao" onClick={() => setClasse(null)}
            style={{ height: 24, fontSize: 11 }}>Limpar seleção</button>
        ) : undefined}>
        <DataGrid
          colunas={colunas}
          linhas={linhasComBadge}
          total={buscados.length}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          chaveLinha={l => String(l.id)}
          chavePreferencias={`abc-${dimensao}`}
          filtroAtivo={Boolean(classe || grid.busca)}
          alturaMax={larguraPainel < 980 ? 400 : 500}
        />
      </Secao>
    </div>
  );
}

/* ═══════════════════════ Previsões (§43) ═══════════════════════ */

export function Previsoes({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [horizonte, setHorizonte] = React.useState(30);
  const params = React.useMemo(() => ({ periodo: filtros.periodo, horizonte }), [filtros.periodo, horizonte]);
  const carga = useCarga<any>(s => api.previsoes(params, s), [JSON.stringify(params)]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={7} rotulo="Calculando projeção" />;

  if (!carga.dados.disponivel) {
    return (
      <div style={{ minWidth: 0 }}>
        <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
          aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />
        <EstadoVazio titulo="Período curto demais para projetar"
          descricao={carga.dados.motivo}
          acao={<button type="button" className="bl-botao bl-botao--primario"
            onClick={() => aoMudarFiltros({ periodo: '90d' })}>Usar 90 dias</button>} />
      </div>
    );
  }

  const hist: any[] = carga.dados.historico ?? [];
  const proj: any[] = carga.dados.projecao ?? [];
  const m = carga.dados.modelo ?? {};
  const totalProjetado = proj.reduce((s, p) => s + p.valor, 0);

  const opcao = {
    color: [t.serie[0], t.serie[2]],
    grid: { left: 8, right: 8, top: 30, bottom: 30, containLabel: true },
    legend: { textStyle: { color: t.texto2, fontSize: 11 }, top: 0, itemHeight: 8, itemWidth: 14 },
    tooltip: {
      trigger: 'axis', backgroundColor: t.fundo, borderColor: t.borda,
      textStyle: { color: t.texto, fontSize: 11.5 },
    },
    xAxis: {
      type: 'category', data: [...hist.map(p => p.data), ...proj.map(p => p.data)],
      axisLine: { lineStyle: { color: t.borda } }, axisTick: { show: false },
      axisLabel: { color: t.texto3, fontSize: 10 }, splitLine: { show: false },
    },
    yAxis: {
      type: 'value', axisLine: { lineStyle: { color: t.borda } },
      splitLine: { lineStyle: { color: t.borda, type: 'dashed' } },
      axisLabel: { color: t.texto3, fontSize: 10,
        formatter: (v: number) => new Intl.NumberFormat('pt-BR',
          { notation: 'compact', maximumFractionDigits: 1 }).format(v) },
    },
    series: [
      { name: 'Realizado', type: 'line', smooth: .25, symbol: 'none',
        data: [...hist.map(p => p.valor), ...proj.map(() => null)], lineStyle: { width: 1.8 } },
      { name: `Projeção (${horizonte} dias)`, type: 'line', smooth: .25, symbol: 'none',
        data: [...hist.map(() => null), ...proj.map(p => p.valor)],
        lineStyle: { width: 1.8, type: 'dashed' } },
    ],
  };

  const corConfianca = m.confianca === 'alta' ? 'sucesso' : m.confianca === 'media' ? 'aviso' : 'erro';

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
          aoLimpar={() => aoMudarFiltros({ periodo: '90d' })} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--bl-texto-2)' }}>
          Horizonte
          <select value={horizonte} onChange={e => setHorizonte(Number(e.target.value))}
            style={{
              height: 28, padding: '0 8px', font: 'inherit', fontSize: 12,
              color: 'var(--bl-texto)', background: 'var(--bl-superficie-2)',
              border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
            }}>
            {[7, 15, 30, 60, 90].map(n => <option key={n} value={n}>{n} dias</option>)}
          </select>
        </label>
      </div>

      <GradeKpis kpis={[
        kpi('projetado', `Faturamento projetado (${horizonte}d)`, totalProjetado, 'moeda'),
        kpi('tendencia', 'Tendência por dia', m.inclinacao_dia ?? 0, 'moeda',
          (m.inclinacao_dia ?? 0) < 0 ? 'atencao' : 'ok',
          'Inclinação da reta ajustada: quanto o faturamento diário varia, em média.'),
        kpi('r2', 'Qualidade do ajuste (R²)', (m.r2 ?? 0) * 100, 'percentual',
          m.confianca === 'baixa' ? 'critico' : m.confianca === 'media' ? 'atencao' : 'ok',
          'Quanto da variação a reta explica. Abaixo de 30% a projeção não é confiável.'),
      ]} />

      {m.aviso && (
        <div style={{
          marginTop: 12, padding: '9px 12px', fontSize: 12, borderRadius: 'var(--bl-raio-sm)',
          background: 'var(--bl-erro-bg)', color: 'var(--bl-erro)', border: '1px solid var(--bl-erro)',
        }}>
          {m.aviso}
        </div>
      )}

      <Secao titulo="Realizado e projeção">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Badge info={{ chave: m.confianca, rotulo: `Confiança ${m.confianca}`, cor: corConfianca }} />
            <span style={{ fontSize: 11.5, color: 'var(--bl-texto-2)' }}>
              Modelo: regressão linear · R² = {(m.r2 ?? 0).toFixed(3).replace('.', ',')}
            </span>
          </div>
          <Grafico altura={larguraPainel < 980 ? 250 : 300} opcao={opcao}
            descricao={`Faturamento realizado e projeção linear para os próximos ${horizonte} dias.`} />
          <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '8px 0 0' }}>
            Projeção linear sobre o histórico do período selecionado. Não incorpora sazonalidade,
            campanhas nem eventos pontuais.
          </p>
        </div>
      </Secao>
    </div>
  );
}

/* ═══════════════════════ Anomalias (§42) ═══════════════════════ */

export function Anomalias({ filtros, aoMudarFiltros, aoNavegar }: PropsTela) {
  const params = React.useMemo(() => ({ periodo: filtros.periodo }), [filtros.periodo]);
  const carga = useCarga<{ insights: Insight[] }>(s => api.insights(params, s), [JSON.stringify(params)]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={7} rotulo="Analisando anomalias" />;

  const ins = carga.dados.insights ?? [];
  const porSeveridade = (s: string) => ins.filter(i => i.severidade === s).length;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />

      <GradeKpis kpis={[
        kpi('total', 'Insights detectados', ins.length, 'inteiro'),
        kpi('criticos', 'Críticos', porSeveridade('critica'), 'inteiro',
          porSeveridade('critica') > 0 ? 'critico' : 'ok'),
        kpi('altos', 'Alta prioridade', porSeveridade('alta'), 'inteiro',
          porSeveridade('alta') > 0 ? 'atencao' : 'ok'),
        kpi('medios', 'Média prioridade', porSeveridade('media'), 'inteiro'),
      ]} />

      <Secao titulo="Insights"
        descricao="Regras determinísticas sobre os dados do período. Cada um mostra a evidência que o disparou.">
        {ins.length === 0 ? (
          <EstadoVazio titulo="Nenhuma anomalia detectada"
            descricao="Nenhuma das regras foi disparada no recorte selecionado. Isso é um bom sinal." />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {ins.map(i => (
              <article key={i.id} className="bl-cartao" style={{
                padding: '12px 14px',
                borderLeft: `3px solid ${i.severidade === 'critica' ? 'var(--bl-erro)'
                  : i.severidade === 'alta' ? 'var(--bl-aviso)' : 'var(--bl-info)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <Badge info={{
                    chave: i.severidade,
                    rotulo: i.severidade === 'critica' ? 'Crítico' : i.severidade === 'alta' ? 'Alto' : 'Médio',
                    cor: i.severidade === 'critica' ? 'erro' : i.severidade === 'alta' ? 'aviso' : 'info',
                  }} />
                  <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, flex: 1, minWidth: 200 }}>{i.titulo}</h3>
                  <Badge info={{ chave: i.confianca, rotulo: `confiança ${i.confianca}`, cor: 'neutro' }} />
                  <button type="button" className="bl-botao" onClick={() => aoNavegar(i.tela)}>Analisar</button>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, fontSize: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)' }}>Evidência</div>
                    <div>{i.evidencia}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)' }}>Recomendação</div>
                    <div>{i.recomendacao}</div>
                  </div>
                  {i.impacto !== null && (
                    <div>
                      <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)' }}>Impacto estimado</div>
                      <div style={{ fontWeight: 600 }}>{moeda(i.impacto)}</div>
                    </div>
                  )}
                </div>

                <div style={{
                  marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--bl-borda)',
                  fontSize: 10.5, color: 'var(--bl-texto-3)',
                  display: 'flex', gap: 12, flexWrap: 'wrap',
                }}>
                  <span>período: {i.periodo.de} a {i.periodo.ate}</span>
                  <span>origem: {i.origem}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </Secao>
    </div>
  );
}

/* ═══════════════════════ Relatórios (§43) ═══════════════════════ */

export function Relatorios({ aoNavegar }: PropsTela) {
  const carga = useCarga<any>(s => api.relatorios(s), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }
  if (!carga.dados) return <BlocoCarregando linhas={7} rotulo="Carregando catálogo" />;

  const rels: any[] = carga.dados.relatorios ?? [];
  const grupos = [...new Set(rels.map(r => r.grupo))];

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        margin: '6px 0 14px', padding: '9px 12px', fontSize: 12,
        borderRadius: 'var(--bl-raio-sm)', background: 'var(--bl-superficie-2)',
        border: '1px solid var(--bl-borda)', color: 'var(--bl-texto-2)',
      }}>
        Cada relatório abre a tela correspondente já com os filtros disponíveis. A exportação em CSV
        sai da própria tabela. XLSX, PDF e agendamento entram em fase posterior — estão listados
        aqui como previstos, não como prontos.
      </div>

      {grupos.map(g => (
        <Secao key={g} titulo={g}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
            {rels.filter(r => r.grupo === g).map(r => (
              <div key={r.id} className="bl-cartao" style={{
                padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0,
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.nome}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {r.formatos.map((f: string) => (
                    <span key={f} style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      textTransform: 'uppercase', letterSpacing: '.03em',
                      background: f === 'csv' ? 'var(--bl-verde-suave)' : 'var(--bl-superficie-2)',
                      color: f === 'csv' ? 'var(--bl-verde)' : 'var(--bl-texto-3)',
                      border: `1px solid ${f === 'csv' ? 'var(--bl-verde-borda)' : 'var(--bl-borda)'}`,
                    }}>
                      {f}{f !== 'csv' ? ' (previsto)' : ''}
                    </span>
                  ))}
                </div>
                <div style={{ flex: 1 }} />
                <button type="button" className="bl-botao bl-botao--primario"
                  onClick={() => aoNavegar(mapaTela(r.id))}>
                  Abrir
                </button>
              </div>
            ))}
          </div>
        </Secao>
      ))}
    </div>
  );
}

/** Relatório → tela do módulo. Mantido curto e explícito de propósito. */
function mapaTela(idRelatorio: string): string {
  const m: Record<string, string> = {
    pedidos: 'pedidos-venda', vendas: 'vendas', canais: 'canais-venda',
    produtos: 'produtos', estoque: 'estoque', precos: 'precos',
    compras: 'pedidos-compra', fornecedores: 'fornecedores', clientes: 'clientes',
    notas: 'notas-fiscais', receber: 'contas-receber', pagar: 'contas-pagar',
    'fluxo-caixa': 'fluxo-caixa', logistica: 'envios', rentabilidade: 'rentabilidade',
    sincronizacao: 'sincronizacao', auditoria: 'auditoria',
  };
  return m[idRelatorio] ?? 'visao-geral';
}
