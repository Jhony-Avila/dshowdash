// viz/opts.ts — construtores de opcao do ECharts, padronizados para o painel.
// @version 1.0.0  @created 2026-07-27  (Fase 4)
//
// Toda tela usa estes builders em vez de montar `option` na mao: garante mesma grade,
// mesma tipografia, mesmo tooltip e mesmas cores (tokens --pp-* resolvidos por viz/tema).
// A paleta entra por parametro — nunca leia CSS aqui dentro.
import { fmtBRL, fmtNum } from '../lib/format';
import type { Paleta } from './tema';

/** Opcao do ECharts. Tipo aberto de proposito: cada builder monta o seu recorte. */
export type Opcao = Record<string, unknown>;

export type Formato = 'brl' | 'num' | 'pct';

export function fmtValor(v: number | null | undefined, f: Formato): string {
  if (v == null || Number.isNaN(v)) return '—';
  if (f === 'brl') return fmtBRL(v);
  if (f === 'pct') return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
  return fmtNum(v);
}

/** Base comum: fundo transparente (o card ja tem), fonte do shell, grade folgada. */
function base(pal: Paleta): Opcao {
  return {
    backgroundColor: 'transparent',
    animationDuration: 420,
    textStyle: { fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", color: pal.text, fontSize: 12 },
    grid: { left: 8, right: 14, top: 26, bottom: 6, containLabel: true },
    tooltip: {
      backgroundColor: pal.surface,
      borderColor: pal.border,
      borderWidth: 1,
      textStyle: { color: pal.text, fontSize: 12 },
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,.28); border-radius: 8px;',
    },
  };
}

function eixoCategoria(pal: Paleta, dados: string[], rotacionar = false): Opcao {
  return {
    type: 'category',
    data: dados,
    axisLine: { lineStyle: { color: pal.border } },
    axisTick: { show: false },
    axisLabel: { color: pal.textDim, fontSize: 11, hideOverflow: true, rotate: rotacionar ? 28 : 0 },
  };
}

function eixoValor(pal: Paleta, f: Formato): Opcao {
  return {
    type: 'value',
    splitLine: { lineStyle: { color: pal.border, opacity: 0.55 } },
    axisLabel: { color: pal.textDim, fontSize: 11, formatter: (v: number) => compacto(v, f) },
  };
}

/** Rotulo curto de eixo: 1.2 mi / 340 mil / 87. */
export function compacto(v: number, f: Formato): string {
  if (f === 'pct') return `${Math.round(v)}%`;
  const abs = Math.abs(v);
  const pre = f === 'brl' ? 'R$ ' : '';
  if (abs >= 1e9) return `${pre}${(v / 1e9).toFixed(1).replace('.', ',')} bi`;
  if (abs >= 1e6) return `${pre}${(v / 1e6).toFixed(1).replace('.', ',')} mi`;
  if (abs >= 1e3) return `${pre}${Math.round(v / 1e3)} mil`;
  return `${pre}${fmtNum(v)}`;
}

export interface PontoXY { label: string; valor: number; }

/** Serie temporal em area + linha. `zoom` liga o dataZoom (series longas). */
export function optArea(
  pal: Paleta,
  pontos: PontoXY[],
  { formato = 'brl', cor, zoom = false, nomeSerie = 'Valor', comparar }:
  { formato?: Formato; cor?: string; zoom?: boolean; nomeSerie?: string; comparar?: { nome: string; pontos: PontoXY[] } } = {},
): Opcao {
  const c = cor ?? pal.ok;
  const series: Opcao[] = [{
    name: nomeSerie,
    type: 'line',
    smooth: 0.25,
    showSymbol: pontos.length <= 40,
    symbolSize: 5,
    lineStyle: { width: 2, color: c },
    itemStyle: { color: c },
    areaStyle: { color: c, opacity: 0.16 },
    data: pontos.map((p) => p.valor),
  }];
  if (comparar) {
    series.push({
      name: comparar.nome,
      type: 'line',
      smooth: 0.25,
      showSymbol: false,
      lineStyle: { width: 1.6, color: pal.textDim, type: 'dashed' },
      itemStyle: { color: pal.textDim },
      data: comparar.pontos.map((p) => p.valor),
    });
  }
  return {
    ...base(pal),
    legend: comparar ? { top: 0, right: 0, textStyle: { color: pal.textDim, fontSize: 11 }, itemHeight: 8, itemWidth: 14 } : undefined,
    grid: { left: 8, right: 14, top: comparar ? 30 : 18, bottom: zoom ? 44 : 6, containLabel: true },
    tooltip: {
      ...(base(pal).tooltip as Opcao),
      trigger: 'axis',
      axisPointer: { type: 'line', lineStyle: { color: pal.border } },
      valueFormatter: (v: number) => fmtValor(v, formato),
    },
    xAxis: eixoCategoria(pal, pontos.map((p) => p.label)),
    yAxis: eixoValor(pal, formato),
    dataZoom: zoom ? [{ type: 'inside' }, { type: 'slider', height: 18, bottom: 8, borderColor: pal.border, fillerColor: `${pal.primary}22`, handleStyle: { color: pal.primary }, textStyle: { color: pal.textDim, fontSize: 10 } }] : undefined,
    series,
  };
}

/** Colunas verticais (uma serie). */
export function optColunas(
  pal: Paleta,
  pontos: PontoXY[],
  { formato = 'num', cor, cores, rotacionar = false }:
  { formato?: Formato; cor?: string; cores?: string[]; rotacionar?: boolean } = {},
): Opcao {
  return {
    ...base(pal),
    tooltip: { ...(base(pal).tooltip as Opcao), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => fmtValor(v, formato) },
    xAxis: eixoCategoria(pal, pontos.map((p) => p.label), rotacionar),
    yAxis: eixoValor(pal, formato),
    series: [{
      type: 'bar',
      barMaxWidth: 34,
      itemStyle: { borderRadius: [4, 4, 0, 0], color: cor ?? pal.primary },
      data: pontos.map((p, i) => (cores ? { value: p.valor, itemStyle: { color: cores[i % cores.length], borderRadius: [4, 4, 0, 0] } } : p.valor)),
    }],
  };
}

/** Barras horizontais (ranking). Maior no topo. */
export function optBarras(
  pal: Paleta,
  pontos: PontoXY[],
  { formato = 'brl', cor, cores, larguraRotulo = 130 }:
  { formato?: Formato; cor?: string; cores?: string[]; larguraRotulo?: number } = {},
): Opcao {
  const ordenado = [...pontos].sort((a, b) => a.valor - b.valor); // ECharts desenha de baixo p/ cima
  return {
    ...base(pal),
    grid: { left: 8, right: 42, top: 10, bottom: 6, containLabel: true },
    tooltip: { ...(base(pal).tooltip as Opcao), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => fmtValor(v, formato) },
    xAxis: eixoValor(pal, formato),
    yAxis: {
      ...eixoCategoria(pal, ordenado.map((p) => p.label)),
      axisLabel: { color: pal.textDim, fontSize: 11, width: larguraRotulo, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 20,
      itemStyle: { borderRadius: [0, 4, 4, 0], color: cor ?? pal.primary },
      label: { show: true, position: 'right', color: pal.textDim, fontSize: 11, formatter: (p: { value: number }) => compacto(p.value, formato) },
      data: ordenado.map((p, i) => (cores ? { value: p.valor, itemStyle: { color: cores[i % cores.length], borderRadius: [0, 4, 4, 0] } } : p.valor)),
    }],
  };
}

/** Rosca com total no centro. */
export function optDonut(
  pal: Paleta,
  pontos: PontoXY[],
  { formato = 'num', cores, rotuloCentro, valorCentro }:
  { formato?: Formato; cores?: string[]; rotuloCentro?: string; valorCentro?: string } = {},
): Opcao {
  const seq = cores ?? pal.seq;
  return {
    ...base(pal),
    tooltip: {
      ...(base(pal).tooltip as Opcao),
      trigger: 'item',
      formatter: (p: { name: string; value: number; percent: number; marker: string }) =>
        `${p.marker} ${p.name}<br/><b>${fmtValor(p.value, formato)}</b> · ${p.percent}%`,
    },
    legend: { bottom: 0, left: 'center', textStyle: { color: pal.textDim, fontSize: 11 }, itemHeight: 8, itemWidth: 14, icon: 'circle' },
    series: [{
      type: 'pie',
      radius: ['52%', '76%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      padAngle: 1.4,
      itemStyle: { borderRadius: 4, borderColor: pal.surface, borderWidth: 2 },
      label: rotuloCentro
        ? { show: true, position: 'center', formatter: () => `{v|${valorCentro ?? ''}}\n{l|${rotuloCentro}}`,
            rich: { v: { fontSize: 20, fontWeight: 700, color: pal.text, lineHeight: 26 }, l: { fontSize: 11, color: pal.textDim } } }
        : { show: false },
      emphasis: { label: { show: !!rotuloCentro }, scaleSize: 6 },
      labelLine: { show: false },
      data: pontos.map((p, i) => ({ name: p.label, value: p.valor, itemStyle: { color: seq[i % seq.length] } })),
    }],
  };
}

/**
 * Colunas empilhadas (composicao por categoria — ex.: desfecho por etapa).
 * `percentual` normaliza cada coluna para 100%: use quando as categorias tem ORDENS DE
 * GRANDEZA diferentes (um funil com 20 mil negocios ao lado de outro com 28 achata o
 * segundo ate sumir). O valor absoluto continua no tooltip — nada se perde.
 */
export function optColunasEmpilhadas(
  pal: Paleta,
  labels: string[],
  series: { nome: string; dados: number[]; cor?: string }[],
  { formato = 'num', rotacionar = false, percentual = false }:
  { formato?: Formato; rotacionar?: boolean; percentual?: boolean } = {},
): Opcao {
  const totais = labels.map((_, i) => series.reduce((a, s) => a + (s.dados[i] ?? 0), 0));
  const dadosDe = (s: { dados: number[] }, i: number) =>
    percentual ? (totais[i] > 0 ? (s.dados[i] / totais[i]) * 100 : 0) : s.dados[i];

  return {
    ...base(pal),
    grid: { left: 8, right: 14, top: 34, bottom: 6, containLabel: true },
    legend: { top: 0, left: 0, textStyle: { color: pal.textDim, fontSize: 11 }, itemHeight: 8, itemWidth: 14, icon: 'circle' },
    tooltip: {
      ...(base(pal).tooltip as Opcao),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (ps: { axisValue: string; marker: string; seriesName: string; value: number; dataIndex: number }[]) => {
        if (!ps.length) return '';
        const i = ps[0].dataIndex;
        const cab = percentual ? `${ps[0].axisValue} — ${fmtValor(totais[i], formato)} no total` : ps[0].axisValue;
        const linhas = ps.map((p, k) => {
          const abs = series[k]?.dados[i] ?? 0;
          return percentual
            ? `${p.marker} ${p.seriesName}: <b>${Math.round(p.value)}%</b> (${fmtValor(abs, formato)})`
            : `${p.marker} ${p.seriesName}: <b>${fmtValor(p.value, formato)}</b>`;
        });
        return `${cab}<br/>${linhas.join('<br/>')}`;
      },
    },
    xAxis: eixoCategoria(pal, labels, rotacionar),
    yAxis: percentual
      ? { ...eixoValor(pal, 'pct'), max: 100 }
      : eixoValor(pal, formato),
    series: series.map((s, i) => ({
      name: s.nome,
      type: 'bar',
      stack: 'total',
      barMaxWidth: 46,
      itemStyle: { color: s.cor ?? pal.seq[i % pal.seq.length] },
      emphasis: { focus: 'series' },
      data: labels.map((_, k) => dadosDe(s, k)),
    })),
  };
}

/** Funil (etapas). `pontos` ja deve vir na ordem da etapa 1 -> etapa N. */
export function optFunil(
  pal: Paleta,
  pontos: PontoXY[],
  { formato = 'num', cores, destaque }:
  { formato?: Formato; cores?: string[]; destaque?: number } = {},
): Opcao {
  const seq = cores ?? pal.seq;
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  return {
    ...base(pal),
    tooltip: {
      ...(base(pal).tooltip as Opcao),
      trigger: 'item',
      formatter: (p: { name: string; value: number; marker: string }) =>
        `${p.marker} ${p.name}<br/><b>${fmtValor(p.value, formato)}</b>`,
    },
    series: [{
      type: 'funnel',
      left: 8, right: 8, top: 12, bottom: 8,
      min: 0, max,
      minSize: '18%',
      sort: 'none', // a ordem e a do funil, nao a do valor
      gap: 3,
      label: { show: true, position: 'inside', color: '#fff', fontSize: 11.5, fontWeight: 600, formatter: (p: { name: string; value: number }) => `${p.name} · ${fmtValor(p.value, formato)}` },
      labelLine: { show: false },
      itemStyle: { borderColor: pal.surface, borderWidth: 2 },
      emphasis: { label: { fontSize: 12.5 } },
      data: pontos.map((p, i) => ({
        name: p.label,
        value: p.valor,
        itemStyle: {
          color: destaque === i ? pal.danger : seq[i % seq.length],
          borderColor: pal.surface, borderWidth: 2,
        },
      })),
    }],
  };
}
