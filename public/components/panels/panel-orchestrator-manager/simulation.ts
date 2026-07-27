// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-orchestrator-manager:simulation
// PURPOSE: Panel Orchestrator Manager - Simulation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getPort from ./ports.js
//   ui from ./ui/renderer.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   handleSimulate() — exported function
//   runSimulation() — exported function
//   processSimulationResult() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   intentId
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPort } from './ports.js';
import { ui } from './ui/renderer.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-orchestrator-manager:simulation';

interface SimCallbacks { showToast: (msg: string, type: string) => void; }

export function handleSimulate(container: HTMLElement, callbacks: SimCallbacks, execute: boolean) {
  const intentInput = container.querySelector('[data-simulator="intent-input"]') as HTMLInputElement | null;
  const triggerSelect = container.querySelector('[data-simulator="trigger-select"]') as HTMLSelectElement | null;
  const selectedOption = triggerSelect ? triggerSelect.selectedOptions[0] : null;
  const intentId = (intentInput && intentInput.value.trim()) || (selectedOption ? selectedOption.dataset.intent : null);
  const triggerKey = triggerSelect ? triggerSelect.value : null;
  if (!intentId) { callbacks.showToast('Selecione um trigger ou digite um intent', 'error'); return; }
  runSimulation(container, callbacks, intentId, triggerKey, execute);
}

export function runSimulation(container: HTMLElement, callbacks: SimCallbacks, intentId: string, triggerKey: string | null, execute: boolean) {
  if (execute === undefined) execute = false;
  const resultContainer = container.querySelector('[data-simulator="result"]') as HTMLElement | null;
  const uiOrchestrator = getPort('uiOrchestrator');
  try {
    const startTime = performance.now();
    let resolution: Record<string, unknown> | null = null;
    if (uiOrchestrator) {
      const getResolverFn = typeof uiOrchestrator['getResolver'] === 'function' ? uiOrchestrator['getResolver'].bind(uiOrchestrator) : null;
      const resolver = getResolverFn ? getResolverFn() as Record<string, unknown> | null : null;
      if (resolver) {
        const resolveFn = typeof resolver['resolve'] === 'function' ? resolver['resolve'].bind(resolver) : null;
        const resolveResult = resolveFn ? resolveFn(intentId) : null;
        if (resolveResult && typeof resolveResult.then === 'function') {
          resolveResult.then((res: Record<string, unknown>) => { processSimulationResult(container, callbacks, res, intentId, triggerKey, execute, startTime, resultContainer); }).catch((error: Error) => { if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorResult({ success: false, error: error.message }); callbacks.showToast(error.message, 'error'); });
          return;
        }
        resolution = resolveResult;
      }
    }
    processSimulationResult(container, callbacks, resolution, intentId, triggerKey, execute, startTime, resultContainer);
  } catch (error) { const err = error as Error; if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorResult({ success: false, error: err.message }); callbacks.showToast(err.message, 'error'); }
}

export function processSimulationResult(container: HTMLElement, callbacks: SimCallbacks, resolution: Record<string, unknown> | null, intentId: string, triggerKey: string | null, execute: boolean, startTime: number, resultContainer: HTMLElement | null) {
  const success = !!(resolution && resolution.action);
  const uiOrchestrator = getPort('uiOrchestrator');
  const getTarget = (r: Record<string, unknown>) => { const t = r.target as Record<string, unknown> | null | undefined; return (t && t['id']) ? t['id'] : r.target; };
  const result = { success, trigger: triggerKey, intent: intentId, resolution: resolution ? { action: resolution.action, target: getTarget(resolution), region: resolution.region } : null, executionTime: (performance.now() - startTime).toFixed(2) };
  if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorResult(result as Record<string, unknown>);
  if (execute && success && uiOrchestrator) {
    const emitFn = typeof uiOrchestrator['emit'] === 'function' ? uiOrchestrator['emit'].bind(uiOrchestrator) : null;
    if (emitFn) emitFn(intentId, {}, 'simulator');
    if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorExecuted({ intent: intentId, action: resolution!.action, target: getTarget(resolution!) });
    callbacks.showToast(`Intent "${intentId}" executado!`, 'success');
  } else if (execute && !success) { callbacks.showToast('Sem resolução para executar', 'error'); }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { simulatorReady: typeof handleSimulate === 'function' } }; }

export default { handleSimulate, runSimulation, processSimulationResult, info, healthCheck };
