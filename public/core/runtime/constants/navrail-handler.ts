// Migrado para TypeScript: 2026-02-25
// NavRail RuntimeContext Handler
// DEPENDENCY CONTRACT — Runtime constant module
// @version 1.6.0-STRICT-MODE
// @description Handler para NavRail reagir ao RuntimeContext
// @melhoria #29 - NavRail integrado com RuntimeContext
// @changelog v1.6.0-STRICT-MODE - Added isStrict/recordViolation protection for window.* fallbacks
// @changelog v1.5.0-P2-ENTERPRISE - Migrado para Ports pattern (Ports fallback em vez de window.EventBus direto)
// @changelog v1.4.0-P18 - Strings soltas substituidas por constantes P18 (KERNEL_RUNTIME_EVENTS)
// @changelog v1.3.0-STEP8 - Fase 3B: window.RuntimeContext migrado para _resolveRuntimeContext() (windowAdapter → window fallback)
// @changelog v1.2.0-EARLY-BOOT-LOGGER - Migração: console.* → createEarlyLogger para pipeline de logging unificado
// @changelog v1.1.0 - Fix: usar window.EventBus/window.RuntimeContext (padrao real do sistema)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { createEarlyLogger } from '/core/runtime/early-boot-logger.js';
import { KERNEL_RUNTIME_EVENTS } from '/core/runtime/events/catalog/kernel.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'navrail-rc-handler' as const;
export const VERSION = '1.6.0-STRICT-MODE' as const;

interface RuntimeSnapshot {
  mode: string;
  ready?: boolean;
  authenticated?: boolean;
  [key: string]: unknown;
}

interface RuntimeContextUpdateData {
  snapshot?: RuntimeSnapshot;
  trigger?: string;
  [key: string]: unknown;
}

interface SetupResult {
  ok: boolean;
  reason?: string;
  error?: string;
}

interface NavRailMetrics {
  updatesReceived: number;
  modeChanges: number;
  authChanges: number;
  errorsCount: number;
}

interface NavRailHealthCheckResult {
  status: string;
  handlerId: typeof MODULE_ID;
  version: typeof VERSION;
  strictMode: boolean;
  p2Enterprise: boolean;
  portsInitialized: boolean;
  metrics: NavRailMetrics;
}

interface NavRailHandlerInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  strictMode: boolean;
  setupDone: boolean;
  p2Enterprise: boolean;
  portsInitialized: boolean;
  metrics: NavRailMetrics;
  lastSnapshot: { mode: string; authenticated: boolean | undefined } | null;
}

// P2 ENTERPRISE: Ports-based access
const _Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized: boolean = false;
function _initPorts(): void { if (_portsInitialized) return; _Ports.init(); _portsInitialized = true; }
function _getEventBus(): unknown { _initPorts(); return (_Ports as unknown as { getEventBus(): unknown }).getEventBus(); }

let _setupDone: boolean = false;
let _cleanups: Array<() => void> = [];
let _lastSnapshot: RuntimeSnapshot | null = null;
const _metrics: NavRailMetrics = { updatesReceived: 0, modeChanges: 0, authChanges: 0, errorsCount: 0 };

// v1.2.0: Early Boot Logger - buffer + replay no Logger Enterprise
const _log = createEarlyLogger(MODULE_ID);

// ═══════════════════════════════════════════════════════════════
// RUNTIME CONTEXT RESOLVER (v1.3.0-STEP8)
// Canal oficial: windowAdapter.get → window fallback
// ═══════════════════════════════════════════════════════════════

function _resolveRuntimeContext(): unknown {
  if (typeof window === 'undefined') return null;
  // 1. windowAdapter (canal oficial)
  if (((window as unknown as Record<string, unknown>)).Core && (((window as unknown as Record<string, unknown>)).Core as Record<string, unknown>).windowAdapter && ((((window as unknown as Record<string, unknown>)).Core as Record<string, unknown>).windowAdapter as Record<string, unknown>).get) {
    const rc = ((((window as unknown as Record<string, unknown>)).Core as Record<string, unknown>).windowAdapter as Record<string, (...args: unknown[]) => unknown>).get('RuntimeContext');
    if (rc) return rc;
  }
  // 2. window fallback with strict mode protection (v1.6.0)
  if (((window as unknown as Record<string, unknown>)).RuntimeContext) {
    if (isStrict()) return null;
    recordViolation('WINDOW_FALLBACK', { module: MODULE_ID, global: 'RuntimeContext', context: '_resolveRuntimeContext' });
    return ((window as unknown as Record<string, unknown>)).RuntimeContext;
  }
  return null;
}

function _getNavRail(): Element | null {
  return document.querySelector('.navrail') ||
         document.querySelector('[data-component="navrail"]') ||
         document.querySelector('nav.dsd-navrail') ||
         document.getElementById('navrail-root');
}

export function handleRuntimeContextUpdated(data: RuntimeContextUpdateData): void {
  _metrics.updatesReceived++;
  try {
    const snapshot: RuntimeSnapshot | undefined = data && data.snapshot ? data.snapshot : data as unknown as RuntimeSnapshot;
    if (!snapshot || !snapshot.mode) return;

    const nav = _getNavRail();
    if (!nav) return;

    const prevMode: string | null = _lastSnapshot ? _lastSnapshot.mode : null;
    const prevAuth: boolean | undefined | null = _lastSnapshot ? _lastSnapshot.authenticated : null;
    _lastSnapshot = snapshot;

    nav.setAttribute('data-kernel-mode', snapshot.mode);
    nav.setAttribute('data-kernel-ready', String(!!snapshot.ready));
    nav.setAttribute('data-kernel-authenticated', String(!!snapshot.authenticated));

    if (prevMode) {
      nav.classList.remove(`kernel-mode-${prevMode.toLowerCase()}`);
    }
    nav.classList.add(`kernel-mode-${snapshot.mode.toLowerCase()}`);

    if (snapshot.mode === 'MAINTENANCE') {
      nav.classList.add('navrail-maintenance');
      const links = nav.querySelectorAll('a, button');
      for (let i = 0; i < links.length; i++) {
        if (!links[i].hasAttribute('data-essential')) {
          links[i].setAttribute('data-disabled-by-kernel', 'true');
          (links[i] as HTMLElement).style.pointerEvents = 'none';
          (links[i] as HTMLElement).style.opacity = '0.5';
        }
      }
    } else {
      nav.classList.remove('navrail-maintenance');
      const disabled = nav.querySelectorAll('[data-disabled-by-kernel]');
      for (let j = 0; j < disabled.length; j++) {
        disabled[j].removeAttribute('data-disabled-by-kernel');
        (disabled[j] as HTMLElement).style.pointerEvents = '';
        (disabled[j] as HTMLElement).style.opacity = '';
      }
    }

    if (snapshot.mode === 'FAILED') {
      nav.classList.add('navrail-failed');
    } else {
      nav.classList.remove('navrail-failed');
    }

    if (snapshot.mode === 'DEGRADED') {
      nav.classList.add('navrail-degraded');
    } else {
      nav.classList.remove('navrail-degraded');
    }

    if (prevAuth !== null && prevAuth !== snapshot.authenticated) {
      _metrics.authChanges++;
      const authItems = nav.querySelectorAll('[data-requires-auth]');
      for (let k = 0; k < authItems.length; k++) {
        (authItems[k] as HTMLElement).style.display = snapshot.authenticated ? '' : 'none';
      }
      const anonItems = nav.querySelectorAll('[data-show-anonymous]');
      for (let l = 0; l < anonItems.length; l++) {
        (anonItems[l] as HTMLElement).style.display = snapshot.authenticated ? 'none' : '';
      }
      _log.debug(`Auth changed: ${prevAuth} -> ${snapshot.authenticated}`);
    }

    if (prevMode && prevMode !== snapshot.mode) {
      _metrics.modeChanges++;
      _log.debug(`Mode changed: ${prevMode} -> ${snapshot.mode}`);
    }
  } catch (e: unknown) {
    _metrics.errorsCount++;
    _log.warn(`handleUpdated error: ${(e as Error).message}`);
  }
}

export function handleRuntimeContextReady(data: unknown): void {
  try {
    const nav = _getNavRail();
    if (nav) {
      nav.setAttribute('data-kernel-ready', 'true');
      nav.classList.add('kernel-ready');
    }
    _log.debug('RuntimeContext ready received');
  } catch (e: unknown) {
    _metrics.errorsCount++;
  }
}

export function setup(): SetupResult {
  if (_setupDone) return { ok: true, reason: 'already-setup' };
  try {
    // P2 ENTERPRISE: Prioridade Ports → window.EventBus fallback
    // v1.6.0: Strict mode protection
    let eb = _getEventBus() as Record<string, unknown> | null;
    if (!eb && typeof window !== 'undefined' && ((window as unknown as Record<string, unknown>)).EventBus) {
      if (!isStrict()) {
        recordViolation('WINDOW_EVENTBUS_FALLBACK', { module: MODULE_ID, context: 'setup' });
        eb = ((window as unknown as Record<string, unknown>)).EventBus as Record<string, unknown>;
      }
    }

    if (eb && typeof (eb as Record<string, unknown>).on === 'function') {
      const unsub1 = (eb as Record<string, (...args: unknown[]) => unknown>).on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_UPDATED, handleRuntimeContextUpdated);
      if (typeof unsub1 === 'function') _cleanups.push(unsub1 as () => void);

      const unsub2 = (eb as Record<string, (...args: unknown[]) => unknown>).on(KERNEL_RUNTIME_EVENTS.RUNTIME_CONTEXT_READY, handleRuntimeContextReady);
      if (typeof unsub2 === 'function') _cleanups.push(unsub2 as () => void);

      _log.debug('Setup via EventBus OK');
    } else {
      const rc = _resolveRuntimeContext() as Record<string, unknown> | null;
      if (rc && typeof rc.subscribeWithReplay === 'function') {
        const unsub = (rc.subscribeWithReplay as (cb: (snapshot: RuntimeSnapshot, meta: Record<string, unknown>) => void, opts: Record<string, boolean>) => unknown)((snapshot: RuntimeSnapshot, meta: Record<string, unknown>) => {
          handleRuntimeContextUpdated({ snapshot, trigger: (meta && meta.trigger as string) || 'subscription' });
        }, { replayReady: true, replayLastUpdate: true });
        if (typeof unsub === 'function') _cleanups.push(unsub as () => void);
        _log.debug('Setup via RuntimeContext.subscribeWithReplay OK');
      } else {
        _log.warn('Neither EventBus nor RuntimeContext available');
        _setupDone = true;
        return { ok: false, reason: 'no-event-source' };
      }
    }

    _setupDone = true;
    return { ok: true };
  } catch (e: unknown) {
    _log.warn(`Setup error: ${(e as Error).message}`);
    return { ok: false, error: (e as Error).message };
  }
}

export function cleanup(): void {
  for (let i = 0; i < _cleanups.length; i++) {
    try { _cleanups[i](); } catch (e: unknown) {}
  }
  _cleanups = [];
  _setupDone = false;
  _log.debug('Cleanup done');
}

export function healthCheck(): NavRailHealthCheckResult {
  return {
    status: _setupDone ? 'HEALTHY' : 'NOT_CONFIGURED',
    handlerId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    p2Enterprise: true,
    portsInitialized: _portsInitialized,
    metrics: Object.assign({}, _metrics)
  };
}

export function getMetrics(): NavRailMetrics {
  return Object.assign({}, _metrics);
}

export function info(): NavRailHandlerInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    setupDone: _setupDone,
    p2Enterprise: true,
    portsInitialized: _portsInitialized,
    metrics: Object.assign({}, _metrics),
    lastSnapshot: _lastSnapshot ? { mode: _lastSnapshot.mode, authenticated: _lastSnapshot.authenticated } : null
  };
}

export default {
  MODULE_ID,
  VERSION,
  setup,
  cleanup,
  handleRuntimeContextUpdated,
  handleRuntimeContextReady,
  healthCheck,
  getMetrics,
  info
};
