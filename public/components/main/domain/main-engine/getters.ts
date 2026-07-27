// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-getters
// PURPOSE: MainEngine Getters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getManifestController() — exported function
//   getLayoutController() — exported function
//   getCanvasController() — exported function
//   getTimelineController() — exported function
//   getOrchestratorController() — exported function
//   getGlobalStateV2() — exported function
//   getMultiContainerOrchestrator() — exported function
//   getAuditModule() — exported function
//   getPersistenceAdapter() — exported function
//   getObservabilityModule() — exported function
//   setActionHub() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '5.0.0-MODULAR';
export const MODULE_ID = 'main-engine-getters';

export function getManifestController(engine: Record<string, unknown>) { return engine._manifestController; }
export function getLayoutController(engine: Record<string, unknown>) { return engine._layoutController; }
export function getCanvasController(engine: Record<string, unknown>) { return engine._canvasController; }
export function getTimelineController(engine: Record<string, unknown>) { return engine._timelineController; }
export function getOrchestratorController(engine: Record<string, unknown>) { return engine._orchestrator; }
export function getGlobalStateV2(engine: Record<string, unknown>) { return engine._globalStateV2; }
export function getMultiContainerOrchestrator(engine: Record<string, unknown>) { return engine._multiContainerOrchestrator; }
export function getAuditModule(engine: Record<string, unknown>) { return engine._auditModule; }
export function getPersistenceAdapter(engine: Record<string, unknown>) { return engine._persistenceAdapter; }
export function getObservabilityModule(engine: Record<string, unknown>) { return engine._observabilityModule; }
export function setActionHub(engine: Record<string, unknown>, actionHub: unknown) { const om = engine._observabilityModule as Record<string, Record<string, (...args: unknown[]) => unknown>> | null; if (om?.controller?.setModule) om.controller.setModule("actionHub", actionHub); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export default { getManifestController, getLayoutController, getCanvasController, getTimelineController, getOrchestratorController, getGlobalStateV2, getMultiContainerOrchestrator, getAuditModule, getPersistenceAdapter, getObservabilityModule, setActionHub, healthCheck, info, MODULE_ID, VERSION };
