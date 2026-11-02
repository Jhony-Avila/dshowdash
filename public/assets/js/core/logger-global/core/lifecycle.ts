// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-lifecycle
// PURPOSE: Logger Global - Lifecycle v3.4.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LEVELS, isValidLevel from ./levels.js
//   initForwarder, setForwardingEnabled from ../telemetry/forwarder.js
//   clearBuffer from ../state/buffer.js
//   isDebugMode, ensureCorrelationId, setCorrelationId, clearUser from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   initLogger() — exported function
//   shutdownLogger() — exported function
//   isLoggerInitialized() — exported function
//   enableLevel() — exported function
//   disableLevel() — exported function
//   enableComponentDebug() — exported function
//   disableComponent() — exported function
//   isLevelEnabled() — exported function
//   isComponentDebugEnabled() — exported function
//   shouldLog() — exported function
//   setSilentMode() — exported function
//   getSilentMode() — exported function
//   isSilent() — exported function
//   shouldSuppressConsole() — exported function
//   incrementSuppressedCount() — exported function
//   getSilentStats() — exported function
//   resetSilentStats() — exported function
//   getConfig() — exported function
//   updateLoggerConfig() — exported function
//   isConsoleEnabled() — exported function
//   isTelemetryForwardingEnabled() — exported function
//   isBufferEnabled() — exported function
//   isEventBusEnabled() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LEVELS, isValidLevel } from './levels.js';
import { initForwarder, setForwardingEnabled } from '../telemetry/forwarder.js';
import { clearBuffer } from '../state/buffer.js';
import { isDebugMode, ensureCorrelationId, setCorrelationId, clearUser } from '../utils/helpers.js';

export var VERSION = '3.4.0-ENTERPRISE';
export var MODULE_ID = 'logger-global-lifecycle';

export function getVersion() { return VERSION; }

var SILENT_MODES = Object.freeze(['off', 'soft', 'hard']);
var NEVER_SUPPRESS = Object.freeze(['error', 'critical', 'security', 'audit', 'panic']);
var SUPPRESSED_LEVELS = Object.freeze({ off: [], soft: ['trace', 'debug', 'info'], hard: ['trace', 'debug', 'info', 'warn', 'error', 'critical'] });

var config = { minLevel: 'info', enabledLevels: null as unknown | null, enabledComponents: null as unknown | null, disabledComponents: null as unknown | null, consoleOutput: true, telemetryForwarding: true, bufferEnabled: true, eventBusEnabled: true, debugMode: false, silentMode: 'off', silentAllowLevels: null as unknown | null, silentSuppressedCount: 0 };

function initConfig() {
  if (!config.enabledLevels) config.enabledLevels = { info: true, warn: true, error: true, critical: true };
  if (!config.enabledComponents) config.enabledComponents = {};
  if (!config.disabledComponents) config.disabledComponents = {};
  if (!config.silentAllowLevels) { config.silentAllowLevels = {}; for (var i = 0; i < NEVER_SUPPRESS.length; i++) (config.silentAllowLevels as Record<string, boolean>)[NEVER_SUPPRESS[i]] = true; }
}
initConfig();

var initialized = false;
var initPromise: unknown | null = null;

export function initLogger(userConfig: Record<string, unknown>) {
  if (!userConfig) userConfig = {};
  if (initPromise) return initPromise;
  initPromise = new Promise(function(resolve) {
    try {
      config.debugMode = isDebugMode();
      if (config.debugMode) { config.minLevel = 'debug'; config.enabledLevels = { trace: true, debug: true, info: true, warn: true, error: true, critical: true }; }
      if (userConfig.minLevel && isValidLevel(userConfig.minLevel as string)) config.minLevel = userConfig.minLevel as string;
      if (userConfig.consoleOutput !== undefined) config.consoleOutput = Boolean(userConfig.consoleOutput);
      if (userConfig.telemetryForwarding !== undefined) config.telemetryForwarding = Boolean(userConfig.telemetryForwarding);
      if (userConfig.bufferEnabled !== undefined) config.bufferEnabled = Boolean(userConfig.bufferEnabled);
      if (userConfig.eventBusEnabled !== undefined) config.eventBusEnabled = Boolean(userConfig.eventBusEnabled);
      if (userConfig.silentMode && SILENT_MODES.indexOf(userConfig.silentMode as string) > -1) config.silentMode = userConfig.silentMode as string;
      if (Array.isArray(userConfig.silentAllowLevels)) { for (var j = 0; j < (userConfig.silentAllowLevels as string[]).length; j++) (config.silentAllowLevels as Record<string, boolean>)[(userConfig.silentAllowLevels as string[])[j]] = true; }
      
      if (!userConfig.silentMode && typeof window !== 'undefined') {
        var hostname = (window.location && window.location.hostname) || '';
        var isProd = hostname.indexOf('dshowdash.com.br') > -1 && hostname.indexOf('test') === -1;
        if (isProd && !config.debugMode) config.silentMode = 'soft';
      }
      
      ensureCorrelationId();
      if (config.telemetryForwarding) {
        // @ts-expect-error strict migration — TS2345
        initForwarder().then(function(result: { ok: boolean; available: boolean }) {
          setForwardingEnabled(result.ok && result.available);
          initialized = true;
          resolve({ ok: true, config: getConfig() });
        });
      } else {
        initialized = true;
        resolve({ ok: true, config: getConfig() });
      }
    } catch (error) { initialized = true; resolve({ ok: false, error: error }); }
  });
  return initPromise;
}

export function shutdownLogger() { var flushedCount = clearBuffer(); setForwardingEnabled(false); config.enabledComponents = {}; config.disabledComponents = {}; clearUser(); initialized = false; initPromise = null; return { ok: true, flushedLogs: flushedCount }; }

export function isLoggerInitialized() { return initialized; }

export function enableLevel(levelName: string) { if (!isValidLevel(levelName)) return false; (config.enabledLevels as Record<string, boolean>)[levelName] = true; updateMinLevel(); return true; }
export function disableLevel(levelName: string) { if (!isValidLevel(levelName)) return false; if (levelName === 'error' || levelName === 'critical') return false; delete (config.enabledLevels as Record<string, boolean>)[levelName]; updateMinLevel(); return true; }

function updateMinLevel() { var levels = ['trace', 'debug', 'info', 'warn', 'error', 'critical']; for (var i = 0; i < levels.length; i++) { if ((config.enabledLevels as Record<string, boolean>)[levels[i]]) { config.minLevel = levels[i]; return; } } }

export function enableComponentDebug(componentName: string) { if (!componentName) return false; (config.enabledComponents as Record<string, boolean>)[componentName] = true; delete (config.disabledComponents as Record<string, boolean>)[componentName]; return true; }
export function disableComponent(componentName: string) { if (!componentName) return false; (config.disabledComponents as Record<string, boolean>)[componentName] = true; delete (config.enabledComponents as Record<string, boolean>)[componentName]; return true; }

export function isLevelEnabled(levelName: string) { return !!(config.enabledLevels as Record<string, boolean>)[levelName]; }
export function isComponentDebugEnabled(componentName: string) { if ((config.disabledComponents as Record<string, boolean>)[componentName]) return false; if ((config.enabledComponents as Record<string, boolean>)[componentName]) return true; return config.debugMode; }
export function shouldLog(levelName: string, componentName: string) { if (!(config.enabledLevels as Record<string, boolean>)[levelName]) return false; if ((config.disabledComponents as Record<string, boolean>)[componentName]) return false; if (levelName === 'debug' || levelName === 'trace') return config.debugMode || (config.enabledComponents as Record<string, boolean>)[componentName]; return true; }

export function setSilentMode(mode: string) { if (SILENT_MODES.indexOf(mode) === -1) return { ok: false, reason: 'Invalid mode: ' + mode + '. Use: ' + SILENT_MODES.join(', ') }; var previous = config.silentMode; config.silentMode = mode; return { ok: true, previous: previous, current: mode }; }
export function getSilentMode() { return config.silentMode; }
export function isSilent() { return config.silentMode !== 'off'; }
export function shouldSuppressConsole(levelName: string) { if (config.silentMode === 'off') return false; if ((config.silentAllowLevels as Record<string, boolean>)[levelName]) return false; var suppressedLevels = (SUPPRESSED_LEVELS as Record<string, readonly string[]>)[config.silentMode] || []; return suppressedLevels.indexOf(levelName) > -1; }
export function incrementSuppressedCount() { config.silentSuppressedCount++; }
export function getSilentStats() { var allowArr: string[] = []; var sal = config.silentAllowLevels as Record<string, boolean>; for (var k in sal) { if (sal[k]) allowArr.push(k); } return { mode: config.silentMode, isSilent: config.silentMode !== 'off', suppressedCount: config.silentSuppressedCount, allowLevels: allowArr, suppressedLevels: (SUPPRESSED_LEVELS as Record<string, readonly string[]>)[config.silentMode] || [] }; }
export function resetSilentStats() { config.silentSuppressedCount = 0; }

export function getConfig() { var el = config.enabledLevels as Record<string, boolean>; var ec = config.enabledComponents as Record<string, boolean>; var dc = config.disabledComponents as Record<string, boolean>; var sal = config.silentAllowLevels as Record<string, boolean>; var enabledArr: string[] = []; for (var e in el) { if (el[e]) enabledArr.push(e); } var compArr: string[] = []; for (var c in ec) { if (ec[c]) compArr.push(c); } var disArr: string[] = []; for (var d in dc) { if (dc[d]) disArr.push(d); } var allowArr: string[] = []; for (var a in sal) { if (sal[a]) allowArr.push(a); } return { minLevel: config.minLevel, enabledLevels: enabledArr, enabledComponents: compArr, disabledComponents: disArr, consoleOutput: config.consoleOutput, telemetryForwarding: config.telemetryForwarding, bufferEnabled: config.bufferEnabled, eventBusEnabled: config.eventBusEnabled, debugMode: config.debugMode, silentMode: config.silentMode, silentAllowLevels: allowArr, silentSuppressedCount: config.silentSuppressedCount }; }

export function updateLoggerConfig(patch: Record<string, unknown>) { if (!patch) patch = {}; if (patch.consoleOutput !== undefined) config.consoleOutput = Boolean(patch.consoleOutput); if (patch.telemetryForwarding !== undefined) { config.telemetryForwarding = Boolean(patch.telemetryForwarding); setForwardingEnabled(patch.telemetryForwarding as boolean); } if (patch.bufferEnabled !== undefined) config.bufferEnabled = Boolean(patch.bufferEnabled); if (patch.eventBusEnabled !== undefined) config.eventBusEnabled = Boolean(patch.eventBusEnabled); if (patch.silentMode !== undefined && SILENT_MODES.indexOf(patch.silentMode as string) > -1) config.silentMode = patch.silentMode as string; return getConfig(); }

export function isConsoleEnabled() { return config.consoleOutput; }
export function isTelemetryForwardingEnabled() { return config.telemetryForwarding; }
export function isBufferEnabled() { return config.bufferEnabled; }
export function isEventBusEnabled() { return config.eventBusEnabled; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: initialized }; }
export function healthCheck() { return { status: initialized ? 'HEALTHY' : 'IDLE', moduleId: MODULE_ID, version: VERSION, checks: { initialized: initialized, configReady: !!config.enabledLevels } }; }
