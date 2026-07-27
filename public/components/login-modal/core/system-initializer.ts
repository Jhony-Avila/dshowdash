// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-FIX-STORE-IMPORT)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-system-initializer
// PURPOSE: System Initializer - Login Modal
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Logger from ../telemetry/logger.js
//   TelemetryTracker from ../telemetry/tracker.js
//   TimersManager from ../utils/timers.js
//   CSRFManager from ../api/csrf.js
//   AuthAPI from ../api/auth.js
//   DeviceIDManager from ../security/device-id.js
//   InputValidator from ../security/validator.js
//   RateLimiter from ../security/rate-limiter.js
//   FocusTrap from ../accessibility/focus-trap.js
//   AriaManager from ../accessibility/aria-manager.js
//   KeyboardHandler from ../accessibility/keyboard.js
//   ErrorDisplay from ../ui/error-display.js
//   TogglePassword from ../ui/toggle-password.js
//   FormComponent from ../ui/form.js
//   CapsLockDetector from ../ui/capslock-detector.js
//   ErrorHandler from ./error-handler.js
//   VideoManager from ./video-manager.js
//   SecurityCSRF from /components/security/csrf-token-manager/index.js
//   LoginModalStore from ../state/store.js
//
// PROVIDES:
//   info() — exported function
//   healthCheck() — exported function
//   SystemInitializer — exported class
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

import { Logger } from '../telemetry/logger.js';
import { TelemetryTracker } from '../telemetry/tracker.js';
import { TimersManager } from '../utils/timers.js';
import { CSRFManager } from '../api/csrf.js';
import { AuthAPI } from '../api/auth.js';
import { DeviceIDManager } from '../security/device-id.js';
import { InputValidator } from '../security/validator.js';
import { RateLimiter } from '../security/rate-limiter.js';
import { FocusTrap } from '../accessibility/focus-trap.js';
import { AriaManager } from '../accessibility/aria-manager.js';
import { KeyboardHandler } from '../accessibility/keyboard.js';
import { ErrorDisplay } from '../ui/error-display.js';
import { TogglePassword } from '../ui/toggle-password.js';
import { FormComponent } from '../ui/form.js';
import { CapsLockDetector } from '../ui/capslock-detector.js';
import { ErrorHandler } from './error-handler.js';
import { VideoManager } from './video-manager.js';
import { SecurityCSRF } from '/components/security/csrf-token-manager/index.js';
import { LoginModalStore } from '../state/store.js';

const MODULE_ID = 'login-system-initializer';
const VERSION = '6.1.0-FIX-STORE-IMPORT';
const isBrowser = typeof document !== 'undefined' && typeof window !== 'undefined';

// Local constants (previously from events-contracts.js)
const CONTRACTS_MODULE_ID = 'login-modal-contracts';
const COMPONENT_MODULE_ID = 'login-modal';

export class SystemInitializer {
  [key: string]: any;
  constructor(modal: Record<string, any>) { this.modal = modal; this._stateUnsubscribers = []; this._initialized = { core: false, api: false, accessibility: false, ui: false, managers: false, css: false, events: false }; }

  initCoreSystems() {
    let config = this.modal.config;
    let eventBus = this.modal.eventBus;
    this.modal.logger = new (Logger as any)({ logLevel: config.debug && config.debug.logLevel ? config.debug.logLevel : 'info', silent: config.debug && config.debug.silent ? config.debug.silent : false });
    this.modal.telemetry = new (TelemetryTracker as any)(config, { logger: this.modal.logger, eventBus: eventBus });
    // @ts-expect-error strict migration — TS2683
    this.modal.timers = new (TimersManager as any)({ namespace: CONTRACTS_MODULE_ID, telemetry: function(event: string, detail: Record<string, unknown>) { if (this.modal.telemetry && this.modal.telemetry.emit) this.modal.telemetry.emit(event, detail); }.bind(this) });
    this.modal.store = new (LoginModalStore as any)({ debug: !!(config.debug && config.debug.enabled), persistCriticalStates: false });
    this._initialized.core = true;
    if (this.modal.logger && this.modal.logger.info) this.modal.logger.info('Core systems inicializados');
  }

  initAPISecurity() {
    let config = this.modal.config;
    let telemetry = this.modal.telemetry;
    const eventBus = this.modal.eventBus;
    if (SecurityCSRF && SecurityCSRF.init) SecurityCSRF.init(config, { eventBus: eventBus });
    this.modal.csrfManager = new (CSRFManager as any)(config);
    this.modal.deviceIDManager = new (DeviceIDManager as any)(config);
    this.modal.authAPI = new (AuthAPI as any)(config, { csrfManager: this.modal.csrfManager, deviceIDManager: this.modal.deviceIDManager, telemetry: telemetry });
    this.modal.validator = new (InputValidator as any)(config);
    this.modal.rateLimiter = new (RateLimiter as any)(config, { telemetry: telemetry });
    this.modal.securityCSRF = SecurityCSRF;
    this._initialized.api = true;
    if (this.modal.logger && this.modal.logger.info) this.modal.logger.info('API & Security inicializados');
  }

  initAccessibility() {
    const modal = this.modal.modal;
    let config = this.modal.config;
    let logger = this.modal.logger;
    let telemetry = this.modal.telemetry;
    this.modal.focusTrap = new (FocusTrap as any)(modal, { accessibility: config.accessibility, telemetry: telemetry });
    this.modal.ariaManager = new (AriaManager as any)(modal, config, { logger: logger, telemetry: function(event: string, detail: Record<string, unknown>) { if (telemetry && telemetry.emit) telemetry.emit(event, detail); } });
    this.modal.keyboardHandler = new (KeyboardHandler as any)(config, { logger: logger, telemetry: telemetry });
    this._initialized.accessibility = true;
    if (logger && logger.info) logger.info('Accessibility inicializado');
  }

  initUIComponents() {
    const errorElement = this.modal.errorElement;
    const passwordInput = this.modal.passwordInput;
    const toggleButton = this.modal.toggleButton;
    const form = this.modal.form;
    let config = this.modal.config;
    let logger = this.modal.logger;
    const ariaManager = this.modal.ariaManager;
    const timers = this.modal.timers;
    const telemetry = this.modal.telemetry;
    this.modal.errorDisplay = new (ErrorDisplay as any)(errorElement, ariaManager, timers, { telemetry: function(event: string, detail: Record<string, unknown>) { if (telemetry && telemetry.emit) telemetry.emit(event, detail); } });
    this.modal.togglePassword = new (TogglePassword as any)(passwordInput, toggleButton, config, { logger: logger, telemetry: function(event: string, detail: Record<string, unknown>) { if (telemetry && telemetry.emit) telemetry.emit(event, detail); } });
    this.modal.formComponent = new (FormComponent as any)(form, config, { ariaManager: ariaManager, logger: logger });
    let capsLockWarning = null;
    if (this.modal.modal && this.modal.modal.querySelector) {
      capsLockWarning = this.modal.modal.querySelector('[data-testid="capslock-warning"]') || this.modal.modal.querySelector('#login-capslock');
    }
    if (passwordInput && capsLockWarning) {
      this.modal.capsLockDetector = new (CapsLockDetector as any)(passwordInput, capsLockWarning, { logger: logger, telemetry: function(event: string, detail: Record<string, unknown>) { if (telemetry && telemetry.emit) telemetry.emit(event, detail); } });
    }
    this._initialized.ui = true;
    if (logger && logger.info) logger.info('UI Components inicializados');
  }

  initCoreManagers() {
    const video = this.modal.video;
    const config = this.modal.config;
    let logger = this.modal.logger;
    this.modal.errorHandler = new (ErrorHandler as any)({ logger: logger, security: config.security, debug: !!(config.debug && config.debug.enabled) });
    this.modal.videoManager = new (VideoManager as any)(video, { video: config.video, logger: logger });
    this._initialized.managers = true;
    if (logger && logger.info) logger.info('Core Managers inicializados');
  }

  loadCSS() {
    if (!isBrowser) return;
    let logger = this.modal.logger;
    if (document.querySelector('link[href*="' + COMPONENT_MODULE_ID + '/styles.css"]')) { this._initialized.css = true; return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/components/' + COMPONENT_MODULE_ID + '/styles.css';
    link.setAttribute('data-module', COMPONENT_MODULE_ID);
    document.head.appendChild(link);
    this._initialized.css = true;
    if (logger && logger.info) logger.info('CSS carregado');
  }

  setupEventListeners() {
    const formComponent = this.modal.formComponent;
    const togglePassword = this.modal.togglePassword;
    const keyboardHandler = this.modal.keyboardHandler;
    const videoManager = this.modal.videoManager;
    const capsLockDetector = this.modal.capsLockDetector;
    const store = this.modal.store;
    const logger = this.modal.logger;
    const loginHandler = this.modal.loginHandler;
    const modalController = this.modal.modalController;
    const self = this;

    if (formComponent && formComponent.mount) {
      formComponent.mount(function(username: string, password: string) {
        if (loginHandler && loginHandler.handle) loginHandler.handle(username, password);
      });
    }
    if (togglePassword && togglePassword.mount) togglePassword.mount();
    if (capsLockDetector && capsLockDetector.mount) capsLockDetector.mount();
    if (keyboardHandler && keyboardHandler.activate) {
      keyboardHandler.activate({
        Escape: function() {
          if (!(self.modal.store && self.modal.store.isBusy && self.modal.store.isBusy())) {
            if (modalController && modalController.close) modalController.close('escape');
          }
        }
      });
    }
    if (videoManager && videoManager.mount) videoManager.mount();

    if (store && store.subscribe) {
      const stateHandler = function(change: Record<string, any>) {
        if (change.to === 'BUSY' && keyboardHandler && keyboardHandler.setBusy) keyboardHandler.setBusy(true);
        else if ((change.to === 'OPEN' || change.to === 'ERROR') && keyboardHandler && keyboardHandler.setBusy) keyboardHandler.setBusy(false);
      };
      const unsubscribe = store.subscribe(stateHandler);
      self._stateUnsubscribers.push(unsubscribe);
    }

    if (modalController && modalController.setupLoginRequiredListener) modalController.setupLoginRequiredListener();
    this._initialized.events = true;
    if (logger && logger.info) logger.info('Event listeners configurados');
  }

  cleanup() {
    this._stateUnsubscribers.forEach(function(unsubscribe: () => void) { if (typeof unsubscribe === 'function') unsubscribe(); });
    this._stateUnsubscribers = [];
    if (this.modal.capsLockDetector && this.modal.capsLockDetector.unmount) this.modal.capsLockDetector.unmount();
    if (this.modal.modalController && this.modal.modalController.cleanup) this.modal.modalController.cleanup();
  }

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      hasModal: !!this.modal,
      initialized: Object.assign({}, this._initialized),
      stateUnsubscribersCount: this._stateUnsubscribers.length,
      hasCapsLockDetector: !!(this.modal.capsLockDetector),
      timestamp: Date.now()
    };
  }

  healthCheck() {
    let checks = {
      hasModal: !!this.modal,
      coreInitialized: this._initialized.core,
      apiInitialized: this._initialized.api,
      accessibilityInitialized: this._initialized.accessibility,
      uiInitialized: this._initialized.ui,
      managersInitialized: this._initialized.managers
    };
    let passed = Object.values(checks).filter(Boolean).length;
    return {
      status: passed === 6 ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'),
      score: passed + '/6',
      checks: checks,
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
export function healthCheck() {
  const checks = { moduleLoaded: true, classAvailable: typeof SystemInitializer === 'function' };
  let passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: passed + '/2', checks: checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export { VERSION, MODULE_ID };
export default SystemInitializer;
