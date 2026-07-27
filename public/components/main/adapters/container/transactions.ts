// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-transactions
// PURPOSE: Container Transactions - Controle de Transações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONTAINER_EVENTS from /core/runtime/events/catalog/container.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createTransactionManager() — exported function
//   begin() — exported function
//   addOperation() — exported function
//   commit() — exported function
//   rollback() — exported function
//   get() — exported function
//   clear() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CONTAINER_EVENTS } from '/core/runtime/events/catalog/container.events.js';

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-transactions';

interface TransactionDeps {
  containers: Map<string, Record<string, unknown>>;
  listeners: Map<string, Record<string, unknown>>;
  eventsPort: { emit(event: string, data: Record<string, unknown>): void; [k: string]: unknown };
  getPolicy: () => string;
  getActiveId: () => string | null;
  setPolicy: (p: string) => void;
  setActiveId: (id: string | null) => void;
  onRollback: ((id: string) => void) | null;
}

export function createTransactionManager(deps: Record<string, unknown> = {}) {
  const { containers, listeners, eventsPort, getPolicy, getActiveId, setPolicy, setActiveId, onRollback } = deps as unknown as TransactionDeps;
  let _currentTx: Record<string, unknown> | null = null;
  let _txHistory: Record<string, unknown>[] = [];
  let _maxHistory = 50;
  let _metrics = { started: 0, committed: 0, rolledBack: 0, errors: 0 };

  function _emit(event: string, data: Record<string, unknown> = {}) { eventsPort?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }
  
  function _captureSnapshot() { return { policy: getPolicy ? getPolicy() : 'ephemeral', activeId: getActiveId ? getActiveId() : null, containerIds: containers ? Array.from(containers.keys()) : [], listenerIds: listeners ? Array.from(listeners.keys()) : [], timestamp: Date.now() }; }
  
  return {
    begin() {
      if (_currentTx) { this.commit(); }
      _currentTx = { id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, startedAt: Date.now(), snapshot: _captureSnapshot(), operations: [], state: 'pending' };
      _metrics.started++;
      return _currentTx.id;
    },
    
    addOperation(operation: Record<string, unknown>) { if (_currentTx) { (_currentTx.operations as Record<string, unknown>[]).push({ ...operation, timestamp: Date.now() }); } },
    
    commit() {
      if (!_currentTx) return false;
      _currentTx.state = 'committed';
      _currentTx.committedAt = Date.now();
      _txHistory.push({ ..._currentTx });
      if (_txHistory.length > _maxHistory) _txHistory.shift();
      _metrics.committed++;
      _emit(CONTAINER_EVENTS.TRANSACTION_COMMITTED, { txId: _currentTx.id });
      _currentTx = null;
      return true;
    },
    
    rollback(reason = '') {
      if (!_currentTx) return false;
      const snapshot = _currentTx.snapshot as Record<string, unknown>;
      if (snapshot.policy && setPolicy) { setPolicy(snapshot.policy as string); }
      if (setActiveId) { setActiveId(snapshot.activeId as string | null); }
      if (onRollback && (_currentTx.operations as Record<string, unknown>[]).length > 0) { (_currentTx.operations as Record<string, unknown>[]).forEach((op: Record<string, unknown>) => { if (op.containerId) { try { onRollback(op.containerId as string); } catch {} } }); }
      _currentTx.state = 'rolledBack';
      _currentTx.rolledBackAt = Date.now();
      _currentTx.rollbackReason = reason;
      _txHistory.push({ ..._currentTx });
      if (_txHistory.length > _maxHistory) _txHistory.shift();
      _metrics.rolledBack++;
      _emit(CONTAINER_EVENTS.TRANSACTION_ROLLED_BACK, { txId: _currentTx.id, reason });
      _currentTx = null;
      return true;
    },
    
    isActive() { return _currentTx !== null; },
    getCurrent() { return _currentTx ? { ..._currentTx } : null; },
    getHistory(limit: number = 20) { return _txHistory.slice(-limit); },
    getMetrics() { return { ..._metrics, historySize: _txHistory.length, hasActiveTx: !!_currentTx }; },
    healthCheck() { return { status: _metrics.errors < 5 ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { hasActiveTx: !!_currentTx, historySize: _txHistory.length, commitRate: _metrics.started > 0 ? _metrics.committed / _metrics.started : 1 }, metrics: this.getMetrics() }; },
    info() { return { version: VERSION, moduleId: MODULE_ID, hasActiveTx: !!_currentTx, metrics: this.getMetrics() }; }
  };
}

let _transactions = new Map();
let _metrics = { started: 0, committed: 0, rolledBack: 0, errors: 0 };

export function begin(id: string) { _transactions.set(id, { id, startedAt: Date.now(), state: 'pending', operations: [] }); _metrics.started++; return id; }
export function addOperation(txId: string, operation: Record<string, unknown>) { const tx = _transactions.get(txId); if (tx) (tx.operations as Record<string, unknown>[]).push(operation); }
export function commit(id: string) { const tx = _transactions.get(id); if (tx) { tx.state = 'committed'; _metrics.committed++; return true; } return false; }
export function rollback(id: string) { const tx = _transactions.get(id); if (tx) { tx.state = 'rolledBack'; _metrics.rolledBack++; return true; } return false; }
export function get(id: string) { return _transactions.get(id) || null; }
export function clear() { _transactions.clear(); }
export function getMetrics() { return { ..._metrics, active: _transactions.size }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() }; }

export default { createTransactionManager, begin, addOperation, commit, rollback, get, clear, getMetrics, healthCheck, VERSION, MODULE_ID };
