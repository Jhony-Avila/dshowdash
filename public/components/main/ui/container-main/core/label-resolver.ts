// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:label-resolver
// PURPOSE: container-main/core/label-resolver.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectSidebarRegistry() — exported function
//   getInjectedSidebarRegistry() — exported function
//   getSidebarRegistry() — exported function
//   createLabelResolver() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const VERSION = '8.2.0-ENTERPRISE';
export const MODULE_ID = 'container-main:label-resolver';

let _injectedSidebarRegistry: unknown = null;

export function injectSidebarRegistry(registry: unknown) { _injectedSidebarRegistry = registry; }

export function getInjectedSidebarRegistry() { return _injectedSidebarRegistry; }

export function getSidebarRegistry(context: Record<string, unknown>) {
  if ((context?.ports as Record<string, unknown>)?.sidebarRegistry) return (context.ports as Record<string, unknown>).sidebarRegistry;
  if (context?.sidebarRegistry) return context.sidebarRegistry;
  if (_injectedSidebarRegistry) return _injectedSidebarRegistry;
  return null;
}

export function createLabelResolver(sidebarRegistry: { getItems?: () => Array<Record<string, unknown>> } | null) {
  return function resolvePanelLabel(panelId: string) {
    if (!panelId) return 'Principal';
    try {
      if (sidebarRegistry && typeof sidebarRegistry.getItems === 'function') {
        const items = sidebarRegistry.getItems();
        for (let i = 0; i < items.length; i++) {
          if (items[i].panelId === panelId || items[i].id === panelId) {
            return items[i].label || items[i].title || panelId;
          }
        }
      }
    } catch (e) { }
    return panelId.replace(/^panel-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };
}

export function healthCheck() {
  const hasInjected = !!_injectedSidebarRegistry;
  const checks = { resolverReady: true, hasInjectedRegistry: hasInjected };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedRegistry: !!_injectedSidebarRegistry, diStrict: true };
}
