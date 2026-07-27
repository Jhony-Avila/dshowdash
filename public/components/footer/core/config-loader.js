import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { fetchWithRetry } from "./http-client.js";
import { increment } from "./metrics.js";
import { createLogger } from "./logger.js";
const VERSION = "10.3.0-P17WI";
const MODULE_ID = "footer-config-loader";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = createLogger(MODULE_ID);
let _config = null;
let _dynamicItems = null;
const _metrics = { loads: 0, errors: 0, dynamicLoads: 0, dynamicErrors: 0 };
const DEFAULT_CONFIG = { id: "footer", version: VERSION, layout: { type: "two-bar", topBarHeight: "80px", bottomBarHeight: "36px" }, brand: { name: "DshowDash", tagline: "Enterprise Business Intelligence", animation: { enabled: true, path: "/components/animacoes/Lottie_Graph_Growth.json" } }, dock: { enabled: true, showTooltips: true, items: [] }, features: { routerIntegration: true, globalStateIntegration: true, eventBusIntegration: true, lottieEnabled: true }, defaults: { locale: "pt-BR", environment: "production" }, i18n: { brandName: "DshowDash", copyright: "Display Solutions. Todos os direitos reservados.", online: "Online", offline: "Offline", connectionRestored: "Conexao restaurada", connectionLost: "Conexao perdida" } };
function loadDynamicItems() {
  if (_dynamicItems) return Promise.resolve(_dynamicItems);
  _metrics.dynamicLoads++;
  return fetchWithRetry("/api/modules/footer/api.php?action=items").then((response) => {
    if (response.ok) return response.json();
    throw new Error("API not OK");
  }).then((result) => {
    if (result.ok && result.data && result.data.items) {
      _dynamicItems = result.data.items;
      _log.info(`Dynamic items loaded count=${_dynamicItems.length}`);
      return _dynamicItems;
    }
    throw new Error("Invalid API response");
  }).catch((error) => {
    _metrics.dynamicErrors++;
    _log.warn(`Dynamic items load failed: ${error.message}`);
    _dynamicItems = [];
    return _dynamicItems;
  });
}
function mergeConfigWithDynamicItems(staticConfig, dynamicItems) {
  const merged = Object.assign({}, staticConfig);
  if (dynamicItems && dynamicItems.length > 0) {
    merged.dock = merged.dock || { enabled: true, showTooltips: true, items: [] };
    merged.dock.items = dynamicItems.map((item) => {
      if (item.type === "separator") return { id: item.id, type: "separator" };
      const iconName = item.icon || item.icon_name || item.key || item.item_key;
      let actionData = item.actionData || item.action_data || {};
      let panelId = null;
      let widget = null;
      let action = null;
      if (typeof actionData === "string") {
        try {
          actionData = JSON.parse(actionData);
        } catch (e) {
          actionData = {};
        }
      }
      if (actionData) {
        panelId = actionData.panelId || actionData.panel_id || null;
        widget = actionData.widget || null;
        action = actionData.action || null;
      }
      panelId = panelId || item.panelId || item.panel_id || null;
      return {
        id: iconName,
        dbId: item.id,
        icon: iconName,
        tooltip: item.tooltip,
        label: item.label,
        actionType: item.actionType || item.action_type,
        panelId,
        panel: panelId,
        actionData,
        action,
        widget,
        href: item.href,
        ariaLabel: item.ariaLabel || item.tooltip,
        group: item.group || item.group_name,
        minAccessLevel: item.minAccessLevel || item.min_access_level,
        visible: item.visible !== false && item.is_visible !== false
      };
    });
    merged.dock.source = "database";
    merged.dock.itemCount = dynamicItems.length;
  }
  return merged;
}
function loadConfig() {
  if (_config && _dynamicItems) return Promise.resolve(_config);
  _metrics.loads++;
  const cfg = _getPort("config");
  const basePath = cfg && cfg.paths && cfg.paths.components ? cfg.paths.components : "/components";
  return Promise.all([
    fetchWithRetry(`${basePath}/footer/config.json`).then((response) => {
      if (response.ok) return response.json();
      throw new Error("Not OK");
    }).catch(() => {
      _log.warn("Static config failed, using defaults");
      return Object.assign({}, DEFAULT_CONFIG);
    }),
    loadDynamicItems()
  ]).then((results) => {
    const staticConfig = results[0];
    const dynamicItems = results[1];
    _config = mergeConfigWithDynamicItems(staticConfig, dynamicItems);
    increment("configLoads");
    _log.info(`Config loaded version=${_config.version} dockItems=${_config.dock ? _config.dock.items.length : 0}`);
    return _config;
  }).catch((error) => {
    _metrics.errors++;
    increment("errors");
    _log.warn(`Config load failed completely: ${error.message}`);
    _config = Object.assign({}, DEFAULT_CONFIG);
    return _config;
  });
}
function getConfig() {
  return _config;
}
function getDynamicItems() {
  return _dynamicItems;
}
function resetConfigCache() {
  _config = null;
  _dynamicItems = null;
}
function refreshDynamicItems() {
  _dynamicItems = null;
  return loadDynamicItems().then((items) => {
    if (_config) _config = mergeConfigWithDynamicItems(_config, items);
    return items;
  });
}
function getMetrics() {
  return Object.assign({}, _metrics, { hasConfig: !!_config, hasDynamicItems: !!_dynamicItems, dynamicItemCount: _dynamicItems ? _dynamicItems.length : 0 });
}
function info() {
  const ps = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, config: _config, dynamicItems: _dynamicItems, metrics: getMetrics(), portsInitialized: ps._initialized };
}
function healthCheck() {
  const ps = Ports.snapshot();
  const dynamicOk = _dynamicItems && _dynamicItems.length > 0;
  return { status: dynamicOk ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { configReady: !!_config, dynamicItemsLoaded: dynamicOk, itemCount: _dynamicItems ? _dynamicItems.length : 0, portsInitialized: ps._initialized }, metrics: getMetrics() };
}
var config_loader_default = { loadConfig, getConfig, getDynamicItems, resetConfigCache, refreshDynamicItems, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  config_loader_default as default,
  getConfig,
  getDynamicItems,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  loadConfig,
  refreshDynamicItems,
  resetConfigCache
};
