
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies.input-policy-manager
// PURPOSE: Gerenciador centralizado de política de input
// ───────────────────────────────────────────────────────────────
// @contract INPUT_POLICY_OWNER - Owner único de decisões de input
// @contract STATE_MACHINE - Gerencia transições de estado
// @contract P18EC_COMPLIANT - Events Contracts Migration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   INPUT_STATES, isValidTransition, isBlockingState from ./input-policy-contract.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   InputPolicyManager — singleton class
//   block(id, priority, reason) — bloqueia input
//   unblock(id) — desbloqueia input
//   forceState(state, reason) — força estado
//   getState() — obtém estado atual
//   subscribe(callback) — subscribe a mudanças
//   healthCheck() — status de saúde
//   info() — informações do módulo
//   injectPorts(p) — inject port dependencies
//
// @changelog v1.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.3.0-ENTERPRISE: ES6 modernization, P18EC
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { INPUT_STATES, isValidTransition, isBlockingState, getStatePriority } from './input-policy-contract.js';

export const VERSION = '1.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.policies.input-policy-manager';

const INPUT_POLICY_EVENTS = {
  INIT: 'input:policy:init',
  BLOCKED: 'input:policy:blocked',
  UNBLOCKED: 'input:policy:unblocked',
  FORCED: 'input:policy:forced',
  RESET: 'input:policy:reset',
  LOADING: 'input:policy:loading'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug; };
const _log = (level: string, ...args: unknown[]) => { if (!_debug() && level === 'debug') return; const logger = _getPort('logger'); if (!logger) return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };

interface BlockEntry {
  id: string;
  reason: string;
  state: string;
  priority: number;
  sourceId: string;
  timestamp: number;
}

interface HistoryEntry {
  action: string;
  state: string;
  meta: Record<string, unknown>;
  timestamp: number;
}

interface InputMetrics {
  transitions: number;
  blocks: number;
  unblocks: number;
  violations: number;
  lastStateAt: number;
}

type StateChangeCallback = (event: { from: string; to: string; action: string; timestamp: number }) => void;

class InputPolicyManagerClass {
  _state: string;
  _blockStack: BlockEntry[];
  _listeners: Set<StateChangeCallback>;
  _history: HistoryEntry[];
  _maxHistory: number;
  _metrics: InputMetrics;
  _initialized: boolean;

  constructor() {
    this._state = INPUT_STATES.ACTIVE;
    this._blockStack = [];
    this._listeners = new Set();
    this._history = [];
    this._maxHistory = 50;
    this._metrics = { transitions: 0, blocks: 0, unblocks: 0, violations: 0, lastStateAt: Date.now() };
    this._initialized = false;
  }

  init() {
    if (this._initialized) return this;
    _initPorts();
    this._initialized = true;
    this._recordHistory('INIT', INPUT_STATES.ACTIVE);
    _log('info', 'InputPolicyManager initialized');
    this._emitEvent(INPUT_POLICY_EVENTS.INIT, { state: this._state });
    return this;
  }

  getState() { return this._state; }
  isBlocked() { return isBlockingState(this._state); }
  isActive() { return this._state === INPUT_STATES.ACTIVE || this._state === INPUT_STATES.LOADING_UI; }

  block(reason: string, options: { state?: string; priority?: number; sourceId?: string } = {}) {
    const blockState = options.state || INPUT_STATES.BLOCKED_MODAL;
    const priority = options.priority || getStatePriority(blockState);
    const sourceId = options.sourceId || 'unknown';
    if (!isValidTransition(this._state, blockState)) {
      _log('warn', `Transição inválida: ${this._state} → ${blockState}`);
      this._metrics.violations++;
      return false;
    }
    const blockEntry = { id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`, reason, state: blockState, priority, sourceId, timestamp: Date.now() };
    this._blockStack.push(blockEntry);
    this._blockStack.sort((a: BlockEntry, b: BlockEntry) => b.priority - a.priority);
    const previousState = this._state;
    this._state = this._blockStack[0].state;
    this._metrics.blocks++;
    this._metrics.transitions++;
    this._metrics.lastStateAt = Date.now();
    this._recordHistory('BLOCK', this._state, { reason, sourceId, previousState });
    this._notifyListeners(previousState, this._state, 'block');
    this._emitEvent(INPUT_POLICY_EVENTS.BLOCKED, { state: this._state, reason, sourceId, blockId: blockEntry.id });
    _log('info', `Input BLOCKED: ${reason} (${sourceId})`);
    return blockEntry.id;
  }

  unblock(blockId: string) {
    const index = this._blockStack.findIndex((b: BlockEntry) => b.id === blockId);
    if (index === -1) { _log('warn', `Block ID não encontrado: ${blockId}`); return false; }
    const removed = this._blockStack.splice(index, 1)[0];
    const previousState = this._state;
    this._state = this._blockStack.length > 0 ? this._blockStack[0].state : INPUT_STATES.ACTIVE;
    this._metrics.unblocks++;
    this._metrics.transitions++;
    this._metrics.lastStateAt = Date.now();
    this._recordHistory('UNBLOCK', this._state, { blockId, previousState, removedReason: removed.reason });
    this._notifyListeners(previousState, this._state, 'unblock');
    this._emitEvent(INPUT_POLICY_EVENTS.UNBLOCKED, { state: this._state, blockId, previousState });
    _log('info', `Input UNBLOCKED: ${removed.reason}`);
    return true;
  }

  unblockBySource(sourceId: string) {
    const toRemove = this._blockStack.filter((b: BlockEntry) => b.sourceId === sourceId);
    if (toRemove.length === 0) return 0;
    for (const b of toRemove) { this.unblock(b.id); }
    return toRemove.length;
  }

  forceState(state: string, reason: string = 'forced') {
    const previousState = this._state;
    this._state = state;
    this._blockStack = [];
    this._metrics.transitions++;
    this._metrics.lastStateAt = Date.now();
    this._recordHistory('FORCE', state, { reason, previousState });
    this._notifyListeners(previousState, state, 'force');
    this._emitEvent(INPUT_POLICY_EVENTS.FORCED, { state, reason, previousState });
    _log('warn', `Input FORCED: ${reason}`);
    return true;
  }

  reset() {
    const previousState = this._state;
    this._state = INPUT_STATES.ACTIVE;
    this._blockStack = [];
    this._metrics.transitions++;
    this._metrics.lastStateAt = Date.now();
    this._recordHistory('RESET', INPUT_STATES.ACTIVE, { previousState });
    this._notifyListeners(previousState, INPUT_STATES.ACTIVE, 'reset');
    this._emitEvent(INPUT_POLICY_EVENTS.RESET, { state: INPUT_STATES.ACTIVE, previousState });
    _log('info', 'InputPolicyManager RESET');
    return true;
  }

  setLoading(isLoading: boolean, sourceId: string = 'unknown') {
    if (isLoading) {
      if (this._state === INPUT_STATES.ACTIVE) {
        const previousState = this._state;
        this._state = INPUT_STATES.LOADING_UI;
        this._metrics.transitions++;
        this._recordHistory('LOADING_START', INPUT_STATES.LOADING_UI, { sourceId });
        this._notifyListeners(previousState, INPUT_STATES.LOADING_UI, 'loading');
        this._emitEvent(INPUT_POLICY_EVENTS.LOADING, { loading: true, sourceId });
      }
    } else {
      if (this._state === INPUT_STATES.LOADING_UI) {
        const previousState = this._state;
        this._state = this._blockStack.length > 0 ? this._blockStack[0].state : INPUT_STATES.ACTIVE;
        this._metrics.transitions++;
        this._recordHistory('LOADING_END', this._state, { sourceId });
        this._notifyListeners(previousState, this._state, 'loading');
        this._emitEvent(INPUT_POLICY_EVENTS.LOADING, { loading: false, sourceId });
      }
    }
  }

  onChange(callback: StateChangeCallback) {
    if (typeof callback !== 'function') return () => {};
    this._listeners.add(callback);
    return () => { this._listeners.delete(callback); };
  }

  _notifyListeners(from: string, to: string, action: string) {
    for (const cb of this._listeners) {
      try { cb({ from, to, action, timestamp: Date.now() }); } catch (e) { _log('error', 'Listener error:', e); }
    }
  }

  _emitEvent(eventKey: string, detail: Record<string, unknown>) {
    const eventBus = _getPort('eventBus');
    eventBus?.emit?.(eventKey, { ...detail, source: MODULE_ID, timestamp: Date.now() });
  }

  _recordHistory(action: string, state: string, meta: Record<string, unknown> = {}) {
    this._history.push({ action, state, meta, timestamp: Date.now() });
    if (this._history.length > this._maxHistory) this._history.shift();
  }

  getHistory(limit = 20) { return this._history.slice(-limit); }
  getBlockStack() { return this._blockStack.slice(); }
  getMetrics() { return { ...this._metrics, currentState: this._state, blockStackSize: this._blockStack.length }; }

  healthCheck() {
    const checks = {
      initialized: this._initialized,
      validState: (Object.values(INPUT_STATES) as string[]).indexOf(this._state) !== -1,
      stackConsistent: this._blockStack.length === 0 || this._state !== INPUT_STATES.ACTIVE,
      noExcessiveViolations: this._metrics.violations < 10,
      portsInitialized: Ports.isInitialized()
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, state: this._state, blockStackSize: this._blockStack.length, version: VERSION, moduleId: MODULE_ID };
  }

  info() {
    return { version: VERSION, moduleId: MODULE_ID, state: this._state, isBlocked: this.isBlocked(), isActive: this.isActive(), blockStack: this.getBlockStack(), metrics: this.getMetrics(), portsInitialized: Ports.isInitialized() };
  }
}

let _instance: InputPolicyManagerClass | null = null;
export const getInputPolicyManager = () => { if (!_instance) { _instance = new InputPolicyManagerClass(); _instance.init(); } return _instance; };

export const InputPolicyManager = {
  get instance() { return getInputPolicyManager(); },
  INPUT_POLICY_EVENTS,
  getState: () => getInputPolicyManager().getState(),
  isBlocked: () => getInputPolicyManager().isBlocked(),
  isActive: () => getInputPolicyManager().isActive(),
  block: (reason: string, options: { state?: string; priority?: number; sourceId?: string } = {}) => getInputPolicyManager().block(reason, options),
  unblock: (blockId: string) => getInputPolicyManager().unblock(blockId),
  unblockBySource: (sourceId: string) => getInputPolicyManager().unblockBySource(sourceId),
  setLoading: (isLoading: boolean, sourceId: string = 'unknown') => getInputPolicyManager().setLoading(isLoading, sourceId),
  forceState: (state: string, reason: string = 'forced') => getInputPolicyManager().forceState(state, reason),
  reset: () => getInputPolicyManager().reset(),
  onChange: (cb: StateChangeCallback) => getInputPolicyManager().onChange(cb),
  getHistory: (limit: number = 20) => getInputPolicyManager().getHistory(limit),
  getBlockStack: () => getInputPolicyManager().getBlockStack(),
  getMetrics: () => getInputPolicyManager().getMetrics(),
  healthCheck: () => getInputPolicyManager().healthCheck(),
  info: () => getInputPolicyManager().info()
};

if (typeof window !== 'undefined') { (window as any).InputPolicyManager = InputPolicyManager; (window as any).__dev = (window as any).__dev || {}; (window as any).__dev.inputPolicy = InputPolicyManager; }

export default InputPolicyManager;
