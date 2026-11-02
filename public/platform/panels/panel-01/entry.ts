// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01
// PURPOSE: Panel
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

type CleanupHooks = ReturnType<typeof useCleanup>;

interface PlatformContext extends Record<string, unknown> {
  platform?: {
    emit?: (event: string, data: Record<string, unknown>) => void;
  };
}

const VERSION = '4.3.0-P2-ENTERPRISE';
const MODULE_ID = 'panel-01';

let _context: PlatformContext | null = null, _container: HTMLElement | null = null, _mounted = false, _initialized = false;
let _hooks: CleanupHooks | null = null;

function init(context: PlatformContext): Promise<{ version: string; moduleId: string }> {
  if (!context) context = {};
  if (_initialized) return Promise.resolve({ version: VERSION, moduleId: MODULE_ID });
  _context = context;
  _initialized = true;
  return Promise.resolve({ version: VERSION, moduleId: MODULE_ID });
}

function mount(container: HTMLElement, params: Record<string, unknown>): Promise<{ container: HTMLElement; moduleId: string } | never> {
  if (!params) params = {};
  if (!container) return Promise.reject(new Error(`[${MODULE_ID}] Container required`));
  return Promise.resolve().then(() => {
    if (_mounted) return unmount();
  }).then(() => {
    _container = container;
    _hooks = useCleanup();
    _container.innerHTML = `<div class="federated-panel" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:400px;padding:2rem;background:linear-gradient(135deg,rgba(99,102,241,0.08) 0%,rgba(139,92,246,0.08) 100%);border-radius:16px;border:1px solid rgba(139,92,246,0.2);"><div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(139,92,246,0.4));display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;"><span style="font-size:2rem;">📦</span></div><h2 style="color:rgba(255,255,255,0.9);font-size:1.5rem;margin:0 0 0.5rem 0;">Panel 01</h2><p style="color:rgba(255,255,255,0.5);font-size:0.95rem;margin:0 0 1rem 0;">Dashboard Principal</p><div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;"><span style="padding:0.4rem 0.8rem;background:rgba(99,102,241,0.15);border-radius:9999px;font-size:0.8rem;color:rgba(139,92,246,0.9);border:1px solid rgba(139,92,246,0.2);">v${VERSION}</span><span style="padding:0.4rem 0.8rem;background:rgba(245,158,11,0.1);border-radius:9999px;font-size:0.8rem;color:rgba(245,158,11,0.9);border:1px solid rgba(245,158,11,0.2);">Federation Ready</span></div><div style="margin-top:1.5rem;"><button class="federated-btn" data-action="go-home" style="padding:0.6rem 1.2rem;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:rgba(255,255,255,0.8);cursor:pointer;font-size:0.9rem;">← Voltar ao Início</button></div></div>`;
    _setupListeners();
    _mounted = true;
    return { container: _container, moduleId: MODULE_ID };
  });
}

function _setupListeners(): void {
  const handler = (e: Event): void => {
    if ((e.target as HTMLElement).closest('[data-action="go-home"]')) {
      e.preventDefault();
      if (_context && _context.platform && _context.platform.emit) {
        _context.platform.emit(MF_EVENTS.ROUTE_CHANGE_REQUESTED, { route: '/', source: MODULE_ID });
      }
    }
  };
  _hooks!.addListener(_container, 'click', handler);
}

function hydrate(state: Record<string, unknown>): Promise<boolean> { return Promise.resolve(true); }
function update(params: Record<string, unknown>): Promise<boolean> { return Promise.resolve(true); }

function unmount(): Promise<boolean> {
  if (_hooks) { _hooks.run(); _hooks = null; }
  if (_container) _container.innerHTML = '';
  _container = null;
  _mounted = false;
  return Promise.resolve(true);
}

function destroy(): Promise<boolean> {
  return unmount().then(() => {
    _context = null;
    _initialized = false;
    return true;
  });
}

function getMetadata() { return { id: MODULE_ID, name: 'Panel 01', version: VERSION, type: 'panel', status: 'placeholder' }; }
function getCapabilities() { return ['view']; }
function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized, status: 'placeholder' }; }
function isMounted() { return _mounted; }

export { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
