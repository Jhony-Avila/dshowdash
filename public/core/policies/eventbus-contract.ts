// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies.eventbus-contract
// PURPOSE: Contrato formal do EventBus baseado em evidência real
// ───────────────────────────────────────────────────────────────
// @contract EVENTBUS_CONTRACT - Define comportamento esperado do EventBus
// @contract PORT_VALIDATION - Valida ports contra contrato
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (standalone contract)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   EVENTBUS_PORT_CONTRACT — contrato mínimo de port
//   validateEventBusPort(port) — valida port
//   EVENTBUS_TOPOLOGY — topologia Global/Local
//   EVENTBUS_RULES — regras formais
//   GLOBAL_EVENTS — eventos permitidos/proibidos
//   isGlobalEventAllowed(eventName) — valida evento
//   createNullEventBusPort() — factory de null port
//   healthCheck() — status de saúde
//   info() — informações do módulo
//
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.2.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.policies.eventbus-contract';

export const EVENTBUS_PORT_CONTRACT = Object.freeze({
  required: { emit: 'function', on: 'function', off: 'function' },
  description: 'Contrato mínimo para integração com Main',
  source: 'main/ports/EventBusPort.js v1.0.0-AAA'
});

export const validateEventBusPort = (port: Record<string, unknown>) => port && typeof port.emit === 'function' && typeof port.on === 'function' && typeof port.off === 'function';

export const MAIN_LISTENED_EVENTS = Object.freeze(['ui:action']);

export const EVENTBUS_TOPOLOGY = Object.freeze({
  GLOBAL: { name: 'window.EventBus', alias: 'window.EventBusGlobal', scope: 'ROOT', description: 'Comunicação inter-sistemas', consumer: 'Main (via EventBusAdapter)', contract: EVENTBUS_PORT_CONTRACT },
  LOCAL: { scope: 'SCOPED', description: 'Comunicação interna do componente', instances: [{ component: 'footer', path: 'footer/core/event-bus-local.js' }, { component: 'header', path: 'header/core/event-bus.js' }, { component: 'login-modal', path: 'login-modal/state/events.js' }] }
});

export const ADAPTER_BEHAVIOR = Object.freeze({
  version: '1.1.0-AAA', source: 'main/adapters/EventBusAdapter.js',
  features: { autoInjectSource: true, autoInjectTimestamp: true, handlerWrapping: true, cleanupSupport: true },
  api: { emit: { returns: 'boolean', injects: ['source', 'timestamp'] }, on: { returns: 'function (unsubscribe)', wrapsHandler: true }, off: { returns: 'boolean' }, cleanup: { returns: 'void', clearsAllHandlers: true } }
});

export const EVENTBUS_RULES = Object.freeze({
  RULE_EB_001: { id: 'MAIN_SINGLE_EVENT', description: 'Main só escuta ui:action', evidence: 'action-hub/index.js:16 - LISTENED_EVENTS', severity: 'CRITICAL' },
  RULE_EB_002: { id: 'MAIN_VIA_ADAPTER', description: 'Main acessa EventBus via EventBusAdapter', evidence: 'main/adapters/EventBusAdapter.js', severity: 'HIGH' },
  RULE_EB_003: { id: 'BUS_NO_EFFECTS', description: 'EventBus não executa efeitos - apenas transporta mensagens', evidence: 'Pipeline: ui:action → ActionHub → ActionExecutor → Effects', severity: 'CRITICAL' },
  RULE_EB_004: { id: 'LOCAL_ISOLATION', description: 'Buses locais não devem vazar eventos para o Global sem contrato', severity: 'HIGH' },
  RULE_EB_005: { id: 'PORT_CONTRACT', description: 'Qualquer EventBus deve implementar emit/on/off', evidence: 'main/ports/EventBusPort.js', severity: 'HIGH' }
});

export const GLOBAL_EVENTS = Object.freeze({
  allowed: [
    { event: 'ui:action', consumer: 'ActionHub', description: 'Ações de UI' },
    { event: 'input:policy:*', consumer: 'InputPolicyManager', description: 'Estados de input' },
    { event: 'auth:*', consumer: 'AuthManager', description: 'Autenticação' },
    { event: 'session:*', consumer: 'SessionManager', description: 'Sessão' },
    { event: 'telemetry:*', consumer: 'TelemetryCollector', description: 'Métricas' }
  ],
  forbidden: [
    { pattern: '*:mounted', reason: 'Lifecycle local' },
    { pattern: '*:rendered', reason: 'Lifecycle local' },
    { pattern: 'navigate:*', reason: 'Use ui:action com effect NAVIGATE' },
    { pattern: 'route:*', reason: 'Interno ao Router/Main' }
  ]
});

export const VALIDATION_CHECKLIST = Object.freeze([
  { check: 'Main escuta apenas ui:action', file: 'action-hub/index.js', pattern: "LISTENED_EVENTS = ['ui:action']" },
  { check: 'EventBusAdapter injeta source', file: 'EventBusAdapter.js', pattern: 'source: this._source' },
  { check: 'EventBusAdapter injeta timestamp', file: 'EventBusAdapter.js', pattern: 'timestamp: Date.now()' },
  { check: 'Port contract tem emit/on/off', file: 'EventBusPort.js', pattern: 'emit.*on.*off' },
  { check: 'Buses locais isolados', file: '**/event-bus-local.js', pattern: 'namespace ou prefix' }
]);

export const isGlobalEventAllowed = (eventName: string) => {
  for (const item of GLOBAL_EVENTS.forbidden) {
    const regex = new RegExp(`^${item.pattern.replace(/\*/g, '.*')}$`);
    if (regex.test(eventName)) return { allowed: false, reason: item.reason };
  }
  for (const allowed of GLOBAL_EVENTS.allowed) {
    const allowedRegex = new RegExp(`^${allowed.event.replace(/\*/g, '.*')}$`);
    if (allowedRegex.test(eventName)) return { allowed: true };
  }
  return { allowed: false, reason: 'Evento não documentado no contrato' };
};

export const createNullEventBusPort = () => ({ emit: () => {}, on: () => () => {}, off: () => {} });

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, rulesCount: Object.keys(EVENTBUS_RULES).length, allowedEventsCount: GLOBAL_EVENTS.allowed.length });

export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rulesReady: Object.keys(EVENTBUS_RULES).length > 0, topologyReady: !!EVENTBUS_TOPOLOGY, validateFunctionReady: typeof validateEventBusPort === 'function' } });

export const EventBusContract = Object.freeze({
  VERSION, MODULE_ID, EVENTBUS_PORT_CONTRACT, MAIN_LISTENED_EVENTS, EVENTBUS_TOPOLOGY, ADAPTER_BEHAVIOR, EVENTBUS_RULES, GLOBAL_EVENTS, VALIDATION_CHECKLIST,
  validateEventBusPort, isGlobalEventAllowed, createNullEventBusPort, info, healthCheck
});

export default EventBusContract;
