const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home.domain.contextual-message";
import { buildContext } from "./context-builder.js";
import { parsePlaceholders, requiresUserName, listPlaceholders } from "./placeholder-parser.js";
import { resolve, resolveFallback, clearHistory, getStats } from "./resolver.js";
import resolver from "./resolver.js";
var contextual_message_default = resolver;
export {
  MODULE_ID,
  VERSION,
  buildContext,
  clearHistory,
  contextual_message_default as default,
  getStats,
  listPlaceholders,
  parsePlaceholders,
  requiresUserName,
  resolve,
  resolveFallback
};
