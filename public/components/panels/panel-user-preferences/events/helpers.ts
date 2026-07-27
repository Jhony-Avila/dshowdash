// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences.events.helpers
// PURPOSE: Panel User Preferences - Events Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   ACCESSIBILITY_INTENTS from /core/runtime/events/catalog/accessibility.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setContainer() — exported function
//   getContainer() — exported function
//   announce() — exported function
//   showToast() — exported function
//   setButtonLoading() — exported function
//   openModal() — exported function
//   closeModal() — exported function
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
import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { ACCESSIBILITY_INTENTS } from '/core/runtime/events/catalog/accessibility.events.js';

const VERSION = '9.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-user-preferences.events.helpers';

const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const injectPorts = (p: unknown) => Ports.inject(p);
const getPorts = () => Ports.snapshot();

const _emitIntent = (intent: string, data?: Record<string, unknown>) => { _initPorts(); const eb = _getPort('eventBus'); eb?.emit?.(intent, { source: MODULE_ID, timestamp: Date.now(), ...(data || {}) }); };

let _container: Element | null = null;

const setContainer = (container: Element | null) => { _container = container; };
const getContainer = () => _container;

const announce = (message: string) => {
  _emitIntent(ACCESSIBILITY_INTENTS.ANNOUNCE, { message, priority: 'polite', context: 'helpers' });
  const region = _container?.querySelector('.pup-live-region');
  if (region) { region.textContent = message; setTimeout(() => { region.textContent = ''; }, 1000); }
};

const showToast = (message: string, type = 'success') => {
  _initPorts();
  _emitIntent(UI_INTENTS.SHOW_TOAST, { message, type });
  const t = _getPort('toast');
  t?.show?.(message, type);
};

const setButtonLoading = (btn: HTMLElement | null, loading: boolean) => {
  if (!btn) return;
  const htmlBtn = btn as HTMLButtonElement;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pup-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    htmlBtn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    htmlBtn.disabled = false;
  }
};

const openModal = (modalId: string) => {
  _emitIntent(UI_INTENTS.OPEN_MODAL, { modalId });
  const modal = _container?.querySelector(`#${modalId}`);
  if (modal) { modal.classList.add('visible'); modal.querySelector('button')?.focus(); }
};

const closeModal = (modalId: string) => {
  _emitIntent(UI_INTENTS.CLOSE_MODAL, { modalId });
  _container?.querySelector(`#${modalId}`)?.classList.remove('visible');
};

const addMicroAnimation = (el: Element | null, animClass: string) => { if (!el) return; el.classList.add(animClass); setTimeout(() => { el.classList.remove(animClass); }, 300); };

const requestPushPermission = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    showToast('Navegador não suporta notificações push', 'warning');
    return Promise.resolve(false);
  }
  if (Notification.permission === 'granted') return Promise.resolve(true);
  if (Notification.permission === 'denied') {
    showToast('Notificações bloqueadas pelo navegador', 'warning');
    return Promise.resolve(false);
  }
  return Notification.requestPermission().then((permission) => permission === 'granted');
};

const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), usingP18Intents: true });
const healthCheck = () => ({ status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { helpersReady: true, p18IntentsAvailable: true } });

export { VERSION, MODULE_ID, setContainer, getContainer, announce, showToast, setButtonLoading, openModal, closeModal, addMicroAnimation, requestPushPermission, info, healthCheck, injectPorts, getPorts };
export default { VERSION, MODULE_ID, setContainer, getContainer, announce, showToast, setButtonLoading, openModal, closeModal, addMicroAnimation, requestPushPermission, info, healthCheck, injectPorts, getPorts };
