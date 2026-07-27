// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:handlers:data
// PURPOSE: Panel-05 - Data Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   store from ../state/store.js
//   apiClient from ../services/api.js
//   toastManager from ../ui/toast.js
//   emitLifecycle, log from ../utils/lifecycle.js
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

import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { store } from '../state/store.js';
import { apiClient } from '../services/api.js';
import { toastManager } from '../ui/toast.js';
import * as Telemetry from '../telemetry/tracker.js';
import { emitLifecycle, log } from '../utils/lifecycle.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:handlers:data';

export async function loadAllData(moduleId: string, version: string) {
  store.setLoading(true);
  emitLifecycle(moduleId, version, PANEL_EVENTS.LOADING);
  Telemetry.startTimer('loadAllData');
  try {
    const params = store.getFiltersForAPI();
    const response = await apiClient.fetchAllData(params);
    if (response.kpis) store.setKPIs(response.kpis);
    if (response.clientes) store.setClientes(response.clientes);
    if (response.charts) store.setCharts(response.charts);
    if (response.topClientes) store.setTopClientes(response.topClientes);
    if (response.vendedores) store.setVendedores(response.vendedores);
    if (response.insights) store.setInsights(response.insights);
    if (response.comparativo) store.setComparativo(response.comparativo);
    if (response.funil) store.setFunil(response.funil);
    if (response.metrics) store.setMetrics(response.metrics);
    if (response.churn) store.setChurn(response.churn);
    if (response.ranking) store.setRanking(response.ranking);
    if (response.heatmap) store.setHeatmap(response.heatmap);
    store.setLoading(false);
    const duration = Telemetry.endTimer('loadAllData');
    emitLifecycle(moduleId, version, PANEL_EVENTS.LOADED, { duration });
  } catch (error: any) {
    Telemetry.trackError(error, { action: 'loadAllData' });
    log('error', 'Load error:', error);
    store.setError(error.message || 'Erro ao carregar dados');
    toastManager.error('Erro ao carregar dados');
    emitLifecycle(moduleId, version, PANEL_EVENTS.ERROR, { error: error.message });
  }
}

export async function loadClientes() {
  store.setLoading(true);
  Telemetry.startTimer('loadClientes');
  try {
    const params = store.getFiltersForAPI();
    const response = await apiClient.fetchClientes(params);
    if (response.ok && response.data) { store.setClientes(response.data); }
    else { store.setError((response.error as string) || 'Erro ao carregar clientes'); toastManager.error((response.error as string) || 'Erro ao carregar clientes'); }
    Telemetry.endTimer('loadClientes');
  } catch (error: any) {
    Telemetry.trackError(error, { action: 'loadClientes' });
    store.setError(error.message || 'Erro ao carregar clientes');
    toastManager.error('Erro ao carregar clientes');
  }
}

export async function loadCliente360(id: unknown) {
  store.setLoading(true);
  Telemetry.startTimer('loadCliente360');
  try {
    const response = await apiClient.fetchCliente360(id);
    if (response.ok && response.data) { store.setCliente360(response.data); }
    else { store.setError((response.error as string) || 'Cliente não encontrado'); toastManager.error('Cliente não encontrado'); }
    Telemetry.endTimer('loadCliente360');
  } catch (error: any) {
    Telemetry.trackError(error, { action: 'loadCliente360', clienteId: id });
    store.setError(error.message || 'Erro ao carregar cliente');
    toastManager.error('Erro ao carregar cliente');
  }
  store.setLoading(false);
}

export function healthCheck() { const checks = { storeAvailable: !!store, apiClientAvailable: !!apiClient, toastAvailable: !!toastManager, telemetryAvailable: !!Telemetry }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true }; }

export default { loadAllData, loadClientes, loadCliente360, healthCheck, info, VERSION, MODULE_ID };
