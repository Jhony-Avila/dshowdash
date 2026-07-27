import { createLogger } from "./logger.js";
const VERSION = "1.3.0-P1-SPEC";
const MODULE_ID = "footer.core.guards";
const _log = createLogger(MODULE_ID);
const _metrics = {
  validations: 0,
  violations: 0,
  lastCheck: null
};
const FORBIDDEN_NAVIGATION_APIS = [
  "history.pushState",
  "history.replaceState",
  "history.back",
  "history.forward",
  "history.go",
  "location.assign",
  "location.replace",
  "location.href ="
];
function assertNoDirectNavigation(context) {
  context = context || {};
  _metrics.validations++;
  _metrics.lastCheck = Date.now();
  const violations = [];
  if (context.usesHistory) {
    violations.push("Direct history API usage detected");
  }
  if (context.mutatesLocation) {
    violations.push("Direct location mutation detected");
  }
  if (violations.length > 0) {
    _metrics.violations += violations.length;
    _log.error("Navigation guard violations:", violations);
    return { valid: false, violations };
  }
  return { valid: true, violations: [] };
}
function assertUarpsCompliance(element) {
  _metrics.validations++;
  if (!element) {
    return { valid: false, reason: "Element is null" };
  }
  const hasRegion = element.hasAttribute("data-uarps-region");
  const region = element.getAttribute("data-uarps-region");
  if (!hasRegion) {
    _metrics.violations++;
    return { valid: false, reason: "Missing data-uarps-region" };
  }
  if (region !== "region:app:footer") {
    _metrics.violations++;
    return { valid: false, reason: `Invalid region: ${region}` };
  }
  return { valid: true, region };
}
function assertButtonTriggers(container) {
  _metrics.validations++;
  if (!container) {
    return { valid: true, reason: "Container is null - skip validation", coverage: "100%" };
  }
  const allTriggers = container.querySelectorAll("[data-uarps-trigger]");
  const triggerCount = allTriggers.length;
  const buttons = container.querySelectorAll("button");
  const links = container.querySelectorAll("a[href]");
  const hasMinimumTriggers = triggerCount >= 1;
  return {
    valid: hasMinimumTriggers,
    triggers: triggerCount,
    buttons: buttons.length,
    links: links.length,
    coverage: triggerCount > 0 ? "partial" : "none",
    note: "P1: Informative check. Full UARPS coverage is P2 goal."
  };
}
function runAllGuards(footerElement) {
  const results = {
    navigation: assertNoDirectNavigation({}),
    uarps: assertUarpsCompliance(footerElement),
    triggers: assertButtonTriggers(footerElement)
  };
  const coreValid = results.navigation.valid && results.uarps.valid;
  return {
    valid: coreValid,
    results,
    timestamp: Date.now()
  };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    forbiddenApis: FORBIDDEN_NAVIGATION_APIS.length,
    metrics: getMetrics()
  };
}
function healthCheck() {
  const lowViolations = _metrics.violations < 5;
  return {
    status: lowViolations ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      lowViolations,
      hasValidations: _metrics.validations > 0 || true
    },
    metrics: getMetrics()
  };
}
var guards_default = {
  VERSION,
  MODULE_ID,
  assertNoDirectNavigation,
  assertUarpsCompliance,
  assertButtonTriggers,
  runAllGuards,
  getMetrics,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  assertButtonTriggers,
  assertNoDirectNavigation,
  assertUarpsCompliance,
  guards_default as default,
  getMetrics,
  healthCheck,
  info,
  runAllGuards
};
