// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/panel-loja-integrada/ui/ripple
// PURPOSE: Material Design ripple effect with lifecycle management
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   create(event, element) — create ripple animation
//   attach(element) — attach ripple listener to element
//   detach(element) — remove ripple listener from element
//   cleanup() — remove leaked ripple DOM elements
//   destroy() — cleanup and reset metrics
//   healthCheck() — module health status
//   info() — module information
// ═══════════════════════════════════════════════════════════════
// Header Panel Loja Integrada - Ripple Effect
// @version 8.4.0-P17WI-AAA
// @changelog AAA - Added detach, cleanup, destroy for enterprise lifecycle
'use strict';
export const VERSION = '8.4.0-P17WI-AAA';
export const MODULE_ID = 'header/components/panel-loja-integrada/ui/ripple';
const _attachedElements = new WeakMap();
let _metrics = { created: 0, attached: 0, detached: 0 };
// @ts-expect-error TS migration - TS2339
export function create(event: string, element: HTMLElement|null) { const rect = element.getBoundingClientRect(); const ripple = document.createElement('span'); const size = Math.max(rect.width, rect.height); const x = event.clientX - rect.left - size / 2; const y = event.clientY - rect.top - size / 2; ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:rgba(255,255,255,0.3);border-radius:50%;transform:scale(0);animation:ripple 0.6s ease-out;pointer-events:none;`; ripple.className = 'ripple-effect'; element.style.position = 'relative'; element.style.overflow = 'hidden'; element.appendChild(ripple); setTimeout(() => ripple.remove(), 600); _metrics.created++; }
// @ts-expect-error TS migration - TS2345
export function attach(element: HTMLElement|null) { if (_attachedElements.has(element)) return false; const handler = (e: Event) => create(e, element); element.addEventListener('click', handler); _attachedElements.set(element, handler); _metrics.attached++; return true; }
// @ts-expect-error strict migration — TS2345
export function detach(element: HTMLElement|null) { if (!_attachedElements.has(element)) return false; const handler = _attachedElements.get(element); element!.removeEventListener('click', handler); _attachedElements.delete(element); _metrics.detached++; return true; }
export function cleanup() { let count = 0; document.querySelectorAll('.ripple-effect').forEach(el => { el.remove(); count++; }); return count; }
export function destroy() { cleanup(); _metrics = { created: 0, attached: 0, detached: 0 }; }
export function getMetrics() { return { ..._metrics }; }
export function healthCheck() { const checks = { noLeakedRipples: document.querySelectorAll('.ripple-effect').length < 50 }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/1`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID }; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck() }; }
export default { create, attach, detach, cleanup, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID };
