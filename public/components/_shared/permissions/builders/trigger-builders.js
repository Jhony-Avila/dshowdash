import { validateId } from "../contracts.js";
const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "components._shared.permissions.builders.trigger-builders";
function buildNavigationItemTrigger(itemId) {
  if (!itemId || typeof itemId !== "string") {
    throw new Error("[trigger-builders] itemId must be a non-empty string");
  }
  const cleanId = itemId.replace(/^trigger:navigation:item[-:]/, "").replace(/^item[-:]/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const triggerId = `trigger:navigation:item-${cleanId}`;
  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${triggerId} - ${validation.error}`);
  }
  return triggerId;
}
function buildNavigationSectionTrigger(sectionId) {
  if (!sectionId || typeof sectionId !== "string") {
    throw new Error("[trigger-builders] sectionId must be a non-empty string");
  }
  const cleanId = sectionId.replace(/^trigger:navigation:section[-:]/, "").replace(/^section[-:]/, "").replace(/^sec-/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const triggerId = `trigger:navigation:section-${cleanId}`;
  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${triggerId} - ${validation.error}`);
  }
  return triggerId;
}
function buildTrigger(context, name) {
  if (!context || typeof context !== "string") {
    throw new Error("[trigger-builders] context must be a non-empty string");
  }
  if (!name || typeof name !== "string") {
    throw new Error("[trigger-builders] name must be a non-empty string");
  }
  const cleanContext = context.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const triggerId = `trigger:${cleanContext}:${cleanName}`;
  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${triggerId} - ${validation.error}`);
  }
  return triggerId;
}
function buildRegion(context, name) {
  if (!context || typeof context !== "string") {
    throw new Error("[trigger-builders] context must be a non-empty string");
  }
  if (!name || typeof name !== "string") {
    throw new Error("[trigger-builders] name must be a non-empty string");
  }
  const cleanContext = context.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const cleanName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const regionId = `region:${cleanContext}:${cleanName}`;
  const validation = validateId(regionId);
  if (!validation.valid) {
    throw new Error(`[trigger-builders] Generated invalid region ID: ${regionId} - ${validation.error}`);
  }
  return regionId;
}
function validateTrigger(triggerId) {
  return validateId(triggerId);
}
function isLegacyFormat(triggerId) {
  if (!triggerId || typeof triggerId !== "string") return false;
  return /^trigger:[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+$/.test(triggerId);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    pattern: "trigger:{context}:{name}",
    examples: {
      item: "trigger:navigation:item-home",
      section: "trigger:navigation:section-admin",
      region: "region:app:sidebar"
    },
    enforcement: "CONTRACT_VALIDATED",
    phase: "P1 - Active Enforcement",
    capabilities: [
      "buildNavigationItemTrigger",
      "buildNavigationSectionTrigger",
      "buildTrigger",
      "buildRegion",
      "validateTrigger",
      "isLegacyFormat"
    ],
    timestamp: Date.now()
  };
}
function healthCheck() {
  let testItem = null;
  let testSection = null;
  let testGeneric = null;
  let testRegion = null;
  try {
    testItem = buildNavigationItemTrigger("test");
    testSection = buildNavigationSectionTrigger("test");
    testGeneric = buildTrigger("ui", "action-test");
    testRegion = buildRegion("app", "test");
  } catch (e) {
    return {
      status: "UNHEALTHY",
      moduleId: MODULE_ID,
      version: VERSION,
      error: e.message,
      timestamp: Date.now()
    };
  }
  const checks = {
    itemBuilderWorking: testItem === "trigger:navigation:item-test",
    sectionBuilderWorking: testSection === "trigger:navigation:section-test",
    genericBuilderWorking: testGeneric === "trigger:ui:action-test",
    regionBuilderWorking: testRegion === "region:app:test",
    legacyDetectorWorking: isLegacyFormat("trigger:navigation:item:home") === true,
    validFormatNotLegacy: isLegacyFormat("trigger:navigation:item-home") === false,
    contractEnforced: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
var trigger_builders_default = {
  VERSION,
  MODULE_ID,
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildTrigger,
  buildRegion,
  validateTrigger,
  isLegacyFormat,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildRegion,
  buildTrigger,
  trigger_builders_default as default,
  healthCheck,
  info,
  isLegacyFormat,
  validateTrigger
};
