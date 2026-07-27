// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.domain.intent-handlers
// PURPOSE: Intent handlers for accordion actions
// ───────────────────────────────────────────────────────────────
// @contract CREATE_INTENT_HANDLERS - createIntentHandlers(deps) factory
// @contract HANDLE_TOGGLE_SECTION - Toggle section handler
// @contract HANDLE_EXPAND_SECTION - Expand section handler
// @contract HANDLE_COLLAPSE_SECTION - Collapse section handler
// @contract HANDLE_SELECT_ITEM - Select item handler
// @contract HANDLE_NAVIGATE - Navigation handler
// @contract HANDLE_SET_MODE - Set mode handler
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: ACCORDION_INTENTS, ACCORDION_EVENTS from ./accordion.constants.js
// IMPORTS: checkPermission, findItemById, findSectionById from ./accordion.permissions.js
// PROVIDES: createIntentHandlers, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.0.0-ENTERPRISE: Initial intent handlers
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ACCORDION_INTENTS, ACCORDION_EVENTS } from './accordion.constants.js';
import { checkPermission, findItemById, findSectionById } from './accordion.permissions.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.domain.intent-handlers';

export function createIntentHandlers(deps: { stateManager: any; structure: unknown; permissionsPort: unknown; metrics: Record<string, number>; emit: (event: string, data: Record<string, unknown>) => void }) {
  const { stateManager, structure, permissionsPort, metrics, emit } = deps;

  const getStructure = () => typeof structure === 'function' ? structure() : structure;

  const handleToggleSection = (payload: { sectionId?: string }) => {
    metrics.intentsReceived++;
    const { sectionId } = payload;
    if (!sectionId) return;

    const section = findSectionById(getStructure(), sectionId);
    if (!section) {
      metrics.errors++;
      return;
    }

    // @ts-expect-error strict migration — TS2345
    if (!checkPermission(section, permissionsPort)) {
      metrics.intentsBlocked++;
      emit(ACCORDION_EVENTS.ITEM_BLOCKED, { sectionId, reason: 'permission_denied' });
      emit(ACCORDION_INTENTS.ATTEMPT_BLOCKED, { sectionId, type: 'section' });
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

  const handleExpandSection = (payload: { sectionId?: string }) => {
    metrics.intentsReceived++;
    const { sectionId } = payload;
    if (!sectionId) return;

    metrics.intentsProcessed++;
    const result = stateManager.expandSection(sectionId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.SECTION_TOGGLED, { sectionId, expanded: true });
    }
  };

  const handleCollapseSection = (payload: { sectionId?: string }) => {
    metrics.intentsReceived++;
    const { sectionId } = payload;
    if (!sectionId) return;

    metrics.intentsProcessed++;
    const result = stateManager.collapseSection(sectionId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.SECTION_TOGGLED, { sectionId, expanded: false });
    }
  };

  const handleSelectItem = (payload: { itemId?: string; item?: Record<string, unknown> }) => {
    metrics.intentsReceived++;
    const { itemId, item } = payload;
    if (!itemId) return;

    const resolvedItem = item ?? findItemById(getStructure(), itemId);
    if (!resolvedItem) {
      metrics.errors++;
      return;
    }

    // @ts-expect-error strict migration — TS2345
    if (!checkPermission(resolvedItem, permissionsPort)) {
      metrics.intentsBlocked++;
      emit(ACCORDION_EVENTS.ITEM_BLOCKED, { itemId, reason: 'permission_denied' });
      emit(ACCORDION_INTENTS.ATTEMPT_BLOCKED, { itemId, type: 'item' });
      return;
    }

    metrics.intentsProcessed++;
    const result = stateManager.setActiveItem(itemId);
    if (result.changed) {
      emit(ACCORDION_EVENTS.ITEM_SELECTED, { itemId, item: resolvedItem });
    }
  };

  const handleNavigate = (payload: { itemId?: string }) => {
    const { itemId } = payload;
    if (itemId) {
      handleSelectItem({ itemId });
    }
  };

  const handleSetMode = (payload: { mode?: string }) => {
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

export function healthCheck() {
  const checks = {
    factoryAvailable: typeof createIntentHandlers === 'function'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    handlers: [
      'handleToggleSection',
      'handleExpandSection',
      'handleCollapseSection',
      'handleSelectItem',
      'handleNavigate',
      'handleSetMode'
    ],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  createIntentHandlers,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
