

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.core.ab-testing
// PURPOSE: core   ab testing
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   createExperiment() — exported function
//   updateExperiment() — exported function
//   startExperiment() — exported function
//   pauseExperiment() — exported function
//   stopExperiment() — exported function
//   deleteExperiment() — exported function
//   getExperiment() — exported function
//   getAllExperiments() — exported function
//   getActiveExperiments() — exported function
//   assignVariant() — exported function
//   getAssignment() — exported function
//   clearAssignment() — exported function
//   resolveRouteVariant() — exported function
//   trackConversion() — exported function
//   getResults() — exported function
//   analyzeExperiment() — exported function
//   loadAssignments() — exported function
//   getMetrics() — exported function
//   getStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';
// A/B Testing Routes v1.2.0-P17WI
// @version 1.2.0-P17WI
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
// Sistema de testes A/B para rotas

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'router.core.ab-testing';

const hasWindow = typeof window !== 'undefined';

// P17WI PORTS PATTERN
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx: Record<string, unknown> = {}) {
  const logger = _getPort('logger');
  if (!logger || typeof logger[level] !== 'function') return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
}

// Storage
const _experiments = new Map();
const _userAssignments = new Map();
const _results = new Map();

// Config
let _config = {
  enabled: true,
  persistAssignments: true,
  storageKey: 'router_ab_assignments',
  trackingEnabled: true,
  defaultVariant: 'control'
};

// Métricas
const _metrics = {
  totalExperiments: 0,
  activeExperiments: 0,
  totalAssignments: 0,
  totalConversions: 0
};

export function createExperiment(experimentId: string, config: Record<string, any> = {}) {
  _initPorts();
  const experiment = {
    id: experimentId,
    name: config.name || experimentId,
    description: config.description || '',
    status: config.status || 'draft',
    variants: config.variants || [
      { id: 'control', name: 'Control', weight: 50 },
      { id: 'treatment', name: 'Treatment', weight: 50 }
    ],
    targetRoutes: config.targetRoutes || [],
    targetUsers: config.targetUsers || null,
    excludeUsers: config.excludeUsers || [],
    startDate: config.startDate || null,
    endDate: config.endDate || null,
    sampleSize: config.sampleSize || 100,
    goals: config.goals || [],
    metadata: config.metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const totalWeight = experiment.variants.reduce((sum: number, v: { weight: number }) => sum + v.weight, 0);
  if (totalWeight !== 100) {
    _log('warn', 'Variant weights do not sum to 100', { experimentId, totalWeight });
  }

  _experiments.set(experimentId, experiment);
  _results.set(experimentId, { variants: {}, conversions: {}, impressions: {} });
  
  _metrics.totalExperiments = _experiments.size;
  _log('info', 'Experiment created', { experimentId });
  
  return experiment;
}

export function updateExperiment(experimentId: string, updates: Record<string, unknown> = {}) {
  const experiment = _experiments.get(experimentId);
  if (!experiment) {
    _log('warn', 'Experiment not found', { experimentId });
    return null;
  }

  Object.assign(experiment, updates, { updatedAt: Date.now() });
  return experiment;
}

export function startExperiment(experimentId: string) {
  return updateExperiment(experimentId, { status: 'running', startDate: Date.now() });
}

export function pauseExperiment(experimentId: string) {
  return updateExperiment(experimentId, { status: 'paused' });
}

export function stopExperiment(experimentId: string) {
  return updateExperiment(experimentId, { status: 'stopped', endDate: Date.now() });
}

export function deleteExperiment(experimentId: string) {
  _experiments.delete(experimentId);
  _results.delete(experimentId);
  _metrics.totalExperiments = _experiments.size;
}

export function getExperiment(experimentId: string) {
  return _experiments.get(experimentId) || null;
}

export function getAllExperiments() {
  return Array.from(_experiments.values());
}

export function getActiveExperiments() {
  return Array.from(_experiments.values()).filter(e => e.status === 'running');
}

export function assignVariant(experimentId: string, userId: string | null = null) {
  const experiment = _experiments.get(experimentId);
  if (!experiment || experiment.status !== 'running') {
    return { variant: _config.defaultVariant, assigned: false };
  }

  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;

  if (_userAssignments.has(assignmentKey)) {
    return { variant: _userAssignments.get(assignmentKey), assigned: false, cached: true };
  }

  if (experiment.excludeUsers?.includes(userKey)) {
    return { variant: _config.defaultVariant, assigned: false, excluded: true };
  }

  if (experiment.targetUsers && !experiment.targetUsers.includes(userKey)) {
    return { variant: _config.defaultVariant, assigned: false, notTargeted: true };
  }

  const variant = _selectVariant(experiment.variants, userKey, experimentId);
  
  _userAssignments.set(assignmentKey, variant);
  _metrics.totalAssignments++;
  
  _trackImpression(experimentId, variant);
  
  if (_config.persistAssignments) {
    _saveAssignments();
  }

  _log('debug', 'Variant assigned', { experimentId, userId: userKey, variant });
  return { variant, assigned: true };
}

function _selectVariant(variants: { weight: number; id: string }[], userKey: string, experimentId: string) {
  const hash = _hashString(`${userKey}:${experimentId}`);
  const bucket = hash % 100;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.id;
    }
  }
  
  return variants[0]?.id || _config.defaultVariant;
}

export function getAssignment(experimentId: string, userId: string | null = null) {
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  return _userAssignments.get(assignmentKey) || null;
}

export function clearAssignment(experimentId: string, userId: string | null = null) {
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  _userAssignments.delete(assignmentKey);
  _saveAssignments();
}

export function resolveRouteVariant(routeId: string, userId: string | null = null) {
  const activeExperiments = getActiveExperiments();
  
  for (const experiment of activeExperiments) {
    if (experiment.targetRoutes.includes(routeId)) {
      const { variant } = assignVariant(experiment.id, userId);
      
      const variantConfig = experiment.variants.find((v: Record<string, unknown>) => v.id === variant);
      if (variantConfig?.routeOverride?.[routeId]) {
        return {
          experimentId: experiment.id,
          variant,
          route: variantConfig.routeOverride[routeId]
        };
      }
      
      return { experimentId: experiment.id, variant, route: null };
    }
  }
  
  return null;
}

function _trackImpression(experimentId: string, variant: string) {
  const results = _results.get(experimentId);
  if (!results) return;
  
  if (!results.impressions[variant]) {
    results.impressions[variant] = 0;
  }
  results.impressions[variant]++;
}

export function trackConversion(experimentId: string, goalId: string, userId: string | null = null, value: number = 1) {
  const experiment = _experiments.get(experimentId);
  if (!experiment) return false;
  
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  const variant = _userAssignments.get(assignmentKey);
  
  if (!variant) {
    _log('warn', 'No assignment for conversion', { experimentId, userId: userKey });
    return false;
  }

  const results = _results.get(experimentId);
  if (!results) return false;

  const conversionKey = `${variant}:${goalId}`;
  if (!results.conversions[conversionKey]) {
    results.conversions[conversionKey] = { count: 0, value: 0 };
  }
  
  results.conversions[conversionKey].count++;
  results.conversions[conversionKey].value += value;
  _metrics.totalConversions++;

  _log('debug', 'Conversion tracked', { experimentId, goalId, variant, value });
  return true;
}

export function getResults(experimentId: string) {
  const experiment = _experiments.get(experimentId);
  const results = _results.get(experimentId);
  
  if (!experiment || !results) return null;

  const variantResults: Record<string, unknown> = {};
  
  for (const variant of experiment.variants) {
    const impressions = results.impressions[variant.id] || 0;
    const conversions: Record<string, unknown> = {};
    
    for (const goal of experiment.goals) {
      const key = `${variant.id}:${goal.id}`;
      const data = results.conversions[key] || { count: 0, value: 0 };
      conversions[goal.id] = {
        ...data,
        rate: impressions > 0 ? `${((data.count / impressions) * 100).toFixed(2)}%` : '0%'
      };
    }
    
    variantResults[variant.id] = {
      name: variant.name,
      weight: variant.weight,
      impressions,
      conversions
    };
  }

  return {
    experimentId,
    name: experiment.name,
    status: experiment.status,
    variants: variantResults,
    totalImpressions: (Object.values(results.impressions) as number[]).reduce((a, b) => a + b, 0),
    startDate: experiment.startDate,
    endDate: experiment.endDate
  };
}

export function analyzeExperiment(experimentId: string, goalId: string) {
  const results = getResults(experimentId);
  if (!results) return null;

  const variants = Object.entries(results.variants);
  if (variants.length < 2) return { significantDifference: false };

  const control = (results.variants as any).control;
  const treatment = (results.variants as any).treatment;

  if (!control || !treatment) return { significantDifference: false };

  const controlRate = control.impressions > 0 
    ? control.conversions[goalId]?.count / control.impressions 
    : 0;
  const treatmentRate = treatment.impressions > 0 
    ? treatment.conversions[goalId]?.count / treatment.impressions 
    : 0;

  const lift = controlRate > 0 
    ? ((treatmentRate - controlRate) / controlRate * 100).toFixed(2)
    : 0;

  const minSampleSize = 100;
  const hasEnoughSamples = control.impressions >= minSampleSize && treatment.impressions >= minSampleSize;

  return {
    controlRate: `${(controlRate * 100).toFixed(2)}%`,
    treatmentRate: `${(treatmentRate * 100).toFixed(2)}%`,
    lift: `${lift}%`,
    winner: treatmentRate > controlRate ? 'treatment' : 'control',
    hasEnoughSamples,
    significantDifference: hasEnoughSamples && Math.abs(parseFloat(lift as string)) > 5
  };
}

function _saveAssignments() {
  if (typeof localStorage === 'undefined') return;
  try {
    const data = Array.from(_userAssignments.entries());
    localStorage.setItem(_config.storageKey, JSON.stringify(data));
  } catch (e) {}
}

export function loadAssignments() {
  if (typeof localStorage === 'undefined') return 0;
  try {
    const data = localStorage.getItem(_config.storageKey);
    if (data) {
      const entries = JSON.parse(data);
      entries.forEach(([key, value]: [string, string]) => _userAssignments.set(key, value));
      return entries.length;
    }
  } catch (e) {}
  return 0;
}

function _getAnonymousId() {
  if (typeof localStorage === 'undefined') return `anon_${Date.now()}`;
  
  let id = localStorage.getItem('ab_anonymous_id');
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ab_anonymous_id', id);
  }
  return id;
}

function _hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getMetrics() {
  _metrics.activeExperiments = getActiveExperiments().length;
  return { ..._metrics };
}

export function getStatus() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    experiments: _experiments.size,
    activeExperiments: getActiveExperiments().length,
    assignments: _userAssignments.size,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    features: ['experiments', 'variant-assignment', 'conversion-tracking', 'statistical-analysis', 'persistence'],
    portsInitialized: Ports.isInitialized(),
    status: getStatus()
  };
}

loadAssignments();

export default {
  VERSION, MODULE_ID,
  createExperiment, updateExperiment, startExperiment, pauseExperiment, stopExperiment, deleteExperiment,
  getExperiment, getAllExperiments, getActiveExperiments,
  assignVariant, getAssignment, clearAssignment,
  resolveRouteVariant,
  trackConversion, getResults, analyzeExperiment,
  loadAssignments, getMetrics, getStatus, healthCheck, info,
  injectPorts, getPorts
};
