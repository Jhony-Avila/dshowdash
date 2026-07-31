// panel-bling/src/screens/generic/TelaCatalogo.tsx — renderizador de declaração
// @version 1.0.0  @created 2026-07-30
//
// Transforma um TelaSpec numa tela de produção: KPIs, gráficos, filtros
// facetados, grid server-side, cross-filter e drill-down.
//
// É AQUI que mora a coerência: 41 das 52 telas passam por este arquivo. Uma
// correção de comportamento vale para todas de uma vez, em vez de precisar ser
// repetida 41 vezes (e esquecida em 3).

import React from 'react';
import {
  DataGrid, EstadoGrid, ColunaGrid, GradeKpis, Kpi, BarraFiltros,
  EstadoErro, BlocoCarregando, Secao, porTipo, TipoFormato,
} from '@shared';
import { TelaSpec, GraficoSpec } from '../catalog';
import { api, RespostaRecurso, Evolucao } from '../../services/api';
import { Filtros, useCarga, useDebounce } from '../../app/estado';
import { useSelecao, CampoSelecao, Destino } from '../../app/selecao';
import {
  Grafico, tokens, opcaoLinhaTempo, opcaoBarras, opcaoPizza,
  opcaoFunil, opcaoPareto, opcaoDispersao,
} from '../../viz/Echarts';

export interface PropsTela {
  tela: TelaSpec;
  filtros: Filtros;
  aoMudarFiltros: (p: Partial<Filtros>) => void;
  /** Aceita o id da tela ou um Destino com recorte junto (§55). */
  aoNavegar: (destino: string | Destino) => void;
  larguraPainel: number;
}

const GRID_INICIAL: EstadoGrid = { ordenar: '', direcao: 'desc', pagina: 1, limite: 50, busca: '' };

/** Campos que o servidor filtra. Os demais recortam só a página carregada. */
const CAMPOS_DA_API: CampoSelecao[] = [
  'canal', 'categoria', 'fornecedor', 'vendedor', 'deposito', 'situacao',
];

export function TelaCatalogo({ tela, filtros, aoMudarFiltros, larguraPainel }: PropsTela) {
  const [grid, setGrid] = React.useState<EstadoGrid>(GRID_INICIAL);
  const buscaDebounced = useDebounce(grid.busca);
  const selecao = useSelecao();

  // Trocar de tela zera grid e cross-filter. Sem isso a tela nova abre ordenada
  // por uma coluna que ela não tem e na página 7 de um conjunto que não existe.
  React.useEffect(() => {
    setGrid(GRID_INICIAL);
  }, [tela.id]);

  // A seleção global mudou → volta para a página 1. Ficar na página 7 de um
  // conjunto que acabou de encolher mostra tabela vazia sem explicação.
  const chaveSelecao = JSON.stringify(selecao.selecoes);
  React.useEffect(() => {
    setGrid(g => ({ ...g, pagina: 1 }));
  }, [chaveSelecao]);

  // A seleção global entra DEPOIS dos filtros da tela: um recorte ativo na barra
  // superior vence o filtro local do mesmo campo. Se vencesse o contrário, a
  // barra diria "Canal: Mercado Livre" enquanto a tabela mostrava outra coisa.
  const paramsBase = React.useMemo(() => ({
    periodo: filtros.periodo,
    situacao: filtros.situacao, canal: filtros.canal, deposito: filtros.deposito,
    fornecedor: filtros.fornecedor, categoria: filtros.categoria, vendedor: filtros.vendedor,
    ...selecao.comoParametros(),
  }), [filtros, chaveSelecao]);

  const params = React.useMemo(() => ({
    ...paramsBase,
    q: buscaDebounced,
    ordenar: grid.ordenar, direcao: grid.direcao,
    pagina: grid.pagina, limite: grid.limite,
  }), [paramsBase, buscaDebounced, grid.ordenar, grid.direcao, grid.pagina, grid.limite]);

  const recurso = tela.recurso!;
  const carga = useCarga<RespostaRecurso>(
    s => api.recurso(recurso, params, s),
    [recurso, JSON.stringify(params)],
  );

  // A série temporal só é buscada se a tela declarar um gráfico que a use.
  const precisaEvolucao = (tela.graficos ?? []).some(g => g.tipo === 'linha-tempo');
  const evolucao = useCarga<Evolucao>(
    s => api.evolucao({ ...paramsBase, granularidade: filtros.periodo === '12m' ? 'mes' : 'dia' }, s),
    [precisaEvolucao ? JSON.stringify(paramsBase) + filtros.periodo : 'sem-evolucao'],
  );

  const t = React.useMemo(() => tokens(document.querySelector('[data-bl-root]')), []);

  if (carga.erro) {
    return (
      <EstadoErro
        erro={carga.erro.message}
        correlationId={carga.erro.correlationId}
        quando={new Date().toLocaleString('pt-BR')}
        aoTentarNovamente={carga.recarregar}
      />
    );
  }

  if (!carga.dados && carga.carregando) {
    return <div style={{ padding: 4 }}><BlocoCarregando linhas={8} rotulo={`Carregando ${tela.titulo}`} /></div>;
  }

  const dados = carga.dados;
  const colunas = (dados?.colunas ?? []) as ColunaGrid[];
  const totais = dados?.totais ?? {};
  const facetas = dados?.facetas ?? {};
  const total = carga.meta?.total ?? 0;

  // Cross-filter (§54). Quando o campo é aceito pela API, a seleção é GLOBAL e o
  // recorte já vem do servidor — nada a filtrar aqui. Quando não é, o recorte é
  // local, sobre a página carregada, e a tela diz isso.
  const linhasBrutas = dados?.itens ?? [];
  const locais = selecao.selecoes.filter(sl => !CAMPOS_DA_API.includes(sl.campo));
  const linhas = locais.length === 0 ? linhasBrutas : linhasBrutas.filter(l =>
    locais.every(sl => String(l[sl.campo] ?? '') === sl.valor));

  const kpis = montarKpis(tela, linhasBrutas, totais, total);
  const filtroAtivo = Boolean(
    filtros.situacao || filtros.canal || filtros.categoria || filtros.fornecedor
    || filtros.vendedor || filtros.deposito || grid.busca || selecao.selecoes.length,
  );

  return (
    <div style={{ minWidth: 0 }}>
      <BarraFiltros
        filtros={filtros as any}
        aoMudar={aoMudarFiltros as any}
        facetas={facetas}
        camposExtras={tela.filtros}
        aoLimpar={() => {
          aoMudarFiltros({
            periodo: '30d', situacao: '', canal: '', deposito: '',
            fornecedor: '', categoria: '', vendedor: '',
          });
          selecao.limpar();
          setGrid(g => ({ ...g, busca: '', pagina: 1 }));
        }}
      />

      {tela.profundidade === 'estrutural' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0 12px',
          padding: '7px 11px', fontSize: 11.5, borderRadius: 'var(--bl-raio-sm)',
          background: 'var(--bl-superficie-2)', border: '1px solid var(--bl-borda)',
          color: 'var(--bl-texto-2)',
        }}>
          <span aria-hidden style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--bl-texto-3)' }} />
          Esta tela lê dados reais e está funcional, mas ainda não tem visualização
          dedicada. Está marcada como <strong style={{ color: 'var(--bl-texto)' }}>em construção</strong> na navegação.
        </div>
      )}

      {kpis.length > 0 && <GradeKpis kpis={kpis} />}

      {locais.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 12,
          padding: '7px 11px', fontSize: 12, borderRadius: 'var(--bl-raio-sm)',
          background: 'var(--bl-aviso-bg)', border: '1px solid var(--bl-aviso)',
        }}>
          <span>
            Recorte aplicado sobre a <strong>página carregada</strong> ({linhas.length} de {linhasBrutas.length}).
            Este campo não é filtrado pelo servidor — o total abaixo é o do conjunto sem esse recorte.
          </span>
        </div>
      )}

      {(tela.graficos ?? []).length > 0 && (
        <Secao titulo="Visualizações" descricao="Clique numa série para recortar a tabela abaixo.">
          <div style={{
            display: 'grid',
            gridTemplateColumns: larguraPainel < 980 ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 12,
          }}>
            {(tela.graficos ?? []).map((g, i) => (
              <div key={i} className="bl-cartao" style={{ padding: '11px 13px', minWidth: 0 }}>
                <div className="bl-titulo-secao" style={{ marginBottom: 6 }}>{g.titulo}</div>
                <RenderGrafico
                  spec={g} t={t} linhas={linhasBrutas} evolucao={evolucao.dados}
                  aoSelecionar={(campo, valor) => selecao.alternar({
                    // `campoSelecao` quando o rótulo do gráfico difere do campo
                    // que a API filtra (ex.: agrupa por `nome`, filtra por `canal`).
                    campo: ((g.campoSelecao ?? campo) as CampoSelecao),
                    valor, rotulo: valor, origem: tela.titulo,
                  })}
                />
              </div>
            ))}
          </div>
        </Secao>
      )}

      <Secao titulo="Registros">
        <DataGrid
          colunas={colunas}
          linhas={linhas}
          total={locais.length > 0 ? linhas.length : total}
          estado={grid}
          aoMudarEstado={p => setGrid(g => ({ ...g, ...p }))}
          carregando={carga.carregando}
          totais={totais}
          chavePreferencias={tela.id}
          selecionaveis={tela.selecionavel}
          filtroAtivo={filtroAtivo}
          alturaMax={larguraPainel < 980 ? 460 : 580}
          acoesEmLote={tela.selecionavel ? [{
            id: 'exportar-selecao',
            rotulo: 'Exportar seleção',
            aoExecutar: ids => exportarSelecao(colunas, linhas, ids, tela.id),
          }] : undefined}
        />
      </Secao>
    </div>
  );
}

/* ── Gráficos ─────────────────────────────────────────────── */

function RenderGrafico({ spec, t, linhas, evolucao, aoSelecionar }: {
  spec: GraficoSpec;
  t: ReturnType<typeof tokens>;
  linhas: Record<string, unknown>[];
  evolucao: Evolucao | null;
  aoSelecionar: (campo: string, valor: string) => void;
}) {
  if (spec.tipo === 'linha-tempo') {
    if (!evolucao) return <BlocoCarregando linhas={3} />;
    const series = evolucao.series.filter(s => (spec.series ?? []).includes(s.id));
    if (series.length === 0) {
      return <Grafico opcao={{}} vazio descricao="Sem séries para exibir" />;
    }
    return (
      <Grafico
        altura={230}
        opcao={opcaoLinhaTempo(t, series, spec.series?.includes('faturamento') ? evolucao.media_movel?.faturamento : undefined)}
        descricao={`Evolução de ${series.map(s => s.rotulo).join(', ')} ao longo do período.`}
      />
    );
  }

  const agregado = agregarPor(linhas, spec.por ?? '', spec.valor);
  if (agregado.length === 0) {
    return <Grafico opcao={{}} vazio descricao="Sem dados para este gráfico" />;
  }
  const limitado = spec.limite ? agregado.slice(0, spec.limite) : agregado;
  const formato = spec.valor ? 'moeda' : 'inteiro';
  const clique = (p: any) => aoSelecionar(spec.por!, String(p.name ?? p.data?.name ?? ''));

  switch (spec.tipo) {
    case 'pizza':
      return <Grafico altura={230} opcao={opcaoPizza(t, limitado, formato)} aoClicar={clique}
        descricao={`Participação de ${limitado.length} itens.`} />;
    case 'funil':
      return <Grafico altura={230}
        opcao={opcaoFunil(t, limitado.map(i => ({ rotulo: i.rotulo, quantidade: i.valor })))}
        aoClicar={clique}
        descricao={`Distribuição em ${limitado.length} etapas.`} />;
    case 'pareto':
      return <Grafico altura={250} opcao={opcaoPareto(t, limitado, formato)} aoClicar={clique}
        descricao={`Concentração acumulada entre ${limitado.length} itens.`} />;
    case 'dispersao': {
      const pontos = limitado.map(i => ({ rotulo: i.rotulo, x: i.valor, y: i.secundario ?? 0, tamanho: i.valor }));
      return <Grafico altura={240}
        opcao={opcaoDispersao(t, pontos, 'Valor', 'Margem %', 'moeda', 'percentual')}
        descricao={`Dispersão de ${pontos.length} itens.`} />;
    }
    default:
      return <Grafico altura={Math.max(180, Math.min(320, limitado.length * 26 + 40))}
        opcao={opcaoBarras(t, limitado, formato)} aoClicar={clique}
        descricao={`Comparação de ${limitado.length} itens.`} />;
  }
}

/**
 * Agrega as linhas da PÁGINA por um campo.
 * Limitação declarada de propósito: com paginação server-side, o gráfico reflete
 * a página carregada, não o conjunto inteiro. Para leitura do total existem as
 * telas de Curva ABC e Rentabilidade, que agregam no servidor.
 */
function agregarPor(
  linhas: Record<string, unknown>[],
  campo: string,
  campoValor?: string,
): { rotulo: string; valor: number; secundario?: number }[] {
  if (!campo) return [];
  const m = new Map<string, { valor: number; margem: number; n: number }>();
  for (const l of linhas) {
    const chave = String(l[campo] ?? '');
    if (!chave || chave === 'null' || chave === 'undefined') continue;
    const v = campoValor ? Number(l[campoValor] ?? 0) : 1;
    if (!Number.isFinite(v)) continue;
    const atual = m.get(chave) ?? { valor: 0, margem: 0, n: 0 };
    atual.valor += v;
    atual.margem += Number(l.margem_pct ?? 0);
    atual.n += 1;
    m.set(chave, atual);
  }
  return [...m.entries()]
    .map(([rotulo, d]) => ({ rotulo, valor: Math.round(d.valor * 100) / 100, secundario: d.n ? d.margem / d.n : 0 }))
    .sort((a, b) => b.valor - a.valor);
}

/* ── KPIs derivados ───────────────────────────────────────── */

function montarKpis(
  tela: TelaSpec,
  linhas: Record<string, unknown>[],
  totais: Record<string, number>,
  total: number,
): Kpi[] {
  if (!tela.kpis?.length) return [];

  return tela.kpis.map(k => {
    let valor = 0;

    if (k.agregacao === 'total') {
      valor = total;
    } else if (k.campo && totais[k.campo] !== undefined && k.agregacao === 'soma') {
      // O totalizador vem do SERVIDOR e cobre o conjunto filtrado inteiro —
      // é sempre preferível a somar a página.
      valor = totais[k.campo];
    } else if (k.campo) {
      const vals = linhas.map(l => Number(l[k.campo!] ?? 0)).filter(Number.isFinite);
      if (k.agregacao === 'soma') valor = vals.reduce((s, v) => s + v, 0);
      if (k.agregacao === 'media') valor = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }

    // Ticket médio é derivado, não somado.
    if (k.id === 'ticket' && k.agregacao === 'media' && totais[k.campo ?? ''] !== undefined && total > 0) {
      valor = totais[k.campo!] / total;
    }

    const soPagina = k.agregacao === 'media' && (!k.campo || totais[k.campo] === undefined);

    return {
      id: k.id,
      rotulo: k.rotulo,
      valor: Math.round(valor * 100) / 100,
      formato: k.formato as TipoFormato,
      variacao: null,
      tendencia: 'estavel',
      sparkline: null,
      drilldown: null,
      semantica: 'ok',
      tooltip: soPagina
        ? 'Média calculada sobre os registros da página atual.'
        : 'Calculado sobre todos os registros do recorte, no servidor.',
    } as Kpi;
  });
}

/* ── Exportação da seleção ────────────────────────────────── */

function exportarSelecao(
  colunas: ColunaGrid[], linhas: Record<string, unknown>[], ids: string[], nomeTela: string,
) {
  const sel = new Set(ids);
  const escolhidas = linhas.filter(l => sel.has(String(l.id ?? '')));
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = `﻿${colunas.map(c => esc(c.rotulo)).join(';')}\n`
    + escolhidas.map(l => colunas.map(c => esc(porTipo(l[c.id], (c.tipo ?? 'texto') as TipoFormato))).join(';')).join('\n');

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `bling-${nomeTela}-selecao-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
