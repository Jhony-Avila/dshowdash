import { log } from "./logger.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header.core.header-events.helpers.event-bus";
function safeOn(eb, eventName, handler) {
  if (!eb || typeof eb.on !== "function") return null;
  if (!eventName || typeof eventName !== "string") {
    log("warn", "Skipping EventBus.on - invalid eventName", { eventName });
    return null;
  }
  try {
    return eb.on(eventName, handler);
  } catch (e) {
    log("warn", "EventBus.on failed", { eventName, error: e.message });
    return null;
  }
}
export {
  MODULE_ID,
  VERSION,
  safeOn
};
