import { VERSION, MODULE_ID, STYLE_PATHS } from "./constants.js";
import { injectStyles, isStylesInjected } from "./style-injector.js";
import { initPorts, injectPorts, getPorts, getPort, isPortsInitialized } from "./ports-manager.js";
export * from "./singleton-state.js";
import { createAccordion, createAccordionWithMock, mountAccordion, mountAccordionWithMock } from "./factory.js";
import { getAccordion, getAccordionView, getAccordionTelemetry, destroyAccordion } from "./accessors.js";
import { getMetrics, healthCheck, info, audit } from "./diagnostics.js";
import { setupWindowAPI } from "./window-api.js";
export {
  MODULE_ID,
  STYLE_PATHS,
  VERSION,
  audit,
  createAccordion,
  createAccordionWithMock,
  destroyAccordion,
  getAccordion,
  getAccordionTelemetry,
  getAccordionView,
  getMetrics,
  getPort,
  getPorts,
  healthCheck,
  info,
  initPorts,
  injectPorts,
  injectStyles,
  isPortsInitialized,
  isStylesInjected,
  mountAccordion,
  mountAccordionWithMock,
  setupWindowAPI
};
