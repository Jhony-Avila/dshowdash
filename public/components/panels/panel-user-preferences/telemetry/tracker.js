import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "panel-user-preferences.telemetry.tracker";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const metrics = { eventsTracked: 0, lastEventAt: null, errors: 0, sessionStart: Date.now() };
const track = (event, data = {}) => {
  const timestamp = Date.now();
  const payload = { component: MODULE_ID, event, timestamp, sessionDuration: timestamp - metrics.sessionStart, ...data };
  metrics.eventsTracked++;
  metrics.lastEventAt = timestamp;
  const core = _getPort("telemetryCore");
  if (core?.track) {
    try {
      core.track(`${MODULE_ID}:${event}`, payload);
    } catch (e) {
      metrics.errors++;
    }
  }
  return payload;
};
const tracker = {
  mounted: (context) => track("mounted", { context: context || {}, status: "success" }),
  unmounted: (reason) => track("unmounted", { reason: reason || "normal", sessionDuration: Date.now() - metrics.sessionStart }),
  mountBlocked: (reason) => track("mount_blocked", { reason, status: "blocked" }),
  authRequired: (source) => track("auth_required", { source: source || "unknown", status: "unauthenticated" }),
  authExpired: () => track("auth_expired", { status: "expired" }),
  authSuccess: (source) => track("auth_success", { source }),
  refreshSuccess: (duration, source) => track("refresh_success", { duration, source: source || "manual", status: "success" }),
  refreshError: (error, duration) => {
    metrics.errors++;
    return track("refresh_error", { error: error?.message ?? String(error), duration, status: "error" });
  },
  refreshSkipped: (reason) => track("refresh_skipped", { reason }),
  preferenceSaved: (key, value) => track("preference_saved", { key, valueType: typeof value, status: "success" }),
  preferenceError: (key, error) => {
    metrics.errors++;
    return track("preference_error", { key, error: error?.message ?? String(error), status: "error" });
  },
  layoutSaved: (key, isDefault) => track("layout_saved", { key, isDefault, status: "success" }),
  layoutDeleted: (key) => track("layout_deleted", { key, status: "success" }),
  layoutApplied: (key) => track("layout_applied", { key, status: "success" }),
  layoutError: (action, error) => {
    metrics.errors++;
    return track("layout_error", { action, error: error?.message ?? String(error), status: "error" });
  },
  viewApplied: (viewId) => track("view_applied", { viewId, status: "success" }),
  viewDeleted: (viewId) => track("view_deleted", { viewId, status: "success" }),
  viewError: (action, error) => {
    metrics.errors++;
    return track("view_error", { action, error: error?.message ?? String(error), status: "error" });
  },
  exportDone: (itemCount) => track("export_done", { itemCount, status: "success" }),
  importDone: (itemCount) => track("import_done", { itemCount, status: "success" }),
  importError: (error) => {
    metrics.errors++;
    return track("import_error", { error: error?.message ?? String(error), status: "error" });
  },
  themeChanged: (theme) => track("theme_changed", { theme }),
  panelToggled: (panelId, visible) => track("panel_toggled", { panelId, visible }),
  healthCheck: () => {
    const core = _getPort("telemetryCore");
    return { healthy: true, coreAvailable: !!core, portsInitialized: Ports.isInitialized(), metrics: { ...metrics }, sessionDuration: Date.now() - metrics.sessionStart, p22Compliant: true, timestamp: Date.now() };
  },
  info: () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), p22Compliant: true, metrics: { ...metrics }, coreAvailable: !!_getPort("telemetryCore") }),
  reset: () => {
    metrics.eventsTracked = 0;
    metrics.lastEventAt = null;
    metrics.errors = 0;
    metrics.sessionStart = Date.now();
  },
  track,
  injectPorts,
  getPorts
};
var tracker_default = tracker;
const Tracker = tracker;
export {
  MODULE_ID,
  Tracker,
  VERSION,
  tracker_default as default,
  getPorts,
  injectPorts,
  track,
  tracker
};
