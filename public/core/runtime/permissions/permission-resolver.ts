// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.permissions.permission-resolver
// PURPOSE: UARPS Soberano - Resolve permissões UMA vez e emite modelo
// ───────────────────────────────────────────────────────────────
// @contract AAA_GOVERNANCE - Single Source of Truth para permissões
// @contract PERMISSIONS_OWNER - Único resolvedor autorizado
// @contract GROUP2_CONSUMER - Módulos consomem modelo, nunca avaliam
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   PERMISSIONS_EVENTS from /core/runtime/events/catalog/permissions.events.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   ACCESS_LEVELS from /core/auth/contracts/auth-contracts.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — inicializa e resolve permissões
//   getModel() — retorna modelo resolvido
//   refresh() — força re-resolução
//   getLevel/getRoles/getCapabilities — accessors
//   check(checkName) — verifica check pré-computado
//   canAccess(minLevel) — verifica acesso
//   filterNavigationItems(items) — filtra itens de navegação
//   subscribe(callback) — subscribe a mudanças
//   destroy() — cleanup
//   healthCheck() — status de saúde
//   info() — informações do módulo
//   injectPorts(p) — inject port dependencies
//
// EMITS:
//   PERMISSIONS_EVENTS.READY — modelo resolvido disponível
//
// @changelog v1.3.0-CLEANUP-FIX: Fix .off() sem handler — passa handler nomeado para cleanup seguro
// @changelog v1.2.0-STRICT-MODE: Strict mode integration in healthCheck/info
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.0.0-ENTERPRISE-AAA: Initial implementation
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { ACCESS_LEVELS } from '/core/auth/contracts/auth-contracts.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION: string = '1.3.0-CLEANUP-FIX';
export const MODULE_ID: string = 'core.runtime.permissions.permission-resolver';

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

interface AuthInfo {
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  email: string | null;
  sessionId: string | null;
}

interface AccessInfo {
  level: number;
  roles: string[];
  capabilities: string[];
}

interface PermissionChecks {
  canNavigate: boolean;
  canShowUI: boolean;
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManagePanels: boolean;
  canAccessSettings: boolean;
  [checkName: string]: boolean;
}

interface PermissionModel {
  resolved: boolean;
  timestamp: number;
  source: string;
  version: string;
  auth: AuthInfo;
  access: AccessInfo;
  checks: PermissionChecks;
  _resolverVersion: string;
  _resolvedBy: string;
  _error?: string;
}

interface AuthAdapter {
  isAuthenticated?: () => boolean;
  getUser?: () => UserInfo | null;
  getLevel?: () => number;
  getRoles?: () => string[];
  getCapabilities?: () => string[];
  getSessionId?: () => string | null;
}

interface UserInfo {
  id?: string;
  userId?: string;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

interface PermissionsGuard {
  can: (permission: string, context?: Record<string, unknown>) => boolean;
  canAccessRoute?: (route: string, context?: Record<string, unknown>) => boolean;
}

interface EventBus {
  on: (event: string, handler: (data: Record<string, unknown>) => void) => (() => void) | void;
  off?: (event: string, handler: (data: Record<string, unknown>) => void) => void;
  emit: (event: string, payload: Record<string, unknown>) => void;
}

interface Logger {
  info: (message: string, data: Record<string, unknown>) => void;
  warn: (message: string, data: Record<string, unknown>) => void;
  error: (message: string, data: Record<string, unknown>) => void;
  debug: (message: string, data: Record<string, unknown>) => void;
  [level: string]: ((message: string, data: Record<string, unknown>) => void) | undefined;
}

interface InitResult {
  ok: boolean;
  alreadyInitialized?: boolean;
  model?: PermissionModel | null;
}

interface NavigationItem {
  minLevel?: number;
  permission?: string;
  permissions?: string[];
  requiredRole?: string;
  [key: string]: unknown;
}

interface ResolverMetrics {
  resolveCount: number;
  resolveErrors: number;
  emitCount: number;
  subscriptionCount: number;
  lastResolvedAt: number | null;
  lastEmittedAt: number | null;
  authEventsReceived: number;
  cacheHits: number;
}

interface ResolverHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  maxScore: number;
  scoreDisplay: string;
  checks: Record<string, boolean>;
  moduleId: string;
  version: string;
  strictMode: boolean;
  portsInitialized: boolean;
  metrics: ResolverMetrics;
  timestamp: number;
}

interface ResolverInfo {
  moduleId: string;
  version: string;
  strictMode: boolean;
  initialized: boolean;
  resolved: boolean;
  model: Record<string, unknown> | null;
  listenersActive: number;
  subscribersCount: number;
  portsInitialized: boolean;
  metrics: ResolverMetrics;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string): unknown { return _Ports.get(name); }
export function injectPorts(p: Record<string, unknown>): boolean { return _Ports.inject(p); }
export function getPorts(): Record<string, unknown> { return _Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// LOGGER
// ═══════════════════════════════════════════════════════════════

const _log = (level: string, message: string, data?: Record<string, unknown>): void => {
  const prefix: string = `[${MODULE_ID}]`;
  const logger = _getPort('logger') as Logger | null;
  if (logger && typeof logger[level] === 'function') {
    (logger[level] as (message: string, data: Record<string, unknown>) => void)(`${prefix} ${message}`, data || {});
  }
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

let _initialized: boolean = false;
let _resolved: boolean = false;
let _resolving: boolean = false;
let _model: PermissionModel | null = null;
let _cleanups: Array<(() => void)> = [];
const _subscribers: Set<(model: PermissionModel) => void> = new Set();

const _metrics: ResolverMetrics = {
  resolveCount: 0,
  resolveErrors: 0,
  emitCount: 0,
  subscriptionCount: 0,
  lastResolvedAt: null,
  lastEmittedAt: null,
  authEventsReceived: 0,
  cacheHits: 0
};

// ═══════════════════════════════════════════════════════════════
// PERMISSION MODEL (o modelo resolvido que módulos consomem)
// ═══════════════════════════════════════════════════════════════

function _createEmptyModel(): PermissionModel {
  return {
    resolved: false,
    timestamp: 0,
    source: MODULE_ID,
    version: VERSION,
    auth: {
      isAuthenticated: false,
      userId: null,
      username: null,
      email: null,
      sessionId: null
    },
    access: {
      level: ACCESS_LEVELS.NONE,
      roles: [],
      capabilities: []
    },
    checks: {
      canNavigate: false,
      canShowUI: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canManagePanels: false,
      canAccessSettings: false
    },
    _resolverVersion: VERSION,
    _resolvedBy: MODULE_ID
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTH SOURCE RESOLUTION
// ═══════════════════════════════════════════════════════════════

function _getAuthAdapter(): AuthAdapter | null {
  // 1. Via Ports (preferencial)
  const auth = _getPort('auth') as AuthAdapter | null;
  if (auth && typeof auth.getLevel === 'function') {
    return auth;
  }

  // 2. Via window globals (fallback)
  if (typeof window !== 'undefined') {
    const _win = window as unknown as Record<string, unknown>;
    if (_win.AuthAdapter && typeof (_win.AuthAdapter as AuthAdapter).getLevel === 'function') {
      return _win.AuthAdapter as AuthAdapter;
    }
    if (_win.CoreAuthAdapter && typeof (_win.CoreAuthAdapter as AuthAdapter).getLevel === 'function') {
      return _win.CoreAuthAdapter as AuthAdapter;
    }
  }

  return null;
}

function _getPermissionsGuard(): PermissionsGuard | null {
  // 1. Via Ports
  const guard = _getPort('permissionsGuard') as PermissionsGuard | null;
  if (guard && typeof guard.can === 'function') {
    return guard;
  }

  // 2. Via window globals
  if (typeof window !== 'undefined') {
    const _win = window as unknown as Record<string, unknown>;
    if (_win.__AUTH_STACK__) {
      const authStack = _win.__AUTH_STACK__ as Record<string, unknown>;
      if (authStack.permissionsGuard && typeof (authStack.permissionsGuard as PermissionsGuard).can === 'function') {
        return authStack.permissionsGuard as PermissionsGuard;
      }
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// RESOLVE (core logic)
// ═══════════════════════════════════════════════════════════════

function _resolve(): PermissionModel {
  if (_resolving) {
    _log('debug', 'Already resolving, skipping');
    return _model!;
  }

  _resolving = true;
  _metrics.resolveCount++;

  try {
    const auth: AuthAdapter | null = _getAuthAdapter();
    const guard: PermissionsGuard | null = _getPermissionsGuard();
    const model: PermissionModel = _createEmptyModel();

    if (!auth) {
      _log('warn', 'AuthAdapter not available - emitting empty model');
      model.resolved = true;
      model.timestamp = Date.now();
      _model = model;
      _resolved = true;
      _resolving = false;
      return model;
    }

    // Auth state
    const isAuthenticated: boolean = auth.isAuthenticated ? auth.isAuthenticated() : false;
    const user: UserInfo | null = auth.getUser ? auth.getUser() : null;
    const level: number = auth.getLevel ? auth.getLevel() : ACCESS_LEVELS.NONE;
    const roles: string[] = auth.getRoles ? auth.getRoles() : [];
    const capabilities: string[] = auth.getCapabilities ? auth.getCapabilities() : [];

    model.auth.isAuthenticated = isAuthenticated;
    model.auth.userId = user ? (user.id || user.userId || null) : null;
    model.auth.username = user ? (user.username || null) : null;
    model.auth.email = user ? (user.email || null) : null;
    model.auth.sessionId = auth.getSessionId ? auth.getSessionId() : null;

    // Access
    model.access.level = level;
    model.access.roles = roles.slice();
    model.access.capabilities = capabilities.slice();

    // Pre-computed checks (para que UI nunca precise avaliar)
    const authContext: Record<string, unknown> = {
      isAuthenticated,
      roles,
      capabilities,
      level
    };

    if (guard) {
      model.checks.canNavigate = isAuthenticated;
      model.checks.canShowUI = isAuthenticated;
      model.checks.canAccessAdmin = guard.canAccessRoute ? guard.canAccessRoute('/admin', authContext) : false;
      model.checks.canManageUsers = guard.can('users:manage', authContext) || guard.can('users:edit', authContext);
      model.checks.canManagePanels = guard.can('panels:manage', authContext);
      model.checks.canAccessSettings = guard.can('system:config', authContext) || level >= ACCESS_LEVELS.ADMIN;
    } else {
      // Sem guard: inferir dos dados do auth
      model.checks.canNavigate = isAuthenticated;
      model.checks.canShowUI = isAuthenticated;
      model.checks.canAccessAdmin = level >= ACCESS_LEVELS.ADMIN;
      model.checks.canManageUsers = level >= ACCESS_LEVELS.ADMIN;
      model.checks.canManagePanels = level >= ACCESS_LEVELS.MANAGER;
      model.checks.canAccessSettings = level >= ACCESS_LEVELS.ADMIN;
    }

    model.resolved = true;
    model.timestamp = Date.now();

    _model = model;
    _resolved = true;
    _metrics.lastResolvedAt = Date.now();

    _log('info', 'Permission model resolved', {
      authenticated: isAuthenticated,
      level,
      rolesCount: roles.length,
      capabilitiesCount: capabilities.length
    } as Record<string, unknown>);

    return model;

  } catch (error: unknown) {
    _metrics.resolveErrors++;
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    _log('error', 'Resolve failed', { error: errorMessage });

    const fallbackModel: PermissionModel = _createEmptyModel();
    fallbackModel.resolved = true;
    fallbackModel.timestamp = Date.now();
    fallbackModel._error = errorMessage;
    _model = fallbackModel;
    _resolved = true;

    return fallbackModel;

  } finally {
    _resolving = false;
  }
}

// ═══════════════════════════════════════════════════════════════
// EMIT (emite o modelo resolvido via PERMISSIONS_EVENTS)
// ═══════════════════════════════════════════════════════════════

function _emit(model: PermissionModel): void {
  const eb = _getPort('eventBus') as EventBus | null;
  if (!eb || typeof eb.emit !== 'function') {
    _log('warn', 'EventBus not available - cannot emit PERMISSIONS_EVENTS');
    return;
  }

  const payload: Record<string, unknown> = {
    model,
    source: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };

  eb.emit(PERMISSIONS_EVENTS.READY, payload);
  _metrics.emitCount++;
  _metrics.lastEmittedAt = Date.now();

  _log('info', 'PERMISSIONS_EVENTS.READY emitted', {
    authenticated: model.auth.isAuthenticated,
    level: model.access.level,
    checks: model.checks
  } as Record<string, unknown>);

  // Notificar subscribers internos
  _subscribers.forEach((fn: (model: PermissionModel) => void) => {
    try { fn(model); } catch (e: unknown) {
      const msg: string = e instanceof Error ? e.message : String(e);
      _log('error', 'Subscriber error', { error: msg });
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// AUTH EVENT LISTENERS (escuta AUTH_EVENTS e re-resolve)
// ═══════════════════════════════════════════════════════════════

function _setupAuthListeners(): void {
  const eb = _getPort('eventBus') as EventBus | null;
  if (!eb || typeof eb.on !== 'function') {
    _log('warn', 'EventBus not available - cannot listen to AUTH_EVENTS');
    return;
  }

  const authEventsToWatch: string[] = [
    AUTH_EVENTS.LOGIN_SUCCESS,
    AUTH_EVENTS.SESSION_STARTED,
    AUTH_EVENTS.LOGOUT,
    AUTH_EVENTS.STATE_CHANGED,
    AUTH_EVENTS.SESSION_EXPIRED,
    AUTH_EVENTS.PERMISSIONS_CHANGED,
    AUTH_EVENTS.USER_UPDATED
  ];

  authEventsToWatch.forEach((eventName: string) => {
    const handler = (data: Record<string, unknown>): void => {
      _metrics.authEventsReceived++;
      _log('debug', 'Auth event received, re-resolving', { event: eventName });

      const model: PermissionModel = _resolve();
      _emit(model);
    };

    const cleanup = eb.on(eventName, handler);

    if (typeof cleanup === 'function') {
      _cleanups.push(cleanup);
    } else {
      _cleanups.push(() => {
        if (eb.off) { eb.off(eventName, handler); }
      });
    }
  });

  _log('info', 'Auth listeners setup', { count: authEventsToWatch.length });
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Inicializa o resolver e faz a primeira resolução
 */
export function init(): InitResult {
  if (_initialized) {
    _log('debug', 'Already initialized');
    return { ok: true, alreadyInitialized: true, model: _model };
  }

  _log('info', 'Initializing Permission Resolver...');

  // Resolver imediatamente
  const model: PermissionModel = _resolve();

  // Setup listeners para re-resolver quando auth mudar
  _setupAuthListeners();

  // Emitir modelo inicial
  _emit(model);

  _initialized = true;

  _log('info', 'Permission Resolver initialized', {
    resolved: model.resolved,
    authenticated: model.auth.isAuthenticated,
    level: model.access.level,
    listenersCount: _cleanups.length
  } as Record<string, unknown>);

  return { ok: true, model };
}

/**
 * Retorna o modelo resolvido atual (sem re-resolver)
 * Se não inicializado, inicializa automaticamente
 */
export function getModel(): PermissionModel {
  if (!_initialized) {
    init();
  }
  if (_model) {
    _metrics.cacheHits++;
  }
  return _model || _createEmptyModel();
}

/**
 * Força re-resolução e emissão
 */
export function refresh(): PermissionModel {
  const model: PermissionModel = _resolve();
  _emit(model);
  return model;
}

/**
 * Verifica se está resolvido
 */
export function isResolved(): boolean {
  return _resolved;
}

/**
 * Retorna o nível de acesso resolvido
 */
export function getLevel(): number {
  const model: PermissionModel = getModel();
  return model.access.level;
}

/**
 * Retorna as roles resolvidas
 */
export function getRoles(): string[] {
  const model: PermissionModel = getModel();
  return model.access.roles.slice();
}

/**
 * Retorna as capabilities resolvidas
 */
export function getCapabilities(): string[] {
  const model: PermissionModel = getModel();
  return model.access.capabilities.slice();
}

/**
 * Verifica um check pré-computado
 */
export function check(checkName: string): boolean {
  const model: PermissionModel = getModel();
  return model.checks[checkName] === true;
}

/**
 * Verifica se pode acessar com base no minLevel
 */
export function canAccess(minLevel?: number): boolean {
  const model: PermissionModel = getModel();
  return model.access.level >= (minLevel || 0);
}

/**
 * Filtra itens de navegação com base no modelo resolvido
 * Centraliza a lógica que antes estava duplicada em Sidebar e Nav-Rail
 */
export function filterNavigationItems(items: NavigationItem[]): NavigationItem[] {
  if (!Array.isArray(items)) return [];

  const model: PermissionModel = getModel();
  const level: number = model.access.level;
  const capabilities: string[] = model.access.capabilities;
  const roles: string[] = model.access.roles;

  return items.filter((item: NavigationItem) => {
    // Filtro por nível
    if (item.minLevel && level < item.minLevel) return false;

    // Filtro por permissão específica
    if (item.permission) {
      if (!capabilities.includes(item.permission)) return false;
    }

    // Filtro por array de permissões (qualquer uma)
    if (item.permissions && item.permissions.length > 0) {
      const hasAny: boolean = item.permissions.some((p: string) => capabilities.includes(p) || roles.includes(p));
      if (!hasAny) return false;
    }

    // Filtro por role requerida
    if (item.requiredRole) {
      if (!roles.includes(item.requiredRole)) return false;
    }

    return true;
  });
}

/**
 * Subscribe para mudanças no modelo
 */
export function subscribe(callback: (model: PermissionModel) => void): () => void {
  if (typeof callback !== 'function') return () => {};
  _subscribers.add(callback);
  _metrics.subscriptionCount++;
  return () => { _subscribers.delete(callback); };
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════

export function destroy(): void {
  _cleanups.forEach((cleanup: () => void) => {
    try { if (typeof cleanup === 'function') cleanup(); } catch (e: unknown) {}
  });
  _cleanups = [];
  _subscribers.clear();
  _model = null;
  _resolved = false;
  _resolving = false;
  _initialized = false;
  _log('info', 'Permission Resolver destroyed');
}

// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════

export function info(): ResolverInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    initialized: _initialized,
    resolved: _resolved,
    model: _model ? {
      authenticated: _model.auth.isAuthenticated,
      level: _model.access.level,
      rolesCount: _model.access.roles.length,
      capabilitiesCount: _model.access.capabilities.length,
      checks: _model.checks,
      resolvedAt: _model.timestamp
    } as Record<string, unknown> : null,
    listenersActive: _cleanups.length,
    subscribersCount: _subscribers.size,
    portsInitialized: _Ports.isInitialized(),
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function healthCheck(): ResolverHealthCheck {
  const checks: Record<string, boolean> = {
    initialized: _initialized,
    resolved: _resolved,
    hasModel: !!_model,
    modelValid: _model ? _model.resolved === true : false,
    authAdapterAvailable: !!_getAuthAdapter(),
    eventBusAvailable: !!(_getPort('eventBus')),
    noResolveErrors: _metrics.resolveErrors === 0,
    portsInitialized: _Ports.isInitialized()
  };

  let passed: number = 0;
  let total: number = 0;
  for (const key in checks) {
    total++;
    if (checks[key]) passed++;
  }

  let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
  if (!checks.initialized || !checks.resolved) status = 'UNHEALTHY';
  else if (_metrics.resolveErrors > 0 || !checks.authAdapterAvailable) status = 'DEGRADED';

  return {
    status,
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    portsInitialized: _Ports.isInitialized(),
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  // Lifecycle
  init,
  destroy,
  refresh,
  // Model access
  getModel,
  isResolved,
  // Convenience accessors
  getLevel,
  getRoles,
  getCapabilities,
  check,
  canAccess,
  // Navigation filter (centralizado)
  filterNavigationItems,
  // Subscription
  subscribe,
  // Diagnostics
  info,
  healthCheck,
  // Ports
  injectPorts,
  getPorts
};
