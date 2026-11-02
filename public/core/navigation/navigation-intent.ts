// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.navigation.navigation-intent
// PURPOSE: Modelo formal de intenção de navegação
// ───────────────────────────────────────────────────────────────
// PROVIDES: INTENT_TYPES, NAV_MODES, INTENT_STATUS, createIntent, validateIntent
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.2.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'core.navigation.navigation-intent';
const VERSION = '1.3.0-P2-ENTERPRISE';

// Intent Types
const INTENT_TYPES = { ROUTE: 'route', PANEL: 'panel', BACK: 'back', FORWARD: 'forward', HOME: 'home', EXTERNAL: 'external' };

// Navigation Modes
const NAV_MODES = { SOFT: 'soft', HARD: 'hard', REPLACE: 'replace' };

// Intent Status
const INTENT_STATUS = { PENDING: 'pending', RESOLVED: 'resolved', EXECUTING: 'executing', SUCCESS: 'success', BLOCKED: 'blocked', ERROR: 'error' };

// Counter para IDs únicos
let _intentCounter = 0;

// Criar Intent ID único
const createIntentId = (): string => { _intentCounter++; return `nav-${Date.now().toString(36)}-${_intentCounter.toString(36)}`; };

export interface NavigationIntentTarget {
  type?: string;
  value?: string | null;
  panelId?: string | null;
  path?: string;
  route?: string;
}

export interface NavigationIntentMeta {
  source?: string;
  region?: string | null;
  correlationId?: string | null;
  userId?: string | null;
  tenantId?: string | null;
  reason?: string | null;
  timestamp?: number;
  [key: string]: unknown;
}

export interface NavigationIntentState {
  query?: unknown;
  filters?: unknown;
  viewState?: unknown;
  [key: string]: unknown;
}

export interface NavigationIntentPolicy {
  enforceGuards?: boolean;
  requireAuth?: boolean;
  permissions?: string[];
  [key: string]: unknown;
}

export interface NavigationIntentOptions {
  target?: NavigationIntentTarget;
  intentId?: string;
  mode?: string;
  replace?: boolean;
  meta?: NavigationIntentMeta;
  state?: NavigationIntentState;
  policy?: NavigationIntentPolicy;
}

export interface NavigationIntent {
  intentId: string;
  type: string;
  target: { type: string; value: string | null; panelId: string | null };
  mode: string;
  replace: boolean;
  meta: NavigationIntentMeta;
  state: NavigationIntentState;
  policy: NavigationIntentPolicy;
  status: string;
  result: unknown;
  createdAt: number;
  resolvedAt: number | null;
  executedAt: number | null;
}

// Factory: Criar NavigationIntent
const createIntent = (options: NavigationIntentOptions = {}): NavigationIntent => {
  const target = options.target || {};
  return {
    intentId: options.intentId || createIntentId(),
    type: target.type || INTENT_TYPES.ROUTE,
    target: { type: target.type || INTENT_TYPES.ROUTE, value: target.value || target.path || target.route || '#/', panelId: target.panelId || null },
    mode: options.mode || NAV_MODES.SOFT,
    replace: options.replace === true,
    meta: { source: options.meta?.source || 'unknown', region: options.meta?.region || null, correlationId: options.meta?.correlationId || null, userId: options.meta?.userId || null, tenantId: options.meta?.tenantId || null, reason: options.meta?.reason || null, timestamp: Date.now() },
    state: { query: options.state?.query || null, filters: options.state?.filters || null, viewState: options.state?.viewState || null },
    policy: { enforceGuards: options.policy?.enforceGuards !== false, requireAuth: options.policy?.requireAuth === true, permissions: (options.policy?.permissions as string[]) || [] },
    status: INTENT_STATUS.PENDING,
    result: null,
    createdAt: Date.now(),
    resolvedAt: null,
    executedAt: null
  };
};

// Factory: Criar Intent de rota
const createRouteIntent = (path: string, options: { mode?: string; replace?: boolean; meta?: NavigationIntentMeta; state?: NavigationIntentState; policy?: NavigationIntentPolicy } = {}): NavigationIntent => createIntent({ target: { type: INTENT_TYPES.ROUTE, value: path }, mode: options.mode || NAV_MODES.SOFT, replace: options.replace, meta: options.meta, state: options.state, policy: options.policy });

// Factory: Criar Intent de painel
const createPanelIntent = (panelId: string, options: { mode?: string; replace?: boolean; meta?: NavigationIntentMeta; state?: NavigationIntentState; policy?: NavigationIntentPolicy } = {}): NavigationIntent => createIntent({ target: { type: INTENT_TYPES.PANEL, value: `#/panel/${panelId}`, panelId }, mode: options.mode || NAV_MODES.SOFT, replace: options.replace, meta: options.meta, state: options.state, policy: options.policy });

// Factory: Criar Intent de back
const createBackIntent = (options: { meta?: NavigationIntentMeta } = {}): NavigationIntent => createIntent({ target: { type: INTENT_TYPES.BACK, value: null }, mode: NAV_MODES.SOFT, meta: options.meta });

// Factory: Criar Intent de forward
const createForwardIntent = (options: { meta?: NavigationIntentMeta } = {}): NavigationIntent => createIntent({ target: { type: INTENT_TYPES.FORWARD, value: null }, mode: NAV_MODES.SOFT, meta: options.meta });

// Factory: Criar Intent de home
const createHomeIntent = (options: { meta?: NavigationIntentMeta } = {}): NavigationIntent => createIntent({ target: { type: INTENT_TYPES.HOME, value: '#/' }, mode: NAV_MODES.SOFT, meta: options.meta });

// Validar Intent
const validateIntent = (intent: NavigationIntent): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (!intent) { errors.push('Intent is null'); return { valid: false, errors }; }
  if (!intent.intentId) errors.push('Missing intentId');
  if (!intent.target) errors.push('Missing target');
  if (intent.target && !intent.target.type) errors.push('Missing target.type');
  if (intent.target?.type === INTENT_TYPES.ROUTE && !intent.target.value) errors.push('Route intent requires target.value');
  if (intent.target?.type === INTENT_TYPES.PANEL && !intent.target.panelId) errors.push('Panel intent requires target.panelId');
  return { valid: errors.length === 0, errors };
};

// Serializar Intent (para auditoria/replay)
const serializeIntent = (intent: NavigationIntent): string | null => { try { return JSON.stringify(intent); } catch (e) { return null; } };

// Deserializar Intent
const deserializeIntent = (json: string | NavigationIntent): NavigationIntent | null => { try { return typeof json === 'string' ? JSON.parse(json) : json; } catch (e) { return null; } };

// Clone Intent
const cloneIntent = (intent: NavigationIntent): NavigationIntent | null => deserializeIntent(serializeIntent(intent) as string);

// Info
const info = () => ({ moduleId: MODULE_ID, version: VERSION, intentTypes: INTENT_TYPES, navModes: NAV_MODES, intentStatus: INTENT_STATUS, counter: _intentCounter });

// HealthCheck
const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { intentTypesReady: Object.keys(INTENT_TYPES).length > 0, navModesReady: Object.keys(NAV_MODES).length > 0, factoriesReady: typeof createIntent === 'function' } });

// Exports
export { MODULE_ID, VERSION, INTENT_TYPES, NAV_MODES, INTENT_STATUS, createIntentId, createIntent, createRouteIntent, createPanelIntent, createBackIntent, createForwardIntent, createHomeIntent, validateIntent, serializeIntent, deserializeIntent, cloneIntent, info, healthCheck };
export default { MODULE_ID, VERSION, INTENT_TYPES, NAV_MODES, INTENT_STATUS, createIntent, createRouteIntent, createPanelIntent, createBackIntent, createForwardIntent, createHomeIntent, validateIntent, serializeIntent, deserializeIntent, cloneIntent, info, healthCheck };
