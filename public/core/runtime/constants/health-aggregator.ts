// Migrado para TypeScript: 2026-02-25
// Health Aggregator - Agregador de health de todos os componentes
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// @version 1.0.0
// @description Coleta e agrega healthCheck de todos os subsistemas
// @melhoria #01 - Health score unificado do sistema
'use strict';

export const MODULE_ID = 'health-aggregator' as const;
export const VERSION = '1.0.0' as const;

interface ComponentEntry {
  name: string;
  healthCheck: () => HealthResult;
  registeredAt: number;
}

interface HealthResult {
  status?: string;
  error?: string;
  [key: string]: unknown;
}

interface AggregationResult {
  status: string;
  score: number;
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  errors: number;
  components: Record<string, HealthResult>;
  timestamp: number;
}

interface HealthAggregatorInfo {
  moduleId: typeof MODULE_ID;
  version: typeof VERSION;
  registeredComponents: number;
  componentNames: string[];
  lastAggregation: { status: string; score: number; timestamp: number } | null;
}

let _components: Record<string, ComponentEntry> = {};
let _lastAggregation: AggregationResult | null = null;

export function registerComponent(name: string, healthCheckFn: () => HealthResult): boolean {
  if (typeof healthCheckFn !== 'function') return false;
  _components[name] = {
    name,
    healthCheck: healthCheckFn,
    registeredAt: Date.now()
  };
  return true;
}

export function unregisterComponent(name: string): boolean {
  if (_components[name]) {
    delete _components[name];
    return true;
  }
  return false;
}

export function aggregate(): AggregationResult {
  const names = Object.keys(_components);
  const results: Record<string, HealthResult> = {};
  let healthyCount: number = 0;
  let degradedCount: number = 0;
  let unhealthyCount: number = 0;
  let errorCount: number = 0;
  const total: number = names.length;

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    try {
      const result = _components[name].healthCheck();
      results[name] = result;
      const status = (result && result.status) ? String(result.status).toUpperCase() : 'UNKNOWN';
      if (status === 'HEALTHY') healthyCount++;
      else if (status === 'DEGRADED') degradedCount++;
      else if (status === 'UNHEALTHY') unhealthyCount++;
      else errorCount++;
    } catch (e: unknown) {
      results[name] = { status: 'ERROR', error: (e as Error).message };
      errorCount++;
    }
  }

  let score: number = total > 0 ? Math.round((healthyCount / total) * 100) : 0;
  if (degradedCount > 0 && score > 50) {
    score = score - (degradedCount * 10);
  }
  if (score < 0) score = 0;

  let overallStatus: string = 'HEALTHY';
  if (unhealthyCount > 0 || errorCount > 0) overallStatus = 'UNHEALTHY';
  else if (degradedCount > 0) overallStatus = 'DEGRADED';

  _lastAggregation = {
    status: overallStatus,
    score,
    total,
    healthy: healthyCount,
    degraded: degradedCount,
    unhealthy: unhealthyCount,
    errors: errorCount,
    components: results,
    timestamp: Date.now()
  };

  return _lastAggregation;
}

export function getLastAggregation(): AggregationResult | null {
  return _lastAggregation;
}

export function getScore(): number {
  if (!_lastAggregation) aggregate();
  return _lastAggregation ? _lastAggregation.score : 0;
}

export function getStatus(): string {
  if (!_lastAggregation) aggregate();
  return _lastAggregation ? _lastAggregation.status : 'UNKNOWN';
}

export function getRegisteredComponents(): string[] {
  return Object.keys(_components);
}

export function reset(): void {
  _components = {};
  _lastAggregation = null;
}

export function info(): HealthAggregatorInfo {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    registeredComponents: Object.keys(_components).length,
    componentNames: Object.keys(_components),
    lastAggregation: _lastAggregation ? {
      status: _lastAggregation.status,
      score: _lastAggregation.score,
      timestamp: _lastAggregation.timestamp
    } : null
  };
}

export default {
  MODULE_ID,
  VERSION,
  registerComponent,
  unregisterComponent,
  aggregate,
  getLastAggregation,
  getScore,
  getStatus,
  getRegisteredComponents,
  reset,
  info
};
