const VERSION = "5.0.0-MODULAR";
const MODULE_ID = "main-engine-getters";
function getManifestController(engine) {
  return engine._manifestController;
}
function getLayoutController(engine) {
  return engine._layoutController;
}
function getCanvasController(engine) {
  return engine._canvasController;
}
function getTimelineController(engine) {
  return engine._timelineController;
}
function getOrchestratorController(engine) {
  return engine._orchestrator;
}
function getGlobalStateV2(engine) {
  return engine._globalStateV2;
}
function getMultiContainerOrchestrator(engine) {
  return engine._multiContainerOrchestrator;
}
function getAuditModule(engine) {
  return engine._auditModule;
}
function getPersistenceAdapter(engine) {
  return engine._persistenceAdapter;
}
function getObservabilityModule(engine) {
  return engine._observabilityModule;
}
function setActionHub(engine, actionHub) {
  const om = engine._observabilityModule;
  if (om?.controller?.setModule) om.controller.setModule("actionHub", actionHub);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var getters_default = { getManifestController, getLayoutController, getCanvasController, getTimelineController, getOrchestratorController, getGlobalStateV2, getMultiContainerOrchestrator, getAuditModule, getPersistenceAdapter, getObservabilityModule, setActionHub, healthCheck, info, MODULE_ID, VERSION };
export {
  MODULE_ID,
  VERSION,
  getters_default as default,
  getAuditModule,
  getCanvasController,
  getGlobalStateV2,
  getLayoutController,
  getManifestController,
  getMultiContainerOrchestrator,
  getObservabilityModule,
  getOrchestratorController,
  getPersistenceAdapter,
  getTimelineController,
  healthCheck,
  info,
  setActionHub
};
