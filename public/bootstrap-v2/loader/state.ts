// Bootstrap-V2 Loader - State
// @version 6.2.1
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: state, get/setPreBootOrchestrator, get/setBootstrapInstance, get/setPreBootResult, get/setBootResult
// BROWSER-APIS: None
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.loader.state';

// Dynamic bootstrap/orchestrator objects accessed via duck-typing patterns
// (e.g. `instance.method ? instance.method() : null`).
// Properties are accessed dynamically; runtime truthiness guards ensure safe usage.
// Callable index signature allows method invocations; non-function props are accessed but not called.
interface DynamicInstance {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any;
}
export type { DynamicInstance };

export const state: {
  preBootOrchestrator: DynamicInstance | null;
  bootstrapInstance: DynamicInstance | null;
  preBootResult: DynamicInstance | null;
  bootResult: DynamicInstance | null;
} = {
  preBootOrchestrator: null,
  bootstrapInstance: null,
  preBootResult: null,
  bootResult: null
};

export function getPreBootOrchestrator() { return state.preBootOrchestrator; }
export function setPreBootOrchestrator(val: DynamicInstance | null) { state.preBootOrchestrator = val; }

export function getBootstrapInstance() { return state.bootstrapInstance; }
export function setBootstrapInstance(val: DynamicInstance | null) { state.bootstrapInstance = val; }

export function getPreBootResult() { return state.preBootResult; }
export function setPreBootResult(val: DynamicInstance | null) { state.preBootResult = val; }

export function getBootResult() { return state.bootResult; }
export function setBootResult(val: DynamicInstance | null) { state.bootResult = val; }
