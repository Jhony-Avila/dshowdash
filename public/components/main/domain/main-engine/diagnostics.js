import { MODULE_ID as ENGINE_MODULE_ID } from "./constants.js";
import { STATES } from "../state-machine.js";
const VERSION = "5.0.0-MODULAR";
const MODULE_ID = "main-engine-diagnostics";
function getEngineState(engine) {
  const sm = engine._stateMachine;
  const lc = engine._layoutController;
  const mc = engine._manifestController;
  const mco = engine._multiContainerOrchestrator;
  return { initialized: engine._initialized, destroyed: engine._destroyed, state: sm.state, currentPanel: engine._lastNavigatedPanel || null, currentContainer: engine._lastContainerId || null, currentLayout: lc?.getCurrentLayout?.() || "default", navigating: engine._isNavigating, manifestLoaded: mc?.isLoaded?.() || false, multiContainer: mco?.info?.() || null };
}
function getEngineMetrics(engine) {
  const uptime = engine._initTimestamp ? Date.now() - engine._initTimestamp : 0;
  const sub = (key) => engine[key];
  const ports = engine._ports;
  return { timestamp: Date.now(), uptime, engine: { ...engine._metrics }, subsystems: { manifest: sub("_manifestController")?.getMetrics?.() || {}, layout: sub("_layoutController")?.getMetrics?.() || {}, canvas: sub("_canvasController")?.getMetrics?.() || {}, timeline: sub("_timelineController")?.getMetrics?.() || {}, orchestrator: sub("_orchestrator")?.getMetrics?.() || {}, globalState: sub("_globalStateV2")?.getMetrics?.() || {}, multiContainer: sub("_multiContainerOrchestrator")?.getMetrics?.() || {}, audit: sub("_auditModule")?.getMetrics?.() || {}, persistence: sub("_persistenceAdapter")?.getMetrics?.() || {}, observability: sub("_observabilityModule")?.getMetrics?.() || {}, panelLifecycle: sub("_panelLifecycle")?.getMetrics?.() || {}, navigation: sub("_navigationController")?.getMetrics?.() || {}, errorSupervisor: sub("_errorSupervisor")?.getMetrics?.() || {} }, ports: { panel: ports.panel?.getMetrics?.() || {}, container: ports.container?.getMetrics?.() || {}, telemetry: ports.telemetry?.getMetrics?.() || {} } };
}
function getEngineLifecycle(engine) {
  const sm = engine._stateMachine;
  const sub = (key) => engine[key];
  return { state: sm.state, history: sm.getHistory(), panel: sub("_panelLifecycle")?.info?.(), navigation: sub("_navigationController")?.info?.(), manifest: sub("_manifestController")?.info?.(), layout: sub("_layoutController")?.info?.(), canvas: sub("_canvasController")?.info?.() || null, timeline: sub("_timelineController")?.info?.() || null, orchestrator: sub("_orchestrator")?.info?.(), globalStateV2: sub("_globalStateV2")?.info?.(), multiContainer: sub("_multiContainerOrchestrator")?.info?.() || null, audit: sub("_auditModule")?.info?.() || null, persistence: sub("_persistenceAdapter")?.info?.() || null, observability: sub("_observabilityModule")?.info?.() || null };
}
function getEngineInfo(engine) {
  return { version: VERSION, moduleId: ENGINE_MODULE_ID, ...getEngineState(engine), uptime: engine._initTimestamp ? Date.now() - engine._initTimestamp : 0, metrics: engine._metrics, ports: Object.keys(engine._ports), adapters: Object.keys(engine._adapters), unsubCount: engine._unsubs.length };
}
function getEngineHealthCheck(engine) {
  const sm = engine._stateMachine;
  const ports = engine._ports;
  const adapters = engine._adapters;
  const mc = engine._manifestController;
  const checks = { initialized: engine._initialized, notDestroyed: !engine._destroyed, stateValid: sm.state !== STATES.ERROR, hasAuth: !!ports.auth, hasPanel: !!ports.panel, hasDom: !!adapters.dom, hasEvents: !!engine._events, manifestLoaded: mc?.isLoaded?.() || false, layoutActive: !!engine._layoutController, notNavigating: !engine._isNavigating, hasMultiContainer: !!engine._multiContainerOrchestrator, hasAudit: !!engine._auditModule, hasPersistence: !!engine._persistenceAdapter, hasObservability: !!engine._observabilityModule };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (score < total) status = "DEGRADED";
  if (score < total * 0.7) status = "UNHEALTHY";
  return { status, score: `${score}/${total}`, checks, version: VERSION };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var diagnostics_default = { getEngineState, getEngineMetrics, getEngineLifecycle, getEngineInfo, getEngineHealthCheck, healthCheck, info, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  diagnostics_default as default,
  getEngineHealthCheck,
  getEngineInfo,
  getEngineLifecycle,
  getEngineMetrics,
  getEngineState,
  healthCheck,
  info
};
