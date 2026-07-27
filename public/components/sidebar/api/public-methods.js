import * as Ports from "./ports.js";
import * as Metrics from "./metrics.js";
import { createCollapseMethods, resetDebounce, isDebounceActive } from "./collapse-methods.js";
import { createAccordionMethods } from "./accordion-methods.js";
import { createMobileMethods } from "./mobile-methods.js";
import { createNavigationMethods } from "./navigation-methods.js";
const VERSION = "6.0.0-MODULAR";
const MODULE_ID = "sidebar-public-methods";
const injectPorts = Ports.inject;
const getPorts = Ports.snapshot;
const getMetrics = Metrics.getAll;
function createPublicMethods(dependencies) {
  return {
    ...createCollapseMethods(dependencies),
    ...createAccordionMethods(dependencies),
    ...createMobileMethods(dependencies),
    ...createNavigationMethods(dependencies)
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    debounceActive: isDebounceActive(),
    metrics: Metrics.getAll(),
    p24AtomicTransitions: true,
    modular: true,
    submodules: ["ports", "metrics", "collapse-methods", "accordion-methods", "mobile-methods", "navigation-methods"]
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: {
      debounceActive: isDebounceActive(),
      atomicTransitions: Metrics.get("atomicTransitions"),
      syncFailures: Metrics.get("syncFailures")
    },
    metrics: Metrics.getAll(),
    p24AtomicTransitions: true,
    modular: true
  };
}
var public_methods_default = {
  createCollapseMethods,
  createAccordionMethods,
  createMobileMethods,
  createNavigationMethods,
  createPublicMethods,
  resetDebounce,
  getMetrics,
  injectPorts,
  getPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createAccordionMethods,
  createCollapseMethods,
  createMobileMethods,
  createNavigationMethods,
  createPublicMethods,
  public_methods_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  resetDebounce
};
