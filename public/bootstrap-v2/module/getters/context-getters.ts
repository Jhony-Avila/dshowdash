// Context Getters
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: deepClone from utils/index.js, BOOT_MANIFEST from boot-manifest/index.js
// PROVIDES: createContextGetters(context)
// BROWSER-APIS: None
'use strict';

import { deepClone } from '../utils/index.js';
import { BOOT_MANIFEST } from '../../boot-manifest/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.getters.context-getters';

export function createContextGetters(context: { orchestrator: Record<string, Function> }) {
  const orchestrator = context.orchestrator;

  return {
    getContext: function() {
      return orchestrator.getBootContext();
    },

    getContextSnapshot: function() {
      const ctx = orchestrator.getBootContext();
      return ctx ? ctx.getSnapshot() : null;
    },

    getManifest: function() {
      return deepClone(BOOT_MANIFEST);
    }
  };
}

export default { createContextGetters };
