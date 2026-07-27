// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader.ui.focus-manager
// PURPOSE: Preloader Focus Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   saveFocusState() — exported function
//   restoreFocusState() — exported function
//   getLastFocusedElement() — exported function
//   setFocusToElement() — exported function
//   reset() — exported function
//   healthCheck() — exported function
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
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.1.0-P17WI';
export const MODULE_ID = 'preloader.ui.focus-manager';
const Ports = createUiPorts({ moduleId: MODULE_ID });
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
let _lastFocusedElement: Element | null = null;
export function saveFocusState() { if (typeof document !== 'undefined') { _lastFocusedElement = document.activeElement; } }
export function restoreFocusState(screenElement: any = null) { if ((_lastFocusedElement as any)?.focus) { try { (_lastFocusedElement as any).focus(); } catch { const main = typeof document !== 'undefined' ? document.querySelector('main[tabindex="-1"]') : null; if (main) (main as any).focus(); } } if (screenElement) { screenElement.removeAttribute('tabindex'); } _lastFocusedElement = null; }
export function getLastFocusedElement() { return _lastFocusedElement; }
export function setFocusToElement(element: { focus?: () => void } | null) { if (element?.focus) { try { element.focus(); } catch {} } }
export function reset() { _lastFocusedElement = null; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, hasSavedFocus: !!_lastFocusedElement, portsInitialized: Ports.isInitialized() }; }
export default { VERSION, MODULE_ID, saveFocusState, restoreFocusState, getLastFocusedElement, setFocusToElement, reset, healthCheck, injectPorts, getPorts };
