import { CAPABILITIES } from "./constants.js";
const VERSION = "5.5.0-ENTERPRISE-FULL";
const MODULE_ID = "sidebar-ui-health";
function createHealthCheck(context) {
  return function healthCheck2() {
    const { container, sidebar, initialized, activeItemId, mobileOpen, expandedSections, degradedComponents, lastError, sectionClickHandler } = context();
    const hasContainer = !!container;
    const hasSidebar = !!sidebar;
    const containerInDOM = hasContainer && document.contains(container);
    const sidebarInDOM = hasSidebar && document.contains(sidebar);
    const hasFallback = sidebar?.querySelector("[data-fallback]") !== null;
    const hasAccordionHandlers = !!sectionClickHandler;
    const checks = { hasContainer, hasSidebar, containerInDOM, sidebarInDOM, noFallback: !hasFallback, noDegradedComponents: degradedComponents.length === 0, accordionHandlersSet: hasAccordionHandlers };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = "HEALTHY";
    if (!hasContainer || !hasSidebar) status = "UNHEALTHY";
    else if (!containerInDOM || !sidebarInDOM) status = "DEGRADED";
    else if (degradedComponents.length > 0) status = "DEGRADED";
    else if (hasFallback) status = "DEGRADED";
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, initialized, activeItemId, mobileOpen, expandedSectionsCount: expandedSections.size, expandedSections: Array.from(expandedSections), degradedComponents, lastError, capabilities: CAPABILITIES, compliance: "AAA", noBodyAppend: true, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  };
}
function createInfo(context, healthCheckFn) {
  return function info2() {
    const { activeItemId, mobileOpen, expandedSections, degradedComponents, status } = context();
    return { version: VERSION, moduleId: MODULE_ID, status, activeItemId, mobileOpen, expandedSections: Array.from(expandedSections), degradedComponents, capabilities: CAPABILITIES, healthCheck: healthCheckFn() };
  };
}
function getMetrics() {
  return { factoryReady: true };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true }, metrics: getMetrics() };
}
var health_default = { createHealthCheck, createInfo, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createHealthCheck,
  createInfo,
  health_default as default,
  getMetrics,
  healthCheck,
  info
};
