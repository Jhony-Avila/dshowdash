// Phase 6 - Platform Runtime v3
// @version 3.3.0-HEALTH-CONTRACT
// @changelog v3.1.0: ES5 conversion
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.2.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via execute(ports)):
//   ports.logger           — Logger instance
//   ports.telemetry        — Telemetry tracker
//   ports.windowAdapter    — For exposing/getting globals safely
//   ports.readyFlagsAdapter — For marking ready flags
//
// RESOLVES context via windowAdapter.getWindow():
//   EventBus, document, Main — accessed via adapter window ref
//
// CREATES (via windowAdapter.expose):
//   Platform — unified runtime + shell API
//
// IMPORTS:
//   /platform/runtime/index.js, /platform/shell/index.js (dynamic)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
var MODULE_ID = 'phase-6-platform';
var VERSION = '3.3.0-HEALTH-CONTRACT';

var phase6 = {
  id: 'phase-6-platform',
  name: 'Platform Runtime',
  order: 6,
  critical: false,
  recoverable: true,
  dependsOn: ['phase-5-ui'],
  parallel: false,
  modules: [{ id: 'platform', name: 'Platform Runtime v3', critical: false, timeout: 10000 }],

  execute: function(ports: Record<string, unknown>) {
    var logger = ports.logger as Record<string, Function> | null;
    var telemetry = ports.telemetry as Record<string, Function> | null;
    var windowAdapter = ports.windowAdapter as Record<string, Function> | null;
    var readyFlagsAdapter = ports.readyFlagsAdapter as Record<string, Function> | null;
    var results: { initialized: string[]; failed: Array<{ id: string; error: string }> } = { initialized: [], failed: [] };
    var startTime = performance.now();

    if (logger) logger.info('Phase 6 starting: Platform Runtime v3');
    if (telemetry) telemetry.track('phase-6-start', { version: VERSION });

    return Promise.all([
      import('/platform/runtime/index.js'),
      import('/platform/shell/index.js')
    ]).then(function(modules) {
      var PlatformRuntime: Record<string, any> = modules[0];
      var PlatformShell: Record<string, any> = modules[1];

      var win = (windowAdapter && windowAdapter.getWindow) ? windowAdapter.getWindow() : (typeof window !== 'undefined' ? window : {});
      var context = {
        eventBus: win.EventBus || null,
        document: win.document || null,
        mainEngine: win.Main || null
      };

      return Promise.resolve(PlatformRuntime.init(context)).then(function(runtime) {
        PlatformShell.init(context);

        if (windowAdapter && windowAdapter.expose) {
          windowAdapter.expose('Platform', {
            runtime: PlatformRuntime,
            shell: PlatformShell,
            navigate: PlatformRuntime.navigate,
            info: PlatformRuntime.info,
            getRuntime: PlatformRuntime.getRuntime,
            VERSION: PlatformRuntime.VERSION
          });
        }

        if (readyFlagsAdapter && readyFlagsAdapter.setReady) readyFlagsAdapter.setReady('platform', true);
        results.initialized.push('platform');

        if (logger) logger.info('Platform Runtime v3 initialized', { version: VERSION });
        return runtime;
      });
    }).catch(function(error) {
      results.failed.push({ id: 'platform', error: error.message });
      if (logger) logger.warn('Platform Runtime failed (non-critical)', { error: error.message });
    }).then(function() {
      var elapsed = Math.round(performance.now() - startTime);
      if (telemetry) telemetry.track('phase-6-complete', { initialized: results.initialized.length, time: elapsed });
      return { success: true, initialized: results.initialized, failed: results.failed, time: elapsed };
    });
  },

  recover: function(error: Error, ports: Record<string, unknown>) {
    var recoverLogger = ports.logger as Record<string, Function> | null;
    if (recoverLogger) recoverLogger.warn('Phase 6 recovery: Platform will be unavailable', { error: error.message });
    return Promise.resolve();
  },

  healthCheck: function() {
    return createHealthResult({ status: HEALTH_STATUS.HEALTHY, moduleId: MODULE_ID, version: VERSION });
  },

  info: function() {
    return { moduleId: MODULE_ID, version: VERSION };
  }
};

export { phase6, MODULE_ID, VERSION };
export default phase6;
