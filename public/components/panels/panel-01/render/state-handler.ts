// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:render:state-handler
// PURPOSE: Panel-01 - State Change Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   VIRTUAL_THRESHOLD from ../core/constants.js
//   updateStatusBadges, updateFooterStats, updateFilterCount, updateTimestamp, up...
//   VirtualScroll from ../utils/performance/virtual-scroll.js
//   formatCurrency from ../utils/formatters.js
//   renderKPIs from ./kpis.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   handleStateChange() — exported function
//   info() — exported function
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

import { CONFIG } from '../core/config.js';
import { VIRTUAL_THRESHOLD } from '../core/constants.js';
import { updateStatusBadges, updateFooterStats, updateFilterCount, updateTimestamp, updateRefreshBtn, populateFilterOptions } from '../core/template.js';
import { VirtualScroll } from '../utils/performance/virtual-scroll.js';
import { formatCurrency } from '../utils/formatters.js';
import { renderKPIs } from './kpis.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:render:state-handler';

export function handleStateChange(ctx: Record<string, unknown>, state: Record<string, unknown>) {
  const items = (state.requisicoes || []) as unknown[];
  const useVirtual = CONFIG.features.virtualScroll && items.length > VIRTUAL_THRESHOLD;

  // Virtual Scroll setup
  if (useVirtual && !ctx.virtualScroll && ctx.contentEl) {
    ctx.virtualScroll = new VirtualScroll(ctx.contentEl as HTMLElement, {
      rowHeight: CONFIG.table.virtualScroll.rowHeight,
      bufferSize: CONFIG.table.virtualScroll.bufferSize,
      onRenderRows: (data: unknown) => ctx.table && (ctx.table as Record<string, (...a: unknown[]) => void>).renderVirtual(data)
    });
    (ctx.virtualScroll as Record<string, () => void>).init();
  }

  // Render table
  if (useVirtual && ctx.virtualScroll) {
    (ctx.virtualScroll as Record<string, (...a: unknown[]) => void>).setItems(items);
  } else if (ctx.table) {
    (ctx.table as Record<string, (...a: unknown[]) => void>).render({
      loading: state.loading,
      error: state.error,
      items,
      selectedIds: ctx.selection ? (ctx.selection as Record<string, unknown>).selected : new Set(),
      sort: state.sort
    });
  }

  // Update extensions
  if (ctx.stickyColumns) (ctx.stickyColumns as Record<string, () => void>).refresh();
  if (ctx.pagination) (ctx.pagination as Record<string, (...a: unknown[]) => void>).render(state.pagination);

  // Render KPIs
  renderKPIs(ctx.kpisEl as HTMLElement, state.kpis as Record<string, unknown>, ctx.animations as Record<string, (...a: unknown[]) => void>);

  // Update badges
  const kpis = state.kpis as Record<string, unknown> | null | undefined;
  const pendenteLancamento = kpis?.pendenteLancamento as Record<string, unknown> | null | undefined;
  const pendentePagamento = kpis?.pendentePagamento as Record<string, unknown> | null | undefined;
  const pago = kpis?.pago as Record<string, unknown> | null | undefined;
  updateStatusBadges(ctx.wrapper as HTMLElement, {
    pendente: pendenteLancamento ? (pendenteLancamento.qtd as number) : 0,
    pagamento: pendentePagamento ? (pendentePagamento.qtd as number) : 0,
    pago: pago ? (pago.qtd as number) : 0,
    total: kpis ? (kpis.total as number) : 0
  });

  // Update footer
  const pagination = state.pagination as Record<string, unknown> | null | undefined;
  updateFooterStats(ctx.wrapper as HTMLElement, {
    total: pagination ? pagination.total : 0,
    valor: formatCurrency(kpis ? kpis.valorTotal : 0)
  });

  // Update misc
  updateFilterCount(ctx.wrapper as HTMLElement, items.length, pagination ? pagination.total as number : 0);
  if (state.lastUpdate) updateTimestamp(ctx.wrapper as HTMLElement, state.lastUpdate as number | string);
  updateRefreshBtn(ctx.wrapper as HTMLElement, state.loading as boolean);
  populateFilterOptions(ctx.wrapper as HTMLElement, state.filterOptions as Record<string, unknown>);

  // Check new items
  if (ctx.badgeNew && items.length > 0) {
    (ctx.badgeNew as Record<string, (...a: unknown[]) => void>).checkNewItems(items);
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export default { handleStateChange, info, VERSION, MODULE_ID };
