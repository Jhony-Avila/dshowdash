// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-feature-manifest
// PURPOSE: Sidebar Feature Manifest - Declarative Feature Registry
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
//   getFeaturesRequiringElement() — exported function
//   getFeaturesNotRequiringElement() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.1.0-ES6';
export const MODULE_ID = 'sidebar-feature-manifest';

export const FEATURE_CATEGORIES = Object.freeze({
  PERFORMANCE: 'performance',
  CORE: 'core',
  SEARCH: 'search',
  NAVIGATION: 'navigation',
  UI: 'ui',
  ACCESSIBILITY: 'accessibility',
  VISUAL: 'visual',
  DEBUG: 'debug'
});

export const FEATURE_PRIORITIES = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
});

const PRIORITY_MAP = {
  'critical': 0,
  'high': 1,
  'normal': 2,
  'low': 3
};

export const FEATURE_MANIFEST = [
  { id: 'preload-critical-css', path: './features/preload-critical-css.js', category: FEATURE_CATEGORIES.PERFORMANCE, priority: FEATURE_PRIORITIES.CRITICAL, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Pré-carregamento de CSS crítico' },
  { id: 'favorites-handler', path: './features/favorites-handler.js', category: FEATURE_CATEGORIES.CORE, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Gerenciador de favoritos' },
  { id: 'command-palette', path: './features/command-palette.js', category: FEATURE_CATEGORIES.SEARCH, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Paleta de comandos (Ctrl+K)' },
  { id: 'feature-flags', path: './features/feature-flags.js', category: FEATURE_CATEGORIES.CORE, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Sistema de feature flags' },
  { id: 'submenu-handler', path: './features/submenu-handler.js', category: FEATURE_CATEGORIES.NAVIGATION, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Gerenciador de submenus' },
  { id: 'fuzzy-search', path: './features/fuzzy-search.js', category: FEATURE_CATEGORIES.SEARCH, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Busca fuzzy' },
  { id: 'theme-handler', path: './features/theme-handler.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Gerenciador de temas' },
  { id: 'accessibility-landmarks', path: './features/accessibility-landmarks.js', category: FEATURE_CATEGORIES.ACCESSIBILITY, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Landmarks de acessibilidade' },
  { id: 'screen-reader', path: './features/screen-reader.js', category: FEATURE_CATEGORIES.ACCESSIBILITY, priority: FEATURE_PRIORITIES.HIGH, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Suporte a leitores de tela' },
  { id: 'dynamic-badges', path: './features/dynamic-badges.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Badges dinâmicos' },
  { id: 'keyboard-shortcuts-extended', path: './features/keyboard-shortcuts-extended.js', category: FEATURE_CATEGORIES.ACCESSIBILITY, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Atalhos de teclado estendidos' },
  { id: 'notification-dots', path: './features/notification-dots.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Indicadores de notificação' },
  { id: 'highlight-matches', path: './features/highlight-matches.js', category: FEATURE_CATEGORIES.SEARCH, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Destaque de matches na busca' },
  { id: 'context-menu', path: './features/context-menu.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Menu de contexto' },
  { id: 'resize-handler', path: './features/resize-handler.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Gerenciador de redimensionamento' },
  { id: 'auto-theme', path: './features/auto-theme.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: ['theme-handler'], requiresEl: true, description: 'Tema automático' },
  { id: 'compact-mode', path: './features/compact-mode.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Modo compacto' },
  { id: 'mini-mode', path: './features/mini-mode.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Modo mini' },
  { id: 'config-manager', path: './features/config-manager.js', category: FEATURE_CATEGORIES.CORE, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Gerenciador de configuração' },
  { id: 'accordion-ncs', path: './features/accordion-ncs.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Accordion NCS' },
  { id: 'animated-transitions', path: './features/animated-transitions.js', category: FEATURE_CATEGORIES.UI, priority: FEATURE_PRIORITIES.NORMAL, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Transições animadas' },
  { id: 'parallax', path: './features/parallax.js', category: FEATURE_CATEGORIES.VISUAL, priority: FEATURE_PRIORITIES.LOW, enabled: true, dependencies: [] as DynObj[], requiresEl: false, description: 'Efeito parallax' },
  { id: 'debug-panel', path: './features/debug-panel.js', category: FEATURE_CATEGORIES.DEBUG, priority: FEATURE_PRIORITIES.LOW, enabled: true, dependencies: [] as DynObj[], requiresEl: true, description: 'Painel de debug' },
  { id: 'virtual-list', path: './features/virtual-list.js', category: FEATURE_CATEGORIES.PERFORMANCE, priority: FEATURE_PRIORITIES.LOW, enabled: false, dependencies: [] as DynObj[], requiresEl: true, description: 'Lista virtualizada' },
  { id: 'intersection-observer', path: './features/intersection-observer.js', category: FEATURE_CATEGORIES.PERFORMANCE, priority: FEATURE_PRIORITIES.LOW, enabled: false, dependencies: [] as DynObj[], requiresEl: true, description: 'Intersection Observer para lazy load' }
];

export function getFeatureById(id: string) {
  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    if (FEATURE_MANIFEST[i].id === id) return FEATURE_MANIFEST[i];
  }
  return null;
}

export function getFeaturesByCategory(category: string) {
  return FEATURE_MANIFEST.filter(f => f.category === category);
}

export function getFeaturesByPriority(priority: number) {
  const numPriority = typeof priority === 'string' ? (PRIORITY_MAP as Record<string, DynObj>)[priority] : priority;
  return FEATURE_MANIFEST.filter(f => f.priority === numPriority);
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

export function setFeatureEnabled(id: string, enabled: boolean) {
  const feature = getFeatureById(id);
  if (feature) {
    feature.enabled = enabled;
    return { ok: true, featureId: id, enabled };
  }
  return { ok: false, error: 'Feature not found' };
}

export function getAllFeatureIds() {
  return FEATURE_MANIFEST.map(f => f.id);
}

export function getFeaturesRequiringElement() {
  return FEATURE_MANIFEST.filter(f => f.requiresEl);
}

export function getFeaturesNotRequiringElement() {
  return FEATURE_MANIFEST.filter(f => !f.requiresEl);
}

export function validateManifest() {
  const issues = [];
  const ids = {};

  for (let i = 0; i < FEATURE_MANIFEST.length; i++) {
    const f = FEATURE_MANIFEST[i];

    if (!f.id) issues.push({ index: i, error: 'Missing id' });
    if (!f.path) issues.push({ index: i, id: f.id, error: 'Missing path' });
    // @ts-expect-error strict migration — TS2339
    if (!f.category) issues.push({ index: i, id: f.id, error: 'Missing category' });
    // @ts-expect-error strict migration — TS2339
    if (f.priority === undefined) issues.push({ index: i, id: f.id, error: 'Missing priority' });
    if ((ids as Record<string, DynObj>)[f.id]) issues.push({ index: i, id: f.id, error: 'Duplicate id' });
    (ids as Record<string, DynObj>)[f.id] = true;

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

export function info() {
  const byCategory = {};
  const byPriority = {};

  const cats = Object.values(FEATURE_CATEGORIES);
  for (let i = 0; i < cats.length; i++) {
    (byCategory as DynObj)[cats[i]] = getFeaturesByCategory((cats as DynObj)[i]).length;
  }

  (byPriority as DynObj)[FEATURE_PRIORITIES.CRITICAL] = getFeaturesByPriority(FEATURE_PRIORITIES.CRITICAL).length;
  (byPriority as DynObj)[FEATURE_PRIORITIES.HIGH] = getFeaturesByPriority(FEATURE_PRIORITIES.HIGH).length;
  (byPriority as DynObj)[FEATURE_PRIORITIES.NORMAL] = getFeaturesByPriority(FEATURE_PRIORITIES.NORMAL).length;
  (byPriority as DynObj)[FEATURE_PRIORITIES.LOW] = getFeaturesByPriority(FEATURE_PRIORITIES.LOW).length;

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
  getFeaturesRequiringElement,
  getFeaturesNotRequiringElement,
  validateManifest,
  info,
  healthCheck
};
