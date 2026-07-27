// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:column-filter
// PURPOSE: Table Engine - Column Filter Dropdown
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getOperatorsForType from ./engine.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderColumnFilterDropdown() — exported function
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
export const MODULE_ID = 'table-engine:column-filter';

const CF_SVGS = {
  close: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export function renderColumnFilterDropdown(column: Record<string, unknown>, data: Record<string, unknown>[], activeFilter: { operator?: string; value?: string } | null, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const operators = getOperatorsForType(column.type as string);
  const currentOperator = (activeFilter && activeFilter.operator) || (operators[0] && operators[0].id);
  const currentValue = (activeFilter && activeFilter.value) || '';
  const uniqueValues = getUniqueValues(data, column.id as string);
  const opsHtml = operators.map(op => `<option value="${op.id}" ${op.id === currentOperator ? 'selected' : ''}>${op.icon} ${op.label}</option>`).join('');
  let quickPickHtml = '';
  if (uniqueValues.length <= 20) {
    quickPickHtml = `<div class="${p}filter-quickpick-section"><label class="${p}filter-label">Seleção rápida:</label><div class="${p}filter-quickpick-list">${uniqueValues.map(v => `<label class="${p}filter-quickpick-item"><input type="checkbox" value="${v}" ${currentValue === v ? 'checked' : ''} /><span>${v || '(vazio)'}</span></label>`).join('')}</div></div>`;
  }
  return `<div class="${p}column-filter-dropdown" data-col="${column.id}"><div class="${p}filter-dropdown-header"><span class="${p}filter-dropdown-title">Filtrar: ${column.label || column.id}</span><button class="${p}filter-dropdown-close" data-action="close-filter">${CF_SVGS.close}</button></div><div class="${p}filter-dropdown-body"><div class="${p}filter-operator-section"><label class="${p}filter-label">Condição:</label><select class="${p}filter-operator-select" data-col="${column.id}">${opsHtml}</select></div><div class="${p}filter-value-section"><label class="${p}filter-label">Valor:</label>${renderValueInput(column, currentValue, opts)}</div>${quickPickHtml}</div><div class="${p}filter-dropdown-footer"><button class="${p}filter-btn ${p}filter-btn-clear" data-action="clear-column-filter" data-col="${column.id}">Limpar</button><button class="${p}filter-btn ${p}filter-btn-apply" data-action="apply-column-filter" data-col="${column.id}">Aplicar</button></div></div>`;
}

function renderValueInput(column: Record<string, unknown>, value: string, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const type = (column.type || 'text') as string;
  if (['date', 'datetime'].indexOf(type) >= 0) return `<input type="date" class="${p}filter-value-input" value="${value}" />`;
  if (['number', 'currency', 'percent'].indexOf(type) >= 0) return `<input type="number" class="${p}filter-value-input" value="${value}" step="any" />`;
  return `<input type="text" class="${p}filter-value-input" value="${value}" placeholder="Digite o valor..." />`;
}

function getUniqueValues(data: Record<string, unknown>[], columnId: string) {
  const values = new Set();
  data.forEach(row => { const val = row[columnId]; if (val != null) values.add(String(val)); });
  return Array.from(values).sort();
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderColumnFilterDropdown, info, healthCheck, VERSION, MODULE_ID };
