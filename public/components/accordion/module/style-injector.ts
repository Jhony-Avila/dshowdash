// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module.style-injector
// PURPOSE: Dynamic CSS stylesheet injection for accordion component
// ───────────────────────────────────────────────────────────────
// @contract INJECT_STYLES - injectStyles() injects CSS stylesheets
// @contract IS_STYLES_INJECTED - isStylesInjected() checks injection state
// @contract RESET_STYLES_STATE - resetStylesState() resets injection state
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: STYLE_PATHS from ./constants.js
// PROVIDES: injectStyles, isStylesInjected, resetStylesState,
//           healthCheck, info, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

import { STYLE_PATHS } from './constants.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.module.style-injector';

let _stylesInjected = false;

export async function injectStyles() {
  if (_stylesInjected) return { success: true, cached: true };

  try {
    const stylesheets = [
      STYLE_PATHS.TOKENS,
      STYLE_PATHS.MAIN
    ];

    for (const href of stylesheets) {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    }

    _stylesInjected = true;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function isStylesInjected() {
  return _stylesInjected;
}

export function resetStylesState() {
  _stylesInjected = false;
}

export function healthCheck() {
  const checks = {
    injectorAvailable: true,
    stylesInjected: _stylesInjected
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= 1 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stylesInjected: _stylesInjected,
    stylePaths: STYLE_PATHS,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  injectStyles,
  isStylesInjected,
  resetStylesState,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
