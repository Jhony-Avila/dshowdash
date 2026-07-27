const VERSION = "2.0.0-MODULAR";
const MODULE_ID = "container-main:async-helpers:constants";
const DEFAULT_TIMEOUTS = Object.freeze({
  SHORT: 5e3,
  // 5s - operações rápidas
  MEDIUM: 15e3,
  // 15s - operações normais
  LONG: 3e4,
  // 30s - operações longas
  VERY_LONG: 6e4,
  // 60s - operações muito longas
  FETCH: 1e4,
  // 10s - fetch padrão
  API: 2e4,
  // 20s - chamadas de API
  UPLOAD: 12e4,
  // 2min - uploads
  DOWNLOAD: 18e4
  // 3min - downloads
});
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    timeouts: Object.keys(DEFAULT_TIMEOUTS)
  };
}
var constants_default = {
  VERSION,
  MODULE_ID,
  DEFAULT_TIMEOUTS,
  info
};
export {
  DEFAULT_TIMEOUTS,
  MODULE_ID,
  VERSION,
  constants_default as default,
  info
};
