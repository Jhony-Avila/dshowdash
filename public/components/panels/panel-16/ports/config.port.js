const MODULE_ID = "panel-16.ports.config.port";
const VERSION = "9.3.0-P2-ENTERPRISE";
let configInstance = null;
function setConfig(config) {
  configInstance = config;
}
function getConfig() {
  return configInstance;
}
function getConfigValue(key, defaultValue = null) {
  if (!configInstance) return defaultValue;
  return configInstance[key] ?? defaultValue;
}
var config_port_default = { setConfig, getConfig, getConfigValue };
const ConfigPort = { setConfig, getConfig, getConfigValue };
export {
  ConfigPort,
  MODULE_ID,
  VERSION,
  config_port_default as default,
  getConfig,
  getConfigValue,
  setConfig
};
