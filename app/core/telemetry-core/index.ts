// App Core: Telemetry Core Wrapper
// Reexporta de public/core/js/Telemetry.js e public/assets/js/core/telemetry-core
// Versão: 1.0.0-ENTERPRISE
// Migrado para TypeScript: 2026-02-25

export interface TelemetrySpan {
  end: () => void;
}

export interface TelemetryMetrics {
  [key: string]: unknown;
}

interface TelemetryInstance {
  track: (event: string, data?: Record<string, unknown>) => unknown;
  startSpan: (name: string, context?: Record<string, unknown>) => TelemetrySpan;
  getMetrics: () => TelemetryMetrics;
  [key: string]: unknown;
}

const getTelemetryCore = (): TelemetryInstance | null => (window.TelemetryCore as TelemetryInstance | undefined) || (window.Telemetry as TelemetryInstance | undefined) || null;

export function getTelemetry(): TelemetryInstance | null {
  return getTelemetryCore();
}

export function track(event: string, data: Record<string, unknown> = {}): unknown {
  const telemetry = getTelemetryCore();
  if (telemetry && typeof telemetry.track === 'function') {
    return telemetry.track(event, data);
  }
  return null;
}

export function startSpan(name: string, context: Record<string, unknown> = {}): TelemetrySpan {
  const telemetry = getTelemetryCore();
  if (telemetry && typeof telemetry.startSpan === 'function') {
    return telemetry.startSpan(name, context);
  }
  return { end: () => {} };
}

export function endSpan(span: TelemetrySpan | null): void {
  if (span && typeof span.end === 'function') {
    span.end();
  }
}

export function getMetrics(): TelemetryMetrics {
  const telemetry = getTelemetryCore();
  if (telemetry && typeof telemetry.getMetrics === 'function') {
    return telemetry.getMetrics();
  }
  return {};
}

export default { getTelemetry, track, startSpan, endSpan, getMetrics };
