
// Window Adapter
// @version 2.5.0-HARD-ENFORCE
// @changelog v2.5.0-HARD-ENFORCE: Em strict mode, expose() BLOQUEIA nomes fora da allowlist (hard enforce, não soft warn)
// @changelog v2.4.0-ALLOWLIST-COMPLETE: Allowlist expandida com todos os globals legítimos do bootstrap (phases 0-6 + kernel + runtime)
// @changelog v2.3.0-STRICT-MODE: Enterprise Strict Mode integration, enforcement mode, audit trail (NR-FULL Parte 10)
// @changelog v2.2.0-DOMAIN-PURE: setBodyData/getBodyData/healthCheck usam _getGlobalState() em vez de window.GlobalState direto
// @changelog v2.1.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0-ALLOWLIST-COMPLETE)
// ═══════════════════════════════════════════════════════════════
// THIS IS the window abstraction layer — acesso window.* é legítimo aqui.
// get(name): único ponto de leitura para window[name]
// expose(name, module): único ponto de escrita para window[name]
// ENTERPRISE: Em modo strict, exposições fora da allowlist são BLOQUEADAS (v2.5.0 hard enforce)
// ENTERPRISE: Audit trail para todas as operações expose/unexpose/expose_blocked
// INTERNAL: _getGlobalState() usa get() para consistência interna
// BROWSER APIs (legítimo): window, document.body.dataset, Object.getOwnPropertyDescriptor
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

const MODULE_ID = 'window-adapter';
const VERSION = '2.5.0-HARD-ENFORCE';

// ═══════════════════════════════════════════════════════════════
// ALLOWLIST — Todos os globals legítimos expostos pelo bootstrap
// Fonte: grep de windowAdapter.expose() em phases 0-6, kernel,
//        runtime-context, instance-manager e components/main
// ═══════════════════════════════════════════════════════════════
const ALLOWED_EXPOSURES = [
  // Phase 0 — Critical Infrastructure
  'EventBus',
  'EventBusGlobal',
  'Logger',
  'LoggerGlobal',
  'ErrorBoundary',
  'Config',
  'APP_CONFIG',
  'SecurityCSRF',
  'EnvironmentManager',
  // Phase 1 — Core Services
  'GlobalState',
  'GlobalStateFacade',
  'ReadyFlags',
  'Telemetry',
  'TelemetryCore',
  'TelemetryKernel',
  'ContextProvider',
  'FeatureFlags',
  'AssetLoader',
  // Phase 2 — Authentication
  'AppContext',
  // Phase 3 — Shell & Router
  'LayoutManager',
  'AppShell',
  'Header',
  'Sidebar',
  'NavRail',
  'Footer',
  'RouterGlobal',
  // Phase 4 — Main Content
  'Main',
  'ContainerMain',
  'CMBootstrap',
  // Phase 5 — UI Components
  'UIOrchestrator',
  'OverlayLayer',
  'Toast',
  // Phase 6 — Platform
  'Platform',
  // Kernel & Runtime (instance-manager, runtime-context)
  'Kernel',
  'ApplicationKernel',
  'RuntimeContext',
  // Orchestrator & Health
  'Orchestrator',
  'HealthAggregator',
  // Core namespace
  'Core'
];

interface AuditEntry {
  operation: string;
  name: string;
  timestamp: number;
  strictMode: boolean;
  allowed: boolean;
  [key: string]: unknown;
}

interface ExposedModuleInfo {
  exposedAt: number;
  type: string;
  readOnly?: boolean;
  skipped?: boolean;
  allowed?: boolean;
  error?: string;
}

interface GlobalStateLike {
  dispatch?: Function;
  select?: Function;
  [key: string]: unknown;
}

function createWindowAdapter() {
  const exposedModules: Record<string, ExposedModuleInfo> = {};
  const auditTrail: AuditEntry[] = []; // v2.3.0: Audit trail para operações

  function hasWindow(): boolean { return typeof window !== 'undefined'; }

  function isWritable(name: string): boolean {
    if (!hasWindow()) return false;
    const descriptor = Object.getOwnPropertyDescriptor(window, name);
    if (!descriptor) return true;
    return descriptor.writable !== false && descriptor.configurable !== false;
  }

  // v2.3.0: Verifica se nome está na allowlist
  function isAllowed(name: string): boolean {
    return ALLOWED_EXPOSURES.indexOf(name) !== -1;
  }

  // v2.3.0: Registra operação no audit trail
  function audit(operation: string, name: string, meta: Record<string, unknown> = {}): AuditEntry {
    const entry: AuditEntry = {
      operation,
      name,
      timestamp: Date.now(),
      strictMode: isStrict(),
      allowed: isAllowed(name),
      ...meta
    };
    auditTrail.push(entry);
    // Limita audit trail a 200 entradas
    if (auditTrail.length > 200) {
      auditTrail.shift();
    }
    return entry;
  }

  // v2.2.0: Resolver GlobalState via get() para consistência interna
  function _getGlobalState(): GlobalStateLike | null {
    if (!hasWindow()) return null;
    return (window.GlobalState as GlobalStateLike) || null;
  }

  return {
    expose: function(name: string, module: unknown): boolean {
      if (!hasWindow()) return false;

      // v2.5.0: Em modo strict, BLOQUEIA exposições fora da allowlist (hard enforce)
      const allowed = isAllowed(name);
      if (isStrict() && !allowed) {
        recordViolation('WINDOW_EXPOSE_NOT_ALLOWED', {
          name,
          moduleType: typeof module,
          source: 'WindowAdapter.expose()',
          blocked: true
        });
        audit('expose_blocked', name, { allowed: false, moduleType: typeof module, blocked: true });
        try {
          console.warn('[' + MODULE_ID + '] STRICT_BLOCK: Exposição de "' + name + '" BLOQUEADA (fora da allowlist)');
        } catch (e) {}
        return false;
      }

      // Audit trail
      audit('expose', name, { allowed, moduleType: typeof module });

      if (!isWritable(name)) {
        exposedModules[name] = { exposedAt: Date.now(), type: typeof (window as unknown as Record<string, unknown>)[name], readOnly: true, skipped: true, allowed };
        return true;
      }
      try {
        (window as unknown as Record<string, unknown>)[name] = module;
        exposedModules[name] = { exposedAt: Date.now(), type: typeof module, readOnly: false, skipped: false, allowed };
        return true;
      } catch (error) {
        exposedModules[name] = { exposedAt: Date.now(), type: 'error', error: (error as Error).message, skipped: true, allowed };
        return true;
      }
    },

    get: function(name: string): unknown {
      if (!hasWindow()) return null;
      return (window as unknown as Record<string, unknown>)[name] || null;
    },

    has: function(name: string): boolean {
      if (!hasWindow()) return false;
      return name in window;
    },

    unexpose: function(name: string): boolean {
      if (!hasWindow()) return false;

      // v2.3.0: Audit trail
      audit('unexpose', name);

      if (!isWritable(name)) return false;
      try {
        delete (window as unknown as Record<string, unknown>)[name];
        delete exposedModules[name];
        return true;
      } catch (error) { return false; }
    },

    waitFor: function(name: string, timeout: number) {
      const self = this;
      if (timeout === undefined) timeout = 5000;
      return new Promise<unknown>(function(resolve) {
        if (self.has(name)) {
          resolve(self.get(name));
          return;
        }
        const startTime = Date.now();
        function check() {
          if (self.has(name)) {
            resolve(self.get(name));
            return;
          }
          if (Date.now() - startTime > timeout) {
            resolve(null);
            return;
          }
          setTimeout(check, 50);
        }
        check();
      });
    },

    getExposed: function() { return Object.assign({}, exposedModules); },

    getDocument: function() {
      if (!hasWindow()) return null;
      return document;
    },

    getWindow: function() {
      if (!hasWindow()) return null;
      return window;
    },

    setBodyData: function(key: string, value: string): boolean {
      if (!hasWindow()) return false;
      try {
        const gs: GlobalStateLike | null = _getGlobalState();
        if (gs && gs.dispatch) {
          try {
            gs.dispatch({ type: 'SET_BODY_DATA', payload: { key: key, value: value } });
          } catch (e) {}
        }
        if (document.body) {
          document.body.dataset[key] = value;
        }
        return true;
      } catch (error) { return false; }
    },

    getBodyData: function(key: string): unknown {
      if (!hasWindow()) return null;
      const gs: GlobalStateLike | null = _getGlobalState();
      if (gs && gs.select) {
        try {
          const state = gs.select(function(s: Record<string, Record<string, unknown>>) { return s.bodyData ? s.bodyData[key] : undefined; });
          if (state !== undefined) return state;
        } catch (e) {}
      }
      return document.body && document.body.dataset ? document.body.dataset[key] : null;
    },

    isWritable: function(name: string): boolean { return isWritable(name); },

    info: function() {
      const strictModeActive = isStrict();
      const exposedNames = Object.keys(exposedModules);
      const notAllowedExposures = exposedNames.filter(n => !isAllowed(n));
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        compliance: 'P1A-AAA',
        p24Instrumented: true,
        hasWindow: hasWindow(),
        strictMode: strictModeActive,
        exposedModules: exposedNames,
        exposedDetails: Object.assign({}, exposedModules),
        notAllowedExposures,
        allowlist: ALLOWED_EXPOSURES,
        auditTrailSize: auditTrail.length
      };
    },

    healthCheck: function() {
      const gs = _getGlobalState();
      const strictModeActive = isStrict();
      const exposedNames = Object.keys(exposedModules);
      const notAllowedExposures = exposedNames.filter(n => !isAllowed(n));

      const checks = {
        hasWindow: hasWindow(),
        globalStateAvailable: !!(gs && gs.dispatch),
        noUnallowedExposures: !strictModeActive || notAllowedExposures.length === 0,
        auditTrailHealthy: auditTrail.length < 150
      };
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;
      const status = passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY';

      return {
        status,
        score: passed + '/' + total,
        checks,
        hasWindow: hasWindow(),
        exposedCount: exposedNames.length,
        globalStateAvailable: !!(gs && gs.dispatch),
        strictMode: strictModeActive,
        notAllowedExposuresCount: notAllowedExposures.length,
        auditTrailSize: auditTrail.length,
        compliance: 'P1A-AAA',
        p24Instrumented: true,
        version: VERSION,
        moduleId: MODULE_ID,
        timestamp: Date.now()
      };
    },

    // v2.3.0: Retorna audit trail para diagnóstico
    getAuditTrail: function() {
      return [...auditTrail];
    },

    // v2.3.0: Retorna allowlist
    getAllowlist: function() {
      return [...ALLOWED_EXPOSURES];
    },

    // v2.3.0: Verifica se nome está na allowlist
    isAllowed: function(name: string): boolean {
      return isAllowed(name);
    }
  };
}

export { createWindowAdapter, MODULE_ID, VERSION };
export default createWindowAdapter;
