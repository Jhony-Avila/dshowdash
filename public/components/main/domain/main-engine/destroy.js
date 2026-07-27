import { STATES } from "../state-machine.js";
import { ENGINE_EVENTS } from "./constants.js";
import { destroyAllListeners } from "./listeners.js";
import { shutdownMainKernel } from "./kernel-integration.js";
const VERSION = "5.2.0-KERNEL-SHUTDOWN";
const MODULE_ID = "main-engine-destroy";
async function performUnmount(engine) {
  const pl = engine._panelLifecycle;
  const sm = engine._stateMachine;
  const emit = engine._emit;
  if (pl?.hasPanel?.()) {
    const panelId = pl.getCurrentPanelId();
    sm.transition(STATES.UNMOUNTING);
    await pl.unmount();
    sm.transition(STATES.READY);
    emit(ENGINE_EVENTS.PANEL_UNMOUNTED, { panelId });
  }
  return true;
}
function cleanupSubscriptions(engine) {
  if (!Array.isArray(engine._unsubs)) return;
  engine._unsubs.forEach((unsub) => {
    try {
      if (typeof unsub === "function") unsub();
    } catch (e) {
    }
  });
  engine._unsubs = [];
}
function performDestroy(engine, globalInstanceRef) {
  if (engine._destroyed) return;
  cleanupSubscriptions(engine);
  destroyAllListeners(engine);
  if (engine._mainKernel) {
    shutdownMainKernel(engine);
  }
  const sub = (key) => engine[key];
  sub("_navigationController")?.destroy?.();
  sub("_timelineController")?.destroy?.();
  sub("_canvasController")?.clear?.();
  sub("_observabilityModule")?.destroy?.();
  sub("_auditModule")?.destroy?.();
  sub("_multiContainerOrchestrator")?.destroy?.();
  sub("_panelLifecycle")?.destroy?.();
  sub("_errorSupervisor")?.destroy?.();
  const events = engine._events;
  if (events?.cleanup) events.cleanup();
  engine._stateMachine.transition(STATES.DESTROYED);
  engine._mainKernel = null;
  engine._panelLifecycle = null;
  engine._navigationController = null;
  engine._manifestController = null;
  engine._layoutController = null;
  engine._canvasController = null;
  engine._timelineController = null;
  engine._orchestrator = null;
  engine._globalStateV2 = null;
  engine._multiContainerOrchestrator = null;
  engine._auditModule = null;
  engine._persistenceAdapter = null;
  engine._observabilityModule = null;
  engine._errorSupervisor = null;
  engine._ports = {};
  engine._adapters = {};
  engine._events = null;
  engine._context = null;
  engine._router = null;
  engine._initialized = false;
  engine._destroyed = true;
  engine._isNavigating = false;
  engine._lastNavigatedPanel = null;
  engine._lastContainerId = null;
  engine._initTimestamp = null;
  if (globalInstanceRef) globalInstanceRef.instance = null;
  try {
    engine._emit(ENGINE_EVENTS.DESTROYED);
  } catch (e) {
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    leakFixApplied: true,
    kernelShutdownEnabled: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    leakFixApplied: true,
    kernelShutdownEnabled: true,
    timestamp: Date.now()
  };
}
var destroy_default = {
  performUnmount,
  cleanupSubscriptions,
  performDestroy,
  healthCheck,
  info,
  MODULE_ID,
  VERSION
};
export {
  MODULE_ID,
  VERSION,
  cleanupSubscriptions,
  destroy_default as default,
  healthCheck,
  info,
  performDestroy,
  performUnmount
};
