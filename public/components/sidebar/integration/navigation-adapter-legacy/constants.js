const VERSION = "1.2.0-ES6";
const MODULE_ID = "navigation-adapter-legacy";
const TRIGGER_PATTERNS = {
  V1_ITEM: /^trigger:navigation:item-(.+)$/,
  V1_SECTION: /^trigger:navigation:section-(.+)$/,
  LEGACY_SIDEBAR: /^trigger:sidebar:(.+)$/,
  LEGACY_ACCORDION: /^trigger:accordion:item-(.+)$/,
  LEGACY_ACCORDION_SECTION: /^trigger:accordion:section-(.+)$/,
  LEGACY_PLAIN: /^([a-z0-9-]+)$/,
  LEGACY_4SEG_ITEM: /^trigger:navigation:item:(.+)$/,
  LEGACY_4SEG_SECTION: /^trigger:navigation:section:(.+)$/
};
const DEFAULT_REGION = "region:app:accordion-ncs";
const SECTION_MAPPING = {
  "principal": "principal",
  "main": "principal",
  "dashboard": "principal",
  "operacional": "operacional",
  "operational": "operacional",
  "admin": "admin",
  "administracao": "admin",
  "financeiro": "financeiro",
  "financial": "financeiro",
  "integracao": "integracao",
  "integration": "integracao",
  "default": "principal"
};
var constants_default = {
  VERSION,
  MODULE_ID,
  TRIGGER_PATTERNS,
  DEFAULT_REGION,
  SECTION_MAPPING
};
export {
  DEFAULT_REGION,
  MODULE_ID,
  SECTION_MAPPING,
  TRIGGER_PATTERNS,
  VERSION,
  constants_default as default
};
