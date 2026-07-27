// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-calendar/ui/tooltips
// PURPOSE: panel-calendar - UI Tooltips (Enterprise)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   show() — exported function
//   hide() — exported function
//   attachTooltip() — exported function
//   setDebug() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'blur'
//   'focus'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-calendar/ui/tooltips';

let _debug = false;
let _tooltip: unknown = null;
const _metrics = { shown: 0, hidden: 0, lastShownAt: (null as unknown|null) };

export function show(element: HTMLElement|null, text: string, options = {}) {
  hide();
  _tooltip = document.createElement('div');
  // @ts-expect-error TS migration - TS2339
  _tooltip.className = 'tooltip-popup';
  // @ts-expect-error TS migration - TS2339
  _tooltip.textContent = text;
  // @ts-expect-error TS migration - TS2339
  _tooltip.setAttribute('role', 'tooltip');
  const rect = element!.getBoundingClientRect();
  // @ts-expect-error TS migration - TS2339
  _tooltip.style.cssText = `position:fixed;z-index:9999;padding:6px 10px;background:#333;color:#fff;border-radius:4px;font-size:12px;top:${rect.bottom + 8}px;left:${rect.left}px;`;
  // @ts-expect-error TS migration - TS2345
  document.body.appendChild(_tooltip);
  _metrics.shown++;
  _metrics.lastShownAt = Date.now();
}

export function hide() {
  // @ts-expect-error TS migration - TS2339
  if (_tooltip) { _tooltip.remove(); _tooltip = null; _metrics.hidden++; }
}

export function attachTooltip(element: HTMLElement|null, text: string) {
  if (!element) return;
  element.addEventListener('mouseenter', () => show(element, text));
  element.addEventListener('mouseleave', hide);
  element.addEventListener('focus', () => show(element, text));
  element.addEventListener('blur', hide);
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics, active: !!_tooltip }; }
export function resetMetrics() { _metrics.shown = 0; _metrics.hidden = 0; _metrics.lastShownAt = null; }

export function healthCheck() {
  return { status: 'HEALTHY', score: 1, maxScore: 1, checks: { ready: true }, version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, hasActiveTooltip: !!_tooltip, metrics: getMetrics() }; }
export default { show, hide, attachTooltip };
