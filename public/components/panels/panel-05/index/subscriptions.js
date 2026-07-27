import { store } from "../state/store.js";
import { updateKPIs } from "../renderer/kpis.js";
import { updateTable, updatePagination, updateSort } from "../renderer/table.js";
import { updateLoading, updateError, hideStatus } from "../renderer/status.js";
import { updateFilters } from "../renderer/filters.js";
import { _refs, _favoritos, addUnsubscribe } from "./state.js";
function setupSubscriptions(showCliente360, hideCliente360) {
  addUnsubscribe(store.subscribe("kpis", (kpis) => {
    updateKPIs(_refs, kpis);
    hideStatus(_refs);
  }));
  addUnsubscribe(store.subscribe("clientes", (clientes) => {
    updateTable(_refs, clientes, _favoritos);
    hideStatus(_refs);
  }));
  addUnsubscribe(store.subscribe("pagination", (pagination) => {
    updatePagination(_refs, pagination);
  }));
  addUnsubscribe(store.subscribe("sort", (sort) => {
    updateSort(_refs, sort);
  }));
  addUnsubscribe(store.subscribe("loading", (loading) => {
    updateLoading(_refs, loading);
  }));
  addUnsubscribe(store.subscribe("error", (error) => {
    updateError(_refs, error);
  }));
  addUnsubscribe(store.subscribe("filters", (filters) => {
    updateFilters(_refs, filters);
  }));
  addUnsubscribe(store.subscribe("cliente360", (cliente360) => {
    if (cliente360) showCliente360(cliente360);
    else hideCliente360();
  }));
}
var subscriptions_default = { setupSubscriptions };
const MODULE_ID = "panel-05:index:subscriptions";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { subscriptionsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  subscriptions_default as default,
  healthCheck,
  info,
  setupSubscriptions
};
