import { isStylesInjected } from "./style-injector.js";
import { isPortsInitialized } from "./ports-manager.js";
import * as state from "./singleton-state.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.diagnostics";
function getMetrics() {
  const instance = state.getInstance();
  const view = state.getView();
  const telemetry = state.getTelemetry();
  return {
    controller: instance?.getMetrics() ?? null,
    view: view?.getMetrics() ?? null,
    telemetry: telemetry?.getMetrics() ?? null
  };
}
function healthCheck() {
  const instance = state.getInstance();
  const view = state.getView();
  const telemetry = state.getTelemetry();
  const instanceHealth = instance?.healthCheck() ?? null;
  const viewHealth = view?.healthCheck() ?? null;
  const telemetryHealth = telemetry?.healthCheck() ?? null;
  const checks = {
    moduleLoaded: true,
    portsInitialized: isPortsInitialized(),
    stylesInjected: isStylesInjected(),
    hasInstance: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry(),
    instanceHealthy: instanceHealth?.status === "HEALTHY",
    viewHealthy: viewHealth?.status === "HEALTHY"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 6 ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    components: {
      controller: instanceHealth,
      view: viewHealth,
      telemetry: telemetryHealth
    },
    version: VERSION,
    moduleId: MODULE_ID,
    modular: true,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    hasInstance: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry(),
    stylesInjected: isStylesInjected(),
    portsInitialized: isPortsInitialized(),
    submodules: {
      contracts: "1.1.0-P2-ENTERPRISE",
      state: "1.1.0-P2-ENTERPRISE",
      controller: "1.1.0-P2-ENTERPRISE",
      view: "2.4.0-P2-ENTERPRISE",
      persistence: "1.1.0-P2-ENTERPRISE",
      telemetry: "1.2.0-P2-ENTERPRISE",
      mock: "1.1.0-P2-ENTERPRISE"
    },
    capabilities: [
      "data-driven",
      "multi-mode",
      "single-mode",
      "persistence",
      "uarps-integration",
      "uarps-region-configurable",
      "icon-resolver-injectable",
      "event-driven",
      "observable",
      "telemetry",
      "a11y-compliant",
      "teal-theme",
      "decoupled-from-sidebar"
    ]
  };
}
function audit() {
  const view = state.getView();
  const options = state.getOptions();
  const viewInfo = view?.info() ?? {};
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    timestamp: Date.now(),
    checks: {
      hasSidebarImports: false,
      uarpsRegionMode: options.uarpsRegion ? "override" : "default",
      uarpsRegionValue: viewInfo.uarpsRegion ?? "region:app:accordion-ncs",
      idStrategy: "canonical",
      intentsSource: "central-catalog",
      cssInjected: isStylesInjected(),
      iconResolverInjected: options.iconResolver !== void 0 && options.iconResolver !== null
    },
    options: {
      uarpsRegion: options.uarpsRegion ?? null,
      iconResolver: options.iconResolver ? "function" : null,
      persistence: options.persistence !== false,
      telemetry: options.telemetry !== false
    },
    compliance: {
      p0_1_decoupled: true,
      p0_2_region_configurable: true,
      p0_3_ids_unified: true,
      p1_1_intents_authority: "central",
      p2_enterprise: true
    }
  };
}
var diagnostics_default = {
  getMetrics,
  healthCheck,
  info,
  audit,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  audit,
  diagnostics_default as default,
  getMetrics,
  healthCheck,
  info
};
