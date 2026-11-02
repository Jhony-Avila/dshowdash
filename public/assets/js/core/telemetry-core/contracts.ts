// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: telemetry-core/contracts
// PURPOSE: Telemetry Core - Event Contracts (Schema Central)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   SEVERITIES — exported value
//   EVENT_TYPES — exported value
//   BASE_SCHEMA — exported value
//   METRIC_SCHEMA — exported value
//   ERROR_SCHEMA — exported value
//   COMPONENT_NAMESPACES — exported value
//   STANDARD_EVENTS — exported value
//   validateEvent() — exported function
//   createEventName() — exported function
//   parseEventName() — exported function
//   isRegisteredComponent() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export var VERSION = '1.1.0-ENTERPRISE';
var MODULE_ID = 'telemetry-core/contracts';

export var SEVERITIES = Object.freeze({ DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error', CRITICAL: 'critical' });
export var EVENT_TYPES = Object.freeze({ EVENT: 'event', METRIC: 'metric', ERROR: 'error' });
export var BASE_SCHEMA = Object.freeze({ required: ['timestamp', 'timestampISO', 'type', 'event', 'component', 'severity', 'traceId', 'sessionId', 'bootId'], optional: ['context', 'data'] });
export var METRIC_SCHEMA = Object.freeze({ required: BASE_SCHEMA.required.concat(['metric']), metricFields: ['name', 'value', 'unit'] });
export var ERROR_SCHEMA = Object.freeze({ required: BASE_SCHEMA.required.concat(['error']), errorFields: ['message', 'code'], optionalErrorFields: ['stack'] });

export var COMPONENT_NAMESPACES = Object.freeze({
  TELEMETRY: 'telemetry-core', EVENTBUS: 'eventbus-global', ROUTER: 'router-global', GLOBALSTATE: 'global-state',
  MAIN: 'main', HEADER: 'header', SIDEBAR: 'sidebar', FOOTER: 'footer', PRELOADER: 'preloader', LOGIN_MODAL: 'login-modal',
  PANEL: 'panel', CARD: 'card', ORCHESTRATOR: 'core-orchestrator', AUTH: 'auth', SESSION: 'session', PERMISSIONS: 'permissions'
});

export var STANDARD_EVENTS = Object.freeze({
  INIT: ':init', READY: ':ready', MOUNT: ':mount', UNMOUNT: ':unmount', DESTROY: ':destroy',
  UPDATE: ':update', REFRESH: ':refresh', RESET: ':reset', ERROR: ':error', WARN: ':warn',
  TIMING: ':timing', METRIC: ':metric', NAVIGATE: ':navigate', ROUTE_CHANGE: ':route-change'
});

export function validateEvent(event: Record<string, unknown>) {
  var errors = [];
  for (var i = 0; i < BASE_SCHEMA.required.length; i++) { var field = BASE_SCHEMA.required[i]; if (event[field] === undefined || event[field] === null) errors.push('Missing required field: ' + field); }
  var eventTypeValues = [EVENT_TYPES.EVENT, EVENT_TYPES.METRIC, EVENT_TYPES.ERROR];
  if (event.type) { var typeValid = false; for (var t = 0; t < eventTypeValues.length; t++) { if (eventTypeValues[t] === event.type) typeValid = true; } if (!typeValid) errors.push('Invalid event type: ' + event.type); }
  var severityValues = [SEVERITIES.DEBUG, SEVERITIES.INFO, SEVERITIES.WARN, SEVERITIES.ERROR, SEVERITIES.CRITICAL];
  if (event.severity) { var sevValid = false; for (var s = 0; s < severityValues.length; s++) { if (severityValues[s] === event.severity) sevValid = true; } if (!sevValid) errors.push('Invalid severity: ' + event.severity); }
  if (event.type === EVENT_TYPES.METRIC) { var metricField = event.metric as Record<string, unknown> | undefined; if (!metricField) errors.push('Metric events must have metric field'); else { if (metricField.value === undefined) errors.push('Metric must have value'); } }
  if (event.type === EVENT_TYPES.ERROR) { var errorField = event.error as Record<string, unknown> | undefined; if (!errorField) errors.push('Error events must have error field'); else { if (!errorField.message) errors.push('Error must have message'); } }
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : null };
}

export function createEventName(component: string, action: string) {
  if (!component || !action) return null;
  var normalizedComponent = component.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  var normalizedAction = action.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return normalizedComponent + ':' + normalizedAction;
}

export function parseEventName(eventName: string) {
  if (!eventName || typeof eventName !== 'string') return { component: 'unknown', action: 'unknown' };
  var parts = eventName.split(':');
  if (parts.length < 2) return { component: eventName, action: 'event' };
  return { component: parts[0], action: parts.slice(1).join(':') };
}

export function isRegisteredComponent(component: string) {
  var values = [];
  for (var k in COMPONENT_NAMESPACES) { if (Object.prototype.hasOwnProperty.call(COMPONENT_NAMESPACES, k)) values.push(COMPONENT_NAMESPACES[k as keyof typeof COMPONENT_NAMESPACES]); }
  for (var i = 0; i < values.length; i++) { if (values[i] === component) return true; }
  return component.indexOf('panel') === 0 || component.indexOf('card') === 0 || component.indexOf('p') === 0 || component.indexOf('c') === 0;
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, schemas: { base: BASE_SCHEMA, metric: METRIC_SCHEMA, error: ERROR_SCHEMA }, severities: [SEVERITIES.DEBUG, SEVERITIES.INFO, SEVERITIES.WARN, SEVERITIES.ERROR, SEVERITIES.CRITICAL], eventTypes: [EVENT_TYPES.EVENT, EVENT_TYPES.METRIC, EVENT_TYPES.ERROR], registeredComponents: Object.keys(COMPONENT_NAMESPACES).length, timestamp: new Date().toISOString() }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { validateEventReady: typeof validateEvent === 'function', schemasReady: !!BASE_SCHEMA } }; }

export default { VERSION: VERSION, SEVERITIES: SEVERITIES, EVENT_TYPES: EVENT_TYPES, BASE_SCHEMA: BASE_SCHEMA, METRIC_SCHEMA: METRIC_SCHEMA, ERROR_SCHEMA: ERROR_SCHEMA, COMPONENT_NAMESPACES: COMPONENT_NAMESPACES, STANDARD_EVENTS: STANDARD_EVENTS, validateEvent: validateEvent, createEventName: createEventName, parseEventName: parseEventName, isRegisteredComponent: isRegisteredComponent, info: info, healthCheck: healthCheck };
