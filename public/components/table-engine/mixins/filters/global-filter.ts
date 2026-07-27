// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:global-filter
// PURPOSE: Table Engine - Global Filter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   applyGlobalFilter() — exported function
//   renderGlobalFilter() — exported function
//   highlightMatches() — exported function
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
export const MODULE_ID = 'table-engine:global-filter';

const GF_SVGS = {
  clear: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
};

export function applyGlobalFilter(data: Record<string, unknown>[], query: string, columns: Array<{ id: string; searchable?: boolean }>, options: Record<string, unknown> = {}) {
  const opts = options || {};
  if (!query || !query.trim()) return data;
  const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const searchableColumns = columns.filter(c => c.searchable !== false).map(c => c.id);
  const matchMode = opts.matchMode || 'all';
  return data.filter(row => {
    const rowText = searchableColumns.map(colId => String(row[colId] || '').toLowerCase()).join(' ');
    if (matchMode === 'any') return searchTerms.some(term => rowText.indexOf(term) >= 0);
    return searchTerms.every(term => rowText.indexOf(term) >= 0);
  });
}

export function renderGlobalFilter(currentQuery: string, options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const placeholder = opts.placeholder || 'Buscar em todas as colunas...';
  return `<div class="${p}global-filter"><div class="${p}global-filter-wrapper"><span class="${p}global-filter-icon">🔍</span><input type="text" class="${p}global-filter-input" placeholder="${placeholder}" value="${currentQuery || ''}" data-action="global-search" />${currentQuery ? `<button class="${p}global-filter-clear" data-action="clear-global-search" title="Limpar">${GF_SVGS.clear}</button>` : ''}</div>${opts.showHint ? `<span class="${p}global-filter-hint">Pressione Enter para buscar</span>` : ''}</div>`;
}

export function highlightMatches(text: string, query: string, options: Record<string, unknown> = {}) {
  if (!query || !text) return text;
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = String(text);
  terms.forEach(term => {
    const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
    result = result.replace(regex, `<mark class="${p}highlight">$1</mark>`);
  });
  return result;
}

function escapeRegex(str: string) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { applyGlobalFilter, renderGlobalFilter, highlightMatches, info, healthCheck, VERSION, MODULE_ID };
