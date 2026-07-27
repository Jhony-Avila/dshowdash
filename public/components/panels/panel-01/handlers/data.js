import { CONFIG } from "../core/config.js";
import { updateRefreshBtn } from "../core/template.js";
import { apiClient } from "../services/api.js";
import { store } from "../state/store.js";
import * as Toast from "../ui/toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:handlers:data";
async function loadAllData(ctx) {
  const startTime = Date.now();
  store.setLoading(true);
  updateRefreshBtn(ctx.wrapper, true);
  try {
    const cacheKey = `allData_${JSON.stringify(store.getState().filters)}`;
    const cached = ctx.indexedDBCache ? await ctx.indexedDBCache.get(cacheKey) : null;
    if (cached) {
      const c = cached;
      store.setKPIs(c.kpis);
      store.setRequisicoes(c.requisicoes, c.pagination);
      store.setFilterOptions(c.filterOptions || {});
    }
    const state = store.getState();
    const params = Object.assign({}, state.filters, { page: state.pagination.page, limit: state.pagination.limit, sort: state.sort.field, order: state.sort.order });
    const result = await ctx.dataLoader.load(params);
    if (ctx.workerManager && result.requisicoes && result.requisicoes.length > 50) {
      const kpis = await ctx.workerManager.calculateKPIs(result.requisicoes);
      result.kpis = Object.assign({}, result.kpis, kpis);
    }
    store.setKPIs(result.kpis);
    store.setRequisicoes(result.requisicoes, result.pagination);
    const filters = result.filters;
    store.setFilterOptions({ situacoes: filters ? filters.situacoes : [], centros: filters ? filters.centros : [] });
    if (ctx.indexedDBCache) {
      await ctx.indexedDBCache.set(cacheKey, { kpis: result.kpis, requisicoes: result.requisicoes, pagination: result.pagination, filterOptions: result.filterOptions }, "data", CONFIG.performance.indexedDB.ttl);
    }
    if (ctx.telemetry) ctx.telemetry.trackLoad(Date.now() - startTime, true);
    if (ctx.badgeNew) ctx.badgeNew.markAsSeen();
  } catch (error) {
    store.setError(error.message);
    if (ctx.telemetry) ctx.telemetry.trackError(error, "loadAllData");
    Toast.error("Erro ao carregar dados");
  }
}
async function loadRequisicoes(ctx) {
  store.setLoading(true);
  try {
    const state = store.getState();
    const params = Object.assign({}, state.filters, { page: state.pagination.page, limit: state.pagination.limit, sort: state.sort.field, order: state.sort.order });
    const result = await apiClient.fetchRequisicoes(params);
    if (result.ok) {
      store.setRequisicoes(result.data, result.pagination);
      if (ctx.saveState) ctx.saveState();
    } else {
      store.setError(result.error);
      Toast.error(result.error || "Erro ao carregar");
    }
  } catch (error) {
    store.setError(error.message);
  }
}
async function executeSearch(ctx, query, signal) {
  if (!query || query.length < 2) {
    store.setFilter("q", "");
    loadRequisicoes(ctx);
    return;
  }
  store.setFilter("q", query);
  const state = store.getState();
  if (ctx.fuzzySearch && state.requisicoes && state.requisicoes.length > 0) {
    const filtered = ctx.fuzzySearch.search(state.requisicoes, query);
    store.setRequisicoes(filtered, { total: filtered.length, page: 1, limit: state.pagination.limit, totalPages: 1 });
  } else {
    await loadRequisicoes(ctx);
  }
}
async function loadDetail(ctx, id) {
  try {
    const result = await ctx.dataLoader.loadDetail(id);
    store.openDrawer(result.data);
    if (ctx.drawer) ctx.drawer.open(result.data);
    if (ctx.telemetry) ctx.telemetry.trackInteraction("view", { id });
  } catch (error) {
    Toast.error("Erro ao carregar detalhes");
  }
}
function healthCheck() {
  const checks = { apiClientAvailable: !!apiClient, storeAvailable: !!store, toastAvailable: !!Toast };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var data_default = { loadAllData, loadRequisicoes, executeSearch, loadDetail, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  data_default as default,
  executeSearch,
  healthCheck,
  info,
  loadAllData,
  loadDetail,
  loadRequisicoes
};
