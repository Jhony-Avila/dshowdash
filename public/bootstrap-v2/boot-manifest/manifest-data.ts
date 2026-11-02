// Boot Manifest - Data
// @version 1.3.0-ROUTER-FIX
// @description Dados declarativos do manifest de boot
// @changelog v1.3.0-ROUTER-FIX: router-global movido de Phase 1 para Phase 3 (reflete realidade do código)
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: TIMEOUTS, DEGRADATION_MODES from ./constants.js
// PROVIDES: BOOT_MANIFEST — declarative phase configuration
// WINDOW ACCESS: None (pure data)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TIMEOUTS, DEGRADATION_MODES } from './constants.js';

export const VERSION = '1.3.0-ROUTER-FIX';
export const MODULE_ID = 'boot-manifest:data';
export const MANIFEST_VERSION = '1.3.0';

// Manifest declarativo de fases
export const BOOT_MANIFEST = {
  version: VERSION,
  manifestVersion: MANIFEST_VERSION,

  // Configurações globais
  global: {
    defaultTimeout: TIMEOUTS.DEFAULT_PHASE,
    defaultModuleTimeout: TIMEOUTS.DEFAULT_MODULE,
    defaultRetry: { enabled: true, maxAttempts: 2, delay: 1000, backoff: 1.5 },
    telemetryEnabled: true,
    loggingEnabled: true,
    strictMode: false
  },

  // Definição declarativa das fases
  phases: [
    {
      id: 'phase-0-critical',
      name: 'Critical Infrastructure',
      description: 'EventBus, Logger, Config, ErrorBoundary, SecurityCSRF, Environment',
      order: 0,
      dependsOn: [] as string[],
      critical: true,
      recoverable: false,
      parallel: false,
      timeout: TIMEOUTS.PHASE_CRITICAL,
      retry: { enabled: false, maxAttempts: 1 },
      onFail: {
        mode: DEGRADATION_MODES.HALT,
        message: 'Critical infrastructure failed - boot cannot continue',
        disable: ['*'],
        allow: [] as string[]
      },
      modules: [
        { id: 'eventbus', critical: true, timeout: TIMEOUTS.MODULE_EVENTBUS },
        { id: 'logger', critical: true, timeout: TIMEOUTS.MODULE_LOGGER },
        { id: 'error-boundary', critical: true, timeout: TIMEOUTS.MODULE_ERROR_BOUNDARY },
        { id: 'config', critical: true, timeout: TIMEOUTS.MODULE_CONFIG },
        { id: 'security-csrf', critical: false, timeout: TIMEOUTS.MODULE_SECURITY },
        { id: 'environment', critical: false, timeout: TIMEOUTS.MODULE_ENVIRONMENT }
      ],
      healthWeight: 30
    },
    {
      id: 'phase-1-core',
      name: 'Core Services',
      description: 'GlobalState, ReadyFlags, TelemetryCore, ContextProvider',
      order: 1,
      dependsOn: ['phase-0-critical'],
      critical: true,
      recoverable: true,
      parallel: false,
      timeout: TIMEOUTS.PHASE_CORE,
      retry: { enabled: true, maxAttempts: 2, delay: 1000 },
      onFail: {
        mode: DEGRADATION_MODES.DEGRADED,
        message: 'Core services degraded - limited functionality',
        disable: ['platform'],
        allow: ['shell', 'auth', 'main', 'ui']
      },
      modules: [
        { id: 'global-state', critical: true, timeout: TIMEOUTS.MODULE_GLOBAL_STATE },
        { id: 'ready-flags', critical: false, timeout: TIMEOUTS.MODULE_READY_FLAGS },
        { id: 'telemetry-core', critical: false, timeout: TIMEOUTS.MODULE_TELEMETRY },
        { id: 'context-provider', critical: false, timeout: (TIMEOUTS as any).MODULE_CONTEXT_PROVIDER || TIMEOUTS.DEFAULT_MODULE }
      ],
      healthWeight: 25
    },
    {
      id: 'phase-2-auth',
      name: 'Authentication',
      description: 'SessionManager, AuthOrchestrator, LoginModal',
      order: 2,
      dependsOn: ['phase-1-core'],
      critical: true,
      recoverable: true,
      parallel: false,
      timeout: TIMEOUTS.PHASE_AUTH,
      retry: { enabled: true, maxAttempts: 2, delay: 1500 },
      onFail: {
        mode: DEGRADATION_MODES.ALLOW_LOGIN_ONLY,
        message: 'Auth failed - login only mode',
        disable: ['shell', 'main', 'ui', 'platform'],
        allow: ['login-modal']
      },
      modules: [
        { id: 'session-manager', critical: true, timeout: TIMEOUTS.MODULE_SESSION },
        { id: 'auth-orchestrator', critical: true, timeout: TIMEOUTS.MODULE_AUTH },
        { id: 'login-modal', critical: false, timeout: TIMEOUTS.MODULE_LOGIN }
      ],
      healthWeight: 20
    },
    {
      id: 'phase-3-shell',
      name: 'Shell & Navigation',
      description: 'AppShell, Header, NavRail, Footer, Router integration',
      order: 3,
      dependsOn: ['phase-2-auth'],
      critical: true,
      recoverable: true,
      parallel: false,
      timeout: TIMEOUTS.PHASE_SHELL,
      retry: { enabled: true, maxAttempts: 2, delay: 1000 },
      onFail: {
        mode: DEGRADATION_MODES.ALLOW_SHELL_ONLY,
        message: 'Shell degraded - basic navigation only',
        disable: ['main', 'ui', 'platform'],
        allow: ['header', 'footer', 'login']
      },
      suppressWhenUnauth: true,
      modules: [
        { id: 'app-shell', critical: true, timeout: TIMEOUTS.MODULE_APP_SHELL },
        { id: 'router-global', critical: true, timeout: TIMEOUTS.MODULE_ROUTER, suppressWhenUnauth: true },
        { id: 'header', critical: false, timeout: TIMEOUTS.MODULE_HEADER },
        { id: 'nav-rail', critical: false, timeout: TIMEOUTS.MODULE_NAV },
        { id: 'footer', critical: false, timeout: TIMEOUTS.MODULE_FOOTER }
      ],
      healthWeight: 10
    },
    {
      id: 'phase-4-main',
      name: 'Main Content',
      description: 'Main Engine, ContainerMain, Panel system',
      order: 4,
      dependsOn: ['phase-3-shell'],
      critical: true,
      recoverable: true,
      parallel: false,
      timeout: TIMEOUTS.PHASE_MAIN,
      retry: { enabled: true, maxAttempts: 2, delay: 1000 },
      onFail: {
        mode: DEGRADATION_MODES.DEGRADED,
        message: 'Main content degraded - panels may not load',
        disable: ['platform'],
        allow: ['shell', 'ui']
      },
      requiresAuth: true,
      deferWhenUnauth: true,
      modules: [
        { id: 'main-engine', critical: true, timeout: TIMEOUTS.MODULE_MAIN_ENGINE },
        { id: 'container-main', critical: false, timeout: TIMEOUTS.MODULE_CONTAINER }
      ],
      healthWeight: 8
    },
    {
      id: 'phase-5-ui',
      name: 'UI Components',
      description: 'UIOrchestrator, Toast, Ticker, Preloader fade',
      order: 5,
      dependsOn: ['phase-4-main'],
      critical: false,
      recoverable: true,
      parallel: true,
      timeout: TIMEOUTS.PHASE_UI,
      retry: { enabled: true, maxAttempts: 1, delay: 500 },
      onFail: {
        mode: DEGRADATION_MODES.SKIP,
        message: 'UI components skipped - core functionality intact',
        disable: [] as string[],
        allow: ['*']
      },
      modules: [
        { id: 'ui-orchestrator', critical: true, timeout: TIMEOUTS.MODULE_UI_ORCHESTRATOR },
        { id: 'ticker', critical: false, timeout: TIMEOUTS.MODULE_TICKER },
        { id: 'toast', critical: false, timeout: TIMEOUTS.MODULE_TOAST },
        { id: 'preloader-fade', critical: false, timeout: TIMEOUTS.MODULE_PRELOADER }
      ],
      healthWeight: 4
    },
    {
      id: 'phase-6-platform',
      name: 'Platform Hooks',
      description: 'Platform-specific integrations and finalizations',
      order: 6,
      dependsOn: ['phase-5-ui'],
      critical: false,
      recoverable: true,
      parallel: true,
      timeout: TIMEOUTS.PHASE_PLATFORM,
      retry: { enabled: false, maxAttempts: 1 },
      onFail: {
        mode: DEGRADATION_MODES.SKIP,
        message: 'Platform hooks skipped - non-essential',
        disable: [] as string[],
        allow: ['*']
      },
      modules: [
        { id: 'platform-init', critical: false, timeout: TIMEOUTS.MODULE_PLATFORM }
      ],
      healthWeight: 3
    }
  ]
};

export default {
  VERSION,
  MODULE_ID,
  MANIFEST_VERSION,
  BOOT_MANIFEST
};
