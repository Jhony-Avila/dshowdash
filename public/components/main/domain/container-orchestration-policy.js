const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-orchestration-policy";
const DOCK_MODES = Object.freeze({
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary",
  FULL: "full",
  SPLIT: "split",
  FLOATING: "floating",
  MINIMIZED: "minimized",
  HIDDEN: "hidden"
});
const OPEN_STRATEGIES = Object.freeze({
  REPLACE: "replace",
  SIDE_BY_SIDE: "side-by-side",
  STACK: "stack",
  SPLIT_HORIZONTAL: "split-horizontal",
  SPLIT_VERTICAL: "split-vertical",
  FLOAT: "float"
});
const DEFAULT_POLICY = {
  maxConcurrentLoads: 3,
  loadTimeout: 1e4,
  retryAttempts: 2,
  retryDelay: 1e3,
  unloadDelay: 500,
  preloadEnabled: true,
  defaultDockMode: DOCK_MODES.PRIMARY,
  defaultOpenStrategy: OPEN_STRATEGIES.REPLACE
};
let _policy = { ...DEFAULT_POLICY };
let _metrics = { policyChecks: 0, violations: 0, containersCreated: 0 };
function getPolicy() {
  return { ..._policy };
}
function setPolicy(updates) {
  _policy = { ..._policy, ...updates };
  return _policy;
}
function resetPolicy() {
  _policy = { ...DEFAULT_POLICY };
  return _policy;
}
function checkPolicy(action, context = {}) {
  _metrics.policyChecks++;
  switch (action) {
    case "load":
      if (Number(context.concurrentLoads) >= _policy.maxConcurrentLoads) {
        _metrics.violations++;
        return { allowed: false, reason: "max_concurrent_loads" };
      }
      return { allowed: true };
    case "retry":
      if (Number(context.attempts) >= _policy.retryAttempts) {
        _metrics.violations++;
        return { allowed: false, reason: "max_retries" };
      }
      return { allowed: true, delay: _policy.retryDelay };
    default:
      return { allowed: true };
  }
}
function createContainerOrchestrationPolicy(options = {}) {
  const policy = { ...DEFAULT_POLICY, ...options };
  let _snapshotData = null;
  return {
    // Métodos originais
    getPolicy: () => ({ ...policy }),
    checkLoad: (context) => checkPolicy("load", context),
    checkRetry: (context) => checkPolicy("retry", context),
    getDockMode: () => policy.defaultDockMode,
    getOpenStrategy: () => policy.defaultOpenStrategy,
    // P0-FIX: Gerar ID único para container
    generateContainerId(panelId) {
      _metrics.containersCreated++;
      return `container-${panelId}-${Date.now().toString(36)}`;
    },
    // P0-FIX: Resolver regra de abertura baseada no painel
    resolveOpenRule(panelId, options2 = {}) {
      const strategy = options2.strategy || policy.defaultOpenStrategy;
      const reuse = options2.reuse !== false;
      const activate = options2.activate !== false;
      return {
        strategy,
        reuse,
        activate,
        dockMode: options2.dockMode || policy.defaultDockMode,
        panelId
      };
    },
    // P0-FIX: Resolver slot de dock
    resolveDockSlot(panelId, currentPrimarySlot = null) {
      if (currentPrimarySlot === DOCK_MODES.PRIMARY) {
        return DOCK_MODES.SECONDARY;
      }
      return DOCK_MODES.PRIMARY;
    },
    // P0-FIX: Snapshot do estado
    snapshot() {
      _snapshotData = {
        policy: { ...policy },
        metrics: { ..._metrics },
        timestamp: Date.now()
      };
      return _snapshotData;
    },
    // P0-FIX: Restaurar estado
    restore(data) {
      if (data?.policy) {
        Object.assign(policy, data.policy);
      }
      _snapshotData = data;
      return true;
    },
    // P0-FIX: Info do policy
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        policy: { ...policy },
        metrics: { ..._metrics },
        hasSnapshot: !!_snapshotData
      };
    }
  };
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { policyActive: true, violations: _metrics.violations },
    policy: _policy,
    metrics: getMetrics()
  };
}
var container_orchestration_policy_default = {
  DOCK_MODES,
  OPEN_STRATEGIES,
  createContainerOrchestrationPolicy,
  getPolicy,
  setPolicy,
  resetPolicy,
  checkPolicy,
  getMetrics,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  DOCK_MODES,
  MODULE_ID,
  OPEN_STRATEGIES,
  VERSION,
  checkPolicy,
  createContainerOrchestrationPolicy,
  container_orchestration_policy_default as default,
  getMetrics,
  getPolicy,
  healthCheck,
  resetPolicy,
  setPolicy
};
