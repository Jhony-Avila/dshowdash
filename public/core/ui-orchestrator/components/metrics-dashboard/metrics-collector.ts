// Metrics Dashboard - Collector
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 1.0.0-ENTERPRISE
// Coleta de métricas do Orchestrator (reutilizável)
'use strict';

export const VERSION = '1.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'metrics-collector';

export function collectMetrics() {
  const metrics: Record<string, unknown> = {
    orchestrator: null as unknown,
    adapter: null as unknown,
    execution: null as unknown,
    canvas: null as unknown,
    timeline: null as unknown,
    triggers: 0,
    intentsEmitted: 0,
    navigations: 0,
    errors: 0
  };

  // UIOrchestrator
  if (window.UIOrchestrator?.info) {
    const info = window.UIOrchestrator.info();
    metrics.orchestrator = {
      version: info.version,
      initialized: info.initialized,
      intents: info.resolver?.intentCount || 0,
      routes: info.resolver?.routeCount || 0
    };
    metrics.intentsEmitted = info.metrics?.intentsEmitted || 0;
  }

  // IntentAdapter
  if (window.IntentAdapter?.info) {
    const info = window.IntentAdapter.info();
    metrics.adapter = {
      intercepted: info.metrics?.intercepted || 0,
      mapped: info.metrics?.mapped || 0,
      passthrough: info.metrics?.passthrough || 0
    };
  }

  // ExecutionHandler
  if (window.ExecutionHandler?.getMetrics) {
    const m = window.ExecutionHandler.getMetrics();
    metrics.execution = {
      navigations: m.navigations || 0,
      panelsOpened: m.panelsOpened || 0,
      actionsExecuted: m.actionsExecuted || 0,
      errors: m.errors || 0
    };
    metrics.navigations = m.navigations || 0;
    metrics.errors += m.errors || 0;
  }

  // CanvasEngine
  if (window.CanvasEngine?.info) {
    const info = window.CanvasEngine.info();
    metrics.canvas = {
      mode: info.state?.mode || 'single',
      panelCount: info.state?.panels?.length || 0,
      modeChanges: info.metrics?.modeChanges || 0
    };
  }

  // EventTimeline
  if (window.EventTimeline?.info) {
    const info = window.EventTimeline.info();
    metrics.timeline = {
      eventCount: info.eventCount || 0,
      paused: info.paused || false
    };
  }

  return metrics;
}

export function exportMetrics() {
  const metrics = collectMetrics();
  const data = {
    timestamp: new Date().toISOString(),
    metrics
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orchestrator-metrics-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default { collectMetrics, exportMetrics, VERSION, MODULE_ID };
