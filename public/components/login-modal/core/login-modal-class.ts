// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-modal-class
// PURPOSE: Login Modal Class - Enterprise Auth Widget
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, LIFECYCLE_EVENTS from /core/runtime/events/index.js
//   HashRouterAdapter, MemoryRouterAdapter from ./router-adapters.js
//   EventBus from ../state/events.js
//   SystemInitializer from ./system-initializer.js
//   LoginHandler from ./login-handler.js
//   ModalController from ./modal-controller.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   setDebug() — exported function
//   LoginModal — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   AUTH_EVENTS.READY
//   LIFECYCLE_EVENTS.READY
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';

import { HashRouterAdapter, MemoryRouterAdapter } from './router-adapters.js';
import { EventBus } from '../state/events.js';
import { SystemInitializer } from './system-initializer.js';
import { LoginHandler } from './login-handler.js';
import { ModalController } from './modal-controller.js';

export const VERSION = '6.1.0-P18EC';
export const MODULE_ID = 'login-modal-class';

const COMPONENT_MODULE_ID = 'login-modal';
const MODULE_VERSION = VERSION;
const MODAL_CONTAINER_ID = 'login-modal-container';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const config = _getPort('config'); return config?.app?.debug ?? false; };
const _log = (level: string, ...args: any[]) => { const logger = _getPort('logger'); if (!logger) return; if (level === 'error') { logger.error?.('[login-modal-class]', ...args); return; } if (level === 'warn') { logger.warn?.('[login-modal-class]', ...args); return; } if (_debugEnabled()) logger.debug?.('[login-modal-class]', ...args); };

export class LoginModal {
  [key: string]: any;
  constructor(config: Record<string, any> = {}) { this.config = config; this.eventBus = config.eventBus || new (EventBus as any)({ namespace: COMPONENT_MODULE_ID, debug: config.debug?.enabled || false }); this.eventBusExternal = !!config.eventBus; const routerMode = config.routerMode || 'memory'; this.router = config.router || (routerMode === 'hash' ? new (HashRouterAdapter as any)() : new (MemoryRouterAdapter as any)()); this.container = null; this.modal = null; this.form = null; this.usernameInput = null; this.passwordInput = null; this.submitButton = null; this.errorElement = null; this.toggleButton = null; this.video = null; this.logger = null; this.telemetry = null; this.timers = null; this.store = null; this.csrfManager = null; this.authAPI = null; this.deviceIDManager = null; this.validator = null; this.rateLimiter = null; this.focusTrap = null; this.ariaManager = null; this.keyboardHandler = null; this.errorDisplay = null; this.togglePassword = null; this.formComponent = null; this.errorHandler = null; this.videoManager = null; this.mounted = false; this.destroyed = false; this.loginAbortController = null; this._handlers = new Map(); this._cleanupFunctions = []; this.canActivate = config.canActivate || (() => true); this.containerTarget = config.container || null; this.onAuthSuccess = config.onAuthSuccess || null; this.onAuthFailure = config.onAuthFailure || null; this.onReady = config.onReady || null; this.systemInitializer = new (SystemInitializer as any)(this); this.loginHandler = new (LoginHandler as any)(this); this.modalController = new (ModalController as any)(this); this._debug = config.debug?.enabled || false; this._metrics = { mountCount: 0, openCount: 0, closeCount: 0, loginAttemptCount: 0, loginSuccessCount: 0, loginFailCount: 0, lastMountAt: null, lastOpenAt: null, lastLoginAt: null }; }

  async mount() { if (this.mounted) { _log('warn', 'Já montado'); return; } if (this.destroyed) { _log('warn', 'Instância destruída'); return; } if (!this.canActivate()) { _log('warn', 'Bloqueado por canActivate()'); return; } this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); try { await this.loadConfig(); this.systemInitializer.initCoreSystems(); this.store.mount(); this.createContainer(); await this.injectTemplate(); this.queryElements(); if (!this.validateElements()) throw new Error('Falha na validação de elementos DOM'); this.systemInitializer.initAPISecurity(); this.systemInitializer.initAccessibility(); this.systemInitializer.initUIComponents(); this.systemInitializer.initCoreManagers(); this.systemInitializer.loadCSS(); this.systemInitializer.setupEventListeners(); _initPorts(); this.mounted = true; _log('info', `Login Modal montado (${VERSION})`); this.checkInitialState(); this._emitReady(); } catch (error) { _log('error', 'Erro ao montar:', error); this._renderErrorUI('Falha ao inicializar modal de login', error); this.cleanup(); throw error; } }

  _emitReady() { const readyPayload = { module: COMPONENT_MODULE_ID, version: VERSION, timestamp: Date.now(), ttfbMs: performance.now(), status: this.getStatus() }; this.eventBus.emit(AUTH_EVENTS.READY, readyPayload); this.eventBus.emit(LIFECYCLE_EVENTS.READY, readyPayload); if (this.onReady && typeof this.onReady === 'function') { try { this.onReady(readyPayload); } catch (e) { _log('warn', 'Erro em onReady callback:', e); } } _log('info', 'Evento auth:ready emitido'); }

  _escapeHtml(str: string) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  _renderErrorUI(message: string, error: any) { if (!this.container) return; const safeMsg = this._escapeHtml(message); const errorDetails = error ? this._escapeHtml(error.stack || error.message) : ''; this.container.innerHTML = `<div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(239,68,68,0.95);color:white;padding:2rem;border-radius:8px;text-align:center;max-width:400px;z-index:10000;pointer-events:auto;"><h3 style="margin:0 0 1rem 0;">Erro no Login</h3><p style="margin:0 0 1rem 0;">${safeMsg}</p><button onclick="location.reload()" style="background:white;color:#DC2626;border:none;padding:0.5rem 1rem;border-radius:4px;cursor:pointer;font-weight:600;">Recarregar Página</button>${error ? `<details style="margin-top:1rem;text-align:left;font-size:0.875rem;"><summary style="cursor:pointer;">Detalhes técnicos</summary><pre style="margin-top:0.5rem;overflow:auto;">${errorDetails}</pre></details>` : ''}</div>`; }

  createContainer() { const existing = document.getElementById(MODAL_CONTAINER_ID); if (existing) existing.remove(); this.container = document.createElement('div'); this.container.id = MODAL_CONTAINER_ID; this.container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;'; let targetContainer = null; let source = 'none'; if (this.containerTarget) { if (typeof this.containerTarget === 'string') targetContainer = document.querySelector(this.containerTarget); else if (this.containerTarget instanceof HTMLElement) targetContainer = this.containerTarget; if (targetContainer) { source = 'config-injected'; _log('info', 'Container via config.container'); } } if (!targetContainer) { targetContainer = document.body; source = 'body-fallback'; _log('info', 'Container via document.body'); } targetContainer.appendChild(this.container); _log('info', `Container criado (source: ${source})`); }

  async injectTemplate() { const { getLoginModalTemplate } = await import('../template.js'); const template = getLoginModalTemplate(this.config); this.container.innerHTML = template; _log('info', 'Template injetado'); }

  queryElements() { const prefix = this.config.idPrefix || 'login'; this.modal = document.getElementById(`${prefix}-modal`); this.form = document.getElementById(`${prefix}-form`); this.usernameInput = document.getElementById(`${prefix}-email`); this.passwordInput = document.getElementById(`${prefix}-password`); this.submitButton = document.getElementById(`${prefix}-button`); this.errorElement = document.getElementById(`${prefix}-error`); this.toggleButton = document.getElementById('toggle-password'); this.video = document.getElementById(`${prefix}-video`); }

  validateElements() { const required = { modal: this.modal, form: this.form, username: this.usernameInput, password: this.passwordInput, button: this.submitButton }; const missing = Object.entries(required).filter(e => !e[1]).map(e => e[0]); if (missing.length > 0) { _log('error', 'Elementos faltando:', missing); return false; } return true; }

  async loadConfig() { if (this.config && Object.keys(this.config).length > 5) { _log('info', 'Config fornecida via construtor'); return; } try { const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 5000); const response = await fetch('/components/login-modal/config.json', { signal: controller.signal }); clearTimeout(timeoutId); const loadedConfig = await response.json(); this.config = Object.assign({}, loadedConfig, this.config); } catch (error) { _log('warn', 'Erro ao carregar config, usando defaults'); this.config = Object.assign({}, this.getDefaultConfig(), this.config); } }

  getDefaultConfig() { return { module: COMPONENT_MODULE_ID, version: VERSION, zIndex: 9999, idPrefix: 'login', security: { rateLimitAttempts: 5, rateLimitWindow: 300000, lockoutDuration: 900000, maxUsernameLength: 128, maxPasswordLength: 1024, secureMode: true }, api: { timeout: 10000, maxRetries: 1, endpoints: { login: '/api/auth/login.php', check: '/api/auth/check.php', logout: '/api/auth/logout.php' } }, video: { cleanupOnClose: true }, accessibility: { focusTrapEnabled: true, escapeToClose: true, escapeBlockedWhenBusy: true }, telemetry: { enabled: true }, debug: { enabled: false } }; }

  checkInitialState() { _log('info', 'Componente pronto, aguardando interação'); }

  async open(reason: string) { if (reason === undefined) reason = 'manual'; this._metrics.openCount++; this._metrics.lastOpenAt = Date.now(); return this.modalController.open(reason); }
  close(reason: string) { if (reason === undefined) reason = 'manual'; this._metrics.closeCount++; return this.modalController.close(reason); }

  async handleLogin(username: string, password: string) { this._metrics.loginAttemptCount++; this._metrics.lastLoginAt = Date.now(); try { const result = await this.loginHandler.handle(username, password); if (result && result.success) this._metrics.loginSuccessCount++; else this._metrics.loginFailCount++; return result; } catch (error) { this._metrics.loginFailCount++; throw error; } }

  async unmount() { if (this.destroyed) return; _log('info', 'Desmontando login modal'); if (this.store && this.store.isOpen()) this.close('unmount'); if (this.loginAbortController) { this.loginAbortController.abort(); this.loginAbortController = null; } const self = this; this._handlers.forEach((handler: any, eventName: string) => { self.eventBus.off(eventName, handler); }); this._handlers.clear(); this._cleanupFunctions.forEach((fn: () => void) => { try { fn(); } catch (e) { } }); this._cleanupFunctions = []; if (this.timers) this.timers.clearAll(); if (this.keyboardHandler) this.keyboardHandler.deactivate(); if (this.focusTrap) this.focusTrap.deactivate(); if (this.videoManager) this.videoManager.cleanup(); if (this.formComponent) this.formComponent.unmount(); if (this.togglePassword) this.togglePassword.unmount(); if (this.authAPI) this.authAPI.cancel(); if (this.store) this.store.reset(); if (this.router && typeof this.router.cleanup === 'function') this.router.cleanup(); if (this.container && this.container.parentNode) this.container.remove(); if (!this.eventBusExternal) this.eventBus.clear(); this.destroyed = true; this.mounted = false; _log('info', 'Login modal desmontado'); }

  cleanup() { try { if (this.container && this.container.parentNode) this.container.remove(); if (this.timers) this.timers.clearAll(); } catch (e) { _log('error', 'Erro no cleanup:', e); } }
  registerCleanup(fn: () => void) { if (typeof fn === 'function') this._cleanupFunctions.push(fn); }
  getVersion() { return VERSION; }
  isInitialized() { return this.mounted && !this.destroyed; }
  setDebug(enabled: boolean) { this._debug = !!enabled; if (this.logger && this.logger.setDebug) this.logger.setDebug(enabled); if (this.telemetry && this.telemetry.setDebug) this.telemetry.setDebug(enabled); }

  healthCheck() { const logger = _getPort('logger'); const checks = { mounted: this.mounted, notDestroyed: !this.destroyed, hasContainer: !!this.container, hasModal: !!this.modal, hasForm: !!this.form, hasStore: !!this.store, hasEventBus: !!this.eventBus, storeReady: this.store && this.store.getState && this.store.getState().status !== 'error', portsInitialized: Ports.isInitialized(), loggerAvailable: !!logger }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; let status = 'HEALTHY'; if (passed < total * 0.5) status = 'UNHEALTHY'; else if (passed < total) status = 'DEGRADED'; const issues = []; if (!checks.mounted) issues.push('Not mounted'); if (checks.notDestroyed === false) issues.push('Destroyed'); if (!checks.hasContainer) issues.push('No container'); if (!checks.hasModal) issues.push('No modal element'); if (!checks.hasForm) issues.push('No form element'); if (!checks.hasStore) issues.push('No store'); if (!checks.hasEventBus) issues.push('No EventBus'); if (!checks.storeReady) issues.push('Store in error state'); return { status, score: `${passed}/${total}`, checks, issues: issues.length > 0 ? issues : null, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

  info() { return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, destroyed: this.destroyed, isOpen: this.isOpen(), isBusy: this.isBusy(), metrics: this.getMetrics(), healthCheck: this.healthCheck(), portsInitialized: Ports.isInitialized(), config: { debug: this._debug, idPrefix: this.config ? this.config.idPrefix : undefined, routerMode: (this.config && this.config.routerMode) || 'memory', eventBusExternal: this.eventBusExternal }, subsystems: { store: !!this.store, authAPI: !!this.authAPI, rateLimiter: !!this.rateLimiter, focusTrap: !!this.focusTrap, videoManager: !!this.videoManager }, timestamp: Date.now() }; }

  getMetrics() { return Object.assign({}, this._metrics); }
  resetMetrics() { this._metrics = { mountCount: 0, openCount: 0, closeCount: 0, loginAttemptCount: 0, loginSuccessCount: 0, loginFailCount: 0, lastMountAt: null, lastOpenAt: null, lastLoginAt: null }; }
  isOpen() { return (this.store && this.store.isOpen()) || false; }
  isBusy() { return (this.store && this.store.isBusy()) || false; }
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, destroyed: this.destroyed, state: (this.store && this.store.getState()) || null, rateLimiter: (this.rateLimiter && this.rateLimiter.getStatus()) || null, handlers: this._handlers.size, eventBusExternal: this.eventBusExternal, router: (this.router && this.router.getCurrentRoute) ? this.router.getCurrentRoute() : null, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized() }; }
  getEventBus() { return this.eventBus; }
}

export function getVersion() { return VERSION; }
export function setDebug(enabled: boolean) { }
