const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "main-flow-controller";
class FlowController {
  constructor() {
    this._steps = [];
    this._completed = /* @__PURE__ */ new Set();
    this._failed = /* @__PURE__ */ new Set();
    this._metrics = { executionsCompleted: 0, stepsFailed: 0 };
  }
  addStep(id, fn) {
    this._steps.push({ id, fn });
  }
  async execute() {
    for (const step of this._steps) {
      if (this._completed.has(step.id)) continue;
      try {
        await step.fn();
        this._completed.add(step.id);
      } catch (error) {
        this._failed.add(step.id);
        this._metrics.stepsFailed++;
        throw error;
      }
    }
    this._metrics.executionsCompleted++;
    return true;
  }
  isCompleted(stepId) {
    return this._completed.has(stepId);
  }
  isFailed(stepId) {
    return this._failed.has(stepId);
  }
  getMetrics() {
    return { ...this._metrics };
  }
  reset() {
    this._completed.clear();
    this._failed.clear();
  }
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      steps: this._steps.map((s) => s.id),
      completed: Array.from(this._completed),
      failed: Array.from(this._failed),
      metrics: this.getMetrics()
    };
  }
  healthCheck() {
    const totalSteps = this._steps.length;
    const completedCount = this._completed.size;
    const failedCount = this._failed.size;
    let status = "HEALTHY";
    if (failedCount > 0) status = "DEGRADED";
    if (totalSteps === 0) status = "DEGRADED";
    return {
      status,
      version: VERSION,
      moduleId: MODULE_ID,
      checks: {
        totalSteps,
        completedCount,
        failedCount,
        pendingCount: totalSteps - completedCount - failedCount
      },
      metrics: this.getMetrics()
    };
  }
}
function createFlowController() {
  return new FlowController();
}
var flow_controller_default = { FlowController, createFlowController, VERSION, MODULE_ID };
export {
  FlowController,
  MODULE_ID,
  VERSION,
  createFlowController,
  flow_controller_default as default
};
