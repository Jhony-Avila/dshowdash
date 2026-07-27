// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ./constants.js
//   getPerformanceAPI from ./singleton.js
//   createPerformanceAPI from ./factory.js
//   resetPerformanceAPI from ./singleton.js
//   METRIC_TYPES, METRIC_CATEGORIES from ./constants.js
//
// PROVIDES:
//   startTiming() — exported function
//   endTiming() — exported function
//   recordRender() — exported function
//   recordLoad() — exported function
//   getAllMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   METRIC_TYPES — exported value
//   METRIC_CATEGORIES — exported value
//   createPerformanceAPI — exported value
//   getPerformanceAPI — exported value
//   resetPerformanceAPI — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Performance API - Main Entry Point
 * @module performance-api
 * @version 1.0.0-AAA
 * @description API para acessar métricas de renderização, tempo de carga (Modularizado)
 */
'use strict';

// Constants
export { VERSION, MODULE_ID, METRIC_TYPES, METRIC_CATEGORIES } from './constants.js';

// Factory
export { createPerformanceAPI } from './factory.js';

// Singleton
export { getPerformanceAPI, resetPerformanceAPI } from './singleton.js';

// Import singleton for shortcuts
import { VERSION, MODULE_ID } from './constants.js';
import { getPerformanceAPI } from './singleton.js';

// Shortcuts
export function startTiming(name: string, category: string) { return (getPerformanceAPI().startTiming as (...args: unknown[]) => unknown)(name, category); }
export function endTiming(name: string) { return (getPerformanceAPI().endTiming as (...args: unknown[]) => unknown)(name); }
export function recordRender(duration: number, panelId: string) { return (getPerformanceAPI().recordRender as (...args: unknown[]) => unknown)(duration, panelId); }
export function recordLoad(duration: number, resourceId: string, success: boolean) { return (getPerformanceAPI().recordLoad as (...args: unknown[]) => unknown)(duration, resourceId, success); }
export function getAllMetrics() { return (getPerformanceAPI().getAllMetrics as (...args: unknown[]) => unknown)(); }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { 
  try {
    return (getPerformanceAPI().healthCheck as (...args: unknown[]) => unknown)();
  } catch (e) {
    return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
  }
}

// Default export
import { createPerformanceAPI } from './factory.js';
import { resetPerformanceAPI } from './singleton.js';
import { METRIC_TYPES, METRIC_CATEGORIES } from './constants.js';

export default {
  VERSION, MODULE_ID,
  METRIC_TYPES, METRIC_CATEGORIES,
  createPerformanceAPI, getPerformanceAPI, resetPerformanceAPI,
  startTiming, endTiming, recordRender, recordLoad, getAllMetrics,
  info, healthCheck
};
