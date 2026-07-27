import { CONFIG } from "../core/config.js";
import { VIRTUAL_THRESHOLD } from "../core/constants.js";
import { updateStatusBadges, updateFooterStats, updateFilterCount, updateTimestamp, updateRefreshBtn, populateFilterOptions } from "../core/template.js";
import { VirtualScroll } from "../utils/performance/virtual-scroll.js";
import { formatCurrency } from "../utils/formatters.js";
import { renderKPIs } from "./kpis.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:render:state-handler";
function handleStateChange(ctx, state) {
  const items = state.requisicoes || [];
  const useVirtual = CONFIG.features.virtualScroll && items.length > VIRTUAL_THRESHOLD;
  if (useVirtual && !ctx.virtualScroll && ctx.contentEl) {
    ctx.virtualScroll = new VirtualScroll(ctx.contentEl, {
      rowHeight: CONFIG.table.virtualScroll.rowHeight,
      bufferSize: CONFIG.table.virtualScroll.bufferSize,
      onRenderRows: (data) => ctx.table && ctx.table.renderVirtual(data)
    });
    ctx.virtualScroll.init();
  }
  if (useVirtual && ctx.virtualScroll) {
    ctx.virtualScroll.setItems(items);
  } else if (ctx.table) {
    ctx.table.render({
      loading: state.loading,
      error: state.error,
      items,
      selectedIds: ctx.selection ? ctx.selection.selected : /* @__PURE__ */ new Set(),
      sort: state.sort
    });
  }
  if (ctx.stickyColumns) ctx.stickyColumns.refresh();
  if (ctx.pagination) ctx.pagination.render(state.pagination);
  renderKPIs(ctx.kpisEl, state.kpis, ctx.animations);
  const kpis = state.kpis;
  const pendenteLancamento = kpis?.pendenteLancamento;
  const pendentePagamento = kpis?.pendentePagamento;
  const pago = kpis?.pago;
  updateStatusBadges(ctx.wrapper, {
    pendente: pendenteLancamento ? pendenteLancamento.qtd : 0,
    pagamento: pendentePagamento ? pendentePagamento.qtd : 0,
    pago: pago ? pago.qtd : 0,
    total: kpis ? kpis.total : 0
  });
  const pagination = state.pagination;
  updateFooterStats(ctx.wrapper, {
    total: pagination ? pagination.total : 0,
    valor: formatCurrency(kpis ? kpis.valorTotal : 0)
  });
  updateFilterCount(ctx.wrapper, items.length, pagination ? pagination.total : 0);
  if (state.lastUpdate) updateTimestamp(ctx.wrapper, state.lastUpdate);
  updateRefreshBtn(ctx.wrapper, state.loading);
  populateFilterOptions(ctx.wrapper, state.filterOptions);
  if (ctx.badgeNew && items.length > 0) {
    ctx.badgeNew.checkNewItems(items);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
var state_handler_default = { handleStateChange, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  state_handler_default as default,
  handleStateChange,
  info
};
