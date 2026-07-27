// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-mercado-livre/core/polling
// PURPOSE: core   polling
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION from /core/version.js
//   createModulePollingManager from ../../_shared/core/polling-base.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { VERSION } from '/core/version.js'; export { VERSION };
import { createModulePollingManager } from '../../_shared/core/polling-base.js';
export const MODULE_ID = 'header/components/panel-mercado-livre/core/polling';
const _mod = createModulePollingManager(MODULE_ID);
export const { PollingManager, getMetrics, resetMetrics } = _mod;
export default PollingManager;
