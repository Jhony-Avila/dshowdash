// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-mfe/controller
// PURPOSE: Login MFE Controller - Business Logic
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//   from ../events/contracts.js
//   from ../state/slice.js
//   from ../../../sdk/hooks.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   initController
//   mountController
//   unmountController
//   destroyController
//   getControllerState
//   default
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { MFE_ACTIONS, emit } from '../events/contracts.js';
import { updateState } from '../state/slice.js';
import { useCleanup } from '../../../sdk/hooks.js';

export const VERSION = '3.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'login-mfe/controller';

interface ControllerContext {
  eventBus?: { on?: (event: string, handler: (data: Record<string, unknown>) => void) => void; off?: (event: string, handler: (data: Record<string, unknown>) => void) => void; emit?: (event: string, payload: Record<string, unknown>) => void };
  router?: { navigate?: (path: string) => void };
  services?: { loginModal?: { show?: (id: string) => void }; toast?: { show?: (msg: string, type: string) => void }; external?: { open?: (url: string) => void } };
  platform?: { emit?: (event: string, payload: Record<string, unknown>) => void; openExternal?: (url: string) => void };
}

interface CleanupHooks {
  addListener: (el: HTMLElement, event: string, handler: (e: Event) => void) => void;
  add: (fn: () => void) => void;
  run: () => void;
  timeout: (fn: () => void, ms: number) => void;
}

let _context: ControllerContext | null = null;
let _container: HTMLElement | null = null;
let _hooks: CleanupHooks | null = null;
let _metrics = { mountCount: 0, loginAttempts: 0, errors: 0 };

export function initController(context: ControllerContext) { _context = context; }

export function mountController(container: HTMLElement, context: ControllerContext | null, params: Record<string, unknown> = {}) {
  _container = container;
  _context = context;
  _hooks = useCleanup();
  _metrics.mountCount++;
  _setupEventListeners();
  _setupAuthListeners();
  return Promise.resolve();
}

function _setupEventListeners() {
  if (!_container) return;
  const handler = (e: Event) => {
    const btn = (e.target as HTMLElement).closest('[data-action="open-login"]');
    if (btn) { e.preventDefault(); _metrics.loginAttempts++; _openLoginModal('button'); }
    const forgotLink = (e.target as HTMLElement).closest('[data-action="forgot-password"]');
    if (forgotLink) { e.preventDefault(); _handleForgotPassword(); }
    const supportLink = (e.target as HTMLElement).closest('[data-action="support"]');
    if (supportLink) { e.preventDefault(); _handleSupport(); }
  };
  _hooks!.addListener(_container, 'click', handler);
}

function _setupAuthListeners() {
  if (_context && _context.eventBus && _context.eventBus.on) {
    const successHandler = (data: Record<string, unknown>) => { _handleAuthSuccess(data as { redirectTo?: string }); };
    const failureHandler = (data: Record<string, unknown>) => { _handleAuthFailure(data as { error?: string; message?: string }); };
    _context.eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, successHandler);
    _context.eventBus.on(AUTH_EVENTS.LOGIN_FAILURE, failureHandler);
    // @ts-expect-error strict migration — TS2532
    _hooks!.add(() => { if (_context!.eventBus.off) _context!.eventBus.off(AUTH_EVENTS.LOGIN_SUCCESS, successHandler); });
    // @ts-expect-error strict migration — TS2532
    _hooks!.add(() => { if (_context!.eventBus.off) _context!.eventBus.off(AUTH_EVENTS.LOGIN_FAILURE, failureHandler); });
  }
}

function _openLoginModal(source = 'button') {
  emit(MFE_ACTIONS.OPEN_MODAL, { source }, _context);
  if (_context && _context.services && _context.services.loginModal && _context.services.loginModal.show) { _context.services.loginModal.show(MODULE_ID); }
}

function _handleAuthSuccess(data: { redirectTo?: string } = {}) {
  updateState({ isAuthenticated: true });
  emit(MFE_ACTIONS.AUTH_SUCCESS, { redirectTo: data.redirectTo || '/' }, _context);
  if (_context && _context.router && _context.router.navigate) { _context.router.navigate(data.redirectTo || '/'); }
}

function _handleAuthFailure(data: { error?: string; message?: string } = {}) {
  _metrics.errors++;
  updateState({ error: data.message || 'Falha na autenticação' });
  emit(MFE_ACTIONS.AUTH_FAILURE, { error: data.error }, _context);
  _showError(data.message || 'Falha na autenticação. Verifique suas credenciais.');
}

function _showError(message: string) { const errorEl = _container ? _container.querySelector('.login-error') as HTMLElement | null : null; if (errorEl) { errorEl.innerHTML = '<span>⚠️</span><span data-error-msg></span>'; const msgSpan = errorEl.querySelector('[data-error-msg]'); if (msgSpan) msgSpan.textContent = message; errorEl.style.display = 'flex'; } }

function _handleForgotPassword() {
  emit(MFE_ACTIONS.FORGOT_PASSWORD, {}, _context);
  if (_context && _context.services && _context.services.toast && _context.services.toast.show) { _context.services.toast.show('Entre em contato com o administrador para recuperar sua senha.', 'info'); }
}

function _handleSupport() {
  emit(MFE_ACTIONS.SUPPORT, {}, _context);
  if (_context && _context.platform && _context.platform.openExternal) { _context.platform.openExternal('mailto:suporte@dshow.com.br?subject=Suporte DshowDash'); }
  else if (_context && _context.services && _context.services.external && _context.services.external.open) { _context.services.external.open('mailto:suporte@dshow.com.br?subject=Suporte DshowDash'); }
}

export function unmountController() { if (_hooks) { _hooks.run(); _hooks = null; } _container = null; return Promise.resolve(); }
export function destroyController() { if (_hooks) { _hooks.run(); _hooks = null; } _context = null; _metrics = { mountCount: 0, loginAttempts: 0, errors: 0 }; }
export function getControllerState() { return { mounted: !!_container, metrics: Object.assign({}, _metrics) }; }

export default { initController, mountController, unmountController, destroyController, getControllerState, VERSION, MODULE_ID };
