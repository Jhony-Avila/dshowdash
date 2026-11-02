// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logout-mfe
// PURPOSE: Logout MFE
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
const MODULE_ID = 'logout-mfe';
interface MfeContext {
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
    _container.innerHTML = '<div class="logout-page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;padding:2rem;"><div style="font-size:4rem;margin-bottom:1rem;">👋</div><h1 style="color:rgba(255,255,255,0.9);font-size:1.75rem;margin:0 0 0.5rem 0;">Saindo...</h1><p style="color:rgba(255,255,255,0.5);margin:0 0 1.5rem 0;">Encerrando sua sessão de forma segura.</p><div style="width:200px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;"><div style="width:100%;height:100%;background:linear-gradient(90deg,rgba(99,102,241,0.8),rgba(139,92,246,0.8));animation:logout-progress 2s ease-in-out;"></div></div></div><style>@keyframes logout-progress{from{transform:translateX(-100%)}to{transform:translateX(0)}}</style>';
    _performLogout();
    _mounted = true;
    return { container: _container, moduleId: MODULE_ID };
  });
}

function _performLogout() {
  _hooks!.timeout(() => {
    if (_context && _context.platform && _context.platform.emit) {
      _context.platform.emit(MF_EVENTS.ROUTE_CHANGE_REQUESTED, { route: '/login', source: MODULE_ID });
    }
  }, 2000);
}

function hydrate() { return Promise.resolve(true); }
function update() { return Promise.resolve(true); }
function unmount() { if (_hooks) { _hooks.run(); _hooks = null; } if (_container) _container.innerHTML = ''; _container = null; _mounted = false; return Promise.resolve(true); }
function destroy() { return unmount().then(() => { _context = null; _initialized = false; return true; }); }
function getMetadata() { return { id: MODULE_ID, name: 'Logout', version: VERSION, routes: ['/logout'], permissions: [] as string[], layout: 'minimal', region: 'main', type: 'page' }; }
function getCapabilities() { return ['logout']; }
function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized }; }
function isMounted() { return _mounted; }

export { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
