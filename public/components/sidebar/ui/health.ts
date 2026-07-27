// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE-FULL-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-ui-health
// PURPOSE: Health check e info reporters para o Sidebar UI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION (as CONST_VERSION), CAPABILITIES — from './constants.js'
//
// PROVIDES:
//   createHealthCheck(context) — factory de healthCheck contextual
//   createInfo(context, healthCheckFn) — factory de info contextual
//   getMetrics() — métricas standalone
//   info() — info standalone
//   healthCheck() — healthCheck standalone
//   VERSION, MODULE_ID — constantes
//
// RECEIVES (via init/options): context (função que retorna estado UI)
// EMITS (eventos): nenhum
// LISTENS (eventos): nenhum
// WINDOW ACCESS: document.contains (DOM query)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION as CONST_VERSION, CAPABILITIES } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-ui-health';

export function createHealthCheck(context: DynObj) {
  return function healthCheck() {
    const { container, sidebar, initialized, activeItemId, mobileOpen, expandedSections, degradedComponents, lastError, sectionClickHandler } = context();
    const hasContainer = !!container; const hasSidebar = !!sidebar;
    const containerInDOM = hasContainer && document.contains(container);
    const sidebarInDOM = hasSidebar && document.contains(sidebar);
    const hasFallback = sidebar?.querySelector('[data-fallback]') !== null;
    const hasAccordionHandlers = !!sectionClickHandler;
    const checks = { hasContainer, hasSidebar, containerInDOM, sidebarInDOM, noFallback: !hasFallback, noDegradedComponents: degradedComponents.length === 0, accordionHandlersSet: hasAccordionHandlers };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    let status = 'HEALTHY';
    if (!hasContainer || !hasSidebar) status = 'UNHEALTHY';
    else if (!containerInDOM || !sidebarInDOM) status = 'DEGRADED';
    else if (degradedComponents.length > 0) status = 'DEGRADED';
    else if (hasFallback) status = 'DEGRADED';
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, initialized, activeItemId, mobileOpen, expandedSectionsCount: expandedSections.size, expandedSections: Array.from(expandedSections), degradedComponents, lastError, capabilities: CAPABILITIES, compliance: 'AAA', noBodyAppend: true, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  };
}

export function createInfo(context: DynObj, healthCheckFn: DynObj) {
  return function info() {
    const { activeItemId, mobileOpen, expandedSections, degradedComponents, status } = context();
    return { version: VERSION, moduleId: MODULE_ID, status, activeItemId, mobileOpen, expandedSections: Array.from(expandedSections), degradedComponents, capabilities: CAPABILITIES, healthCheck: healthCheckFn() };
  };
}

export function getMetrics() { return { factoryReady: true }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { factoryReady: true }, metrics: getMetrics() }; }

export default { createHealthCheck, createInfo, getMetrics, info, healthCheck, VERSION, MODULE_ID };
