const VERSION = "3.1.0-ES6";
const MODULE_ID = "navrail/core/component-mounter";
const MOUNTER_EVENTS = {
  COMPONENTS_MOUNTED: "navrail:components:mounted",
  COMPONENT_ERROR: "navrail:component:error",
  COMPONENT_RETRY: "navrail:component:retry",
  LAZY_LOAD_START: "navrail:lazy:start",
  LAZY_LOAD_COMPLETE: "navrail:lazy:complete"
};
const loadedModules = /* @__PURE__ */ new Map();
const mountedInstances = /* @__PURE__ */ new Map();
const componentState = {
  mounted: /* @__PURE__ */ new Set(),
  failed: /* @__PURE__ */ new Map(),
  pending: /* @__PURE__ */ new Set(),
  loading: /* @__PURE__ */ new Set()
};
const metrics = {
  totalMounts: 0,
  totalFails: 0,
  totalRetries: 0,
  lazyLoaded: 0,
  eagerLoaded: 0
};
function resetState() {
  loadedModules.clear();
  mountedInstances.clear();
  componentState.mounted.clear();
  componentState.failed.clear();
  componentState.pending.clear();
  componentState.loading.clear();
}
var constants_default = {
  VERSION,
  MODULE_ID,
  MOUNTER_EVENTS,
  loadedModules,
  mountedInstances,
  componentState,
  metrics,
  resetState
};
export {
  MODULE_ID,
  MOUNTER_EVENTS,
  VERSION,
  componentState,
  constants_default as default,
  loadedModules,
  metrics,
  mountedInstances,
  resetState
};
