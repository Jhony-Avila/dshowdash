// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: environment-manager-config
// PURPOSE: Environment Manager - Configuration v2.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ENVIRONMENTS — exported value
//   MODES — exported value
//   PATTERNS — exported value
//   PORT_MAP — exported value
//   ENV_TO_MODE — exported value
//   BASE_URLS — exported value
//   ENV_POLICIES — exported value
//   METADATA — exported value
//   DEFAULT_URLS — exported value
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export var VERSION = '2.2.0-ENTERPRISE';
export var MODULE_ID = 'environment-manager-config';

export function getVersion() { return VERSION; }

export var ENVIRONMENTS = Object.freeze({
  LOCAL: 'local', SANDBOX: 'SANDBOX', DEV: 'DEV', TEST: 'TEST', STAGE: 'STAGE', PROD: 'PROD', UNKNOWN: 'UNKNOWN'
});

export var MODES = Object.freeze({
  DEVELOPMENT: 'development', STAGING: 'staging', PRODUCTION: 'production'
});

export var PATTERNS = Object.freeze({
  LOCAL: ['localhost', '127.0.0.1', '0.0.0.0', '::1', '.local'],
  SANDBOX: ['localhost', '127.0.0.1', '0.0.0.0', '::1', '.local'],
  DEV: ['dev.', 'development.', '.internal'],
  TEST: ['test.', 'testing.', 'qa.', 'homolog.', 'homologacao.', 'uat.'],
  STAGE: ['stg.', 'stage.', 'staging.', 'pre-prod.', 'preprod.'],
  PROD: ['prod.', 'production.', 'www.', '.com.br', '.com', '.net', '.org']
});

export var PORT_MAP = Object.freeze({ '3000': ENVIRONMENTS.DEV, '5173': ENVIRONMENTS.DEV, '8080': ENVIRONMENTS.DEV, '4200': ENVIRONMENTS.DEV, '9000': ENVIRONMENTS.TEST });

var _envToMode: Record<string, string> = {};
_envToMode[ENVIRONMENTS.LOCAL] = MODES.DEVELOPMENT;
_envToMode[ENVIRONMENTS.SANDBOX] = MODES.DEVELOPMENT;
_envToMode[ENVIRONMENTS.DEV] = MODES.DEVELOPMENT;
_envToMode[ENVIRONMENTS.TEST] = MODES.STAGING;
_envToMode[ENVIRONMENTS.STAGE] = MODES.STAGING;
_envToMode[ENVIRONMENTS.PROD] = MODES.PRODUCTION;
_envToMode[ENVIRONMENTS.UNKNOWN] = MODES.DEVELOPMENT;
export var ENV_TO_MODE = Object.freeze(_envToMode);

export var BASE_URLS = Object.freeze({
  api: { local: '/api', SANDBOX: '/api', DEV: '/api', TEST: '/api', STAGE: '/api', PROD: '/api', UNKNOWN: '/api' },
  telemetry: { local: '/api/telemetry/', SANDBOX: '/api/telemetry/', DEV: '/api/telemetry/', TEST: '/api/telemetry/', STAGE: '/api/telemetry/', PROD: '/api/telemetry/', UNKNOWN: '/api/telemetry/' },
  assets: { local: '/assets', SANDBOX: '/assets', DEV: '/assets', TEST: '/assets', STAGE: '/assets', PROD: '/assets', UNKNOWN: '/assets' },
  config: { local: '/config', SANDBOX: '/config', DEV: '/config', TEST: '/config', STAGE: '/config', PROD: '/config', UNKNOWN: '/config' }
});

export var ENV_POLICIES = Object.freeze({
  local: { debug: true, enableServiceWorker: false, cacheLevel: 'none', logLevel: 'debug', showErrors: true, enableExperimentation: true, telemetrySampling: 100 },
  SANDBOX: { debug: true, enableServiceWorker: false, cacheLevel: 'none', logLevel: 'debug', showErrors: true, enableExperimentation: true, telemetrySampling: 100 },
  DEV: { debug: true, enableServiceWorker: false, cacheLevel: 'basic', logLevel: 'debug', showErrors: true, enableExperimentation: true, telemetrySampling: 100 },
  TEST: { debug: true, enableServiceWorker: false, cacheLevel: 'basic', logLevel: 'info', showErrors: true, enableExperimentation: true, telemetrySampling: 50 },
  STAGE: { debug: true, enableServiceWorker: true, cacheLevel: 'basic', logLevel: 'warn', showErrors: false, enableExperimentation: false, telemetrySampling: 25 },
  PROD: { debug: false, enableServiceWorker: true, cacheLevel: 'aggressive', logLevel: 'error', showErrors: false, enableExperimentation: false, telemetrySampling: 10 },
  UNKNOWN: { debug: false, enableServiceWorker: false, cacheLevel: 'none', logLevel: 'warn', showErrors: false, enableExperimentation: false, telemetrySampling: 100 }
});

export var METADATA = Object.freeze({
  local: { name: 'Local', color: '#FF9800', icon: 'home', description: 'Ambiente local de desenvolvimento' },
  SANDBOX: { name: 'Sandbox', color: '#FFA500', icon: 'wrench', description: 'Ambiente sandbox de desenvolvimento' },
  DEV: { name: 'Development', color: '#2196F3', icon: 'code', description: 'Ambiente de desenvolvimento remoto' },
  TEST: { name: 'Test/QA', color: '#FFC107', icon: 'alert-triangle', description: 'Ambiente de testes e QA' },
  STAGE: { name: 'Staging', color: '#9C27B0', icon: 'layers', description: 'Ambiente de pre-producao' },
  PROD: { name: 'Production', color: '#4CAF50', icon: 'check-circle', description: 'Ambiente de producao' },
  UNKNOWN: { name: 'Unknown', color: '#9E9E9E', icon: 'help-circle', description: 'Ambiente nao identificado' }
});

export var DEFAULT_URLS = Object.freeze({ apiBaseUrl: '/api', assetsBaseUrl: '/assets', configBaseUrl: '/config', telemetryEndpoint: '/api/telemetry/' });

export function info() { return { moduleId: MODULE_ID, version: VERSION, environmentsCount: Object.keys(ENVIRONMENTS).length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { environmentsReady: Object.keys(ENVIRONMENTS).length > 0, modesReady: Object.keys(MODES).length > 0, policiesReady: Object.keys(ENV_POLICIES).length > 0 } }; }

export default { VERSION: VERSION, MODULE_ID: MODULE_ID, getVersion: getVersion, ENVIRONMENTS: ENVIRONMENTS, MODES: MODES, PATTERNS: PATTERNS, PORT_MAP: PORT_MAP, ENV_TO_MODE: ENV_TO_MODE, BASE_URLS: BASE_URLS, ENV_POLICIES: ENV_POLICIES, METADATA: METADATA, DEFAULT_URLS: DEFAULT_URLS, info: info, healthCheck: healthCheck };
