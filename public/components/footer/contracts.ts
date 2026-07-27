// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P1-SPEC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer.contracts
// PURPOSE: Footer Contracts - Enterprise P1
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   FOOTER_EVENTS, FOOTER_INTENTS from /core/runtime/events/catalog/footer.events.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   FOOTER_IDENTITY — exported value
//   FOOTER_RESPONSIBILITIES — exported value
//   EMITTED_EVENTS — exported value
//   CONSUMED_INTENTS — exported value
//   EVENT_PAYLOAD_SCHEMA — exported value
//   BUTTON_CLICK_PAYLOAD_SCHEMA — exported value
//   UARPS_CONTRACT — exported value
//   validateContract() — exported function
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

import { FOOTER_EVENTS, FOOTER_INTENTS } from '/core/runtime/events/catalog/footer.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '1.1.0-P1-SPEC';
export const MODULE_ID = 'footer.contracts';

// Identidade Canônica do Footer
export const FOOTER_IDENTITY = Object.freeze({
  regionId: 'region:app:footer',
  shellHost: '#shell-footer-region',
  legacyId: 'footer-root',
  moduleId: 'components/footer',
  role: 'contentinfo',
  ariaLabel: 'Rodapé da aplicação'
});

// Responsabilidades do Footer (RACI)
export const FOOTER_RESPONSIBILITIES = Object.freeze({
  owns: [
    'mount/unmount na região do Shell',
    'orquestrar slots e botões',
    'emitir FOOTER_EVENTS.*',
    'responder a FOOTER_INTENTS.*',
    'emitir UI_EVENTS para ações',
    'garantir UARPS nativo'
  ],
  doesNot: [
    'navegar por conta própria',
    'gerenciar estado global complexo',
    'usar router/history diretamente',
    'bloquear boot da aplicação'
  ]
});

// Eventos que o Footer EMITE
export const EMITTED_EVENTS = Object.freeze([
  FOOTER_EVENTS.READY,
  FOOTER_EVENTS.MOUNTED,
  FOOTER_EVENTS.UNMOUNTED,
  FOOTER_EVENTS.BUTTON_CLICKED,
  FOOTER_EVENTS.BUTTON_MOUNTED,
  FOOTER_EVENTS.BUTTON_UNMOUNTED,
  UI_EVENTS.FOOTER_BUTTON_CLICK,
  UI_EVENTS.FOOTER_ACTION
]);

// Intents que o Footer RESPONDE
export const CONSUMED_INTENTS = Object.freeze([
  FOOTER_INTENTS.SHOW,
  FOOTER_INTENTS.HIDE,
  FOOTER_INTENTS.REFRESH
]);

// Payload padrão para FOOTER_EVENTS
export const EVENT_PAYLOAD_SCHEMA = Object.freeze({
  source: 'footer',
  moduleId: 'components/footer',
  timestamp: 'number',
  data: 'object'
});

// Payload padrão para UI_EVENTS.FOOTER_BUTTON_CLICK
export const BUTTON_CLICK_PAYLOAD_SCHEMA = Object.freeze({
  buttonId: 'string',
  trigger: 'string',
  timestamp: 'number',
  meta: { source: 'footer' }
});

// Contrato UARPS
export const UARPS_CONTRACT = Object.freeze({
  region: 'region:app:footer',
  triggerPattern: 'trigger:footer:<id>',
  requiredAttributes: ['data-uarps-region', 'data-uarps-trigger']
});

// Validação de contrato
export function validateContract() {
  const checks = {
    hasIdentity: !!FOOTER_IDENTITY.regionId,
    hasEmittedEvents: EMITTED_EVENTS.length > 0,
    hasConsumedIntents: CONSUMED_INTENTS.length > 0,
    hasUarpsContract: !!UARPS_CONTRACT.region
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    valid: passed === total,
    score: `${passed}/${total}`,
    checks
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    identity: FOOTER_IDENTITY,
    emits: EMITTED_EVENTS.length,
    consumes: CONSUMED_INTENTS.length,
    uarps: UARPS_CONTRACT,
    validation: validateContract()
  };
}

export function healthCheck() {
  const validation = validateContract();
  return {
    status: validation.valid ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: validation.checks,
    score: validation.score
  };
}

export default {
  VERSION,
  MODULE_ID,
  FOOTER_IDENTITY,
  FOOTER_RESPONSIBILITIES,
  EMITTED_EVENTS,
  CONSUMED_INTENTS,
  EVENT_PAYLOAD_SCHEMA,
  BUTTON_CLICK_PAYLOAD_SCHEMA,
  UARPS_CONTRACT,
  validateContract,
  info,
  healthCheck
};
