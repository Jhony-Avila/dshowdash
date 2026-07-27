// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-maps/ui/ripple
// PURPOSE: Material Design ripple effect for interactive elements
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   createRipple(event, element) — create ripple animation
//   attachRipple(element) — attach ripple listener to element
//   detachRipple(element) — remove ripple listener
//   healthCheck() — module health status
//   info() — module information
// ═══════════════════════════════════════════════════════════════
// panel-maps - UI Ripple Effect (Enterprise)
// @version 8.1.0-ENTERPRISE
'use strict';

import { VERSION } from '/core/version.js'; export { VERSION };
export const MODULE_ID = 'header/components/panel-maps/ui/ripple';

let _debug = false;
const _metrics = { effects: 0, lastEffectAt: (null as unknown|null) };

export function createRipple(event: string, element: HTMLElement|null) {
  // @ts-expect-error TS migration - TS2339
  if (!element) element = event.currentTarget;
  const circle = document.createElement('span');
  const diameter = Math.max(element!.clientWidth, element!.clientHeight);
  const radius = diameter / 2;
  const rect = element!.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  // @ts-expect-error TS migration - TS2339
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  // @ts-expect-error TS migration - TS2339
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add('ripple-effect');
  const existing = element!.querySelector('.ripple-effect');
  if (existing) existing.remove();
  element!.appendChild(circle);
  _metrics.effects++;
  _metrics.lastEffectAt = Date.now();
  setTimeout(() => circle.remove(), 600);
}

export function attachRipple(element: HTMLElement|null) {
  if (!element) return;
  // @ts-expect-error TS migration - TS2769
  element.addEventListener('click', createRipple);
  element.style.position = 'relative';
  element.style.overflow = 'hidden';
}

export function detachRipple(element: HTMLElement|null) {
  if (!element) return;
  // @ts-expect-error TS migration - TS2769
  element.removeEventListener('click', createRipple);
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.effects = 0; _metrics.lastEffectAt = null; }

export function healthCheck() {
  return { status: 'HEALTHY', score: 1, maxScore: 1, checks: { ready: true }, version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() }; }
export default { createRipple, attachRipple, detachRipple };
