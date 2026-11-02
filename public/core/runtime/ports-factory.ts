// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.6.0-REQUIRED-PORTS)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.runtime.ports-factory
// PURPOSE: Factory de containers de ports com init lazy, inject explícito
// ───────────────────────────────────────────────────────────────
// @contract RUNTIME_FOUNDATION - Base para injeção de dependências
// @contract PORTS_PATTERN - Permite DI sem acoplamento direto a window
// @contract ENTERPRISE_STRICT - Em modo strict, ports obrigatórias lançam erro se ausentes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, assertStrict, recordViolation from strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createPorts(options) — factory principal
//     → init() — inicializa ports
//     → inject(ports) — injeta dependências
//     → get(portName) — obtém port
//     → getStrict(portName) — obtém port ou lança erro em strict mode
//     → validateRequired() — valida ports obrigatórias, lança erro em strict se faltam
//     → has(portName) — verifica se port existe
//     → snapshot() — estado atual
//     → isInitialized() — verifica inicialização
//     → reset() — reseta estado
//     → info() — informações do container
//     → healthCheck() — status de saúde
//
// @changelog v1.6.0-REQUIRED-PORTS: Conceito de ports obrigatórias, validateRequired(), violation para missing ports
// @changelog v1.5.0-STRICT-MODE: Enterprise Strict Mode integration (NR-FULL Parte 10)
// @changelog v1.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.3.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, assertStrict, recordViolation, EnterpriseViolationError } from '/core/runtime/enterprise/strict-mode.js';

interface PortSpec {
  [portName: string]: string | ((win: Window) => unknown) | undefined;
}

interface PortDefaults {
  [portName: string]: unknown;
}

interface CreatePortsOptions {
  moduleId?: string;
  spec?: PortSpec;
  defaults?: PortDefaults;
  allowWindowFallback?: boolean;
  required?: string[];
}

interface GetOptions {
  required?: boolean;
}

interface PortsState {
  _initialized: boolean;
  _ports: Record<string, unknown>;
  _initTimestamp: number | null;
  _injectCount: number;
  _resolveCount: number;
  _missingRequired: string[];
}

interface ValidateRequiredResult {
  valid: boolean;
  missing: string[];
  resolved: string[];
}

interface PortsHealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  score: number;
  maxScore: number;
  scoreDisplay: string;
  checks: Record<string, boolean>;
  moduleId: string;
  factoryVersion: string;
  resolvedPorts: number;
  totalPorts: number;
  requiredPorts: number;
  requiredResolved: number;
  missingRequired: string[];
  strictMode: boolean;
  p24Instrumented: boolean;
  timestamp: number;
}

interface PortsInfoResult {
  moduleId: string;
  factoryVersion: string;
  factoryModuleId: string;
  initialized: boolean;
  initTimestamp: number | null;
  specPorts: string[];
  resolvedPorts: string[];
  resolvedCount: number;
  totalPorts: number;
  requiredPorts: string[];
  missingRequired: string[];
  injectCount: number;
  resolveCount: number;
  allowWindowFallback: boolean;
  strictMode: boolean;
  p24Instrumented: boolean;
  timestamp: number;
}

interface PortsContainer {
  init: () => boolean;
  inject: (ports: Record<string, unknown>) => boolean;
  get: (portName: string, options?: GetOptions) => unknown;
  getStrict: (portName: string) => unknown;
  has: (portName: string) => boolean;
  validateRequired: () => ValidateRequiredResult;
  snapshot: () => Record<string, unknown>;
  isInitialized: () => boolean;
  reset: () => boolean;
  info: () => PortsInfoResult;
  healthCheck: () => PortsHealthCheckResult;
  moduleId: string;
}

const MODULE_ID: string = 'core.runtime.ports-factory';
const VERSION: string = '1.6.0-REQUIRED-PORTS';

const createPorts = (options: CreatePortsOptions = {}): PortsContainer => {
  const moduleId: string = options.moduleId || 'unknown-module';
  const spec: PortSpec = options.spec || {};
  const defaults: PortDefaults = options.defaults || {};
  const allowWindowFallback: boolean = options.allowWindowFallback === true;
  const required: string[] = Array.isArray(options.required) ? options.required : [];

  const _state: PortsState = {
    _initialized: false,
    _ports: {},
    _initTimestamp: null,
    _injectCount: 0,
    _resolveCount: 0,
    _missingRequired: []
  };

  // Copy defaults
  for (const key of Object.keys(defaults)) { _state._ports[key] = defaults[key]; }

  const _hasWindow = (): boolean => typeof window !== 'undefined' && !!window;

  const _resolveFromWindow = (portName: string): unknown => {
    if (!_hasWindow()) return null;
    const rule = spec[portName];
    if (!rule) return null;
    if (typeof rule === 'string') return (window as unknown as Record<string, unknown>)[rule] || null;
    if (typeof rule === 'function') { try { return rule(window) || null; } catch (e) { return null; } }
    return null;
  };

  const init = (): boolean => {
    if (_state._initialized) return true;
    const next: Record<string, unknown> = {};
    for (const key of Object.keys(_state._ports)) { next[key] = _state._ports[key]; }
    for (const portName of Object.keys(spec)) {
      if (next[portName] == null) {
        next[portName] = _resolveFromWindow(portName);
        if (next[portName] != null) _state._resolveCount++;
      }
    }
    _state._ports = next;
    _state._initialized = true;
    _state._initTimestamp = Date.now();

    // v1.6.0: Registra ports obrigatórias faltantes após init
    if (required.length > 0) {
      _state._missingRequired = required.filter((name: string) => next[name] == null);
      if (_state._missingRequired.length > 0 && isStrict()) {
        for (const portName of _state._missingRequired) {
          recordViolation('PORT_MISSING', {
            moduleId,
            portName,
            phase: 'init',
            source: 'ports-factory.init()'
          });
        }
      }
    }
    return true;
  };

  const inject = (ports: Record<string, unknown>): boolean => {
    if (ports && typeof ports === 'object') {
      for (const k of Object.keys(ports)) {
        if (ports[k] !== undefined) { _state._ports[k] = ports[k]; _state._injectCount++; }
      }
    }
    _state._initialized = true;
    if (!_state._initTimestamp) _state._initTimestamp = Date.now();
    return true;
  };

  const get = (portName: string, options: GetOptions = {}): unknown => {
    if (!_state._initialized) init();
    let value: unknown = _state._ports[portName] != null ? _state._ports[portName] : null;

    // Em modo strict, window fallback é desabilitado a menos que explicitamente permitido
    const canUseFallback: boolean = allowWindowFallback && !isStrict();

    if (value == null && canUseFallback) {
      value = _resolveFromWindow(portName);
      if (value != null) {
        _state._ports[portName] = value;
        _state._resolveCount++;
        // Registra uso de fallback para auditoria
        recordViolation('WINDOW_FALLBACK_USED', {
          moduleId,
          portName,
          source: 'ports-factory.get()'
        });
      }
    }

    // Em modo strict com required=true, lança erro se port não disponível
    if (value == null && options.required === true) {
      assertStrict(
        false,
        `Port obrigatória "${portName}" não disponível para módulo "${moduleId}"`,
        { type: 'PORT_REQUIRED_MISSING', portName, moduleId }
      );
    }

    return value;
  };

  /**
   * Obtém port de forma estrita - lança erro se não disponível em modo strict
   * @param portName - Nome do port
   * @throws {EnterpriseViolationError} se port não disponível e strict mode ativo
   * @returns valor do port
   */
  const getStrict = (portName: string): unknown => {
    const value = get(portName);
    if (value == null && isStrict()) {
      throw new EnterpriseViolationError(
        `Port "${portName}" é obrigatória mas não está disponível`,
        { type: 'PORT_STRICT_MISSING', portName, moduleId }
      );
    }
    return value;
  };

  /**
   * v1.6.0: Valida ports obrigatórias — lança erro em strict mode se alguma falta
   * @throws {EnterpriseViolationError} se strict mode ativo e required ports faltam
   * @returns {{ valid: boolean, missing: string[], resolved: string[] }}
   */
  const validateRequired = (): ValidateRequiredResult => {
    if (!_state._initialized) init();
    const missing: string[] = required.filter((name: string) => _state._ports[name] == null);
    const resolved: string[] = required.filter((name: string) => _state._ports[name] != null);
    if (missing.length > 0 && isStrict()) {
      throw new EnterpriseViolationError(
        `Ports obrigatórias faltando para "${moduleId}": [${missing.join(', ')}]`,
        { type: 'PORT_REQUIRED_MISSING', moduleId, missing, resolved, total: required.length }
      );
    }
    return { valid: missing.length === 0, missing, resolved };
  };

  const has = (portName: string): boolean => !!get(portName);

  const snapshot = (): Record<string, unknown> => {
    if (!_state._initialized) init();
    const result: Record<string, unknown> = { _initialized: _state._initialized, _moduleId: moduleId };
    for (const key of Object.keys(_state._ports)) { result[key] = _state._ports[key]; }
    return result;
  };

  const isInitialized = (): boolean => _state._initialized;

  const reset = (): boolean => {
    _state._ports = {};
    for (const key of Object.keys(defaults)) { _state._ports[key] = defaults[key]; }
    _state._initialized = false;
    _state._initTimestamp = null;
    _state._injectCount = 0;
    _state._resolveCount = 0;
    _state._missingRequired = [];
    return true;
  };

  const info = (): PortsInfoResult => {
    const portNames: string[] = Object.keys(spec);
    const resolvedPorts: string[] = portNames.filter((name: string) => _state._ports[name] != null);
    return { moduleId, factoryVersion: VERSION, factoryModuleId: MODULE_ID, initialized: _state._initialized, initTimestamp: _state._initTimestamp, specPorts: portNames, resolvedPorts, resolvedCount: resolvedPorts.length, totalPorts: portNames.length, requiredPorts: [...required], missingRequired: [..._state._missingRequired], injectCount: _state._injectCount, resolveCount: _state._resolveCount, allowWindowFallback, strictMode: isStrict(), p24Instrumented: true, timestamp: Date.now() };
  };

  const healthCheck = (): PortsHealthCheckResult => {
    const portNames: string[] = Object.keys(spec);
    const resolvedPorts: string[] = portNames.filter((name: string) => _state._ports[name] != null);
    const resolutionRate: number = portNames.length > 0 ? resolvedPorts.length / portNames.length : 1;
    const strictModeActive: boolean = isStrict();
    const requiredResolved: string[] = required.filter((name: string) => _state._ports[name] != null);
    const allRequiredMet: boolean = required.length === 0 || requiredResolved.length === required.length;
    const checks: Record<string, boolean> = {
      initialized: _state._initialized,
      hasSpec: portNames.length > 0,
      portsResolved: resolutionRate >= 0.5,
      requiredPortsMet: allRequiredMet,
      noErrors: true,
      strictModeCompliant: !strictModeActive || (resolutionRate >= 0.8 && allRequiredMet)
    };
    const passed: number = Object.values(checks).filter(Boolean).length;
    const total: number = Object.keys(checks).length;
    const status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY';
    return { status, score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, moduleId, factoryVersion: VERSION, resolvedPorts: resolvedPorts.length, totalPorts: portNames.length, requiredPorts: required.length, requiredResolved: requiredResolved.length, missingRequired: _state._missingRequired, strictMode: strictModeActive, p24Instrumented: true, timestamp: Date.now() };
  };

  return { init, inject, get, getStrict, has, validateRequired, snapshot, isInitialized, reset, info, healthCheck, moduleId };
};

export { MODULE_ID, VERSION, createPorts };
export default { MODULE_ID, VERSION, createPorts };
