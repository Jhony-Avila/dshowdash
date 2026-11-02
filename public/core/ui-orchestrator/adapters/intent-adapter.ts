// UI Orchestrator - Intent Adapter
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 2.0.0-PORTSFACTORY
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.1.0-ENTERPRISE - Logger fallback pattern
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'core.ui-orchestrator.adapters.intent-adapter';
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

const IntentType = { NAVIGATE: 'navigate', BACK: 'back', FORWARD: 'forward', REPLACE: 'replace', REFRESH: 'refresh', MODAL: 'modal', DRAWER: 'drawer' };

const adapt = (intent: unknown) => {
  const i = intent as Record<string, unknown>;
  if (!i || !i.type) { _log('warn', 'Intent inválido'); return null; }
  const adapted = {
    type: i.type, target: i.target || null, params: i.params || {},
    query: i.query || {}, options: i.options || {}, timestamp: Date.now(), id: generateIntentId()
  };
  return validate(adapted) ? adapted : null;
};

const validate = (intent: unknown) => {
  const i = intent as Record<string, unknown>;
  if (!i) return false;
  if (!Object.values(IntentType).includes(i.type as string)) { _log('warn', `Tipo de intent desconhecido: ${i.type}`); return false; }
  if (i.type === IntentType.NAVIGATE && !i.target) { _log('warn', 'Navigate intent requer target'); return false; }
  return true;
};

const transform = (intent: unknown, transformer: unknown) => {
  if (typeof transformer !== 'function') return intent;
  try { return transformer(intent); }
  catch (err) { _log('error', 'Erro no transformer:', err); return intent; }
};

const generateIntentId = () => `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createNavigateIntent = (target: unknown, params: Record<string, unknown> = {}, query: Record<string, unknown> = {}) => adapt({ type: IntentType.NAVIGATE, target, params, query });
const createBackIntent = () => adapt({ type: IntentType.BACK });
const createForwardIntent = () => adapt({ type: IntentType.FORWARD });
const createReplaceIntent = (target: unknown, params: Record<string, unknown> = {}) => adapt({ type: IntentType.REPLACE, target, params });
const createModalIntent = (target: unknown, options: Record<string, unknown> = {}) => adapt({ type: IntentType.MODAL, target, options });

const init = () => {
  _initPorts();
  _portsInitialized = true;
  return { success: true };
};

const healthCheck = () => ({ status: _portsInitialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: _portsInitialized });
const info = () => ({ moduleId: MODULE_ID, version: VERSION, intentTypes: Object.values(IntentType), portsInitialized: _portsInitialized });

export { IntentType, adapt, validate, transform, createNavigateIntent, createBackIntent, createForwardIntent, createReplaceIntent, createModalIntent, init, healthCheck, info, MODULE_ID, VERSION };
