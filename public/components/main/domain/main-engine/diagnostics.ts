// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-diagnostics
// PURPOSE: MainEngine Diagnostics
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID as ENGINE_MODULE_ID from ./constants.js
//   STATES from ../state-machine.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getEngineState() — exported function
//   getEngineMetrics() — exported function
//   getEngineLifecycle() — exported function
//   getEngineInfo() — exported function
//   getEngineHealthCheck() — exported function
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

import { MODULE_ID as ENGINE_MODULE_ID } from './constants.js';
import { STATES } from '../state-machine.js';

export const VERSION = '5.0.0-MODULAR';
export const MODULE_ID = 'main-engine-diagnostics';

export function getEngineState(engine: Record<string, unknown>) {
  const sm = engine._stateMachine as Record<string, unknown>;
  const lc = engine._layoutController as Record<string, (...args: unknown[]) => unknown> | null;
  const mc = engine._manifestController as Record<string, (...args: unknown[]) => unknown> | null;
  const mco = engine._multiContainerOrchestrator as Record<string, (...args: unknown[]) => unknown> | null;
  return { initialized: engine._initialized, destroyed: engine._destroyed, state: sm.state, currentPanel: engine._lastNavigatedPanel || null, currentContainer: engine._lastContainerId || null, currentLayout: lc?.getCurrentLayout?.() || 'default', navigating: engine._isNavigating, manifestLoaded: mc?.isLoaded?.() || false, multiContainer: mco?.info?.() || null };
}

export function getEngineMetrics(engine: Record<string, unknown>) {
  const uptime = engine._initTimestamp ? Date.now() - (engine._initTimestamp as number) : 0;
  type Sub = Record<string, (...args: unknown[]) => unknown> | null;
  const sub = (key: string) => engine[key] as Sub;
  const ports = engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>>;
  return { timestamp: Date.now(), uptime, engine: { ...(engine._metrics as Record<string, unknown>) }, subsystems: { manifest: sub('_manifestController')?.getMetrics?.() || {}, layout: sub('_layoutController')?.getMetrics?.() || {}, canvas: sub('_canvasController')?.getMetrics?.() || {}, timeline: sub('_timelineController')?.getMetrics?.() || {}, orchestrator: sub('_orchestrator')?.getMetrics?.() || {}, globalState: sub('_globalStateV2')?.getMetrics?.() || {}, multiContainer: sub('_multiContainerOrchestrator')?.getMetrics?.() || {}, audit: sub('_auditModule')?.getMetrics?.() || {}, persistence: sub('_persistenceAdapter')?.getMetrics?.() || {}, observability: sub('_observabilityModule')?.getMetrics?.() || {}, panelLifecycle: sub('_panelLifecycle')?.getMetrics?.() || {}, navigation: sub('_navigationController')?.getMetrics?.() || {}, errorSupervisor: sub('_errorSupervisor')?.getMetrics?.() || {} }, ports: { panel: ports.panel?.getMetrics?.() || {}, container: ports.container?.getMetrics?.() || {}, telemetry: ports.telemetry?.getMetrics?.() || {} } };
}

export function getEngineLifecycle(engine: Record<string, unknown>) {
  const sm = engine._stateMachine as Record<string, (...args: unknown[]) => unknown> & { state: string };
  type Sub = Record<string, (...args: unknown[]) => unknown> | null;
  const sub = (key: string) => engine[key] as Sub;
  return { state: sm.state, history: sm.getHistory(), panel: sub('_panelLifecycle')?.info?.(), navigation: sub('_navigationController')?.info?.(), manifest: sub('_manifestController')?.info?.(), layout: sub('_layoutController')?.info?.(), canvas: sub('_canvasController')?.info?.() || null, timeline: sub('_timelineController')?.info?.() || null, orchestrator: sub('_orchestrator')?.info?.(), globalStateV2: sub('_globalStateV2')?.info?.(), multiContainer: sub('_multiContainerOrchestrator')?.info?.() || null, audit: sub('_auditModule')?.info?.() || null, persistence: sub('_persistenceAdapter')?.info?.() || null, observability: sub('_observabilityModule')?.info?.() || null };
}

export function getEngineInfo(engine: Record<string, unknown>) {
  return { version: VERSION, moduleId: ENGINE_MODULE_ID, ...getEngineState(engine), uptime: engine._initTimestamp ? Date.now() - (engine._initTimestamp as number) : 0, metrics: engine._metrics, ports: Object.keys(engine._ports as Record<string, unknown>), adapters: Object.keys(engine._adapters as Record<string, unknown>), unsubCount: (engine._unsubs as unknown[]).length };
}

export function getEngineHealthCheck(engine: Record<string, unknown>) {
  const sm = engine._stateMachine as Record<string, unknown>;
  const ports = engine._ports as Record<string, unknown>;
  const adapters = engine._adapters as Record<string, unknown>;
  const mc = engine._manifestController as Record<string, (...args: unknown[]) => unknown> | null;
  const checks = { initialized: engine._initialized, notDestroyed: !engine._destroyed, stateValid: sm.state !== STATES.ERROR, hasAuth: !!ports.auth, hasPanel: !!ports.panel, hasDom: !!adapters.dom, hasEvents: !!engine._events, manifestLoaded: mc?.isLoaded?.() || false, layoutActive: !!engine._layoutController, notNavigating: !engine._isNavigating, hasMultiContainer: !!engine._multiContainerOrchestrator, hasAudit: !!engine._auditModule, hasPersistence: !!engine._persistenceAdapter, hasObservability: !!engine._observabilityModule };
  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = 'HEALTHY'; if (score < total) status = 'DEGRADED'; if (score < total * 0.7) status = 'UNHEALTHY';
  return { status, score: `${score}/${total}`, checks, version: VERSION };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export default { getEngineState, getEngineMetrics, getEngineLifecycle, getEngineInfo, getEngineHealthCheck, healthCheck, info, MODULE_ID, VERSION };
