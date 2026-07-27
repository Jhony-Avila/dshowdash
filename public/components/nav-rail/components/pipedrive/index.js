import { createButtonExports } from "../_shared/button-factory.js";
const buttonExports = createButtonExports("pipedrive");
const VERSION = buttonExports.VERSION;
const MODULE_ID = buttonExports.MODULE_ID;
const getInstance = buttonExports.getInstance;
const createPipedriveButton = buttonExports.createButton;
const init = buttonExports.init;
const mount = buttonExports.mount;
const unmount = buttonExports.unmount;
const healthCheck = buttonExports.healthCheck;
const info = buttonExports.info;
const getElement = buttonExports.getElement;
const isMounted = buttonExports.isMounted;
const getId = buttonExports.getId;
const BUTTON_CONFIG = buttonExports.BUTTON_CONFIG;
const ACTION_PAYLOAD = buttonExports.ACTION_PAYLOAD;
const EMITTED_EVENTS = buttonExports.EMITTED_EVENTS;
var pipedrive_default = {
  PipedriveButton: buttonExports.getInstance,
  getInstance: buttonExports.getInstance,
  createPipedriveButton: buttonExports.createButton,
  init: buttonExports.init,
  mount: buttonExports.mount,
  unmount: buttonExports.unmount,
  healthCheck: buttonExports.healthCheck,
  info: buttonExports.info,
  VERSION: buttonExports.VERSION,
  MODULE_ID: buttonExports.MODULE_ID
};
export {
  ACTION_PAYLOAD,
  BUTTON_CONFIG,
  EMITTED_EVENTS,
  MODULE_ID,
  VERSION,
  createPipedriveButton,
  pipedrive_default as default,
  getElement,
  getId,
  getInstance,
  healthCheck,
  info,
  init,
  isMounted,
  mount,
  unmount
};
