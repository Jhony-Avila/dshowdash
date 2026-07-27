import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "main-orchestrator-controller";
class OrchestratorController {
  constructor(context = {}) {
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._authPort = context.ports?.auth || null;
    this._panelPort = context.ports?.panel || null;
    this._manifestController = context.manifestController || null;
    this._layoutController = context.layoutController || null;
    this._errorSupervisor = context.errorSupervisor || null;
    this._activePanel = null;
    this._activePanelId = null;
    this._loading = false;
    this._abortController = null;
    this._metrics = { loadsCompleted: 0, loadsFailed: 0, mountsCompleted: 0, mountsFailed: 0 };
  }
  async load(panelId) {
    if (this._loading) this._cancelCurrentLoad();
    this._loading = true;
    this._abortController = new AbortController();
    this._telemetry?.track?.("orchestrator:load-start", { panelId });
    this._emit(ORCHESTRATOR_EVENTS.LOADING, { panelId });
    try {
      const metadata = await this._manifestController?.resolvePanel?.(panelId);
      if (this._authPort) {
        const minLevel = metadata?.minLevel || 0;
        const userLevel = this._authPort.getLevel?.() || 0;
        if (minLevel > 0 && userLevel < minLevel) throw new Error(`Insufficient permissions for panel ${panelId}`);
      }
      if (metadata?.layout && this._layoutController) this._layoutController.applyLayout(metadata.layout);
      const panelModule = await this._panelPort?.load?.(panelId);
      this._metrics.loadsCompleted++;
      this._telemetry?.track?.("orchestrator:load-complete", { panelId });
      return { panelModule, metadata };
    } catch (error) {
      this._metrics.loadsFailed++;
      this._errorSupervisor?.capture?.(error, { panelId, phase: "orchestrator:load" });
      this._telemetry?.error?.(error, { panelId, phase: "orchestrator:load" });
      throw error;
    } finally {
      this._loading = false;
    }
  }
  async mount(panelModule, container, config = {}) {
    this._telemetry?.track?.("orchestrator:mount-start", { panelId: config.panelId });
    this._emit(CONTAINER_EVENTS.MOUNTING, { panelId: config.panelId });
    try {
      const instance = await this._panelPort?.mount?.(panelModule, container, config);
      this._activePanel = panelModule;
      this._activePanelId = config.panelId;
      this._metrics.mountsCompleted++;
      this._telemetry?.track?.("orchestrator:mount-complete", { panelId: config.panelId });
      this._emit(CONTAINER_EVENTS.MOUNTED, { panelId: config.panelId });
      return instance;
    } catch (error) {
      this._metrics.mountsFailed++;
      this._errorSupervisor?.capture?.(error, { panelId: config.panelId, phase: "orchestrator:mount" });
      throw error;
    }
  }
  async unmount() {
    if (!this._activePanel) return false;
    const panelId = this._activePanelId;
    this._telemetry?.track?.("orchestrator:unmount-start", { panelId });
    this._emit(CONTAINER_EVENTS.UNMOUNTING, { panelId });
    try {
      await this._panelPort?.unmount?.(this._activePanel);
      this._activePanel = null;
      this._activePanelId = null;
      this._telemetry?.track?.("orchestrator:unmount-complete", { panelId });
      this._emit(CONTAINER_EVENTS.UNMOUNTED, { panelId });
      return true;
    } catch (error) {
      this._errorSupervisor?.capture?.(error, { panelId, phase: "orchestrator:unmount" });
      throw error;
    }
  }
  async hydrate(panelInstance) {
    if (!panelInstance?.hydrate) return false;
    this._telemetry?.track?.("orchestrator:hydrate-start", { panelId: this._activePanelId });
    try {
      await panelInstance.hydrate();
      this._telemetry?.track?.("orchestrator:hydrate-complete", { panelId: this._activePanelId });
      return true;
    } catch (error) {
      this._errorSupervisor?.capture?.(error, { phase: "orchestrator:hydrate" });
      return false;
    }
  }
  _cancelCurrentLoad() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }
  getActivePanel() {
    return this._activePanel;
  }
  getActivePanelId() {
    return this._activePanelId;
  }
  isLoading() {
    return this._loading;
  }
  getMetrics() {
    return { ...this._metrics };
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, data);
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, activePanelId: this._activePanelId, loading: this._loading, hasActivePanel: !!this._activePanel, metrics: this.getMetrics() };
  }
  healthCheck() {
    const hasPanelPort = !!this._panelPort;
    const hasManifest = !!this._manifestController;
    const hasEvents = !!this._events;
    const failureRate = this._metrics.loadsCompleted > 0 ? this._metrics.loadsFailed / (this._metrics.loadsCompleted + this._metrics.loadsFailed) : 0;
    let status = "HEALTHY";
    if (!hasPanelPort || !hasManifest) status = "UNHEALTHY";
    else if (failureRate > 0.3 || this._loading) status = "DEGRADED";
    return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasPanelPort, hasManifest, hasEvents, hasTelemetry: !!this._telemetry, hasErrorSupervisor: !!this._errorSupervisor, isLoading: this._loading, failureRate: `${Math.round(failureRate * 100)}%` }, metrics: this.getMetrics() };
  }
}
function createOrchestratorController(context) {
  return new OrchestratorController(context);
}
var orchestrator_controller_default = { OrchestratorController, createOrchestratorController, VERSION, MODULE_ID };
export {
  MODULE_ID,
  OrchestratorController,
  VERSION,
  createOrchestratorController,
  orchestrator_controller_default as default
};
