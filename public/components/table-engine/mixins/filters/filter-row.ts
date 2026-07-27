// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:filter-row
// PURPOSE: Table Engine - Filter Row
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getOperatorsForType from ./engine.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderFilterRow() — exported function
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

import { getOperatorsForType } from './engine.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:filter-row';

const FR_SVGS = {
  clear: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export function renderFilterRow(columns: Record<string, unknown>[], activeFilters: Array<{ column: string; operator?: string; value?: string }>, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  let cells = '';
  if (opts.selectable !== false) cells += `<th class="${p}filter-cell ${p}filter-checkbox"></th>`;
  columns.forEach(col => {
    if (col.filterable === false) { cells += `<th class="${p}filter-cell ${p}filter-disabled"></th>`; return; }
    const activeFilter = activeFilters.find(f => f.column === col.id);
    const hasFilter = !!activeFilter;
    const operators = getOperatorsForType(col.type as string);
    const currentOperator = (activeFilter && activeFilter.operator) || (operators[0] && operators[0].id) || 'contains';
    const opsHtml = operators.map(op => `<option value="${op.id}" ${op.id === currentOperator ? 'selected' : ''}>${op.icon}</option>`).join('');
    cells += `<th class="${p}filter-cell ${hasFilter ? `${p}filter-active` : ''}" data-col="${col.id}"><div class="${p}filter-wrapper"><select class="${p}filter-operator" data-col="${col.id}" title="Operador">${opsHtml}</select>${renderFilterInput(col, activeFilter, opts)}${hasFilter ? `<button class="${p}filter-clear" data-col="${col.id}" title="Limpar">${FR_SVGS.clear}</button>` : ''}</div></th>`;
  });
  if (opts.hoverActions !== false) cells += `<th class="${p}filter-cell ${p}filter-actions"></th>`;
  return `<tr class="${p}tr-filters">${cells}</tr>`;
}

function renderFilterInput(col: Record<string, unknown>, activeFilter: { column: string; operator?: string; value?: string } | undefined, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const value = (activeFilter && activeFilter.value) || '';
  const type = (col.type || 'text') as string;
  if (['select', 'status', 'enum'].indexOf(type) >= 0 && col.options) {
    const optsHtml = (col.options as Array<Record<string, unknown> | string>).map((opt: Record<string, unknown> | string) => {
      const optValue = typeof opt === 'object' ? opt.value : opt;
      const optLabel = typeof opt === 'object' ? opt.label : opt;
      return `<option value="${optValue}" ${optValue === value ? 'selected' : ''}>${optLabel}</option>`;
    }).join('');
    return `<select class="${p}filter-input ${p}filter-select" data-col="${col.id}"><option value="">Todos</option>${optsHtml}</select>`;
  }
  if (['boolean', 'bool'].indexOf(type as string) >= 0) {
    return `<select class="${p}filter-input ${p}filter-bool" data-col="${col.id}"><option value="">Todos</option><option value="true" ${value === 'true' ? 'selected' : ''}>Sim</option><option value="false" ${value === 'false' ? 'selected' : ''}>Não</option></select>`;
  }
  if (['date', 'datetime'].indexOf(type as string) >= 0) {
    return `<input type="date" class="${p}filter-input ${p}filter-date" data-col="${col.id}" value="${value}" />`;
  }
  if (['number', 'currency', 'percent', 'integer', 'float'].indexOf(type as string) >= 0) {
    return `<input type="number" class="${p}filter-input ${p}filter-number" data-col="${col.id}" value="${value}" placeholder="Valor" />`;
  }
  return `<input type="text" class="${p}filter-input ${p}filter-text" data-col="${col.id}" value="${value}" placeholder="Filtrar..." />`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderFilterRow, info, healthCheck, VERSION, MODULE_ID };
