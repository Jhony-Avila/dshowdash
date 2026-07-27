// Migrado para TypeScript: 2026-02-25
// App Adapters: Telemetry Adapter
// Abstração para envio de métricas e eventos
// Versão: 1.0.0-ENTERPRISE

export interface TelemetrySpan {
  name: string;
  startTime: number;
  end: () => number;
}

export interface TelemetryContext {
  [key: string]: unknown;
}

interface TelemetryCore {
  track(event: string, data: TelemetryContext): unknown;
  startSpan?(name: string, context: TelemetryContext): TelemetrySpan;
  flush?(): Promise<void>;
}

const getTelemetryCore = (): TelemetryCore | null =>
  (window as unknown as { TelemetryCore?: TelemetryCore; Telemetry?: TelemetryCore }).TelemetryCore
  || (window as unknown as { TelemetryCore?: TelemetryCore; Telemetry?: TelemetryCore }).Telemetry
  || null;

export function track(event: string, data: TelemetryContext = {}): unknown {
  const telemetry = getTelemetryCore();
  if (telemetry?.track) {
    return telemetry.track(event, { ...data, timestamp: Date.now() });
  }
  return null;
}

export function trackError(error: unknown, context: TelemetryContext = {}): unknown {
  return track('error', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context
  });
}

export function trackPerformance(metric: string, value: number, context: TelemetryContext = {}): unknown {
  return track('performance', {
    metric,
    value,
    ...context
  });
}

export function trackUserAction(action: string, target: string, context: TelemetryContext = {}): unknown {
  return track('user_action', {
    action,
    target,
    ...context
  });
}

export function trackNavigation(from: string, to: string, context: TelemetryContext = {}): unknown {
  return track('navigation', {
    from,
    to,
    ...context
  });
}

export function startSpan(name: string, context: TelemetryContext = {}): TelemetrySpan {
  const telemetry = getTelemetryCore();
  if (telemetry?.startSpan) {
    return telemetry.startSpan(name, context);
  }
  const startTime = performance.now();
  return {
    name,
    startTime,
    end: (): number => {
      const duration = performance.now() - startTime;
      track('span', { name, duration, ...context });
      return duration;
    }
  };
}

export function flush(): Promise<void> {
  const telemetry = getTelemetryCore();
  return telemetry?.flush?.() || Promise.resolve();
}

export default { track, trackError, trackPerformance, trackUserAction, trackNavigation, startSpan, flush };
