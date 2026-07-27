// Events Contracts - Fonte Canônica
// @version 1.1.0-ENTERPRISE
// FONTE ÚNICA DE VERDADE para AUTH_EVENTS e ROUTER_EVENTS
// v1.1.0: Adicionado LAYOUT_CHANGED
// Migrado para TypeScript: 2026-02-25

// ═══════════════════════════════════════════════════════════════
// TIPOS GLOBAIS PARA INTEROP COM WINDOW
// ═══════════════════════════════════════════════════════════════

declare global {
  interface Window {
    SessionManager?: {
      isAuthenticated?: () => boolean;
      getCurrentUser?: () => { id?: string | number; name?: string; username?: string; level?: string; role?: string; permissions?: string[]; roles?: string[]; [key: string]: unknown } | null;
      getSession?: () => unknown;
      logout?: () => Promise<void>;
      refresh?: () => Promise<unknown>;
      [key: string]: unknown;
    };
    GlobalState?: {
      get: (path: string) => unknown;
      [key: string]: unknown;
    };
    PermissionsGuard?: {
      getUserLevel: () => number | string;
      getUserRoles?: () => string[];
      hasPermission?: (permission: string) => boolean;
      [key: string]: unknown;
    };
    TokenManager?: {
      getAccessToken?: () => string | null;
      getRefreshToken?: () => string | null;
      setTokens?: (accessToken: string | null, refreshToken: string | null) => void;
      clearTokens?: () => void;
      isTokenValid?: () => boolean;
      getTokenExpiry?: () => number | null;
      [key: string]: unknown;
    };
    RouterGlobal?: {
      getRoutes?: () => Array<{ path: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };
    APP_CONFIG?: {
      app?: { debug?: boolean; environment?: string; [key: string]: unknown };
      api?: { baseUrl?: string; [key: string]: unknown };
      features?: Record<string, boolean>;
      [key: string]: unknown;
    };
    ConfigLoader?: Record<string, unknown>;
    EventBus?: {
      emit: (event: string, data?: unknown) => boolean;
      on: (event: string, handler: (data?: unknown) => void) => (() => void);
      off: (event: string, handler: (data?: unknown) => void) => void;
      once: (event: string, handler: (data?: unknown) => void) => (() => void);
      [key: string]: unknown;
    };
    Telemetry?: {
      track?: (event: string, data?: Record<string, unknown>) => unknown;
      startSpan?: (name: string, context?: Record<string, unknown>) => { end: () => void };
      getMetrics?: () => Record<string, unknown>;
      event?: (name: string, data?: Record<string, unknown>) => void;
      [key: string]: unknown;
    };
    TelemetryCore?: {
      track?: (event: string, data?: Record<string, unknown>) => unknown;
      startSpan?: (name: string, context?: Record<string, unknown>) => { end: () => void };
      getMetrics?: () => Record<string, unknown>;
      [key: string]: unknown;
    };
    Sparkline?: new (el: HTMLElement, data: number[], options?: Record<string, unknown>) => unknown;
    __dev?: Record<string, unknown>;
    headerAPI?: Record<string, unknown>;
  }
}

export const VERSION = '1.1.0-ENTERPRISE' as const;
export const MODULE_ID = 'events-contracts' as const;

export function getVersion(): string { return VERSION; }
export function getModuleId(): string { return MODULE_ID; }

// ═══════════════════════════════════════════════════════════════
// AUTH EVENTS - Contratos de Autenticação
// ═══════════════════════════════════════════════════════════════
export const AUTH_EVENTS = {
  // Login
  LOGIN_SUCCESS: 'auth:login:success',
  LOGIN_FAILURE: 'auth:login:failure',
  LOGIN_REQUIRED: 'auth:login:required',
  LOGIN_START: 'auth:login:start',

  // Logout
  LOGOUT: 'auth:logout',
  LOGOUT_SUCCESS: 'auth:logout:success',
  LOGOUT_START: 'auth:logout:start',

  // Session
  SESSION_CHECKED: 'auth:session:checked',
  SESSION_EXPIRED: 'auth:session:expired',
  SESSION_RENEWED: 'auth:session:renewed',
  SESSION_INVALID: 'auth:session:invalid',

  // State
  AUTH_READY: 'auth:ready',
  AUTH_STATE_CHANGED: 'auth:state:changed',

  // Token
  TOKEN_REFRESHED: 'auth:token:refreshed',
  TOKEN_EXPIRED: 'auth:token:expired',

  // User
  USER_LOADED: 'auth:user:loaded',
  USER_UPDATED: 'auth:user:updated',

  // Permissions
  PERMISSIONS_LOADED: 'auth:permissions:loaded',
  PERMISSIONS_CHANGED: 'auth:permissions:changed',

  // Errors
  ERROR: 'auth:error',
  NETWORK_ERROR: 'auth:network:error'
} as const;

export type AuthEventKey = keyof typeof AUTH_EVENTS;
export type AuthEventValue = typeof AUTH_EVENTS[AuthEventKey];

// ═══════════════════════════════════════════════════════════════
// AUTH STATES - Estados de Autenticação
// ═══════════════════════════════════════════════════════════════
export const AUTH_STATES = {
  UNKNOWN: 'unknown',
  CHECKING: 'checking',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
  EXPIRED: 'expired'
} as const;

export type AuthState = typeof AUTH_STATES[keyof typeof AUTH_STATES];

// ═══════════════════════════════════════════════════════════════
// AUTH DATA ATTRIBUTES - Atributos DOM
// ═══════════════════════════════════════════════════════════════
export const AUTH_DATA_ATTRIBUTES = {
  AUTH_READY: 'data-auth-ready',
  AUTH_STATE: 'data-state',
  USER_LEVEL: 'data-user-level',
  USER_ID: 'data-user-id'
} as const;

export type AuthDataAttribute = typeof AUTH_DATA_ATTRIBUTES[keyof typeof AUTH_DATA_ATTRIBUTES];

// ═══════════════════════════════════════════════════════════════
// ROUTER EVENTS - Contratos de Navegação
// ═══════════════════════════════════════════════════════════════
export const ROUTER_EVENTS = {
  // Navigation
  NAVIGATE: 'router:navigate',
  NAVIGATE_START: 'router:navigate:start',
  NAVIGATE_END: 'router:navigate:end',
  NAVIGATE_ERROR: 'router:navigate:error',
  NAVIGATE_CANCEL: 'router:navigate:cancel',

  // Route
  ROUTE_CHANGED: 'router:route:changed',
  ROUTE_NOT_FOUND: 'router:route:not-found',
  ROUTE_FORBIDDEN: 'router:route:forbidden',

  // Guards
  GUARD_CHECK: 'router:guard:check',
  GUARD_BLOCK: 'router:guard:block',
  GUARD_PASS: 'router:guard:pass',

  // History
  HISTORY_PUSH: 'router:history:push',
  HISTORY_REPLACE: 'router:history:replace',
  HISTORY_POP: 'router:history:pop',

  // State
  READY: 'router:ready',
  INITIALIZED: 'router:initialized',
  ERROR: 'router:error',

  // Canvas (multi-panel)
  CANVAS_NAVIGATE: 'router:canvas:navigate',
  CANVAS_UPDATE: 'router:canvas:update',

  // Layout
  LAYOUT_CHANGED: 'router:layout:changed'
} as const;

export type RouterEventKey = keyof typeof ROUTER_EVENTS;
export type RouterEventValue = typeof ROUTER_EVENTS[RouterEventKey];

// ═══════════════════════════════════════════════════════════════
// INTERFACES DE VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════

export interface EventContractValidation {
  valid: boolean;
  missing: string[];
  authEvents: number;
  routerEvents: number;
}

export interface ContractsInfo {
  version: string;
  moduleId: string;
  authEventsCount: number;
  routerEventsCount: number;
  authStatesCount: number;
  validation: EventContractValidation;
}

export interface EventsHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  maxScore: number;
  scoreDisplay: string;
  version: string;
  moduleId: string;
  contracts: {
    authEvents: number;
    routerEvents: number;
    valid: boolean;
  };
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE VERIFICAÇÃO
// ═══════════════════════════════════════════════════════════════

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.body?.dataset?.authReady === 'true') {
    return document.body?.dataset?.state === 'authenticated';
  }
  if (typeof window !== 'undefined' && window.SessionManager?.isAuthenticated) {
    return window.SessionManager.isAuthenticated();
  }
  if (typeof window !== 'undefined' && window.GlobalState?.get) {
    const authState = window.GlobalState.get('auth.isAuthenticated');
    if (typeof authState === 'boolean') return authState;
  }
  return false;
}

export function isAuthenticatedFromDOM(): boolean {
  if (typeof document === 'undefined') return false;
  const authReady = document.body?.dataset?.authReady;
  const state = document.body?.dataset?.state;
  return authReady === 'true' && state === 'authenticated';
}

export function getAuthState(): AuthState {
  if (typeof document === 'undefined') return AUTH_STATES.UNKNOWN;
  const authReady = document.body?.dataset?.authReady;
  const state = document.body?.dataset?.state;
  if (authReady !== 'true') return AUTH_STATES.CHECKING;
  switch (state) {
    case 'authenticated': return AUTH_STATES.AUTHENTICATED;
    case 'unauthenticated': return AUTH_STATES.UNAUTHENTICATED;
    case 'error': return AUTH_STATES.ERROR;
    case 'expired': return AUTH_STATES.EXPIRED;
    default: return AUTH_STATES.UNKNOWN;
  }
}

export function getUserLevel(): number {
  if (typeof document === 'undefined') return 0;
  const domLevel = document.body?.dataset?.userLevel;
  if (domLevel) return parseInt(domLevel, 10) || 0;
  if (typeof window !== 'undefined' && window.PermissionsGuard?.getUserLevel) {
    return Number(window.PermissionsGuard.getUserLevel());
  }
  if (typeof window !== 'undefined' && window.GlobalState?.get) {
    return (window.GlobalState.get('user.level') as number) || 0;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════
// VALIDAÇÃO DE CONTRATOS
// ═══════════════════════════════════════════════════════════════

export function validateEventContracts(): EventContractValidation {
  const requiredAuthEvents: AuthEventKey[] = ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_REQUIRED', 'LOGOUT', 'SESSION_CHECKED', 'AUTH_READY'];
  const requiredRouterEvents: RouterEventKey[] = ['NAVIGATE', 'ROUTE_CHANGED', 'READY', 'ERROR', 'LAYOUT_CHANGED'];
  const missingAuth = requiredAuthEvents.filter(e => !AUTH_EVENTS[e]);
  const missingRouter = requiredRouterEvents.filter(e => !ROUTER_EVENTS[e]);
  return {
    valid: missingAuth.length === 0 && missingRouter.length === 0,
    missing: [...missingAuth, ...missingRouter],
    authEvents: Object.keys(AUTH_EVENTS).length,
    routerEvents: Object.keys(ROUTER_EVENTS).length
  };
}

export function getRequiredEvents(): { auth: AuthEventKey[]; router: RouterEventKey[] } {
  return {
    auth: ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_REQUIRED', 'LOGOUT', 'SESSION_CHECKED', 'AUTH_READY'],
    router: ['NAVIGATE', 'ROUTE_CHANGED', 'READY', 'ERROR', 'LAYOUT_CHANGED']
  };
}

export function getContractsInfo(): ContractsInfo {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    authEventsCount: Object.keys(AUTH_EVENTS).length,
    routerEventsCount: Object.keys(ROUTER_EVENTS).length,
    authStatesCount: Object.keys(AUTH_STATES).length,
    validation: validateEventContracts()
  };
}

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

export function healthCheck(): EventsHealthCheck {
  const validation = validateEventContracts();
  return {
    status: validation.valid ? 'HEALTHY' : 'DEGRADED',
    score: validation.valid ? 10 : 5,
    maxScore: 10,
    scoreDisplay: validation.valid ? '10/10' : '5/10',
    version: VERSION,
    moduleId: MODULE_ID,
    contracts: {
      authEvents: Object.keys(AUTH_EVENTS).length,
      routerEvents: Object.keys(ROUTER_EVENTS).length,
      valid: validation.valid
    },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  AUTH_EVENTS,
  AUTH_STATES,
  AUTH_DATA_ATTRIBUTES,
  ROUTER_EVENTS,
  isAuthenticated,
  isAuthenticatedFromDOM,
  getAuthState,
  getUserLevel,
  validateEventContracts,
  getRequiredEvents,
  getContractsInfo,
  healthCheck,
  getVersion,
  getModuleId
};
