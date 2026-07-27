// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:templates
// PURPOSE: Table Engine - Templates (Skeleton, Empty, Error States)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderSkeleton() — exported function
//   renderEmpty() — exported function
//   renderError() — exported function
//   renderLoadingOverlay() — exported function
//   renderNoResults() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:templates';

const TEMPLATE_SVGS = {
  warning: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

export function renderSkeleton(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const rows = (opts.skeletonRows || 5) as number;
  const cols = (opts.columns && (opts.columns as Record<string, unknown>[]).length) || 5;
  let headerCells = '';
  // @ts-expect-error strict migration — TS2365
  for (let c = 0; c < cols; c++) headerCells += `<th class="${p}skeleton-cell"><div class="${p}skeleton-bar ${p}skeleton-header"></div></th>`;
  let bodyRows = '';
  for (let r = 0; r < (rows as number); r++) {
    let cells = '';
    // @ts-expect-error strict migration — TS2365
    for (let c2 = 0; c2 < cols; c2++) {
      const width = 40 + Math.random() * 40;
      cells += `<td class="${p}skeleton-cell"><div class="${p}skeleton-bar" style="width: ${width}%"></div></td>`;
    }
    bodyRows += `<tr class="${p}skeleton-row">${cells}</tr>`;
  }
  return `<div class="${p}skeleton-wrapper"><table class="${p}table ${p}skeleton-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

export function renderEmpty(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const icon = opts.emptyIcon || '📭';
  const title = opts.emptyTitle || 'Nenhum registro encontrado';
  const message = opts.emptyMessage || 'Tente ajustar os filtros ou adicione novos dados.';
  const showAction = opts.emptyAction !== false;
  const actionLabel = opts.emptyActionLabel || 'Limpar filtros';
  const actionHandler = opts.emptyActionHandler || 'clear-filters';
  return `<div class="${p}empty-state"><div class="${p}empty-icon">${icon}</div><h3 class="${p}empty-title">${title}</h3><p class="${p}empty-message">${message}</p>${showAction ? `<button class="${p}empty-action" data-action="${actionHandler}">${actionLabel}</button>` : ''}</div>`;
}

export function renderError(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const icon = opts.errorIcon || TEMPLATE_SVGS.warning;
  const title = opts.errorTitle || 'Erro ao carregar dados';
  const message = opts.errorMessage || (opts.error && (opts.error as Record<string, unknown>).message) || 'Ocorreu um erro inesperado. Por favor, tente novamente.';
  const showRetry = opts.showRetry !== false;
  const retryLabel = opts.retryLabel || 'Tentar novamente';
  return `<div class="${p}error-state"><div class="${p}error-icon">${icon}</div><h3 class="${p}error-title">${title}</h3><p class="${p}error-message">${message}</p>${showRetry ? `<button class="${p}error-retry" data-action="retry">${retryLabel}</button>` : ''}</div>`;
}

export function renderLoadingOverlay(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const message = opts.loadingMessage || 'Carregando...';
  return `<div class="${p}loading-overlay"><div class="${p}loading-spinner"></div><span class="${p}loading-message">${message}</span></div>`;
}

export function renderNoResults(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const query = opts.searchQuery || '';
  return `<div class="${p}no-results"><div class="${p}no-results-icon">🔍</div><h3 class="${p}no-results-title">Nenhum resultado para "${query}"</h3><p class="${p}no-results-message">Tente buscar por outros termos.</p><button class="${p}no-results-clear" data-action="clear-search">Limpar busca</button></div>`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, templates: ['skeleton', 'empty', 'error', 'loading', 'noResults'] }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderSkeleton, renderEmpty, renderError, renderLoadingOverlay, renderNoResults, info, healthCheck, VERSION, MODULE_ID };
