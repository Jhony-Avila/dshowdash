// UI Orchestrator - Resolver Target
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-ENTERPRISE - Logger fallback pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'core.ui-orchestrator.core.resolver-target';
const VERSION = '2.0.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _portsInitialized = false;

const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};

const parse = (route: string) => {
  if (!route || typeof route !== 'string') return null;
  try {
    const [pathWithParams, queryString] = route.split('?');
    const segments = pathWithParams.split('/').filter(Boolean);
    const params: Record<string, string | null> = {};
    const pattern = segments.map((segment: string) => {
      if (segment.startsWith(':')) { const paramName = segment.slice(1); params[paramName] = null; return segment; }
      return segment;
    }).join('/');
    const query = parseQuery(queryString);
    return { original: route, pattern: `/${pattern}`, segments, params, query, hash: null as string | null };
  } catch (err) {
    _log('error', 'Erro ao parsear rota:', err);
    return null;
  }
};

const parseQuery = (queryString: string | undefined) => {
  if (!queryString) return {};
  const query: Record<string, string> = {};
  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
  }
  return query;
};

const build = (pattern: string, params: Record<string, string> = {}, query: Record<string, string> = {}) => {
  let path = pattern;
  for (const [key, value] of Object.entries(params)) { path = path.replace(`:${key}`, encodeURIComponent(value as string)); }
  const queryString = buildQuery(query);
  return queryString ? `${path}?${queryString}` : path;
};

const buildQuery = (query: Record<string, string | null | undefined>) => {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`);
  }
  return pairs.join('&');
};

const match = (pattern: string, route: string) => {
  const patternParts = pattern.split('/').filter(Boolean);
  const routeParts = route.split('?')[0].split('/').filter(Boolean);
  if (patternParts.length !== routeParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const routePart = routeParts[i];
    if (patternPart.startsWith(':')) { params[patternPart.slice(1)] = routePart; }
    else if (patternPart !== routePart) { return null; }
  }
  return params;
};

const init = () => {
  _initPorts();
  _portsInitialized = true;
  return { success: true };
};

const healthCheck = () => ({ status: _portsInitialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: _portsInitialized });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: _portsInitialized });

export { parse, parseQuery, build, buildQuery, match, init, healthCheck, info, MODULE_ID, VERSION };
