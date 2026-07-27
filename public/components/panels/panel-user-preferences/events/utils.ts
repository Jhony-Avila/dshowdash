// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.events.utils
// PURPOSE: Panel User Preferences Events - Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   _container, _state, _handlers, _autoSaveTimeout, setAutoSaveTimeout from ./st...
//   AUTO_SAVE_DELAY from ./constants.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   announce() — exported function
//   showToast() — exported function
//   setButtonLoading() — exported function
//   openModal() — exported function
//   closeModal() — exported function
//   scheduleAutoSave() — exported function
//   cancelAutoSave() — exported function
//   addMicroAnimation() — exported function
//   requestPushPermission() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { _container, _state, _handlers, _autoSaveTimeout, setAutoSaveTimeout } from './state.js';
import { AUTO_SAVE_DELAY } from './constants.js';

const MODULE_ID = 'panel-user-preferences.events.utils';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

const announce = (message: string) => { const region = _container?.querySelector('.pup-live-region'); if (region) { region.textContent = message; setTimeout(() => { region.textContent = ''; }, 1000); } };
const showToast = (message: string, type = 'success') => { _initPorts(); const t = _getPort('toast'); t?.show?.(message, type); };
const setButtonLoading = (btn: Element | null, loading: boolean) => { if (!btn) return; if (loading) { (btn as HTMLElement).dataset.originalText = (btn as HTMLElement).innerHTML; (btn as HTMLElement).innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pup-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>'; (btn as HTMLButtonElement).disabled = true; } else { (btn as HTMLElement).innerHTML = (btn as HTMLElement).dataset.originalText || (btn as HTMLElement).innerHTML; (btn as HTMLButtonElement).disabled = false; } };
const openModal = (modalId: string) => { const modal = _container?.querySelector(`#${modalId}`); if (modal) { modal.classList.add('visible'); const btn = modal.querySelector('button'); btn?.focus(); } };
const closeModal = (modalId: string) => { const modal = _container?.querySelector(`#${modalId}`); modal?.classList.remove('visible'); };

const scheduleAutoSave = () => {
  if (_autoSaveTimeout) clearTimeout(_autoSaveTimeout);
  const timeout = setTimeout(() => {
    if (_state?.isDirty && _handlers?.saveAllChanges) {
      const logger = _getPort('logger');
      logger?.log?.('[Events] Auto-save triggered');
      (_handlers.saveAllChanges as () => Promise<void>)().then(() => { showToast('Alterações salvas automaticamente', 'info'); });
    }
  }, AUTO_SAVE_DELAY);
  setAutoSaveTimeout(timeout);
};

const cancelAutoSave = () => { if (_autoSaveTimeout) { clearTimeout(_autoSaveTimeout); setAutoSaveTimeout(null); } };
const addMicroAnimation = (el: Element | null, animClass: string) => { if (!el) return; el.classList.add(animClass); setTimeout(() => { el.classList.remove(animClass); }, 300); };
const requestPushPermission = () => { if (typeof window === 'undefined' || !('Notification' in window)) { showToast('Navegador não suporta notificações push', 'warning'); return Promise.resolve(false); } if (Notification.permission === 'granted') return Promise.resolve(true); if (Notification.permission === 'denied') { showToast('Notificações bloqueadas pelo navegador', 'warning'); return Promise.resolve(false); } return Notification.requestPermission().then((permission) => permission === 'granted'); };

const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() });
const healthCheck = () => ({ status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { utilsReady: true } });

export { MODULE_ID, VERSION, announce, showToast, setButtonLoading, openModal, closeModal, scheduleAutoSave, cancelAutoSave, addMicroAnimation, requestPushPermission, info, healthCheck, injectPorts, getPorts };
export default { announce, showToast, setButtonLoading, openModal, closeModal, scheduleAutoSave, cancelAutoSave, addMicroAnimation, requestPushPermission, info, healthCheck, injectPorts, getPorts };
