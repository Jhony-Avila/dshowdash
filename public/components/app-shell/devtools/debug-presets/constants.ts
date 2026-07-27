/**
 * @file Debug Presets — Constants & Preset Configurations
 * @version 1.2.0
 * @module app-shell/devtools/debug-presets/constants
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none (standalone constants)
 * 
 * @provides VERSION, MODULE_ID, PRESETS, PRESET_CONFIGS, LOG_LEVEL_MAP
 * 
 * @description
 * Constants and configuration objects for debug presets.
 * Defines available presets (minimal, standard, verbose, etc.) with their
 * log levels, enabled modules, and feature flags.
 * 
 * @example
 * import { PRESETS, PRESET_CONFIGS, LOG_LEVEL_MAP } from './constants.js';
 * const config = PRESET_CONFIGS[PRESETS.VERBOSE];
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell-debug-presets';

export const PRESETS = Object.freeze({
  MINIMAL: 'minimal',
  STANDARD: 'standard',
  VERBOSE: 'verbose',
  PERFORMANCE: 'performance',
  NETWORK: 'network',
  MEMORY: 'memory',
  EVENTS: 'events',
  REGIONS: 'regions',
  CUSTOM: 'custom'
});

export const PRESET_CONFIGS = {
  minimal: {
    name: 'Minimal',
    description: 'Apenas erros críticos',
    logLevel: 'error',
    enabledModules: [] as DynObj,
    features: {
      consoleOutput: true,
      timestamps: false,
      stackTraces: false,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: false,
      networkTracking: false
    }
  },
  standard: {
    name: 'Standard',
    description: 'Logs padrão para desenvolvimento',
    logLevel: 'info',
    enabledModules: ['app-shell', 'bootstrap'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: true,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: false,
      networkTracking: false
    }
  },
  verbose: {
    name: 'Verbose',
    description: 'Todos os logs detalhados',
    logLevel: 'debug',
    enabledModules: ['*'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: true,
      performanceMarks: true,
      eventTracking: true,
      memoryTracking: true,
      networkTracking: true
    }
  },
  performance: {
    name: 'Performance',
    description: 'Foco em métricas de performance',
    logLevel: 'warn',
    enabledModules: ['performance', 'app-shell'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: true,
      eventTracking: false,
      memoryTracking: true,
      networkTracking: true
    }
  },
  network: {
    name: 'Network',
    description: 'Monitoramento de requisições',
    logLevel: 'info',
    enabledModules: ['api', 'fetch', 'xhr'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: false,
      networkTracking: true
    }
  },
  memory: {
    name: 'Memory',
    description: 'Detecção de memory leaks',
    logLevel: 'warn',
    enabledModules: ['memory', 'gc'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: true,
      performanceMarks: false,
      eventTracking: false,
      memoryTracking: true,
      networkTracking: false
    }
  },
  events: {
    name: 'Events',
    description: 'Rastreamento de eventos',
    logLevel: 'debug',
    enabledModules: ['eventbus', 'events'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: false,
      eventTracking: true,
      memoryTracking: false,
      networkTracking: false
    }
  },
  regions: {
    name: 'Regions',
    description: 'Debug de regiões do App Shell',
    logLevel: 'debug',
    enabledModules: ['app-shell', 'regions', 'dom-regions'],
    features: {
      consoleOutput: true,
      timestamps: true,
      stackTraces: false,
      performanceMarks: true,
      eventTracking: true,
      memoryTracking: false,
      networkTracking: false
    }
  }
};

export const LOG_LEVEL_MAP = { debug: 0, info: 1, warn: 2, error: 3 };
