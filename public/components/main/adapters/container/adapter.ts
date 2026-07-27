// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.adapters.container
// PURPOSE: Main - Container Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createContainerAdapter() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   getContainer() — exported function
//   render() — exported function
//   clear() — exported function
//   setContainerId() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 8.4.0-STRICT-MODE
// @changelog v8.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v8.3.0-P0-ENTERPRISE - Logger via Ports (elimina (window as any).Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

const MODULE_ID = 'components.main.adapters.container';
const VERSION = '8.5.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && (window as any).Core?.windowAdapter?.get) {
    const waLogger = (window as any).Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use (window as any).Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

const _state = { containerId: 'container-main', element: null as HTMLElement | null };
const _metrics = { renders: 0, clears: 0, unsafeRendersPrevented: 0 };

// v8.1.0: Safety check - ensure we're not rendering into a critical element
function _isSafeContainer(el: Element | null) {
  if (!el) return false;
  // Never render into these
  if (el.id === 'app') return false;
  if (el.id === 'app-shell') return false;
  if (el === document.body) return false;
  if (el === document.documentElement) return false;
  // Must be the actual container-main or inside shell-main-region
  if (el.id === 'container-main') return true;
  if (el.closest('#shell-main-region, [data-region="main"], #main')) return true;
  if (el.closest('[data-region="main"]')) return true;
  return false;
}

function getContainer() {
  if (_state.element && document.contains(_state.element)) return _state.element;
  if (typeof document !== 'undefined') {
    // v8.1.0: Try to find container-main inside shell-main-region first
    const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
    if (shellMain) {
      const containerInShell = shellMain.querySelector('#container-main') ||
                             shellMain.querySelector('.dsd-container__content') ||
                             shellMain.querySelector('[data-container-main="true"]');
      if (containerInShell) {
        _state.element = containerInShell as HTMLElement;
        return _state.element;
      }
    }
    // Fallback to direct getElementById
    const directContainer = document.getElementById(_state.containerId);
    if (directContainer && _isSafeContainer(directContainer)) {
      _state.element = directContainer;
      return _state.element;
    }
  }
  return null;
}

function render(content: string | HTMLElement) {
  _metrics.renders++;
  const container = getContainer();
  const logger = _getLogger();

  // v8.1.0: Safety check
  if (!container) {
    if (logger?.warn) {
      logger.warn('[ContainerAdapter] render() - No container found');
    } else if (!isStrict()) {
      console.warn('[ContainerAdapter] render() - No container found');
    }
    return { ok: false, error: 'Container not found' };
  }

  if (!_isSafeContainer(container)) {
    _metrics.unsafeRendersPrevented++;
    if (!isStrict()) {
      console.error('[ContainerAdapter] BLOCKED: Attempted to render into unsafe container:', container.id || container.tagName);
    }
    return { ok: false, error: 'Unsafe container - render blocked' };
  }

  if (typeof content === 'string') {
    container.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    container.innerHTML = '';
    container.appendChild(content);
  }
  return { ok: true };
}

function clear() {
  _metrics.clears++;
  const container = getContainer();
  if (container && _isSafeContainer(container)) {
    container.innerHTML = '';
  }
  return { ok: true };
}

function setContainerId(id: string) {
  _state.containerId = id;
  _state.element = null;
  return { ok: true };
}

function init(ctx: Record<string, unknown>) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>);
  if (ctx && ctx.containerId) _state.containerId = ctx.containerId as string;
  return { ok: true, version: VERSION };
}

function healthCheck() {
  const container = getContainer();
  const hasContainer = !!container;
  const isSafe = hasContainer && _isSafeContainer(container);
  return {
    status: isSafe ? 'HEALTHY' : (hasContainer ? 'DEGRADED' : 'UNHEALTHY'),
    score: isSafe ? 100 : (hasContainer ? 50 : 0),
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      containerExists: { ok: hasContainer, severity: 'crit' },
      containerIsSafe: { ok: isSafe, severity: 'crit' },
      portsInitialized: { ok: Ports.isInitialized(), severity: 'info' }
    },
    metrics: _metrics,
    strictMode: isStrict()
  };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    containerId: _state.containerId,
    hasContainer: !!getContainer(),
    containerIsSafe: _isSafeContainer(getContainer()),
    metrics: _metrics,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict()
  };
}

// Factory function for initializer.js compatibility
export function createContainerAdapter(options: Record<string, unknown>) {
  options = options || {};
  init(options);
  return {
    getContainer,
    render,
    clear,
    setContainerId,
    healthCheck,
    info,
    VERSION,
    MODULE_ID
  };
}

export { MODULE_ID, VERSION, init, getContainer, render, clear, setContainerId, healthCheck, info };
export default { MODULE_ID, VERSION, createContainerAdapter, init, getContainer, render, clear, setContainerId, healthCheck, info, injectPorts, getPorts };
