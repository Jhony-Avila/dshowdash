const VERSION = "4.1.0-ES6";
const MODULE_ID = "sidebar-feature-manifest";
const FEATURE_CATEGORIES = Object.freeze({
  PERFORMANCE: "performance",
  CORE: "core",
  SEARCH: "search",
  NAVIGATION: "navigation",
  UI: "ui",
  ACCESSIBILITY: "accessibility",
  VISUAL: "visual",
  DEBUG: "debug"
});
const FEATURE_PRIORITIES = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
});
const PRIORITY_MAP = {
  "critical": 0,
  "high": 1,
  "normal": 2,
  "low": 3
};
const FEATURE_MANIFEST = [
  { id: "preload-critical-css", path: "./features/preload-critical-css.js", category: FEATURE_CATEGORIES.PERFORMANCE, priority: FEATURE_PRIORITIES.CRITICAL, enabled: true, dependencies: [], requiresEl: false, description: "Pr\xE9-carregamento de CSS cr\xEDtico" },
  { id: "favorites-handler", path: "./features/favorites-handler.js", category: FEATURE_CATEGORIES.CORE, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: false, description: "Gerenciador de favoritos" },
  { id: "command-palette", path: "./features/command-palette.js", category: FEATURE_CATEGORIES.SEARCH, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: false, description: "Paleta de comandos (Ctrl+K)" },
  { id: "feature-flags", path: "./features/feature-flags.js", category: FEATURE_CATEGORIES.CORE, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: false, description: "Sistema de feature flags" },
  { id: "submenu-handler", path: "./features/submenu-handler.js", category: FEATURE_CATEGORIES.NAVIGATION, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: false, description: "Gerenciador de submenus" },
  { id: "fuzzy-search", path: "./features/fuzzy-search.js", category: FEATURE_CATEGORIES.SEARCH, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: false, description: "Busca fuzzy" },
  { id: "theme-handler", path: "./features/theme-handler.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: true, description: "Gerenciador de temas" },
  { id: "accessibility-landmarks", path: "./features/accessibility-landmarks.js", category: FEATURE_CATEGORIES.ACCESSIBILITY, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: true, description: "Landmarks de acessibilidade" },
  { id: "screen-reader", path: "./features/screen-reader.js", category: FEATURE_CATEGORIES.ACCESSIBILITY, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [], requiresEl: true, description: "Suporte a leitores de tela" },
  { id: "dynamic-badges", path: "./features/dynamic-badges.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Badges din\xE2micos" },
  { id: "keyboard-shortcuts-extended", path: "./features/keyboard-shortcuts-extended.js", category: FEATURE_CATEGORIES.ACCESSIBILITY, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: false, description: "Atalhos de teclado estendidos" },
  { id: "notification-dots", path: "./features/notification-dots.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Indicadores de notifica\xE7\xE3o" },
  { id: "highlight-matches", path: "./features/highlight-matches.js", category: FEATURE_CATEGORIES.SEARCH, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Destaque de matches na busca" },
  { id: "context-menu", path: "./features/context-menu.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Menu de contexto" },
  { id: "resize-handler", path: "./features/resize-handler.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Gerenciador de redimensionamento" },
  { id: "auto-theme", path: "./features/auto-theme.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: ["theme-handler"], requiresEl: true, description: "Tema autom\xE1tico" },
  { id: "compact-mode", path: "./features/compact-mode.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Modo compacto" },
  { id: "mini-mode", path: "./features/mini-mode.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Modo mini" },
  { id: "config-manager", path: "./features/config-manager.js", category: FEATURE_CATEGORIES.CORE, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: false, description: "Gerenciador de configura\xE7\xE3o" },
  { id: "accordion-ncs", path: "./features/accordion-ncs.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: false, description: "Accordion NCS" },
  { id: "animated-transitions", path: "./features/animated-transitions.js", category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [], requiresEl: true, description: "Transi\xE7\xF5es animadas" },
  { id: "parallax", path: "./features/parallax.js", category: FEATURE_CATEGORIES.VISUAL, priority: FEATURE_PRIORITIES.LOW, enabled: true, dependencies: [], requiresEl: false, description: "Efeito parallax" },
  { id: "debug-panel", path: "./features/debug-panel.js", category: FEATURE_CATEGORIES.DEBUG, priority: FEATURE_PRIORITIES.LOW, enabled: true, dependencies: [], requiresEl: true, description: "Painel de debug" },
  { id: "virtual-list", path: "./features/virtual-list.js", category: FEATURE_CATEGORIES.PERFORMANCE, priority: FEATURE_PRIORITIES.LOW, enabled: false, dependencies: [], requiresEl: true, description: "Lista virtualizada" },
  { id: "intersection-observer", path: "./features/intersection-observer.js", category: FEATURE_CATEGORIES.PERFORMANCE, priority: FEATURE_PRIORITIES.LOW, enabled: false, dependencies: [], requiresEl: true, description: "Intersection Observer para lazy load" }
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
  const numPriority = typeof priority === "string" ? PRIORITY_MAP[priority] : priority;
  return FEATURE_MANIFEST.filter((f) => f.priority === numPriority);
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
function getFeaturesRequiringElement() {
  return FEATURE_MANIFEST.filter((f) => f.requiresEl);
}
function getFeaturesNotRequiringElement() {
  return FEATURE_MANIFEST.filter((f) => !f.requiresEl);
}
function validateManifest() {
  const issues = [];
  const ids = {};
  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    const f = FEATURE_MANIFEST[i];
    if (!f.id) issues.push({ index: i, error: "Missing id" });
    if (!f.path) issues.push({ index: i, id: f.id, error: "Missing path" });
    if (!f.category) issues.push({ index: i, id: f.id, error: "Missing category" });
    if (f.priority === void 0) issues.push({ index: i, id: f.id, error: "Missing priority" });
    if (ids[f.id]) issues.push({ index: i, id: f.id, error: "Duplicate id" });
    ids[f.id] = true;
    const deps = f.dependencies || [];
    for (let j = 0; j < deps.length; j++) {
      let depFound = false;
      for (let k = 0; k < FEATURE_MANIFEST.length; k++) {
        if (FEATURE_MANIFEST[k].id === deps[j]) {
          depFound = true;
          break;
        }
      }
      if (!depFound) {
        issues.push({ index: i, id: f.id, error: `Dependency not found: ${deps[j]}` });
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
  byPriority[FEATURE_PRIORITIES.CRITICAL] = getFeaturesByPriority(FEATURE_PRIORITIES.CRITICAL).length;
  byPriority[FEATURE_PRIORITIES.HIGH] = getFeaturesByPriority(FEATURE_PRIORITIES.HIGH).length;
  byPriority[FEATURE_PRIORITIES.NORMAL] = getFeaturesByPriority(FEATURE_PRIORITIES.NORMAL).length;
  byPriority[FEATURE_PRIORITIES.LOW] = getFeaturesByPriority(FEATURE_PRIORITIES.LOW).length;
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalFeatures: FEATURE_MANIFEST.length,
    enabledFeatures: getEnabledFeatures().length,
    disabledFeatures: getDisabledFeatures().length,
    criticalFeatures: getCriticalFeatures().length,
    requiresElement: getFeaturesRequiringElement().length,
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
  getFeaturesRequiringElement,
  getFeaturesNotRequiringElement,
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
  getFeaturesNotRequiringElement,
  getFeaturesRequiringElement,
  getFeaturesSortedByPriority,
  healthCheck,
  info,
  isFeatureEnabled,
  setFeatureEnabled,
  validateManifest
};
