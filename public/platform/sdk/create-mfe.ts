// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-create-mfe
// PURPOSE: MFE Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createMFE
//   VERSION
//   MODULE_ID
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '3.1.0-P2-ENTERPRISE';
const MODULE_ID = 'platform-create-mfe';

interface MFEConfig {
  id?: string;
  name?: string;
  version?: string;
  routes?: string[];
  permissions?: string[];
  layout?: string;
  region?: string;
  fallback?: string | null;
  capabilities?: string[];
  onMount?: (container: HTMLElement, params: Record<string, unknown>, context: Record<string, unknown> | null) => void | Promise<void>;
  onUnmount?: (container: HTMLElement | null, context: Record<string, unknown> | null) => void | Promise<void>;
  onHydrate?: (state: Record<string, unknown>, context: Record<string, unknown> | null) => void | Promise<void>;
  onUpdate?: (params: Record<string, unknown>, context: Record<string, unknown> | null) => void | Promise<void>;
  onDestroy?: (context: Record<string, unknown> | null) => void | Promise<void>;
}

function createMFE(config: MFEConfig) {
  if (!config) config = {};
  const id = config.id;
  const name = config.name;
  const version = config.version || '1.0.0';
  const routes = config.routes || [];
  const permissions = config.permissions || [];
  const layout = config.layout || 'default';
  const region = config.region || 'main';
  const fallback = config.fallback || null;
  const onMount = config.onMount;
  const onUnmount = config.onUnmount;
  const onHydrate = config.onHydrate;
  const onUpdate = config.onUpdate;
  const onDestroy = config.onDestroy;

  if (!id) throw new Error('MFE id required');

  let _context: Record<string, unknown> | null = null;
  let _container: HTMLElement | null = null;
  let _mounted = false;
  let _initialized = false;

  return {
    VERSION: version,
    MODULE_ID: id,
    init(context: Record<string, unknown>) {
      if (_initialized) return Promise.resolve({ version, moduleId: id });
      _context = context || {};
      _initialized = true;
      return Promise.resolve({ version, moduleId: id });
    },
    mount(container: HTMLElement, params: Record<string, unknown>) {
      const self = this;
      if (!params) params = {};
      if (!container) return Promise.reject(new Error(`[${id}] Container required`));
      return Promise.resolve().then(() => {
        if (_mounted) return self.unmount();
      }).then(() => {
        _container = container;
        if (onMount) return onMount(container, params, _context);
      }).then(() => {
        _mounted = true;
        return { container: _container, moduleId: id };
      });
    },
    hydrate(state: Record<string, unknown>) {
      if (!state) state = {};
      if (onHydrate) return Promise.resolve(onHydrate(state, _context)).then(() => true);
      return Promise.resolve(true);
    },
    update(params: Record<string, unknown>) {
      if (!params) params = {};
      if (onUpdate) return Promise.resolve(onUpdate(params, _context)).then(() => true);
      return Promise.resolve(true);
    },
    unmount() {
      const self = this;
      return Promise.resolve().then(() => {
        if (onUnmount) return onUnmount(_container, _context);
      }).then(() => {
        if (_container) _container.innerHTML = '';
        _container = null;
        _mounted = false;
        return true;
      });
    },
    destroy() {
      const self = this;
      return self.unmount().then(() => {
        if (onDestroy) return onDestroy(_context);
      }).then(() => {
        _context = null;
        _initialized = false;
        return true;
      });
    },
    getMetadata() { return { id, name: name || id, version, routes, permissions, layout, region, fallback, type: 'domain' }; },
    getCapabilities() { return config.capabilities || ['view']; },
    info() { return { version, moduleId: id, mounted: _mounted, initialized: _initialized }; },
    isMounted() { return _mounted; }
  };
}

export { createMFE, VERSION, MODULE_ID };
export default { createMFE, VERSION, MODULE_ID };
