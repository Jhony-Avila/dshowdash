// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: lifecycle
// PURPOSE: Bootstrap Helpers - Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createLifecycleHelpers() — exported function
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

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.helpers.lifecycle';

export function createLifecycleHelpers(refs: Record<string, unknown>) {
  const r = refs as Record<string, import('../types.js').ManagerRef | null>;
  return {
    registerPlugin(plugin: Record<string, unknown>) { return r.pluginSystem?.register(plugin); },
    onBeforeBoot(handler: (...args: unknown[]) => void, opts: Record<string, unknown>) { return r.lifecycleHooks?.beforeBoot(handler, opts); },
    onAfterBoot(handler: (...args: unknown[]) => void, opts: Record<string, unknown>) { return r.lifecycleHooks?.afterBoot(handler, opts); },
    onBeforeShutdown(handler: (...args: unknown[]) => void, opts: Record<string, unknown>) { return r.lifecycleHooks?.beforeShutdown(handler, opts); },
    onStateChange(handler: (...args: unknown[]) => void, opts: Record<string, unknown>) { return r.lifecycleHooks?.onStateChange(handler, opts); },
    onError(handler: (...args: unknown[]) => void, opts: Record<string, unknown>) { return r.lifecycleHooks?.onError(handler, opts); },
    createSnapshot(name: string, type: string, meta: Record<string, unknown>) { return r.stateSnapshots?.create(name, type, meta); },
    getSnapshot(id: string) { return r.stateSnapshots?.get(id); },
    listSnapshots() { return r.stateSnapshots?.list(); }
  };
}

export default { createLifecycleHelpers };
