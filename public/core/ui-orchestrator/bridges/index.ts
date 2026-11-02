// UI Orchestrator - Bridges Index
// DEPENDENCY CONTRACT — BARREL FILE
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.2.1-ENTERPRISE - Removed sidebar-bridge (functionality moved to main-engine/listeners.js)
// @changelog v1.2.0-ENTERPRISE - ES6 modernization (const/let, arrow functions, async/await)
// Exporta todos os bridges para inicialização centralizada
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export { default as RouterBridge } from './router-bridge.js';
export { default as PanelBridge } from './panel-bridge.js';
export { default as UIActionBridge } from './ui-action-bridge.js';

export const VERSION = '2.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.bridges';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _metrics: { initCount: number; initErrors: number; lastInitAt: number | null } = { initCount: 0, initErrors: 0, lastInitAt: null };

const _log = (level: string, message: string, data: Record<string, unknown> = {}) => {
  const logger = _getPort('logger');
  if (logger?.[level]) logger[level](`[${MODULE_ID}] ${message}`, data);
};

// Inicialização em lote
export async function initAllBridges(options: Record<string, unknown>) {
  options = options || {};
  _initPorts();
  if (options.ports) injectPorts(options.ports as Record<string, unknown>);
  
  try {
    const routerModule = await import('./router-bridge.js');
    const panelModule = await import('./panel-bridge.js');
    const uiActionModule = await import('./ui-action-bridge.js');
    
    const RouterBridge = routerModule.default || routerModule;
    const PanelBridge = panelModule.default || panelModule;
    const UIActionBridge = uiActionModule.default || uiActionModule;
    
    const results: Record<string, unknown> = {
      router: RouterBridge.init ? RouterBridge.init(options) : { success: false, error: 'No init' },
      panel: PanelBridge.init ? PanelBridge.init(options) : { success: false, error: 'No init' },
      uiAction: UIActionBridge.init ? UIActionBridge.init(options) : { success: false, error: 'No init' }
    };
    
    _metrics.initCount++;
    _metrics.lastInitAt = Date.now();
    
    const allSuccess = (results.router as Record<string, unknown>).success && (results.panel as Record<string, unknown>).success && (results.uiAction as Record<string, unknown>).success;
    
    // Registrar no window para acesso global
    if (typeof window !== 'undefined') {
      window.__ORCHESTRATOR_BRIDGES__ = {
        router: RouterBridge,
        panel: PanelBridge,
        uiAction: UIActionBridge
      };
    }
    
    _log('info', 'All bridges initialized', { results });
    
    return { success: allSuccess, results };
    
  } catch (error: any) {
    _metrics.initErrors++;
    _log('error', 'initAllBridges failed', { error: error.message });
    return { success: false, error: error.message, results: null as Record<string, unknown> | null };
  }
}

export function healthCheckAll() {
  const hasWindow = typeof window !== 'undefined';
  const bridges = hasWindow ? window.__ORCHESTRATOR_BRIDGES__ : null;
  
  return {
    router: bridges && bridges.router && bridges.router.healthCheck ? bridges.router.healthCheck() : null,
    panel: bridges && bridges.panel && bridges.panel.healthCheck ? bridges.panel.healthCheck() : null,
    uiAction: bridges && bridges.uiAction && bridges.uiAction.healthCheck ? bridges.uiAction.healthCheck() : null
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    bridges: ['router', 'panel', 'uiAction'],
    metrics: Object.assign({}, _metrics),
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const allHealth = healthCheckAll();
  
  const checks: Record<string, boolean> = {
    moduleLoaded: true,
    routerBridgeAvailable: allHealth.router !== null,
    panelBridgeAvailable: allHealth.panel !== null,
    uiActionBridgeAvailable: allHealth.uiAction !== null,
    lowErrorRate: _metrics.initErrors === 0,
    portsInitialized: Ports.isInitialized()
  };

  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (passed < total * 0.5) status = 'UNHEALTHY';
  else if (passed < total) status = 'DEGRADED';
  
  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    bridges: allHealth,
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export default {
  initAllBridges,
  healthCheckAll,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
