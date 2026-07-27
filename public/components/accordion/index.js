import {
  VERSION,
  MODULE_ID,
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
} from "./domain/accordion.contracts.js";
import {
  VERSION as VERSION2,
  MODULE_ID as MODULE_ID2,
  AccordionStateManager,
  createAccordionStateManager
} from "./domain/accordion.state.js";
import {
  VERSION as VERSION3,
  MODULE_ID as MODULE_ID3,
  ACCORDION_INTENTS,
  ACCORDION_EVENTS,
  AccordionController,
  createAccordionController
} from "./domain/accordion.controller.js";
import {
  VERSION as VERSION4,
  MODULE_ID as MODULE_ID4,
  AccordionView,
  createAccordionView
} from "./ui/accordion.view.js";
import {
  VERSION as VERSION5,
  MODULE_ID as MODULE_ID5,
  LocalStoragePersistenceAdapter,
  NullPersistenceAdapter,
  createLocalStoragePersistence,
  createNullPersistence
} from "./persistence/accordion.persistence.js";
import {
  VERSION as VERSION6,
  MODULE_ID as MODULE_ID6,
  AccordionTelemetry,
  createAccordionTelemetry
} from "./telemetry/accordion.telemetry.js";
import {
  VERSION as VERSION7,
  MODULE_ID as MODULE_ID7,
  MOCK_SECTIONS,
  MOCK_MODEL,
  getMockModel,
  getMockSections,
  getMockSection,
  getMockItem,
  getMinimalMockModel,
  getEmptyMockModel
} from "./mock/accordion.mock.js";
import { VERSION as VERSION8, MODULE_ID as MODULE_ID8 } from "./module/constants.js";
import { injectStyles } from "./module/style-injector.js";
import { injectPorts, getPorts } from "./module/ports-manager.js";
import {
  createAccordion,
  createAccordionWithMock,
  mountAccordion,
  mountAccordionWithMock
} from "./module/factory.js";
import {
  getAccordion,
  getAccordionView,
  getAccordionTelemetry,
  destroyAccordion
} from "./module/accessors.js";
import {
  getMetrics,
  healthCheck,
  info,
  audit
} from "./module/diagnostics.js";
import { setupWindowAPI } from "./module/window-api.js";
setupWindowAPI();
import { VERSION as VERSION9, MODULE_ID as MODULE_ID9 } from "./module/constants.js";
import { injectStyles as injectStyles2 } from "./module/style-injector.js";
import { injectPorts as injectPorts2, getPorts as getPorts2 } from "./module/ports-manager.js";
import { createAccordion as createAccordion2, createAccordionWithMock as createAccordionWithMock2, mountAccordion as mountAccordion2, mountAccordionWithMock as mountAccordionWithMock2 } from "./module/factory.js";
import { getAccordion as getAccordion2, getAccordionView as getAccordionView2, getAccordionTelemetry as getAccordionTelemetry2, destroyAccordion as destroyAccordion2 } from "./module/accessors.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2, audit as audit2 } from "./module/diagnostics.js";
var accordion_default = {
  VERSION: VERSION9,
  MODULE_ID: MODULE_ID9,
  createAccordion: createAccordion2,
  createAccordionWithMock: createAccordionWithMock2,
  mountAccordion: mountAccordion2,
  mountAccordionWithMock: mountAccordionWithMock2,
  getAccordion: getAccordion2,
  getAccordionView: getAccordionView2,
  getAccordionTelemetry: getAccordionTelemetry2,
  destroyAccordion: destroyAccordion2,
  healthCheck: healthCheck2,
  info: info2,
  audit: audit2,
  getMetrics: getMetrics2,
  injectPorts: injectPorts2,
  getPorts: getPorts2,
  injectStyles: injectStyles2
};
export {
  ACCORDION_EVENTS,
  ACCORDION_INTENTS,
  ACCORDION_MODE,
  AccordionController,
  AccordionStateContract,
  AccordionStateManager,
  AccordionTelemetry,
  AccordionView,
  ActionContract,
  BadgeContract,
  MODULE_ID as CONTRACTS_MODULE_ID,
  VERSION as CONTRACTS_VERSION,
  MODULE_ID3 as CONTROLLER_MODULE_ID,
  VERSION3 as CONTROLLER_VERSION,
  DATA_SOURCE,
  ITEM_ACTION_TYPE,
  ItemContract,
  LOADING_STATE,
  LocalStoragePersistenceAdapter,
  MOCK_MODEL,
  MODULE_ID7 as MOCK_MODULE_ID,
  MOCK_SECTIONS,
  VERSION7 as MOCK_VERSION,
  MODULE_ID8 as MODULE_ID,
  ModelContract,
  NullPersistenceAdapter,
  MODULE_ID5 as PERSISTENCE_MODULE_ID,
  VERSION5 as PERSISTENCE_VERSION,
  PersistenceContract,
  SCHEMA_ID,
  SCHEMA_VERSION,
  MODULE_ID2 as STATE_MODULE_ID,
  VERSION2 as STATE_VERSION,
  SectionContract,
  MODULE_ID6 as TELEMETRY_MODULE_ID,
  VERSION6 as TELEMETRY_VERSION,
  UARPS_ENFORCEMENT,
  VERSION8 as VERSION,
  MODULE_ID4 as VIEW_MODULE_ID,
  VERSION4 as VIEW_VERSION,
  VISIBILITY_MODE,
  VisibilityPolicyContract,
  audit,
  createAccordion,
  createAccordionController,
  createAccordionState,
  createAccordionStateManager,
  createAccordionTelemetry,
  createAccordionView,
  createAccordionWithMock,
  createItem,
  createLocalStoragePersistence,
  createModel,
  createNullPersistence,
  createSection,
  createVisibilityPolicy,
  accordion_default as default,
  deserializeState,
  destroyAccordion,
  getAccordion,
  getAccordionTelemetry,
  getAccordionView,
  getEmptyMockModel,
  getMetrics,
  getMinimalMockModel,
  getMockItem,
  getMockModel,
  getMockSection,
  getMockSections,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  injectStyles,
  mountAccordion,
  mountAccordionWithMock,
  serializeState,
  validateItem,
  validateModel,
  validateSection
};
