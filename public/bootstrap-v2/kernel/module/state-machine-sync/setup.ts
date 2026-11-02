// StateMachine Sync Setup
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory context):
//   context.stateMachine, context.log, context.cleanups,
//   context.onTransition, context.setLastSyncedState
// PROVIDES: setupStateMachineSync() returning:
//   { enabled, initialState }
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.state-machine-sync.setup';

interface StateMachineSyncSetupContext {
  stateMachine: { on?: (event: string, handler: (record: Record<string, unknown>) => void) => (() => void); getState?: () => string | null } | null;
  log: (level: string, message: string, data?: Record<string, unknown>) => void;
  cleanups: Array<() => void>;
  onTransition: (record: Record<string, unknown>) => void;
  setLastSyncedState: (state: string | null) => void;
}

export function setupStateMachineSync(context: StateMachineSyncSetupContext) {
  const stateMachine = context.stateMachine;
  const log = context.log;
  const cleanups = context.cleanups;
  const onTransition = context.onTransition;
  const setLastSyncedState = context.setLastSyncedState;

  if (!stateMachine || !stateMachine.on) {
    log('warn', 'StateMachine does not support listeners, sync disabled');
    return { enabled: false, initialState: null };
  }

  const cleanup = stateMachine.on('transition', function(record: Record<string, unknown>) {
    onTransition(record);
  });

  if (typeof cleanup === 'function') {
    cleanups.push(cleanup);
  }

  const initialState = stateMachine.getState ? stateMachine.getState() : null;
  setLastSyncedState(initialState);

  log('info', 'StateMachine sync enabled', { initialState: initialState });
  return { enabled: true, initialState: initialState };
}

export default { setupStateMachineSync };
