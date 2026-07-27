// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-features-bridge
// PURPOSE: Container Features Bridge - Ponte para Features do Container-Main
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getContainerApis from ./internal-state.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createFeaturesBridge() — exported function
//   healthCheck() — exported function
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

import { getContainerApis } from './internal-state.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-features-bridge';

export function createFeaturesBridge() {
  const _containerApis = getContainerApis();

  return {
    // Toast
    toast(id: string, message: string, type = 'info') {
      return _containerApis.get(id)?.toast(message, type);
    },
    toastSuccess(id: string, message: string) { return _containerApis.get(id)?.toastSuccess(message); },
    toastError(id: string, message: string) { return _containerApis.get(id)?.toastError(message); },
    toastWarning(id: string, message: string) { return _containerApis.get(id)?.toastWarning(message); },
    toastInfo(id: string, message: string) { return _containerApis.get(id)?.toastInfo(message); },

    // Progress
    setProgress(id: string, value: number, variant: string) {
      _containerApis.get(id)?.setProgress(value, variant);
      return true;
    },

    // Tabs
    addTab(id: string, tab: Record<string, unknown>) { _containerApis.get(id)?.addTab(tab); return true; },
    removeTab(id: string, tabId: string) { _containerApis.get(id)?.removeTab(tabId); return true; },
    setActiveTab(id: string, tabId: string) { _containerApis.get(id)?.setActiveTab(tabId); return true; },

    // Badge
    setBadge(id: string, count: number) { _containerApis.get(id)?.setBadge(count); return true; },
    clearBadge(id: string) { _containerApis.get(id)?.clearBadge(); return true; },

    // Toolbar
    setToolbarItems(id: string, items: Record<string, unknown>[]) { _containerApis.get(id)?.setToolbarItems(items); return true; },
    addToolbarItem(id: string, item: Record<string, unknown>, index: number) { _containerApis.get(id)?.addToolbarItem(item, index); return true; },

    // Zoom
    zoomIn(id: string) { _containerApis.get(id)?.zoomIn(); return true; },
    zoomOut(id: string) { _containerApis.get(id)?.zoomOut(); return true; },
    setZoom(id: string, value: number) { _containerApis.get(id)?.setZoom(value); return true; },
    resetZoom(id: string) { _containerApis.get(id)?.resetZoom(); return true; },
    getZoom(id: string) { return _containerApis.get(id)?.getZoom() || 100; },

    // Accessibility
    announce(id: string, message: string, priority: string) { _containerApis.get(id)?.announce(message, priority); return true; },
    focusFirst(id: string) { _containerApis.get(id)?.focusFirst(); return true; },

    // Debug
    debugLog(id: string, msg: string, data: unknown) { _containerApis.get(id)?.debug?.log(msg, data); },
    debugToggle(id: string) { _containerApis.get(id)?.debug?.toggle(); },

    // Fullscreen
    fullscreen(id: string, enable = true) {
      _containerApis.get(id)?.fullscreen(enable);
      return true;
    }
  };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default { createFeaturesBridge, healthCheck, VERSION, MODULE_ID };
