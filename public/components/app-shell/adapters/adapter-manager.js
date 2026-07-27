const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.adapter-manager";
import { execute as circuitExecute } from "../utils/circuit-breaker.js";
import GlobalStateAdapter from "./globalstate-adapter.js";
import AuthAdapter from "./auth-adapter.js";
import LayoutAdapter from "./layout-adapter.js";
import ThemeAdapter from "./theme-adapter.js";
import NotificationAdapter from "./notification-adapter.js";
import RouterAdapter from "./router-adapter.js";
import TickerAdapter from "./ticker-adapter.js";
import ResponsiveAdapter from "./responsive-adapter/index.js";
const ADAPTER_CONFIG = Object.freeze({
  globalState: { enabled: true, lazy: false, instance: null },
  auth: { enabled: true, lazy: true, instance: null },
  layout: { enabled: true, lazy: false, instance: null },
  theme: { enabled: true, lazy: false, instance: null },
  notification: { enabled: true, lazy: true, instance: null },
  router: { enabled: true, lazy: true, instance: null },
  ticker: { enabled: true, lazy: true, instance: null },
  responsive: { enabled: true, lazy: false, instance: null }
});
const _adapters = /* @__PURE__ */ new Map();
const _metrics = { adaptersConnected: 0, errors: 0 };
function connectAdapter(name, adapterModule, callbacks, logger, metrics) {
  if (_adapters.has(name)) {
    return Promise.resolve({ ok: true, adapter: name, cached: true });
  }
  const config = ADAPTER_CONFIG[name];
  if (!config || !config.enabled) {
    return Promise.resolve({ ok: false, error: `Adapter not enabled: ${name}` });
  }
  return circuitExecute(`adapter-${name}`, () => new Promise((resolve) => {
    try {
      let instance;
      if (adapterModule) {
        instance = typeof adapterModule.init === "function" ? adapterModule.init() : adapterModule;
      } else {
        instance = { name, connected: true };
      }
      _adapters.set(name, {
        name,
        instance,
        connectedAt: Date.now(),
        healthy: true
      });
      _metrics.adaptersConnected++;
      resolve({ ok: true, adapter: name });
    } catch (e) {
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  })).catch((e) => {
    _metrics.errors++;
    return { ok: false, error: e.message };
  });
}
function disconnectAllAdapters() {
  const disconnected = [];
  _adapters.forEach((adapterInfo, name) => {
    try {
      if (adapterInfo.instance && typeof adapterInfo.instance.destroy === "function") {
        adapterInfo.instance.destroy();
      }
      disconnected.push(name);
    } catch (e) {
      _metrics.errors++;
    }
  });
  _adapters.clear();
  return disconnected;
}
function getConnectedAdaptersList() {
  const list = [];
  _adapters.forEach((info, name) => {
    list.push({
      name,
      connectedAt: info.connectedAt,
      healthy: info.healthy
    });
  });
  return list;
}
function collectAdapterHealths() {
  const healths = {};
  _adapters.forEach((info, name) => {
    try {
      if (info.instance && typeof info.instance.healthCheck === "function") {
        healths[name] = info.instance.healthCheck();
      } else {
        healths[name] = { status: "HEALTHY", connected: true };
      }
    } catch (e) {
      healths[name] = { status: "ERROR", error: e.message };
    }
  });
  return healths;
}
function collectAdapterInfos() {
  const infos = {};
  _adapters.forEach((info, name) => {
    try {
      if (info.instance && typeof info.instance.info === "function") {
        infos[name] = info.instance.info();
      } else {
        infos[name] = { name, connectedAt: info.connectedAt };
      }
    } catch (e) {
      infos[name] = { error: e.message };
    }
  });
  return infos;
}
function getAdapterInstances() {
  const instances = {};
  _adapters.forEach((info, name) => {
    instances[name] = info.instance || null;
  });
  return instances;
}
function getMetrics() {
  return {
    adaptersConnected: _metrics.adaptersConnected,
    currentlyConnected: _adapters.size,
    errors: _metrics.errors
  };
}
var adapter_manager_default = {
  ADAPTER_CONFIG,
  connectAdapter,
  disconnectAllAdapters,
  getConnectedAdaptersList,
  collectAdapterHealths,
  collectAdapterInfos,
  getAdapterInstances,
  getMetrics,
  GlobalStateAdapter,
  AuthAdapter,
  LayoutAdapter,
  ThemeAdapter,
  NotificationAdapter,
  RouterAdapter,
  TickerAdapter,
  ResponsiveAdapter
};
export {
  ADAPTER_CONFIG,
  AuthAdapter,
  GlobalStateAdapter,
  LayoutAdapter,
  MODULE_ID,
  NotificationAdapter,
  ResponsiveAdapter,
  RouterAdapter,
  ThemeAdapter,
  TickerAdapter,
  VERSION,
  collectAdapterHealths,
  collectAdapterInfos,
  connectAdapter,
  adapter_manager_default as default,
  disconnectAllAdapters,
  getAdapterInstances,
  getConnectedAdaptersList,
  getMetrics
};
