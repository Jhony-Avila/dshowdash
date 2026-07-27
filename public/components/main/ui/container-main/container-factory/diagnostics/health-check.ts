// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-check
// PURPOSE: Health Check
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../constants.js
//
// PROVIDES:
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

import { VERSION, MODULE_ID } from '../constants.js';

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    modular: true
  };
}

export default { healthCheck };
