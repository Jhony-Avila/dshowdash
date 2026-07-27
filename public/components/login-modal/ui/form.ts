// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-form
// PURPOSE: Login Modal - Form Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   FormComponent() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
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

const MODULE_ID = 'login-modal-form';
const VERSION = '5.6.0-ENTERPRISE';

export function FormComponent(this: any, form: HTMLFormElement | null, config: Record<string, any>, deps: Record<string, any>) { config = config || {}; deps = deps || {}; this.form = form; this.config = config; this.idPrefix = config.idPrefix || 'login'; this.ariaManager = deps.ariaManager; this.logger = deps.logger || console; this.onSubmitCallback = null; this._handleSubmit = this.handleSubmit.bind(this); this._handleButtonClick = this.handleButtonClick.bind(this); this.mounted = false; this.isBusy = false; this.submitLock = false; this._metrics = { submits: 0, errors: 0, rememberMeChecked: 0 }; }

FormComponent.prototype.mount = function(onSubmitCallback: (username: string, password: string, rememberMe: boolean) => void) { const self = this; if (this.mounted) { this.unmount(); } if (!this.form) { if (this.logger && this.logger.warn) this.logger.warn('[FormComponent] Form não encontrado'); return; } this.onSubmitCallback = onSubmitCallback; this.form.addEventListener('submit', this._handleSubmit); const submitButton = this.form.querySelector('button[type="submit"]'); if (submitButton) { submitButton.addEventListener('click', this._handleButtonClick); } this.mounted = true; if (this.logger && this.logger.info) this.logger.info('[FormComponent] Montado com event delegation'); };

FormComponent.prototype.handleButtonClick = function(event: Event) { event.preventDefault(); this._processSubmit(); };

FormComponent.prototype.handleSubmit = function(event: Event) { event.preventDefault(); this._processSubmit(); };

FormComponent.prototype._processSubmit = function() { const self = this; if (this.isBusy || this.submitLock) { if (this.logger && this.logger.warn) this.logger.warn('[FormComponent] Já processando, ignorando submit'); return; } this.submitLock = true; setTimeout(() => { self.submitLock = false; }, 300); const usernameInput = this.form.querySelector(`#${this.idPrefix}-email`); const passwordInput = this.form.querySelector(`#${this.idPrefix}-password`); const rememberCheckbox = this.form.querySelector(`#${this.idPrefix}-remember`); if (!usernameInput || !passwordInput) { this._metrics.errors++; if (this.logger && this.logger.error) this.logger.error('[FormComponent] Inputs não encontrados'); return; } const username = (usernameInput.value || '').trim(); const password = passwordInput.value || ''; const rememberMe = rememberCheckbox ? rememberCheckbox.checked : false; if (rememberMe) { this._metrics.rememberMeChecked++; } this._metrics.submits++; if (this.logger && this.logger.info) this.logger.info('[FormComponent] Submit processado', { username, rememberMe }); if (this.onSubmitCallback) { this.onSubmitCallback(username, password, rememberMe); } };

FormComponent.prototype.getRememberMe = function() { const rememberCheckbox = this.form ? this.form.querySelector(`#${this.idPrefix}-remember`) : null; return rememberCheckbox ? rememberCheckbox.checked : false; };

FormComponent.prototype.setRememberMe = function(checked: boolean) { const rememberCheckbox = this.form ? this.form.querySelector(`#${this.idPrefix}-remember`) : null; if (rememberCheckbox) { rememberCheckbox.checked = checked; } };

FormComponent.prototype.setBusy = function(isBusy: boolean) { this.isBusy = isBusy; const inputs = this.form ? this.form.querySelectorAll('input:not([type="checkbox"]), button') : []; inputs.forEach((el: any) => { el.disabled = isBusy; }); if (this.form) { this.form.setAttribute('aria-busy', isBusy.toString()); } if (this.ariaManager && typeof this.ariaManager.setButtonBusy === 'function') { const button = this.form ? this.form.querySelector('button[type="submit"]') : null; if (button) { this.ariaManager.setButtonBusy(button, isBusy); } } };

FormComponent.prototype.focus = function() { const firstInput = this.form ? this.form.querySelector('input:not([disabled]):not([type="checkbox"])') : null; if (firstInput) firstInput.focus(); };

FormComponent.prototype.clear = function() { const usernameInput = this.form ? this.form.querySelector(`#${this.idPrefix}-email`) : null; const passwordInput = this.form ? this.form.querySelector(`#${this.idPrefix}-password`) : null; if (usernameInput) usernameInput.value = ''; if (passwordInput) passwordInput.value = ''; this.setBusy(false); };

FormComponent.prototype.unmount = function() { if (this.form && this._handleSubmit) { this.form.removeEventListener('submit', this._handleSubmit); } const submitButton = this.form ? this.form.querySelector('button[type="submit"]') : null; if (submitButton && this._handleButtonClick) { submitButton.removeEventListener('click', this._handleButtonClick); } this.clear(); this.mounted = false; if (this.logger && this.logger.info) this.logger.info('[FormComponent] Desmontado'); };

FormComponent.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, isBusy: this.isBusy, hasForm: !!this.form, idPrefix: this.idPrefix, rememberMe: this.getRememberMe(), metrics: Object.assign({}, this._metrics), timestamp: Date.now() }; };

FormComponent.prototype.healthCheck = function() { const checks = { hasForm: !!this.form, isMounted: this.mounted, notBusy: !this.isBusy, hasCallback: !!this.onSubmitCallback }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; };

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() { const checks = { moduleLoaded: true, classAvailable: typeof FormComponent === 'function' }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }

export { VERSION, MODULE_ID };
export default FormComponent;
