import { apiClient } from "../services/api.js";
import { CircuitBreaker } from "../utils/circuit-breaker.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/core/data-loader";
class DataLoader {
  constructor(options = {}) {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: options.failureThreshold || 3,
      resetTimeout: options.resetTimeout || 3e4
    });
    this.abortController = null;
    this.lastParams = null;
  }
  async load(params) {
    this.abort();
    this.abortController = new AbortController();
    this.lastParams = params;
    return this.circuitBreaker.call(async () => {
      const result = await apiClient.fetchAllData(params, this.abortController.signal);
      if (!result.ok) throw new Error(result.error || "Failed to load data");
      return result;
    });
  }
  async loadDetail(id) {
    return this.circuitBreaker.call(async () => {
      const result = await apiClient.fetchRequisicao360(id);
      if (!result.ok) throw new Error(result.error || "Failed to load detail");
      return result;
    });
  }
  async reload() {
    if (this.lastParams) return this.load(this.lastParams);
    throw new Error("No previous params to reload");
  }
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
  getCircuitState() {
    return this.circuitBreaker.getState();
  }
  destroy() {
    this.abort();
    this.circuitBreaker.reset();
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var data_loader_default = DataLoader;
export {
  DataLoader,
  MODULE_ID,
  VERSION,
  data_loader_default as default,
  healthCheck,
  info
};
