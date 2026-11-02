// UI Orchestrator - Contracts
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 1.1.0-ENTERPRISE
// Definições de tipos, eventos e constantes do UI Orchestrator
'use strict';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'ui-orchestrator.core.contracts';

// ══════════════════════════════════════════════════════════════
// EVENTOS DO ORCHESTRATOR
// ══════════════════════════════════════════════════════════════
export const ORCHESTRATOR_EVENTS = Object.freeze({
  // Lifecycle
  INIT: 'orchestrator:init',
  READY: 'orchestrator:ready',
  ERROR: 'orchestrator:error',
  
  // Intent Resolution
  EMIT: 'orchestrator:emit',
  INTENT_RECEIVED: 'orchestrator:intent:received',
  INTENT_RESOLVED: 'orchestrator:intent:resolved',
  INTENT_FAILED: 'orchestrator:intent:failed',
  INTENT_FALLBACK: 'orchestrator:intent:fallback',
  
  // Actions
  NAVIGATE: 'orchestrator:navigate',
  OPEN_PANEL: 'orchestrator:panel:open',
  CLOSE_PANEL: 'orchestrator:panel:close',
  
  // Manifest
  MANIFEST_LOADED: 'orchestrator:manifest:loaded',
  MANIFEST_UPDATED: 'orchestrator:manifest:updated',
  MANIFEST_ERROR: 'orchestrator:manifest:error'
});

// ══════════════════════════════════════════════════════════════
// REGIÕES DE RENDERIZAÇÃO
// ══════════════════════════════════════════════════════════════
export const REGIONS = Object.freeze({
  MAIN: 'main',
  SIDE: 'side',
  MODAL: 'modal',
  OVERLAY: 'overlay',
  DRAWER: 'drawer',
  TOAST: 'toast'
});

// ══════════════════════════════════════════════════════════════
// TIPOS DE AÇÃO
// ══════════════════════════════════════════════════════════════
export const ACTION_TYPES = Object.freeze({
  NAVIGATE: 'navigate',
  PANEL: 'panel',
  EXTERNAL: 'external',
  ACTION: 'action',
  NOOP: 'noop'
});

// ══════════════════════════════════════════════════════════════
// PRIORIDADES DE RESOLUÇÃO
// ══════════════════════════════════════════════════════════════
export const PRIORITIES = Object.freeze({
  CRITICAL: 100,
  HIGH: 75,
  NORMAL: 50,
  LOW: 25,
  FALLBACK: 0
});

// ══════════════════════════════════════════════════════════════
// SOURCES (Origem dos triggers)
// ══════════════════════════════════════════════════════════════
export const SOURCES = Object.freeze({
  HEADER: 'header',
  SIDEBAR: 'sidebar',
  NAVRAIL: 'navrail',
  FOOTER: 'footer',
  KEYBOARD: 'keyboard',
  URL: 'url',
  API: 'api',
  SYSTEM: 'system'
});

// ══════════════════════════════════════════════════════════════
// SHAPES (Estruturas de dados)
// ══════════════════════════════════════════════════════════════
export const INTENT_SHAPE = Object.freeze({
  id: '',
  source: '',
  action: '',
  payload: {},
  timestamp: 0,
  priority: 50
});

export const PANEL_SHAPE = Object.freeze({
  id: '',
  path: '',
  regions: [],
  requiresAuth: false,
  minLevel: 0,
  preload: false,
  singleton: true
});

export const ROUTE_SHAPE = Object.freeze({
  id: '',
  path: '',
  panel: '',
  region: 'main',
  addressable: true,
  guards: [],
  meta: {}
});

export const RULE_SHAPE = Object.freeze({
  id: '',
  intent: '',
  conditions: [],
  action: 'navigate',
  target: '',
  region: 'main',
  priority: 50,
  fallback: null
});

// ══════════════════════════════════════════════════════════════
// VALIDADORES
// ══════════════════════════════════════════════════════════════
export const isValidIntent = (intent: unknown) => intent && typeof (intent as Record<string, unknown>).id === 'string' && ((intent as Record<string, unknown>).id as string).length > 0;

export const isValidRegion = (region: unknown) => (Object.values(REGIONS) as string[]).indexOf(region as string) >= 0;

export const isValidActionType = (action: unknown) => (Object.values(ACTION_TYPES) as string[]).indexOf(action as string) >= 0;

export const isValidSource = (source: unknown) => (Object.values(SOURCES) as string[]).indexOf(source as string) >= 0;

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
export const createIntent = (id: string, source: string, payload: unknown) => ({
  id,
  source,
  action: ACTION_TYPES.NAVIGATE,
  payload: payload || {},
  timestamp: Date.now(),
  priority: PRIORITIES.NORMAL
});

export const createResolution = (rule: Record<string, unknown>, context: unknown) => ({
  success: true,
  rule,
  action: rule.action,
  target: rule.target,
  region: rule.region,
  context: context || {},
  timestamp: Date.now()
});

// ══════════════════════════════════════════════════════════════
// INFO
// ══════════════════════════════════════════════════════════════
export const getContractInfo = () => ({
  version: VERSION,
  moduleId: MODULE_ID,
  events: Object.keys(ORCHESTRATOR_EVENTS).length,
  regions: Object.keys(REGIONS).length,
  actionTypes: Object.keys(ACTION_TYPES).length,
  sources: Object.keys(SOURCES).length
});

export default Object.freeze({
  VERSION,
  MODULE_ID,
  ORCHESTRATOR_EVENTS,
  REGIONS,
  ACTION_TYPES,
  PRIORITIES,
  SOURCES,
  INTENT_SHAPE,
  PANEL_SHAPE,
  ROUTE_SHAPE,
  RULE_SHAPE,
  isValidIntent,
  isValidRegion,
  isValidActionType,
  isValidSource,
  createIntent,
  createResolution,
  getContractInfo
});
