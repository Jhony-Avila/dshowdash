
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v17.3.0-MODULAR)
// ═══════════════════════════════════════════════════════════════
// User Menu - Enterprise P0 AAA+ Modular Orchestrator
// @version 17.3.0-MODULAR
// @changelog v17.3.0-MODULAR: Modularização completa — ports, event-handlers, user-data, health
// @changelog v17.2.0-ES6 - Task 10.1 B14: var → const/let
// @changelog v17.1.0-HEALTH-FIX: Auto-init no mount, hardNavService fallback interno
'use strict';

// ── Core Infrastructure ─────────────────────────────────────
import { initPorts, getPort, loadCSS } from './core/ports.js';
export { injectPorts, getPorts } from './core/ports.js';

// ── Runtime Events ──────────────────────────────────────────
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';

// ── Core Modules ────────────────────────────────────────────
import { ACTION_CONFIG, emitUIAction } from './core/actions.js';
import { setupEventListeners, removeEventListeners, setupKeyboardShortcuts, setupTooltips } from './core/event-handlers.js';
import { initialFetch, setUser as setUserData, clearUser as clearUserData, handleLogout as handleLogoutOp } from './core/user-data.js';
import { componentHealthCheck, componentInfo } from './core/health.js';

// ── Sub-modules (event-handlers.js needs these for bound handlers) ──
import { handleKeydown, handleClickOutside, handleTriggerClick } from './core/event-handlers.js';

// ── Sub-modules ─────────────────────────────────────────────
import UserAPI from './api/fetch.js';
import { LifecycleManager } from './core/lifecycle.js';
import { StateStore } from './state/store.js';
import { Logger } from './telemetry/logger.js';
import { TelemetryTracker } from './telemetry/tracker.js';
import { createTriggerHTML, createDropdownHTML } from './ui/template.js';
import { updateUI, updateDropdownPosition } from './ui/renderer.js';
import { KeyboardShortcuts } from './accessibility/shortcuts.js';
import { ScreenReaderAnnouncer } from './accessibility/announce.js';
import { CircuitBreaker } from './core/circuit-breaker.js';
import { TooltipManager } from './ui/tooltips.js';

// ── Module Identity ─────────────────────────────────────────
export const VERSION = '17.3.0-MODULAR';
export const id = 'user-menu';
export const capabilities = {
  type: 'menu',
  reorderable: false,
  hideable: false,
  critical: true,
  rendersUI: true,
  accessibility: true,
  keyboardNavigation: true,
  circuitBreaker: true,
  tooltips: true
};

export const MODULE_ID = 'header/components/user-menu';

// ── CSS Auto-Load ───────────────────────────────────────────
loadCSS();

// ── Constructor ─────────────────────────────────────────────
export function UserMenuComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this.container = options.container;
  this.store = new StateStore({ user: null, isOpen: false, status: 'loading' });
  this.eventBus = null;
  this.lifecycle = new LifecycleManager(this);
  this.logger = null;
  this.telemetry = new TelemetryTracker();
  this.api = new (UserAPI as any)();
  this.element = null;
  this.dropdown = null;
  this.dropdownRoot = null;
  this._mounted = false;
  this._initialized = false;
  this.isDestroyed = false;
  this.unsubscribe = null;

  this.shortcuts = new KeyboardShortcuts();
  this.announcer = (new (ScreenReaderAnnouncer as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
  this.circuitBreaker = new CircuitBreaker({ failureThreshold: 3, timeout: 10000, resetTimeout: 30000 });
  this.tooltips = (new (TooltipManager as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ delay: 400 }));

  // Bound handlers — delegates to event-handlers.js
  // @ts-expect-error TS migration - TS2345
  this.boundHandleClickOutside = (e: Event) => handleClickOutside(this, e);
  // @ts-expect-error TS migration - TS2345
  this.boundHandleTriggerClick = (e: Event) => handleTriggerClick(this, e);
  this.boundUpdateDropdownPosition = () => this._updatePosition();
  // @ts-expect-error TS migration - TS2345
  this.boundHandleKeydown = (e: Event) => handleKeydown(this, e);

  this._metrics = {
    mountCount: 0,
    setUserCount: 0,
    fetchCount: 0,
    toggleCount: 0,
    keyboardNavigationCount: 0,
    announcementCount: 0,
    lastMountAt: null,
    lastSetUserAt: null
  };
}

// Static refs for modules that need them
UserMenuComponent._exportId = id;
UserMenuComponent._exportCapabilities = capabilities;

// ── Init ────────────────────────────────────────────────────
UserMenuComponent.prototype.init = function(ctx: Record<string,unknown>) {
  ctx = ctx || {};
  if (this._initialized) return this;
  this._ctx = ctx;
  this._initialized = true;
  return this;
};

// ── Mount ───────────────────────────────────────────────────
UserMenuComponent.prototype.mount = function(container: HTMLElement|null) {
  const self = this;
  if (this.isDestroyed || this._mounted) return Promise.resolve(this);

  if (!this._initialized) {
    this.init({});
  }

  this.container = container || this.container;

  initPorts();
  this.eventBus = getPort('eventBus');

  const cfg = getPort('config');
  this.logger = (new (Logger as unknown as { new(..._args: unknown[]): {[k:string]:Function} })({ prefix: '[UserMenu]', debug: cfg && cfg.app && cfg.app.debug }));

  return this.lifecycle.mount().then(() => {
    self.render();
    setupEventListeners(self);
    setupKeyboardShortcuts(self);
    setupTooltips(self);
    self._mounted = true;
    self._metrics.mountCount++;
    self._metrics.lastMountAt = Date.now();

    const eb = getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(COMPONENT_EVENTS.MOUNTED, {
        componentId: id,
        moduleId: MODULE_ID,
        version: VERSION,
        capabilities,
        timestamp: Date.now()
      });
    }

    return initialFetch(self);
  }).then(() => {
    self._log('info', `Mounted v${VERSION} com integração completa`);
    self._announce('Menu do usuário carregado');
    return self;
  });
};

// ── Render ──────────────────────────────────────────────────
UserMenuComponent.prototype.render = function() {
  const self = this;

  this.element = document.createElement('div');
  this.element.className = 'user-menu-component';
  this.element.dataset.status = 'loading';
  this.element.setAttribute('data-component-id', ACTION_CONFIG.id);
  this.element.innerHTML = createTriggerHTML();

  this.dropdown = document.createElement('div');
  this.dropdown.className = 'user-menu-dropdown-portal';
  this.dropdown.setAttribute('role', 'menu');
  this.dropdown.setAttribute('aria-hidden', 'true');
  this.dropdown.setAttribute('data-dropdown', MODULE_ID);
  this.dropdown.innerHTML = createDropdownHTML();

  if (this.container) {
    this.container.appendChild(this.element);
  }

  document.body.appendChild(this.dropdown);
  this._log('debug', 'Dropdown montado no body');

  this.unsubscribe = this.store.subscribe((state: Record<string,unknown>) => {
    if (!self.element || self.isDestroyed) return;
    updateUI(self.element, self.dropdown, state);
  });
};

// ── Position Update ─────────────────────────────────────────
UserMenuComponent.prototype._updatePosition = function() {
  updateDropdownPosition(this.element, this.dropdown);
};

// ── Logging Helper ──────────────────────────────────────────
UserMenuComponent.prototype._log = function(level: string, msg: string, data: Record<string,unknown>) {
  if (!this.logger) return;
  if (typeof this.logger[level] === 'function') {
    this.logger[level](msg, data);
  }
};

// ── Announcer Helper ────────────────────────────────────────
UserMenuComponent.prototype._announce = function(message: string) {
  if (this.announcer && message) {
    this.announcer.announce(message);
    this._metrics.announcementCount++;
  }
};

// ── User Data Operations (delegates to core/user-data.js) ───
UserMenuComponent.prototype.setUser = function(userData: Record<string,unknown>) {
  setUserData(this, userData);
};

UserMenuComponent.prototype.clearUser = function() {
  clearUserData(this);
};

// ── Toggle Menu ─────────────────────────────────────────────
UserMenuComponent.prototype.toggleMenu = function() {
  if (this.isDestroyed) return;

  this._metrics.toggleCount++;
  const currentState = this.store.getState();
  const newIsOpen = !currentState.isOpen;

  emitUIAction(newIsOpen ? 'open' : 'close', { toggleCount: this._metrics.toggleCount });
  this.store.setState({ isOpen: newIsOpen });

  if (newIsOpen) {
    this._announce('Menu do usuário aberto. Use as setas para navegar.');
    const firstItem = this.dropdown.querySelector('.dropdown-item');
    if (firstItem) {
      setTimeout(() => { firstItem.focus(); }, 100);
    }
  } else {
    this._announce('Menu do usuário fechado');
  }

  this._log('debug', 'Toggle menu:', newIsOpen ? 'open' : 'close');
};

// ── Logout (delegates to core/user-data.js) ─────────────────
UserMenuComponent.prototype.handleLogout = function() {
  return handleLogoutOp(this);
};

// ── Legacy Compat ───────────────────────────────────────────
UserMenuComponent.prototype.fetchUser = function() {
  this._log('warn', 'fetchUser() é legado - use setUser() para P0 compliance');
  return initialFetch(this);
};

// ── Unmount ─────────────────────────────────────────────────
UserMenuComponent.prototype.unmount = function() {
  const self = this;
  if (!this._mounted) return Promise.resolve(this);

  this.isDestroyed = true;

  return this.lifecycle.unmount().then(() => {
    removeEventListeners(self);

    if (self.unsubscribe) {
      self.unsubscribe();
      self.unsubscribe = null;
    }

    if (self.announcer) self.announcer.destroy();
    if (self.shortcuts) self.shortcuts.disable();
    if (self.store) self.store.reset();

    if (self.element) {
      self.element.remove();
      self.element = null;
    }
    if (self.dropdown) {
      self.dropdown.remove();
      self.dropdown = null;
    }

    self._mounted = false;

    const eb = getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(COMPONENT_EVENTS.UNMOUNTED, {
        componentId: id,
        moduleId: MODULE_ID,
        timestamp: Date.now()
      });
    }

    return self;
  });
};

// ── Health & Info (delegates to core/health.js) ─────────────
UserMenuComponent.prototype.healthCheck = function() {
  return componentHealthCheck(this);
};

UserMenuComponent.prototype.info = function() {
  return componentInfo(this);
};

// ── Accessors ───────────────────────────────────────────────
UserMenuComponent.prototype.isMounted = function() { return this._mounted; };
UserMenuComponent.prototype.getElement = function() { return this.element; };

UserMenuComponent.prototype.getCircuitBreakerState = function() {
  return this.circuitBreaker ? this.circuitBreaker.getState() : null;
};

UserMenuComponent.prototype.resetCircuitBreaker = function() {
  if (this.circuitBreaker) this.circuitBreaker.reset();
};

// ── Factory ─────────────────────────────────────────────────
export function createUserMenu(options: Record<string,unknown>) { return (new (UserMenuComponent as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options)); }
export default UserMenuComponent;
