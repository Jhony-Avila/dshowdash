import { FOOTER_EVENTS, FOOTER_INTENTS } from "/core/runtime/events/catalog/footer.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "1.1.0-P1-SPEC";
const MODULE_ID = "footer.contracts";
const FOOTER_IDENTITY = Object.freeze({
  regionId: "region:app:footer",
  shellHost: "#shell-footer-region",
  legacyId: "footer-root",
  moduleId: "components/footer",
  role: "contentinfo",
  ariaLabel: "Rodap\xE9 da aplica\xE7\xE3o"
});
const FOOTER_RESPONSIBILITIES = Object.freeze({
  owns: [
    "mount/unmount na regi\xE3o do Shell",
    "orquestrar slots e bot\xF5es",
    "emitir FOOTER_EVENTS.*",
    "responder a FOOTER_INTENTS.*",
    "emitir UI_EVENTS para a\xE7\xF5es",
    "garantir UARPS nativo"
  ],
  doesNot: [
    "navegar por conta pr\xF3pria",
    "gerenciar estado global complexo",
    "usar router/history diretamente",
    "bloquear boot da aplica\xE7\xE3o"
  ]
});
const EMITTED_EVENTS = Object.freeze([
  FOOTER_EVENTS.READY,
  FOOTER_EVENTS.MOUNTED,
  FOOTER_EVENTS.UNMOUNTED,
  FOOTER_EVENTS.BUTTON_CLICKED,
  FOOTER_EVENTS.BUTTON_MOUNTED,
  FOOTER_EVENTS.BUTTON_UNMOUNTED,
  UI_EVENTS.FOOTER_BUTTON_CLICK,
  UI_EVENTS.FOOTER_ACTION
]);
const CONSUMED_INTENTS = Object.freeze([
  FOOTER_INTENTS.SHOW,
  FOOTER_INTENTS.HIDE,
  FOOTER_INTENTS.REFRESH
]);
const EVENT_PAYLOAD_SCHEMA = Object.freeze({
  source: "footer",
  moduleId: "components/footer",
  timestamp: "number",
  data: "object"
});
const BUTTON_CLICK_PAYLOAD_SCHEMA = Object.freeze({
  buttonId: "string",
  trigger: "string",
  timestamp: "number",
  meta: { source: "footer" }
});
const UARPS_CONTRACT = Object.freeze({
  region: "region:app:footer",
  triggerPattern: "trigger:footer:<id>",
  requiredAttributes: ["data-uarps-region", "data-uarps-trigger"]
});
function validateContract() {
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
function info() {
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
function healthCheck() {
  const validation = validateContract();
  return {
    status: validation.valid ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: validation.checks,
    score: validation.score
  };
}
var contracts_default = {
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
export {
  BUTTON_CLICK_PAYLOAD_SCHEMA,
  CONSUMED_INTENTS,
  EMITTED_EVENTS,
  EVENT_PAYLOAD_SCHEMA,
  FOOTER_IDENTITY,
  FOOTER_RESPONSIBILITIES,
  MODULE_ID,
  UARPS_CONTRACT,
  VERSION,
  contracts_default as default,
  healthCheck,
  info,
  validateContract
};
