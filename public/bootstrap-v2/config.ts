// Bootstrap-V2 Config
// @version 2.2.0-HEALTH-CONTRACT
// @changelog v2.1.1-CONTRACTS: Dependency Contract formalizado
// @description Configuração central do bootstrap
// @changelog v2.1.0-QUICKWINS: QW#19 Feature Flags
// @changelog v2.0.0-PLATFORM: Phases now controlled by boot-manifest.js (P0 Bootstrap Platform)
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: loadConfig(), getConfig(), get(), set(), isDebug(),
//   isPhaseEnabled(), getEnabledPhases(), isFeatureEnabled(),
//   enableFeature(), disableFeature(), getFeatureFlags(),
//   getEnabledFeatures(), info(), healthCheck()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createHealthResult, HEALTH_STATUS } from './contracts/health-contract.ts';

var MODULE_ID = 'bootstrap-config';
var VERSION = '3.9.1-DEVTOOLS';

// QW#19: Feature Flags
var FEATURE_FLAGS: Record<string, { enabled: boolean; description: string }> = {
  // Boot Features
  PERIODIC_HEALTH_CHECK: { enabled: false, description: 'Habilita health check periódico pós-boot' },
  MEMORY_METRICS: { enabled: true, description: 'Coleta métricas de memória durante o boot' },
  BROWSER_CHECK: { enabled: true, description: 'Verifica compatibilidade do browser antes do boot' },
  TYPED_ERRORS: { enabled: true, description: 'Usa sistema de erros tipados' },
  PROGRESS_EVENTS: { enabled: true, description: 'Emite eventos de progresso durante o boot' },

  // Debug Features
  VERBOSE_LOGGING: { enabled: false, description: 'Logs detalhados de todas as operações' },
  TELEMETRY_DEBUG: { enabled: false, description: 'Logs de telemetria no console' },

  // Experimental Features
  PARALLEL_PHASES: { enabled: false, description: 'Executa fases não-dependentes em paralelo' },
  LAZY_MODULE_LOAD: { enabled: false, description: 'Carrega módulos sob demanda' },
  PRE_WARM_CACHE: { enabled: false, description: 'Pré-aquece cache de módulos críticos' }
};

// Config padrão
var DEFAULT_CONFIG = {
  debug: false,
  timeouts: { phase: 30000, module: 10000, critical: 5000 },
  retry: { enabled: true, maxAttempts: 2, delay: 1000 },
  phases: {
    critical: true,
    core: true,
    auth: true,
    shell: true,
    main: true,
    ui: true,
    platform: true
  },
  telemetry: { enabled: true, namespace: 'bootstrap-v2' },
  logging: { enabled: true, level: 'info' },
  manifest: {
    strictValidation: false,
    allowOverrides: true
  },
  // QW#19: Feature flags no config
  features: Object.keys(FEATURE_FLAGS).reduce(function(acc: Record<string, boolean>, key: string) {
    acc[key] = FEATURE_FLAGS[key].enabled;
    return acc;
  }, {} as Record<string, boolean>)
};

var currentConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

function loadConfig(userConfig: Record<string, any>) {
  if (userConfig === undefined) userConfig = {};
  currentConfig = {
    debug: userConfig.debug !== undefined ? userConfig.debug : DEFAULT_CONFIG.debug,
    timeouts: Object.assign({}, DEFAULT_CONFIG.timeouts, userConfig.timeouts || {}),
    retry: Object.assign({}, DEFAULT_CONFIG.retry, userConfig.retry || {}),
    phases: Object.assign({}, DEFAULT_CONFIG.phases, userConfig.phases || {}),
    telemetry: Object.assign({}, DEFAULT_CONFIG.telemetry, userConfig.telemetry || {}),
    logging: Object.assign({}, DEFAULT_CONFIG.logging, userConfig.logging || {}),
    manifest: Object.assign({}, DEFAULT_CONFIG.manifest, userConfig.manifest || {}),
    features: Object.assign({}, DEFAULT_CONFIG.features, userConfig.features || {})
  };
  return currentConfig;
}

function getConfig() { return JSON.parse(JSON.stringify(currentConfig)); }
function get(key: string) { return currentConfig[key]; }
function set(key: string, value: unknown) { currentConfig[key] = value; }
function isDebug() { return currentConfig.debug === true; }

function isPhaseEnabled(phaseKey: string) {
  return currentConfig.phases[phaseKey] !== false;
}

function getEnabledPhases() {
  var enabled = [];
  for (var key in currentConfig.phases) {
    if (currentConfig.phases.hasOwnProperty(key) && currentConfig.phases[key]) {
      enabled.push(key);
    }
  }
  return enabled;
}

// QW#19: APIs de Feature Flags
function isFeatureEnabled(featureKey: string) {
  return currentConfig.features[featureKey] === true;
}

function enableFeature(featureKey: string) {
  if (FEATURE_FLAGS.hasOwnProperty(featureKey)) {
    currentConfig.features[featureKey] = true;
    return true;
  }
  return false;
}

function disableFeature(featureKey: string) {
  if (FEATURE_FLAGS.hasOwnProperty(featureKey)) {
    currentConfig.features[featureKey] = false;
    return true;
  }
  return false;
}

function getFeatureFlags() {
  var result: Record<string, unknown> = {};
  for (var key in FEATURE_FLAGS) {
    if (FEATURE_FLAGS.hasOwnProperty(key)) {
      result[key] = {
        enabled: (currentConfig.features as Record<string, boolean>)[key],
        description: FEATURE_FLAGS[key].description
      };
    }
  }
  return result;
}

function getEnabledFeatures() {
  var enabled = [];
  for (var key in currentConfig.features) {
    if (currentConfig.features.hasOwnProperty(key) && currentConfig.features[key]) {
      enabled.push(key);
    }
  }
  return enabled;
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    debug: currentConfig.debug,
    enabledPhases: getEnabledPhases(),
    enabledFeatures: getEnabledFeatures(),
    manifestIntegrated: true,
    quickWinsApplied: ['QW19-FeatureFlags']
  };
}

function healthCheck() {
  return createHealthResult({
    status: HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      manifestIntegrated: true,
      featureFlagsActive: getEnabledFeatures().length
    }
  });
}

export {
  DEFAULT_CONFIG,
  FEATURE_FLAGS,
  loadConfig,
  getConfig,
  get,
  set,
  isDebug,
  isPhaseEnabled,
  getEnabledPhases,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  getFeatureFlags,
  getEnabledFeatures,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  DEFAULT_CONFIG: DEFAULT_CONFIG,
  FEATURE_FLAGS: FEATURE_FLAGS,
  loadConfig: loadConfig,
  getConfig: getConfig,
  get: get,
  set: set,
  isDebug: isDebug,
  isPhaseEnabled: isPhaseEnabled,
  getEnabledPhases: getEnabledPhases,
  isFeatureEnabled: isFeatureEnabled,
  enableFeature: enableFeature,
  disableFeature: disableFeature,
  getFeatureFlags: getFeatureFlags,
  getEnabledFeatures: getEnabledFeatures,
  info: info,
  healthCheck: healthCheck
};
