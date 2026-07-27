// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.0.0-UNIFIED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-orchestration-policy
// PURPOSE: ContainerOrchestrationPolicy - Políticas de Orquestração
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DOCK_MODES — exported value
//   OPEN_STRATEGIES — exported value
//   getPolicy() — exported function
//   setPolicy() — exported function
//   resetPolicy() — exported function
//   checkPolicy() — exported function
//   createContainerOrchestrationPolicy() — exported function
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

export const VERSION = '8.0.0-UNIFIED';
export const MODULE_ID = 'container-orchestration-policy';

// Modos de dock para containers
export const DOCK_MODES = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  FULL: 'full',
  SPLIT: 'split',
  FLOATING: 'floating',
  MINIMIZED: 'minimized',
  HIDDEN: 'hidden'
});

// Estratégias de abertura
export const OPEN_STRATEGIES = Object.freeze({
  REPLACE: 'replace',
  SIDE_BY_SIDE: 'side-by-side',
  STACK: 'stack',
  SPLIT_HORIZONTAL: 'split-horizontal',
  SPLIT_VERTICAL: 'split-vertical',
  FLOAT: 'float'
});

const DEFAULT_POLICY = {
  maxConcurrentLoads: 3,
  loadTimeout: 10000,
  retryAttempts: 2,
  retryDelay: 1000,
  unloadDelay: 500,
  preloadEnabled: true,
  defaultDockMode: DOCK_MODES.PRIMARY,
  defaultOpenStrategy: OPEN_STRATEGIES.REPLACE
};

let _policy = { ...DEFAULT_POLICY };
let _metrics = { policyChecks: 0, violations: 0, containersCreated: 0 };

export function getPolicy() { return { ..._policy }; }

export function setPolicy(updates: Record<string, unknown>) {
  _policy = { ..._policy, ...updates };
  return _policy;
}

export function resetPolicy() {
  _policy = { ...DEFAULT_POLICY };
  return _policy;
}

export function checkPolicy(action: string, context: Record<string, unknown> = {}) {
  _metrics.policyChecks++;
  
  switch (action) {
    case 'load':
      if (Number(context.concurrentLoads) >= _policy.maxConcurrentLoads) {
        _metrics.violations++;
        return { allowed: false, reason: 'max_concurrent_loads' };
      }
      return { allowed: true };
    case 'retry':
      if (Number(context.attempts) >= _policy.retryAttempts) {
        _metrics.violations++;
        return { allowed: false, reason: 'max_retries' };
      }
      return { allowed: true, delay: _policy.retryDelay };
    default:
      return { allowed: true };
  }
}

// P0-FIX: Factory com todos os métodos exigidos pelo MultiContainerOrchestrator
export function createContainerOrchestrationPolicy(options: Record<string, unknown> = {}) {
  const policy = { ...DEFAULT_POLICY, ...options };
  let _snapshotData: Record<string, unknown> | null = null;
  
  return {
    // Métodos originais
    getPolicy: () => ({ ...policy }),
    checkLoad: (context: Record<string, unknown>) => checkPolicy('load', context),
    checkRetry: (context: Record<string, unknown>) => checkPolicy('retry', context),
    getDockMode: () => policy.defaultDockMode,
    getOpenStrategy: () => policy.defaultOpenStrategy,
    
    // P0-FIX: Gerar ID único para container
    generateContainerId(panelId: string) {
      _metrics.containersCreated++;
      return `container-${panelId}-${Date.now().toString(36)}`;
    },
    
    // P0-FIX: Resolver regra de abertura baseada no painel
    resolveOpenRule(panelId: string, options: Record<string, unknown> = {}) {
      const strategy = options.strategy || policy.defaultOpenStrategy;
      const reuse = options.reuse !== false;
      const activate = options.activate !== false;
      
      return {
        strategy,
        reuse,
        activate,
        dockMode: options.dockMode || policy.defaultDockMode,
        panelId
      };
    },
    
    // P0-FIX: Resolver slot de dock
    resolveDockSlot(panelId: string, currentPrimarySlot: unknown = null) {
      // Se já há um primary, usar secondary
      if (currentPrimarySlot === DOCK_MODES.PRIMARY) {
        return DOCK_MODES.SECONDARY;
      }
      return DOCK_MODES.PRIMARY;
    },
    
    // P0-FIX: Snapshot do estado
    snapshot() {
      _snapshotData = {
        policy: { ...policy },
        metrics: { ..._metrics },
        timestamp: Date.now()
      };
      return _snapshotData;
    },
    
    // P0-FIX: Restaurar estado
    restore(data: Record<string, unknown>) {
      if (data?.policy) {
        Object.assign(policy, data.policy);
      }
      _snapshotData = data;
      return true;
    },
    
    // P0-FIX: Info do policy
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        policy: { ...policy },
        metrics: { ..._metrics },
        hasSnapshot: !!_snapshotData
      };
    }
  };
}

export function getMetrics() { return { ..._metrics }; }

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { policyActive: true, violations: _metrics.violations },
    policy: _policy,
    metrics: getMetrics()
  };
}

export default { 
  DOCK_MODES,
  OPEN_STRATEGIES,
  createContainerOrchestrationPolicy,
  getPolicy, 
  setPolicy, 
  resetPolicy, 
  checkPolicy, 
  getMetrics, 
  healthCheck, 
  VERSION, 
  MODULE_ID 
};
