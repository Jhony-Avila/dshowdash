import orchestratorStore from "./store.js";
import { SCHEDULER_MODES, HEALTH_STATES } from "../bus/events-map.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-selectors";
function getVersion() {
  return VERSION;
}
function getStatus() {
  return orchestratorStore.get("status");
}
function getCurrentPreset() {
  return orchestratorStore.get("currentPreset");
}
function getActivePanels() {
  return orchestratorStore.get("activePanels") || [];
}
function getActivePanelIds() {
  const panels = getActivePanels();
  return panels.map((p) => p.panelId || p);
}
function getRegisteredModules() {
  const modules = orchestratorStore.get("registeredModules");
  return Array.from(modules.entries());
}
function getRegisteredModuleIds() {
  const modules = orchestratorStore.get("registeredModules");
  return Array.from(modules.keys());
}
function getModuleById(id) {
  const modules = orchestratorStore.get("registeredModules");
  return modules.get(id) || null;
}
function getSchedulerMode() {
  return orchestratorStore.get("schedulerMode");
}
function isSchedulerActive() {
  return getSchedulerMode() === SCHEDULER_MODES.ACTIVE;
}
function isSchedulerDegraded() {
  return getSchedulerMode() === SCHEDULER_MODES.DEGRADED;
}
function getErrorCount() {
  return orchestratorStore.get("errorCount");
}
function getWarningCount() {
  return orchestratorStore.get("warningCount");
}
function getHealthyModules() {
  const health = orchestratorStore.get("moduleHealth");
  const healthy = [];
  health.forEach((data, id) => {
    if (data.state === HEALTH_STATES.OK) healthy.push(id);
  });
  return healthy;
}
function getDegradedModules() {
  const health = orchestratorStore.get("moduleHealth");
  const degraded = [];
  health.forEach((data, id) => {
    if (data.state === HEALTH_STATES.DEGRADED || data.state === HEALTH_STATES.ERROR) degraded.push(id);
  });
  return degraded;
}
function getUptime() {
  const startTime = orchestratorStore.get("startTime");
  return Date.now() - startTime;
}
function getMetrics() {
  return orchestratorStore.getMetrics();
}
function getLastLayoutChange() {
  return orchestratorStore.get("lastLayoutChange");
}
function getConfig() {
  return orchestratorStore.get("config");
}
function isReady() {
  return getStatus() === "READY" || getStatus() === "RUNNING";
}
function isInitializing() {
  return getStatus() === "INITIALIZING";
}
function hasErrors() {
  return getErrorCount() > 0;
}
function getSnapshot() {
  return { version: VERSION, status: getStatus(), preset: getCurrentPreset(), activePanels: getActivePanelIds(), schedulerMode: getSchedulerMode(), errors: getErrorCount(), warnings: getWarningCount(), uptime: getUptime(), metrics: getMetrics() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: _state?._initialized !== false ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { selectorsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  getActivePanelIds,
  getActivePanels,
  getConfig,
  getCurrentPreset,
  getDegradedModules,
  getErrorCount,
  getHealthyModules,
  getLastLayoutChange,
  getMetrics,
  getModuleById,
  getRegisteredModuleIds,
  getRegisteredModules,
  getSchedulerMode,
  getSnapshot,
  getStatus,
  getUptime,
  getVersion,
  getWarningCount,
  hasErrors,
  healthCheck,
  info,
  isInitializing,
  isReady,
  isSchedulerActive,
  isSchedulerDegraded
};
