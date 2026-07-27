// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.feature-flags
// PURPOSE: Route Feature Flags v1.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   defineFlag() — exported function
//   updateFlag() — exported function
//   removeFlag() — exported function
//   getFlag() — exported function
//   getAllFlags() — exported function
//   assignFlagToRoute() — exported function
//   removeFlagFromRoute() — exported function
//   getRoutesForFlag() — exported function
//   getFlagsForRoute() — exported function
//   setUserOverride() — exported function
//   removeUserOverride() — exported function
//   clearUserOverrides() — exported function
//   isEnabled() — exported function
//   canAccessRoute() — exported function
//   enableAll() — exported function
//   disableAll() — exported function
//   importFlags() — exported function
//   exportFlags() — exported function
//   getMetrics() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
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

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '1.2.0-P17WI';
const MODULE_ID = 'router.core.feature-flags';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown>) { if (!ctx) ctx = {}; const logger = _getPort('logger'); if (!logger || typeof logger[level] !== 'function') return; ctx.component = MODULE_ID; logger[level](msg, ctx); }

const _flags = new Map();
const _routeFlags = new Map();
const _userOverrides = new Map();
const _metrics = { evaluations: 0, enabledCount: 0, disabledCount: 0, lastEvaluation: null as number | null };

function defineFlag(flagId: string, config: Record<string, unknown>) { if (!config) config = {}; const flag = { id: flagId, enabled: config.enabled !== undefined ? config.enabled : false, description: config.description || '', percentage: config.percentage !== undefined ? config.percentage : 100, allowedUsers: config.allowedUsers || [], blockedUsers: config.blockedUsers || [], startDate: config.startDate || null, endDate: config.endDate || null, environments: config.environments || ['production', 'development'], metadata: config.metadata || {}, createdAt: Date.now(), updatedAt: Date.now() }; _flags.set(flagId, flag); _log('info', 'Flag defined', { flagId, enabled: flag.enabled }); return flag; }
function updateFlag(flagId: string, updates: Record<string, unknown>) { if (!updates) updates = {}; const flag = _flags.get(flagId); if (!flag) { _log('warn', 'Flag not found', { flagId }); return null; } Object.assign(flag, updates, { updatedAt: Date.now() }); _log('info', 'Flag updated', { flagId, updates: Object.keys(updates) }); return flag; }
function removeFlag(flagId: string) { const deleted = _flags.delete(flagId); if (deleted) { _routeFlags.forEach(flags => { flags.delete(flagId); }); _log('info', 'Flag removed', { flagId }); } return deleted; }
function getFlag(flagId: string) { return _flags.get(flagId) || null; }
function getAllFlags() { return Array.from(_flags.values()); }
function assignFlagToRoute(routeId: string, flagId: string, options: Record<string, unknown>) { if (!options) options = {}; if (!_flags.has(flagId)) { _log('warn', 'Cannot assign unknown flag', { flagId, routeId }); return false; } if (!_routeFlags.has(routeId)) { _routeFlags.set(routeId, new Map()); } _routeFlags.get(routeId).set(flagId, { flagId, required: options.required !== undefined ? options.required : true, fallbackRoute: options.fallbackRoute || null, message: options.message || 'Feature not available' }); _log('info', 'Flag assigned to route', { routeId, flagId }); return true; }
function removeFlagFromRoute(routeId: string, flagId: string) { const routeMap = _routeFlags.get(routeId); if (routeMap) { return routeMap.delete(flagId); } return false; }
function getRoutesForFlag(flagId: string) { const routes: string[] = []; _routeFlags.forEach((flags, routeId) => { if (flags.has(flagId)) routes.push(routeId); }); return routes; }
function getFlagsForRoute(routeId: string) { const routeMap = _routeFlags.get(routeId); return routeMap ? Array.from(routeMap.keys()) : []; }
function setUserOverride(userId: string, flagId: string, enabled: boolean) { if (!_userOverrides.has(userId)) { _userOverrides.set(userId, new Map()); } _userOverrides.get(userId).set(flagId, enabled); _log('debug', 'User override set', { userId, flagId, enabled }); }
function removeUserOverride(userId: string, flagId: string) { const userMap = _userOverrides.get(userId); if (userMap) { return userMap.delete(flagId); } return false; }
function clearUserOverrides(userId: string) { return _userOverrides.delete(userId); }

function _hashString(str: string) { let hash = 0; for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash; } return Math.abs(hash); }

function isEnabled(flagId: string, context: Record<string, unknown>) {
  if (!context) context = {};
  _metrics.evaluations++;
  _metrics.lastEvaluation = Date.now();
  const flag = _flags.get(flagId);
  if (!flag) { _metrics.disabledCount++; return false; }
  if (context.userId) { const userOverrides = _userOverrides.get(context.userId); if (userOverrides && userOverrides.has(flagId)) { const enabled = userOverrides.get(flagId); enabled ? _metrics.enabledCount++ : _metrics.disabledCount++; return enabled; } }
  if (!flag.enabled) { _metrics.disabledCount++; return false; }
  if (context.userId && flag.blockedUsers.indexOf(context.userId as string) !== -1) { _metrics.disabledCount++; return false; }
  if (flag.allowedUsers.length > 0 && context.userId) { if (flag.allowedUsers.indexOf(context.userId as string) === -1) { _metrics.disabledCount++; return false; } }
  const now = Date.now();
  if (flag.startDate && now < new Date(flag.startDate).getTime()) { _metrics.disabledCount++; return false; }
  if (flag.endDate && now > new Date(flag.endDate).getTime()) { _metrics.disabledCount++; return false; }
  if (context.environment && flag.environments.indexOf(context.environment as string) === -1) { _metrics.disabledCount++; return false; }
  if (flag.percentage < 100) { const hash = _hashString((context.userId || context.sessionId || String(Math.random())) as string); const bucket = hash % 100; if (bucket >= flag.percentage) { _metrics.disabledCount++; return false; } }
  _metrics.enabledCount++;
  return true;
}

function canAccessRoute(routeId: string, context: Record<string, unknown>) { if (!context) context = {}; const routeMap = _routeFlags.get(routeId); if (!routeMap || routeMap.size === 0) { return { allowed: true, flags: [] as Record<string, unknown>[] }; } const results: Record<string, unknown>[] = []; let allowed = true; routeMap.forEach((config: Record<string, unknown>, flagId: string) => { const enabled = isEnabled(flagId, context); results.push({ flagId, enabled, required: config.required }); if (config.required && !enabled) { allowed = false; } }); const first = routeMap.values().next().value; return { allowed, flags: results, fallbackRoute: allowed ? null : (first ? (first as Record<string, unknown>).fallbackRoute : null), message: allowed ? null : (first ? (first as Record<string, unknown>).message : null) }; }
function enableAll() { let count = 0; _flags.forEach(flag => { flag.enabled = true; flag.updatedAt = Date.now(); count++; }); _log('info', 'All flags enabled', { count }); return count; }
function disableAll() { let count = 0; _flags.forEach(flag => { flag.enabled = false; flag.updatedAt = Date.now(); count++; }); _log('info', 'All flags disabled', { count }); return count; }
function importFlags(data: Record<string, unknown>[]) { if (!Array.isArray(data)) return 0; let imported = 0; for (let i = 0; i < data.length; i++) { if (data[i].id) { defineFlag(data[i].id as string, data[i]); imported++; } } return imported; }
function exportFlags() { const assignments: Record<string, unknown>[] = []; _routeFlags.forEach((flags, routeId) => { assignments.push({ routeId, flags: Array.from(flags.entries()) as [string, unknown][] }); }); return { version: VERSION, exportedAt: new Date().toISOString(), flags: getAllFlags(), routeAssignments: assignments }; }
function getMetrics() { const enabledFlags = Array.from(_flags.values()).filter(f => f.enabled).length; return Object.assign({}, _metrics, { totalFlags: _flags.size, enabledFlags, disabledFlags: _flags.size - enabledFlags, routesWithFlags: _routeFlags.size, usersWithOverrides: _userOverrides.size }); }
function getStatus() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { flagsLoaded: _flags.size >= 0, evaluationWorking: true }, timestamp: Date.now() }; }
function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), features: ['flag-management', 'route-assignment', 'user-overrides', 'percentage-rollout', 'date-ranges', 'environment-targeting'], status: getStatus() }; }

export { VERSION, MODULE_ID, defineFlag, updateFlag, removeFlag, getFlag, getAllFlags, assignFlagToRoute, removeFlagFromRoute, getRoutesForFlag, getFlagsForRoute, setUserOverride, removeUserOverride, clearUserOverrides, isEnabled, canAccessRoute, enableAll, disableAll, importFlags, exportFlags, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
export default { VERSION, MODULE_ID, defineFlag, updateFlag, removeFlag, getFlag, getAllFlags, assignFlagToRoute, removeFlagFromRoute, getRoutesForFlag, getFlagsForRoute, setUserOverride, removeUserOverride, clearUserOverrides, isEnabled, canAccessRoute, enableAll, disableAll, importFlags, exportFlags, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
