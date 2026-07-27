// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-MIGRATION-PHASE3)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.ui.skeleton-loader
// PURPOSE: Skeleton Loading — Placeholders visuais durante carregamento
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION, MODULE_ID, injectPorts, getPorts
//   renderItemsSkeleton() — skeleton para lista de itens
//   renderKPISkeleton() — skeleton para cards KPI
//   renderFiltersSkeleton() — skeleton para filtros
//   renderTableSkeleton() — skeleton para tabela
//   renderFullSkeleton() — skeleton completo do painel
//   showSkeleton() — injeta skeleton num container
//   hideSkeleton() — remove skeleton de um container
//   info(), healthCheck()
//
// @origin Adapted from panel-01/ui/skeleton-custom.js for nav-admin
// @changelog
//   10.1.0-MIGRATION-PHASE3: Initial creation — FASE 3 B.2
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '13.3.0-VISUAL-ENHANCEMENTS';
export const MODULE_ID = 'panel-nav-admin.ui.skeleton-loader';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const SKELETON_CLASS = 'pna-skeleton';

/**
 * Generate a skeleton line with random width.
 * @private
 * @param {'short'|'medium'|'long'|'full'} size
 * @returns {string} HTML
 */
function _line(size: string) {
  return '<div class="' + SKELETON_CLASS + '-line ' + SKELETON_CLASS + '-' + size + '"></div>';
}

/**
 * Render skeleton for KPI cards.
 * @param {number} [count=4]
 * @returns {string} HTML
 */
export function renderKPISkeleton(count?: number) {
  if (count === undefined) count = 4;
  let html = '';
  for (let i = 0; i < count; i++) {
    html += '<div class="' + SKELETON_CLASS + '-kpi">' +
      _line('short') +
      '<div class="' + SKELETON_CLASS + '-circle"></div>' +
      _line('medium') +
    '</div>';
  }
  return '<div class="' + SKELETON_CLASS + '-kpis">' + html + '</div>';
}

/**
 * Render skeleton for filter/toolbar area.
 * @returns {string} HTML
 */
export function renderFiltersSkeleton() {
  return '<div class="' + SKELETON_CLASS + '-filters">' +
    _line('long') +
    _line('medium') +
    _line('short') +
  '</div>';
}

/**
 * Render skeleton for item list rows.
 * @param {number} [rows=8] — Number of skeleton rows
 * @returns {string} HTML
 */
export function renderItemsSkeleton(rows?: number) {
  if (rows === undefined) rows = 8;
  let items = '';
  const sizes = ['long', 'medium', 'short', 'medium'];
  for (let i = 0; i < rows; i++) {
    const s1 = sizes[i % sizes.length];
    const s2 = sizes[(i + 1) % sizes.length];
    items += '<div class="' + SKELETON_CLASS + '-item">' +
      '<div class="' + SKELETON_CLASS + '-avatar"></div>' +
      '<div class="' + SKELETON_CLASS + '-item-content">' +
        _line(s1) +
        _line(s2) +
      '</div>' +
      _line('short') +
    '</div>';
  }
  return '<div class="' + SKELETON_CLASS + '-list">' + items + '</div>';
}

/**
 * Render skeleton for a tabular view.
 * @param {number} [rows=8]
 * @param {number} [cols=5]
 * @returns {string} HTML
 */
export function renderTableSkeleton(rows?: number, cols?: number) {
  if (rows === undefined) rows = 8;
  if (cols === undefined) cols = 5;

  let header = '<tr>';
  for (let c = 0; c < cols; c++) {
    header += '<th><div class="' + SKELETON_CLASS + '-line ' + SKELETON_CLASS + '-medium"></div></th>';
  }
  header += '</tr>';

  let body = '';
  const sizes = ['long', 'medium', 'short', 'full', 'medium'];
  for (let r = 0; r < rows; r++) {
    body += '<tr>';
    for (let c = 0; c < cols; c++) {
      const size = sizes[(r + c) % sizes.length];
      body += '<td><div class="' + SKELETON_CLASS + '-line ' + SKELETON_CLASS + '-' + size + '"></div></td>';
    }
    body += '</tr>';
  }

  return '<div class="' + SKELETON_CLASS + '-table-wrap">' +
    '<table class="' + SKELETON_CLASS + '-table">' +
      '<thead>' + header + '</thead>' +
      '<tbody>' + body + '</tbody>' +
    '</table>' +
  '</div>';
}

/**
 * Render skeleton for pagination area.
 * @returns {string} HTML
 */
export function renderPaginationSkeleton() {
  return '<div class="' + SKELETON_CLASS + '-pagination">' +
    _line('short') +
    _line('medium') +
    _line('short') +
  '</div>';
}

/**
 * Render a full panel skeleton (KPIs + filters + items + pagination).
 * @param {number} [rows=8]
 * @returns {string} HTML
 */
export function renderFullSkeleton(rows?: number) {
  return '<div class="' + SKELETON_CLASS + ' ' + SKELETON_CLASS + '--animated">' +
    renderKPISkeleton(4) +
    renderFiltersSkeleton() +
    renderItemsSkeleton(rows) +
    renderPaginationSkeleton() +
  '</div>';
}

/**
 * Show skeleton inside a container.
 * @param {HTMLElement} container
 * @param {number} [rows=8]
 * @param {'items'|'table'|'full'} [variant='items']
 */
export function showSkeleton(container: HTMLElement, rows?: number, variant?: string) {
  if (!container) return;
  if (rows === undefined) rows = 8;
  if (variant === undefined) variant = 'items';

  let html;
  switch (variant) {

    case 'table': html = renderTableSkeleton(rows); break;
    case 'full': html = renderFullSkeleton(rows); break;
    default: html = renderItemsSkeleton(rows);
  }

  container.insertAdjacentHTML('afterbegin', '<div class="' + SKELETON_CLASS + '-wrapper ' + SKELETON_CLASS + '--animated" data-skeleton>' + html + '</div>');
}

/**
 * Hide/remove skeleton from a container.
 * @param {HTMLElement} container
 */
export function hideSkeleton(container: HTMLElement) {
  if (!container) return;
  const el = container.querySelector('[data-skeleton]');
  if (el) el.remove();
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}

export function healthCheck() {
  return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION };
}

export default {
  renderKPISkeleton, renderFiltersSkeleton, renderItemsSkeleton, renderTableSkeleton,
  renderPaginationSkeleton, renderFullSkeleton, showSkeleton, hideSkeleton,
  info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID
};
