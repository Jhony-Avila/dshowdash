// Bootstrap-V2 Loader - Globals
// @version 6.2.1
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: hasWindow from ../constants.js
// PROVIDES: exposeGlobal(name, instance)
// BROWSER-APIS: window (dynamic property set)
'use strict';

import { hasWindow } from '../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.loader.helpers.globals';

export function exposeGlobal(name: string, instance: unknown) {
  if (hasWindow) { (window as unknown as Record<string, unknown>)[name] = instance; }
}
