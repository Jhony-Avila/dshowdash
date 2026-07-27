

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-feature-manifest
// PURPOSE: Main Feature Manifest
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FEATURE_CATEGORIES — exported value
//   FEATURE_PRIORITIES — exported value
//   FEATURE_MANIFEST — exported value
//   getFeatureById() — exported function
//   getFeaturesByCategory() — exported function
//   getFeaturesByPriority() — exported function
//   getFeaturesSortedByPriority() — exported function
//   getCriticalFeatures() — exported function
//   getEnabledFeatures() — exported function
//   getDisabledFeatures() — exported function
//   isFeatureEnabled() — exported function
//   setFeatureEnabled() — exported function
//   getAllFeatureIds() — exported function
//   validateManifest() — exported function
//   info() — exported function
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

export const VERSION = '1.5.0-ENTERPRISE';
export const MODULE_ID = 'main-feature-manifest';

// ═══════════════════════════════════════════════════════════════
// CATEGORIAS E PRIORIDADES
// ═══════════════════════════════════════════════════════════════

export const FEATURE_CATEGORIES = Object.freeze({
  NAVIGATION: 'navigation',
  UI: 'ui',
  OBSERVABILITY: 'observability',
  PERSISTENCE: 'persistence',
  UX: 'ux',
  PERFORMANCE: 'performance',
  ERROR_HANDLING: 'error-handling',
  ANALYTICS: 'analytics',
  SESSION: 'session'
});

export const FEATURE_PRIORITIES = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
});

// ═══════════════════════════════════════════════════════════════
// MANIFEST DE FEATURES
// ═══════════════════════════════════════════════════════════════

export const FEATURE_MANIFEST = [
  // ─────────────────────────────────────────────────────────────
  // CRITICAL (0) - Auto-enabled no boot
  // ─────────────────────────────────────────────────────────────
  {
    id: 'error-boundary',
    path: '../features/error-boundary/index.js',
    category: FEATURE_CATEGORIES.ERROR_HANDLING,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [] as string[],
    description: 'Captura centralizada de erros em features e componentes'
  },
  {
    id: 'observability-hooks',
    path: '../features/observability-hooks/index.js',
    category: FEATURE_CATEGORIES.OBSERVABILITY,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [] as string[],
    description: 'Hooks para métricas, tracing e logging centralizados'
  },
  {
    id: 'navigation-hooks',
    path: '../features/navigation-hooks/index.js',
    category: FEATURE_CATEGORIES.NAVIGATION,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [] as string[],
    description: 'Hooks para interceptar e reagir a eventos de navegação'
  },
  {
    id: 'persistence-sync',
    path: '../features/persistence-sync/index.js',
    category: FEATURE_CATEGORIES.PERSISTENCE,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [] as string[],
    description: 'Sincronização automática de estado com localStorage'
  },
  
  // ─────────────────────────────────────────────────────────────
  // HIGH (1) - Auto-enabled no boot
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ux-feedback',
    path: '../features/ux-feedback/index.js',
    category: FEATURE_CATEGORIES.UX,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [] as string[],
    description: 'Feedback visual para ações do usuário (toasts)'
  },
  {
    id: 'analytics-tracker',
    path: '../features/analytics-tracker/index.js',
    category: FEATURE_CATEGORIES.ANALYTICS,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [] as string[],
    description: 'Rastreamento de métricas de uso e performance'
  },
  {
    id: 'preload-manager',
    path: '../features/preload-manager/index.js',
    category: FEATURE_CATEGORIES.PERFORMANCE,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [] as string[],
    description: 'Pré-carregamento inteligente de painéis e recursos'
  },
  {
    id: 'session-sync',
    path: '../features/session-sync/index.js',
    category: FEATURE_CATEGORIES.SESSION,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [] as string[],
    description: 'Sincronização de sessão entre abas e janelas'
  }
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export function getFeatureById(id: string) {
  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    if (FEATURE_MANIFEST[i].id === id) return FEATURE_MANIFEST[i];
  }
  return null;
}

export function getFeaturesByCategory(category: unknown) {
  return FEATURE_MANIFEST.filter(f => f.category === category);
}

export function getFeaturesByPriority(priority: number) {
  return FEATURE_MANIFEST.filter(f => f.priority === priority);
}

export function getFeaturesSortedByPriority() {
  return FEATURE_MANIFEST.slice().sort((a, b) => a.priority - b.priority);
}

export function getCriticalFeatures() {
  return FEATURE_MANIFEST.filter(f => f.priority === FEATURE_PRIORITIES.CRITICAL);
}

export function getEnabledFeatures() {
  return FEATURE_MANIFEST.filter(f => f.enabled !== false);
}

export function getDisabledFeatures() {
  return FEATURE_MANIFEST.filter(f => f.enabled === false);
}

export function isFeatureEnabled(id: string) {
  const feature = getFeatureById(id);
  return feature ? feature.enabled !== false : false;
}

export function setFeatureEnabled(id: string, enabled: unknown) {
  const feature = getFeatureById(id);
  if (feature) {
// @ts-expect-error TS migration - TS2322
    feature.enabled = enabled;
    return { ok: true, featureId: id, enabled };
  }
  return { ok: false, error: 'Feature not found' };
}

export function getAllFeatureIds() {
  return FEATURE_MANIFEST.map(f => f.id);
}

export function validateManifest() {
  const issues = [];
  const ids: Record<string, boolean> = {};
  
  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    const feature = FEATURE_MANIFEST[i];
    
    if (ids[feature.id]) {
      issues.push({ featureId: feature.id, error: 'Duplicate ID' });
    }
    ids[feature.id] = true;
    
    if (!feature.id) issues.push({ featureId: 'unknown', error: 'Missing id' });
    if (!feature.path) issues.push({ featureId: feature.id, error: 'Missing path' });
    // @ts-expect-error strict migration — TS2339
    if (feature.priority === undefined) issues.push({ featureId: feature.id, error: 'Missing priority' });
    
    const deps = feature.dependencies || [];
    for (let j = 0; j < deps.length; j++) {
      let depFound = false;
      for (let k = 0; k < FEATURE_MANIFEST.length; k++) {
        if (FEATURE_MANIFEST[k].id === deps[j]) {
          depFound = true;
          break;
        }
      }
      if (!depFound) {
        issues.push({ featureId: feature.id, error: `Dependency not found: ${deps[j]}` });
      }
    }
  }
  
  return { valid: issues.length === 0, issues, totalFeatures: FEATURE_MANIFEST.length };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function info() {
  const byCategory: Record<string, number> = {};
  const byPriority: Record<number, number> = {};
  
  const cats = Object.values(FEATURE_CATEGORIES);
  for (let i = 0; i < cats.length; i++) {
    byCategory[cats[i]] = getFeaturesByCategory(cats[i]).length;
  }
  
  const pris = Object.values(FEATURE_PRIORITIES);
  for (let j = 0; j < pris.length; j++) {
    byPriority[pris[j]] = getFeaturesByPriority(pris[j]).length;
  }
  
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalFeatures: FEATURE_MANIFEST.length,
    enabledFeatures: getEnabledFeatures().length,
    disabledFeatures: getDisabledFeatures().length,
    criticalFeatures: getCriticalFeatures().length,
    byCategory,
    byPriority,
    validation: validateManifest()
  };
}

export function healthCheck() {
  const validation = validateManifest();
  return {
    status: validation.valid ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    totalFeatures: FEATURE_MANIFEST.length,
    enabledFeatures: getEnabledFeatures().length,
    criticalFeatures: getCriticalFeatures().length,
    validation,
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  FEATURE_CATEGORIES,
  FEATURE_PRIORITIES,
  FEATURE_MANIFEST,
  getFeatureById,
  getFeaturesByCategory,
  getFeaturesByPriority,
  getFeaturesSortedByPriority,
  getCriticalFeatures,
  getEnabledFeatures,
  getDisabledFeatures,
  isFeatureEnabled,
  setFeatureEnabled,
  getAllFeatureIds,
  validateManifest,
  info,
  healthCheck
};
