const VERSION = "1.5.0-ENTERPRISE";
const MODULE_ID = "main-feature-manifest";
const FEATURE_CATEGORIES = Object.freeze({
  NAVIGATION: "navigation",
  UI: "ui",
  OBSERVABILITY: "observability",
  PERSISTENCE: "persistence",
  UX: "ux",
  PERFORMANCE: "performance",
  ERROR_HANDLING: "error-handling",
  ANALYTICS: "analytics",
  SESSION: "session"
});
const FEATURE_PRIORITIES = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
});
const FEATURE_MANIFEST = [
  // ─────────────────────────────────────────────────────────────
  // CRITICAL (0) - Auto-enabled no boot
  // ─────────────────────────────────────────────────────────────
  {
    id: "error-boundary",
    path: "../features/error-boundary/index.js",
    category: FEATURE_CATEGORIES.ERROR_HANDLING,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [],
    description: "Captura centralizada de erros em features e componentes"
  },
  {
    id: "observability-hooks",
    path: "../features/observability-hooks/index.js",
    category: FEATURE_CATEGORIES.OBSERVABILITY,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [],
    description: "Hooks para m\xE9tricas, tracing e logging centralizados"
  },
  {
    id: "navigation-hooks",
    path: "../features/navigation-hooks/index.js",
    category: FEATURE_CATEGORIES.NAVIGATION,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [],
    description: "Hooks para interceptar e reagir a eventos de navega\xE7\xE3o"
  },
  {
    id: "persistence-sync",
    path: "../features/persistence-sync/index.js",
    category: FEATURE_CATEGORIES.PERSISTENCE,
    priority: FEATURE_PRIORITIES.CRITICAL,
    enabled: true,
    dependencies: [],
    description: "Sincroniza\xE7\xE3o autom\xE1tica de estado com localStorage"
  },
  // ─────────────────────────────────────────────────────────────
  // HIGH (1) - Auto-enabled no boot
  // ─────────────────────────────────────────────────────────────
  {
    id: "ux-feedback",
    path: "../features/ux-feedback/index.js",
    category: FEATURE_CATEGORIES.UX,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [],
    description: "Feedback visual para a\xE7\xF5es do usu\xE1rio (toasts)"
  },
  {
    id: "analytics-tracker",
    path: "../features/analytics-tracker/index.js",
    category: FEATURE_CATEGORIES.ANALYTICS,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [],
    description: "Rastreamento de m\xE9tricas de uso e performance"
  },
  {
    id: "preload-manager",
    path: "../features/preload-manager/index.js",
    category: FEATURE_CATEGORIES.PERFORMANCE,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [],
    description: "Pr\xE9-carregamento inteligente de pain\xE9is e recursos"
  },
  {
    id: "session-sync",
    path: "../features/session-sync/index.js",
    category: FEATURE_CATEGORIES.SESSION,
    priority: FEATURE_PRIORITIES.HIGH,
    enabled: true,
    dependencies: [],
    description: "Sincroniza\xE7\xE3o de sess\xE3o entre abas e janelas"
  }
];
function getFeatureById(id) {
  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    if (FEATURE_MANIFEST[i].id === id) return FEATURE_MANIFEST[i];
  }
  return null;
}
function getFeaturesByCategory(category) {
  return FEATURE_MANIFEST.filter((f) => f.category === category);
}
function getFeaturesByPriority(priority) {
  return FEATURE_MANIFEST.filter((f) => f.priority === priority);
}
function getFeaturesSortedByPriority() {
  return FEATURE_MANIFEST.slice().sort((a, b) => a.priority - b.priority);
}
function getCriticalFeatures() {
  return FEATURE_MANIFEST.filter((f) => f.priority === FEATURE_PRIORITIES.CRITICAL);
}
function getEnabledFeatures() {
  return FEATURE_MANIFEST.filter((f) => f.enabled !== false);
}
function getDisabledFeatures() {
  return FEATURE_MANIFEST.filter((f) => f.enabled === false);
}
function isFeatureEnabled(id) {
  const feature = getFeatureById(id);
  return feature ? feature.enabled !== false : false;
}
function setFeatureEnabled(id, enabled) {
  const feature = getFeatureById(id);
  if (feature) {
    feature.enabled = enabled;
    return { ok: true, featureId: id, enabled };
  }
  return { ok: false, error: "Feature not found" };
}
function getAllFeatureIds() {
  return FEATURE_MANIFEST.map((f) => f.id);
}
function validateManifest() {
  const issues = [];
  const ids = {};
  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    const feature = FEATURE_MANIFEST[i];
    if (ids[feature.id]) {
      issues.push({ featureId: feature.id, error: "Duplicate ID" });
    }
    ids[feature.id] = true;
    if (!feature.id) issues.push({ featureId: "unknown", error: "Missing id" });
    if (!feature.path) issues.push({ featureId: feature.id, error: "Missing path" });
    if (feature.priority === void 0) issues.push({ featureId: feature.id, error: "Missing priority" });
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
function info() {
  const byCategory = {};
  const byPriority = {};
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
function healthCheck() {
  const validation = validateManifest();
  return {
    status: validation.valid ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    totalFeatures: FEATURE_MANIFEST.length,
    enabledFeatures: getEnabledFeatures().length,
    criticalFeatures: getCriticalFeatures().length,
    validation,
    timestamp: Date.now()
  };
}
var feature_manifest_default = {
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
export {
  FEATURE_CATEGORIES,
  FEATURE_MANIFEST,
  FEATURE_PRIORITIES,
  MODULE_ID,
  VERSION,
  feature_manifest_default as default,
  getAllFeatureIds,
  getCriticalFeatures,
  getDisabledFeatures,
  getEnabledFeatures,
  getFeatureById,
  getFeaturesByCategory,
  getFeaturesByPriority,
  getFeaturesSortedByPriority,
  healthCheck,
  info,
  isFeatureEnabled,
  setFeatureEnabled,
  validateManifest
};
