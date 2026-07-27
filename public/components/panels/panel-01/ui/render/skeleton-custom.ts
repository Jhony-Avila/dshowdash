// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/render/skeleton-custom
// PURPOSE: Panel-01 - Skeleton Personalizado
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderKPISkeleton() — exported function
//   renderFiltersSkeleton() — exported function
//   renderTableSkeleton() — exported function
//   renderPaginationSkeleton() — exported function
//   renderDrawerSkeleton() — exported function
//   renderFullSkeleton() — exported function
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
export const MODULE_ID = 'panel-01/ui/render/skeleton-custom';

export function renderKPISkeleton(count = 4) {
  let html = '<div class="p01-kpis-skeleton">';
  for (let i = 0; i < count; i++) {
    html += '<div class="p01-kpi-skeleton"><div class="p01-skeleton p01-skeleton--icon"></div><div class="p01-kpi-skeleton-content"><div class="p01-skeleton p01-skeleton--text p01-skeleton--w60"></div><div class="p01-skeleton p01-skeleton--text p01-skeleton--w40"></div></div></div>';
  }
  html += '</div>';
  return html;
}

export function renderFiltersSkeleton() {
  return '<div class="p01-filters-skeleton"><div class="p01-skeleton p01-skeleton--input"></div><div class="p01-skeleton p01-skeleton--input"></div><div class="p01-skeleton p01-skeleton--input"></div><div class="p01-skeleton p01-skeleton--btn"></div></div>';
}

export function renderTableSkeleton(rows = 10, cols = 6) {
  let html = '<div class="p01-table-skeleton"><div class="p01-table-skeleton-header">';
  for (let c = 0; c < cols; c++) {
    html += '<div class="p01-skeleton p01-skeleton--header"></div>';
  }
  html += '</div><div class="p01-table-skeleton-body">';
  for (let r = 0; r < rows; r++) {
    html += '<div class="p01-table-skeleton-row">';
    for (let c = 0; c < cols; c++) {
      const width = c === 0 ? 'w20' : c === 1 ? 'w40' : c === cols - 1 ? 'w30' : 'w60';
      html += `<div class="p01-skeleton p01-skeleton--cell p01-skeleton--${width}"></div>`;
    }
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

export function renderPaginationSkeleton() {
  return '<div class="p01-pagination-skeleton"><div class="p01-skeleton p01-skeleton--text p01-skeleton--w100"></div><div class="p01-skeleton p01-skeleton--btn-group"></div></div>';
}

export function renderDrawerSkeleton() {
  return '<div class="p01-drawer-skeleton"><div class="p01-skeleton p01-skeleton--title"></div><div class="p01-drawer-skeleton-fields"><div class="p01-skeleton p01-skeleton--field"></div><div class="p01-skeleton p01-skeleton--field"></div><div class="p01-skeleton p01-skeleton--field"></div><div class="p01-skeleton p01-skeleton--field"></div><div class="p01-skeleton p01-skeleton--field-lg"></div></div></div>';
}

export function renderFullSkeleton() {
  return `<div class="p01-full-skeleton">${renderKPISkeleton(4)}${renderFiltersSkeleton()}${renderTableSkeleton(8, 6)}${renderPaginationSkeleton()}</div>`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { renderKPISkeleton, renderFiltersSkeleton, renderTableSkeleton, renderPaginationSkeleton, renderDrawerSkeleton, renderFullSkeleton };
