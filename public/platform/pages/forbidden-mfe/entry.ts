// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: forbidden-mfe
// PURPOSE: Forbidden MFE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../../sdk/hooks.js
//   from /core/runtime/events/index.js
//
// PROVIDES:
//   init
//   mount
//   hydrate
//   update
//   unmount
//   destroy
//   getMetadata
//   getCapabilities
//   info
//   isMounted
//   VERSION
//   MODULE_ID
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';
import { useCleanup } from '../../sdk/hooks.js';
import { MF_EVENTS } from '/core/runtime/events/catalog/mf.events.js';

const VERSION = '3.5.0-P2-ENTERPRISE';
const MODULE_ID = 'forbidden-mfe';
interface MfeContext {
  router?: { back?: () => void };
  platform?: { emit?: (event: string, payload: Record<string, unknown>) => void };
}

interface CleanupHooks {
  addListener: (el: HTMLElement, event: string, handler: (e: Event) => void) => void;
  run: () => void;
  timeout: (fn: () => void, ms: number) => void;
}

let _context: MfeContext | null = null, _container: HTMLElement | null = null, _mounted = false, _initialized = false, _hooks: CleanupHooks | null = null;

function init(context: MfeContext) { if (!context) context = {}; if (_initialized) return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); _context = context; _initialized = true; return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); }

function mount(container: HTMLElement, params: Record<string, unknown>) {
  if (!container) return Promise.reject(new Error(`[${MODULE_ID}] Container required`));
  return Promise.resolve().then(() => { if (_mounted) return unmount(); }).then(() => {
    _container = container; _hooks = useCleanup();
    _container.innerHTML = '<div class="error-page forbidden-page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;padding:2rem;"><div style="font-size:4rem;margin-bottom:1rem;">🚫</div><h1 style="color:rgba(255,255,255,0.9);font-size:1.75rem;margin:0 0 0.5rem 0;">Acesso Negado</h1><p style="color:rgba(255,255,255,0.5);margin:0 0 1.5rem 0;">Você não tem permissão para acessar esta página.</p><div style="display:flex;gap:1rem;"><button data-action="go-home" style="padding:0.6rem 1.2rem;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:rgba(255,255,255,0.8);cursor:pointer;">Ir para o Início</button><button data-action="go-back" style="padding:0.6rem 1.2rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:rgba(255,255,255,0.6);cursor:pointer;">Voltar</button></div></div>';
    _setupListeners();
    _mounted = true;
    return { container: _container, moduleId: MODULE_ID };
  });
}

function _setupListeners() {
  const handler = (e: Event) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    e.preventDefault();
    if (target.dataset.action === 'go-home') _emitRouteRequest('/');
    else if (target.dataset.action === 'go-back') { if (_context && _context.router && _context.router.back) _context.router.back(); else _emitRouteRequest('/'); }
  };
  // @ts-expect-error strict migration — TS2345
  _hooks!.addListener(_container, 'click', handler);
}

function _emitRouteRequest(route: string) { if (_context && _context.platform && _context.platform.emit) _context.platform.emit(MF_EVENTS.ROUTE_CHANGE_REQUESTED, { route, source: MODULE_ID }); }

function hydrate() { return Promise.resolve(true); }
function update() { return Promise.resolve(true); }
function unmount() { if (_hooks) { _hooks.run(); _hooks = null; } if (_container) _container.innerHTML = ''; _container = null; _mounted = false; return Promise.resolve(true); }
function destroy() { return unmount().then(() => { _context = null; _initialized = false; return true; }); }
function getMetadata() { return { id: MODULE_ID, name: '403 Forbidden', version: VERSION, routes: ['/forbidden', '/403'], permissions: [] as string[], layout: 'minimal', region: 'main', type: 'page' }; }
function getCapabilities() { return ['error-display']; }
function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized }; }
function isMounted() { return _mounted; }

export { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
