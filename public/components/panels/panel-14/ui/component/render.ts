

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-14-ui-component-render
// PURPOSE: Panel 14 - UI Component Render
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderMain() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-14-ui-component-render';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const ICONS = {
  chart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>',
  filter: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  expand: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>',
  settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  trendUp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  trendDown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// ══════════════════════════════════════════════════════════════
// MAIN RENDER
// ══════════════════════════════════════════════════════════════

export function renderMain(state: Record<string, any>, config: { i18n?: Record<string, any> } = {}) {
  const { data = [], isLoading, error, filters = {}, viewMode = 'chart', isFullscreen } = state;
  const { i18n = {} } = config;
  
  if (error) return renderError(error, i18n);
  if (isLoading && data.length === 0) return renderLoading(i18n);
  
  return `
    <div class="p14 ${isFullscreen ? 'p14--fullscreen' : ''}" data-panel="panel-14">
      ${renderHeader(state, i18n)}
      ${renderToolbar(state, i18n)}
      <div class="p14__content">
        ${viewMode === 'chart' ? renderChartView(data, state, i18n) : renderTableView(data, state, i18n)}
      </div>
      ${renderFooter(data, i18n)}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// HEADER
// ══════════════════════════════════════════════════════════════

function renderHeader(state: Record<string, unknown>, i18n: Record<string, unknown>) {
  const { title, subtitle, lastUpdated } = state;
  return `
    <header class="p14__header">
      <div class="p14__title-section">
        <h2 class="p14__title">${ICONS.chart} ${title || i18n.title || 'Analytics Dashboard'}</h2>
        ${subtitle ? `<span class="p14__subtitle">${subtitle}</span>` : ''}
      </div>
      <div class="p14__header-actions">
        ${lastUpdated ? `<span class="p14__last-updated">${i18n.lastUpdated || 'Atualizado'}: ${formatTime(lastUpdated)}</span>` : ''}
        <button class="p14__btn p14__btn--icon" data-action="refresh" title="${i18n.refresh || 'Atualizar'}">
          ${ICONS.refresh}
        </button>
        <button class="p14__btn p14__btn--icon" data-action="toggle-fullscreen" title="${i18n.fullscreen || 'Tela cheia'}">
          ${ICONS.expand}
        </button>
        <button class="p14__btn p14__btn--icon" data-action="settings" title="${i18n.settings || 'Configurações'}">
          ${ICONS.settings}
        </button>
      </div>
    </header>
  `;
}

// ══════════════════════════════════════════════════════════════
// TOOLBAR
// ══════════════════════════════════════════════════════════════

function renderToolbar(state: Record<string, unknown>, i18n: Record<string, unknown>) {
  const filters = (state.filters || {}) as Record<string, unknown>;
  const { viewMode = 'chart', dateRange } = state;
  return `
    <div class="p14__toolbar">
      <div class="p14__filters">
        <select class="p14__select" data-filter="period">
          <option value="today" ${filters.period === 'today' ? 'selected' : ''}>${i18n.today || 'Hoje'}</option>
          <option value="week" ${filters.period === 'week' ? 'selected' : ''}>${i18n.thisWeek || 'Esta semana'}</option>
          <option value="month" ${filters.period === 'month' ? 'selected' : ''}>${i18n.thisMonth || 'Este mês'}</option>
          <option value="quarter" ${filters.period === 'quarter' ? 'selected' : ''}>${i18n.thisQuarter || 'Este trimestre'}</option>
          <option value="year" ${filters.period === 'year' ? 'selected' : ''}>${i18n.thisYear || 'Este ano'}</option>
          <option value="custom" ${filters.period === 'custom' ? 'selected' : ''}>${i18n.custom || 'Personalizado'}</option>
        </select>
        <select class="p14__select" data-filter="metric">
          <option value="all" ${filters.metric === 'all' ? 'selected' : ''}>${i18n.allMetrics || 'Todas métricas'}</option>
          <option value="revenue" ${filters.metric === 'revenue' ? 'selected' : ''}>${i18n.revenue || 'Receita'}</option>
          <option value="users" ${filters.metric === 'users' ? 'selected' : ''}>${i18n.users || 'Usuários'}</option>
          <option value="sessions" ${filters.metric === 'sessions' ? 'selected' : ''}>${i18n.sessions || 'Sessões'}</option>
          <option value="conversion" ${filters.metric === 'conversion' ? 'selected' : ''}>${i18n.conversion || 'Conversão'}</option>
        </select>
        <button class="p14__btn p14__btn--icon" data-action="toggle-filters" title="${i18n.moreFilters || 'Mais filtros'}">
          ${ICONS.filter}
        </button>
      </div>
      <div class="p14__view-toggle">
        <button class="p14__btn ${viewMode === 'chart' ? 'p14__btn--active' : ''}" data-action="set-view" data-view="chart">
          ${ICONS.chart} ${i18n.chartView || 'Gráfico'}
        </button>
        <button class="p14__btn ${viewMode === 'table' ? 'p14__btn--active' : ''}" data-action="set-view" data-view="table">
          ${i18n.tableView || 'Tabela'}
        </button>
      </div>
      <div class="p14__toolbar-actions">
        <button class="p14__btn" data-action="export">
          ${ICONS.download} ${i18n.export || 'Exportar'}
        </button>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// CHART VIEW
// ══════════════════════════════════════════════════════════════

function renderChartView(data: Record<string, unknown>[], state: Record<string, unknown>, i18n: Record<string, unknown>) {
  const metrics = (state.metrics || []) as Record<string, unknown>[];
  const { chartType = 'line' } = state;

  let kpisHtml = '';
  for (const metric of metrics.slice(0, 4)) {
    kpisHtml += renderKpiCard(metric, i18n);
  }
  
  return `
    <div class="p14__chart-view">
      <div class="p14__kpis">${kpisHtml}</div>
      <div class="p14__chart-container">
        <div class="p14__chart-header">
          <h3 class="p14__chart-title">${i18n.performanceOverTime || 'Performance ao longo do tempo'}</h3>
          <div class="p14__chart-controls">
            <select class="p14__select p14__select--sm" data-action="chart-type">
              <option value="line" ${chartType === 'line' ? 'selected' : ''}>Linha</option>
              <option value="bar" ${chartType === 'bar' ? 'selected' : ''}>Barras</option>
              <option value="area" ${chartType === 'area' ? 'selected' : ''}>Área</option>
            </select>
          </div>
        </div>
        <div class="p14__chart" data-chart-mount>
          ${renderPlaceholderChart(data)}
        </div>
      </div>
      <div class="p14__secondary-charts">
        ${renderSecondaryChart('distribution', String(i18n.distribution || 'Distribuição'), data)}
        ${renderSecondaryChart('comparison', String(i18n.comparison || 'Comparativo'), data)}
      </div>
    </div>
  `;
}

function renderKpiCard(metric: Record<string, unknown>, i18n: Record<string, unknown>) {
  const { label, changeType, format = 'number' } = metric;
  const value = metric.value;
  const change = metric.change as number | undefined;
  const isPositive = changeType === 'positive' || (change !== undefined && change > 0);
  const isNegative = changeType === 'negative' || (change !== undefined && change < 0);
  const trendIcon = isPositive ? ICONS.trendUp : isNegative ? ICONS.trendDown : '';
  const trendClass = isPositive ? 'p14__kpi-change--positive' : isNegative ? 'p14__kpi-change--negative' : '';

  let formattedValue: unknown = value;
  if (format === 'currency') formattedValue = formatCurrency(value);
  else if (format === 'percent') formattedValue = formatPercent(value);
  else if (format === 'number') formattedValue = formatNumber(value);

  return `
    <div class="p14__kpi">
      <div class="p14__kpi-header">
        <span class="p14__kpi-label">${label}</span>
        <button class="p14__btn p14__btn--icon p14__btn--xs" data-action="kpi-info" data-metric="${label}" title="${i18n.info || 'Info'}">
          ${ICONS.info}
        </button>
      </div>
      <div class="p14__kpi-value">${formattedValue}</div>
      ${change !== undefined ? `
        <div class="p14__kpi-change ${trendClass}">
          ${trendIcon} ${Math.abs(change)}%
        </div>
      ` : ''}
    </div>
  `;
}

function renderPlaceholderChart(data: Record<string, unknown>[]) {
  if (!data?.length) return '<div class="p14__chart-empty">Sem dados para exibir</div>';
  const maxVal = Math.max(...data.map((d: Record<string, unknown>) => Number(d.value) || 0), 1);
  let bars = '';
  for (let i = 0; i < Math.min(data.length, 12); i++) {
    const d = data[i];
    const height = ((Number(d.value) || 0) / maxVal) * 100;
    const color = CHART_COLORS[i % CHART_COLORS.length];
    bars += `<div class="p14__placeholder-bar" style="height:${height}%;background:${color}" title="${d.label}: ${d.value}"></div>`;
  }
  return `<div class="p14__placeholder-chart">${bars}</div>`;
}

function renderSecondaryChart(type: string, title: string, data: Record<string, unknown>[]) {
  return `
    <div class="p14__secondary-chart">
      <h4 class="p14__secondary-title">${title}</h4>
      <div class="p14__secondary-content" data-chart="${type}">
        ${renderMiniChart(data, type)}
      </div>
    </div>
  `;
}

function renderMiniChart(data: Record<string, unknown>[], type: string) {
  if (!data?.length) return '<div class="p14__mini-empty">—</div>';
  if (type === 'distribution') {
    let items = '';
    const total = data.reduce((sum: number, d: Record<string, unknown>) => sum + (Number(d.value) || 0), 0) || 1;
    for (let i = 0; i < Math.min(data.length, 5); i++) {
      const d = data[i];
      const pct = ((Number(d.value) || 0) / total * 100).toFixed(1);
      const color = CHART_COLORS[i % CHART_COLORS.length];
      items += `<div class="p14__dist-item"><span class="p14__dist-color" style="background:${color}"></span><span class="p14__dist-label">${d.label || `Item ${i + 1}`}</span><span class="p14__dist-value">${pct}%</span></div>`;
    }
    return `<div class="p14__dist-list">${items}</div>`;
  }
  return '<div class="p14__mini-placeholder">📊</div>';
}

// ══════════════════════════════════════════════════════════════
// TABLE VIEW
// ══════════════════════════════════════════════════════════════

function renderTableView(data: Record<string, unknown>[], state: Record<string, unknown>, i18n: Record<string, unknown>) {
  if (!data?.length) return renderEmpty(i18n);
  
  let rows = '';
  for (const row of data) {
    rows += `
      <tr class="p14__tr" data-row-id="${row.id || ''}">
        <td class="p14__td">${row.label || '-'}</td>
        <td class="p14__td p14__td--number">${formatNumber(row.value)}</td>
        <td class="p14__td p14__td--number">${formatPercent(row.change)}</td>
        <td class="p14__td">${row.category || '-'}</td>
        <td class="p14__td">${formatDate(row.date)}</td>
      </tr>
    `;
  }
  
  return `
    <div class="p14__table-view">
      <table class="p14__table">
        <thead>
          <tr>
            <th class="p14__th" data-sort="label">${i18n.label || 'Label'}</th>
            <th class="p14__th" data-sort="value">${i18n.value || 'Valor'}</th>
            <th class="p14__th" data-sort="change">${i18n.change || 'Variação'}</th>
            <th class="p14__th" data-sort="category">${i18n.category || 'Categoria'}</th>
            <th class="p14__th" data-sort="date">${i18n.date || 'Data'}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// STATES
// ══════════════════════════════════════════════════════════════

function renderLoading(i18n: Record<string, unknown>) {
  return `<div class="p14__loading"><div class="p14__spinner"></div><span>${i18n?.loading || 'Carregando dados...'}</span></div>`;
}

function renderError(error: string, i18n: Record<string, unknown>) {
  return `<div class="p14__error"><span class="p14__error-icon">⚠️</span><p>${error}</p><button class="p14__btn" data-action="refresh">${i18n?.retry || 'Tentar novamente'}</button></div>`;
}

function renderEmpty(i18n: Record<string, unknown>) {
  return `<div class="p14__empty"><p>${i18n?.noData || 'Nenhum dado disponível'}</p></div>`;
}

function renderFooter(data: Record<string, unknown>[], i18n: Record<string, unknown>) {
  const count = data?.length || 0;
  return `<footer class="p14__footer"><span>${count} ${i18n?.records || 'registro(s)'}</span></footer>`;
}

// ══════════════════════════════════════════════════════════════
// FORMATTERS
// ══════════════════════════════════════════════════════════════

function formatNumber(val: unknown) {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString('pt-BR');
}

function formatCurrency(val: unknown) {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatPercent(val: unknown) {
  if (val === null || val === undefined) return '-';
  return `${Number(val).toFixed(1)}%`;
}

function formatDate(val: unknown) {
  if (!val) return '-';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}

function formatTime(val: unknown) {
  if (!val) return '-';
  const d = new Date(val as string);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ══════════════════════════════════════════════════════════════
// INFO / HEALTH
// ══════════════════════════════════════════════════════════════

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default {
  MODULE_ID,
  VERSION,
  renderMain,
  info,
  healthCheck
};
