// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: dashboard-mfe
// PURPOSE: Dashboard Principal MFE
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
import { MF_EVENTS, createMfEvent } from '/core/runtime/events/catalog/mf.events.js';

const VERSION = '4.3.0-P2-ENTERPRISE';
const MODULE_ID = 'dashboard-mfe';
const DOMAIN_NAME = 'Dashboard Principal';
const DOMAIN_ROUTES = ['/', '/geral', '/dashboard', '/home', '/principal'];

type MfeContext = Record<string, unknown> & { platform?: { emit?: (event: unknown, data: Record<string, unknown>) => void } };
type CleanupHook = ReturnType<typeof useCleanup>;
let _context: MfeContext | null = null, _container: HTMLElement | null = null, _mounted = false, _initialized = false, _hooks: CleanupHook | null = null;

function init(context: MfeContext): Promise<{ version: string; moduleId: string }> { if (!context) context = {}; if (_initialized) return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); _context = context; _initialized = true; _emit(createMfEvent('dashboard', 'init'), { moduleId: MODULE_ID }); return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); }

function mount(container: HTMLElement, params?: Record<string, unknown>): Promise<unknown> {
  if (!container) return Promise.reject(new Error(`[${MODULE_ID}] Container required`));
  return Promise.resolve().then(() => { if (_mounted) return unmount(); }).then(() => {
    _container = container; _hooks = useCleanup();
    const routesHtml = DOMAIN_ROUTES.map((r: string) => `<code style="padding:0.25rem 0.5rem;background:rgba(255,255,255,0.05);border-radius:4px;font-size:0.8rem;color:rgba(255,255,255,0.6);">${r}</code>`).join('');
    _container.innerHTML = `<div class="domain-mfe" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:450px;padding:2rem;background:linear-gradient(135deg,rgba(34,197,94,0.08) 0%,rgba(16,185,129,0.08) 100%);border-radius:16px;border:1px solid rgba(34,197,94,0.2);"><div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,rgba(34,197,94,0.3),rgba(16,185,129,0.4));display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;"><span style="font-size:2.5rem;">🏢</span></div><h2 style="color:rgba(255,255,255,0.95);font-size:1.75rem;margin:0 0 0.5rem 0;">${DOMAIN_NAME}</h2><p style="color:rgba(255,255,255,0.5);font-size:1rem;margin:0 0 1.5rem 0;">Domain MFE Enterprise</p><div style="display:flex;gap:0.75rem;flex-wrap:wrap;justify-content:center;margin-bottom:1.5rem;"><span style="padding:0.4rem 0.8rem;background:rgba(34,197,94,0.15);border-radius:9999px;font-size:0.8rem;color:rgba(34,197,94,0.9);border:1px solid rgba(34,197,94,0.2);">v${VERSION}</span><span style="padding:0.4rem 0.8rem;background:rgba(59,130,246,0.1);border-radius:9999px;font-size:0.8rem;color:rgba(59,130,246,0.9);border:1px solid rgba(59,130,246,0.2);">Domain Ready</span></div><div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:1rem 1.5rem;border:1px solid rgba(255,255,255,0.05);max-width:400px;width:100%;"><h4 style="color:rgba(255,255,255,0.7);font-size:0.85rem;margin:0 0 0.75rem 0;">Rotas:</h4><div style="display:flex;flex-wrap:wrap;gap:0.5rem;">${routesHtml}</div></div></div>`;
    _setupListeners();
    _mounted = true;
    _emit(createMfEvent('dashboard', 'mounted'), { moduleId: MODULE_ID });
    return { container: _container, moduleId: MODULE_ID };
  });
}

function _setupListeners(): void {
  const handler = (e: Event) => {
    if ((e.target as Element | null)?.closest('[data-action="go-home"]')) {
      e.preventDefault();
      if (_context && _context.platform && _context.platform.emit) _context.platform.emit(MF_EVENTS.ROUTE_CHANGE_REQUESTED, { route: '/', source: MODULE_ID });
    }
  };
  _hooks!.addListener(_container, 'click', handler);
}

function _emit(event: unknown, data: Record<string, unknown>): void { if (_context && _context.platform && _context.platform.emit) _context.platform.emit(event, Object.assign({}, data, { timestamp: Date.now() })); }

function hydrate() { return Promise.resolve(true); }
function update() { return Promise.resolve(true); }
function unmount(): Promise<boolean> { if (_hooks) { _hooks.run(); _hooks = null; } if (_container) _container.innerHTML = ''; _container = null; _mounted = false; _emit(createMfEvent('dashboard', 'unmounted'), { moduleId: MODULE_ID }); return Promise.resolve(true); }
function destroy() { return unmount().then(() => { _context = null; _initialized = false; return true; }); }
function getMetadata() { return { id: MODULE_ID, name: DOMAIN_NAME, version: VERSION, routes: DOMAIN_ROUTES, type: 'domain' }; }
function getCapabilities() { return ['view']; }
function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized }; }
function isMounted() { return _mounted; }

export { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
