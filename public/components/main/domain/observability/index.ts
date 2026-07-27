// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: observability
// PURPOSE: Observability Module - Factory P10.4.2 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ObservabilityController, createObservabilityController from ./observability-c...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createObservabilityModule() — exported function
//   ObservabilityController — exported value
//   createObservabilityController — exported value
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

export const VERSION = '2.1.0-P18EC';
export const MODULE_ID = 'observability';

import { ObservabilityController, createObservabilityController } from './observability-controller.js';

export function createObservabilityModule(context: Record<string, unknown> = {}) {
  const controller = createObservabilityController(context);
  controller.init();

  return {
    controller,
    
    healthCheck() {
      return {
        status: 'healthy',
        controller: controller.healthCheck(),
        version: VERSION,
        moduleId: MODULE_ID
      };
    },

    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        controller: controller.info()
      };
    },

    destroy() {
      controller.destroy();
    }
  };
}

export { ObservabilityController, createObservabilityController } from './observability-controller.js';

export default { createObservabilityModule, VERSION, MODULE_ID };
