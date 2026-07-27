// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: getters-api
// PURPOSE: Getters API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//
// PROVIDES:
//   createGettersAPI() — exported function
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

import { VERSION, MODULE_ID } from '../constants.js';

export function createGettersAPI(context: Record<string, unknown>) {
  const containerId = context.containerId as string;
  const options = context.options as Record<string, unknown>;
  const state = context.state as Record<string, unknown>;
  const refs = context.refs as Record<string, unknown>;
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    getElement() { return refs.container as HTMLElement | null; },
    getId() { return containerId; },
    getOptions() { return { ...options }; },
    getComponent(name: string) { return getComponents()[name] || null; },

    healthCheck() {
      const components = getComponents();
      const componentCount = Object.keys(components).length;
      const healthyComponents = Object.values(components).filter(c => (c as any)?.healthCheck?.()?.status === 'HEALTHY').length;

      return {
        status: state.error ? 'DEGRADED' : state.mounted ? 'HEALTHY' : 'NOT_MOUNTED',
        version: VERSION,
        moduleId: MODULE_ID,
        containerId,
        mounted: state.mounted,
        state: { ...state },
        componentCount,
        healthyComponents,
        controlsInitialized: !!components.controls?.isInitialized?.()
      };
    }
  };
}

export default { createGettersAPI };
