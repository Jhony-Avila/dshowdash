// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: maintenance-mfe
// PURPOSE: Maintenance MFE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from ../../sdk/hooks.js
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

const VERSION = '3.7.0-P2-ENTERPRISE';
const MODULE_ID = 'maintenance-mfe';
interface CleanupHooks {
  addListener: (el: HTMLElement, event: string, handler: (e: Event) => void) => void;
  run: () => void;
  timeout: (fn: () => void, ms: number) => void;
}

let _context: Record<string, unknown> | null = null, _container: HTMLElement | null = null, _mounted = false, _initialized = false, _hooks: CleanupHooks | null = null;

function init(context: Record<string, unknown>) { if (!context) context = {}; if (_initialized) return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); _context = context; _initialized = true; return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); }

function mount(container: HTMLElement, params: Record<string, unknown>) {
  if (!container) return Promise.reject(new Error(`[${MODULE_ID}] Container required`));
  return Promise.resolve().then(() => { if (_mounted) return unmount(); }).then(() => {
    _container = container; _hooks = useCleanup();
    _container.innerHTML = '<div class="maintenance-page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;padding:2rem;"><div style="font-size:4rem;margin-bottom:1rem;">🔧</div><h1 style="color:rgba(255,255,255,0.9);font-size:1.75rem;margin:0 0 0.5rem 0;">Em Manutenção</h1><p style="color:rgba(255,255,255,0.5);margin:0 0 1.5rem 0;text-align:center;">Estamos realizando melhorias no sistema.<br>Por favor, tente novamente em alguns minutos.</p><button data-action="refresh" style="padding:0.6rem 1.2rem;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:rgba(255,255,255,0.8);cursor:pointer;">Tentar Novamente</button></div>';
    _setupListeners();
    _mounted = true;
    return { container: _container, moduleId: MODULE_ID };
  });
}

function _setupListeners() {
  const handler = (e: Event) => {
    if ((e.target as HTMLElement).closest('[data-action="refresh"]')) { e.preventDefault(); window.location.reload(); }
  };
  // @ts-expect-error strict migration — TS2345
  _hooks!.addListener(_container, 'click', handler);
}

function hydrate() { return Promise.resolve(true); }
function update() { return Promise.resolve(true); }
function unmount() { if (_hooks) { _hooks.run(); _hooks = null; } if (_container) _container.innerHTML = ''; _container = null; _mounted = false; return Promise.resolve(true); }
function destroy() { return unmount().then(() => { _context = null; _initialized = false; return true; }); }
function getMetadata() { return { id: MODULE_ID, name: 'Maintenance', version: VERSION, routes: ['/maintenance'], permissions: [] as string[], layout: 'minimal', region: 'main', type: 'page' }; }
function getCapabilities() { return ['maintenance-display']; }
function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized }; }
function isMounted() { return _mounted; }

export { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
