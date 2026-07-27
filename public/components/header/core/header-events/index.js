import { HEADER_EVENTS, HEADER_INTENTS } from "/core/runtime/events/catalog/header.events.js";
import { AUTH_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
import { BOOT_EVENTS } from "/core/runtime/events/catalog/boot.events.js";
import { VERSION, MODULE_ID } from "./constants.js";
import { injectPorts, getPorts } from "./ports.js";
import { HeaderEvents } from "./header-events-class.js";
function getVersion() {
  const { VERSION: VERSION2 } = require("./constants.js");
  return VERSION2;
}
import { HeaderEvents as HeaderEvents2 } from "./header-events-class.js";
export {
  AUTH_EVENTS,
  BOOT_EVENTS,
  HEADER_EVENTS,
  HEADER_INTENTS,
  HeaderEvents,
  MODULE_ID,
  VERSION,
  HeaderEvents2 as default,
  getPorts,
  getVersion,
  injectPorts
};
