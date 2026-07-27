// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-accessibility-aria-manager
// PURPOSE: Login Modal - ARIA Attributes Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ModalAriaManager() — exported function
//   FieldAriaManager() — exported function
//   AlertAriaManager() — exported function
//   AriaManager() — exported function
//   info() — exported function
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

export const VERSION = '5.5.0-ENTERPRISE';
export const MODULE_ID = 'login-modal-accessibility-aria-manager';
const isBrowser = typeof document !== 'undefined';
const _metrics = { modalOpens: 0, modalCloses: 0, fieldErrors: 0, fieldClears: 0, alerts: 0 };

export function ModalAriaManager(this: any, modal: HTMLElement | null, config: Record<string, any>) {
  config = config || {};
  this.modal = modal;
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.idPrefix = config.idPrefix || 'login';
}

ModalAriaManager.prototype.setOpen = function() {
  if (!this.modal) return;
  _metrics.modalOpens++;
  this.modal.removeAttribute('hidden');
  this.modal.setAttribute('aria-hidden', 'false');
  this.modal.setAttribute('role', 'dialog');
  this.modal.setAttribute('aria-modal', 'true');
  const titleId = `${this.idPrefix}-title`;
  const title = this.modal.querySelector(`#${titleId}`);
  if (title) this.modal.setAttribute('aria-labelledby', titleId);
  this._track('modal:opened');
};

ModalAriaManager.prototype.setClosed = function() {
  if (!this.modal) return;
  _metrics.modalCloses++;
  this.modal.setAttribute('hidden', '');
  this.modal.setAttribute('aria-hidden', 'true');
  this.modal.removeAttribute('role');
  this.modal.removeAttribute('aria-modal');
  this.modal.removeAttribute('aria-labelledby');
  this._track('modal:closed');
};

ModalAriaManager.prototype._track = function(event: string) { if (this.telemetry && typeof this.telemetry === 'function') this.telemetry(event, { timestamp: Date.now() }); };

export function FieldAriaManager(this: any, config: Record<string, any>) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.onRenderError = config.onRenderError || this._defaultRenderError.bind(this);
  this.onClearError = config.onClearError || this._defaultClearError.bind(this);
  this.errorElements = new Set();
}

FieldAriaManager.prototype.setError = function(input: HTMLElement, message: string, errorCode: string) {
  if (!input || !isBrowser) return;
  _metrics.fieldErrors++;
  input.setAttribute('aria-invalid', 'true');
  const errorId = `${input.id}-error`;
  this.onRenderError(input, errorId, message, errorCode);
  input.setAttribute('aria-describedby', errorId);
  this.errorElements.add(errorId);
  this._track('field:error', { field: input.id, code: errorCode });
};

FieldAriaManager.prototype.clearError = function(input: HTMLElement) {
  if (!input) return;
  _metrics.fieldClears++;
  input.removeAttribute('aria-invalid');
  const errorId = input.getAttribute('aria-describedby');
  if (errorId) { this.onClearError(input, errorId); input.removeAttribute('aria-describedby'); this.errorElements.delete(errorId); }
  this._track('field:cleared', { field: input.id });
};

FieldAriaManager.prototype._defaultRenderError = function(input: HTMLElement, errorId: string, message: string, errorCode: string) {
  if (!isBrowser) return;
  let errorElement = document.getElementById(errorId);
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = this.config.errorClass || 'input-error-message';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    if (errorCode) errorElement.setAttribute('data-error-code', errorCode);
    if (input.parentElement) input.parentElement.appendChild(errorElement);
    else input.insertAdjacentElement('afterend', errorElement);
  }
  errorElement.textContent = message;
  if (errorCode && !errorElement.hasAttribute('data-error-code')) errorElement.setAttribute('data-error-code', errorCode);
};

FieldAriaManager.prototype._defaultClearError = (input: HTMLElement, errorId: string) => { if (!isBrowser) return; const el = document.getElementById(errorId); if (el) el.remove(); };
FieldAriaManager.prototype.cleanup = function() { const self = this; if (!isBrowser) return; self.errorElements.forEach((errorId: string) => { const el = document.getElementById(errorId); if (el) el.remove(); }); self.errorElements.clear(); };
FieldAriaManager.prototype._track = function(event: string, detail: Record<string, unknown>) { detail = detail || {}; if (this.telemetry && typeof this.telemetry === 'function') this.telemetry(event, Object.assign({ timestamp: Date.now() }, detail)); };

export function AlertAriaManager(this: any, config: Record<string, any>) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.autoFocus = config.autoFocus !== false;
  this.temporaryTabIndex = new WeakMap();
}

AlertAriaManager.prototype.setStatus = function(element: HTMLElement, role: string, live: string, message: string, shouldFocus: boolean | undefined) {
  if (shouldFocus === undefined) shouldFocus = this.autoFocus;
  if (!element) return;
  _metrics.alerts++;
  element.setAttribute('role', role);
  element.setAttribute('aria-live', live);
  element.textContent = message;
  if (shouldFocus) { const hadTabIndex = element.hasAttribute('tabindex'); if (!hadTabIndex) { element.tabIndex = -1; this.temporaryTabIndex.set(element, true); } element.focus({ preventScroll: true }); }
  this._track('alert:shown', { role, live, length: message.length });
};

AlertAriaManager.prototype.clearStatus = function(element: HTMLElement) {
  if (!element) return;
  element.removeAttribute('role');
  element.removeAttribute('aria-live');
  element.textContent = '';
  if (this.temporaryTabIndex.has(element)) { element.removeAttribute('tabindex'); this.temporaryTabIndex.delete(element); }
  this._track('alert:cleared');
};

AlertAriaManager.prototype._track = function(event: string, detail: Record<string, unknown>) { detail = detail || {}; if (this.telemetry && typeof this.telemetry === 'function') this.telemetry(event, Object.assign({ timestamp: Date.now() }, detail)); };

export function AriaManager(this: any, modal: HTMLElement | null, config: Record<string, any>, deps: Record<string, any>) {
  config = config || {};
  deps = deps || {};
  this.modal = modal;
  this.logger = deps.logger || console;
  const uiConfig = config.ui || {};
  const subConfig = { idPrefix: config.idPrefix || 'login', errorClass: uiConfig.errorClass || config.errorClass, telemetry: deps.telemetry || config.telemetry || null };
  this._modalManager = new (ModalAriaManager as any)(modal, subConfig);
  this._fieldManager = new (FieldAriaManager as any)(subConfig);
  this._alertManager = new (AlertAriaManager as any)(subConfig);
}

AriaManager.prototype.setModalOpen = function() { this._modalManager.setOpen(); };
AriaManager.prototype.setModalClosed = function() { this._modalManager.setClosed(); };
AriaManager.prototype.setInputError = function(input: HTMLElement, errorMessage: string) { this._fieldManager.setError(input, errorMessage); };
AriaManager.prototype.clearInputError = function(input: HTMLElement) { this._fieldManager.clearError(input); };
AriaManager.prototype.setErrorAlert = function(errorElement: HTMLElement, message: string) { this._alertManager.setStatus(errorElement, 'alert', 'assertive', message); };
AriaManager.prototype.clearErrorAlert = function(errorElement: HTMLElement) { this._alertManager.clearStatus(errorElement); };
AriaManager.prototype.setButtonBusy = (button: HTMLElement | null, isBusy: boolean) => { if (!button) return; if (isBusy) button.setAttribute('aria-busy', 'true'); else button.removeAttribute('aria-busy'); };
AriaManager.prototype.setTogglePressed = (button: HTMLElement | null, isPressed: boolean) => { if (!button) return; button.setAttribute('aria-pressed', isPressed ? 'true' : 'false'); button.setAttribute('aria-label', isPressed ? 'Ocultar senha' : 'Mostrar senha'); };
AriaManager.prototype.cleanup = function() { this._fieldManager.cleanup(); };

export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), timestamp: Date.now() }; }

export function healthCheck() {
  const checks = { isBrowserEnvironment: isBrowser, classesAvailable: typeof ModalAriaManager === 'function' && typeof FieldAriaManager === 'function', ariaManagerExported: typeof AriaManager === 'function' };
  let passed = 0; for (const k in checks) if ((checks as Record<string, boolean>)[k]) passed++;
  const total = 3;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
