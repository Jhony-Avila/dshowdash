// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Loading Progress - Steps Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setSteps() — exported function
//   completeStep() — exported function
//   getCurrentStep() — exported function
//   getSteps() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.loading-progress.steps.manager';

export function setSteps(state: Record<string, unknown>, steps: unknown[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  // @ts-expect-error strict migration — TS2345
  state.steps = steps.map((step: number, index: number) => ({
    // @ts-expect-error TS migration - TS2339
    id: step.id || `step-${index}`,
    // @ts-expect-error TS migration - TS2339
    label: step.label || `Step ${index + 1}`,
    // @ts-expect-error TS migration - TS2339
    weight: step.weight || 1,
    completed: false
  }));
  
  state.currentStep = 0;
  // @ts-expect-error TS migration - TS2345
  logger.debug('Steps set:', (state.steps as unknown[]).length);
}

export function completeStep(state: Record<string, unknown>, stepId: unknown, setProgress: unknown, notifyListeners: unknown, done: boolean, logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  // @ts-expect-error TS migration - TS2339
  const stepIndex = (state.steps as unknown[]).findIndex((s: string) => s.id === stepId);
  if (stepIndex === -1) return false;
  
  // @ts-expect-error TS migration - TS2339
  (state.steps as Record<string, unknown>)[stepIndex].completed = true;
  state.currentStep = stepIndex + 1;
  
  // @ts-expect-error TS migration - TS2339
  const totalWeight = (state.steps as unknown[]).reduce((sum: unknown, s: string) => sum + s.weight, 0);
  // @ts-expect-error strict migration — TS18046
  const completedWeight = state.steps
    // @ts-expect-error TS migration - TS2339
    .filter((s: string) => s.completed)
    // @ts-expect-error TS migration - TS2339
    .reduce((sum: unknown, s: string) => sum + s.weight, 0);
  
  const progress = (completedWeight / (totalWeight as number)) * 90 + 10;
  (setProgress as (...args: unknown[]) => unknown)(progress);
  
  (notifyListeners as (...args: unknown[]) => unknown)('stepComplete', { 
    step: (state.steps as Record<string, unknown>)[stepIndex],
    currentStep: state.currentStep,
    totalSteps: (state.steps as unknown[]).length
  });
  
  // @ts-expect-error TS migration - TS2554
  logger.debug('Step completed:', stepId, { progress });
  
  // @ts-expect-error TS migration - TS2339
  if ((state.steps as unknown[]).every((s: string) => s.completed)) {
    (done as unknown as (...args: unknown[]) => unknown)();
  }
  
  return true;
}

export function getCurrentStep(state: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2538
  return state.steps[state.currentStep] || null;
}

export function getSteps(state: Record<string, unknown>) {
  // @ts-expect-error TS migration - TS2352
  return (state.steps as unknown as unknown[]).map((s: string) => ({ ...(s as Record<string, unknown>) }));
}
