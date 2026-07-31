// panel-bling/src/screens/custom/Produtos.tsx — Preços, Estoque, Depósitos
// @version 1.0.0  @created 2026-07-30

import React from 'react';
import {
  DataGrid, EstadoGrid, ColunaGrid, GradeKpis, Kpi, Secao, BarraFiltros,
  EstadoErro, BlocoCarregando, Badge, moeda, percentual, inteiro, numero,
  parseNum, Medidor, data as dataBr,
} from '@shared';
import { api, RespostaRecurso } from '../../services/api';
import { useCarga, useDebounce } from '../../app/estado';
import { PropsTela } from '../generic/TelaCatalogo';
import { MatrizQuadrantes, SankeyD3 } from '../../viz/D3';
import {
  Grafico, tokens, opcaoBarras, opcaoPizza, opcaoFaixas,
  opcaoDispersao, opcaoPrecoCusto,
} from '../../viz/Echarts';
import { useSelecao } from '../../app/selecao';

const GRID_INICIAL: EstadoGrid = { ordenar: '', direcao: 'desc', pagina: 1, limite: 50, busca: '' };

/* ═══════════════════════ Preços e custos (§26) ═══════════════════════ */

export function Precos({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [grid, setGrid] = React.useState(GRID_INICIAL);
  const busca = useDebounce(grid.busca);

  const params = React.useMemo(() => ({
    periodo: filtros.periodo, categoria: filtros.categoria, q: busca,
    ordenar: grid.ordenar, direcao: grid.direcao, pagina: grid.pagina, limite: grid.limite,
  }), [filtros, busca, grid]);

  const carga = useCarga<RespostaRecurso>(s => api.recurso('prices', params, s), [JSON.stringify(params)]);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }

  const linhas = carga.dados?.itens ?? [];
  const abaixoCusto = linhas.filter(l => l.abaixo_custo === true).length;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        facetas={carga.dados?.facetas} camposExtras={['categoria']}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d', categoria: '' })} />

      <GradeKpis kpis={[
        { id: 'produtos', rotulo: 'Produtos precificados', valor: carga.meta?.total ?? 0,
          formato: 'inteiro', variacao: null, tendencia: 'estavel', sparkline: null,
          drilldown: null, semantica: 'ok', tooltip: null },
        { id: 'abaixo', rotulo: 'Abaixo do custo (nesta página)', valor: abaixoCusto,
          formato: 'inteiro', variacao: null, tendencia: 'estavel', sparkline: null,
          drilldown: null, semantica: abaixoCusto > 0 ? 'critico' : 'ok',
          tooltip: 'Contagem sobre os registros carregados nesta página.' },
      ] as Kpi[]} />

      <Secao titulo="Histórico do produto"
        descricao="Preço, custo e volume vendido no período. Escolha um produto para ver a série.">
        <HistoricoProduto periodo={filtros.periodo} larguraPainel={larguraPainel} />
      </Secao>

      <Secao titulo="Simulador de preço"
        descricao="Calculadora. Nada é gravado e nenhum preço é alterado no Bling.">
        <Simulador />
      </Secao>

      <Secao titulo="Tabela de preços">
        <DataGrid
          colunas={(carga.dados?.colunas ?? []) as ColunaGrid[]}
          linhas={linhas}
          total={carga.meta?.total ?? 0}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          carregando={carga.carregando}
          chavePreferencias="precos"
          alturaMax={larguraPainel < 980 ? 420 : 520}
        />
      </Secao>
    </div>
  );
}

/**
 * §26.1 — série de preço, custo, margem e volume.
 *
 * O grafo da Fase 2 não guarda histórico de ALTERAÇÃO de preço (isso vem da API
 * na Fase 5). O que é real aqui são as vendas por dia; preço e custo aparecem
 * como o valor vigente. A tela DIZ isso — desenhar uma curva de preço variando
 * seria a mentira mais fácil desta interface.
 */
function HistoricoProduto({ periodo, larguraPainel }: { periodo: string; larguraPainel: number }) {
  const [produto, setProduto] = React.useState('');
  const params = React.useMemo(() => ({ periodo, produto }), [periodo, produto]);
  const carga = useCarga<any>(s => api.historicoPreco(params, s), [JSON.stringify(params)]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  const sugestoes: any[] = carga.dados?.sugestoes ?? [];
  const sel = carga.dados?.selecionado;
  const pontos: any[] = carga.dados?.pontos ?? [];

  // Primeiro produto da lista assim que ela chega — abrir vazio faz a seção
  // parecer quebrada.
  React.useEffect(() => {
    if (!produto && sugestoes.length > 0) setProduto(sugestoes[0].id);
  }, [produto, sugestoes]);

  return (
    <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
                      color: 'var(--bl-texto-2)', marginBottom: 10, flexWrap: 'wrap' }}>
        Produto
        <select value={produto} onChange={e => setProduto(e.target.value)}
          style={{
            height: 28, maxWidth: 380, flex: '1 1 260px', padding: '0 8px',
            font: 'inherit', fontSize: 12, color: 'var(--bl-texto)',
            background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
            borderRadius: 'var(--bl-raio-sm)',
          }}>
          {sugestoes.length === 0 && <option value="">carregando…</option>}
          {sugestoes.map(x => (
            <option key={x.id} value={x.id}>{x.sku} — {x.nome}</option>
          ))}
        </select>
        {sel && (
          <span style={{ fontSize: 11, color: 'var(--bl-texto-3)' }}>
            {inteiro(sel.unidades_vendidas)} un. vendidas · {moeda(sel.receita, true)} de receita
          </span>
        )}
      </label>

      {!carga.dados ? <BlocoCarregando linhas={4} /> : !sel ? (
        <div style={{ padding: '20px 0', fontSize: 12.5, color: 'var(--bl-texto-2)', textAlign: 'center' }}>
          Escolha um produto para ver a série.
        </div>
      ) : (
        <>
          <div style={{ display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit,minmax(112px,1fr))',
                        gap: 10, marginBottom: 12 }}>
            <Resultado rotulo="Preço" valor={moeda(sel.preco)} />
            <Resultado rotulo="Custo" valor={moeda(sel.custo)} />
            <Resultado rotulo="Margem" valor={percentual(sel.margem_pct)}
              cor={sel.margem_pct < 0 ? 'var(--bl-erro)' : undefined} />
            <Resultado rotulo="Markup" valor={sel.markup === null ? '—' : numero(sel.markup)} />
            <Resultado rotulo="Estoque" valor={inteiro(sel.estoque_total)} />
          </div>

          <Grafico
            altura={larguraPainel < 980 ? 220 : 260}
            opcao={opcaoPrecoCusto(t, pontos)}
            descricao={`Preço, custo e unidades vendidas de ${sel.nome} ao longo do período.`}
          />

          <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '8px 0 0' }}>
            {carga.dados.nota}
          </p>
        </>
      )}
    </div>
  );
}

/** §26.2 — todos os campos, com o preço de equilíbrio calculado no servidor. */
function Simulador() {
  const [campos, setCampos] = React.useState({
    custo: '100,00', preco: '189,90', desconto_pct: '0',
    imposto_pct: '11,5', comissao_pct: '3', taxa_pct: '3,49', frete: '0',
  });

  // parseNum, nunca Number(): "189,90" com Number() vira NaN e o simulador
  // passaria a mostrar zero sem avisar.
  const params = React.useMemo(() => ({
    custo: parseNum(campos.custo) ?? 0,
    preco: parseNum(campos.preco) ?? 0,
    desconto_pct: parseNum(campos.desconto_pct) ?? 0,
    imposto_pct: parseNum(campos.imposto_pct) ?? 0,
    comissao_pct: parseNum(campos.comissao_pct) ?? 0,
    taxa_pct: parseNum(campos.taxa_pct) ?? 0,
    frete: parseNum(campos.frete) ?? 0,
  }), [campos]);

  const carga = useCarga<any>(s => api.simulador(params, s), [JSON.stringify(params)]);
  const r = carga.dados?.resultado;

  const campo = (id: keyof typeof campos, rotulo: string, sufixo?: string) => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 11, color: 'var(--bl-texto-2)' }}>{rotulo}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          value={campos[id]}
          onChange={e => setCampos(c => ({ ...c, [id]: e.target.value }))}
          inputMode="decimal"
          style={{
            width: '100%', height: 28, padding: '0 8px', font: 'inherit', fontSize: 12,
            textAlign: 'right', fontVariantNumeric: 'tabular-nums',
            color: 'var(--bl-texto)', background: 'var(--bl-superficie-2)',
            border: '1px solid var(--bl-borda)', borderRadius: 'var(--bl-raio-sm)',
          }}
        />
        {sufixo && <span style={{ fontSize: 11, color: 'var(--bl-texto-3)' }}>{sufixo}</span>}
      </span>
    </label>
  );

  return (
    <div className="bl-cartao" style={{ padding: 14, minWidth: 0 }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 10, marginBottom: 14,
      }}>
        {campo('custo', 'Custo', 'R$')}
        {campo('preco', 'Preço', 'R$')}
        {campo('desconto_pct', 'Desconto', '%')}
        {campo('imposto_pct', 'Imposto est.', '%')}
        {campo('comissao_pct', 'Comissão', '%')}
        {campo('taxa_pct', 'Taxa', '%')}
        {campo('frete', 'Frete', 'R$')}
      </div>

      {!r ? <BlocoCarregando linhas={2} /> : (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))', gap: 10,
          }}>
            {[
              ['Preço líquido', moeda(r.preco_liquido)],
              ['Imposto', moeda(r.imposto)],
              ['Comissão', moeda(r.comissao)],
              ['Taxa', moeda(r.taxa)],
              ['Frete', moeda(r.frete)],
              ['Custo', moeda(r.custo)],
            ].map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)' }}>{k}</div>
                <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(146px, 1fr))', gap: 10,
            marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--bl-borda)',
          }}>
            <Resultado rotulo="Lucro" valor={moeda(r.lucro)}
              cor={r.lucro < 0 ? 'var(--bl-erro)' : 'var(--bl-sucesso)'} destaque />
            <Resultado rotulo="Margem" valor={percentual(r.margem_pct, 2)}
              cor={r.margem_pct < 0 ? 'var(--bl-erro)' : undefined} destaque />
            <Resultado rotulo="Markup" valor={r.markup === null ? '—' : numero(r.markup)} />
            <Resultado rotulo="Preço de equilíbrio"
              valor={r.preco_equilibrio === null ? '—' : moeda(r.preco_equilibrio)}
              cor={r.abaixo_do_equilibrio ? 'var(--bl-erro)' : undefined} />
          </div>

          {r.abaixo_do_equilibrio && (
            <div style={{
              marginTop: 10, padding: '7px 10px', fontSize: 11.5, borderRadius: 'var(--bl-raio-sm)',
              background: 'var(--bl-erro-bg)', color: 'var(--bl-erro)', border: '1px solid var(--bl-erro)',
            }}>
              O preço líquido está abaixo do ponto de equilíbrio: nesta configuração a venda dá prejuízo.
            </div>
          )}

          <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '10px 0 0' }}>
            {carga.dados?.nota}
          </p>
        </>
      )}
    </div>
  );
}

function Resultado({ rotulo, valor, cor, destaque }: {
  rotulo: string; valor: string; cor?: string; destaque?: boolean;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: 'var(--bl-texto-3)' }}>{rotulo}</div>
      <div style={{
        fontSize: destaque ? 17 : 13.5, fontWeight: destaque ? 650 : 500,
        color: cor, fontVariantNumeric: 'tabular-nums',
      }}>{valor}</div>
    </div>
  );
}

/* ═══════════════════════ Estoque (§24) ═══════════════════════ */

export function Estoque({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [grid, setGrid] = React.useState(GRID_INICIAL);
  const [quadrante, setQuadrante] = React.useState<string | null>(null);
  const busca = useDebounce(grid.busca);

  const params = React.useMemo(() => ({
    periodo: filtros.periodo, deposito: filtros.deposito, q: busca,
    ordenar: grid.ordenar, direcao: grid.direcao, pagina: grid.pagina, limite: grid.limite,
  }), [filtros, busca, grid]);

  const carga = useCarga<RespostaRecurso>(s => api.recurso('inventory', params, s), [JSON.stringify(params)]);
  const matriz = useCarga<any>(s => api.matrizEstoque({ periodo: filtros.periodo }, s), [filtros.periodo]);
  const analise = useCarga<any>(
    s => api.analiseEstoque({ periodo: filtros.periodo, deposito: filtros.deposito }, s),
    [filtros.periodo, filtros.deposito]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }

  const linhas = carga.dados?.itens ?? [];
  const totais = carga.dados?.totais ?? {};
  const facetas = carga.dados?.facetas ?? {};
  const porStatus = facetas.status ?? [];
  const conta = (s: string) => porStatus.find(x => x.valor === s)?.quantidade ?? 0;

  const kpis: Kpi[] = [
    k('fisico', 'Estoque físico', totais.fisico ?? 0, 'inteiro'),
    k('disponivel', 'Disponível', totais.disponivel ?? 0, 'inteiro'),
    k('reservado', 'Reservado', totais.reservado ?? 0, 'inteiro'),
    k('valor', 'Valor em estoque', totais.valor ?? 0, 'moeda'),
    k('zerado', 'Produtos zerados', conta('zerado'), 'inteiro', conta('zerado') > 0 ? 'atencao' : 'ok'),
    k('negativo', 'Saldo negativo', conta('negativo'), 'inteiro', conta('negativo') > 0 ? 'critico' : 'ok'),
    k('critico', 'Estoque crítico', conta('critico'), 'inteiro', conta('critico') > 0 ? 'atencao' : 'ok'),
    k('parado', 'Itens parados', conta('parado'), 'inteiro'),
  ];

  const itensMatriz = quadrante
    ? (matriz.dados?.itens ?? []).filter((i: any) => i.quadrante === quadrante)
    : (matriz.dados?.itens ?? []);

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        facetas={facetas} camposExtras={['deposito', 'status']}
        aoLimpar={() => { aoMudarFiltros({ periodo: '30d', deposito: '' }); setQuadrante(null); }} />

      <GradeKpis kpis={kpis} />

      <Secao titulo="Cobertura e envelhecimento"
        descricao="Quanto tempo o saldo atual dura, e há quanto tempo ele não se move.">
        <div style={{ display: 'grid',
                      gridTemplateColumns: larguraPainel < 1080 ? '1fr' : '1fr 1fr',
                      gap: 12 }}>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            <div className="bl-titulo-secao">Cobertura do estoque</div>
            {analise.dados ? (
              <Grafico altura={210}
                opcao={opcaoFaixas(t, analise.dados.cobertura, 'valor')}
                descricao="Valor em estoque distribuído por faixa de cobertura, de ruptura a excesso." />
            ) : <BlocoCarregando linhas={4} />}
          </div>
          <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
            <div className="bl-titulo-secao">Aging — tempo sem movimentação</div>
            {analise.dados ? (
              <>
                <Grafico altura={210}
                  opcao={opcaoFaixas(t, analise.dados.aging.map((a: any) => ({
                    ...a, cor: a.id === '180+' ? 'erro' : a.id === '91-180' ? 'aviso'
                          : a.id === '0-30' ? 'sucesso' : 'neutro',
                  })), 'valor')}
                  descricao="Valor em estoque por tempo desde a última movimentação." />
                <p style={{ fontSize: 10.5, color: 'var(--bl-texto-3)', margin: '6px 0 0' }}>
                  {analise.dados.nota_aging}
                </p>
              </>
            ) : <BlocoCarregando linhas={4} />}
          </div>
        </div>
      </Secao>

      {analise.dados && analise.dados.rupturas.length > 0 && (
        <Secao titulo="Projeção de ruptura"
          descricao={`${analise.dados.rupturas_total} item(ns) zeram em até 60 dias no ritmo atual de consumo.`}>
          <RupturasProximas itens={analise.dados.rupturas} />
        </Secao>
      )}

      <Secao titulo="Estoque × venda"
        descricao="Quem tem estoque e não vende fica em cima; quem vende e não tem estoque, à direita embaixo.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          {analise.dados ? (
            <Grafico altura={larguraPainel < 980 ? 240 : 290}
              opcao={opcaoDispersao(t,
                analise.dados.dispersao.map((d: any) => ({
                  rotulo: `${d.sku} — ${d.produto}`, x: d.vendas_90d, y: d.estoque, tamanho: d.valor,
                })),
                'Vendas em 90 dias', 'Estoque disponível', 'inteiro', 'inteiro')}
              descricao="Dispersão de estoque disponível contra vendas dos últimos 90 dias." />
          ) : <BlocoCarregando linhas={4} />}
        </div>
      </Secao>

      <Secao titulo="Matriz giro × margem"
        descricao="Cada ponto é um produto; o tamanho é o valor imobilizado. Clique num quadrante para isolá-lo.">
        <div className="bl-cartao" style={{ padding: '12px 14px', minWidth: 0 }}>
          {matriz.dados ? (
            <MatrizQuadrantes
              itens={itensMatriz}
              cortes={matriz.dados.cortes}
              quadrantes={matriz.dados.quadrantes}
              altura={larguraPainel < 980 ? 320 : 400}
              aoSelecionar={setQuadrante}
              quadranteSelecionado={quadrante}
            />
          ) : <BlocoCarregando linhas={5} />}
        </div>
      </Secao>

      <Secao titulo="Saldos por produto e depósito">
        <DataGrid
          colunas={(carga.dados?.colunas ?? []) as ColunaGrid[]}
          linhas={linhas}
          total={carga.meta?.total ?? 0}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          carregando={carga.carregando}
          totais={totais}
          chavePreferencias="estoque"
          selecionaveis
          filtroAtivo={Boolean(filtros.deposito || busca)}
          alturaMax={larguraPainel < 980 ? 420 : 540}
        />
      </Secao>
    </div>
  );
}

function k(id: string, rotulo: string, valor: number, formato: string,
  semantica: 'ok' | 'atencao' | 'critico' = 'ok'): Kpi {
  return {
    id, rotulo, valor, formato: formato as any, variacao: null, tendencia: 'estavel',
    sparkline: null, drilldown: null, semantica, tooltip: null,
  };
}

/* ═══════════════════════ Depósitos (§25) ═══════════════════════ */

export function Depositos({ filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [grid, setGrid] = React.useState(GRID_INICIAL);
  const params = React.useMemo(() => ({
    periodo: filtros.periodo, ordenar: grid.ordenar, direcao: grid.direcao,
    pagina: grid.pagina, limite: grid.limite, q: grid.busca,
  }), [filtros.periodo, grid]);

  const carga = useCarga<RespostaRecurso>(s => api.recurso('warehouses', params, s), [JSON.stringify(params)]);
  const fluxo = useCarga<any>(s => api.fluxoDepositos({ periodo: filtros.periodo }, s), [filtros.periodo]);
  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return <EstadoErro erro={carga.erro.message} correlationId={carga.erro.correlationId}
      aoTentarNovamente={carga.recarregar} />;
  }

  const linhas = carga.dados?.itens ?? [];
  const totais = carga.dados?.totais ?? {};
  const duas = larguraPainel >= 1080;

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros filtros={filtros as any} aoMudar={aoMudarFiltros as any}
        aoLimpar={() => aoMudarFiltros({ periodo: '30d' })} />

      <GradeKpis kpis={[
        k('depositos', 'Depósitos', carga.meta?.total ?? 0, 'inteiro'),
        k('valor', 'Valor total', totais.valor ?? 0, 'moeda'),
        k('disponivel', 'Disponível', totais.disponivel ?? 0, 'inteiro'),
        k('negativos', 'Saldos negativos', totais.negativos ?? 0, 'inteiro',
          (totais.negativos ?? 0) > 0 ? 'critico' : 'ok'),
        k('divergencias', 'Divergências', totais.divergencias ?? 0, 'inteiro',
          (totais.divergencias ?? 0) > 0 ? 'atencao' : 'ok'),
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: duas ? '1fr 1fr' : '1fr', gap: 14, marginTop: 18 }}>
        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Valor por depósito</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px' }}>
            {linhas.length > 0 ? (
              <Grafico altura={220}
                opcao={opcaoPizza(t, linhas.map(l => ({ rotulo: String(l.nome), valor: Number(l.valor) })), 'moeda')}
                descricao="Distribuição do valor de estoque entre os depósitos." />
            ) : <BlocoCarregando linhas={3} />}
          </div>
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 className="bl-titulo-secao">Distribuição entre depósitos</h2>
          <div className="bl-cartao" style={{ padding: '12px 14px' }}>
            {fluxo.dados ? <SankeyD3 dados={fluxo.dados} altura={220} /> : <BlocoCarregando linhas={3} />}
          </div>
        </section>
      </div>

      <Secao titulo="Depósitos">
        <DataGrid
          colunas={(carga.dados?.colunas ?? []) as ColunaGrid[]}
          linhas={linhas}
          total={carga.meta?.total ?? 0}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          carregando={carga.carregando}
          totais={totais}
          chavePreferencias="depositos"
          alturaMax={360}
        />
      </Secao>
    </div>
  );
}


/** Lista curta de rupturas projetadas (§24.2). Ordenada por urgência. */
function RupturasProximas({ itens }: { itens: any[] }) {
  return (
    <div className="bl-cartao bl-rola-x">
      <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Urgência', 'SKU', 'Produto', 'Depósito', 'Disponível',
              'Consumo/dia', 'Cobertura', 'Zera em', 'Valor'].map((h, i) => (
              <th key={h} style={{
                padding: '8px 10px', fontSize: 10.5, fontWeight: 600,
                textAlign: i >= 4 ? 'right' : 'left',
                color: 'var(--bl-texto-2)', background: 'var(--bl-bg-elevado)',
                borderBottom: '1px solid var(--bl-borda)', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itens.slice(0, 25).map((r, i) => (
            <tr key={`${r.sku}-${r.deposito}`}
                style={{ background: i % 2 ? 'var(--bl-superficie-2)' : undefined }}>
              <td style={celula()}>
                <Badge info={{
                  chave: r.urgencia,
                  rotulo: r.urgencia === 'critica' ? 'Crítica' : r.urgencia === 'alta' ? 'Alta' : 'Média',
                  cor: r.urgencia === 'critica' ? 'erro' : r.urgencia === 'alta' ? 'aviso' : 'info',
                }} />
              </td>
              <td style={celula()}>{r.sku}</td>
              <td style={{ ...celula(), maxWidth: 260, overflow: 'hidden',
                           textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.produto}</td>
              <td style={celula()}>{r.deposito}</td>
              <td style={celula('direita')}>{inteiro(r.disponivel)}</td>
              <td style={celula('direita')}>{numero(r.consumo_dia)}</td>
              <td style={celula('direita')}>{numero(r.cobertura_dias)} d</td>
              <td style={{ ...celula('direita'), color: 'var(--bl-erro)' }}>{dataBr(r.data_ruptura)}</td>
              <td style={celula('direita')}>{moeda(r.valor, true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {itens.length > 25 && (
        <div style={{ padding: '7px 10px', fontSize: 11, color: 'var(--bl-texto-3)' }}>
          Exibindo os 25 mais urgentes de {inteiro(itens.length)}.
        </div>
      )}
    </div>
  );
}

function celula(alinhamento: 'esquerda' | 'direita' = 'esquerda'): React.CSSProperties {
  return {
    padding: '6px 10px', fontSize: 12,
    textAlign: alinhamento === 'direita' ? 'right' : 'left',
    borderBottom: '1px solid var(--bl-borda)',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  };
}
