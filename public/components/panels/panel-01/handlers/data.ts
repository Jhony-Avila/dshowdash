// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:handlers:data
// PURPOSE: Panel-01 - Data Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   updateRefreshBtn from ../core/template.js
//   apiClient from ../services/api.js
//   store from ../state/store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   healthCheck() — exported function
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
import { updateRefreshBtn } from '../core/template.js';
import { apiClient } from '../services/api.js';
import { store } from '../state/store.js';
import * as Toast from '../ui/toast.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:handlers:data';

export async function loadAllData(ctx: Record<string, unknown>) {
  const startTime = Date.now();
  store.setLoading(true);
  updateRefreshBtn(ctx.wrapper as HTMLElement, true);

  try {
    const cacheKey = `allData_${JSON.stringify(store.getState().filters)}`;
    const cached = ctx.indexedDBCache ? await (ctx.indexedDBCache as Record<string, (...args: unknown[]) => Promise<unknown>>).get(cacheKey) : null;

    if (cached) {
      const c = cached as Record<string, unknown>;
      store.setKPIs(c.kpis);
      store.setRequisicoes(c.requisicoes, c.pagination);
      store.setFilterOptions(c.filterOptions || {});
    }

    const state = store.getState();
    const params = Object.assign({}, state.filters, { page: state.pagination.page, limit: state.pagination.limit, sort: state.sort.field, order: state.sort.order });

    const result = await (ctx.dataLoader as Record<string, (...args: unknown[]) => Promise<Record<string, unknown>>>).load(params);

    if (ctx.workerManager && result.requisicoes && (result.requisicoes as unknown[]).length > 50) {
      const kpis = await (ctx.workerManager as Record<string, (...args: unknown[]) => Promise<unknown>>).calculateKPIs(result.requisicoes);
      result.kpis = Object.assign({}, result.kpis, kpis);
    }

    store.setKPIs(result.kpis);
    store.setRequisicoes(result.requisicoes, result.pagination);
    const filters = result.filters as Record<string, unknown> | null | undefined;
    store.setFilterOptions({ situacoes: filters ? filters.situacoes : [], centros: filters ? filters.centros : [] });

    if (ctx.indexedDBCache) {
      await (ctx.indexedDBCache as Record<string, (...args: unknown[]) => Promise<unknown>>).set(cacheKey, { kpis: result.kpis, requisicoes: result.requisicoes, pagination: result.pagination, filterOptions: result.filterOptions }, 'data', CONFIG.performance.indexedDB.ttl);
    }

    if (ctx.telemetry) (ctx.telemetry as Record<string, (...args: unknown[]) => void>).trackLoad(Date.now() - startTime, true);
    if (ctx.badgeNew) (ctx.badgeNew as Record<string, () => void>).markAsSeen();

  } catch (error) {
    store.setError((error as Error).message);
    if (ctx.telemetry) (ctx.telemetry as Record<string, (...args: unknown[]) => void>).trackError(error, 'loadAllData');
    Toast.error('Erro ao carregar dados');
  }
}

export async function loadRequisicoes(ctx: Record<string, unknown>) {
  store.setLoading(true);
  try {
    const state = store.getState();
    const params = Object.assign({}, state.filters, { page: state.pagination.page, limit: state.pagination.limit, sort: state.sort.field, order: state.sort.order });
    const result = await apiClient.fetchRequisicoes(params);
    if (result.ok) {
      store.setRequisicoes(result.data, result.pagination);
      if (ctx.saveState) (ctx.saveState as () => void)();
    } else {
      store.setError(result.error);
      Toast.error(result.error || 'Erro ao carregar');
    }
  } catch (error) {
    store.setError((error as Error).message);
  }
}

export async function executeSearch(ctx: Record<string, unknown>, query: string, signal: AbortSignal) {
  if (!query || query.length < 2) {
    store.setFilter('q', '');
    loadRequisicoes(ctx);
    return;
  }
  store.setFilter('q', query);
  const state = store.getState();
  if (ctx.fuzzySearch && state.requisicoes && (state.requisicoes as unknown[]).length > 0) {
    const filtered = (ctx.fuzzySearch as Record<string, (...args: unknown[]) => unknown[]>).search(state.requisicoes, query);
    store.setRequisicoes(filtered, { total: filtered.length, page: 1, limit: state.pagination.limit, totalPages: 1 });
  } else {
    await loadRequisicoes(ctx);
  }
}

export async function loadDetail(ctx: Record<string, unknown>, id: string | number) {
  try {
    const result = await (ctx.dataLoader as Record<string, (...args: unknown[]) => Promise<Record<string, unknown>>>).loadDetail(id);
    store.openDrawer(result.data);
    if (ctx.drawer) (ctx.drawer as Record<string, (...args: unknown[]) => void>).open(result.data);
    if (ctx.telemetry) (ctx.telemetry as Record<string, (...args: unknown[]) => void>).trackInteraction('view', { id });
  } catch (error) {
    Toast.error('Erro ao carregar detalhes');
  }
}

export function healthCheck() {
  const checks = { apiClientAvailable: !!apiClient, storeAvailable: !!store, toastAvailable: !!Toast };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { loadAllData, loadRequisicoes, executeSearch, loadDetail, healthCheck, info, VERSION, MODULE_ID };
