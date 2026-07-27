// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:index:css-loader
// PURPOSE: Panel-05 Index - CSS Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CSS_PATH from ../core/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   loadCSS() — exported function
//   info() — exported function
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

import { CSS_PATH } from '../core/constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:index:css-loader';

export function loadCSS() {
  if (document.querySelector('link[href*="panel-05"]')) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_PATH;
  link.setAttribute('data-panel', 'panel-05');
  document.head.appendChild(link);
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: { cssLoaderReady: true },
    timestamp: Date.now()
  };
}

export default { loadCSS, info, healthCheck, VERSION, MODULE_ID };
