// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.5.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-accessibility-keyboard
// PURPOSE: Login Modal - Keyboard Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   KeyboardHandler — exported class
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
export const MODULE_ID = 'login-modal-accessibility-keyboard';

const DEFAULT_KEYMAP = { Escape: { enabled: true, blockedWhenBusy: true } };
const isBrowser = typeof document !== 'undefined' && typeof window !== 'undefined';

export class KeyboardHandler {
  [key: string]: any;
  constructor(config: Record<string, any> = {}, deps: Record<string, any> = {}) {
    this.config = config; this.logger = deps.logger || console; this.telemetry = deps.telemetry || null;
    this.scope = isBrowser ? (config.scope || document) : null; this.scopeElementId = this.scope === document ? 'document' : (this.scope?.id || 'custom');
    this.isActive = false; this.isBusy = false; this.isModalOpen = false; this.keymapLocked = false;
    this.keymap = { ...DEFAULT_KEYMAP, ...(config.keymap || {}) };
    this.escapePolicy = config.escapePolicy || { alwaysEnabled: true, requireConfirmWhenBusy: false, messageWhenBlocked: 'Aguarde a operação terminar' };
    this.callbacks = new Map(); this._handleKeyDown = this.handleKeyDown.bind(this); this.abortController = null;
    this._metrics = { activations: 0, deactivations: 0, keyTriggered: 0, keyBlocked: 0, errors: 0 };
  }

  activate(callbacks: Record<string, unknown> = {}) { if (!isBrowser || !this.scope) { this.logger?.warn('KeyboardHandler: ambiente não-browser ou scope não definido'); return; } if (this.isActive) { this.logger.warn('KeyboardHandler já ativo'); return; } this._metrics.activations++; this.isActive = true; this.isModalOpen = true; this.callbacks = new Map(Object.entries(callbacks)); this.abortController = new AbortController(); this.scope.addEventListener('keydown', this._handleKeyDown, { signal: this.abortController.signal }); this._track('keyboard:activated', { scope: this.scopeElementId }); this.logger.info('Keyboard handler ativado', { keys: Object.keys(this.keymap), scope: this.scopeElementId }); }
  deactivate() { if (!this.isActive) return; this._metrics.deactivations++; this.isActive = false; this.isModalOpen = false; this.callbacks.clear(); if (this.abortController) { this.abortController.abort(); this.abortController = null; } this._track('keyboard:deactivated'); this.logger.info('Keyboard handler desativado'); }

  handleKeyDown(event: KeyboardEvent) { const { key } = event; const keyConfig = this.keymap[key]; if (!keyConfig || !keyConfig.enabled) return; if (!this.isModalOpen) return; if (key === 'Escape') { if (this.escapePolicy.alwaysEnabled) { if (this.isBusy && this.escapePolicy.requireConfirmWhenBusy) { this._metrics.keyBlocked++; this._track('key:blocked', { key, reason: 'busy_requires_confirm' }); this.logger.info('ESC bloqueado (busy + requireConfirm)', { message: this.escapePolicy.messageWhenBlocked }); return; } const callback = this.callbacks.get(key); if (callback && typeof callback === 'function') { event.preventDefault(); this._metrics.keyTriggered++; this._track('key:triggered', { key }); this.logger.info(`${key} pressionado - executando callback (policy: alwaysEnabled)`); callback(event); } return; } } if (keyConfig.blockedWhenBusy && this.isBusy) { this._metrics.keyBlocked++; this._track('key:blocked', { key, reason: 'busy' }); this.logger.info(`${key} bloqueado (busy state)`); return; } const callback = this.callbacks.get(key); if (callback && typeof callback === 'function') { event.preventDefault(); this._metrics.keyTriggered++; this._track('key:triggered', { key }); this.logger.info(`${key} pressionado - executando callback`); callback(event); } }

  registerKey(key: string, config: Record<string, unknown> = {}, callback: unknown) { if (this.keymapLocked) { this.logger.warn(`Keymap locked - não pode registrar ${key}`); return false; } this.keymap[key] = { enabled: config.enabled !== false, blockedWhenBusy: config.blockedWhenBusy !== false }; if (callback) this.callbacks.set(key, callback); this.logger.info(`Tecla ${key} registrada`, config); return true; }
  unregisterKey(key: string) { if (this.keymapLocked) { this.logger.warn(`Keymap locked - não pode remover ${key}`); return false; } delete this.keymap[key]; this.callbacks.delete(key); this.logger.info(`Tecla ${key} removida`); return true; }
  lockKeymap() { this.keymapLocked = true; this.logger.info('Keymap locked'); }
  unlockKeymap() { this.keymapLocked = false; this.logger.info('Keymap unlocked'); }
  setBusy(isBusy: boolean) { this.isBusy = isBusy; }
  setModalOpen(isOpen: boolean) { this.isModalOpen = isOpen; }
  getState() { return { isActive: this.isActive, isBusy: this.isBusy, isModalOpen: this.isModalOpen, keymapLocked: this.keymapLocked, registeredKeys: Object.keys(this.keymap), scope: this.scopeElementId, escapePolicy: this.escapePolicy }; }
  _track(event: string, detail: Record<string, unknown> = {}) { if (this.telemetry && typeof this.telemetry === 'function') this.telemetry(event, { ...detail, timestamp: Date.now(), source: 'keyboard-handler' }); }
  info() { return { moduleId: MODULE_ID, version: VERSION, metrics: { ...this._metrics }, state: this.getState(), timestamp: Date.now() }; }
  healthCheck() { const checks = { isBrowserEnvironment: isBrowser, scopeDefined: !!this.scope, keymapValid: Object.keys(this.keymap).length > 0, lowErrorRate: this._metrics.keyTriggered === 0 || (this._metrics.errors / this._metrics.keyTriggered) < 0.1 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
}

export default KeyboardHandler;
