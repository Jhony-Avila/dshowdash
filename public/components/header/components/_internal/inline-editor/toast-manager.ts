// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-inline-editor-toast-manager
// PURPOSE: Inline Editor - Toast Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getToastIcon from ./dom-builder.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   showToast() — exported function
//   showConfirmDialog() — exported function
//   hideConfirmDialog() — exported function
//   showEditBanner() — exported function
//   hideEditBanner() — exported function
//   setDoneButtonState() — exported function
//   setResetButtonVisible() — exported function
//   setEditModeUI() — exported function
//   clearActiveToast() — exported function
//   getMetrics() — exported function
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

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header-ui-inline-editor-toast-manager';

import { getToastIcon } from './dom-builder.js';

let activeToast: unknown = null;
let _metrics = { toasts: 0, confirms: 0 };

export function showToast(message: string, type = 'success', duration = 2500) {
  // @ts-expect-error TS migration - TS2339
  _metrics.toasts++; if (activeToast) { activeToast.remove(); activeToast = null; } const existing = document.querySelector('.hie-toast'); if (existing) existing.remove();
  const iconHtml = getToastIcon(type); const toast = document.createElement('div'); toast.className = `hie-toast hie-toast-${type}`; toast.setAttribute('role', 'alert'); toast.innerHTML = `${iconHtml}<span>${message}</span>`; document.body.appendChild(toast); activeToast = toast;
  requestAnimationFrame(() => toast.classList.add('hie-visible')); setTimeout(() => { toast.classList.remove('hie-visible'); setTimeout(() => { toast.remove(); if (activeToast === toast) activeToast = null; }, 300); }, duration);
  return toast;
}


// @ts-expect-error TS migration - TS2339
export function showConfirmDialog() { _metrics.confirms++; const overlay = document.getElementById('hie-confirm-overlay'); if (overlay) { overlay.classList.add('hie-visible'); overlay.querySelector('.hie-confirm-btn.hie-primary')?.focus(); } }
export function hideConfirmDialog() { const overlay = document.getElementById('hie-confirm-overlay'); if (overlay) overlay.classList.remove('hie-visible'); }
export function showEditBanner() { const banner = document.getElementById('hie-edit-banner'); if (banner) banner.classList.add('hie-visible'); }
export function hideEditBanner() { const banner = document.getElementById('hie-edit-banner'); if (banner) banner.classList.remove('hie-visible'); }
// @ts-expect-error TS migration - TS2367
export function setDoneButtonState(state: Record<string,unknown>) { const doneBtn = document.getElementById('hie-done-btn'); if (!doneBtn) return; doneBtn.classList.remove('hie-has-changes', 'hie-saving', 'hie-saved'); if (state === 'hasChanges') { doneBtn.classList.add('hie-has-changes'); } else if (state === 'saving') { doneBtn.classList.add('hie-saving'); } else if (state === 'saved') { doneBtn.classList.add('hie-saved'); setTimeout(() => doneBtn.classList.remove('hie-saved'), 1500); } }
export function setResetButtonVisible(visible: boolean) { const resetBtn = document.getElementById('hie-reset-btn'); if (resetBtn) resetBtn.classList.toggle('hie-visible', visible); }
// @ts-expect-error TS migration - TS2345
export function setEditModeUI(active: boolean) { const header = document.querySelector('.site-header'); if (header) header.classList.toggle('hie-edit-mode', active); if (active) { showEditBanner(); } else { hideEditBanner(); setDoneButtonState('default'); setResetButtonVisible(false); } }
// @ts-expect-error TS migration - TS2339
export function clearActiveToast() { if (activeToast) { activeToast.remove(); activeToast = null; } }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { toastReady: true }, metrics: getMetrics() }; }

export default { showToast, showConfirmDialog, hideConfirmDialog, showEditBanner, hideEditBanner, setDoneButtonState, setResetButtonVisible, setEditModeUI, clearActiveToast, getMetrics, info, healthCheck };
