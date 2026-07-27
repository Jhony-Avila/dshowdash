// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-KERNEL-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-destroy
// PURPOSE: MainEngine Destroy & Cleanup
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   STATES from ../state-machine.js
//   ENGINE_EVENTS from ./constants.js
//   destroyAllListeners from ./listeners.js
//   shutdownMainKernel from ./kernel-integration.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   cleanupSubscriptions() — exported function
//   performDestroy() — exported function
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

import { STATES } from '../state-machine.js';
import { ENGINE_EVENTS } from './constants.js';
import { destroyAllListeners } from './listeners.js';
import { shutdownMainKernel } from './kernel-integration.js';

export const VERSION = '5.2.0-KERNEL-SHUTDOWN';
export const MODULE_ID = 'main-engine-destroy';

export async function performUnmount(engine: Record<string, unknown>) {
  const pl = engine._panelLifecycle as Record<string, (...args: unknown[]) => unknown> | null;
  const sm = engine._stateMachine as Record<string, (...args: unknown[]) => unknown>;
  const emit = engine._emit as (...args: unknown[]) => void;
  if (pl?.hasPanel?.()) {
    const panelId = pl.getCurrentPanelId();
    sm.transition(STATES.UNMOUNTING);
    await pl.unmount();
    sm.transition(STATES.READY);
    emit(ENGINE_EVENTS.PANEL_UNMOUNTED, { panelId });
  }
  return true;
}

export function cleanupSubscriptions(engine: Record<string, unknown>) {
  if (!Array.isArray(engine._unsubs)) return;
  engine._unsubs.forEach((unsub: unknown) => { try { if (typeof unsub === 'function') unsub(); } catch (e) { } });
  engine._unsubs = [];
}

export function performDestroy(engine: Record<string, unknown>, globalInstanceRef: unknown) {
  if (engine._destroyed) return;

  // 1. Cleanup engine's own subscriptions
  cleanupSubscriptions(engine);

  // 2. CRITICAL: Cleanup all EventBus listeners registered by setupAllListeners()
  destroyAllListeners(engine);

  // 3. CRITICAL: Shutdown MainKernel and all features
  if (engine._mainKernel) {
    shutdownMainKernel(engine);
  }

  // 4. Destroy subsystems
  type Sub = Record<string, (...args: unknown[]) => unknown> | null;
  const sub = (key: string) => engine[key] as Sub;
  sub('_navigationController')?.destroy?.();
  sub('_timelineController')?.destroy?.();
  sub('_canvasController')?.clear?.();
  sub('_observabilityModule')?.destroy?.();
  sub('_auditModule')?.destroy?.();
  sub('_multiContainerOrchestrator')?.destroy?.();
  sub('_panelLifecycle')?.destroy?.();
  sub('_errorSupervisor')?.destroy?.();

  // 5. Cleanup events adapter
  const events = engine._events as Record<string, (...args: unknown[]) => unknown> | null;
  if (events?.cleanup) events.cleanup();

  // 6. Transition state machine
  (engine._stateMachine as Record<string, (...args: unknown[]) => unknown>).transition(STATES.DESTROYED);
  
  // 7. Null all references to allow GC
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
  
  // 8. Update state flags
  engine._initialized = false;
  engine._destroyed = true;
  engine._isNavigating = false;
  engine._lastNavigatedPanel = null;
  engine._lastContainerId = null;
  engine._initTimestamp = null;
  
  // 9. Clear global reference
  if (globalInstanceRef) (globalInstanceRef as Record<string, unknown>).instance = null;
  
  // 10. Final event (may not emit if _events was nulled, but that's ok)
  try { (engine._emit as (...args: unknown[]) => void)(ENGINE_EVENTS.DESTROYED); } catch (e) { }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    leakFixApplied: true,
    kernelShutdownEnabled: true
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    leakFixApplied: true,
    kernelShutdownEnabled: true,
    timestamp: Date.now()
  };
}

export default {
  performUnmount,
  cleanupSubscriptions,
  performDestroy,
  healthCheck,
  info,
  MODULE_ID,
  VERSION
};
