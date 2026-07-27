// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion
// PURPOSE: Barrel export for Accordion component (main entry point)
// ───────────────────────────────────────────────────────────────
// @contract DOMAIN_EXPORTS - Contracts, state, controller from domain
// @contract UI_EXPORTS - AccordionView and factory from ui
// @contract PERSISTENCE_EXPORTS - Storage adapters from persistence
// @contract TELEMETRY_EXPORTS - AccordionTelemetry from telemetry
// @contract MOCK_EXPORTS - Mock data for development from mock
// @contract MODULE_EXPORTS - Factory, accessors, diagnostics from module
// @contract WINDOW_API - setupWindowAPI() initialization
// @contract HEALTH - healthCheck(), info(), audit() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: domain/accordion.contracts, domain/accordion.state,
//          domain/accordion.controller, ui/accordion.view,
//          persistence/accordion.persistence, telemetry/accordion.telemetry,
//          mock/accordion.mock, module/* (constants, style-injector,
//          ports-manager, factory, accessors, diagnostics, window-api)
// PROVIDES: All exports from submodules, VERSION, MODULE_ID,
//           createAccordion, mountAccordion, healthCheck, info, audit
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Refactored for modular architecture
// @changelog v1.0.0-ENTERPRISE: Initial enterprise barrel export
// ═══════════════════════════════════════════════════════════════
'use strict';

// ═══════════════════════════════════════════════════════════════
// DOMAIN EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  VERSION as CONTRACTS_VERSION,
  MODULE_ID as CONTRACTS_MODULE_ID,
  SCHEMA_VERSION,
  SCHEMA_ID,
  ACCORDION_MODE,
  ITEM_ACTION_TYPE,
  VISIBILITY_MODE,
  DATA_SOURCE,
  LOADING_STATE,
  UARPS_ENFORCEMENT,
  SectionContract,
  ItemContract,
  VisibilityPolicyContract,
  BadgeContract,
  ActionContract,
  AccordionStateContract,
  PersistenceContract,
  ModelContract,
  createSection,
  createItem,
  createVisibilityPolicy,
  createAccordionState,
  createModel,
  validateSection,
  validateItem,
  validateModel,
  serializeState,
  deserializeState
} from './domain/accordion.contracts.js';

export {
  VERSION as STATE_VERSION,
  MODULE_ID as STATE_MODULE_ID,
  AccordionStateManager,
  createAccordionStateManager
} from './domain/accordion.state.js';

export {
  VERSION as CONTROLLER_VERSION,
  MODULE_ID as CONTROLLER_MODULE_ID,
  ACCORDION_INTENTS,
  ACCORDION_EVENTS,
  AccordionController,
  createAccordionController
} from './domain/accordion.controller.js';

// ═══════════════════════════════════════════════════════════════
// UI EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  VERSION as VIEW_VERSION,
  MODULE_ID as VIEW_MODULE_ID,
  AccordionView,
  createAccordionView
} from './ui/accordion.view.js';

// ═══════════════════════════════════════════════════════════════
// PERSISTENCE EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  VERSION as PERSISTENCE_VERSION,
  MODULE_ID as PERSISTENCE_MODULE_ID,
  LocalStoragePersistenceAdapter,
  NullPersistenceAdapter,
  createLocalStoragePersistence,
  createNullPersistence
} from './persistence/accordion.persistence.js';

// ═══════════════════════════════════════════════════════════════
// TELEMETRY EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  VERSION as TELEMETRY_VERSION,
  MODULE_ID as TELEMETRY_MODULE_ID,
  AccordionTelemetry,
  createAccordionTelemetry
} from './telemetry/accordion.telemetry.js';

// ═══════════════════════════════════════════════════════════════
// MOCK EXPORTS (Development)
// ═══════════════════════════════════════════════════════════════

export {
  VERSION as MOCK_VERSION,
  MODULE_ID as MOCK_MODULE_ID,
  MOCK_SECTIONS,
  MOCK_MODEL,
  getMockModel,
  getMockSections,
  getMockSection,
  getMockItem,
  getMinimalMockModel,
  getEmptyMockModel
} from './mock/accordion.mock.js';

// ═══════════════════════════════════════════════════════════════
// MODULE EXPORTS (Modular Architecture)
// ═══════════════════════════════════════════════════════════════

export { VERSION, MODULE_ID } from './module/constants.js';
export { injectStyles } from './module/style-injector.js';
export { injectPorts, getPorts } from './module/ports-manager.js';
export {
  createAccordion,
  createAccordionWithMock,
  mountAccordion,
  mountAccordionWithMock
} from './module/factory.js';
export {
  getAccordion,
  getAccordionView,
  getAccordionTelemetry,
  destroyAccordion
} from './module/accessors.js';
export {
  getMetrics,
  healthCheck,
  info,
  audit
} from './module/diagnostics.js';

// ═══════════════════════════════════════════════════════════════
// WINDOW API SETUP
// ═══════════════════════════════════════════════════════════════

import { setupWindowAPI } from './module/window-api.js';
setupWindowAPI();

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

import { VERSION, MODULE_ID } from './module/constants.js';
import { injectStyles } from './module/style-injector.js';
import { injectPorts, getPorts } from './module/ports-manager.js';
import { createAccordion, createAccordionWithMock, mountAccordion, mountAccordionWithMock } from './module/factory.js';
import { getAccordion, getAccordionView, getAccordionTelemetry, destroyAccordion } from './module/accessors.js';
import { getMetrics, healthCheck, info, audit } from './module/diagnostics.js';

export default {
  VERSION,
  MODULE_ID,
  createAccordion,
  createAccordionWithMock,
  mountAccordion,
  mountAccordionWithMock,
  getAccordion,
  getAccordionView,
  getAccordionTelemetry,
  destroyAccordion,
  healthCheck,
  info,
  audit,
  getMetrics,
  injectPorts,
  getPorts,
  injectStyles
};
