// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar/core/sidebar-lifecycle
// PURPOSE: Sidebar creation, destruction, and feature orchestration lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Sidebar from ../sidebar.js
//   setInstance from ../factory.js
//   getConfig from ./config-loader.js
//   Kernel from ../kernel/index.js
//   MetricsHub from ../telemetry/metrics-hub.js
//   CircuitBreaker from ../kernel/circuit-breaker.js
//   HealthMonitor from ../kernel/health-monitor.js
//   registerCommands, unregisterCommands from ../kernel/console-commands.js
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   registerFeatures, enableFeatures from ./feature-loader.js
//
// PROVIDES:
//   createCreateSidebar(ctx) — factory that returns createSidebar()
//   getSidebar(ctx) — get sidebar instance
//   destroySidebar(ctx) — destroy sidebar instance
//
// RECEIVES (via ctx):
//   ctx.Ports, ctx.log, ctx.getEventBus, ctx.getSidebarEl,
//   ctx.config, ctx.setConfig, ctx.moduleMetrics, ctx.safeMode, ctx.setSafeMode,
//   ctx.instance, ctx.setInstance, ctx.featuresLoaded, ctx.setFeaturesLoaded,
//   ctx.featureModules, ctx.DEFAULT_CONFIG, ctx.VERSION
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.0.0: Extracted from sidebar/index.js v7.3.0 during modularization
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const MODULE_ID = 'sidebar.core.sidebar-lifecycle';

import { Sidebar } from '../sidebar.js';
import { setInstance } from '../factory.js';
import { getConfig } from './config-loader.js';
import * as Kernel from '../kernel/index.js';
import * as MetricsHub from '../telemetry/metrics-hub.js';
import * as CircuitBreaker from '../kernel/circuit-breaker.js';
import * as HealthMonitor from '../kernel/health-monitor.js';
import { registerCommands, unregisterCommands } from '../kernel/console-commands.js';
import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';

import { registerFeatures, enableFeatures } from './feature-loader.js';


export const VERSION = '1.0.0-ENTERPRISE';

// ── Create Sidebar Factory ──────────────────────────────────
export function createCreateSidebar(ctx: DynObj) {
  return (options: { safeMode?: boolean } = {}) => {
    if (ctx.getInstance()) return ctx.getInstance();

    const startTime = Date.now();
    ctx.initPorts();

    try {
      const externalConfig = getConfig();
      ctx.setSafeMode((externalConfig && externalConfig.safeMode === true) || options.safeMode === true);
      if (externalConfig && externalConfig.kernel) {
        ctx.setConfig(Object.assign({}, ctx.DEFAULT_CONFIG, externalConfig.kernel, options));
      }
      if (ctx.getSafeMode()) {
        ctx.moduleMetrics.safeModeBoots++;
        ctx.log('info', 'SafeMode ACTIVE - minimal boot');
      }
    } catch (e: any) {
      ctx.setSafeMode(options.safeMode === true);
    }

    Kernel.init({ ports: ctx.Ports.snapshot() });

    MetricsHub.init({ ports: ctx.Ports.snapshot() });
    MetricsHub.registerSource('sidebar-orchestrator', {
      category: 'core',
      version: ctx.VERSION,
      getMetrics() {
        return Object.assign({}, ctx.moduleMetrics, { kernel: Kernel.metrics().data });
      }
    });

    if (ctx.getConfig().enableConsoleCommands) {
      try {
        registerCommands(Kernel);
        ctx.log('debug', 'Console commands registered (sk.*)');
      } catch (e: any) {
        ctx.log('warn', 'Failed to register console commands:', e.message);
      }
    }

    const instance = new Sidebar();
    ctx.setInstance(instance);
    setInstance(instance);
    ctx.moduleMetrics.instancesCreated++;

    const eb = ctx.getEventBus();

    // Feature context for feature-loader
    const featureCtx = {
      log: ctx.log,
      config: ctx.getConfig(),
      moduleMetrics: ctx.moduleMetrics,
      safeMode: ctx.getSafeMode(),
      featuresLoaded: ctx.getFeaturesLoaded(),
      setFeaturesLoaded: ctx.setFeaturesLoaded,
      featureModules: ctx.featureModules
    };

    (async () => {
      try {
        await registerFeatures(featureCtx);
        await enableFeatures(eb, ctx.getSidebarEl(), featureCtx);

        if (ctx.getConfig().enableHealthMonitor) {
          try {
            HealthMonitor.init(Kernel, {
              intervalMs: ctx.getConfig().healthMonitorIntervalMs,
              autoRecover: ctx.getConfig().healthMonitorAutoRecover,
              onDegraded(result: DynObj) {
                ctx.log('warn', 'Kernel health degraded:', `${result.status} ${result.score}%`);
              },
              onRecovered(featureId: string) {
                ctx.log('info', 'Feature recovered:', featureId);
                if (ctx.getConfig().enableCircuitBreaker) {
                  CircuitBreaker.reset(featureId);
                }
              }
            });
            HealthMonitor.start();
            ctx.log('debug', 'HealthMonitor started');
          } catch (e: any) {
            ctx.log('warn', 'Failed to start HealthMonitor:', e.message);
          }
        }

        ctx.moduleMetrics.initTime = Date.now() - startTime;

        if (eb && eb.emit) {
          eb.emit(SIDEBAR_EVENTS.KERNEL_READY, {
            version: ctx.VERSION,
            safeMode: ctx.getSafeMode(),
            featuresRegistered: ctx.moduleMetrics.featuresRegistered,
            featuresEnabled: ctx.moduleMetrics.featuresEnabled,
            featuresSkipped: ctx.moduleMetrics.featuresSkipped,
            initTime: ctx.moduleMetrics.initTime
          });
        }

        ctx.log('info', `✅ Initialized in ${ctx.moduleMetrics.initTime}ms - Features: ${ctx.moduleMetrics.featuresEnabled}/${ctx.moduleMetrics.featuresRegistered} enabled`);

      } catch (error: any) {
        ctx.moduleMetrics.featureErrors++;
        ctx.moduleMetrics.lastError = { phase: 'feature-init', message: error.message, timestamp: Date.now() };
        ctx.log('error', 'Feature initialization error:', error);
      }
    })();

    return instance;
  };
}

// ── Get Sidebar ─────────────────────────────────────────────
export function createGetSidebar(ctx: DynObj) {
  return () => {
    if (!ctx.getInstance()) throw new Error('Sidebar not initialized');
    return ctx.getInstance();
  };
}

// ── Destroy Sidebar ─────────────────────────────────────────
export function createDestroySidebar(ctx: DynObj) {
  return () => {
    if (ctx.getConfig().enableHealthMonitor) {
      try { HealthMonitor.destroy(); } catch (e: any) {}
    }

    if (ctx.getConfig().enableConsoleCommands) {
      try { unregisterCommands(); } catch (e: any) {}
    }

    Kernel.shutdown('destroySidebar');
    MetricsHub.cleanup();

    const instance = ctx.getInstance();
    if (instance && instance.destroy) {
      instance.destroy();
    }

    ctx.setInstance(null);
    setInstance(null);
    ctx.setFeaturesLoaded(false);
    ctx.featureModules.clear();
    ctx.setSafeMode(false);
  };
}
