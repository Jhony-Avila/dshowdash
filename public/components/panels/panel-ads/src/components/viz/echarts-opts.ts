// components/viz/echarts-opts.ts — builders de opção ECharts padronizados (Fase 2).
// @version 1.0.0  @created 2026-07-22
//
// Cada builder recebe a paleta resolvida (useTokensAds) + dados e devolve uma opção
// ECharts pronta, coerente com o tema (dark/light), com tooltip rico, animação suave,
// legenda interativa nativa e — quando faz sentido — dataZoom. Assim as telas montam
// gráficos ricos em 1-2 linhas e o visual fica uniforme em todo o módulo.
//
// Convenção: `fmt` é um formatador de valor (number → string). Por padrão inteiro
// pt-BR; passe `moeda`, `razao`, `pct`, etc. de lib/format nas telas.
import type { PaletaAds } from '../../shell/useShellTheme';

export type Opcao = Record<string, unknown>;
export type Fmt = (v: number) => string;

const numBR = (v: number) => (v ?? 0).toLocaleString('pt-BR');

/** Base comum: fontes, tooltip, grid e paleta coerentes com o tema. */
export function baseAds(p: PaletaAds): Opcao {
  return {
    color: p.seq,
    textStyle: { color: p.text, fontFamily: 'inherit', fontSize: 12 },
    animationDuration: 520,
    animationEasing: 'cubicOut',
    tooltip: {
      backgroundColor: p.surface,
      borderColor: p.border,
      borderWidth: 1,
      textStyle: { color: p.text, fontSize: 12 },
      confine: true,
      extraCssText: 'border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);',
    },
    grid: { left: 10, right: 16, top: 22, bottom: 10, containLabel: true },
  };
}

function eixoX(p: PaletaAds, labels: string[], opts: { boundaryGap?: boolean } = {}): Opcao {
  return {
    type: 'category',
    data: labels,
    boundaryGap: opts.boundaryGap ?? false,
    axisLine: { lineStyle: { color: p.border } },
    axisTick: { show: false },
    axisLabel: { color: p.textDim, hideOverlap: true },
  };
}

function eixoY(p: PaletaAds, fmt: Fmt, opts: { nome?: string } = {}): Opcao {
  return {
    type: 'value',
    name: opts.nome,
    nameTextStyle: { color: p.textDim, padding: [0, 0, 0, -28] },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: p.border, type: 'dashed', opacity: 0.55 } },
    axisLabel: { color: p.textDim, formatter: (v: number) => fmt(v) },
  };
}

function gradiente(cor: string, topo = 0.28, base = 0.02): Opcao {
  return {
    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: mix(cor, topo) },
      { offset: 1, color: mix(cor, base) },
    ],
  };
}
// mistura simples com alpha (cor sólida hex/rgb → rgba aproximado via opacity CSS não serve
// em canvas; usamos color-mix-like via rgba quando possível, senão a própria cor com opacidade).
function mix(cor: string, alpha: number): string {
  return `color-mix(in srgb, ${cor} ${Math.round(alpha * 100)}%, transparent)`;
}

export interface Serie { name: string; data: number[]; cor?: string; }

/** Linhas/área multi-série (evolução temporal). §7/§9 */
export function optArea(p: PaletaAds, labels: string[], series: Serie[], fmt: Fmt = numBR, opts: { area?: boolean; zoom?: boolean; nomeY?: string } = {}): Opcao {
  const area = opts.area ?? true;
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: p.border } },
      valueFormatter: (v: number) => fmt(v) },
    legend: series.length > 1 ? { top: 0, right: 8, textStyle: { color: p.textDim }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 } : undefined,
    grid: { left: 10, right: 16, top: series.length > 1 ? 34 : 22, bottom: opts.zoom ? 42 : 10, containLabel: true },
    xAxis: eixoX(p, labels),
    yAxis: eixoY(p, fmt, { nome: opts.nomeY }),
    dataZoom: opts.zoom ? [
      { type: 'inside', throttle: 60 },
      { type: 'slider', height: 18, bottom: 8, borderColor: p.border, fillerColor: mix(p.primary, 0.14),
        handleStyle: { color: p.primary }, textStyle: { color: p.textDim }, dataBackground: { lineStyle: { color: p.border } } },
    ] : undefined,
    series: series.map((s, i) => {
      const cor = s.cor ?? p.seq[i % p.seq.length];
      return {
        name: s.name, type: 'line', smooth: 0.32, symbol: 'circle', symbolSize: 6, showSymbol: false,
        emphasis: { focus: 'series' }, lineStyle: { width: 2.2, color: cor }, itemStyle: { color: cor },
        areaStyle: area ? { color: gradiente(cor), opacity: 1 } : undefined, data: s.data,
      };
    }),
  };
}

/** Barras (horizontais por padrão) — rankings, distribuições. §29 */
export function optBarras(p: PaletaAds, categorias: string[], valores: number[], fmt: Fmt = numBR, opts: { horizontal?: boolean; cor?: string; cores?: string[] } = {}): Opcao {
  const h = opts.horizontal ?? true;
  const cat = eixoX(p, categorias, { boundaryGap: true });
  const val = eixoY(p, fmt);
  const raio = h ? [0, 5, 5, 0] : [5, 5, 0, 0];
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => fmt(v) },
    grid: { left: 10, right: 20, top: 14, bottom: 8, containLabel: true },
    xAxis: h ? val : cat,
    yAxis: h ? { ...cat, inverse: true } : val,
    series: [{
      type: 'bar', data: valores.map((v, i) => ({ value: v, itemStyle: { color: opts.cores?.[i] ?? opts.cor ?? p.primary, borderRadius: raio } })),
      barWidth: '60%', emphasis: { itemStyle: { color: p.primaryH } },
    }],
  };
}

/** Colunas verticais (atalho de optBarras horizontal=false). */
export function optColunas(p: PaletaAds, categorias: string[], valores: number[], fmt: Fmt = numBR, opts: { cor?: string; cores?: string[] } = {}): Opcao {
  return optBarras(p, categorias, valores, fmt, { ...opts, horizontal: false });
}

/** Colunas empilhadas (stacked) multi-série — composição ao longo de uma categoria
 *  (ex.: alterações por dia empilhadas por origem). Legenda interativa + tooltip por eixo. */
export function optColunasEmpilhadas(p: PaletaAds, categorias: string[], series: Serie[], fmt: Fmt = numBR, opts: { nomeY?: string } = {}): Opcao {
  const n = series.length;
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => fmt(v) },
    legend: n > 1 ? { top: 0, right: 8, textStyle: { color: p.textDim }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 } : undefined,
    grid: { left: 10, right: 16, top: n > 1 ? 34 : 18, bottom: 8, containLabel: true },
    xAxis: eixoX(p, categorias, { boundaryGap: true }),
    yAxis: eixoY(p, fmt, { nome: opts.nomeY }),
    series: series.map((s, i) => {
      const cor = s.cor ?? p.seq[i % p.seq.length];
      const ultima = i === n - 1;
      return {
        name: s.name, type: 'bar', stack: 'total', barWidth: '62%',
        emphasis: { focus: 'series' },
        itemStyle: { color: cor, borderRadius: ultima ? [4, 4, 0, 0] : [0, 0, 0, 0] },
        data: s.data,
      };
    }),
  };
}

export interface ItemDonut { name: string; value: number; cor?: string; }

/** Donut com legenda interativa e rótulo central. */
export function optDonut(p: PaletaAds, itens: ItemDonut[], fmt: Fmt = numBR, opts: { titulo?: string } = {}): Opcao {
  const total = itens.reduce((a, b) => a + (b.value || 0), 0);
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'item',
      formatter: (o: { name: string; value: number; percent: number; marker: string }) =>
        `${o.marker} ${o.name}<br/><b>${fmt(o.value)}</b> · ${o.percent}%` },
    legend: { type: 'scroll', orient: 'vertical', right: 6, top: 'middle', textStyle: { color: p.textDim }, icon: 'circle', itemWidth: 9, itemHeight: 9 },
    series: [{
      type: 'pie', radius: ['52%', '76%'], center: ['38%', '50%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: p.surface, borderWidth: 2, borderRadius: 5 },
      label: { show: !!opts.titulo, position: 'center', color: p.text, fontSize: 13,
        formatter: () => opts.titulo ? `{t|${opts.titulo}}\n{v|${fmt(total)}}` : '',
        rich: { t: { color: p.textDim, fontSize: 11, padding: [0, 0, 4, 0] }, v: { color: p.text, fontSize: 18, fontWeight: 700 } } },
      labelLine: { show: false }, emphasis: { scale: true, scaleSize: 6 },
      data: itens.map((it, i) => ({ name: it.name, value: it.value, itemStyle: { color: it.cor ?? p.seq[i % p.seq.length] } })),
    }],
  };
}

export interface PassoFunil { label: string; value: number; }

/** Funil (§18) — passos decrescentes. */
export function optFunil(p: PaletaAds, passos: PassoFunil[], fmt: Fmt = numBR): Opcao {
  const max = Math.max(...passos.map((s) => s.value), 1);
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'item',
      formatter: (o: { name: string; value: number; marker: string }) => `${o.marker} ${o.name}<br/><b>${fmt(o.value)}</b>` },
    series: [{
      type: 'funnel', min: 0, max, gap: 2, left: '6%', right: '6%', top: 10, bottom: 10,
      minSize: '18%', maxSize: '100%', sort: 'descending',
      label: { color: p.text, formatter: (o: { name: string; value: number }) => `${o.name}: ${fmt(o.value)}` },
      itemStyle: { borderColor: p.surface, borderWidth: 2 },
      emphasis: { label: { fontWeight: 700 } },
      data: passos.map((s, i) => ({ name: s.label, value: s.value, itemStyle: { color: p.seq[i % p.seq.length] } })),
    }],
  };
}

/** Gauge (§25 Quality Score, pacing). */
export function optGauge(p: PaletaAds, valor: number, opts: { min?: number; max?: number; titulo?: string; fmt?: Fmt; faixas?: [number, string][] } = {}): Opcao {
  const min = opts.min ?? 0, max = opts.max ?? 10;
  const fmt = opts.fmt ?? ((v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }));
  const faixas = opts.faixas ?? [[0.4, p.danger], [0.7, p.warn], [1, p.ok]];
  return {
    ...baseAds(p),
    series: [{
      type: 'gauge', min, max, startAngle: 210, endAngle: -30, radius: '92%', center: ['50%', '58%'],
      progress: { show: true, width: 12, roundCap: true },
      axisLine: { lineStyle: { width: 12, color: faixas.map(([stop, cor]) => [stop, cor]) } },
      pointer: { width: 4, length: '62%', itemStyle: { color: p.text } },
      anchor: { show: true, size: 10, itemStyle: { color: p.text } },
      axisTick: { distance: -16, splitNumber: 5, lineStyle: { color: p.textDim, width: 1 } },
      splitLine: { distance: -18, length: 8, lineStyle: { color: p.textDim, width: 1.5 } },
      axisLabel: { distance: -8, color: p.textDim, fontSize: 10 },
      title: { show: !!opts.titulo, offsetCenter: [0, '26%'], color: p.textDim, fontSize: 12 },
      detail: { valueAnimation: true, offsetCenter: [0, '2%'], color: p.text, fontSize: 26, fontWeight: 700,
        formatter: (v: number) => fmt(v) },
      data: [{ value: valor, name: opts.titulo ?? '' }],
    }],
  };
}

/** Heatmap dia×hora (§21) e similares. celulas: [ix, iy, valor]. */
export function optHeatmap(p: PaletaAds, xs: string[], ys: string[], celulas: [number, number, number][], fmt: Fmt = numBR, opts: { titulo?: string } = {}): Opcao {
  const max = Math.max(...celulas.map((c) => c[2]), 1);
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), position: 'top',
      formatter: (o: { data: [number, number, number] }) => `${ys[o.data[1]]} · ${xs[o.data[0]]}h<br/><b>${fmt(o.data[2])}</b>` },
    grid: { left: 10, right: 12, top: 12, bottom: 58, containLabel: true },
    xAxis: { type: 'category', data: xs, splitArea: { show: true }, axisLine: { lineStyle: { color: p.border } }, axisTick: { show: false }, axisLabel: { color: p.textDim, interval: 1 } },
    yAxis: { type: 'category', data: ys, splitArea: { show: true }, axisLine: { lineStyle: { color: p.border } }, axisTick: { show: false }, axisLabel: { color: p.textDim } },
    visualMap: {
      min: 0, max, calculable: true, orient: 'horizontal', left: 'center', bottom: 8,
      textStyle: { color: p.textDim }, inRange: { color: [p.surface2, p.primary, p.pink] }, formatter: (v: number) => fmt(v),
    },
    series: [{
      name: opts.titulo, type: 'heatmap', data: celulas,
      label: { show: false }, itemStyle: { borderColor: p.bg, borderWidth: 1 },
      emphasis: { itemStyle: { borderColor: p.text, borderWidth: 1.5 } },
    }],
  };
}

/** Barras + linha em eixos duplos (combinado). */
export function optCombinado(p: PaletaAds, labels: string[], barra: Serie, linha: Serie, fmtBarra: Fmt = numBR, fmtLinha: Fmt = numBR): Opcao {
  const cb = barra.cor ?? p.primary, cl = linha.cor ?? p.cyan;
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'axis', axisPointer: { type: 'cross', crossStyle: { color: p.border } } },
    legend: { top: 0, right: 8, textStyle: { color: p.textDim }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
    grid: { left: 10, right: 16, top: 34, bottom: 10, containLabel: true },
    xAxis: eixoX(p, labels, { boundaryGap: true }),
    yAxis: [
      { ...eixoY(p, fmtBarra), position: 'left' },
      { ...eixoY(p, fmtLinha), position: 'right', splitLine: { show: false } },
    ],
    series: [
      { name: barra.name, type: 'bar', yAxisIndex: 0, barWidth: '48%', itemStyle: { color: cb, borderRadius: [5, 5, 0, 0] }, data: barra.data },
      { name: linha.name, type: 'line', yAxisIndex: 1, smooth: 0.3, symbol: 'circle', symbolSize: 6, lineStyle: { width: 2.4, color: cl }, itemStyle: { color: cl }, data: linha.data },
    ],
  };
}

/** Forecast: histórico sólido + projeção tracejada (opcional banda de confiança). */
export function optForecast(p: PaletaAds, labels: string[], real: number[], previsto: (number | null)[], fmt: Fmt = numBR, opts: { nomeReal?: string; nomePrev?: string } = {}): Opcao {
  return {
    ...baseAds(p),
    tooltip: { ...(baseAds(p).tooltip as Opcao), trigger: 'axis', valueFormatter: (v: number) => (v == null ? '—' : fmt(v)) },
    legend: { top: 0, right: 8, textStyle: { color: p.textDim }, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
    grid: { left: 10, right: 16, top: 34, bottom: 10, containLabel: true },
    xAxis: eixoX(p, labels),
    yAxis: eixoY(p, fmt),
    series: [
      { name: opts.nomeReal ?? 'Realizado', type: 'line', smooth: 0.3, showSymbol: false, lineStyle: { width: 2.4, color: p.primary }, itemStyle: { color: p.primary }, areaStyle: { color: gradiente(p.primary) }, data: real },
      { name: opts.nomePrev ?? 'Projeção', type: 'line', smooth: 0.3, showSymbol: false, lineStyle: { width: 2.4, color: p.cyan, type: 'dashed' }, itemStyle: { color: p.cyan }, data: previsto },
    ],
  };
}

/** Comparação entre dois períodos (mesma métrica). */
export function optComparaPeriodos(p: PaletaAds, labels: string[], atual: number[], anterior: number[], fmt: Fmt = numBR, opts: { nomeAtual?: string; nomeAnterior?: string } = {}): Opcao {
  return optArea(p, labels, [
    { name: opts.nomeAtual ?? 'Período atual', data: atual, cor: p.primary },
    { name: opts.nomeAnterior ?? 'Período anterior', data: anterior, cor: p.textDim },
  ], fmt, { area: false });
}

export interface PontoScatter { x: number; y: number; tam?: number; nome: string; grupo?: string; cor?: string; extra?: Record<string, unknown>; }

/** Dispersão/bolhas: x×y, tamanho ∝ `tam`, cor por `grupo` (legenda interativa). */
export function optScatter(p: PaletaAds, pontos: PontoScatter[], opts: { nomeX?: string; nomeY?: string; fmtX?: Fmt; fmtY?: Fmt; fmtTam?: Fmt; rotuloTam?: string } = {}): Opcao {
  const fmtX = opts.fmtX ?? numBR, fmtY = opts.fmtY ?? numBR, fmtTam = opts.fmtTam ?? numBR;
  const grupos = [...new Set(pontos.map((pt) => pt.grupo ?? '—'))];
  const corDe = new Map<string, string>();
  grupos.forEach((g, i) => { corDe.set(g, pontos.find((pt) => (pt.grupo ?? '—') === g)?.cor ?? p.seq[i % p.seq.length]); });
  const tamMax = Math.max(...pontos.map((pt) => pt.tam ?? 1), 1);
  return {
    ...baseAds(p),
    tooltip: {
      ...(baseAds(p).tooltip as Opcao), trigger: 'item',
      formatter: (o: { data: { nome: string; value: [number, number]; tam?: number } }) => {
        const d = o.data;
        let s = `<b>${d.nome}</b><br/>${opts.nomeX ?? 'x'}: ${fmtX(d.value[0])}<br/>${opts.nomeY ?? 'y'}: ${fmtY(d.value[1])}`;
        if (d.tam != null && opts.rotuloTam) s += `<br/>${opts.rotuloTam}: ${fmtTam(d.tam)}`;
        return s;
      },
    },
    legend: grupos.length > 1 ? { top: 0, right: 8, textStyle: { color: p.textDim }, icon: 'circle', itemWidth: 9, itemHeight: 9 } : undefined,
    grid: { left: 10, right: 16, top: grupos.length > 1 ? 34 : 22, bottom: 46, containLabel: true },
    xAxis: { type: 'value', name: opts.nomeX, nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: p.textDim }, axisLine: { lineStyle: { color: p.border } }, axisTick: { show: false }, splitLine: { lineStyle: { color: p.border, type: 'dashed', opacity: 0.5 } }, axisLabel: { color: p.textDim, formatter: (v: number) => fmtX(v) } },
    yAxis: { type: 'value', name: opts.nomeY, nameTextStyle: { color: p.textDim }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: p.border, type: 'dashed', opacity: 0.5 } }, axisLabel: { color: p.textDim, formatter: (v: number) => fmtY(v) } },
    dataZoom: [
      { type: 'inside', xAxisIndex: 0, throttle: 60 },
      { type: 'inside', yAxisIndex: 0, throttle: 60 },
      { type: 'slider', xAxisIndex: 0, height: 16, bottom: 6, borderColor: p.border, fillerColor: mix(p.primary, 0.14), handleStyle: { color: p.primary }, textStyle: { color: p.textDim } },
    ],
    series: grupos.map((g) => ({
      name: g, type: 'scatter',
      symbolSize: (_v: unknown, params: { data: { tam?: number } }) => 8 + Math.sqrt((params.data.tam ?? 1) / tamMax) * 34,
      itemStyle: { color: corDe.get(g), opacity: 0.78, borderColor: p.bg, borderWidth: 0.5 },
      emphasis: { focus: 'series', itemStyle: { opacity: 1 } },
      data: pontos.filter((pt) => (pt.grupo ?? '—') === g).map((pt) => ({ value: [pt.x, pt.y], tam: pt.tam, nome: pt.nome, grupo: pt.grupo, ...pt.extra })),
    })),
  };
}

/** Sparkline como opção ECharts mínima (para células/cards). */
export function optSpark(p: PaletaAds, data: number[], cor?: string): Opcao {
  const c = cor ?? p.primary;
  return {
    animation: false,
    grid: { left: 1, right: 1, top: 2, bottom: 2 },
    xAxis: { type: 'category', show: false, boundaryGap: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: { show: false },
    series: [{ type: 'line', data, smooth: 0.3, showSymbol: false, lineStyle: { width: 1.6, color: c }, areaStyle: { color: gradiente(c, 0.22, 0) } }],
  };
}
