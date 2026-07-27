const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.loading-progress.steps.manager";
function setSteps(state, steps, logger) {
  state.steps = steps.map((step, index) => ({
    // @ts-expect-error TS migration - TS2339
    id: step.id || `step-${index}`,
    // @ts-expect-error TS migration - TS2339
    label: step.label || `Step ${index + 1}`,
    // @ts-expect-error TS migration - TS2339
    weight: step.weight || 1,
    completed: false
  }));
  state.currentStep = 0;
  logger.debug("Steps set:", state.steps.length);
}
function completeStep(state, stepId, setProgress, notifyListeners, done, logger) {
  const stepIndex = state.steps.findIndex((s) => s.id === stepId);
  if (stepIndex === -1) return false;
  state.steps[stepIndex].completed = true;
  state.currentStep = stepIndex + 1;
  const totalWeight = state.steps.reduce((sum, s) => sum + s.weight, 0);
  const completedWeight = state.steps.filter((s) => s.completed).reduce((sum, s) => sum + s.weight, 0);
  const progress = completedWeight / totalWeight * 90 + 10;
  setProgress(progress);
  notifyListeners("stepComplete", {
    step: state.steps[stepIndex],
    currentStep: state.currentStep,
    totalSteps: state.steps.length
  });
  logger.debug("Step completed:", stepId, { progress });
  if (state.steps.every((s) => s.completed)) {
    done();
  }
  return true;
}
function getCurrentStep(state) {
  return state.steps[state.currentStep] || null;
}
function getSteps(state) {
  return state.steps.map((s) => ({ ...s }));
}
export {
  MODULE_ID,
  VERSION,
  completeStep,
  getCurrentStep,
  getSteps,
  setSteps
};
