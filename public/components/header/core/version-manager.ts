// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/version-manager
// PURPOSE: Gerenciamento de versionamento semantico dos modulos do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   init() — inicializa o version manager
//   parseVersion(str) — parse de string de versao
//   compareVersions(v1, v2) — compara duas versoes
//   satisfies(version, range) — verifica se versao atende range
//   registerModule(id, version, meta) — registra modulo
//   getModule(id) / getModuleVersion(id) — consulta modulo
//   getAllModules() — lista todos os modulos registrados
//   checkCompatibility(src, tgt) — verifica compatibilidade
//   checkAllDependencies(id) — valida todas dependencias
//   incrementVersion(version, type) — incrementa versao
//   deprecateModule(id, msg) — marca modulo como deprecado
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// ═══════════════════════════════════════════════════════════════
// Header - Version Manager
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B14: var → const/let
// Gerencia versionamento semantico dos modulos do Header
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/version-manager';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _modules = new Map();
const _compatibilityRules = new Map();
// @ts-expect-error strict migration — TS7034
const _changelog = [];

function init() {
  _initPorts();
  _log('info', 'VersionManager inicializado');
}

function parseVersion(versionStr: unknown) {
  if (!versionStr || typeof versionStr !== 'string') return null;
  const clean = versionStr.replace(/^v/, '');
  const parts = clean.split('-');
  const numbers = parts[0].split('.');
  return {
    major: parseInt(numbers[0], 10) || 0,
    minor: parseInt(numbers[1], 10) || 0,
    patch: parseInt(numbers[2], 10) || 0,
    prerelease: parts[1] || null,
    original: versionStr
  };
}

function compareVersions(v1: unknown, v2: unknown) {
  const a = typeof v1 === 'string' ? parseVersion(v1) : v1;
  const b = typeof v2 === 'string' ? parseVersion(v2) : v2;
  if (!a || !b) return 0;
  // @ts-expect-error TS migration - TS2339
  if (a.major !== b.major) return a.major - b.major;
  // @ts-expect-error TS migration - TS2339
  if (a.minor !== b.minor) return a.minor - b.minor;
  // @ts-expect-error TS migration - TS2339
  if (a.patch !== b.patch) return a.patch - b.patch;
  // @ts-expect-error TS migration - TS2339
  if (a.prerelease && !b.prerelease) return -1;
  // @ts-expect-error TS migration - TS2339
  if (!a.prerelease && b.prerelease) return 1;
  return 0;
}

function satisfies(version: unknown, range: unknown) {
  const v = typeof version === 'string' ? parseVersion(version) : version;
  if (!v) return false;
  // @ts-expect-error TS migration - TS2339
  if (range.startsWith('^')) {
    // @ts-expect-error TS migration - TS2339
    const min = parseVersion(range.substring(1));
    if (!min) return false;
    // @ts-expect-error TS migration - TS2339
    return v.major === min.major && (v.minor > min.minor || (v.minor === min.minor && v.patch >= min.patch));
  }
  // @ts-expect-error TS migration - TS2339
  if (range.startsWith('~')) {
    // @ts-expect-error TS migration - TS2339
    const min = parseVersion(range.substring(1));
    if (!min) return false;
    // @ts-expect-error TS migration - TS2339
    return v.major === min.major && v.minor === min.minor && v.patch >= min.patch;
  }
  // @ts-expect-error TS migration - TS2339
  if (range.startsWith('>=')) {
    // @ts-expect-error TS migration - TS2339
    const min = parseVersion(range.substring(2));
    return compareVersions(v, min) >= 0;
  }
  // @ts-expect-error TS migration - TS2339
  if (range.startsWith('>')) {
    // @ts-expect-error TS migration - TS2339
    const min = parseVersion(range.substring(1));
    return compareVersions(v, min) > 0;
  }
  // @ts-expect-error TS migration - TS2339
  if (range.startsWith('<=')) {
    // @ts-expect-error TS migration - TS2339
    const max = parseVersion(range.substring(2));
    return compareVersions(v, max) <= 0;
  }
  // @ts-expect-error TS migration - TS2339
  if (range.startsWith('<')) {
    // @ts-expect-error TS migration - TS2339
    const max = parseVersion(range.substring(1));
    return compareVersions(v, max) < 0;
  }
  const exact = parseVersion(range);
  return compareVersions(v, exact) === 0;
}

function registerModule(moduleId: string, version: unknown, metadata: unknown) {
  metadata = metadata || {};
  const parsed = parseVersion(version);
  _modules.set(moduleId, {
    moduleId,
    version,
    parsed,
    registeredAt: Date.now(),
    // @ts-expect-error TS migration - TS2339
    dependencies: metadata.dependencies || {},
    // @ts-expect-error TS migration - TS2339
    changelog: metadata.changelog || [],
    // @ts-expect-error TS migration - TS2339
    deprecated: metadata.deprecated || false,
    // @ts-expect-error TS migration - TS2339
    deprecationMessage: metadata.deprecationMessage || null
  });
  _log('debug', 'Modulo registrado:', moduleId, version);
  return true;
}

function getModule(moduleId: string) {
  return _modules.get(moduleId) || null;
}

function getModuleVersion(moduleId: string) {
  const mod = _modules.get(moduleId);
  return mod ? mod.version : null;
}

function getAllModules() {
  const result = {};
  _modules.forEach((mod, id) => {
    (result as Record<string,unknown>)[id as string] = { version: mod.version, deprecated: mod.deprecated, registeredAt: mod.registeredAt };
  });
  return result;
}

function addCompatibilityRule(sourceModule: unknown, targetModule: unknown, versionRange: unknown) {
  const key = `${sourceModule}:${targetModule}`;
  _compatibilityRules.set(key, { source: sourceModule, target: targetModule, range: versionRange, addedAt: Date.now() });
  _log('debug', 'Regra adicionada:', key, versionRange);
}

function checkCompatibility(sourceModule: unknown, targetModule: unknown) {
  const source = _modules.get(sourceModule);
  const target = _modules.get(targetModule);
  if (!source || !target) {
    return { compatible: false, reason: 'Modulo nao encontrado' };
  }
  const key = `${sourceModule}:${targetModule}`;
  const rule = _compatibilityRules.get(key);
  if (!rule) {
    return { compatible: true, reason: 'Sem regra de compatibilidade definida' };
  }
  const isCompatible = satisfies(target.version, rule.range);
  return {
    compatible: isCompatible,
    sourceVersion: source.version,
    targetVersion: target.version,
    requiredRange: rule.range,
    reason: isCompatible ? 'Versao compativel' : 'Versao incompativel'
  };
}

function checkAllDependencies(moduleId: string) {
  const mod = _modules.get(moduleId);
  if (!mod) return { valid: false, errors: ['Modulo nao encontrado'] };
  // @ts-expect-error strict migration — TS7034
  const errors = [];
  // @ts-expect-error strict migration — TS7034
  const warnings = [];
  Object.keys(mod.dependencies).forEach(depId => {
    const requiredRange = mod.dependencies[depId];
    const dep = _modules.get(depId);
    if (!dep) {
      errors.push(`Dependencia nao encontrada: ${depId}`);
    } else if (!satisfies(dep.version, requiredRange)) {
      errors.push(`Versao incompativel: ${depId} requer ${requiredRange}, encontrado ${dep.version}`);
    }
  });
  // @ts-expect-error strict migration — TS7005
  return { valid: errors.length === 0, errors, warnings };
}

function addChangelogEntry(moduleId: string, version: unknown, changes: Record<string,unknown>) {
  const entry = { moduleId, version, changes, timestamp: Date.now(), date: new Date().toISOString().split('T')[0] };
  _changelog.push(entry);
  _log('debug', 'Changelog adicionado:', moduleId, version);
}

function getChangelog(moduleId: string, limit: number) {
  limit = limit || 10;
  // @ts-expect-error strict migration — TS7005
  const filtered = moduleId ? _changelog.filter(e => e.moduleId === moduleId) : _changelog;
  return filtered.slice(-limit).reverse();
}

function incrementVersion(version: unknown, type: string) {
  const v = parseVersion(version);
  if (!v) return null;
  switch (type) {
    case 'major': return `${v.major + 1}.0.0`;
    case 'minor': return `${v.major}.${v.minor + 1}.0`;
    case 'patch': return `${v.major}.${v.minor}.${v.patch + 1}`;
    default: return null;
  }
}

function deprecateModule(moduleId: string, message: string) {
  const mod = _modules.get(moduleId);
  if (mod) {
    mod.deprecated = true;
    mod.deprecationMessage = message || 'Este modulo esta deprecado';
    _log('warn', 'Modulo deprecado:', moduleId);
    return true;
  }
  return false;
}

function getDeprecatedModules() {
  // @ts-expect-error strict migration — TS7034
  const result = [];
  _modules.forEach(mod => {
    if (mod.deprecated) {
      result.push({ moduleId: mod.moduleId, version: mod.version, message: mod.deprecationMessage });
    }
  });
  // @ts-expect-error strict migration — TS7005
  return result;
}

function healthCheck() {
  const deprecated = getDeprecatedModules();
  const checks = { hasModules: _modules.size > 0, noDeprecated: deprecated.length === 0, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, modulesCount: _modules.size, deprecatedCount: deprecated.length, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, modulesRegistered: _modules.size, compatibilityRules: _compatibilityRules.size, changelogEntries: _changelog.length, deprecated: getDeprecatedModules(), modules: getAllModules(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}

export { init, parseVersion, compareVersions, satisfies, registerModule, getModule, getModuleVersion, getAllModules, addCompatibilityRule, checkCompatibility, checkAllDependencies, addChangelogEntry, getChangelog, incrementVersion, deprecateModule, getDeprecatedModules, healthCheck, info };
export default { VERSION, MODULE_ID, init, parseVersion, compareVersions, satisfies, registerModule, getModule, getAllModules, checkCompatibility, incrementVersion, healthCheck, info };
