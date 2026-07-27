// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: orchestrator-validators
// PURPOSE: Orchestrator Validators
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   validateModuleContract() — exported function
//   validatePreset() — exported function
//   validateApiPolicy() — exported function
//   validateHealthCheckConfig() — exported function
//   validateEventPayload() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'orchestrator-validators';

export function getVersion() { return VERSION; }

export function validateModuleContract(config: Record<string, unknown>) {
  const errors: string[] = [];
  const required = ['id', 'name', 'type'];
  required.forEach(field => { if (!config[field]) errors.push(`Campo obrigatório ausente: ${field}`); });
  if (config.id && typeof config.id !== 'string') errors.push('id deve ser string');
  if (config.version && !/^\d+\.\d+\.\d+/.test(config.version as string)) errors.push('version deve seguir semver (x.y.z)');
  if (config.dependencies && !Array.isArray(config.dependencies)) errors.push('dependencies deve ser array');
  if (config.refreshInterval && typeof config.refreshInterval !== 'number') errors.push('refreshInterval deve ser número');
  if (config.critical !== undefined && typeof config.critical !== 'boolean') errors.push('critical deve ser boolean');
  const validTypes = ['panel', 'card', 'widget', 'service', 'orchestrator'];
  if (config.type && validTypes.indexOf(config.type as string) === -1) errors.push(`type deve ser um de: ${validTypes.join(', ')}`);
  return { valid: errors.length === 0, errors };
}

export function validatePreset(preset: Record<string, unknown>) {
  const errors: string[] = [];
  if (!preset.id) errors.push('Preset deve ter id');
  if (!preset.name) errors.push('Preset deve ter name');
  if (!preset.layoutMode) errors.push('Preset deve ter layoutMode');
  if (!Array.isArray(preset.panels)) errors.push('Preset deve ter array de panels');
  if (preset.panels && (preset.panels as unknown[]).length === 0) errors.push('Preset deve ter pelo menos um painel');
  if (preset.maxPanels && typeof preset.maxPanels !== 'number') errors.push('maxPanels deve ser número');
  return { valid: errors.length === 0, errors };
}

export function validateApiPolicy(policy: Record<string, unknown>) {
  const errors: string[] = [];
  if (policy.timeout && typeof policy.timeout !== 'number') errors.push('timeout deve ser número');
  if (policy.maxRetries && typeof policy.maxRetries !== 'number') errors.push('maxRetries deve ser número');
  if (policy.timeout && (policy.timeout as number) < 1000) errors.push('timeout deve ser >= 1000ms');
  if (policy.maxRetries && ((policy.maxRetries as number) < 0 || (policy.maxRetries as number) > 10)) errors.push('maxRetries deve estar entre 0 e 10');
  return { valid: errors.length === 0, errors };
}

export function validateHealthCheckConfig(config: Record<string, unknown>) {
  const errors: string[] = [];
  if (config.interval && typeof config.interval !== 'number') errors.push('interval deve ser número');
  if (config.timeout && typeof config.timeout !== 'number') errors.push('timeout deve ser número');
  if (config.interval && (config.interval as number) < 5000) errors.push('interval mínimo é 5000ms');
  return { valid: errors.length === 0, errors };
}

export function validateEventPayload(payload: Record<string, unknown>) {
  const errors: string[] = [];
  if (!payload._source) errors.push('Payload deve ter _source');
  if (!payload._timestamp) errors.push('Payload deve ter _timestamp');
  return { valid: errors.length === 0, errors };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { validatorsReady: true } }; }

export default { VERSION, MODULE_ID, getVersion, validateModuleContract, validatePreset, validateApiPolicy, validateHealthCheckConfig, validateEventPayload, info, healthCheck };
