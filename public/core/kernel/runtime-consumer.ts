// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.runtime-consumer
// PURPOSE: CORE Integration - Consumer de RuntimeContext do Bootstrap Kernel
// ───────────────────────────────────────────────────────────────
// @contract KERNEL_INTERNAL - Modulo interno do kernel
// @contract RUNTIME_CONSUMER - Consome RuntimeContext, nunca altera
// @contract EVENTS_AS_SIGNALS - Eventos do CORE sao sinais, nao decisoes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — inicializa o consumer
//   getContext() — obtem RuntimeContext (lazy resolution)
//   hasContext() — verifica se contexto esta disponivel
//   getMode() — obtem modo atual (normal, maintenance, degraded, etc)
//   getPhase() — obtem fase atual (boot, loading, ready, etc)
//   isReady() — verifica se sistema esta pronto
//   isDegraded() — verifica se sistema esta degradado
//   isInMaintenance() — verifica se esta em manutencao
//   isFailed() — verifica se falhou
//   isInRecovery() — verifica se esta em recuperacao
//   getAuthLevel() — nivel de autenticacao
//   canEnableFeature(featureId) — verifica se feature pode ser habilitada
//   canOperate() — verifica se pode operar
//   canPerformHeavyOperations() — verifica operacoes pesadas
//   getSnapshot() — snapshot do estado atual
//   subscribe(eventName, callback) — subscribe a eventos
//   healthCheck() — status de saude do modulo
//   info() — informacoes do modulo
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT, added info()
// @changelog v1.4.0-STEP8: Fase 3B: fix bug chave extra L113
// @changelog v1.3.0-PORTSFACTORY: Restaura funcoes removidas
// @changelog v1.2.0-PORTSFACTORY: Migracao para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.runtime-consumer';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

declare const Logger: Record<string, (...args: unknown[]) => void> | undefined;

interface PortsInstance {
  get(name: string): unknown;
  inject(p: unknown): unknown;
  snapshot(): unknown;
  isInitialized(): boolean;
}

interface RuntimeContext {
  VERSION?: string;
  getMode(): string;
  getPhase(): string;
  isReady(): boolean;
  isDegraded(): boolean;
  isInMaintenance?(): boolean;
  isFailed?(): boolean;
  isInRecovery?(): boolean;
  getAuthLevel?(): number;
  canEnableFeature?(featureId: unknown): unknown;
  canAttemptRecovery?(): unknown;
  isCapabilityEnabled?(capabilityId: string): boolean;
  canNavigate?(): boolean;
  canAuthenticate?(): boolean;
  canShowUI?(): boolean;
  getCapabilities?(): Record<string, boolean>;
  canOperate?(): boolean;
  canPerformHeavyOperations?(): boolean;
  subscribe?(eventName: string, callback: (...args: unknown[]) => void): () => void;
}

export interface RuntimeSnapshot {
  readonly available: boolean;
  readonly mode: string;
  readonly phase: string;
  readonly ready: boolean;
  readonly degraded: boolean;
  readonly capabilities?: Record<string, boolean>;
}

export interface RuntimeConsumerHealthResult {
  readonly status: string;
  readonly moduleId: string;
  readonly version: string;
  readonly portsInitialized: boolean;
  readonly checks: {
    readonly contextAvailable: boolean;
    readonly initialized: boolean;
    readonly mode: string;
    readonly phase: string;
    readonly subscriptionsCount: number;
  };
}

export interface RuntimeConsumerInfo {
  readonly moduleId: string;
  readonly version: string;
  readonly initialized: boolean;
  readonly contextAvailable: boolean;
  readonly mode: string | null;
  readonly phase: string | null;
  readonly ready: boolean;
  readonly degraded: boolean;
  readonly subscriptionsCount: number;
  readonly portsInitialized: boolean;
  readonly timestamp: number;
}

interface LoggerPort {
  [level: string]: (message: string, data?: Record<string, unknown>) => void;
}

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports: PortsInstance = createCorePorts({ moduleId: MODULE_ID }) as PortsInstance;
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: unknown): unknown { return _Ports.inject(p); }
export function getPorts(): unknown { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _runtimeContext: RuntimeContext | null = null;
let _initialized = false;
let _subscriptions: Array<() => void> = [];

// ═══════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════

const _log = (level: string, message: string, data?: Record<string, unknown>): void => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getPort('logger') as LoggerPort | null;
  if (logger && logger[level]) {
    logger[level](`${prefix} ${message}`, data || {});
  }
};

// ═══════════════════════════════════════════════════════════════
// RUNTIME CONTEXT RESOLVER
// Canal oficial: windowAdapter.get -> window fallback -> kernel chain
// ═══════════════════════════════════════════════════════════════

function _resolveRuntimeContext(): RuntimeContext | null {
  if (typeof window === 'undefined') return null;

  const win = window as unknown as Record<string, unknown>;

  // 1. windowAdapter canal oficial
  const core = win.Core as Record<string, unknown> | undefined;
  if (core && core.windowAdapter) {
    const adapter = core.windowAdapter as Record<string, unknown>;
    if (typeof adapter.get === 'function') {
      const rc = (adapter.get as (key: string) => unknown)('RuntimeContext');
      if (rc) return rc as RuntimeContext;
    }
  }

  // 2. Window global (set by RuntimeContext itself)
  if (win.RuntimeContext) {
    return win.RuntimeContext as RuntimeContext;
  }

  // 3. Via Bootstrap Kernel (windowAdapter -> window fallback)
  let kernel: Record<string, unknown> | null = null;
  if (core && core.windowAdapter) {
    const adapter = core.windowAdapter as Record<string, unknown>;
    if (typeof adapter.get === 'function') {
      kernel = (adapter.get as (key: string) => unknown)('ApplicationKernel') as Record<string, unknown> | null;
    }
  }
  if (!kernel && win.ApplicationKernel) {
    kernel = win.ApplicationKernel as Record<string, unknown>;
  }
  if (kernel && typeof kernel.getRuntimeContext === 'function') {
    return (kernel.getRuntimeContext as () => RuntimeContext)();
  }

  // 4. Via Bootstrap-v2 instance
  const bsV2 = win.__BOOTSTRAP_V2_INSTANCE__ as Record<string, unknown> | undefined;
  if (bsV2) {
    const bsKernel = (bsV2.getKernel as () => Record<string, unknown> | null)();
    if (bsKernel && typeof bsKernel.getRuntimeContext === 'function') {
      return (bsKernel.getRuntimeContext as () => RuntimeContext)();
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function init(): { ok: boolean; alreadyInitialized?: boolean; contextAvailable?: boolean; reason?: string; error?: string } {
  if (_initialized) {
    return { ok: true, alreadyInitialized: true };
  }

  try {
    // Tentar obter RuntimeContext de multiplas fontes
    _runtimeContext = _resolveRuntimeContext();

    if (_runtimeContext) {
      _initialized = true;
      _log('info', 'RuntimeConsumer initialized', {
        contextVersion: _runtimeContext.VERSION as string,
        mode: _runtimeContext.getMode()
      });
      return { ok: true, contextAvailable: true };
    }

    // RuntimeContext nao disponivel ainda - isso e OK durante boot
    _log('debug', 'RuntimeContext not yet available - will retry on demand');
    return { ok: true, contextAvailable: false, reason: 'Context not yet initialized' };

  } catch (e) {
    _log('error', 'Init failed', { error: (e as Error).message });
    return { ok: false, error: (e as Error).message };
  }
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT ACCESS (lazy resolution)
// ═══════════════════════════════════════════════════════════════

export function getContext(): RuntimeContext | null {
  if (!_runtimeContext) {
    _runtimeContext = _resolveRuntimeContext();
  }
  return _runtimeContext;
}

export function hasContext(): boolean {
  return !!getContext();
}

// ═══════════════════════════════════════════════════════════════
// MODE & PHASE QUERIES
// ═══════════════════════════════════════════════════════════════

export function getMode(): string {
  const ctx = getContext();
  return ctx ? ctx.getMode() : 'unknown';
}

export function getPhase(): string {
  const ctx = getContext();
  return ctx ? ctx.getPhase() : 'unknown';
}

export function isReady(): boolean {
  const ctx = getContext();
  return ctx ? ctx.isReady() : false;
}

export function isDegraded(): boolean {
  const ctx = getContext();
  return ctx ? ctx.isDegraded() : false;
}

export function isInMaintenance(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.isInMaintenance) return ctx.isInMaintenance();
  return false;
}

export function isFailed(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.isFailed) return ctx.isFailed();
  return false;
}

export function isInRecovery(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.isInRecovery) return ctx.isInRecovery();
  return false;
}

// ═══════════════════════════════════════════════════════════════
// AUTH LEVEL
// ═══════════════════════════════════════════════════════════════

export function getAuthLevel(): number {
  const ctx = getContext();
  if (!ctx) return 0;
  if (ctx.getAuthLevel) return ctx.getAuthLevel();
  return 0;
}

// ═══════════════════════════════════════════════════════════════
// CAPABILITY QUERIES (P1 - Elevacao)
// ═══════════════════════════════════════════════════════════════

export function canEnableFeature(featureId: unknown): unknown {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canEnableFeature) return ctx.canEnableFeature(featureId);
  return ctx.isReady();
}

export function canAttemptRecovery(): unknown {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canAttemptRecovery) return ctx.canAttemptRecovery();
  return !ctx.isDegraded();
}

export function isCapabilityEnabled(capabilityId: string): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.isCapabilityEnabled) return ctx.isCapabilityEnabled(capabilityId);
  return false;
}

export function canNavigate(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canNavigate) return ctx.canNavigate();
  return ctx.isReady();
}

export function canAuthenticate(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canAuthenticate) return ctx.canAuthenticate();
  return ctx.isReady();
}

export function canShowUI(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canShowUI) return ctx.canShowUI();
  return ctx.isReady();
}

export function getCapabilities(): Record<string, boolean> {
  const ctx = getContext();
  if (!ctx) return {};
  if (ctx.getCapabilities) return ctx.getCapabilities();
  return {
    navigate: canNavigate(),
    authenticate: canAuthenticate(),
    showUI: canShowUI(),
    enableFeature: true,
    recovery: !!canAttemptRecovery()
  };
}

// ═══════════════════════════════════════════════════════════════
// OPERATIONAL QUERIES (Governance Consumers)
// ═══════════════════════════════════════════════════════════════

export function canOperate(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canOperate) return ctx.canOperate();
  // Fallback: ready AND not in maintenance AND not failed
  return ctx.isReady() &&
         !(ctx.isInMaintenance ? ctx.isInMaintenance() : false) &&
         !(ctx.isFailed ? ctx.isFailed() : false);
}

export function canPerformHeavyOperations(): boolean {
  const ctx = getContext();
  if (!ctx) return false;
  if (ctx.canPerformHeavyOperations) return ctx.canPerformHeavyOperations();
  // Fallback: ready AND not degraded AND not in maintenance AND not failed AND not in recovery
  return ctx.isReady() &&
         !(ctx.isDegraded ? ctx.isDegraded() : false) &&
         !(ctx.isInMaintenance ? ctx.isInMaintenance() : false) &&
         !(ctx.isFailed ? ctx.isFailed() : false) &&
         !(ctx.isInRecovery ? ctx.isInRecovery() : false);
}

// ═══════════════════════════════════════════════════════════════
// STATE SNAPSHOT
// ═══════════════════════════════════════════════════════════════

export function getSnapshot(): RuntimeSnapshot {
  const ctx = getContext();
  if (!ctx) {
    return {
      available: false,
      mode: 'unknown',
      phase: 'unknown',
      ready: false,
      degraded: false
    };
  }

  return {
    available: true,
    mode: ctx.getMode(),
    phase: ctx.getPhase(),
    ready: ctx.isReady(),
    degraded: ctx.isDegraded(),
    capabilities: getCapabilities()
  };
}

// ═══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════

export function subscribe(eventName: string, callback: (...args: unknown[]) => void): () => void {
  if (!eventName || typeof callback !== 'function') {
    _log('warn', 'Invalid subscription', { eventName });
    return () => {};
  }

  const ctx = getContext();
  if (ctx && ctx.subscribe) {
    const unsub = ctx.subscribe(eventName, callback);
    _subscriptions.push(unsub);
    return unsub;
  }

  _log('debug', 'Cannot subscribe - no context', { eventName });
  return () => {};
}

export function subscribeToMode(callback: (...args: unknown[]) => void): () => void {
  return subscribe('mode:changed', callback);
}

export function subscribeToPhase(callback: (...args: unknown[]) => void): () => void {
  return subscribe('phase:changed', callback);
}

export function subscribeToDegradation(callback: (...args: unknown[]) => void): () => void {
  return subscribe('degradation:changed', callback);
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

export function destroy(): void {
  _subscriptions.forEach(unsub => {
    if (typeof unsub === 'function') unsub();
  });
  _subscriptions = [];
  _runtimeContext = null;
  _initialized = false;
  _log('info', 'RuntimeConsumer destroyed');
}

// ═══════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════

export function healthCheck(): RuntimeConsumerHealthResult {
  const ctx = getContext();
  return {
    status: ctx ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    checks: {
      contextAvailable: !!ctx,
      initialized: _initialized,
      mode: ctx ? ctx.getMode() : 'N/A',
      phase: ctx ? ctx.getPhase() : 'N/A',
      subscriptionsCount: _subscriptions.length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info(): RuntimeConsumerInfo {
  const ctx = getContext();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    contextAvailable: !!ctx,
    mode: ctx ? ctx.getMode() : null,
    phase: ctx ? ctx.getPhase() : null,
    ready: ctx ? ctx.isReady() : false,
    degraded: ctx ? ctx.isDegraded() : false,
    subscriptionsCount: _subscriptions.length,
    portsInitialized: _Ports.isInitialized(),
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  init,
  destroy,
  getContext,
  hasContext,
  getMode,
  getPhase,
  isReady,
  isDegraded,
  isInMaintenance,
  isFailed,
  isInRecovery,
  getAuthLevel,
  canEnableFeature,
  canAttemptRecovery,
  isCapabilityEnabled,
  canNavigate,
  canAuthenticate,
  canShowUI,
  getCapabilities,
  canOperate,
  canPerformHeavyOperations,
  getSnapshot,
  subscribe,
  subscribeToMode,
  subscribeToPhase,
  subscribeToDegradation,
  healthCheck,
  info,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
