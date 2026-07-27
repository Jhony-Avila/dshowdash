// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16:headless
// PURPOSE: Headless Mode - Panel-16 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   StateController from ../state/controller.js
//   TelemetryPort, StoragePort from ../ports/index.js
//   ApiClient from ../services/api.js
//   LIFECYCLE_EVENTS from /core/runtime/events/catalog/lifecycle.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   HeadlessPanel — exported value
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

import { StateController as _StateController } from '../state/controller.js';
import { TelemetryPort, StoragePort } from '../ports/index.js';
import { ApiClient } from '../services/api.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

interface StateControllerAPI {
  hydrate(defaultColumns: unknown[], defaultViews: unknown[]): StateControllerAPI;
  snapshot(): Record<string, unknown>;
  restore(snapshot: Record<string, unknown>, options?: Record<string, unknown>): StateControllerAPI;
  set(prop: string, value: unknown, options?: Record<string, unknown>): StateControllerAPI;
  get(prop?: string): Record<string, unknown>;
  batch(updates: Record<string, unknown>, options?: Record<string, unknown>): StateControllerAPI;
  reset(options?: Record<string, unknown>): StateControllerAPI;
  [key: string]: unknown;
}
const StateController = _StateController as unknown as StateControllerAPI;

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-16:headless';

class HeadlessPanelClass {
  [key: string]: any;
  constructor() { this._initialized = false; this._apiClient = null; this._data = { kpis: null, list: [], pagination: { total: 0, page: 1, limit: 30 } }; this._filters = {}; this._metrics = { loads: 0, queries: 0, errors: 0 }; }

  async init(options: Record<string, unknown> = {}) {
    if (this._initialized) return this;
    if (typeof window === 'undefined') { const memStorage = { _data: {} as Record<string, unknown>, getItem(k: string) { return this._data[k] || null; }, setItem(k: string, v: unknown) { this._data[k] = v; }, removeItem(k: string) { delete this._data[k]; }, clear() { this._data = {}; } }; StoragePort.inject(memStorage, memStorage); }
    StateController.hydrate((options.defaultColumns || []) as unknown[], (options.defaultViews || []) as unknown[]);
    this._apiClient = new ApiClient(MODULE_ID, { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} });
    this._initialized = true;

    TelemetryPort.track(LIFECYCLE_EVENTS.INIT, { feature: 'headless', options: Object.keys(options) });
    return this;
  }

  async loadKPIs(options: Record<string, unknown> = {}) {
    if (!this._initialized) await this.init();
    try { const result = await this._apiClient.getKPIs(options); if (result.success) { this._data.kpis = result.payload.kpis; StateController.set('data', { ...StateController.get('data'), kpis: result.payload.kpis }); this._metrics.loads++; return { success: true, kpis: result.payload.kpis }; } this._metrics.errors++; return { success: false, error: result.error }; } catch (e: any) { this._metrics.errors++; return { success: false, error: e.message }; }
  }

  async loadList(params: Record<string, unknown> = {}) {
    if (!this._initialized) await this.init();
    const mergedParams = { ...this._filters, ...params };
    try { const result = await this._apiClient.getList(mergedParams); if (result.success) { this._data.list = result.payload.list || []; this._data.pagination = result.payload.pagination || this._data.pagination; StateController.batch({ data: { ...StateController.get('data'), list: this._data.list, pagination: this._data.pagination } }); this._metrics.loads++; this._metrics.queries++; return { success: true, list: this._data.list, pagination: this._data.pagination }; } this._metrics.errors++; return { success: false, error: result.error }; } catch (e: any) { this._metrics.errors++; return { success: false, error: e.message }; }
  }

  setFilters(filters: Record<string, unknown>) { this._filters = { ...this._filters, ...filters }; StateController.set('filters', this._filters); return this; }
  async query(params: Record<string, unknown> = {}) { const kpisResult = await this.loadKPIs(params); const listResult = await this.loadList(params); return { kpis: kpisResult, list: listResult }; }
  getData() { return { ...this._data }; }
  getKPIs() { return this._data.kpis; }
  getList() { return this._data.list; }
  getFilters() { return { ...this._filters }; }
  getState(prop: string) { return StateController.get(prop); }
  setState(prop: string, value: unknown) { StateController.set(prop, value); return this; }

  exportData(format = 'json') {
    const data = { kpis: this._data.kpis, list: this._data.list, pagination: this._data.pagination, filters: this._filters, exportedAt: Date.now() };
    if (format === 'json') return JSON.stringify(data, null, 2);
    if (format === 'csv') return this._toCSV(this._data.list);
    return data;
  }

  _toCSV(list: Record<string, unknown>[]) { if (!list.length) return ''; const headers = Object.keys(list[0]); const rows = list.map((item: Record<string, unknown>) => headers.map(h => `"${item[h] ?? ''}"`).join(';')); return [headers.join(';'), ...rows].join('\n'); }

  reset() { this._data = { kpis: null, list: [], pagination: { total: 0, page: 1, limit: 30 } }; this._filters = {}; StateController.reset({ clearStorage: false }); return this; }
  getMetrics() { return { ...this._metrics }; }
  healthCheck() { return { status: this._initialized ? 'HEALTHY' : 'UNINITIALIZED', moduleId: MODULE_ID, version: VERSION, checks: { initialized: this._initialized, hasData: !!this._data.kpis || this._data.list.length > 0 }, metrics: this.getMetrics() }; }
  info() { return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, dataStats: { kpis: !!this._data.kpis, listCount: this._data.list.length, total: this._data.pagination.total }, filters: this._filters, metrics: this.getMetrics() }; }
}

export const HeadlessPanel = new HeadlessPanelClass();
export default HeadlessPanel;
