import { createAppShellAdapter } from "./appshell-adapter.js";
import { createRouterAdapter } from "./router-adapter.js";
import { createPermissionsAdapter } from "./permissions-adapter.js";
import { createPreloaderAdapter } from "./preloader-adapter.js";
const VERSION = "5.5.0-ENTERPRISE";
const MODULE_ID = "login-modal-integrations";
class IntegrationsManager {
  constructor(loginModal, config = {}) {
    this.loginModal = loginModal;
    this.config = config;
    this.adapters = {
      appShell: createAppShellAdapter(loginModal, config.appShell || {}),
      router: createRouterAdapter(loginModal, config.router || {}),
      permissions: createPermissionsAdapter(loginModal, config.permissions || {}),
      preloader: createPreloaderAdapter(loginModal, config.preloader || {})
    };
    this._metrics = { connectAlls: 0, disconnectAlls: 0, individualConnects: 0, individualDisconnects: 0 };
  }
  // @ts-expect-error TS migration - TS2339
  connectAll() {
    this._metrics.connectAlls++;
    const connected = [];
    Object.entries(this.adapters).forEach(([name, adapter]) => {
      if (adapter.isAvailable() && adapter.connect()) {
        connected.push(name);
      }
    });
    return connected;
  }
  disconnectAll() {
    this._metrics.disconnectAlls++;
    Object.values(this.adapters).forEach((adapter) => {
      try {
        adapter.disconnect();
      } catch (e) {
      }
    });
  }
  connect(name) {
    this._metrics.individualConnects++;
    const adapter = this.adapters[name];
    if (adapter) {
      return adapter.connect();
    }
    return false;
  }
  disconnect(name) {
    this._metrics.individualDisconnects++;
    const adapter = this.adapters[name];
    if (adapter) {
      adapter.disconnect();
    }
  }
  // @ts-expect-error TS migration - TS2339
  getStatus() {
    const status = {};
    Object.entries(this.adapters).forEach(([name, adapter]) => {
      status[name] = adapter.getStatus();
    });
    return status;
  }
  checkAvailability() {
    const availability = {};
    Object.entries(this.adapters).forEach(([name, adapter]) => {
      availability[name] = adapter.isAvailable();
    });
    return availability;
  }
  getAdapter(name) {
    return this.adapters[name] || null;
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, metrics: { ...this._metrics }, adapters: Object.keys(this.adapters), status: this.getStatus(), availability: this.checkAvailability(), timestamp: Date.now() };
  }
  healthCheck() {
    const availability = this.checkAvailability();
    const availableCount = Object.values(availability).filter(Boolean).length;
    const checks = { hasAdapters: Object.keys(this.adapters).length === 4, atLeastOneAvailable: availableCount > 0, managerOperational: typeof this.connectAll === "function" };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}
function createIntegrations(loginModal, config = {}) {
  return new IntegrationsManager(loginModal, config);
}
var integrations_default = IntegrationsManager;
export {
  IntegrationsManager,
  MODULE_ID,
  VERSION,
  createIntegrations,
  integrations_default as default
};
