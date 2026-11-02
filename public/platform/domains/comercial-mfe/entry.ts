// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: comercial-mfe
// PURPOSE: Comercial MFE
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
const VERSION = '4.3.0-P2-ENTERPRISE'; const MODULE_ID = 'comercial-mfe'; const DOMAIN_NAME = 'Comercial'; const DOMAIN_ROUTES = ['/comercial', '/orcamento-clientes'];
type MfeContext = Record<string, unknown>;
type CleanupHook = ReturnType<typeof useCleanup>;
let _context: MfeContext | null = null, _container: HTMLElement | null = null, _mounted = false, _initialized = false, _hooks: CleanupHook | null = null;
function init(context: MfeContext): Promise<{ version: string; moduleId: string }> { if (!context) context = {}; if (_initialized) return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); _context = context; _initialized = true; return Promise.resolve({ version: VERSION, moduleId: MODULE_ID }); }
function mount(container: HTMLElement, params?: Record<string, unknown>): Promise<unknown> { if (!container) return Promise.reject(new Error(`[${MODULE_ID}] Container required`)); return Promise.resolve().then(() => { if (_mounted) return unmount(); }).then(() => { _container = container; _hooks = useCleanup(); _container.innerHTML = `<div class="domain-mfe" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:450px;padding:2rem;background:linear-gradient(135deg,rgba(34,197,94,0.08) 0%,rgba(16,185,129,0.08) 100%);border-radius:16px;border:1px solid rgba(34,197,94,0.2);"><div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,rgba(34,197,94,0.3),rgba(16,185,129,0.4));display:flex;align-items:center;justify-content:center;margin-bottom:1.5rem;"><span style="font-size:2.5rem;">💼</span></div><h2 style="color:rgba(255,255,255,0.95);font-size:1.75rem;margin:0 0 0.5rem 0;">${DOMAIN_NAME}</h2><p style="color:rgba(255,255,255,0.5);">Domain MFE Enterprise</p><span style="padding:0.4rem 0.8rem;background:rgba(34,197,94,0.15);border-radius:9999px;font-size:0.8rem;color:rgba(34,197,94,0.9);">v${VERSION}</span></div>`; _mounted = true; return { container: _container, moduleId: MODULE_ID }; }); }
function hydrate() { return Promise.resolve(true); } function update() { return Promise.resolve(true); }
function unmount(): Promise<boolean> { if (_hooks) { _hooks.run(); _hooks = null; } if (_container) _container.innerHTML = ''; _container = null; _mounted = false; return Promise.resolve(true); }
function destroy() { return unmount().then(() => { _context = null; _initialized = false; return true; }); }
function getMetadata() { return { id: MODULE_ID, name: DOMAIN_NAME, version: VERSION, routes: DOMAIN_ROUTES, type: 'domain' }; }
function getCapabilities() { return ['view']; } function info() { return { version: VERSION, moduleId: MODULE_ID, mounted: _mounted, initialized: _initialized }; } function isMounted() { return _mounted; }
export { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
export default { init, mount, hydrate, update, unmount, destroy, getMetadata, getCapabilities, info, isMounted, VERSION, MODULE_ID };
