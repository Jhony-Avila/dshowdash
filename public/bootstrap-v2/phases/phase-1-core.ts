
// Phase 1 - Core Systems
// @version 3.12.0-FF-HEALTH-REGISTERED
// @changelog v3.12.0-FF-HEALTH-REGISTERED: FeatureFlags registrado no runtime health aggregator
// @changelog v3.11.0-RUNTIME-HEALTH: Runtime HealthCheck Aggregator integrado no boot (step 10 após governance validation)
// @changelog v3.10.0-GOVERNANCE-VALIDATED: Governance rules integradas no boot — validateAll() executado após Core Enterprise
// @changelog v3.9.0-STRICT-BLOCKING-FULL: EventBus e ContextProvider bloqueantes em modo strict (NR-FULL Parte 10 Item 5)
// @changelog v3.8.0-STRICT-BLOCKING: GlobalState bloqueante em modo strict (NR-FULL Parte 10)
// @changelog v3.7.0-FACADE-EXPOSE: Expõe GlobalStateFacade (não manager) via windowAdapter
//                                   Bootstrap é agora o único responsável pela exposição
// @changelog v3.6.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v3.5.0-DOMAIN-PURE - window.ReadyFlags → _getReadyFlags() helper (windowAdapter first, window fallback). Dependency contract documentado
// @changelog v3.4.0-ENTERPRISE-P2: Adicionado carregamento do Core Enterprise completo (expõe Governance, GovernancePanel)
// @changelog v3.3.0-ENTERPRISE-P2: Adicionado registro de Feature Definitions no Kernel Governance
// @changelog v3.2.0: Removed orphan orchestrator/panel-registry imports (loaded in Phase 5)
// @changelog v3.1.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.8.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via execute(ports)):
//   ports.logger       — Logger instance
//   ports.telemetry    — Telemetry tracker
//   ports.windowAdapter — For exposing/getting globals safely
//
// CREATES (via windowAdapter.expose):
//   EventBus, GlobalState (via GlobalStateFacade), ReadyFlags, AssetLoader, Telemetry,
//   TelemetryCore, ContextProvider
//
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
//   isStrict, EnterpriseViolationError from strict-mode.js
//
// ENTERPRISE STRICT MODE:
//   Em modo strict, falha do GlobalState = hard stop imediato
//   Boot não prossegue sem GlobalState inicializado
//
// NOTE: Tasks 1-5 execute in parallel (Promise.allSettled).
// ReadyFlags may not be in windowAdapter when tasks 1/2 complete,
// so _getReadyFlags() falls back to window.ReadyFlags (auto-registered
// by ready-flags/index.js on import).
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
import { isStrict, EnterpriseViolationError, setBootReady } from '/core/runtime/enterprise/strict-mode.js';

// @ts-expect-error TS migration - TS2305
import { validateAll as validateGovernanceRules, info as governanceInfo } from '/core/runtime/contracts/runtime-governance-rules.js';

// @ts-expect-error TS migration - TS2305
import { aggregateHealth as aggregateRuntimeHealth, registerModule as registerHealthModule, info as runtimeHealthInfo } from '/core/runtime/health/runtime-health-aggregator.js';

var MODULE_ID = 'phase-1-core';
var VERSION = '3.12.0-FF-HEALTH-REGISTERED';

var _state: { executed: boolean; executedAt: number | null; results: { initialized: string[]; failed: Array<{ id: string; error: string; critical: boolean }> } | null; errors: Array<{ id: string; error: string; critical: boolean }>; featuresRegistered: boolean; coreLoaded: boolean; featureFlagsInitialized: boolean; governanceValidated: boolean; governanceScore: number | string | null; runtimeHealthScore: number | string | null; runtimeHealthStatus: string | null } = { executed: false, executedAt: null, results: null, errors: [], featuresRegistered: false, coreLoaded: false, featureFlagsInitialized: false, governanceValidated: false, governanceScore: null, runtimeHealthScore: null, runtimeHealthStatus: null };

// v3.5.0: cached windowAdapter for helper access
var _windowAdapter: Record<string, Function> | null = null;

// v3.5.0: safe ReadyFlags accessor (windowAdapter first, window fallback)
// ReadyFlags auto-registers on window via its own module, so window fallback
// is safe and necessary during parallel task execution
function _getReadyFlags() {
  if (_windowAdapter && _windowAdapter.get) {
    var rf = _windowAdapter.get('ReadyFlags');
    if (rf) return rf;
  }
  return (typeof window !== 'undefined') ? window.ReadyFlags : null;
}

var phase1 = {
  id: 'phase-1-core',
  name: 'Core Systems',
  version: VERSION,
  order: 1,
  critical: true,
  recoverable: false,
  dependsOn: ['phase-0-critical'],
  parallel: true,

  modules: [
    { id: 'eventbus', name: 'EventBus Global', critical: true, timeout: 5000 },
    { id: 'globalstate', name: 'Global State Manager', critical: true, timeout: 5000 },
    { id: 'ready-flags', name: 'ReadyFlags Provider', critical: false, timeout: 2000 },
    { id: 'context-provider', name: 'Context Provider', critical: false, timeout: 3000 },
    { id: 'feature-flags', name: 'Feature Flags Manager', critical: false, timeout: 3000 }, // v3.8.0: Inicialização formal
    { id: 'asset-loader', name: 'AssetLoader Enterprise', critical: false, timeout: 3000 },
    { id: 'telemetry-core', name: 'Telemetry Core', critical: false, timeout: 3000 },
    { id: 'feature-manifest', name: 'Feature Manifest (P2)', critical: false, timeout: 3000 },
    { id: 'core-enterprise', name: 'Core Enterprise (AAA+)', critical: false, timeout: 3000 }
  ],

  execute: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
    var results: { initialized: string[]; failed: Array<{ id: string; error: string; critical: boolean }> } = { initialized: [], failed: [] };
    var startTime = performance.now();

    // v3.5.0: cache windowAdapter for _getReadyFlags helper
    _windowAdapter = windowAdapter;

    // P0.3: Sinaliza que EventBus está pronto (Phase 0 completou)
    // Flush do buffer de eventos de governança acumulados durante early boot
    setBootReady();

    if (logger) logger.info('Phase 1 starting: Core Systems');
    if (telemetry) telemetry.track('phase-1-start');

    var tasks = [];

    // 1. EventBus Global
    tasks.push(import('/core/js/event-bus/index.js').then(function(EventBusModule) {
      var EventBus = (EventBusModule as any).default || EventBusModule;
      if (EventBus) {
        var initPromise = EventBus.init ? EventBus.init() : Promise.resolve();
        return Promise.resolve(initPromise).then(function() {
          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('EventBus', EventBus);
          var rf = _getReadyFlags();
          if (rf && rf.setReady) rf.setReady('eventbus', true);
          results.initialized.push('eventbus');
          if (logger) logger.info('EventBus Global ready');
        });
      }
    }).catch(function(error) {
      results.failed.push({ id: 'eventbus', error: error.message, critical: true });
      if (logger) logger.error('EventBus Global failed', { error: error.message, strictMode: isStrict() });

      // v3.9.0: Em modo strict, EventBus é BLOQUEANTE - hard stop
      if (isStrict()) {
        if (telemetry) telemetry.error('eventbus-strict-failure', { error: error.message });
        throw new EnterpriseViolationError(
          'EventBus falhou em modo strict: ' + error.message,
          { type: 'EVENTBUS_CRITICAL_FAILURE', phase: 'phase-1-core', originalError: error.message }
        );
      }
      throw error;
    }));

    // 2. GlobalState Manager
    // v3.7.0: Expõe GlobalStateFacade (API pública controlada), não o manager inteiro
    // v3.8.0: Em modo strict, falha do GlobalState = hard stop imediato
    tasks.push(import('/modules/global-state/index.js').then(function(GlobalStateModule: Record<string, any>) {
      var GlobalStateManager = GlobalStateModule.default || GlobalStateModule;
      var GlobalStateFacade = GlobalStateModule.GlobalStateFacade;
      if (GlobalStateManager) {
        if (GlobalStateManager.init) GlobalStateManager.init({ debug: false, telemetry: true });
        // v3.7.0: Expõe o Facade (API pública), não o manager interno
        if (windowAdapter && windowAdapter.expose) {
          windowAdapter.expose('GlobalState', GlobalStateFacade || GlobalStateManager);
        }
        var rf = _getReadyFlags();
        if (rf && rf.setReady) rf.setReady('globalstate', true);
        results.initialized.push('globalstate');
        if (logger) logger.info('GlobalState Manager ready (Facade exposed)', { strictMode: isStrict() });
      } else {
        // v3.8.0: GlobalState null em modo strict = hard stop
        if (isStrict()) {
          throw new EnterpriseViolationError(
            'GlobalState é obrigatório em modo strict mas retornou null',
            { type: 'GLOBALSTATE_NULL', phase: 'phase-1-core' }
          );
        }
      }
    }).catch(function(error) {
      results.failed.push({ id: 'globalstate', error: error.message, critical: true });
      if (logger) logger.error('GlobalState Manager failed', { error: error.message, strictMode: isStrict() });

      // v3.8.0: Em modo strict, GlobalState é BLOQUEANTE - não apenas crítico
      if (isStrict()) {
        // Log telemetria antes de parar
        if (telemetry) telemetry.error('globalstate-strict-failure', { error: error.message });
        // Re-throw com contexto enterprise
        if (error instanceof EnterpriseViolationError) throw error;
        throw new EnterpriseViolationError(
          'GlobalState falhou em modo strict: ' + error.message,
          { type: 'GLOBALSTATE_CRITICAL_FAILURE', phase: 'phase-1-core', originalError: error.message }
        );
      }
      throw error;
    }));

    // 3. ReadyFlags Provider
    tasks.push(import('/core/js/ready-flags/index.js').then(function(ReadyFlagsModule) {
      var ReadyFlags = ReadyFlagsModule.default || ReadyFlagsModule.ReadyFlags;
      if (ReadyFlags) {
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('ReadyFlags', ReadyFlags);
        results.initialized.push('ready-flags');
        if (logger) logger.info('ReadyFlags Provider ready', { version: ReadyFlags.VERSION || 'unknown' });
      }
    }).catch(function(error) {
      results.failed.push({ id: 'ready-flags', error: error.message, critical: false });
      if (logger) logger.warn('ReadyFlags Provider failed (non-critical)', { error: error.message });
    }));

    // 4. AssetLoader Enterprise
    tasks.push(import('/core/js/asset-loader/index.js').then(function(AssetLoaderModule: Record<string, any>) {
      var AssetLoader = AssetLoaderModule.default || AssetLoaderModule;
      if (AssetLoader) {
        if (AssetLoader.init) AssetLoader.init();
        if (windowAdapter && windowAdapter.expose) windowAdapter.expose('AssetLoader', AssetLoader);
        results.initialized.push('asset-loader');
        var version = AssetLoader.getVersion ? AssetLoader.getVersion() : 'unknown';
        if (logger) logger.info('AssetLoader Enterprise ready', { version: version });
      }
    }).catch(function(error) {
      results.failed.push({ id: 'asset-loader', error: error.message, critical: false });
      if (logger) logger.warn('AssetLoader failed (non-critical)', { error: error.message });
    }));

    // 5. Telemetry Core
    tasks.push(import('/assets/js/core/telemetry-core/index.js').then(function(TelemetryModule: Record<string, any>) {
      var TelemetryCore = TelemetryModule.default || TelemetryModule;
      if (TelemetryCore) {
        var initPromise = TelemetryCore.init ? TelemetryCore.init() : Promise.resolve();
        return Promise.resolve(initPromise).then(function() {
          if (windowAdapter && windowAdapter.expose) {
            windowAdapter.expose('Telemetry', TelemetryCore);
            windowAdapter.expose('TelemetryCore', TelemetryCore);
          }
          var rf = _getReadyFlags();
          if (rf && rf.setReady) rf.setReady('telemetry', true);
          results.initialized.push('telemetry-core');
          if (logger) logger.info('Telemetry Core ready');
        });
      }
    }).catch(function(error) {
      results.failed.push({ id: 'telemetry-core', error: error.message, critical: false });
      if (logger) logger.warn('Telemetry Core failed (non-critical)', { error: error.message });
    }));

    return Promise.allSettled(tasks).then(function() {
      // 6. Context Provider (após GlobalState estar pronto)
      return import('/components/context-provider/index.js').then(function(ContextProviderModule) {
        var ContextProvider = ContextProviderModule.default || ContextProviderModule.ContextProvider;
        if (ContextProvider) {
          ContextProvider.init({ connectGlobalState: true, connectOrchestrator: true });
          if (windowAdapter && windowAdapter.expose) windowAdapter.expose('ContextProvider', ContextProvider);
          var rf = _getReadyFlags();
          if (rf && rf.setReady) rf.setReady('context-provider', true);
          results.initialized.push('context-provider');
          var version = ContextProvider.getVersion ? ContextProvider.getVersion() : 'unknown';
          if (logger) logger.info('Context Provider ready', { version: version });
        }
      }).catch(function(error) {
        var cpCritical = isStrict();
        results.failed.push({ id: 'context-provider', error: error.message, critical: cpCritical });
        if (cpCritical) {
          if (logger) logger.error('Context Provider failed (BLOCKING in strict)', { error: error.message });
          if (telemetry) telemetry.error('context-provider-strict-failure', { error: error.message });
          throw new EnterpriseViolationError(
            'ContextProvider falhou em modo strict: ' + error.message,
            { type: 'CONTEXTPROVIDER_CRITICAL_FAILURE', phase: 'phase-1-core', originalError: error.message }
          );
        }
        if (logger) logger.warn('Context Provider failed (non-critical)', { error: error.message });
      });
    }).then(function() {
      // 6.5. Feature Flags Manager (v3.8.0: inicialização formal via bootstrap)
      // Inicializado aqui para garantir que EventBus e GlobalState já estão prontos
      return import('/components/feature-flags/index.js').then(function(FeatureFlagsModule) {
        var FeatureFlags = FeatureFlagsModule.default || FeatureFlagsModule.FeatureFlags;
        if (FeatureFlags) {
          // Inicializa com opções padrão - sem fetch automático do server
          // O fetch do server deve ser feito explicitamente após auth
          return FeatureFlags.init({ fetchFromServer: false }).then(function() {
            if (windowAdapter && windowAdapter.expose) windowAdapter.expose('FeatureFlags', FeatureFlags);
            var rf = _getReadyFlags();
            if (rf && rf.setReady) rf.setReady('feature-flags', true);
            _state.featureFlagsInitialized = true;
            results.initialized.push('feature-flags');
            var version = FeatureFlags.getVersion ? FeatureFlags.getVersion() : FeatureFlags.VERSION || 'unknown';
            // v3.12.0: Registra FeatureFlags no health aggregator
            if (FeatureFlags.healthCheck) {
              registerHealthModule('feature-flags', FeatureFlags.healthCheck, 'component');
            }
            if (logger) logger.info('Feature Flags Manager ready (formal init)', { version: version, strictMode: isStrict() });
          });
        }
      }).catch(function(error) {
        results.failed.push({ id: 'feature-flags', error: error.message, critical: false });
        if (logger) logger.warn('Feature Flags Manager failed (non-critical)', { error: error.message });
      });
    }).then(function() {
      // 7. P2: Feature Manifest Registration (após Core estar pronto)
      return import('/core/kernel/feature-definitions.js').then(function(FeatureDefinitionsModule: Record<string, any>) {
        var FeatureDefinitions = FeatureDefinitionsModule.default || FeatureDefinitionsModule;
        if (FeatureDefinitions && FeatureDefinitions.registerAllFeatures) {
          var regResult = FeatureDefinitions.registerAllFeatures({ lock: true, silent: false });
          if (regResult.ok) {
            _state.featuresRegistered = true;
            results.initialized.push('feature-manifest');
            if (logger) logger.info('Feature Manifest registered', {
              total: regResult.results.total,
              success: regResult.results.success,
              locked: regResult.results.locked
            });
          } else {
            results.failed.push({ id: 'feature-manifest', error: 'Registration failed', critical: false });
            if (logger) logger.warn('Feature Manifest registration failed', regResult);
          }
        }
      }).catch(function(error) {
        results.failed.push({ id: 'feature-manifest', error: error.message, critical: false });
        if (logger) logger.warn('Feature Manifest failed (non-critical)', { error: error.message });
      });
    }).then(function() {
      // 8. Core Enterprise (carrega e expõe Governance, GovernancePanel, RuntimeConsumer)
      return import('/core/index.js').then(function(CoreModule: Record<string, any>) {
        var Core = CoreModule.default || CoreModule;
        if (Core) {
          // core/index.js handles its own window.Core and window.Governance exposure
          _state.coreLoaded = true;
          results.initialized.push('core-enterprise');
          if (logger) logger.info('Core Enterprise loaded', {
            version: Core.version,
            kernelVersion: Core.Kernel ? Core.Kernel.VERSION : 'unknown',
            hasGovernance: !!Core.Governance,
            hasGovernancePanel: !!Core.GovernancePanel
          });
        }
      }).catch(function(error) {
        results.failed.push({ id: 'core-enterprise', error: error.message, critical: false });
        if (logger) logger.warn('Core Enterprise failed (non-critical)', { error: error.message });
      });
    }).then(function() {
      // 9. Governance Rules Validation (v3.10.0)
      // Valida todas as regras de governança aplicáveis à Phase-1
      try {
        var govResult = validateGovernanceRules({ phase: 'phase-1', module: MODULE_ID });
        _state.governanceValidated = govResult.passed;
        _state.governanceScore = govResult.score;
        results.initialized.push('governance-validation');
        if (logger) logger.info('Governance rules validated', {
          passed: govResult.passed,
          score: govResult.score,
          results: govResult.results
        });

        // Em modo strict, falha de governança com severidade CRITICAL = hard stop
        if (!govResult.passed && isStrict()) {
          var criticalFailures = govResult.results.filter(function(r) { return !r.passed; });
          if (logger) logger.error('Governance validation failed in strict mode', { failures: criticalFailures });
          if (telemetry) telemetry.error('governance-strict-failure', { score: govResult.score, failures: criticalFailures });
          // Não bloqueia por ora — apenas registra. As regras validam patterns, não estado runtime.
          // O hard stop de governança só ativa quando enforceRule() é chamado com contexto real.
        }
      } catch (govError: any) {
        results.failed.push({ id: 'governance-validation', error: govError.message, critical: false });
        if (logger) logger.warn('Governance validation error (non-critical)', { error: govError.message });
      }

      return;
    }).then(function() {
      // 10. Runtime Health Aggregation (v3.11.0)
      // Executa aggregateHealth() para validar que todos os módulos de governança estão saudáveis
      try {
        var runtimeHealth = aggregateRuntimeHealth();
        _state.runtimeHealthScore = runtimeHealth.score;
        _state.runtimeHealthStatus = runtimeHealth.status;
        results.initialized.push('runtime-health-aggregator');
        if (logger) logger.info('Runtime health aggregated', {
          status: runtimeHealth.status,
          score: runtimeHealth.score,
          totalModules: runtimeHealth.totalModules
        });
      } catch (rhError: any) {
        results.failed.push({ id: 'runtime-health-aggregator', error: rhError.message, critical: false });
        if (logger) logger.warn('Runtime health aggregation error (non-critical)', { error: rhError.message });
      }

      return;
    }).then(function() {
      var elapsed = Math.round(performance.now() - startTime);
      var criticalFailed = results.failed.filter(function(f) { return f.critical; });
      var strictModeActive = isStrict();

      // v3.9.0: Em modo strict, GlobalState ou EventBus na lista de falhos = hard stop
      var globalStateFailed = criticalFailed.some(function(f) { return f.id === 'globalstate'; });
      var eventBusFailed = criticalFailed.some(function(f) { return f.id === 'eventbus'; });
      var contextProviderFailed = criticalFailed.some(function(f) { return f.id === 'context-provider'; });
      if (strictModeActive && globalStateFailed) {
        throw new EnterpriseViolationError(
          'GlobalState falhou - boot bloqueado em modo strict',
          { type: 'GLOBALSTATE_BOOT_BLOCKED', phase: 'phase-1-core', failedModules: criticalFailed }
        );
      }
      if (strictModeActive && eventBusFailed) {
        throw new EnterpriseViolationError(
          'EventBus falhou - boot bloqueado em modo strict',
          { type: 'EVENTBUS_BOOT_BLOCKED', phase: 'phase-1-core', failedModules: criticalFailed }
        );
      }
      if (strictModeActive && contextProviderFailed) {
        throw new EnterpriseViolationError(
          'ContextProvider falhou - boot bloqueado em modo strict',
          { type: 'CONTEXTPROVIDER_BOOT_BLOCKED', phase: 'phase-1-core', failedModules: criticalFailed }
        );
      }

      if (criticalFailed.length > 0) {
        var failedIds = criticalFailed.map(function(f) { return f.id; }).join(', ');
        throw new Error('Critical modules failed: ' + failedIds);
      }

      _state.executed = true;
      _state.executedAt = Date.now();
      _state.results = results;
      _state.errors = results.failed;

      if (telemetry) telemetry.track('phase-1-complete', {
        initialized: results.initialized.length,
        failed: results.failed.length,
        featuresRegistered: _state.featuresRegistered,
        featureFlagsInitialized: _state.featureFlagsInitialized,
        coreLoaded: _state.coreLoaded,
        governanceValidated: _state.governanceValidated,
        governanceScore: _state.governanceScore,
        runtimeHealthStatus: _state.runtimeHealthStatus,
        runtimeHealthScore: _state.runtimeHealthScore,
        strictMode: strictModeActive,
        time: elapsed
      });
      if (logger) logger.info('Phase 1 complete', {
        initialized: results.initialized,
        failed: results.failed,
        featuresRegistered: _state.featuresRegistered,
        featureFlagsInitialized: _state.featureFlagsInitialized,
        coreLoaded: _state.coreLoaded,
        governanceValidated: _state.governanceValidated,
        governanceScore: _state.governanceScore,
        runtimeHealthStatus: _state.runtimeHealthStatus,
        runtimeHealthScore: _state.runtimeHealthScore,
        strictMode: strictModeActive,
        time: elapsed
      });

      return {
        success: criticalFailed.length === 0,
        initialized: results.initialized,
        failed: results.failed,
        featuresRegistered: _state.featuresRegistered,
        featureFlagsInitialized: _state.featureFlagsInitialized,
        coreLoaded: _state.coreLoaded,
        governanceValidated: _state.governanceValidated,
        governanceScore: _state.governanceScore,
        runtimeHealthStatus: _state.runtimeHealthStatus,
        runtimeHealthScore: _state.runtimeHealthScore,
        strictMode: strictModeActive,
        time: elapsed
      };
    });
  },

  healthCheck: function() {
    var totalModules = phase1.modules.length;
    var initializedCount = _state.results && _state.results.initialized ? _state.results.initialized.length : 0;
    var failedCount = _state.results && _state.results.failed ? _state.results.failed.length : 0;
    var criticalFailed = (_state.results && _state.results.failed ? _state.results.failed : [] as Array<{ id: string; error: string; critical: boolean }>).filter(function(f: { id: string; error: string; critical: boolean }) { return f.critical; }).length;
    var strictModeActive = isStrict();
    var globalStateInitialized = _state.results && _state.results.initialized && _state.results.initialized.indexOf('globalstate') !== -1;

    var status: string = HEALTH_STATUS.HEALTHY;
    if (!_state.executed) status = HEALTH_STATUS.DEGRADED;
    else if (criticalFailed > 0) status = HEALTH_STATUS.UNHEALTHY;
    else if (failedCount > 0) status = HEALTH_STATUS.DEGRADED;
    // v3.8.0: Em modo strict sem GlobalState = UNHEALTHY
    else if (strictModeActive && !globalStateInitialized) status = HEALTH_STATUS.UNHEALTHY;

    return createHealthResult({
      status: status,
      moduleId: MODULE_ID,
      version: VERSION,
      checks: {
        executed: _state.executed,
        criticalModulesLoaded: criticalFailed === 0,
        allModulesLoaded: failedCount === 0,
        featuresRegistered: _state.featuresRegistered,
        featureFlagsInitialized: _state.featureFlagsInitialized,
        coreLoaded: _state.coreLoaded,
        // @ts-expect-error strict migration — TS2322
        globalStateReady: globalStateInitialized,
        governanceValidated: _state.governanceValidated,
        runtimeHealthAggregated: !!_state.runtimeHealthStatus,
        // @ts-expect-error strict migration — TS2322
        strictModeCompliant: !strictModeActive || globalStateInitialized
      },
      details: {
        executed: _state.executed,
        executedAt: _state.executedAt,
        featuresRegistered: _state.featuresRegistered,
        featureFlagsInitialized: _state.featureFlagsInitialized,
        coreLoaded: _state.coreLoaded,
        governanceValidated: _state.governanceValidated,
        governanceScore: _state.governanceScore,
        runtimeHealthStatus: _state.runtimeHealthStatus,
        runtimeHealthScore: _state.runtimeHealthScore,
        strictMode: strictModeActive,
        globalStateInitialized: globalStateInitialized,
        modules: { total: totalModules, initialized: initializedCount, failed: failedCount, criticalFailed: criticalFailed },
        errors: _state.errors
      }
    });
  },

  info: function() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      name: phase1.name,
      order: phase1.order,
      critical: phase1.critical,
      dependsOn: phase1.dependsOn,
      executed: _state.executed,
      executedAt: _state.executedAt,
      featuresRegistered: _state.featuresRegistered,
      featureFlagsInitialized: _state.featureFlagsInitialized,
      coreLoaded: _state.coreLoaded,
      governanceValidated: _state.governanceValidated,
      governanceScore: _state.governanceScore,
      runtimeHealthStatus: _state.runtimeHealthStatus,
      runtimeHealthScore: _state.runtimeHealthScore,
      strictMode: isStrict(),
      modules: phase1.modules.map(function(m) { return { id: m.id, name: m.name, critical: m.critical }; }),
      results: _state.results,
      timestamp: Date.now()
    };
  },

  getManifest: function() {
    return {
      registryId: MODULE_ID,
      version: VERSION,
      loadedAt: _state.executedAt,
      itemCount: phase1.modules.length,
      items: phase1.modules.map(function(m) { return m.id; }),
      initialized: _state.results ? _state.results.initialized : [],
      failed: _state.results && _state.results.failed ? _state.results.failed.map(function(f: { id: string; error: string; critical: boolean }) { return f.id; }) : [],
      featuresRegistered: _state.featuresRegistered,
      featureFlagsInitialized: _state.featureFlagsInitialized,
      coreLoaded: _state.coreLoaded,
      governanceValidated: _state.governanceValidated,
      governanceScore: _state.governanceScore,
      runtimeHealthStatus: _state.runtimeHealthStatus,
      runtimeHealthScore: _state.runtimeHealthScore,
      strictMode: isStrict(),
      timestamp: Date.now()
    };
  }
};

export { phase1, MODULE_ID, VERSION };
export default phase1;
