import { SLOT_POSITIONS } from "../constants.js";
import { registerSlot } from "../core/registration.js";
import { injectContent } from "../core/content.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-slots.convenience.shortcuts";
function inject(regionName, content, config) {
  const slotId = registerSlot(regionName, config);
  if (slotId) {
    injectContent(regionName, slotId, content);
  }
  return slotId;
}
function createPersistentSlot(regionName, position, content) {
  return inject(regionName, content, {
    name: position,
    position: position === "header" ? SLOT_POSITIONS.PREPEND : SLOT_POSITIONS.APPEND,
    priority: position === "header" ? 1e3 : -1e3,
    persistent: true
  });
}
var shortcuts_default = {
  inject,
  createPersistentSlot
};
export {
  MODULE_ID,
  VERSION,
  createPersistentSlot,
  shortcuts_default as default,
  inject
};
