// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:quick-filters
// PURPOSE: Table Engine - Quick Filters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   COMMON_QUICK_FILTERS — exported value
//   renderQuickFilters() — exported function
//   createQuickFilter() — exported function
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
export const MODULE_ID = 'table-engine:quick-filters';

const QF_SVGS = {
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clear: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export function renderQuickFilters(quickFilters: Array<{ id: string; label: string; icon?: string; description?: string; count?: number }>, activeFilterIds: string[], options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  if (!quickFilters || quickFilters.length === 0) return '';
  const chipsHtml = quickFilters.map(qf => {
    const isActive = activeFilterIds.indexOf(qf.id) >= 0;
    return `<button class="${p}quick-filter-chip ${isActive ? `${p}chip-active` : ''}" data-quick-filter="${qf.id}" title="${qf.description || qf.label}">${qf.icon ? `<span class="${p}chip-icon">${qf.icon}</span>` : ''}<span class="${p}chip-label">${qf.label}</span>${qf.count !== undefined ? `<span class="${p}chip-count">${qf.count}</span>` : ''}</button>`;
  }).join('');
  return `<div class="${p}quick-filters"><span class="${p}quick-filters-label">Filtros rápidos:</span><div class="${p}quick-filters-chips">${chipsHtml}</div>${activeFilterIds.length > 0 ? `<button class="${p}quick-filters-clear" data-action="clear-quick-filters" title="Limpar todos">${QF_SVGS.clear} Limpar</button>` : ''}</div>`;
}

export const COMMON_QUICK_FILTERS = {
  status: [
    { id: 'active', label: 'Ativos', icon: QF_SVGS.check, filters: [{ column: 'status', operator: 'equals', value: 'ativo' }] },
    { id: 'inactive', label: 'Inativos', icon: QF_SVGS.x, filters: [{ column: 'status', operator: 'equals', value: 'inativo' }] },
    { id: 'pending', label: 'Pendentes', icon: '⏳', filters: [{ column: 'status', operator: 'equals', value: 'pendente' }] }
  ],
  date: [
    { id: 'today', label: 'Hoje', icon: '📅', filters: [{ column: 'data', operator: 'today' }] },
    { id: 'this_week', label: 'Esta semana', icon: '📅', filters: [{ column: 'data', operator: 'this_week' }] },
    { id: 'this_month', label: 'Este mês', icon: '📅', filters: [{ column: 'data', operator: 'this_month' }] }
  ],
  value: [
    { id: 'high_value', label: 'Alto valor', icon: '💰', filters: [{ column: 'valor', operator: 'gte', value: 10000 }] },
    { id: 'low_value', label: 'Baixo valor', icon: '💵', filters: [{ column: 'valor', operator: 'lt', value: 1000 }] }
  ]
};

export function createQuickFilter(id: string, label: string, filters: Array<Record<string, unknown>>, options: Record<string, unknown>) {
  const opts = options || {};
  return { id, label, filters, icon: opts.icon || null, description: opts.description || null, count: opts.count };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, commonFilters: Object.keys(COMMON_QUICK_FILTERS) }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderQuickFilters, COMMON_QUICK_FILTERS, createQuickFilter, info, healthCheck, VERSION, MODULE_ID };
