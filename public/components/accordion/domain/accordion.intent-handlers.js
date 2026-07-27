import { ACCORDION_INTENTS, ACCORDION_EVENTS } from "./accordion.constants.js";
import { checkPermission, findItemById, findSectionById } from "./accordion.permissions.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.domain.intent-handlers";
function createIntentHandlers(deps) {
  const { stateManager, structure, permissionsPort, metrics, emit } = deps;
  const getStructure = () => typeof structure === "function" ? structure() : structure;
  const handleToggleSection = (payload) => {
    metrics.intentsReceived++;
    const { sectionId } = payload;
    if (!sectionId) return;
    const section = findSectionById(getStructure(), sectionId);
    if (!section) {
      metrics.errors++;
      return;
    }
    if (!checkPermission(section, permissionsPort)) {
      metrics.intentsBlocked++;
      emit(ACCORDION_EVENTS.ITEM_BLOCKED, { sectionId, reason: "permission_denied" });
      emit(ACCORDION_INTENTS.ATTEMPT_BLOCKED, { sectionId, type: "section" });
      return;
    }
    metrics.intentsProcessed++;
    const result = stateManager.toggleSection(sectionId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.SECTION_TOGGLED, {
        sectionId,
        expanded: result.expanded,
        section
      });
    }
  };
  const handleExpandSection = (payload) => {
    metrics.intentsReceived++;
    const { sectionId } = payload;
    if (!sectionId) return;
    metrics.intentsProcessed++;
    const result = stateManager.expandSection(sectionId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.SECTION_TOGGLED, { sectionId, expanded: true });
    }
  };
  const handleCollapseSection = (payload) => {
    metrics.intentsReceived++;
    const { sectionId } = payload;
    if (!sectionId) return;
    metrics.intentsProcessed++;
    const result = stateManager.collapseSection(sectionId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.SECTION_TOGGLED, { sectionId, expanded: false });
    }
  };
  const handleSelectItem = (payload) => {
    metrics.intentsReceived++;
    const { itemId, item } = payload;
    if (!itemId) return;
    const resolvedItem = item ?? findItemById(getStructure(), itemId);
    if (!resolvedItem) {
      metrics.errors++;
      return;
    }
    if (!checkPermission(resolvedItem, permissionsPort)) {
      metrics.intentsBlocked++;
      emit(ACCORDION_EVENTS.ITEM_BLOCKED, { itemId, reason: "permission_denied" });
      emit(ACCORDION_INTENTS.ATTEMPT_BLOCKED, { itemId, type: "item" });
      return;
    }
    metrics.intentsProcessed++;
    const result = stateManager.setActiveItem(itemId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.ITEM_SELECTED, { itemId, item: resolvedItem });
    }
  };
  const handleNavigate = (payload) => {
    const { itemId } = payload;
    if (itemId) {
      handleSelectItem({ itemId });
    }
  };
  const handleSetMode = (payload) => {
    metrics.intentsReceived++;
    const { mode } = payload;
    metrics.intentsProcessed++;
    stateManager.setMode(mode);
  };
  return {
    handleToggleSection,
    handleExpandSection,
    handleCollapseSection,
    handleSelectItem,
    handleNavigate,
    handleSetMode
  };
}
function healthCheck() {
  const checks = {
    factoryAvailable: typeof createIntentHandlers === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    handlers: [
      "handleToggleSection",
      "handleExpandSection",
      "handleCollapseSection",
      "handleSelectItem",
      "handleNavigate",
      "handleSetMode"
    ],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var accordion_intent_handlers_default = {
  createIntentHandlers,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createIntentHandlers,
  accordion_intent_handlers_default as default,
  healthCheck,
  info
};
