// panel-bling/src/viz/Echarts.tsx — wrapper de ECharts com tema do módulo
// @version 1.0.0  @created 2026-07-30
//
// Importa apenas os módulos usados: o import completo do echarts leva ~1 MB e
// este painel tem 52 telas para carregar. `import()` sozinho NÃO garante
// lazy-load — o corte real vem de importar só o que é usado, e isso é verificado
// no tamanho do chunk depois do build.

import React from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, FunnelChart, ScatterChart, CustomChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  MarkLineComponent, TitleComponent, ToolboxComponent, BrushComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EstadoVazio } from '@shared';

echarts.use([
  LineChart, BarChart, PieChart, FunnelChart, ScatterChart, CustomChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  MarkLineComponent, TitleComponent, ToolboxComponent, BrushComponent,
  CanvasRenderer,
]);

/** Lê os tokens do CSS — o gráfico segue o tema sem duplicar paleta. */
export function tokens(el: HTMLElement | null) {
  const cs = getComputedStyle(el ?? document.documentElement);
  const v = (n: string, padrao: string) => (cs.getPropertyValue(n) || padrao).trim();
  return {
    texto:  v('--bl-texto', '#e8eaf2'),
    texto2: v('--bl-texto-2', '#a4abbd'),
    texto3: v('--bl-texto-3', '#6f7789'),
    borda:  v('--bl-borda', '#2a3042'),
    fundo:  v('--bl-superficie', '#1a1e2a'),
    serie: [
      v('--bl-serie-1', '#6fbe44'), v('--bl-serie-2', '#4aa3ff'),
      v('--bl-serie-3', '#f0b429'), v('--bl-serie-4', '#b07cf5'),
      v('--bl-serie-5', '#3ecf8e'), v('--bl-serie-6', '#f2555a'),
      v('--bl-serie-7', '#34c6d3'), v('--bl-serie-8', '#f58b4a'),
    ],
    sucesso: v('--bl-sucesso', '#3ecf8e'),
    aviso:   v('--bl-aviso', '#f0b429'),
    erro:    v('--bl-erro', '#f2555a'),
    verde:   v('--bl-verde', '#6fbe44'),
    neutro:  v('--bl-neutro', '#8b93a7'),
  };
}

export interface PropsGrafico {
  opcao: echarts.EChartsCoreOption;
  altura?: number;
  aoClicar?: (params: any) => void;
  /** Brush (§17): devolve o intervalo selecionado no eixo X, ou null ao limpar. */
  aoSelecionarIntervalo?: (intervalo: { de: string; ate: string } | null) => void;
  /** Categorias do eixo X — necessárias para traduzir índice em data no brush. */
  categorias?: string[];
  /** Descrição textual do gráfico para leitor de tela (§67). */
  descricao: string;
  vazio?: boolean;
}

export function Grafico({ opcao, altura = 260, aoClicar, aoSelecionarIntervalo,
                          categorias, descricao, vazio }: PropsGrafico) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inst = React.useRef<echarts.ECharts | null>(null);

  React.useEffect(() => {
    if (vazio || !ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    inst.current = chart;

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);

    return () => { ro.disconnect(); chart.dispose(); inst.current = null; };
  }, [vazio]);

  React.useEffect(() => {
    if (!inst.current) return;
    inst.current.setOption(opcao, true);
  }, [opcao]);

  React.useEffect(() => {
    const chart = inst.current;
    if (!chart || !aoClicar) return;
    chart.on('click', aoClicar);
    return () => { chart.off('click', aoClicar); };
  }, [aoClicar]);

  // Brush → intervalo de datas.
  //
  // O ECharts devolve ÍNDICES da categoria (`coordRange`), não datas. Sem a
  // lista de categorias não dá para traduzir — por isso `categorias` é exigida
  // junto de `aoSelecionarIntervalo`. Traduzir errado aqui produziria um filtro
  // de período silenciosamente deslocado, que é pior do que não ter brush.
  React.useEffect(() => {
    const chart = inst.current;
    if (!chart || !aoSelecionarIntervalo || !categorias?.length) return;

    const aoSelecionar = (params: any) => {
      const areas = params?.batch?.[0]?.areas ?? [];
      if (areas.length === 0) { aoSelecionarIntervalo(null); return; }
      const faixa = areas[0]?.coordRange;
      if (!Array.isArray(faixa)) return;
      const i = Math.max(0, Math.round(faixa[0]));
      const j = Math.min(categorias.length - 1, Math.round(faixa[1]));
      if (i > j) return;
      aoSelecionarIntervalo({ de: categorias[i], ate: categorias[j] });
    };

    chart.on('brushEnd', aoSelecionar);
    return () => { chart.off('brushEnd', aoSelecionar); };
  }, [aoSelecionarIntervalo, categorias]);

  // Redesenha quando o tema muda: os tokens do CSS mudam, o canvas não.
  React.useEffect(() => {
    const alvo = document.documentElement;
    const obs = new MutationObserver(() => {
      // O ciclo seguinte já lê os tokens novos.
      inst.current?.setOption(opcao, true);
    });
    obs.observe(alvo, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => obs.disconnect();
  }, [opcao]);

  if (vazio) {
    return <EstadoVazio titulo="Sem dados para este gráfico"
      descricao="Não há registros no recorte selecionado." />;
  }

  return (
    <>
      <div ref={ref} style={{ width: '100%', height: altura, minWidth: 0 }} role="img" aria-label={descricao} />
      <span className="bl-so-leitor">{descricao}</span>
    </>
  );
}

/* ── Construtores de opção ─────────────────────────────────── */

const eixoBase = (t: ReturnType<typeof tokens>) => ({
  axisLine:  { lineStyle: { color: t.borda } },
  axisTick:  { show: false },
  axisLabel: { color: t.texto3, fontSize: 10 },
  splitLine: { lineStyle: { color: t.borda, type: 'dashed' as const } },
});

const tooltipBase = (t: ReturnType<typeof tokens>) => ({
  backgroundColor: t.fundo,
  borderColor: t.borda,
  textStyle: { color: t.texto, fontSize: 11.5 },
  extraCssText: 'box-shadow:0 4px 18px rgba(0,0,0,.3);border-radius:8px;',
});

export function fmtValor(v: number, formato: string): string {
  if (formato === 'moeda') {
    return v >= 10000 || v <= -10000
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)
      : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }
  if (formato === 'percentual') return `${v.toFixed(1).replace('.', ',')}%`;
  if (formato === 'inteiro') return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v);
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v);
}

/** Série temporal com eixo duplo, zoom e média móvel (§17). */
export function opcaoLinhaTempo(
  t: ReturnType<typeof tokens>,
  series: { id: string; rotulo: string; formato: string; eixo: string; pontos: { data: string; valor: number }[] }[],
  mediaMovel?: { data: string; valor: number }[],
  opcoes: { acumulado?: boolean; marcacoes?: { data: string; rotulo: string }[] } = {},
): echarts.EChartsCoreOption {
  const datas = series[0]?.pontos.map(p => p.data) ?? [];
  const temDireita = series.some(s => s.eixo === 'direita');

  // Acumulado (§17): soma corrida. Útil para responder "quanto já fechamos no
  // mês" — a série diária sozinha não responde isso.
  const transformar = (pontos: { data: string; valor: number }[]) => {
    if (!opcoes.acumulado) return pontos.map(p => p.valor);
    let soma = 0;
    return pontos.map(p => (soma += p.valor));
  };

  const dados: any[] = series.map((s, i) => ({
    name: s.rotulo,
    type: 'line',
    smooth: 0.24,
    symbol: 'none',
    yAxisIndex: s.eixo === 'direita' ? 1 : 0,
    lineStyle: { width: 1.8 },
    areaStyle: i === 0 ? {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: `${t.serie[0]}44` }, { offset: 1, color: `${t.serie[0]}00` },
      ]),
    } : undefined,
    data: transformar(s.pontos),
    _formato: s.formato,
  }));

  // Marcação de eventos (§17): linhas verticais rotuladas sobre a série.
  if (opcoes.marcacoes?.length && dados[0]) {
    const datas = series[0]?.pontos.map(p => p.data) ?? [];
    dados[0].markLine = {
      silent: true, symbol: 'none',
      lineStyle: { color: t.texto3, type: 'dashed', width: 1 },
      label: { color: t.texto3, fontSize: 9, formatter: (p: any) => p.name },
      data: opcoes.marcacoes
        .filter(m => datas.includes(m.data))
        .map(m => ({ xAxis: m.data, name: m.rotulo })),
    };
  }

  if (mediaMovel?.length) {
    dados.push({
      name: 'Média móvel (7)',
      type: 'line', smooth: true, symbol: 'none',
      lineStyle: { width: 1.4, type: 'dashed', color: t.texto3 },
      data: transformar(mediaMovel),
      _formato: 'moeda',
    });
  }

  const formatos = new Map(series.map(s => [s.rotulo, s.formato]));
  formatos.set('Média móvel (7)', 'moeda');

  return {
    color: t.serie,
    grid: { left: 8, right: temDireita ? 8 : 12, top: 34, bottom: 44, containLabel: true },
    legend: { textStyle: { color: t.texto2, fontSize: 11 }, top: 0, itemHeight: 8, itemWidth: 14 },
    tooltip: {
      trigger: 'axis',
      ...tooltipBase(t),
      formatter: (ps: any[]) => {
        const cab = `<div style="font-weight:600;margin-bottom:4px">${ps[0]?.axisValue ?? ''}</div>`;
        return cab + ps.map(p =>
          `<div style="display:flex;gap:8px;justify-content:space-between">
             <span>${p.marker} ${p.seriesName}</span>
             <strong>${fmtValor(p.value, formatos.get(p.seriesName) ?? 'numero')}</strong>
           </div>`).join('');
      },
    },
    // Brush (§17): arrastar sobre o gráfico seleciona um intervalo. O evento
    // `brushselected` é ouvido pela tela, que converte a seleção num período.
    toolbox: {
      show: true, right: 4, top: 0, itemSize: 13,
      iconStyle: { borderColor: t.texto3 },
      emphasis: { iconStyle: { borderColor: t.verde } },
      feature: {
        brush: { type: ['lineX', 'clear'],
                 title: { lineX: 'Selecionar intervalo', clear: 'Limpar seleção' } },
        saveAsImage: { title: 'Baixar imagem', name: 'bling-evolucao',
                       backgroundColor: t.fundo, pixelRatio: 2 },
      },
    },
    brush: { toolbox: ['lineX', 'clear'], xAxisIndex: 0,
             throttleType: 'debounce', throttleDelay: 300,
             brushStyle: { color: `${t.verde}22`, borderColor: t.verde } },
    dataZoom: [
      { type: 'inside', throttle: 60 },
      { type: 'slider', height: 16, bottom: 6, borderColor: t.borda,
        fillerColor: `${t.verde}22`, handleStyle: { color: t.verde },
        textStyle: { color: t.texto3, fontSize: 9 } },
    ],
    xAxis: { type: 'category', boundaryGap: false, data: datas, ...eixoBase(t), splitLine: { show: false } },
    yAxis: temDireita
      ? [
          { type: 'value', ...eixoBase(t), axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'moeda') } },
          { type: 'value', ...eixoBase(t), splitLine: { show: false },
            axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'inteiro') } },
        ]
      : [{ type: 'value', ...eixoBase(t), axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'moeda') } }],
    series: dados,
  };
}

/** Barras horizontais ordenadas — a forma mais legível para ranking categórico. */
export function opcaoBarras(
  t: ReturnType<typeof tokens>,
  itens: { rotulo: string; valor: number }[],
  formato = 'moeda',
): echarts.EChartsCoreOption {
  const ord = [...itens].sort((a, b) => a.valor - b.valor);
  return {
    color: [t.serie[0]],
    grid: { left: 8, right: 44, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item', ...tooltipBase(t),
      formatter: (p: any) => `${p.name}<br/><strong>${fmtValor(p.value, formato)}</strong>`,
    },
    xAxis: { type: 'value', ...eixoBase(t), axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, formato) } },
    yAxis: {
      type: 'category', data: ord.map(i => i.rotulo), ...eixoBase(t),
      splitLine: { show: false },
      axisLabel: { ...eixoBase(t).axisLabel, width: 130, overflow: 'truncate' },
    },
    series: [{
      type: 'bar', data: ord.map(i => i.valor),
      itemStyle: { borderRadius: [0, 3, 3, 0] },
      barMaxWidth: 16,
      label: { show: true, position: 'right', color: t.texto2, fontSize: 10,
        formatter: (p: any) => fmtValor(p.value, formato) },
    }],
  };
}

/** Rosca com participação — usada só quando as fatias são poucas e comparáveis. */
export function opcaoPizza(
  t: ReturnType<typeof tokens>,
  itens: { rotulo: string; valor: number }[],
  formato = 'moeda',
): echarts.EChartsCoreOption {
  return {
    color: t.serie,
    tooltip: {
      trigger: 'item', ...tooltipBase(t),
      formatter: (p: any) => `${p.name}<br/><strong>${fmtValor(p.value, formato)}</strong> (${p.percent}%)`,
    },
    legend: { type: 'scroll', orient: 'vertical', right: 0, top: 'center',
      textStyle: { color: t.texto2, fontSize: 11 }, itemHeight: 8, itemWidth: 12 },
    series: [{
      type: 'pie', radius: ['52%', '76%'], center: ['36%', '50%'],
      avoidLabelOverlap: true, label: { show: false },
      itemStyle: { borderColor: t.fundo, borderWidth: 2 },
      data: itens.map(i => ({ name: i.rotulo, value: i.valor })),
    }],
  };
}

/** Funil com perda entre etapas (§31). */
export function opcaoFunil(
  t: ReturnType<typeof tokens>,
  etapas: { rotulo: string; quantidade: number; valor?: number; perda?: number; conversao?: number }[],
): echarts.EChartsCoreOption {
  return {
    color: t.serie,
    tooltip: {
      trigger: 'item', ...tooltipBase(t),
      formatter: (p: any) => {
        const e = etapas[p.dataIndex];
        const linhas = [`<div style="font-weight:600">${e.rotulo}</div>`,
          `${fmtValor(e.quantidade, 'inteiro')} registro(s)`];
        if (e.valor !== undefined) linhas.push(fmtValor(e.valor, 'moeda'));
        if (e.conversao !== undefined && p.dataIndex > 0) {
          linhas.push(`conversão: ${e.conversao.toFixed(1).replace('.', ',')}%`);
        }
        if (e.perda) linhas.push(`<span style="color:${t.erro}">perda: ${e.perda}</span>`);
        return linhas.join('<br/>');
      },
    },
    series: [{
      type: 'funnel', left: 8, right: 8, top: 8, bottom: 8,
      minSize: '22%', gap: 2, sort: 'none',
      label: { show: true, position: 'inside', color: '#fff', fontSize: 11,
        formatter: (p: any) => `${p.name}: ${fmtValor(p.value, 'inteiro')}` },
      itemStyle: { borderColor: t.fundo, borderWidth: 1 },
      data: etapas.map(e => ({ name: e.rotulo, value: e.quantidade })),
    }],
  };
}

/** Pareto: barras + curva acumulada. A linha de 80% é o corte da classe A. */
export function opcaoPareto(
  t: ReturnType<typeof tokens>,
  itens: { rotulo: string; valor: number; acumulado_pct?: number }[],
  formato = 'moeda',
): echarts.EChartsCoreOption {
  const total = itens.reduce((s, i) => s + i.valor, 0);
  let acc = 0;
  const acumulado = itens.map(i => {
    acc += i.valor;
    return total > 0 ? Number(((acc / total) * 100).toFixed(2)) : 0;
  });

  return {
    color: [t.serie[0], t.serie[2]],
    grid: { left: 8, right: 8, top: 30, bottom: 8, containLabel: true },
    legend: { textStyle: { color: t.texto2, fontSize: 11 }, top: 0, itemHeight: 8, itemWidth: 14 },
    tooltip: { trigger: 'axis', ...tooltipBase(t) },
    xAxis: { type: 'category', data: itens.map(i => i.rotulo), ...eixoBase(t),
      splitLine: { show: false },
      axisLabel: { ...eixoBase(t).axisLabel, rotate: 38, width: 92, overflow: 'truncate' } },
    yAxis: [
      { type: 'value', ...eixoBase(t), axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, formato) } },
      { type: 'value', max: 100, ...eixoBase(t), splitLine: { show: false },
        axisLabel: { ...eixoBase(t).axisLabel, formatter: '{value}%' } },
    ],
    series: [
      { name: 'Valor', type: 'bar', data: itens.map(i => i.valor),
        itemStyle: { borderRadius: [3, 3, 0, 0] }, barMaxWidth: 22 },
      { name: 'Acumulado', type: 'line', yAxisIndex: 1, data: acumulado,
        smooth: true, symbol: 'circle', symbolSize: 4, lineStyle: { width: 1.8 },
        markLine: {
          silent: true, symbol: 'none',
          data: [{ yAxis: 80, label: { formatter: '80%', color: t.texto3, fontSize: 10 },
            lineStyle: { color: t.texto3, type: 'dashed' } }],
        } },
    ],
  };
}

/** Dispersão — usada em margem × volume e pontualidade × volume. */
export function opcaoDispersao(
  t: ReturnType<typeof tokens>,
  itens: { rotulo: string; x: number; y: number; tamanho?: number }[],
  rotuloX: string, rotuloY: string,
  formatoX = 'moeda', formatoY = 'percentual',
): echarts.EChartsCoreOption {
  const maxT = Math.max(1, ...itens.map(i => i.tamanho ?? 1));
  return {
    color: [t.serie[1]],
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item', ...tooltipBase(t),
      formatter: (p: any) => {
        const i = itens[p.dataIndex];
        return `<div style="font-weight:600">${i.rotulo}</div>
          ${rotuloX}: ${fmtValor(i.x, formatoX)}<br/>${rotuloY}: ${fmtValor(i.y, formatoY)}`;
      },
    },
    xAxis: { type: 'value', name: rotuloX, nameTextStyle: { color: t.texto3, fontSize: 10 },
      ...eixoBase(t), axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, formatoX) } },
    yAxis: { type: 'value', name: rotuloY, nameTextStyle: { color: t.texto3, fontSize: 10 },
      ...eixoBase(t), axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, formatoY) } },
    series: [{
      type: 'scatter',
      symbolSize: (_: unknown, p: any) => 6 + ((itens[p.dataIndex]?.tamanho ?? 1) / maxT) * 18,
      itemStyle: { opacity: .72 },
      data: itens.map(i => [i.x, i.y]),
    }],
  };
}

/** Waterfall de rentabilidade (§40). Implementado com barra empilhada invisível. */
export function opcaoWaterfall(
  t: ReturnType<typeof tokens>,
  passos: { rotulo: string; valor: number; tipo: string }[],
): echarts.EChartsCoreOption {
  const base: number[] = [];
  const positivos: (number | string)[] = [];
  const negativos: (number | string)[] = [];
  let acumulado = 0;

  passos.forEach(p => {
    if (p.tipo === 'inicial' || p.tipo === 'final') {
      base.push(0);
      positivos.push(Math.abs(p.valor));
      negativos.push('-');
      acumulado = p.tipo === 'inicial' ? p.valor : acumulado;
      return;
    }
    const v = p.valor;           // já vem negativo nas reduções
    base.push(acumulado + v);
    positivos.push('-');
    negativos.push(Math.abs(v));
    acumulado += v;
  });

  return {
    grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipBase(t),
      formatter: (ps: any[]) => {
        const i = ps[0]?.dataIndex ?? 0;
        const p = passos[i];
        return `<div style="font-weight:600">${p.rotulo}</div>${fmtValor(p.valor, 'moeda')}`;
      },
    },
    xAxis: { type: 'category', data: passos.map(p => p.rotulo), ...eixoBase(t),
      splitLine: { show: false },
      axisLabel: { ...eixoBase(t).axisLabel, rotate: 26, width: 86, overflow: 'truncate' } },
    yAxis: { type: 'value', ...eixoBase(t),
      axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'moeda') } },
    series: [
      { name: 'base', type: 'bar', stack: 'w', silent: true,
        itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } },
        data: base },
      { name: 'valor', type: 'bar', stack: 'w', barMaxWidth: 34,
        itemStyle: { color: t.verde, borderRadius: [3, 3, 0, 0] }, data: positivos },
      { name: 'reducao', type: 'bar', stack: 'w', barMaxWidth: 34,
        itemStyle: { color: t.erro, borderRadius: [3, 3, 0, 0] }, data: negativos },
    ],
  };
}


/**
 * Barras empilhadas horizontais com faixas semânticas.
 * Usada em cobertura de estoque (§24.2) e aging: cada faixa tem cor própria e a
 * leitura é "quanto do meu capital está em cada situação".
 */
export function opcaoFaixas(
  t: ReturnType<typeof tokens>,
  faixas: { rotulo: string; itens: number; valor: number; cor?: string }[],
  metrica: 'itens' | 'valor' = 'valor',
): echarts.EChartsCoreOption {
  const cor = (c?: string) => ({
    erro: t.erro, aviso: t.aviso, sucesso: t.sucesso,
    info: t.serie[1], neutro: t.neutro,
  } as Record<string, string>)[c ?? 'neutro'] ?? t.neutro;

  const formato = metrica === 'valor' ? 'moeda' : 'inteiro';

  return {
    grid: { left: 8, right: 52, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item', ...tooltipBase(t),
      formatter: (p: any) => {
        const f = faixas[p.dataIndex];
        return `<div style="font-weight:600">${f.rotulo}</div>`
             + `${fmtValor(f.itens, 'inteiro')} item(ns)<br/>`
             + `${fmtValor(f.valor, 'moeda')} em estoque`;
      },
    },
    xAxis: { type: 'value', ...eixoBase(t),
      axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, formato) } },
    yAxis: { type: 'category', data: faixas.map(f => f.rotulo).reverse(), ...eixoBase(t),
      splitLine: { show: false },
      axisLabel: { ...eixoBase(t).axisLabel, width: 120, overflow: 'truncate' } },
    series: [{
      type: 'bar', barMaxWidth: 18,
      itemStyle: { borderRadius: [0, 3, 3, 0] },
      label: { show: true, position: 'right', color: t.texto2, fontSize: 10,
        formatter: (p: any) => fmtValor(p.value, formato) },
      data: [...faixas].reverse().map(f => ({
        value: metrica === 'valor' ? f.valor : f.itens,
        itemStyle: { color: cor(f.cor) },
      })),
    }],
  };
}

/**
 * Histograma de distribuição — usado em prazo de entrega (§39).
 * Barras verticais simples: a leitura é a FORMA da distribuição, não o valor de
 * cada barra. Cauda longa à direita significa entrega imprevisível.
 */
export function opcaoDistribuicao(
  t: ReturnType<typeof tokens>,
  faixas: { rotulo: string; envios: number }[],
): echarts.EChartsCoreOption {
  const total = faixas.reduce((s, f) => s + f.envios, 0) || 1;
  return {
    color: [t.serie[1]],
    grid: { left: 8, right: 8, top: 12, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item', ...tooltipBase(t),
      formatter: (p: any) => `${p.name}<br/><strong>${fmtValor(p.value, 'inteiro')}</strong> `
        + `(${((p.value / total) * 100).toFixed(1).replace('.', ',')}%)`,
    },
    xAxis: { type: 'category', data: faixas.map(f => f.rotulo), ...eixoBase(t),
      splitLine: { show: false } },
    yAxis: { type: 'value', ...eixoBase(t),
      axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'inteiro') } },
    series: [{
      type: 'bar', barMaxWidth: 46,
      itemStyle: { borderRadius: [3, 3, 0, 0] },
      label: { show: true, position: 'top', color: t.texto2, fontSize: 10 },
      data: faixas.map(f => f.envios),
    }],
  };
}

/**
 * Prometido × realizado (§39). Duas barras lado a lado por transportadora.
 * Mostrar os dois juntos é o ponto: o prazo realizado sozinho não diz se a
 * transportadora cumpriu o que prometeu.
 */
export function opcaoPrometidoRealizado(
  t: ReturnType<typeof tokens>,
  itens: { transportadora: string; prometido: number; realizado: number | null }[],
): echarts.EChartsCoreOption {
  const comDados = itens.filter(i => i.realizado !== null);
  return {
    color: [t.texto3, t.serie[0]],
    grid: { left: 8, right: 8, top: 30, bottom: 8, containLabel: true },
    legend: { textStyle: { color: t.texto2, fontSize: 11 }, top: 0, itemHeight: 8, itemWidth: 14 },
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipBase(t),
      formatter: (ps: any[]) => {
        const i = comDados[ps[0]?.dataIndex ?? 0];
        const desvio = (i.realizado ?? 0) - i.prometido;
        const cor = desvio > 0 ? t.erro : t.sucesso;
        return `<div style="font-weight:600">${i.transportadora}</div>`
             + `prometido: ${i.prometido} dia(s)<br/>`
             + `realizado: ${i.realizado} dia(s)<br/>`
             + `<span style="color:${cor}">desvio: ${desvio > 0 ? '+' : ''}${desvio.toFixed(1).replace('.', ',')} dia(s)</span>`;
      },
    },
    xAxis: { type: 'category', data: comDados.map(i => i.transportadora), ...eixoBase(t),
      splitLine: { show: false },
      axisLabel: { ...eixoBase(t).axisLabel, width: 90, overflow: 'truncate' } },
    yAxis: { type: 'value', name: 'dias', nameTextStyle: { color: t.texto3, fontSize: 10 },
      ...eixoBase(t) },
    series: [
      { name: 'Prometido', type: 'bar', barMaxWidth: 20,
        itemStyle: { borderRadius: [3, 3, 0, 0], opacity: .55 },
        data: comDados.map(i => i.prometido) },
      { name: 'Realizado', type: 'bar', barMaxWidth: 20,
        itemStyle: { borderRadius: [3, 3, 0, 0] },
        data: comDados.map(i => i.realizado) },
    ],
  };
}

/**
 * Preço, custo e volume no mesmo eixo temporal (§26.1).
 * Volume em barras no eixo direito; preço e custo em linha no esquerdo. A área
 * entre preço e custo É a margem — por isso as duas linhas ficam juntas.
 */
export function opcaoPrecoCusto(
  t: ReturnType<typeof tokens>,
  pontos: { data: string; preco: number; custo: number; unidades: number }[],
): echarts.EChartsCoreOption {
  return {
    color: [t.serie[0], t.erro, t.serie[1]],
    grid: { left: 8, right: 8, top: 30, bottom: 8, containLabel: true },
    legend: { textStyle: { color: t.texto2, fontSize: 11 }, top: 0, itemHeight: 8, itemWidth: 14 },
    tooltip: {
      trigger: 'axis', ...tooltipBase(t),
      formatter: (ps: any[]) => {
        const p = pontos[ps[0]?.dataIndex ?? 0];
        const margem = p.preco > 0 ? ((p.preco - p.custo) / p.preco) * 100 : 0;
        return `<div style="font-weight:600;margin-bottom:4px">${p.data}</div>`
             + `preço: ${fmtValor(p.preco, 'moeda')}<br/>`
             + `custo: ${fmtValor(p.custo, 'moeda')}<br/>`
             + `margem: ${margem.toFixed(1).replace('.', ',')}%<br/>`
             + `<strong>${fmtValor(p.unidades, 'inteiro')} unidade(s)</strong>`;
      },
    },
    xAxis: { type: 'category', data: pontos.map(p => p.data), ...eixoBase(t),
      splitLine: { show: false } },
    yAxis: [
      { type: 'value', ...eixoBase(t),
        axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'moeda') } },
      { type: 'value', ...eixoBase(t), splitLine: { show: false },
        axisLabel: { ...eixoBase(t).axisLabel, formatter: (v: number) => fmtValor(v, 'inteiro') } },
    ],
    series: [
      { name: 'Preço', type: 'line', symbol: 'none', lineStyle: { width: 2 },
        data: pontos.map(p => p.preco) },
      { name: 'Custo', type: 'line', symbol: 'none',
        lineStyle: { width: 1.6, type: 'dashed' },
        areaStyle: { color: `${t.serie[0]}14` },
        data: pontos.map(p => p.custo) },
      { name: 'Unidades vendidas', type: 'bar', yAxisIndex: 1, barMaxWidth: 14,
        itemStyle: { borderRadius: [2, 2, 0, 0], opacity: .75 },
        data: pontos.map(p => p.unidades) },
    ],
  };
}
