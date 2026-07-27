import { getSnapshot } from "../state/selectors.js";
import { createPanelListItem } from "./template.js";
import logger from "../utils/logger.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "orchestrator-ui-controls";
function OrchestratorControls() {
  this.container = null;
  this.updateInterval = null;
  this.initialized = false;
  this.destroyed = false;
}
OrchestratorControls.prototype.getVersion = () => VERSION;
OrchestratorControls.prototype.isInitialized = function() {
  return this.initialized && !this.destroyed;
};
OrchestratorControls.prototype.init = function(container) {
  const self = this;
  if (this.initialized) return this;
  this.container = container;
  this._startAutoUpdate();
  this.initialized = true;
  this.destroyed = false;
  logger.info(`Controls inicializados (${VERSION})`);
  return this;
};
OrchestratorControls.prototype._startAutoUpdate = function() {
  const self = this;
  if (this.updateInterval) clearInterval(this.updateInterval);
  this.updateInterval = setInterval(() => {
    self.updateMetrics();
  }, 5e3);
  this.updateMetrics();
};
OrchestratorControls.prototype.updateMetrics = function() {
  if (!this.container || this.destroyed) return;
  const snapshot = getSnapshot();
  const uptimeEl = this.container.querySelector('[data-metric="uptime"]');
  if (uptimeEl) uptimeEl.textContent = this._formatUptime(snapshot.uptime);
  const errorsEl = this.container.querySelector('[data-metric="errors"]');
  if (errorsEl) {
    errorsEl.textContent = snapshot.errors;
    errorsEl.classList.toggle("has-errors", snapshot.errors > 0);
  }
  const schedulerEl = this.container.querySelector('[data-metric="scheduler"]');
  if (schedulerEl) schedulerEl.textContent = snapshot.schedulerMode;
  const panelCountEl = this.container.querySelector(".panel-count");
  if (panelCountEl) panelCountEl.textContent = snapshot.activePanels.length;
};
OrchestratorControls.prototype._formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};
OrchestratorControls.prototype.updateStatus = function(status) {
  if (!this.container) return;
  const statusEl = this.container.querySelector(".orchestrator-status");
  if (statusEl) {
    statusEl.dataset.status = status;
    const textEl = statusEl.querySelector(".status-text");
    if (textEl) textEl.textContent = status;
  }
};
OrchestratorControls.prototype.updatePanelList = function(panels) {
  if (!this.container) return;
  const listEl = this.container.querySelector("#orchestrator-panel-list");
  if (!listEl) return;
  listEl.innerHTML = panels.map((panel) => createPanelListItem(panel)).join("");
  const countEl = this.container.querySelector(".panel-count");
  if (countEl) countEl.textContent = String(panels.length);
};
OrchestratorControls.prototype.updatePresetSelector = function(presetId) {
  if (!this.container) return;
  const selector = this.container.querySelector("#orchestrator-preset-select");
  if (selector) selector.value = presetId;
  const selectorDiv = this.container.querySelector(".preset-selector");
  if (selectorDiv) selectorDiv.dataset.current = presetId;
};
OrchestratorControls.prototype.getStats = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this.initialized, destroyed: this.destroyed, hasContainer: !!this.container, hasInterval: !!this.updateInterval };
};
OrchestratorControls.prototype.reset = function() {
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }
  if (this.container) this._startAutoUpdate();
  this.destroyed = false;
};
OrchestratorControls.prototype.destroy = function() {
  if (this.updateInterval) {
    clearInterval(this.updateInterval);
    this.updateInterval = null;
  }
  this.container = null;
  this.initialized = false;
  this.destroyed = true;
  logger.info("Controls destru\xEDdos");
};
const orchestratorControls = new OrchestratorControls();
var controls_default = orchestratorControls;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { controlsReady: true } };
}
export {
  MODULE_ID,
  OrchestratorControls,
  VERSION,
  controls_default as default,
  healthCheck,
  info,
  orchestratorControls
};
