// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-mfe
// PURPOSE: Login MFE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ./core/controller.js
//   from ./ui/component.js
//   from ./state/slice.js
//   from ./events/contracts.js
//   from ../../sdk/hooks.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   getMetadata
//   getCapabilities
//   info
//   isMounted
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { mountController, unmountController, initController, destroyController, getControllerState } from './core/controller.js';
import { renderUI, renderSkeleton, clearUI, setConfig } from './ui/component.js';
import { createSlice, getState, resetState } from './state/slice.js';
import { MFE_ACTIONS, emit, unsubscribeAll } from './events/contracts.js';
import { useCleanup, sleep } from '../../sdk/hooks.js';

export const VERSION = '3.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'login-mfe';

interface LoginMfeContext {
  config?: { app?: { environment?: string; version?: string } };
  eventBus?: { on?: (event: string, handler: (data: Record<string, unknown>) => void) => void; off?: (event: string, handler: (data: Record<string, unknown>) => void) => void; emit?: (event: string, payload: Record<string, unknown>) => void };
  router?: { navigate?: (path: string) => void };
  services?: Record<string, unknown>;
  platform?: { emit?: (event: string, payload: Record<string, unknown>) => void };
  stateEngine?: { createSlice?: (id: string, state: Record<string, unknown>, reducers: Record<string, unknown>) => unknown; dispatch?: (action: Record<string, unknown>) => void };
}

interface CleanupHooks {
  addListener: (el: HTMLElement, event: string, handler: (e: Event) => void) => void;
  add: (fn: () => void) => void;
  run: () => void;
  timeout: (fn: () => void, ms: number) => void;
}

let _context: LoginMfeContext | null = null;
let _container: HTMLElement | null = null;
let _mounted = false;
let _initialized = false;
let _hooks: CleanupHooks | null = null;

export async function init(context: LoginMfeContext = {}) {
  if (_initialized) return { version: VERSION, moduleId: MODULE_ID };
  _context = context;
  
  if (_context?.config?.app) {
    setConfig({
      environment: _context.config.app.environment || 'production',
      version: _context.config.app.version || VERSION
    });
  }
  
  createSlice(_context);
  initController(_context);
  _initialized = true;
  emit(MFE_ACTIONS.INIT, { moduleId: MODULE_ID }, _context);
  return { version: VERSION, moduleId: MODULE_ID };
}

export async function mount(container: HTMLElement, params: { brand?: { icon: string; title: string; subtitle: string }; message?: { title: string; text: string }; showEnvPill?: boolean; showVersion?: boolean; autoOpenModal?: boolean } = {}) {
  if (!container) throw new Error(`[${MODULE_ID}] Container required`);
  if (_mounted) await unmount();
  _container = container;
  _hooks = useCleanup();
  
  _container.innerHTML = renderSkeleton();
  // P3.6-FINAL: Usa sleep() do SDK em vez de setTimeout direto
  await sleep(100);
  const state = getState();
  if (state.isAuthenticated) {
    emit(MFE_ACTIONS.AUTH_SKIP, { reason: 'already-authenticated' }, _context);
    _container.innerHTML = '';
    return { skipped: true, reason: 'authenticated' };
  }
  _container.innerHTML = renderUI({ brand: params.brand, message: params.message, showEnvPill: params.showEnvPill !== false, showVersion: params.showVersion !== false });
  await mountController(_container, _context, params);
  _mounted = true;
  emit(MFE_ACTIONS.MOUNTED, { moduleId: MODULE_ID }, _context);
  
  if (params.autoOpenModal !== false) {
    // P3.6-FINAL: Usa hooks.timeout() em vez de setTimeout direto
    _hooks.timeout(() => { 
      if (_mounted) emit(MFE_ACTIONS.OPEN_MODAL, { source: 'auto' }, _context); 
    }, 400);
  }
  return { container: _container, moduleId: MODULE_ID };
}

export async function hydrate(state: Record<string, unknown> = {}) {
  if (!_mounted) return false;
  emit(MFE_ACTIONS.HYDRATE, { state }, _context);
  return true;
}

export async function update(params: { error?: string } = {}) {
  if (!_mounted || !_container) return false;
  if (params.error) {
    const errorEl = _container.querySelector('.login-error') as HTMLElement | null;
    if (errorEl) { errorEl.textContent = params.error; errorEl.style.display = 'flex'; }
  }
  emit(MFE_ACTIONS.UPDATE, { params }, _context);
  return true;
}

export async function unmount() {
  if (!_mounted) return true;
  if (_hooks) { _hooks.run(); _hooks = null; }
  await unmountController();
  if (_container) { clearUI(_container); _container = null; }
  _mounted = false;
  emit(MFE_ACTIONS.UNMOUNTED, { moduleId: MODULE_ID }, _context);
  return true;
}

export async function destroy() {
  if (_hooks) { _hooks.run(); _hooks = null; }
  await unmount();
  unsubscribeAll();
  resetState();
  destroyController();
  _context = null;
  _initialized = false;
  return true;
}

export function getMetadata() {
  return { id: MODULE_ID, name: 'Login Page', version: VERSION, routes: ['/login'], permissions: [] as string[], layout: 'minimal', region: 'main', fallback: null as string | null, type: 'page' };
}

export function getCapabilities() { return ['auth', 'modal', 'redirect']; }
export function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized, state: getState(), controller: getControllerState() }; }
export function isMounted() { return _mounted; }

export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
