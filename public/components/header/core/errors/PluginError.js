import { BaseError } from "./BaseError.js";
const MODULE_ID = "header.core.errors.PluginError";
const VERSION = "1.1.0-ES6";
function PluginError(message, pluginId, context) {
  BaseError.call(this, message, "PLUGIN_ERROR", Object.assign({ pluginId }, context));
  this.name = "PluginError";
  this.pluginId = pluginId || "unknown";
}
PluginError.prototype = Object.create(BaseError.prototype);
PluginError.prototype.constructor = PluginError;
PluginError.invalidPlugin = (pluginId, reason) => new PluginError(`Plugin inv\xE1lido: ${reason}`, pluginId, { reason: "INVALID_PLUGIN", details: reason });
PluginError.alreadyRegistered = (pluginId) => new PluginError(`Plugin j\xE1 registrado: ${pluginId}`, pluginId, { reason: "ALREADY_REGISTERED" });
PluginError.notFound = (pluginId) => new PluginError(`Plugin n\xE3o encontrado: ${pluginId}`, pluginId, { reason: "NOT_FOUND" });
PluginError.initFailed = (pluginId, error) => new PluginError(`Falha ao inicializar plugin: ${error.message || error}`, pluginId, { reason: "INIT_FAILED", originalError: error.message || error });
PluginError.hookFailed = (pluginId, hookName, error) => new PluginError(`Falha no hook ${hookName} do plugin`, pluginId, { reason: "HOOK_FAILED", hookName, originalError: error.message || error });
var PluginError_default = PluginError;
export {
  MODULE_ID,
  PluginError,
  VERSION,
  PluginError_default as default
};
