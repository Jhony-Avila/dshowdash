// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-cards/ui/renderer
// PURPOSE: Panel Cards - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderCard() — exported function
//   renderSkeleton() — exported function
//   renderError() — exported function
//   renderContent() — exported function
//   renderMetric() — exported function
//   renderChartPlaceholder() — exported function
//   renderList() — exported function
//   renderGrid() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-cards/ui/renderer';

export function renderCard(card: Record<string, unknown>, options: { loading?: boolean; error?: { message?: string; cardId?: string } | null } = {}) {
  const { loading = false, error = null } = options;
  const statusClass = error ? 'card--error' : loading ? 'card--loading' : 'card--ready';
  return `<div class="dashboard-card ${statusClass}" data-card-id="${card.id || ''}"><div class="card__header"><h3 class="card__title">${escapeHtml(String(card.title || 'Card'))}</h3>${card.icon ? `<span class="card__icon">${card.icon}</span>` : ''}</div><div class="card__content">${loading ? renderSkeleton() : error ? renderError(error) : renderContent(card)}</div><div class="card__footer"><span class="card__updated">${formatLastUpdate(card.lastUpdate as string | number | null | undefined)}</span></div></div>`;
}

export function renderSkeleton() {
  return '<div class="card__skeleton">' +
    '<div class="skeleton-line skeleton-line--title"></div>' +
    '<div class="skeleton-line skeleton-line--text"></div>' +
    '<div class="skeleton-line skeleton-line--text"></div>' +
  '</div>';
}

export function renderError(error: { message?: string; cardId?: string }) {
  return `<div class="card__error"><span class="error-icon">⚠️</span><span class="error-message">${escapeHtml(error.message || 'Erro ao carregar')}</span><button class="error-retry" data-action="retry">Tentar novamente</button></div>`;
}

export function renderContent(card: Record<string, unknown>) {
  if (!card.data) return '<div class="card__empty">Sem dados</div>';
  if (card.type === 'metric') return renderMetric(card.data as Record<string, unknown>);
  if (card.type === 'chart') return renderChartPlaceholder(card.data as Record<string, unknown>);
  if (card.type === 'list') return renderList(card.data as Record<string, unknown>);
  return `<div class="card__data">${escapeHtml(JSON.stringify(card.data))}</div>`;
}

export function renderMetric(data: Record<string, unknown>) {
  const change = data.change as number | undefined;
  return `<div class="card__metric"><span class="metric__value">${escapeHtml(String(data.value || '0'))}</span><span class="metric__label">${escapeHtml(String(data.label || ''))}</span>${change !== undefined && change !== null ? `<span class="metric__change ${change >= 0 ? 'positive' : 'negative'}">${change >= 0 ? '+' : ''}${change}%</span>` : ''}</div>`;
}

export function renderChartPlaceholder(data: Record<string, unknown>) {
  return `<div class="card__chart" data-chart-type="${data.chartType || 'line'}"><div class="chart-placeholder">📊</div></div>`;
}

export function renderList(data: Record<string, unknown>) {
  if (!Array.isArray(data.items)) return '<div class="card__empty">Sem itens</div>';
  return `<ul class="card__list">${(data.items as Record<string, unknown>[]).slice(0, 5).map((item: Record<string, unknown>) => `<li class="list__item">${escapeHtml(String(item.label || item))}</li>`).join('')}</ul>`;
}

export function renderGrid(cards: Record<string, unknown>[], options: { columns?: number; loading?: string[]; errors?: { cardId: string; message?: string }[] } = {}) {
  const { columns = 3, loading = [], errors = [] } = options;
  return `<div class="cards-grid cards-grid--${columns}col">${cards.map(card => renderCard(card, { loading: loading.includes(String(card.id)), error: errors.find(e => e.cardId === String(card.id)) })).join('')}</div>`;
}

function escapeHtml(text: string) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
function formatLastUpdate(ts: number | string | null | undefined) { if (!ts) return ''; const d = new Date(ts as string | number); return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderCard, renderSkeleton, renderError, renderContent, renderMetric, renderChartPlaceholder, renderList, renderGrid };
