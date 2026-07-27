// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker:core:css-injector
// PURPOSE: Injects ticker CSS stylesheet via absolute path
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   injectTickerCSS() — exported function
//   isInjected() — exported function
//   VERSION, MODULE_ID — module constants
//
// NOTE: Uses absolute path to avoid Vite asset inlining (data URL).
//       component-enterprise.css uses @import for sub-modules,
//       which only work with real file URLs, not data: URLs.
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'ticker:core:css-injector';

const CSS_PATH = '/components/ticker/component-enterprise.css';
const CSS_ID = 'ticker-enterprise-css';

let _injected = false;

export function injectTickerCSS() {
  if (typeof document === 'undefined') return false;
  if (_injected) return true;
  if (document.getElementById(CSS_ID)) { _injected = true; return true; }

  // Check if already loaded by href
  const existing = document.querySelector(`link[href="${CSS_PATH}"]`);
  if (existing) { _injected = true; return true; }

  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = CSS_PATH;
  document.head.appendChild(link);
  _injected = true;
  return true;
}

export function isInjected() { return _injected; }

export default { injectTickerCSS, isInjected, VERSION, MODULE_ID };
