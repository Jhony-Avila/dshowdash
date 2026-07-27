import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { register, get, has, list, listNamespaces, count, info as registryInfo, healthCheck as registryHealthCheck, injectPorts as registryInjectPorts } from "./registry.js";
import { NAMESPACE as UI_NS, ICONS as UI_ICONS } from "./icons/ui.js";
import { NAMESPACE as CHARTS_NS, ICONS as CHARTS_ICONS } from "./icons/charts.js";
import { NAMESPACE as TABLE_NS, ICONS as TABLE_ICONS } from "./icons/table.js";
import { NAMESPACE as SYSTEM_NS, ICONS as SYSTEM_ICONS } from "./icons/system.js";
import { NAMESPACE as BUSINESS_NS, ICONS as BUSINESS_ICONS } from "./icons/business.js";
import { NAMESPACE as EXTENDED_NS, ICONS as EXTENDED_ICONS } from "./icons/extended.js";
const VERSION = "1.6.0-P2-ENTERPRISE";
const MODULE_ID = "icon-registry";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => {
  Ports.inject(p);
  registryInjectPorts(p);
  return true;
};
const getPorts = () => Ports.snapshot();
register(UI_NS, UI_ICONS);
register(CHARTS_NS, CHARTS_ICONS);
register(TABLE_NS, TABLE_ICONS);
register(SYSTEM_NS, SYSTEM_ICONS);
register(BUSINESS_NS, BUSINESS_ICONS);
register(EXTENDED_NS, EXTENDED_ICONS);
const info = () => {
  const regInfo = registryInfo();
  return { moduleId: MODULE_ID, version: VERSION, registry: regInfo, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
const healthCheck = () => {
  const regHealth = registryHealthCheck();
  const checks = { registryHealthy: regHealth.status === "HEALTHY", hasIcons: regHealth.totalIcons > 0, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const [k, v] of Object.entries(checks)) {
    if (v) passed++;
  }
  return { status: passed === 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/3`, checks, registry: regHealth, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
const cleanup = () => ({ success: true, moduleId: MODULE_ID });
const reset = () => cleanup();
const destroy = () => cleanup();
const IconRegistry = { get, has, list, listNamespaces, count, register, info, healthCheck, cleanup, reset, destroy, injectPorts, getPorts, VERSION, MODULE_ID };
var icon_registry_default = IconRegistry;
export {
  IconRegistry,
  MODULE_ID,
  VERSION,
  cleanup,
  count,
  icon_registry_default as default,
  destroy,
  get,
  getPorts,
  has,
  healthCheck,
  info,
  injectPorts,
  list,
  listNamespaces,
  register,
  reset
};
