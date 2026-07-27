// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/render-grouped
// PURPOSE: Panel-01 Table - Grouped Render
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderHeader from ./render/header.js
//   renderRows from ./render/row.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatCurrency() — exported function
//   renderGrouped() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   EXPAND_SVGS — exported value
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

import { renderHeader } from './render/header.js';
import { renderRows } from './render/row.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/render-grouped';

const EXPAND_SVGS = Object.freeze({ expanded: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>', collapsed: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' });

export const formatCurrency = (value: unknown) => { const num = parseFloat(String(value)) || 0; return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`; };

export const renderGrouped = (ctx: Record<string, unknown>, items: Record<string, unknown>[], selectedIds: Set<string>, sort: unknown) => {
  const groups = (ctx.grouping as Record<string, (...a: unknown[]) => unknown[]>).groupItems(items);
  const allSelected = items.length > 0 && items.every((i: Record<string, unknown>) => selectedIds.has(String(i.id || i.Id_Requisicao)));
  const header = renderHeader({ columns: ctx.columns, sort, allSelected });
  const colCount = (ctx.columns as Record<string, unknown>[]).filter((c: Record<string, unknown>) => c.visible).length;
  let tbodyContent = '';

  // @ts-expect-error strict migration — TS2345
  groups.forEach((group: Record<string, unknown>) => {
    if (group.key !== null) {
      const isExpanded = (ctx.grouping as Record<string, (...args: unknown[]) => unknown>).isExpanded(group.key);
      const expandIcon = isExpanded ? EXPAND_SVGS.expanded : EXPAND_SVGS.collapsed;
      const totalFormatted = formatCurrency(group.total);
      tbodyContent += `<tr class="p01-group-row" data-group="${group.key}"><td colspan="${colCount}"><div class="p01-group-header"><span class="p01-group-toggle">${expandIcon}</span><span class="p01-group-label">${group.label}</span><span class="p01-group-count">(${group.count})</span><span class="p01-group-total">${totalFormatted}</span></div></td></tr>`;
      if (isExpanded) { tbodyContent += renderRows(group.items as Record<string, unknown>[], { columns: ctx.columns, selectedIds }); }
    } else {
      tbodyContent += renderRows(group.items as Record<string, unknown>[], { columns: ctx.columns, selectedIds });
    }
  });

  (ctx.container as HTMLElement).innerHTML = `<div class="p01-table-wrapper"><table class="p01-table p01-table--grouped" role="grid">${header}<tbody>${tbodyContent}</tbody></table></div>`;
};

export const healthCheck = () => { const checks = { renderHeaderAvailable: typeof renderHeader === 'function', renderRowsAvailable: typeof renderRows === 'function' }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() }; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, p25Compliant: true });

export { EXPAND_SVGS };
