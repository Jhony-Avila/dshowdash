import { StateController as _StateController } from "../state/controller.js";
import { TelemetryPort, StoragePort } from "../ports/index.js";
import { ApiClient } from "../services/api.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
const StateController = _StateController;
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-16:headless";
class HeadlessPanelClass {
  constructor() {
    this._initialized = false;
    this._apiClient = null;
    this._data = { kpis: null, list: [], pagination: { total: 0, page: 1, limit: 30 } };
    this._filters = {};
    this._metrics = { loads: 0, queries: 0, errors: 0 };
  }
  async init(options = {}) {
    if (this._initialized) return this;
    if (typeof window === "undefined") {
      const memStorage = { _data: {}, getItem(k) {
        return this._data[k] || null;
      }, setItem(k, v) {
        this._data[k] = v;
      }, removeItem(k) {
        delete this._data[k];
      }, clear() {
        this._data = {};
      } };
      StoragePort.inject(memStorage, memStorage);
    }
    StateController.hydrate(options.defaultColumns || [], options.defaultViews || []);
    this._apiClient = new ApiClient(MODULE_ID, { info: () => {
    }, warn: () => {
    }, error: () => {
    }, debug: () => {
    } });
    this._initialized = true;
    TelemetryPort.track(LIFECYCLE_EVENTS.INIT, { feature: "headless", options: Object.keys(options) });
    return this;
  }
  async loadKPIs(options = {}) {
    if (!this._initialized) await this.init();
    try {
      const result = await this._apiClient.getKPIs(options);
      if (result.success) {
        this._data.kpis = result.payload.kpis;
        StateController.set("data", { ...StateController.get("data"), kpis: result.payload.kpis });
        this._metrics.loads++;
        return { success: true, kpis: result.payload.kpis };
      }
      this._metrics.errors++;
      return { success: false, error: result.error };
    } catch (e) {
      this._metrics.errors++;
      return { success: false, error: e.message };
    }
  }
  async loadList(params = {}) {
    if (!this._initialized) await this.init();
    const mergedParams = { ...this._filters, ...params };
    try {
      const result = await this._apiClient.getList(mergedParams);
      if (result.success) {
        this._data.list = result.payload.list || [];
        this._data.pagination = result.payload.pagination || this._data.pagination;
        StateController.batch({ data: { ...StateController.get("data"), list: this._data.list, pagination: this._data.pagination } });
        this._metrics.loads++;
        this._metrics.queries++;
        return { success: true, list: this._data.list, pagination: this._data.pagination };
      }
      this._metrics.errors++;
      return { success: false, error: result.error };
    } catch (e) {
      this._metrics.errors++;
      return { success: false, error: e.message };
    }
  }
  setFilters(filters) {
    this._filters = { ...this._filters, ...filters };
    StateController.set("filters", this._filters);
    return this;
  }
  async query(params = {}) {
    const kpisResult = await this.loadKPIs(params);
    const listResult = await this.loadList(params);
    return { kpis: kpisResult, list: listResult };
  }
  getData() {
    return { ...this._data };
  }
  getKPIs() {
    return this._data.kpis;
  }
  getList() {
    return this._data.list;
  }
  getFilters() {
    return { ...this._filters };
  }
  getState(prop) {
    return StateController.get(prop);
  }
  setState(prop, value) {
    StateController.set(prop, value);
    return this;
  }
  exportData(format = "json") {
    const data = { kpis: this._data.kpis, list: this._data.list, pagination: this._data.pagination, filters: this._filters, exportedAt: Date.now() };
    if (format === "json") return JSON.stringify(data, null, 2);
    if (format === "csv") return this._toCSV(this._data.list);
    return data;
  }
  _toCSV(list) {
    if (!list.length) return "";
    const headers = Object.keys(list[0]);
    const rows = list.map((item) => headers.map((h) => `"${item[h] ?? ""}"`).join(";"));
    return [headers.join(";"), ...rows].join("\n");
  }
  reset() {
    this._data = { kpis: null, list: [], pagination: { total: 0, page: 1, limit: 30 } };
    this._filters = {};
    StateController.reset({ clearStorage: false });
    return this;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  healthCheck() {
    return { status: this._initialized ? "HEALTHY" : "UNINITIALIZED", moduleId: MODULE_ID, version: VERSION, checks: { initialized: this._initialized, hasData: !!this._data.kpis || this._data.list.length > 0 }, metrics: this.getMetrics() };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, dataStats: { kpis: !!this._data.kpis, listCount: this._data.list.length, total: this._data.pagination.total }, filters: this._filters, metrics: this.getMetrics() };
  }
}
const HeadlessPanel = new HeadlessPanelClass();
var headless_default = HeadlessPanel;
export {
  HeadlessPanel,
  MODULE_ID,
  VERSION,
  headless_default as default
};
