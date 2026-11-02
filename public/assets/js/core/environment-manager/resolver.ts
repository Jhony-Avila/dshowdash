// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.6.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: environment-manager-resolver
// PURPOSE: Environment Manager - Resolver v2.6.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ENVIRONMENTS, PATTERNS, PORT_MAP, BASE_URLS, ENV_POLICIES, DEFAULT_URLS from ./config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   resolver — exported value
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

import { ENVIRONMENTS, PATTERNS, PORT_MAP, BASE_URLS, ENV_POLICIES, DEFAULT_URLS } from './config.js';

export var VERSION = '2.6.0-ENTERPRISE';
export var MODULE_ID = 'environment-manager-resolver';

export function getVersion() { return VERSION; }

function EnvironmentResolver() { }

EnvironmentResolver.prototype.resolve = function (options: Record<string, unknown> = {}) {
  if (options === undefined) options = {};
  var hasWindow = typeof window !== 'undefined';
  var hostname = (options.hostname || (hasWindow ? window.location.hostname : '')) as string;
  var protocol = (options.protocol || (hasWindow ? window.location.protocol : 'https:')) as string;
  var port = (options.port || (hasWindow ? window.location.port : '')) as string;
  var appConfig = (options.appConfig || null) as Record<string, unknown> | null;

  var normalizedHostname = hostname.toLowerCase();
  var environment: string = ENVIRONMENTS.UNKNOWN;
  var detectionMethod = 'fallback';

  if (appConfig && (appConfig.app as Record<string, unknown>) && (appConfig.app as Record<string, unknown>).environment) {
    var configEnv = this._mapConfigEnvironment((appConfig.app as Record<string, unknown>).environment);
    if (configEnv !== ENVIRONMENTS.UNKNOWN) { environment = configEnv; detectionMethod = 'app-config'; }
  } else if (appConfig && appConfig.environment) {
    var configEnv2 = this._mapConfigEnvironment(appConfig.environment);
    if (configEnv2 !== ENVIRONMENTS.UNKNOWN) { environment = configEnv2; detectionMethod = 'app-config'; }
  }

  if (environment === ENVIRONMENTS.UNKNOWN) {
    var hostDetection = this._detectByHostname(normalizedHostname);
    if (hostDetection.environment !== ENVIRONMENTS.UNKNOWN) { environment = hostDetection.environment; detectionMethod = hostDetection.method; }
  }

  if (environment === ENVIRONMENTS.UNKNOWN && port) {
    var portEnv = (PORT_MAP as Record<string, string>)[port as string];
    if (portEnv) { environment = portEnv; detectionMethod = 'port-mapping'; }
  }

  if (environment === ENVIRONMENTS.UNKNOWN) {
    if (protocol === 'http:' && normalizedHostname.indexOf('prod') === -1) { environment = ENVIRONMENTS.DEV; detectionMethod = 'protocol-http'; }
    else if (protocol === 'https:') { environment = ENVIRONMENTS.PROD; detectionMethod = 'protocol-https-fallback'; }
  }

  var apiBaseUrl = (appConfig && (appConfig.api as Record<string, unknown>) && (appConfig.api as Record<string, unknown>).cardsBaseUrl) || (appConfig && (appConfig.app as Record<string, unknown>) && (appConfig.app as Record<string, unknown>).apiUrl) || this.resolveBaseURL('api', environment);
  var assetsBaseUrl = (appConfig && (appConfig.paths as Record<string, unknown>) && (appConfig.paths as Record<string, unknown>).assets) || this.resolveBaseURL('assets', environment);
  var configBaseUrl = this.resolveBaseURL('config', environment);
  var telemetryEndpoint = this.resolveBaseURL('telemetry', environment);
  var policies = (ENV_POLICIES as Record<string, typeof ENV_POLICIES.PROD>)[environment] || ENV_POLICIES[ENVIRONMENTS.UNKNOWN as keyof typeof ENV_POLICIES];

  return { environment: environment, hostname: hostname, protocol: protocol, port: port, apiBaseUrl: apiBaseUrl, assetsBaseUrl: assetsBaseUrl, configBaseUrl: configBaseUrl, telemetryEndpoint: telemetryEndpoint, detectionMethod: detectionMethod, policies: policies };
};

EnvironmentResolver.prototype.resolveBaseURL = function (serviceName: string, env: string) {
  var serviceUrls = (BASE_URLS as Record<string, Record<string, string>>)[serviceName];
  if (!serviceUrls) return (DEFAULT_URLS as Record<string, string>)[serviceName + 'BaseUrl'] || DEFAULT_URLS.apiBaseUrl;
  return serviceUrls[env] || serviceUrls[ENVIRONMENTS.PROD] || DEFAULT_URLS.apiBaseUrl;
};

EnvironmentResolver.prototype._mapConfigEnvironment = function (configEnv: string) {
  if (!configEnv) return ENVIRONMENTS.UNKNOWN;
  var normalized = String(configEnv).toLowerCase().trim();
  if (normalized === 'local') return ENVIRONMENTS.LOCAL;
  if (normalized.indexOf('sandbox') !== -1) return ENVIRONMENTS.SANDBOX;
  if (normalized.indexOf('dev') !== -1 || normalized === 'development') return ENVIRONMENTS.DEV;
  if (normalized.indexOf('test') !== -1 || normalized === 'qa' || normalized === 'homolog') return ENVIRONMENTS.TEST;
  if (normalized.indexOf('stag') !== -1 || normalized === 'stage' || normalized === 'pre-prod') return ENVIRONMENTS.STAGE;
  if (normalized.indexOf('prod') !== -1 || normalized === 'production') return ENVIRONMENTS.PROD;
  return ENVIRONMENTS.UNKNOWN;
};

EnvironmentResolver.prototype._detectByHostname = function (hostname: string) {
  var i, pattern;
  for (i = 0; i < PATTERNS.LOCAL.length; i++) { pattern = PATTERNS.LOCAL[i]; if (hostname.indexOf(pattern.toLowerCase()) !== -1) return { environment: ENVIRONMENTS.LOCAL, method: 'pattern-local' }; }
  for (i = 0; i < PATTERNS.DEV.length; i++) { pattern = PATTERNS.DEV[i]; if (hostname.indexOf(pattern.toLowerCase()) !== -1) return { environment: ENVIRONMENTS.DEV, method: 'pattern-dev' }; }
  for (i = 0; i < PATTERNS.TEST.length; i++) { pattern = PATTERNS.TEST[i]; if (hostname.indexOf(pattern.toLowerCase()) !== -1) return { environment: ENVIRONMENTS.TEST, method: 'pattern-test' }; }
  for (i = 0; i < PATTERNS.STAGE.length; i++) { pattern = PATTERNS.STAGE[i]; if (hostname.indexOf(pattern.toLowerCase()) !== -1) return { environment: ENVIRONMENTS.STAGE, method: 'pattern-stage' }; }
  for (i = 0; i < PATTERNS.PROD.length; i++) { pattern = PATTERNS.PROD[i]; if (hostname.indexOf(pattern.toLowerCase()) !== -1) return { environment: ENVIRONMENTS.PROD, method: 'pattern-prod' }; }
  return { environment: ENVIRONMENTS.UNKNOWN, method: 'no-match' };
};

EnvironmentResolver.prototype.normalizeEnvironment = function (input: string) { return this._mapConfigEnvironment(input); };

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { resolverReady: typeof resolver.resolve === 'function' } }; }

export var resolver = new (EnvironmentResolver as unknown as { new(): Record<string, (...args: unknown[]) => unknown> })();
export default resolver;
