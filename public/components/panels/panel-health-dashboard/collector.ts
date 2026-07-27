

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-health-dashboard-collector
// PURPOSE: Panel Health Dashboard - Health Collector
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getKernelStatus() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   Via windowAdapter.get() - Ports pattern (strict mode compliant)
// @changelog v8.3.0-STRICT-MODE: Migração para Ports pattern, elimina window.* direto
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-health-dashboard-collector';
export const VERSION = '9.3.0-P2-ENTERPRISE';

// Ports
const _Ports = createCorePorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => _Ports.get(name);

// Helper para obter módulo via Ports ou fallback
function _getModule(moduleName: string) {
  // 1. Tentar via windowAdapter (Ports)
  const wa = _getPort('windowAdapter');
  if (wa && typeof wa.get === 'function') {
    const mod = wa.get(moduleName);
    if (mod) return mod;
  }
  // 2. Fallback para window.* com proteção strict
  const _win = window as unknown as Record<string, unknown>;
  if (typeof window !== 'undefined' && _win[moduleName]) {
    if (isStrict()) {
      recordViolation('WINDOW_GLOBAL_ACCESS', { module: MODULE_ID, accessed: moduleName });
      return null;
    }
    recordViolation('WINDOW_GLOBAL_FALLBACK', { module: MODULE_ID, accessed: moduleName });
    return _win[moduleName];
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function _safeHealthCheck(moduleRef: Record<string, any> | null, moduleName: string) {
  const health: { status: string; score: number | null; version: string | null; checks: Record<string, unknown> } = { status: 'UNAVAILABLE', score: null, version: null, checks: {} };
  
  if (!moduleRef) return health;
  
  try {
    if (typeof moduleRef.healthCheck === 'function') {
      const hc = moduleRef.healthCheck();
      // Handle both sync and async healthCheck
      if (hc && typeof hc.then === 'function') {
        return hc.then((result: Record<string, any>) => _normalizeHealthResult(result, moduleRef)).catch((e: Error) => ({
          status: 'UNHEALTHY',
          score: 0,
          version: moduleRef.VERSION || null,
          checks: { error: e.message }
        }));
      }
      return _normalizeHealthResult(hc, moduleRef);
    } else if (typeof moduleRef.getVersion === 'function') {
      return { status: 'HEALTHY', score: 100, version: moduleRef.getVersion(), checks: { available: true } };
    } else if (moduleRef.VERSION) {
      return { status: 'HEALTHY', score: 100, version: moduleRef.VERSION, checks: { available: true } };
    } else {
      return { status: 'HEALTHY', score: 100, version: null, checks: { available: true } };
    }
  } catch (e: any) {
    return { status: 'UNHEALTHY', score: 0, version: null, checks: { error: e.message } };
  }
}

function _normalizeHealthResult(hc: Record<string, any> | null, moduleRef: Record<string, any>): { status: string; score: number | null; version: string | null; checks: Record<string, unknown>; issues?: unknown[]; features?: unknown; uptime?: number | null } {
  if (!hc) return { status: 'UNKNOWN', score: null, version: moduleRef.VERSION || null, checks: {} };
  
  let score = null;
  if (hc.score !== undefined) {
    if (hc.maxScore !== undefined) {
      score = Math.round((hc.score / hc.maxScore) * 100);
    } else if (typeof hc.score === 'object' && hc.score.percentage !== undefined) {
      score = hc.score.percentage;
    } else if (typeof hc.score === 'number') {
      score = hc.score > 1 ? hc.score : Math.round(hc.score * 100);
    }
  }
  
  return {
    status: hc.status || 'UNKNOWN',
    score,
    version: hc.version || moduleRef.VERSION || null,
    checks: hc.checks || {},
    issues: hc.issues || [],
    features: hc.features || null,
    uptime: hc.uptime || null
  };
}

function _countStatus(snapshot: { summary: Record<string, number> }, health: { status: string }) {
  snapshot.summary.total++;
  if (health.status === 'HEALTHY') snapshot.summary.healthy++;
  else if (health.status === 'DEGRADED') snapshot.summary.degraded++;
  else if (health.status === 'UNHEALTHY' || health.status === 'ERROR') snapshot.summary.unhealthy++;
  else snapshot.summary.unavailable++;
}

// ═══════════════════════════════════════════════════════════════
// KERNEL HEALTH COLLECTION
// ═══════════════════════════════════════════════════════════════

function _collectKernelHealth(kernelRef: Record<string, any> | null, kernelName: string) {
  if (!kernelRef) return null;
  
  try {
    const health = _safeHealthCheck(kernelRef, kernelName);
    
    // Add kernel-specific data
    if (kernelRef.listFeatures) {
      const featuresResult = kernelRef.listFeatures();
      if (featuresResult && featuresResult.ok && featuresResult.data) {
        health.featuresCount = featuresResult.data.count || 0;
        health.features = featuresResult.data.features || [];
      }
    }
    
    if (kernelRef.metrics) {
      const metricsResult = kernelRef.metrics();
      if (metricsResult && metricsResult.ok && metricsResult.data) {
        health.metrics = metricsResult.data;
      }
    }
    
    return health;
  } catch (e: any) {
    return { status: 'UNHEALTHY', score: 0, version: null, checks: { error: e.message } };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN COLLECTOR
// ═══════════════════════════════════════════════════════════════

export async function collectHealthData() {
  const snapshot: {
    overallStatus: string;
    overallScore: number;
    timestamp: number;
    categories: {
      kernels: Record<string, unknown>;
      core: Record<string, unknown>;
      components: Record<string, unknown>;
      panels: Record<string, unknown>;
    };
    summary: Record<string, number>;
  } = {
    overallStatus: 'HEALTHY',
    overallScore: 100,
    timestamp: Date.now(),
    categories: {
      kernels: {},
      core: {},
      components: {},
      panels: {}
    },
    summary: { healthy: 0, degraded: 0, unhealthy: 0, unavailable: 0, total: 0 }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. KERNELS (NEW)
  // ─────────────────────────────────────────────────────────────
  
  const kernelsToCheck = [
    { path: 'MainKernel', name: 'MainKernel' },
    { path: 'SidebarKernel', name: 'SidebarKernel' }
  ];
  
  for (let k = 0; k < kernelsToCheck.length; k++) {
    const kernel = kernelsToCheck[k];
    const kernelRef = _getModule(kernel.path);
    const kernelHealth = _collectKernelHealth(kernelRef, kernel.name);
    
    if (kernelHealth) {
      snapshot.categories.kernels[kernel.name] = kernelHealth;
      _countStatus(snapshot, kernelHealth);
    } else {
      snapshot.categories.kernels[kernel.name] = { status: 'UNAVAILABLE', score: null, version: null };
      snapshot.summary.total++;
      snapshot.summary.unavailable++;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. CORE MODULES
  // ─────────────────────────────────────────────────────────────
  
  const coreModules = [
    { path: 'Logger', name: 'Logger' },
    { path: 'EventBus', name: 'EventBus' },
    { path: 'GlobalState', name: 'GlobalState' },
    { path: 'CoreAuthAdapter', name: 'Auth Adapter' },
    { path: 'HealthAggregator', name: 'Health Aggregator' },
    { path: 'AssetLoader', name: 'Asset Loader' },
    { path: 'RouterGlobal', name: 'Router' }
  ];

  for (let i = 0; i < coreModules.length; i++) {
    const mod = coreModules[i];
    const moduleRef = _getModule(mod.path);
    const health = await _safeHealthCheck(moduleRef, mod.name);
    snapshot.categories.core[mod.name] = health;
    _countStatus(snapshot, health);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. COMPONENTS
  // ─────────────────────────────────────────────────────────────
  
  const componentsToCheck = [
    { path: 'Header', name: 'Header' },
    { path: 'Sidebar', name: 'Sidebar' },
    { path: 'Footer', name: 'Footer' },
    { path: 'MainComponent', name: 'Main' },
    { path: 'NavRail', name: 'NavRail' },
    { path: 'LoginModal', name: 'LoginModal' },
    { path: 'ModalManagerGlobal', name: 'ModalManager' }
  ];

  for (let j = 0; j < componentsToCheck.length; j++) {
    const comp = componentsToCheck[j];
    const compRef = _getModule(comp.path);
    const compHealth = await _safeHealthCheck(compRef, comp.name);
    snapshot.categories.components[comp.name] = compHealth;
    _countStatus(snapshot, compHealth);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. PANELS (from PanelRegistry) - v8.3.0-STRICT-MODE via Ports
  // ─────────────────────────────────────────────────────────────

  const panelRegistry = _getModule('PanelRegistry') || _getModule('panelRegistry');
  if (panelRegistry && panelRegistry.getAll) {
    try {
      const panels = panelRegistry.getAll();
      for (const panelId in panels) {
        if (!panels.hasOwnProperty(panelId)) continue;
        const panel = panels[panelId];
        let pHealth: { status: string; score: number | null; version: string | null; checks?: Record<string, unknown> } = { status: 'UNAVAILABLE', score: null, version: null };
        
        if (panel && panel.healthCheck) {
          try {
            const phc = await panel.healthCheck();
            pHealth = _normalizeHealthResult(phc, panel);
          } catch (pe: any) {
            pHealth = { status: 'UNHEALTHY', score: 0, version: panel.VERSION || null, checks: { error: pe.message } } as any;
          }
        } else if (panel && panel.mounted) {
          pHealth = { status: 'HEALTHY', score: 100, version: panel.VERSION || null };
        }
        
        snapshot.categories.panels[panelId] = pHealth;
        _countStatus(snapshot, pHealth);
      }
    } catch (re: any) {
      (snapshot.categories.panels as any)._error = { status: 'ERROR', message: re.message };
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5. CALCULATE OVERALL STATUS
  // ─────────────────────────────────────────────────────────────
  
  const summary = snapshot.summary;
  if (summary.total > 0) {
    const healthyPercent = (summary.healthy / summary.total) * 100;
    snapshot.overallScore = Math.round(healthyPercent);
    
    if (summary.unhealthy > 0) {
      snapshot.overallStatus = 'UNHEALTHY';
    } else if (summary.degraded > 0 || summary.unavailable > summary.total * 0.3) {
      snapshot.overallStatus = 'DEGRADED';
    } else if (summary.healthy < summary.total) {
      snapshot.overallStatus = 'DEGRADED';
    } else {
      snapshot.overallStatus = 'HEALTHY';
    }
  }

  return snapshot;
}

// ═══════════════════════════════════════════════════════════════
// QUICK KERNEL STATUS (for console use)
// ═══════════════════════════════════════════════════════════════

export function getKernelStatus() {
  const result: { main: Record<string, unknown> | null; sidebar: Record<string, unknown> | null } = { main: null, sidebar: null };
  
  // v8.3.0-STRICT-MODE: Acesso via Ports pattern
  const MainKernel = _getModule('MainKernel');
  if (MainKernel && MainKernel.healthCheck) {
    try {
      const mainHc = MainKernel.healthCheck();
      result.main = {
        status: mainHc.status,
        score: mainHc.score && mainHc.score.percentage ? mainHc.score.percentage : mainHc.score,
        version: mainHc.version || MainKernel.VERSION,
        features: mainHc.features ? Object.keys(mainHc.features).length : 0
      };
    } catch (e: any) {
      result.main = { status: 'ERROR', error: e.message };
    }
  }

  // v8.3.0-STRICT-MODE: Acesso via Ports pattern
  const SidebarKernel = _getModule('SidebarKernel');
  if (SidebarKernel && SidebarKernel.healthCheck) {
    try {
      const sidebarHc = SidebarKernel.healthCheck();
      result.sidebar = {
        status: sidebarHc.status,
        score: sidebarHc.score && sidebarHc.score.percentage ? sidebarHc.score.percentage : sidebarHc.score,
        version: sidebarHc.version || SidebarKernel.VERSION,
        features: sidebarHc.features ? Object.keys(sidebarHc.features).length : 0
      };
    } catch (e: any) {
      result.sidebar = { status: 'ERROR', error: e.message };
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export default {
  MODULE_ID,
  VERSION,
  collectHealthData,
  getKernelStatus,
  info,
  healthCheck
};
