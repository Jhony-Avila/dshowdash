import { getPort } from "./ports.js";
import { ui } from "./ui/renderer.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-orchestrator-manager:simulation";
function handleSimulate(container, callbacks, execute) {
  const intentInput = container.querySelector('[data-simulator="intent-input"]');
  const triggerSelect = container.querySelector('[data-simulator="trigger-select"]');
  const selectedOption = triggerSelect ? triggerSelect.selectedOptions[0] : null;
  const intentId = intentInput && intentInput.value.trim() || (selectedOption ? selectedOption.dataset.intent : null);
  const triggerKey = triggerSelect ? triggerSelect.value : null;
  if (!intentId) {
    callbacks.showToast("Selecione um trigger ou digite um intent", "error");
    return;
  }
  runSimulation(container, callbacks, intentId, triggerKey, execute);
}
function runSimulation(container, callbacks, intentId, triggerKey, execute) {
  if (execute === void 0) execute = false;
  const resultContainer = container.querySelector('[data-simulator="result"]');
  const uiOrchestrator = getPort("uiOrchestrator");
  try {
    const startTime = performance.now();
    let resolution = null;
    if (uiOrchestrator) {
      const getResolverFn = typeof uiOrchestrator["getResolver"] === "function" ? uiOrchestrator["getResolver"].bind(uiOrchestrator) : null;
      const resolver = getResolverFn ? getResolverFn() : null;
      if (resolver) {
        const resolveFn = typeof resolver["resolve"] === "function" ? resolver["resolve"].bind(resolver) : null;
        const resolveResult = resolveFn ? resolveFn(intentId) : null;
        if (resolveResult && typeof resolveResult.then === "function") {
          resolveResult.then((res) => {
            processSimulationResult(container, callbacks, res, intentId, triggerKey, execute, startTime, resultContainer);
          }).catch((error) => {
            if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorResult({ success: false, error: error.message });
            callbacks.showToast(error.message, "error");
          });
          return;
        }
        resolution = resolveResult;
      }
    }
    processSimulationResult(container, callbacks, resolution, intentId, triggerKey, execute, startTime, resultContainer);
  } catch (error) {
    const err = error;
    if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorResult({ success: false, error: err.message });
    callbacks.showToast(err.message, "error");
  }
}
function processSimulationResult(container, callbacks, resolution, intentId, triggerKey, execute, startTime, resultContainer) {
  const success = !!(resolution && resolution.action);
  const uiOrchestrator = getPort("uiOrchestrator");
  const getTarget = (r) => {
    const t = r.target;
    return t && t["id"] ? t["id"] : r.target;
  };
  const result = { success, trigger: triggerKey, intent: intentId, resolution: resolution ? { action: resolution.action, target: getTarget(resolution), region: resolution.region } : null, executionTime: (performance.now() - startTime).toFixed(2) };
  if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorResult(result);
  if (execute && success && uiOrchestrator) {
    const emitFn = typeof uiOrchestrator["emit"] === "function" ? uiOrchestrator["emit"].bind(uiOrchestrator) : null;
    if (emitFn) emitFn(intentId, {}, "simulator");
    if (resultContainer) resultContainer.innerHTML = ui.renderSimulatorExecuted({ intent: intentId, action: resolution.action, target: getTarget(resolution) });
    callbacks.showToast(`Intent "${intentId}" executado!`, "success");
  } else if (execute && !success) {
    callbacks.showToast("Sem resolu\xE7\xE3o para executar", "error");
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { simulatorReady: typeof handleSimulate === "function" } };
}
var simulation_default = { handleSimulate, runSimulation, processSimulationResult, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  simulation_default as default,
  handleSimulate,
  healthCheck,
  info,
  processSimulationResult,
  runSimulation
};
