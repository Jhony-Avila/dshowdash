import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-ui-events";
function OrchestratorUIEvents() {
  this.container = null;
  this.handlers = /* @__PURE__ */ new Map();
  this.abortController = null;
  this.initialized = false;
  this.destroyed = false;
}
OrchestratorUIEvents.prototype.getVersion = () => VERSION;
OrchestratorUIEvents.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
OrchestratorUIEvents.prototype.init = function(container) {
  if (this.initialized) return this;
  this.container = container;
  this.abortController = new AbortController();
  this._bindEvents();
  this.initialized = true;
  this.destroyed = false;
  logger.info(`UI Events inicializados (${VERSION})`);
  return this;
};
OrchestratorUIEvents.prototype._bindEvents = function() {
  const self = this;
  if (!this.container) return;
  const signal = this.abortController.signal;
  const applyBtn = this.container.querySelector("#orchestrator-apply-preset");
  if (applyBtn) applyBtn.addEventListener("click", () => {
    self._onApplyPreset();
  }, { signal });
  const refreshAllBtn = this.container.querySelector("#orchestrator-refresh-all");
  if (refreshAllBtn) refreshAllBtn.addEventListener("click", () => {
    self._onRefreshAll();
  }, { signal });
  const resetBtn = this.container.querySelector("#orchestrator-reset-layout");
  if (resetBtn) resetBtn.addEventListener("click", () => {
    self._onResetLayout();
  }, { signal });
  const pauseBtn = this.container.querySelector("#orchestrator-pause");
  if (pauseBtn) pauseBtn.addEventListener("click", () => {
    self._onTogglePause();
  }, { signal });
  this.container.addEventListener("click", (e) => {
    self._onDelegatedClick(e);
  }, { signal });
};
OrchestratorUIEvents.prototype._onApplyPreset = function() {
  const selector = this.container?.querySelector("#orchestrator-preset-select");
  const presetId = selector?.value || "default";
  const handler = this.handlers.get("applyPreset");
  if (handler) handler(presetId);
};
OrchestratorUIEvents.prototype._onRefreshAll = function() {
  const handler = this.handlers.get("refreshAll");
  if (handler) handler();
};
OrchestratorUIEvents.prototype._onResetLayout = function() {
  const handler = this.handlers.get("resetLayout");
  if (handler) handler();
};
OrchestratorUIEvents.prototype._onTogglePause = function() {
  const handler = this.handlers.get("togglePause");
  if (handler) handler();
};
OrchestratorUIEvents.prototype._onDelegatedClick = function(e) {
  const toggleBtn = e.target.closest('[data-action="toggle-panel"]');
  if (toggleBtn) {
    const panelId = toggleBtn.dataset.panelId;
    const handler = this.handlers.get("togglePanel");
    if (handler && panelId) handler(panelId);
  }
};
OrchestratorUIEvents.prototype.onApplyPreset = function(handler) {
  this.handlers.set("applyPreset", handler);
  return this;
};
OrchestratorUIEvents.prototype.onRefreshAll = function(handler) {
  this.handlers.set("refreshAll", handler);
  return this;
};
OrchestratorUIEvents.prototype.onResetLayout = function(handler) {
  this.handlers.set("resetLayout", handler);
  return this;
};
OrchestratorUIEvents.prototype.onTogglePause = function(handler) {
  this.handlers.set("togglePause", handler);
  return this;
};
OrchestratorUIEvents.prototype.onTogglePanel = function(handler) {
  this.handlers.set("togglePanel", handler);
  return this;
};
OrchestratorUIEvents.prototype.off = function(eventName) {
  this.handlers.delete(eventName);
  return this;
};
OrchestratorUIEvents.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, hasContainer: !!this.container, handlerCount: this.handlers.size, handlers: Array.from(this.handlers.keys()) };
};
OrchestratorUIEvents.prototype.reset = function() {
  this.handlers.clear();
  this.destroyed = false;
};
OrchestratorUIEvents.prototype.destroy = function() {
  if (this.abortController) {
    this.abortController.abort();
    this.abortController = null;
  }
  this.handlers.clear();
  this.container = null;
  this.initialized = false;
  this.destroyed = true;
  logger.info("UI Events destru\xEDdos");
};
const orchestratorUIEvents = new OrchestratorUIEvents();
var events_default = orchestratorUIEvents;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true } };
}
export {
  MODULE_ID,
  OrchestratorUIEvents,
  VERSION,
  events_default as default,
  healthCheck,
  info,
  orchestratorUIEvents
};
