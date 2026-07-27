// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-lotties-management/events
// PURPOSE: Panel Lotties Management - UI Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ../state/store.js
//   tracker from ../telemetry/tracker.js
//   AVAILABLE_LOTTIES, LOTTIES_BASE_PATH from ../core/lifecycle.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setupEventHandlers() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { state } from '../state/store.js';

// @ts-expect-error TS migration - TS2724
import { tracker } from '../telemetry/tracker.js';
import { AVAILABLE_LOTTIES, LOTTIES_BASE_PATH } from '../core/lifecycle.js';

declare const lottie: Record<string, any>;
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-lotties-management/events';

let _lottieInstance: Record<string, any> | null = null;
let _cleanups: Array<() => void> = [];

async function _loadLottieLib() {
  if (typeof lottie !== 'undefined') return true;
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function _showPreview(lottieId: string, container: HTMLElement) {
  const previewContainer = container.querySelector('[data-preview-container]');
  if (!previewContainer) return;
  if (_lottieInstance) { _lottieInstance.destroy(); _lottieInstance = null; }
  const lottieData = (AVAILABLE_LOTTIES as Record<string, { file: string; name: string; description: string }>)[lottieId];
  if (!lottieData) return;
  await _loadLottieLib();
  state.setPreview(lottieId);
  tracker.trackPreview(lottieId);
  setTimeout(() => {
    const activeContainer = container.querySelector('[data-preview-container]');
    if (activeContainer && typeof lottie !== 'undefined') {
      activeContainer.innerHTML = '';
      _lottieInstance = lottie.loadAnimation({ container: activeContainer, renderer: 'svg', loop: true, autoplay: true, path: LOTTIES_BASE_PATH + lottieData.file });
    }
  }, 100);
}

function _closePreview() {
  if (_lottieInstance) { _lottieInstance.destroy(); _lottieInstance = null; }
  state.clearPreview();
}

function _handleSelect(lottieId: string) {
  const currentSelected = state.getState().selectedLottie;
  state.setSelectedLottie(currentSelected === lottieId ? null : lottieId);
}

function _handleAssign(componentId: string, lottieId: string) {
  if (lottieId) { state.assignLottie(componentId, lottieId); tracker.trackAssign(componentId, lottieId); }
  else { state.unassignLottie(componentId); }
}

function _handleUnassign(componentId: string) { state.unassignLottie(componentId); }

export function setupEventHandlers(container: HTMLElement, onRender: (() => void) | null) {
  const handleClick = (e: MouseEvent) => {
    const target = e.target as Element | null;
    const action = (target?.closest('[data-action]') as HTMLElement | null)?.dataset.action;
    const lottieId = (target?.closest('[data-lottie]') as HTMLElement | null)?.dataset.lottie;
    const componentId = (target?.closest('[data-component]') as HTMLElement | null)?.dataset.component;
    const closePreview = target?.closest('[data-close-preview]');
    if (closePreview) { _closePreview(); if (onRender) onRender(); return; }
    if (!action) return;
    switch (action) {
      case 'preview': if (lottieId) _showPreview(lottieId, container); break;
      case 'select': if (lottieId) { _handleSelect(lottieId); if (onRender) onRender(); } break;
      case 'unassign': if (componentId) { _handleUnassign(componentId); if (onRender) onRender(); } break;
    }
  };
  const handleChange = (e: Event) => {
    const target = e.target as HTMLElement | null;
    const action = (target?.closest('[data-action]') as HTMLElement | null)?.dataset.action;
    const componentId = (target?.closest('[data-component]') as HTMLElement | null)?.dataset.component;
    if (action === 'assign' && componentId) { _handleAssign(componentId, (e.target as HTMLSelectElement).value); if (onRender) onRender(); }
  };
  container.addEventListener('click', handleClick);
  container.addEventListener('change', handleChange);
  _cleanups.push(() => container.removeEventListener('click', handleClick), () => container.removeEventListener('change', handleChange));
  return _cleanups;
}

export function cleanup() {
  if (_lottieInstance) { _lottieInstance.destroy(); _lottieInstance = null; }
  _cleanups.forEach(fn => { try { fn(); } catch(e) {} });
  _cleanups = [];
}

export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasInstance: !!_lottieInstance }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, cleanupCount: _cleanups.length }; }
export default { setupEventHandlers, cleanup, healthCheck, info, VERSION, MODULE_ID };
