// UI Orchestrator - DevTools Unified
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.2.0-ENTERPRISE - Logger fallback pattern for console calls
// @changelog v1.1.0-P18EC - Events Contracts Migration
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { NAV_EVENTS } from '/core/runtime/events/catalog/nav.events.js';

export const VERSION = '2.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.utils.devtools';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};

// DevTools usa console diretamente pois é ferramenta de desenvolvimento
const _devLog = (level: string, ...args: unknown[]) => {
  const fn = level === 'error' ? console.error : console.log;
  fn(...args);
};

export function init() {
  if (_initialized) return { success: true, alreadyInitialized: true };
  if (typeof window === 'undefined') return { success: false, error: 'No window object' };
  
  _initPorts();
  
  window.__dev = window.__dev || {};
  
  window.__dev.orchestrator = {
    VERSION,
    
    status: () => ({
      orchestrator: window.UIOrchestrator?.healthCheck?.() || null,
      execution: window.ExecutionHandler?.healthCheck?.() || null,
      canvas: window.CanvasEngine?.healthCheck?.() || null,
      timeline: window.EventTimeline?.healthCheck?.() || null,
      bridges: window.__ORCHESTRATOR_BRIDGES__ ? {
        router: window.__ORCHESTRATOR_BRIDGES__.router?.healthCheck?.() || null,
        panel: window.__ORCHESTRATOR_BRIDGES__.panel?.healthCheck?.() || null
      } : null
    }),
    
    info: () => ({
      orchestrator: window.UIOrchestrator?.info?.() || null,
      execution: window.ExecutionHandler?.info?.() || null,
      canvas: window.CanvasEngine?.info?.() || null,
      timeline: window.EventTimeline?.info?.() || null,
      bridges: window.__ORCHESTRATOR_BRIDGES__ ? {
        router: window.__ORCHESTRATOR_BRIDGES__.router?.info?.() || null,
        panel: window.__ORCHESTRATOR_BRIDGES__.panel?.info?.() || null
      } : null
    }),
    
    metrics: () => ({
      execution: window.ExecutionHandler?.getMetrics?.() || null,
      routerBridge: window.__ORCHESTRATOR_BRIDGES__?.router?.getMetrics?.() || null,
      panelBridge: window.__ORCHESTRATOR_BRIDGES__?.panel?.getMetrics?.() || null,
      timeline: window.EventTimeline?.getMetrics?.() || null,
      canvas: window.CanvasEngine?.getMetrics?.() || null
    }),
    
    emit: (intentId: string, payload: Record<string, unknown> = {}) => {
      if (!window.UIOrchestrator?.emit) {
        _devLog('error', '[DevTools] UIOrchestrator not available');
        return null;
      }
      _devLog('log', `[DevTools] Emitting intent: ${intentId}`, payload);
      return window.UIOrchestrator.emit(intentId, payload, 'devtools');
    },
    
    navigate: (path: string) => {
      if (!window.UIOrchestrator?.emit) {
        _devLog('error', '[DevTools] UIOrchestrator not available');
        return null;
      }
      _devLog('log', `[DevTools] Navigate to: ${path}`);
      return window.UIOrchestrator.emit(NAV_EVENTS.NAVIGATE_PATH, { path }, 'devtools');
    },
    
    timeline: {
      start: () => window.EventTimeline?.start?.(),
      stop: () => window.EventTimeline?.stop?.(),
      pause: () => window.EventTimeline?.pause?.(),
      resume: () => window.EventTimeline?.resume?.(),
      clear: () => window.EventTimeline?.clear?.(),
      getEvents: (limit = 50) => window.EventTimeline?.getEvents?.(limit) || [],
      export: () => window.EventTimeline?.export?.(),
      subscribe: (cb: (...args: unknown[]) => void) => window.EventTimeline?.subscribe?.(cb)
    },
    
    canvas: {
      getMode: () => window.CanvasEngine?.getMode?.() || 'unknown',
      setMode: (mode: string) => window.CanvasEngine?.setMode?.(mode),
      modes: () => ['single', 'split-v', 'split-h', 'quad', 'focus'],
      openPanel: (panelId: string, region: string) => window.CanvasEngine?.openPanel?.(panelId, region),
      closePanel: (panelId: string) => window.CanvasEngine?.closePanel?.(panelId),
      getPanels: () => window.CanvasEngine?.getPanels?.() || []
    },
    
    manifest: () => {
      const info = window.UIOrchestrator?.info?.();
      return info?.manifest || null;
    },
    
    intents: () => {
      try {
        const resolver = window.UIOrchestrator?.getResolver?.();
        return resolver?.getIntents?.() || [];
      } catch {
        return [];
      }
    },
    
    resolve: (intentId: string, payload: Record<string, unknown> = {}) => {
      try {
        const resolver = window.UIOrchestrator?.getResolver?.();
        return resolver?.resolve?.({ id: intentId, payload }) || null;
      } catch (e) {
        _devLog('error', '[DevTools] Resolve error:', e);
        return null;
      }
    },
    
    help: () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║           UI ORCHESTRATOR DEVTOOLS v${VERSION}            ║
╠══════════════════════════════════════════════════════════════╣
║ COMMANDS:                                                    ║
║  __dev.orchestrator.status()     - Health check all modules  ║
║  __dev.orchestrator.info()       - Detailed info             ║
║  __dev.orchestrator.metrics()    - Consolidated metrics      ║
║  __dev.orchestrator.manifest()   - View manifest info        ║
║  __dev.orchestrator.intents()    - List available intents    ║
║                                                              ║
║ ACTIONS:                                                     ║
║  __dev.orchestrator.emit(id, payload)  - Emit intent         ║
║  __dev.orchestrator.navigate(path)     - Navigate via orch   ║
║  __dev.orchestrator.resolve(id)        - Test resolution     ║
║                                                              ║
║ TIMELINE:                                                    ║
║  __dev.orchestrator.timeline.start()   - Start recording     ║
║  __dev.orchestrator.timeline.stop()    - Stop recording      ║
║  __dev.orchestrator.timeline.getEvents()- Get recorded events║
║  __dev.orchestrator.timeline.clear()   - Clear events        ║
║                                                              ║
║ CANVAS:                                                      ║
║  __dev.orchestrator.canvas.getMode()   - Current mode        ║
║  __dev.orchestrator.canvas.setMode(m)  - Set mode            ║
║  __dev.orchestrator.canvas.modes()     - Available modes     ║
║  __dev.orchestrator.canvas.openPanel() - Open panel          ║
╚══════════════════════════════════════════════════════════════╝
      `);
    }
  };
  
  _initialized = true;
  console.log(`%c[UIOrchestrator DevTools] v${VERSION} loaded. Type __dev.orchestrator.help() for commands.`, 'color: #10b981; font-weight: bold;');
  return { success: true, version: VERSION };
}

export function healthCheck() {
  return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, portsInitialized: Ports.isInitialized() };
}

if (typeof window !== 'undefined') {
  const waitAndInit = () => {
    if (window.UIOrchestrator) { init(); }
    else { setTimeout(waitAndInit, 100); }
  };
  if (document.readyState === 'complete') { waitAndInit(); }
  else { window.addEventListener('load', waitAndInit); }
}

export default { VERSION, MODULE_ID, init, healthCheck, info, injectPorts, getPorts };
