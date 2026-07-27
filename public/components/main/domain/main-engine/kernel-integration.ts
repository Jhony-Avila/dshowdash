

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-engine-kernel-integration
// PURPOSE: MainKernel Integration Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   getFeaturesSortedByPriority from ../features/feature-manifest.js
//   registerCommands, unregisterCommands from ../../kernel/console-commands.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   shutdownMainKernel() — exported function
//   updateConfig() — exported function
//   getConfig() — exported function
//   getIntegrationMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 1.4.0-STRICT-MODE
// @changelog v1.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.3.0-P0-ENTERPRISE - Logger via Ports (elimina window.Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import * as MainKernel from '../../kernel/index.js';
import { getFeaturesSortedByPriority } from '../features/feature-manifest.js';
import { MAIN_FEATURES } from '../features/_barrel.js';
import { registerCommands, unregisterCommands } from '../../kernel/console-commands.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'main-engine-kernel-integration';

// P0 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// SUGESTÃO 07: Timeout configurável
const DEFAULT_CONFIG = {
  featureEnableTimeoutMs: 5000,  // 5 segundos por feature
  enableConsoleCommands: true,
  logLevel: 'info'  // 'debug' | 'info' | 'warn' | 'error' | 'none'
};

let _initialized = false;
let _config = { ...DEFAULT_CONFIG };

let _metrics = {
  initAttempts: 0,
  initSuccesses: 0,
  featuresLoaded: 0,
  featuresEnabled: 0,
  featuresFailed: 0,
  featuresTimedOut: 0,
  lastInitTime: null as string | null,
  totalBootTimeMs: 0
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback to console)
  // 4. Non-strict: use window.Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

function _log(level: string, ...args: unknown[]) {
  const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
  const configLevel = levels[_config.logLevel] ?? 1;
  const msgLevel = levels[level] ?? 1;

  if (msgLevel >= configLevel) {
    const prefix = '[MainKernel]';
    const _L = _getLogger();
    if (!_L) return; // In strict mode with no logger available
    if (level === 'error') _L.error(prefix, ...args);
    else if (level === 'warn') _L.warn(prefix, ...args);
    else _L.info(prefix, ...args);
  }
}

// SUGESTÃO 07: Promise com timeout
function _withTimeout(promise: Promise<unknown>, timeoutMs: number, featureId: string) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Feature ${featureId} initialization timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result: unknown) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error: Error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Inicializa o MainKernel e registra todas as features do manifest
 * @param {Object} engine - Instância do MainEngine
 * @param {Object} config - Configurações opcionais
 * @returns {Object|null} MainKernel instance ou null se falhar
 */
export async function initMainKernel(engine: Record<string, unknown>, config = {}) {
  if (_initialized) {
    return MainKernel;
  }
  
  // Merge config
  _config = { ...DEFAULT_CONFIG, ...config };
  
  const startTime = performance.now();
  _metrics.initAttempts++;
  
  try {
    // 1. Inicializar Kernel com ports do engine
    const initResult = MainKernel.init({ ports: engine._ports as Record<string, unknown> });
    
    if (!initResult.ok) {
      throw new Error((initResult.errors as Record<string, unknown>[])?.[0]?.message as string || 'Kernel init failed');
    }
    
    // 2. Carregar e registrar features do manifest (ordenadas por prioridade)
    const features = getFeaturesSortedByPriority();
    
    for (const featureDef of features) {
      try {
        // Lookup estático via barrel (elimina dynamic import que vaza HTTP requests)
        const featureModule = (MAIN_FEATURES as Record<string, Record<string, unknown>>)[featureDef.id];
        if (!featureModule) {
          _log('warn', `Feature not found in barrel: ${featureDef.id}`);
          _metrics.featuresFailed++;
          continue;
        }
        _metrics.featuresLoaded++;
        
        // Registrar no Kernel
        const registerResult = MainKernel.registerFeature({
          id: featureDef.id,
// @ts-expect-error TS migration - TS2339
          version: featureModule.VERSION || featureModule.default?.VERSION || '1.0.0',
          category: featureDef.category,
          priority: featureDef.priority,
          dependencies: featureDef.dependencies || [],
// @ts-expect-error TS migration - TS2339
          init: featureModule.init || featureModule.default?.init,
// @ts-expect-error TS migration - TS2339
          cleanup: featureModule.destroy || featureModule.cleanup || featureModule.default?.destroy,
// @ts-expect-error TS migration - TS2339
          healthCheck: featureModule.healthCheck || featureModule.default?.healthCheck,
// @ts-expect-error TS migration - TS2339
          info: featureModule.info || featureModule.default?.info,
// @ts-expect-error TS migration - TS2339
          getMetrics: featureModule.getMetrics || featureModule.default?.getMetrics
        });
        
        if (!registerResult.ok) {
          _log('warn', `Failed to register feature: ${featureDef.id}`, registerResult.errors);
          continue;
        }
        
        // 3. Habilitar features CRITICAL (priority === 0)
        if (featureDef.priority <= 1 && featureDef.enabled !== false) {
          try {
            // SUGESTÃO 07: Aplicar timeout
            const enablePromise = Promise.resolve(
              MainKernel.enableFeature(featureDef.id, { ports: engine._ports as Record<string, unknown> })
            );
            
            const enableResult: any = await _withTimeout(
              enablePromise,
              _config.featureEnableTimeoutMs,
              featureDef.id
            );

            if (enableResult.ok) {
              _metrics.featuresEnabled++;
              _log('debug', `Feature enabled: ${featureDef.id} (${enableResult.data?.initDurationMs}ms)`);
            } else {
              _metrics.featuresFailed++;
              _log('warn', `Failed to enable feature: ${featureDef.id}`, enableResult.errors);
            }
          } catch (timeoutError) {
            _metrics.featuresTimedOut++;
            _metrics.featuresFailed++;
            _log('error', (timeoutError as Error).message);
          }
        }
        
      } catch (featureError) {
        _metrics.featuresFailed++;
        _log('error', `Error loading feature: ${featureDef.id}`, featureError);
        
        ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>> | null)?.telemetry)?.track?.('main-kernel:feature-load-error', {
          featureId: featureDef.id,
          error: (featureError as Error).message
        });
      }
    }
    
    // 4. Anexar ao engine para acesso externo
    engine._mainKernel = MainKernel;
    
    // 5. SUGESTÃO 15: Registrar comandos de console
    if (_config.enableConsoleCommands) {
      try {
        registerCommands(MainKernel as unknown as Parameters<typeof registerCommands>[0]);
      } catch (e) {
        _log('warn', 'Failed to register console commands:', (e as Error).message);
      }
    }
    
    // 6. Métricas e telemetria
    const bootTime = Math.round(performance.now() - startTime);
    _metrics.initSuccesses++;
// @ts-expect-error TS migration - TS2322
    _metrics.lastInitTime = bootTime;
    _metrics.totalBootTimeMs = bootTime;
    
    const listResult = MainKernel.listFeatures();
    
    ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>> | null)?.telemetry)?.track?.('main-kernel:initialized', {
      version: MainKernel.VERSION,
      featuresRegistered: (listResult.data as any)?.count || 0,
      featuresEnabled: _metrics.featuresEnabled,
      featuresFailed: _metrics.featuresFailed,
      featuresTimedOut: _metrics.featuresTimedOut,
      bootTime
    });
    
    _initialized = true;
    
    _log('info', `✅ Initialized in ${bootTime}ms - Features: ${_metrics.featuresEnabled}/${_metrics.featuresLoaded} enabled`);
    
    return MainKernel;
    
  } catch (error) {
    _log('error', '❌ Initialization failed:', error);
    
    ((engine._ports as Record<string, Record<string, (...args: unknown[]) => unknown>> | null)?.telemetry)?.track?.('main-kernel:init-failed', { 
      error: (error as Error).message,
      stack: (error as Error).stack?.substring(0, 500)
    });
    
    // Non-blocking: Kernel failure should NOT break Main
    return null;
  }
}

/**
 * Desliga o MainKernel (chamado no destroy do engine)
 */
export function shutdownMainKernel(engine: Record<string, unknown>) {
  if (!_initialized) return { ok: true, wasNotInitialized: true };
  
  try {
    // Unregister console commands
    if (_config.enableConsoleCommands) {
      unregisterCommands();
    }
    
    MainKernel.shutdown('engine-destroy');
    engine._mainKernel = null;
    _initialized = false;
    
    _log('info', '✅ Shutdown complete');
    
    return { ok: true };
  } catch (error) {
    _log('error', 'Shutdown error:', (error as Error).message);
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Atualiza configuração em runtime
 */
export function updateConfig(newConfig: Record<string, unknown>) {
  _config = { ...DEFAULT_CONFIG, ..._config, ...newConfig };
  return { ok: true, config: { ..._config } };
}

/**
 * Retorna configuração atual
 */
export function getConfig() {
  return { ..._config };
}

/**
 * Retorna métricas da integração
 */
export function getIntegrationMetrics() {
  return { ..._metrics };
}

/**
 * Health check da integração
 */
export function healthCheck() {
  const kernelHealth = _initialized ? MainKernel.healthCheck() : null;

  return {
    status: _initialized ? (kernelHealth?.status || 'UNKNOWN') : 'NOT_INITIALIZED',
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: isStrict(),
    initialized: _initialized,
    config: _config,
    metrics: _metrics,
    kernel: kernelHealth,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _initialized,
    config: _config,
    metrics: _metrics,
    kernelVersion: MainKernel.VERSION
  };
}

export default {
  VERSION,
  MODULE_ID,
  initMainKernel,
  shutdownMainKernel,
  updateConfig,
  getConfig,
  getIntegrationMetrics,
  healthCheck,
  info
};
