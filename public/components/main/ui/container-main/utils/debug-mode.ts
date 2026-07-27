
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-NO-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:debug-mode
// PURPOSE: Debug Mode - Ferramentas de debug para desenvolvimento
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//   getEnv, ENV from ../config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEBUG_LEVELS — exported value
//   DEBUG_CATEGORIES — exported value
//   createDebugMode() — exported function
//   getDebugMode() — exported function
//   resetDebugMode() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   '*'
// WINDOW ACCESS:
//   window.__containerDebug
//   window.debug
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';
import { getEnv, ENV } from '../config.js';

export const VERSION = '1.1.0-NO-STACKTRACE';
export const MODULE_ID = 'container-main:debug-mode';

// Níveis de debug
export const DEBUG_LEVELS = Object.freeze({
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  VERBOSE: 5,
  ALL: 99
});

// Categorias de debug
export const DEBUG_CATEGORIES = Object.freeze({
  BOOT: 'boot',
  KERNEL: 'kernel',
  SLOTS: 'slots',
  PANELS: 'panels',
  EVENTS: 'events',
  PERFORMANCE: 'performance',
  STATE: 'state',
  PLUGINS: 'plugins',
  LIFECYCLE: 'lifecycle',
  NETWORK: 'network'
});

// Cria instância do Debug Mode
export function createDebugMode(options: Record<string, unknown> = {}) {
  const {
    enabled = getEnv() === ENV.DEVELOPMENT,
    level = DEBUG_LEVELS.DEBUG,
    categories = Object.values(DEBUG_CATEGORIES),
    showTimestamps = true,
    showStackTrace = false,
    persistLogs = true,
    maxLogs = 1000,
    exposeGlobal = true
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _enabled = enabled;
  let _level = level;
  let _categories = new Set(categories as any[]);
  let _logs: unknown[] = [];
  let _breakpoints = new Map();
  let _watchers = new Map();
  let _inspectedObjects = new WeakMap();
  let _eventBus = null;
  let _bootstrap: Record<string, unknown> | null = null;

  // Formata timestamp
  function _formatTime() {
    if (!showTimestamps) return '';
    const now = new Date();
    return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
  }

  // Adiciona log
  function _addLog(level: string, category: string, message: string, data: Record<string, unknown> | null = null) {
    if (!_enabled) return;
    // @ts-expect-error strict migration — TS18046
    if (level > _level) return;
    if (!_categories.has(category)) return;

    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      level,
      levelName: Object.keys(DEBUG_LEVELS).find(k => (DEBUG_LEVELS as Record<string, unknown>)[k] === level) || 'UNKNOWN',
      category,
      message,
      data,
      stack: showStackTrace ? new Error().stack : null
    };

    _logs.push(entry);
    if (_logs.length > Number(maxLogs)) _logs.shift();

    // Console output — uses console.log with color styling to avoid Chrome auto-stacktrace
    const prefix = `${_formatTime()} [${entry.levelName}] [${category}]`;

    if ((level as unknown as number) <= DEBUG_LEVELS.ERROR) {
      console.log(`%c${prefix}%c ${message}`, 'color:#ef4444;font-weight:bold', 'color:inherit', data || '');
    } else if ((level as unknown as number) <= DEBUG_LEVELS.WARN) {
      console.log(`%c${prefix}%c ${message}`, 'color:#f59e0b;font-weight:bold', 'color:inherit', data || '');
    } else if ((level as unknown as number) <= DEBUG_LEVELS.INFO) {
      console.log(`%c${prefix}%c ${message}`, 'color:#3b82f6', 'color:inherit', data || '');
    } else {
      console.log(prefix, message, data || '');
    }

    return entry;
  }

  const debug = {
    // Injeta dependências
    inject({ eventBus, bootstrap }: Record<string, unknown>) {
      _eventBus = eventBus;
      _bootstrap = bootstrap as Record<string, unknown>;

      if (_eventBus && _enabled) {
        // Escuta eventos para debug
        ((_eventBus as Record<string, unknown>).on as (...args: unknown[]) => unknown)('*', (event: string, data: Record<string, unknown>) => {
          // @ts-expect-error TS migration - TS2345
          _addLog(DEBUG_LEVELS.VERBOSE, DEBUG_CATEGORIES.EVENTS, `Event: ${event}`, data);
        });
      }
    },

    // Enable/Disable
    enable() { _enabled = true; (_logger as any).info('Debug mode enabled'); },
    disable() { _enabled = false; (_logger as any).info('Debug mode disabled'); },
    toggle() { _enabled = !_enabled; return _enabled; },
    isEnabled() { return _enabled; },

    // Level
    setLevel(level: string) { _level = level; },
    getLevel() { return _level; },

    // Categories
    enableCategory(category: string) { _categories.add(category); },
    disableCategory(category: string) { _categories.delete(category); },
    toggleCategory(category: string) {
      if (_categories.has(category)) _categories.delete(category);
      else _categories.add(category);
    },
    getCategories() { return Array.from(_categories); },

    // Logging shortcuts
    // @ts-expect-error TS migration - TS2345
    error(category: string, message: string, data: Record<string, unknown>) { return _addLog(DEBUG_LEVELS.ERROR, category, message, data); },
    // @ts-expect-error TS migration - TS2345
    warn(category: string, message: string, data: Record<string, unknown>) { return _addLog(DEBUG_LEVELS.WARN, category, message, data); },
    // @ts-expect-error TS migration - TS2345
    info(category: string, message: string, data: Record<string, unknown>) { return _addLog(DEBUG_LEVELS.INFO, category, message, data); },
    // @ts-expect-error TS migration - TS2345
    log(category: string, message: string, data: Record<string, unknown>) { return _addLog(DEBUG_LEVELS.DEBUG, category, message, data); },
    // @ts-expect-error TS migration - TS2345
    verbose(category: string, message: string, data: Record<string, unknown>) { return _addLog(DEBUG_LEVELS.VERBOSE, category, message, data); },

    // Quick logs
    boot(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.BOOT, message, data); },
    kernel(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.KERNEL, message, data); },
    slot(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.SLOTS, message, data); },
    panel(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.PANELS, message, data); },
    event(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.EVENTS, message, data); },
    perf(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.PERFORMANCE, message, data); },
    state(message: string, data: Record<string, unknown>) { return this.log(DEBUG_CATEGORIES.STATE, message, data); },

    // Breakpoints (para debugging manual)
    setBreakpoint(name: string, condition = () => true) {
      _breakpoints.set(name, { condition, hits: 0, enabled: true });
    },

    removeBreakpoint(name: string) {
      _breakpoints.delete(name);
    },

    checkBreakpoint(name: string, context = {}) {
      const bp = _breakpoints.get(name);
      if (!bp || !bp.enabled) return false;

      if (bp.condition(context)) {
        bp.hits++;
        this.info('breakpoint', `Breakpoint hit: ${name}`, { hits: bp.hits, context });
        debugger; // Pausa no DevTools se aberto
        return true;
      }
      return false;
    },

    listBreakpoints() {
      const result = {};
      for (const [name, bp] of _breakpoints) {
        (result as Record<string, unknown>)[name] = { enabled: bp.enabled, hits: bp.hits };
      }
      return result;
    },

    // Watchers
    watch(name: string, getter: unknown) {
      _watchers.set(name, { getter, lastValue: undefined });
    },

    unwatch(name: string) {
      _watchers.delete(name);
    },

    checkWatchers() {
      const changes = [];
      for (const [name, watcher] of _watchers) {
        try {
          const currentValue = watcher.getter();
          if (currentValue !== watcher.lastValue) {
            changes.push({ name, oldValue: watcher.lastValue, newValue: currentValue });
            watcher.lastValue = currentValue;
          }
        } catch (e: any) {
          this.error('watcher', `Watcher error: ${name}`, e.message);
        }
      }
      if (changes.length > 0) {
        // @ts-expect-error strict migration — TS2345
        this.info('watcher', 'Values changed', changes);
      }
      return changes;
    },

    // Inspect object
    inspect(obj: Record<string, unknown>, label = 'object') {
      if (!_enabled) return;

      console.group(`🔍 Inspect: ${label}`);
      console.dir(obj, { depth: 4 });
      console.groupEnd();

      _inspectedObjects.set(obj, { label, timestamp: Date.now() });
      return obj;
    },

    // Time measurement
    time(label: string) {
      console.time(`⏱️ ${label}`);
    },

    timeEnd(label: string) {
      console.timeEnd(`⏱️ ${label}`);
    },

    // Trace
    trace(message: string) {
      if (!_enabled) return;
      console.trace(`📍 ${message}`);
    },

    // Logs
    getLogs(filter: Record<string, any> = {}) {
      let result = [..._logs];

      if (filter.level !== undefined) {
        // @ts-expect-error strict migration — TS2571
        result = result.filter(l => (l as Record<string, unknown>).level <= filter.level);
      }
      if (filter.category) {
        result = result.filter(l => (l as Record<string, unknown>).category === filter.category);
      }
      if (filter.since) {
        // @ts-expect-error strict migration — TS2571
        result = result.filter(l => (l as Record<string, unknown>).timestamp >= filter.since);
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        // @ts-expect-error TS migration - TS2339
        result = result.filter(l => (l as Record<string, unknown>).message.toLowerCase().includes(search));
      }

      return result;
    },

    clearLogs() {
      _logs = [];
    },

    exportLogs(format = 'json') {
      if (format === 'json') {
        return JSON.stringify(_logs, null, 2);
      }
      if (format === 'csv') {
        const header = 'timestamp,level,category,message\n';
        // @ts-expect-error TS migration - TS2339
        const rows = _logs.map(l => `${(l as Record<string, unknown>).timestamp},${l.levelName},${l.category},"${l.message}"`).join('\n');
        return header + rows;
      }
      return _logs;
    },

    // System inspection
    getSystemState() {
      if (!_bootstrap) return { error: 'Bootstrap not injected' };

      return {
        bootstrapState: (_bootstrap.getState as (...args: unknown[]) => unknown)(),
        // @ts-expect-error TS migration - TS2339
        kernelState: (_bootstrap.getKernel as (...args: unknown[]) => unknown)()?.getState(),
        // @ts-expect-error TS migration - TS2339
        managers: (_bootstrap.getKernel as (...args: unknown[]) => unknown)()?.listManagers(),
        // @ts-expect-error TS migration - TS2339
        plugins: (_bootstrap.getPluginSystem as (...args: unknown[]) => unknown)()?.list(),
        // @ts-expect-error TS migration - TS2339
        performanceRating: (_bootstrap.getBootMetrics as (...args: unknown[]) => unknown)()?.getPerformanceRating(),
        // @ts-expect-error TS migration - TS2339
        errorCount: (_bootstrap.getErrors as (...args: unknown[]) => unknown)()?.length || 0
      };
    },

    // Quick health check
    quickCheck() {
      console.group('🏥 Quick Health Check');

      const state = this.getSystemState();
      console.log('Bootstrap:', state.bootstrapState);
      console.log('Kernel:', state.kernelState);
      console.log('Managers:', state.managers?.length || 0);
      console.log('Plugins:', state.plugins?.length || 0);
      console.log('Boot Rating:', state.performanceRating);
      console.log('Errors:', state.errorCount);

      console.groupEnd();
      return state;
    },

    // Console commands help
    help() {
      console.group('🛠️ Debug Mode Commands');
      console.log('debug.enable() / debug.disable() - Toggle debug mode');
      console.log('debug.setLevel(n) - Set debug level (0-99)');
      console.log('debug.log(category, message, data) - Log message');
      console.log('debug.inspect(obj, label) - Inspect object');
      console.log('debug.time(label) / debug.timeEnd(label) - Measure time');
      console.log('debug.getLogs(filter) - Get logs with filter');
      console.log('debug.exportLogs(format) - Export logs (json/csv)');
      console.log('debug.getSystemState() - Get system state');
      console.log('debug.quickCheck() - Quick health check');
      console.log('debug.setBreakpoint(name, condition) - Set breakpoint');
      console.log('debug.watch(name, getter) - Watch value changes');
      console.groupEnd();
    },

    // Health check
    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        enabled: _enabled,
        level: _level,
        categories: _categories.size,
        logsCount: _logs.length,
        breakpoints: _breakpoints.size,
        watchers: _watchers.size
      };
    },

    // Info — renamed to getInfo to avoid conflict with info(category, message, data) shortcut
    getInfo() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        enabled: _enabled,
        level: _level,
        levels: Object.keys(DEBUG_LEVELS),
        categories: Object.keys(DEBUG_CATEGORIES),
        logsCount: _logs.length
      };
    },

    // Destroy
    destroy() {
      _logs = [];
      _breakpoints.clear();
      _watchers.clear();
      _enabled = false;
    }
  };

  // Expõe globalmente para uso no console
  if (exposeGlobal && typeof window !== 'undefined') {
    (window as any).__containerDebug = debug;
    (window as any).debug = debug; // Alias curto
    (_logger as any).info('Debug mode exposed as window.debug');
  }

  return debug;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getDebugMode(options = {}) {
  if (!_instance) {
    _instance = createDebugMode(options);
  }
  return _instance;
}

export function resetDebugMode() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, levels: Object.keys(DEBUG_LEVELS), categories: Object.keys(DEBUG_CATEGORIES) };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  DEBUG_LEVELS, DEBUG_CATEGORIES,
  createDebugMode, getDebugMode, resetDebugMode,
  info, healthCheck
};
