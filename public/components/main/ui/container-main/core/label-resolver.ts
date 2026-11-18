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
  // 18/11: resolve pelo item de ORIGEM — item_key completo, depois rota exata (a da navegação; no Voltar, o endereço atual). Por panelId
  // só se houver UMA correspondência; mais de uma (ex.: os 12 "Geral X" no panel-stub-dev) → título neutro, nunca o 1º da lista.
  return function resolvePanelLabel(panelId: string, origem: { itemKey?: string | null; route?: string | null } = {}) {
    if (!panelId) return 'Principal';
    try {
      if (sidebarRegistry && typeof sidebarRegistry.getItems === 'function') {
        const items = sidebarRegistry.getItems();
        const rot = (it: Record<string, unknown>) => (it.label || it.title || panelId) as string;
        const doPainel = (it: Record<string, unknown>) => !it.panelId || it.panelId === panelId;
        if (origem.itemKey) { const it = items.find((x) => x.key === origem.itemKey && doPainel(x)); if (it) return rot(it); }
        for (const r of [origem.route, typeof window !== 'undefined' ? window.location.hash : null]) {
          if (!r) continue;
          const it = items.find((x) => x.route === r && doPainel(x)); if (it) return rot(it);
        }
        const mesmos = items.filter((x) => x.panelId === panelId || x.id === panelId);
        if (mesmos.length === 1) return rot(mesmos[0]);
        if (mesmos.length > 1) return 'Painel';
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
