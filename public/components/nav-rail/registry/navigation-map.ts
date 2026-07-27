// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-navigation-map
// PURPOSE: NavRail Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   INTENT_MAP — exported value
//   TRIGGER_COMPAT — exported value
//   INTENT_RULES — exported value
//   resolveIntent() — exported function
//   convertTrigger() — exported function
//   getPayloadByItemId() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'navrail-navigation-map';
export const VERSION = '5.2.0-ES6';

export const INTENT_MAP = Object.freeze([
  { from_intentId: 'navrail.open.home', to_intent: 'nav.navigate.path', payload: { itemId: 'home', path: '#/home', panelId: 'panel-dashboard', source: 'navrail' } },
  { from_intentId: 'navrail.open.dashboard', to_intent: 'nav.navigate.path', payload: { itemId: 'dashboard', path: '#/dashboard', panelId: 'panel-dashboard', source: 'navrail' } },
  { from_intentId: 'navrail.open.financeiro', to_intent: 'nav.navigate.path', payload: { itemId: 'financeiro', path: '#/financeiro', panelId: 'panel-09', source: 'navrail' } },
  { from_intentId: 'navrail.open.comercial', to_intent: 'nav.navigate.path', payload: { itemId: 'comercial', path: '#/comercial', panelId: 'panel-04', source: 'navrail' } },
  { from_intentId: 'navrail.open.clientes', to_intent: 'nav.navigate.path', payload: { itemId: 'clientes', path: '#/clientes', panelId: 'panel-03', source: 'navrail' } },
  { from_intentId: 'navrail.open.analytics', to_intent: 'nav.navigate.path', payload: { itemId: 'analytics', path: '#/analytics', panelId: 'panel-analytics', source: 'navrail' } },
  { from_intentId: 'navrail.open.relatorios', to_intent: 'nav.navigate.path', payload: { itemId: 'relatorios', path: '#/relatorios', panelId: 'panel-19', source: 'navrail' } },
  { from_intentId: 'navrail.open.charts', to_intent: 'nav.navigate.path', payload: { itemId: 'charts', path: '#/charts', panelId: 'panel-charts', source: 'navrail' } },
  { from_intentId: 'navrail.open.database', to_intent: 'nav.navigate.path', payload: { itemId: 'database', path: '#/database', panelId: 'panel-datahub', source: 'navrail' } },
  { from_intentId: 'navrail.open.folder', to_intent: 'nav.navigate.path', payload: { itemId: 'folder', path: '#/folder', panelId: 'panel-files', source: 'navrail' } },
  { from_intentId: 'navrail.open.docs', to_intent: 'nav.navigate.path', payload: { itemId: 'docs', path: '#/docs', panelId: 'panel-dashboard', source: 'navrail' } },
  { from_intentId: 'navrail.open.api', to_intent: 'nav.navigate.path', payload: { itemId: 'api', path: '#/api', panelId: 'panel-observability', source: 'navrail' } },
  { from_intentId: 'navrail.open.pipedrive', to_intent: 'nav.navigate.path', payload: { itemId: 'pipedrive', path: '#/pipedrive', panelId: 'panel-18', source: 'navrail' } },
  { from_intentId: 'navrail.open.location', to_intent: 'nav.navigate.path', payload: { itemId: 'location', path: '#/location', panelId: 'panel-location', source: 'navrail' } },
  { from_intentId: 'navrail.open.admin-users', to_intent: 'nav.navigate.path', payload: { itemId: 'admin-users', path: '#/admin-users', panelId: 'panel-user-management', source: 'navrail' } },
  { from_intentId: 'navrail.open.admin-settings', to_intent: 'nav.navigate.path', payload: { itemId: 'admin-settings', path: '#/admin-settings', panelId: 'panel-footer-settings', source: 'navrail' } },
  { from_intentId: 'navrail.open.code', to_intent: 'nav.navigate.path', payload: { itemId: 'code', path: '#/code', panelId: 'panel-code', source: 'navrail' } },
  { from_intentId: 'navrail.open.header-admin', to_intent: 'nav.navigate.path', payload: { itemId: 'header-admin', path: '#/header-admin', panelId: 'panel-header-admin', source: 'navrail' } },
  { from_intentId: 'navrail.open.navrail-admin', to_intent: 'nav.navigate.path', payload: { itemId: 'navrail-admin', path: '#/navrail-admin', panelId: 'panel-navrail-admin', source: 'navrail' } },
  { from_intentId: 'navrail.open.bell', to_intent: 'nav.navigate.path', payload: { itemId: 'bell', path: '#/bell', panelId: 'panel-user-notifications', source: 'navrail' } },
  { from_intentId: 'navrail.open.help', to_intent: 'nav.navigate.path', payload: { itemId: 'help', path: '#/help', panelId: 'panel-dashboard', source: 'navrail' } },
  { from_intentId: 'navrail.toggle.sidebar', to_intent: 'ui.action', payload: { action: 'sidebar.toggle', source: 'navrail' } }
]);

export const TRIGGER_COMPAT = Object.freeze({
  schema_id: 'navrail.trigger.compat.v1',
  version: VERSION,
  rules: [
    { kind: 'regex', from: '^trigger:navrail:([a-z0-9\\-]+)$', to: 'trigger:navigation:item-$1' },
    { kind: 'regex', from: '^trigger:navigation:item-([a-z0-9\\-]+)$', to: 'trigger:navrail:$1' }
  ]
});

export const INTENT_RULES = Object.freeze({
  schema_id: 'navrail.intent.compat.v1',
  version: VERSION,
  overrides: {
    'navrail.toggle.sidebar': { to_intent: 'ui.action', payload: { action: 'sidebar.toggle', source: 'navrail' } }
  } as Record<string, { to_intent: string; payload: Record<string, unknown> }>,
  rules: [
    {
      match: 'regex',
      from_intentId: '^navrail\\.open\\.([a-z0-9\\-]+)$',
      to: { type: 'nav.navigate.path', payload: { itemId: '$1', source: 'navrail' } }
    }
  ]
});

export function resolveIntent(intentId: string) {
  if (INTENT_RULES.overrides[intentId]) {
    return INTENT_RULES.overrides[intentId];
  }
  const mapping = INTENT_MAP.find(m => m.from_intentId === intentId);
  if (mapping) {
    return { to_intent: mapping.to_intent, payload: mapping.payload };
  }
  for (let i = 0; i < INTENT_RULES.rules.length; i++) {
    const rule = INTENT_RULES.rules[i];
    if (rule.match === 'regex') {
      const regex = new RegExp(rule.from_intentId);
      const match = intentId.match(regex);
      if (match) {
        const payload = JSON.parse(JSON.stringify(rule.to.payload));
        if (payload.itemId === '$1' && match[1]) {
          payload.itemId = match[1];
          payload.path = `#/${match[1]}`;
          payload.panelId = `panel-${match[1]}`;
        }
        return { to_intent: rule.to.type, payload };
      }
    }
  }
  return null;
}

export function convertTrigger(trigger: string, direction: string) {
  if (!trigger || typeof trigger !== 'string') return trigger;
  if (direction === 'toV1') {
    const m = trigger.match(/^trigger:navrail:([a-z0-9\-]+)$/);
    return m ? `trigger:navigation:item-${m[1]}` : trigger;
  }
  if (direction === 'toLegacy') {
    const m = trigger.match(/^trigger:navigation:item-([a-z0-9\-]+)$/);
    return m ? `trigger:navrail:${m[1]}` : trigger;
  }
  return trigger;
}

export function getPayloadByItemId(itemId: string) {
  const intentId = `navrail.open.${itemId}`;
  const mapping = INTENT_MAP.find(m => m.from_intentId === intentId);
  return mapping ? mapping.payload : null;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    intentMapCount: INTENT_MAP.length,
    triggerRulesCount: TRIGGER_COMPAT.rules.length,
    triggerFormat: '3-segment compliant (trigger:navigation:item-{id})',
    capabilities: ['resolveIntent', 'convertTrigger', 'getPayloadByItemId']
  };
}

export function healthCheck() {
  const checks = {
    intentMapLoaded: INTENT_MAP.length > 0,
    triggerCompatLoaded: TRIGGER_COMPAT.rules.length > 0,
    resolverWorking: resolveIntent('navrail.open.home') !== null,
    triggerConversionWorking: convertTrigger('trigger:navrail:home', 'toV1') === 'trigger:navigation:item-home',
    threeSegmentCompliant: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export default {
  MODULE_ID,
  VERSION,
  INTENT_MAP,
  TRIGGER_COMPAT,
  INTENT_RULES,
  resolveIntent,
  convertTrigger,
  getPayloadByItemId,
  info,
  healthCheck
};
